import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {db,HttpError} from './core.mjs';
import {draftService,draftView} from './personalization-drafts.mjs';
import {videoStore,hash} from './video-personalise-store.mjs';
import {videoService,loadVideoMaster} from './video-personalise.mjs';
import {videoPaymentService} from './video-payments.mjs';
import {replicateProvider,CHARACTER_MODEL,CHARACTER_PROMPT_REVISION,characterPrompt,characterInput} from './video-character-provider.mjs';
import {alignCharacter} from './video-character-images.mjs';
const table='video_character_jobs',active=['queued','submitting','processing','preparing'];
export const CHARACTER_STALL_MS=10*60*1000;
const jsonEqual=(a,b)=>JSON.stringify(Object.entries(a||{}).sort())===JSON.stringify(Object.entries(b||{}).sort());
const referenceSignature=refs=>refs.map(({sha256,identity})=>({sha256,identity}));
export function characterJobView(j){return {id:j.id,slot:j.slot,kind:j.kind,status:j.status,approved:j.approved_current,mediaId:j.output_media_id,error:j.error,createdAt:j.created_at,basis:j.basis};}
export function characterService({query=db,store=videoStore(),provider=replicateProvider(),align=alignCharacter,env=process.env,clock=()=>Date.now()}={}){
 const one=async(path,options)=>(await query(path,options))?.[0]||null;
 const patch=(id,body,filter='',progress=true)=>one(table+'?id=eq.'+id+filter,{method:'PATCH',headers:{Prefer:'return=representation'},body:{...body,...(progress?{updated_at:new Date(clock()).toISOString()}:{})}});
 const drafts=draftService({query,store});
 async function owned(owner,id){if(!/^[a-f0-9-]{36}$/.test(id||''))throw new HttpError(404,'Character not found.');const j=await one(table+'?id=eq.'+id+'&owner_id=eq.'+owner);if(!j)throw new HttpError(404,'Character not found.');await drafts.get(owner,j.invitation_id);return j;}
 async function list(owner,id){await drafts.get(owner,id);const jobs=await query(table+'?invitation_id=eq.'+id+'&owner_id=eq.'+owner+'&order=created_at.asc');const basis=Object.fromEntries(jobs.filter(j=>j.approved_current&&j.slot!=='couple').map(j=>[j.slot,j.id]));return {jobs:jobs.map(characterJobView),allowances:Object.fromEntries(['groom','bride','couple'].map(slot=>[slot,{initialUsed:jobs.some(j=>j.slot===slot&&['review','approved'].includes(j.status)),redoUsed:jobs.some(j=>j.slot===slot&&j.kind==='redo'&&['review','approved'].includes(j.status))}])),coupleNeedsUpdate:(()=>{const latest=jobs.filter(j=>j.slot==='couple'&&['review','approved'].includes(j.status)).at(-1);return !!latest&&!jsonEqual(latest.basis,basis);})()};}
 async function original(slot){const m=await loadVideoMaster('temple-v1'),a=m.assets[slot==='couple'?'closing':slot],bytes=await readFile('public'+a.path);if(hash(bytes)!==a.sha256)throw Error('Original character checksum mismatch');return bytes;}
 async function submit(owner,b){
  const d=await drafts.get(owner,b.invitationId);if(d.template_id!=='temple-v1')throw new HttpError(400,'This template does not support matching characters yet.');await videoPaymentService().requireAccess(owner,d.id,d.template_id);
  const slot=b.slot;if(!['groom','bride','couple'].includes(slot))throw new HttpError(400,'Choose a character.');
  const jobs=await query(table+'?invitation_id=eq.'+d.id+'&owner_id=eq.'+owner+'&order=created_at.desc');let references=[],basis={};
  if(slot==='couple'){
   for(const individual of ['groom','bride']){const j=jobs.find(j=>j.slot===individual&&j.approved_current);if(!j)throw new HttpError(409,'Approve the groom and bride first.');basis[individual]=j.id;const media=await videoService({store}).media(owner,j.output_media_id);references.push({id:media.id,sha256:media.sha256,identity:individual});}
  }else{
   const ref=b.reference;if(!ref||!['single','left','right','auto'].includes(ref.identity))throw new HttpError(400,'Add a photo to continue.');
   await drafts.pinMedia(owner,d.id,ref.id);const m=await videoService({store}).media(owner,ref.id);if(m.kind!=='image'||m.status!=='ready'||m.characterJobId)throw new HttpError(400,'Upload a reference photo first.');references=[{id:m.id,sha256:m.sha256,identity:ref.identity}];
  }
  const completed=jobs.filter(j=>j.slot===slot&&['review','approved'].includes(j.status));let kind='initial';
  if(completed.length){if(slot==='couple'&&!completed.some(j=>jsonEqual(j.basis,basis)))kind='dependent';else if(b.redo===true)kind='redo';else {const last=slot==='couple'?completed.find(j=>jsonEqual(j.basis,basis)):completed[0];if(slot==='couple'||jsonEqual(referenceSignature(last.reference_data),referenceSignature(references)))return last;throw new HttpError(409,'Use your included redo to change the reference photo.');}}
  const key=hash({slot,kind,references:referenceSignature(references),basis,model:CHARACTER_MODEL,prompt:CHARACTER_PROMPT_REVISION,original:hash(await original(slot))});
  const r=await query('rpc/fmi_claim_video_character',{method:'POST',body:{p_owner:owner,p_invitation:d.id,p_slot:slot,p_kind:kind,p_key:key,p_model:CHARACTER_MODEL,p_prompt:CHARACTER_PROMPT_REVISION,p_refs:references,p_basis:basis}});return Array.isArray(r)?r[0]:r;
 }
 async function persistBytes(key,bytes,type){try{await store.putBytes(key,bytes,type);}catch(e){const old=await store.bytes(key).catch(()=>null);if(!old||hash(old)!==hash(bytes))throw e;}}
 async function process(id){
  if(!/^[a-f0-9-]{36}$/.test(id||''))return;
  let j=await one(table+'?id=eq.'+id);if(!j||!active.includes(j.status))return;
  await drafts.get(j.owner_id,j.invitation_id);const lease=randomUUID(),now=new Date(clock()).toISOString();j=await patch(id,{lease_id:lease,lease_until:new Date(clock()+300000).toISOString()},'&status=in.(queued,submitting,processing,preparing)&or=(lease_until.is.null,lease_until.lt.'+encodeURIComponent(now)+')',false);if(!j)return;
  // Polling and lease renewal are not progress: otherwise outages reset the
  // deadline every four seconds and leave the customer waiting indefinitely.
  const stalled=()=>clock()-Date.parse(j.updated_at||j.created_at)>=CHARACTER_STALL_MS;
  const finish=body=>patch(id,{...body,lease_id:null,lease_until:null},'&lease_id=eq.'+lease,!!body.status&&body.status!==j.status);
  let stage='provider';
  try{
   let prediction;
   if(j.status==='queued'){
    if(j.attempts>=3){await finish({status:'failed',error:'Automatic retries are exhausted. Contact support; your photos, payment and redo allowance are saved.'});return;}
    stage='references';
    const images=['data:image/png;base64,'+(await original(j.slot)).toString('base64')];for(const ref of j.reference_data){const m=await videoService({store}).media(j.owner_id,ref.id),bytes=await store.bytes(m.key);if(hash(bytes)!==ref.sha256)throw Error('A saved reference changed.');images.push('data:'+m.contentType+';base64,'+bytes.toString('base64'));}
    j=await patch(id,{status:'submitting',attempts:j.attempts+1},'&lease_id=eq.'+lease);const input=characterInput(characterPrompt(j.slot,j.reference_data[0]?.identity,j.id+'-'+j.attempts,j.prompt_revision),images);
    stage='submit';try{prediction=await provider.create(input,'https://findmyinvite.com/api/video-characters?action=callback&id='+j.id);}
    catch(e){if(e.providerStatus&&e.providerStatus<500){await finish({status:'failed',error:'Character preparation could not start. No redo was used. Please retry.'});}else await finish({status:'submitting',error:'Confirming the generation request. Your allowance is safe.'});return;}
    j=await patch(id,{provider_id:prediction.id,status:'processing',model_version:typeof prediction.version==='string'?prediction.version:null,error:null},'&lease_id=eq.'+lease);
   }else if(j.status==='submitting'&&!j.provider_id){
    const recent=await provider.recent();prediction=recent.results?.find(p=>p.input?.prompt?.includes('Tracking reference '+j.id+'-'+j.attempts));
    if(!prediction){await finish(stalled()?{status:'failed',error:'The provider could not confirm this request. Contact support before retrying; no redo was used.'}:{error:'Waiting for the provider to confirm the request.'});return;}
    j=await patch(id,{provider_id:prediction.id,status:'processing'},'&lease_id=eq.'+lease);
   }else if(j.provider_id&&!j.raw_key)prediction=await provider.get(j.provider_id);
   if(prediction?.status==='failed'||prediction?.status==='canceled'){
    await finish({status:j.attempts<2?'queued':'failed',provider_id:null,error:j.attempts<2?'A technical attempt failed. Retrying without using a redo.':'Character preparation failed. No redo was used. Please retry.'});return;
   }
   // Sync responses can include complete file outputs while status is still
   // "processing". Save those bytes now, before the provider retention expires.
   const output=Array.isArray(prediction?.output)?prediction.output[0]:prediction?.output;
   if(!j.raw_key&&typeof output!=='string'){await finish(stalled()?{status:'failed',error:'Character creation is taking too long. Retry to check the existing attempt. Your photos and payment are saved; no redo was used.'}:{status:'processing'});return;}
   stage='download';
   let bytes;if(j.raw_key)bytes=await store.bytes(j.raw_key);else{
    // Keep the provider's output locator privately so support can recover a
    // completed prediction even if the subsequent transfer is interrupted.
    // Never include input photos, prompts or provider credentials here.
    await store.save('persistent/'+j.owner_id+'/'+j.invitation_id+'/characters/'+j.id+'/prediction-'+j.attempts+'.json',{id:prediction.id,status:prediction.status,output,savedAt:new Date(clock()).toISOString()});
    bytes=await provider.output(output);
    stage='persist';
    const raw='persistent/'+j.owner_id+'/'+j.invitation_id+'/characters/'+j.id+'/provider-'+j.attempts+'.png';await persistBytes(raw,bytes,'image/png');j=await patch(id,{status:'preparing',raw_key:raw},'&lease_id=eq.'+lease);
   }
   stage='prepare';const result=await align(bytes,await original(j.slot)),key='persistent/'+j.owner_id+'/'+j.invitation_id+'/characters/'+j.id+'/prepared.png';await persistBytes(key,result.bytes,'image/png');
   await store.save('media/'+j.id+'.json',{id:j.id,owner:j.owner_id,invitationId:j.invitation_id,kind:'image',status:'ready',key,sha256:hash(result.bytes),contentType:'image/png',bytes:result.bytes.length,durable:true,expiresAt:null,characterJobId:j.id,characterSlot:j.slot,alignment:result.alignment});
   await finish({status:'review',output_media_id:j.id,error:null});
  }catch(e){console.error('Character preparation step failed',id,{stage,name:e.name,providerStatus:e.providerStatus||null});await finish(j.raw_key?{status:'failed',error:'Your generated image is saved, but preparation was interrupted. Retry to finish it; no redo is needed.'}:j.status==='submitting'&&!j.provider_id&&stalled()?{status:'failed',error:'The provider could not confirm this request. Contact support before retrying; no redo was used.'}:stage==='provider'&&e.providerStatus===404?{status:'failed',provider_id:null,error:'The provider result expired. Retry using your saved photos; no redo was used.'}:stalled()||[401,403].includes(e.providerStatus)?{status:'failed',error:'The character service is temporarily unavailable. Your photos and payment are saved. Retry or contact support; no redo was used.'}:{error:'The character service was interrupted. We are checking the existing attempt; your photos and payment are saved.'});}
 }
 async function retry(owner,id){let j=await owned(owner,id);if(j.status!=='failed')return j;if((j.attempts>=3&&!j.raw_key&&!j.provider_id)||/Contact support before retrying/.test(j.error||''))throw new HttpError(409,'Automatic retries are exhausted. Contact support; your redo allowance has not been used.');return patch(id,{status:j.raw_key?'preparing':j.provider_id?'processing':'queued',error:null,lease_id:null,lease_until:null});}
 async function approve(owner,id,revision){await owned(owner,id);const r=await query('rpc/fmi_approve_video_character',{method:'POST',body:{p_owner:owner,p_job:id,p_revision:revision}});return draftView(Array.isArray(r)?r[0]:r);}
 async function recover(){const jobs=await query(table+'?status=in.(queued,submitting,processing,preparing)&order=updated_at.asc&limit=12');for(const j of jobs)await process(j.id);return jobs.length;}
 return {owned,list,submit,process,retry,approve,recover,provider};
}
