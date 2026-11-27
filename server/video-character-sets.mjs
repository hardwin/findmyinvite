// Generalized owner-scoped character sets for layered templates (Anbil Avan).
// Two reusable identity references (bride, groom) then one output per approved pose.
// Separate from the Temple three-slot jobs/RPCs in video-characters.mjs.
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {db,HttpError} from './core.mjs';
import {draftService,draftView} from './personalization-drafts.mjs';
import {videoStore,hash} from './video-personalise-store.mjs';
import {videoService,loadVideoMaster} from './video-personalise.mjs';
import {videoPaymentService} from './video-payments.mjs';
import {replicateProvider,CHARACTER_MODEL} from './video-character-provider.mjs';
import {BACKGROUND_MODEL_VERSION} from './video-character-provider.mjs';
import {alignToReference,normalizeIdentity,toPng,characterPreview,verifyReceptionSilhouette} from './video-character-images.mjs';
import {catalogVideo} from '../shared/video-catalog.mjs';
import {videoDraftVersion} from '../shared/video-master-version.mjs';
import {CHARACTER_SET_PROMPT_REVISION,identityPrompt,posePrompt,characterSetInput} from '../shared/anbil-avan-character-prompt.mjs';

const ACTIVE=['queued','submitting','processing','preparing'],OPEN=['identities','identity_review','poses','review'];
export const CHARACTER_SET_STALL_MS=10*60*1000;
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const dataUrl=(bytes,type='image/png')=>'data:'+type+';base64,'+bytes.toString('base64');
const EXHAUSTED='Automatic retries are exhausted. Contact support; your photos, payment and redo allowance are saved.';
const UNCONFIRMED='The provider could not confirm this request. Contact support before retrying; no redo was used.';
export const characterAssetView=a=>({id:a.id,asset:a.asset,status:a.status,mediaId:a.status==='ready'?a.output_media_id:undefined,error:a.error||undefined,attempts:a.attempts,reused:!!a.reused_from});
export const characterSetView=(s,assets=[])=>({id:s.id,status:s.status,kind:s.kind,regenerate:s.regenerate,redo:s.redo,approved:s.approved_current,profile:s.profile,masterVersion:s.master_version,photos:{bride:s.photos?.bride?.id,groom:s.photos?.groom?.id},createdAt:s.created_at,assets:assets.filter(a=>a.set_id===s.id).map(characterAssetView)});

// PostgREST access. Leases and transitions are conditional row updates (real CAS);
// claim/confirm/approve are transactional RPCs (see the 1B SQL draft).
export function characterSetRepository(query=db){
 const one=async(path,options)=>(await query(path,options))?.[0]||null;
 const rpc=async(name,body)=>{const r=await query('rpc/'+name,{method:'POST',body});return Array.isArray(r)?r[0]:r;};
 const patch=(table,id,body,filter='')=>one(table+'?id=eq.'+id+filter,{method:'PATCH',headers:{Prefer:'return=representation'},body});
 return {
  courtesy:async(owner,invitation)=>(await one('video_invitation_orders?id=eq.'+invitation+'&owner_id=eq.'+owner+'&select=character_courtesy'))?.character_courtesy||[],
  sets:(owner,invitation)=>query('video_character_sets?invitation_id=eq.'+invitation+'&owner_id=eq.'+owner+'&order=created_at.asc'),
  set:id=>one('video_character_sets?id=eq.'+id),
  assets:set=>query('video_character_assets?set_id=eq.'+set+'&order=created_at.asc'),
  invitationAssets:(owner,invitation)=>query('video_character_assets?invitation_id=eq.'+invitation+'&owner_id=eq.'+owner+'&order=created_at.asc'),
  asset:id=>one('video_character_assets?id=eq.'+id),
  patchAsset:(id,body,filter)=>patch('video_character_assets',id,body,filter),
  patchSet:(id,body,filter)=>patch('video_character_sets',id,body,filter),
  pending:limit=>query('video_character_assets?status=in.(queued,submitting,processing,preparing)&order=updated_at.asc&limit='+limit),
  moving:limit=>query('video_character_sets?status=in.(identities,poses)&order=updated_at.asc&limit='+limit),
  revise:body=>rpc('fmi_revise_video_scenes',body),
  claim:body=>rpc('fmi_claim_video_character_set',body),
  confirm:body=>rpc('fmi_confirm_video_character_set',body),
  approve:body=>rpc('fmi_approve_video_character_set',body)
 };
}

export function characterSetService({allowSubmission=true,query=db,repo=characterSetRepository(query),store=videoStore(),provider=replicateProvider(),payments=videoPaymentService(),drafts=draftService({query,store}),clock=()=>Date.now(),masterLoader=loadVideoMaster,readAsset=path=>readFile('public'+path),align=alignToReference,identityImage=normalizeIdentity,callback='https://findmyinvite.com/api/video-characters?action=asset-callback&id='}={}){
 const iso=()=>new Date(clock()).toISOString();
 const media=(owner,id)=>videoService({store,now:clock}).media(owner,id);
 const inventories=new Map(),references=new Map();
 // Pose artwork must be the exact hash-locked runtime inventory of the pinned master.
 async function profileFor(draft){
  const profile=catalogVideo(draft?.template_id)?.characterProfile;
  if(draft?.kind!=='video'||!profile)throw new HttpError(400,'This template does not support matching character sets.');
  const version=videoDraftVersion(draft.template_id,draft.payload),master=await masterLoader(draft.template_id,version),bundle=master.assets?.sceneBundle;
  const key=hash({bundle,inventory:profile.inventory,art:master.defaultCharacterArt});
  if(!inventories.has(key))inventories.set(key,(async()=>{
   const indexBytes=await readAsset(bundle.path);if(hash(indexBytes)!==bundle.sha256)throw Error('Character asset index checksum mismatch.');
   const index=JSON.parse(indexBytes).files||{},raw=await readAsset(profile.inventory),inventory=JSON.parse(raw),poses={};
   if(index[profile.inventory]&&index[profile.inventory]!==hash(raw))throw Error('Character inventory checksum mismatch.');
   for(const pose of profile.poses){const item=inventory[pose.slot];if(!item?.path?.startsWith('/assets/video-scenes/')||item.path.includes('..')||!/^[a-f0-9]{64}$/.test(item.sha256||'')||index[item.path]!==item.sha256)throw Error('Character pose '+pose.slot+' is not locked.');// A replacement is a server-pinned layer override, used by preview and export as well.
    const override=master.defaultCharacterArt?.[pose.slot];
    poses[pose.slot]=override?{...item,...override}:item;}
   return poses;
  })());
  const inventory=await inventories.get(key).catch(e=>{inventories.delete(key);throw e;});
  return {profile,version,master,inventory};
 }
 function reference(item){
  if(!references.has(item.sha256))references.set(item.sha256,(async()=>{const original=await readAsset(item.path);if(hash(original)!==item.sha256)throw Error('Character pose checksum mismatch.');return {original,png:await toPng(original)};})().catch(e=>{references.delete(item.sha256);throw e;}));
  return references.get(item.sha256);
 }
 async function persistBytes(key,bytes,type){try{await store.putBytes(key,bytes,type);}catch(e){const old=await store.bytes(key).catch(()=>null);if(!old||hash(old)!==hash(bytes))throw e;}}
 const mediaRecord=(a,set,key,sha256,extra={})=>({id:a.id,owner:a.owner_id,invitationId:a.invitation_id,kind:'image',status:'ready',key,sha256,contentType:'image/png',durable:true,expiresAt:null,characterSetId:set.id,characterAssetId:a.id,characterProfile:set.profile,characterMasterVersion:set.master_version,characterSlot:a.asset.startsWith('pose:')?a.asset.slice(5):a.asset,...extra});
 async function ownedSet(owner,id){if(!uuid(id))throw new HttpError(404,'Characters not found.');const set=await repo.set(id);if(!set||set.owner_id!==owner)throw new HttpError(404,'Characters not found.');return {set,draft:await drafts.get(owner,set.invitation_id)};}
 const generated=(assets,person)=>assets.filter(a=>a.asset==='identity:'+person&&a.status==='ready'&&!a.reused_from).length;
 async function view(set){return set?characterSetView(set,await repo.assets(set.id)):null;}
 async function list(owner,invitationId){
  const draft=await drafts.get(owner,invitationId),{profile,version}=await profileFor(draft);
  const sets=await repo.sets(owner,draft.id),assets=sets.length?await repo.invitationAssets(owner,draft.id):[];
  const visible=sets.filter(s=>s.status!=='superseded'&&s.profile===profile.id&&s.master_version===version);
  const courtesy=sets.length?await repo.courtesy(owner,draft.id):[];
  const current=visible.find(s=>OPEN.includes(s.status))||visible.find(s=>s.approved_current);
  const equivalent={};
  if(current)await Promise.all(profile.identities.map(async person=>{
   const id=draft.payload?.references?.[person]?.id;
   if(!uuid(id)||id===current.photos[person]?.id)return;
   const saved=(await store.read('media/'+id+'.json'))?.value;
   if(saved?.owner===owner&&saved.invitationId===draft.id&&saved.sha256===current.photos[person].sha256)equivalent[person]=id;
  }));
  return {equivalent,courtesy: Object.fromEntries(courtesy.map(p=>[p,generated(assets,p)===2])),profile:profile.id,masterVersion:version,sets:visible.map(s=>characterSetView(s,assets)),current:visible.filter(s=>OPEN.includes(s.status)).at(-1)?.id||null,approved:visible.find(s=>s.approved_current)?.id||null,
   allowances:Object.fromEntries(profile.identities.map(p=>[p,{initialUsed:generated(assets,p)>=1,redoUsed:generated(assets,p)>=2}])),active:assets.filter(a=>ACTIVE.includes(a.status)).map(a=>a.id)};
 }
 // Reused rows share stored bytes but get their own set-bound media record.
 async function materialize(set){
  if(!set)return;
  for(const a of (await repo.assets(set.id)).filter(a=>a.status==='ready'&&a.reused_from)){
   if((await store.read('media/'+a.id+'.json'))?.value?.characterSetId===set.id)continue;
   const source=(await store.read('media/'+a.reused_from+'.json'))?.value;
   if(!source||source.owner!==a.owner_id||source.sha256!==a.output_sha256)throw Error('A reusable character file is unavailable.');
   await store.save('media/'+a.id+'.json',mediaRecord(a,set,a.output_key,a.output_sha256,{bytes:source.bytes,contentType:source.contentType,alignment:source.alignment,reusedFrom:a.reused_from,previewKey:source.previewKey,previewBytes:source.previewBytes,previewContentType:source.previewContentType,previewSha256:source.previewSha256}));
  }
 }
 async function submit(owner,b){
  const draft=await drafts.get(owner,b.invitationId),{profile,version,inventory}=await profileFor(draft);
  await payments.requireAccess(owner,draft.id,draft.template_id);
  const photos={};
  for(const person of profile.identities){
   const id=b.photos?.[person];if(!uuid(id))throw new HttpError(400,'Add a '+person+' photo to continue.');
   await drafts.pinMedia(owner,draft.id,id);const m=await media(owner,id);
   if(m.kind!=='image'||m.status!=='ready'||m.characterJobId||m.characterSetId||m.invitationId!==draft.id)throw new HttpError(400,'Upload the '+person+' photo to this invitation first.');
   photos[person]={id:m.id,sha256:m.sha256};
  }
  const explicit=Array.isArray(b.regenerate)?b.regenerate:[];
  if(explicit.some(p=>!profile.identities.includes(p)))throw new HttpError(400,'Choose a character to redo.');
  const sets=await repo.sets(owner,draft.id),assets=sets.length?await repo.invitationAssets(owner,draft.id):[];
  const base=[...sets].reverse().find(s=>s.profile===profile.id&&s.master_version===version&&['identity_review','poses','review','approved'].includes(s.status));
  const baseIdentity=p=>base&&assets.find(a=>a.set_id===base.id&&a.asset==='identity:'+p&&a.status==='ready');
  // Only a changed photo (or an explicit redo) regenerates that identity and its poses.
  const regenerate=profile.identities.filter(p=>explicit.includes(p)||!baseIdentity(p)||base.photos?.[p]?.sha256!==photos[p].sha256);
  if(!regenerate.length)return base;
  const identities=profile.identities.map(p=>regenerate.includes(p)
   ?{asset:'identity:'+p,input_key:hash({profile:profile.id,prompt:CHARACTER_SET_PROMPT_REVISION,model:CHARACTER_MODEL,asset:'identity:'+p,photo:photos[p].sha256,style:inventory[profile.identityStyle[p]].sha256,generation:generated(assets,p)})}
   :{asset:'identity:'+p,input_key:baseIdentity(p).input_key,reuse:baseIdentity(p).id});
  const key=hash({invitation:draft.id,profile:profile.id,version,photos,regenerate,base:base?.id||null,generations:profile.identities.map(p=>generated(assets,p))});
  const set=await repo.claim({p_owner:owner,p_invitation:draft.id,p_template:draft.template_id,p_version:version,p_profile:profile.id,p_prompt:CHARACTER_SET_PROMPT_REVISION,p_model:CHARACTER_MODEL,p_key:key,p_photos:photos,p_regenerate:regenerate,p_redo:b.redo===true,p_identities:identities});
  await materialize(set);return set;
 }
 async function revise(owner,b){
  const {set,draft}=await ownedSet(owner,b.id),{profile}=await profileFor(draft);
  await payments.requireAccess(owner,draft.id,draft.template_id);
  if(!uuid(b.requestId))throw new HttpError(400,'Choose the scene again.');
  const slots=b.slot==='all'?profile.poses.map(p=>p.slot):[b.slot];
  if(!slots.every(slot=>profile.poses.some(p=>p.slot===slot))||!['illustration','cutout'].includes(b.mode)||slots.length>1&&(b.mode==='cutout'||Object.keys(b.references||{}).length))throw new HttpError(400,'Choose a single scene for this image.');
  const changes={},previous=await repo.assets(set.id);
  for(const slot of slots){
   const pose=profile.poses.find(p=>p.slot===slot),refs={};
   const saved=previous.find(a=>a.asset==='pose:'+slot)?.scene_input;
   const references={...(slots.length===1&&saved?.mode===b.mode?Object.fromEntries(Object.entries(saved.refs||{}).map(([k,v])=>[k,v.id])):{}),...b.references};
   if(b.mode==='cutout'&&!references.photo)throw new HttpError(400,'Upload the photo to place in this scene.');
   for(const [person,id] of Object.entries(references)){
    if(!(b.mode==='cutout'?person==='photo':(pose.people.includes(person)||person==='couple'&&pose.people.length===2))||!uuid(id))throw new HttpError(400,'Choose a reference for this scene.');
    await drafts.pinMedia(owner,draft.id,id);
    const m=await media(owner,id);
    if(m.invitationId!==draft.id||!m.durable||m.kind!=='image'||m.status!=='ready'||m.characterJobId||m.characterSetId)throw new HttpError(400,'Upload a photo to this invitation first.');
    refs[person]={id:m.id,sha256:m.sha256};
   }
   const input={mode:b.mode,refs},model=b.mode==='cutout'?BACKGROUND_MODEL_VERSION:CHARACTER_MODEL;
   changes[slot]={input,model,key:hash({set:set.id,slot,input,model,revision:CHARACTER_SET_PROMPT_REVISION,request:b.requestId})};
  }
  const key=hash({base:set.id,changes});
  const candidate=await repo.revise({p_owner:owner,p_set:set.id,p_key:key,p_prompt:CHARACTER_SET_PROMPT_REVISION,p_changes:changes});
  await materialize(candidate);return candidate;
 }
 async function confirm(owner,id){
  const {set,draft}=await ownedSet(owner,id),{profile,version,inventory}=await profileFor(draft);
  if(set.profile!==profile.id||set.master_version!==version)throw new HttpError(409,'These characters belong to a different invitation version.');
  if(['poses','review','approved'].includes(set.status))return set;
  await payments.requireAccess(owner,draft.id,draft.template_id);
  const assets=await repo.assets(set.id),identity=Object.fromEntries(profile.identities.map(p=>[p,assets.find(a=>a.asset==='identity:'+p&&a.status==='ready')]));
  if(profile.identities.some(p=>!identity[p]))throw new HttpError(409,'Both characters must be ready before continuing.');
  // A pose depends only on its own people's identity outputs and the approved artwork.
  const poses=profile.poses.map(pose=>({asset:'pose:'+pose.slot,input_key:hash({profile:profile.id,prompt:set.prompt_revision,model:CHARACTER_MODEL,asset:'pose:'+pose.slot,pose:inventory[pose.slot].sha256,identities:Object.fromEntries(pose.people.map(p=>[p,identity[p].output_sha256]))})}));
  const updated=await repo.confirm({p_owner:owner,p_set:set.id,p_model:CHARACTER_MODEL,p_poses:poses});
  await materialize(updated);return updated;
 }
 async function advance(id){
  const set=await repo.set(id);if(!set)return null;
  const assets=await repo.assets(id),kind=prefix=>assets.filter(a=>a.asset.startsWith(prefix));
  if(set.status==='identities'&&kind('identity:').length&&kind('identity:').every(a=>a.status==='ready'))return await repo.patchSet(id,{status:'identity_review',updated_at:iso()},'&status=eq.identities')||set;
  if(set.status==='poses'&&kind('pose:').length&&kind('pose:').every(a=>a.status==='ready'))return await repo.patchSet(id,{status:'review',updated_at:iso()},'&status=eq.poses')||set;
  return set;
 }
 async function inputs(a,set,profile,inventory){
  if(a.asset.startsWith('identity:')){
   const person=a.asset.slice(9),photo=set.photos?.[person],m=await media(a.owner_id,photo?.id),bytes=await store.bytes(m.key);
   if(hash(bytes)!==photo.sha256)throw Error('A saved photo changed.');
   return {images:[dataUrl(bytes,m.contentType),dataUrl((await reference(inventory[profile.identityStyle[person]])).png)],prompt:tracking=>identityPrompt(person,tracking)};
  }
  const pose=profile.poses.find(p=>'pose:'+p.slot===a.asset);if(!pose)throw Error('Unknown character pose.');
  const assets=await repo.assets(set.id),images=[dataUrl((await reference(inventory[pose.slot])).png)];
  const readReference=async ref=>{const m=await media(a.owner_id,ref.id);if(m.invitationId!==a.invitation_id||m.sha256!==ref.sha256)throw Error('Scene reference changed.');const bytes=await store.bytes(m.key);if(hash(bytes)!==ref.sha256)throw Error('Scene reference file changed.');return dataUrl(bytes,m.contentType);};
  if(a.scene_input?.mode==='cutout')return {cutout:await readReference(a.scene_input.refs.photo)};
  for(const person of pose.people){
   if(set.prompt_revision===CHARACTER_SET_PROMPT_REVISION)images.push(await readReference(a.scene_input?.refs?.[person]||set.photos[person]));
   const identity=assets.find(x=>x.asset==='identity:'+person&&x.status==='ready');if(!identity)throw Error('Character identity is missing.');const bytes=await store.bytes(identity.output_key);if(hash(bytes)!==identity.output_sha256)throw Error('A saved character changed.');images.push(dataUrl(bytes));
  }
  if(a.scene_input?.refs?.couple)images.push(await readReference(a.scene_input.refs.couple));
  return {images,aspectRatio:'3:4',prompt:tracking=>posePrompt(pose,tracking,set.prompt_revision,!!a.scene_input?.refs?.couple)};
 }
 async function process(id){
  if(!uuid(id))return;
  let a=await repo.asset(id);if(!a||!ACTIVE.includes(a.status))return;
  const set=await repo.set(a.set_id);if(!set)return;
  const draft=await drafts.get(a.owner_id,a.invitation_id),lease=randomUUID();
  a=await repo.patchAsset(id,{lease_id:lease,lease_until:new Date(clock()+300000).toISOString()},'&status=in.(queued,submitting,processing,preparing)&or=(lease_until.is.null,lease_until.lt.'+encodeURIComponent(iso())+')');if(!a)return;
  // Polling and lease renewal are not progress; only status changes reset the deadline.
  const stalled=()=>clock()-Date.parse(a.updated_at||a.created_at)>=CHARACTER_SET_STALL_MS;
  const finish=body=>repo.patchAsset(id,{...body,lease_id:null,lease_until:null,...(body.status&&body.status!==a.status?{updated_at:iso()}:{})},'&lease_id=eq.'+lease);
  let stage='profile';
  try{
   const {profile,inventory}=await profileFor(draft);if(set.profile!==profile.id)throw Error('Character profile changed.');
   let prediction;stage='provider';
   if(a.status==='queued'){
    if(!allowSubmission){await finish({status:'failed',error:'Upload your scene image in Photos to continue.'});return;}
    if(a.attempts>=3){await finish({status:'failed',error:EXHAUSTED});return;}
    // Preserve this queue window across rejected submissions. A customer retry
    // starts a fresh window even when the asset itself was created days ago.
    const queuedAt=a.updated_at||a.created_at;
    stage='references';const request=await inputs(a,set,profile,inventory);
    a=await repo.patchAsset(id,{status:'submitting',attempts:a.attempts+1,updated_at:iso()},'&lease_id=eq.'+lease);if(!a)return;
    stage='submit';
    try{prediction=request.cutout?await provider.removeBackground(request.cutout,callback+a.id):await provider.create(characterSetInput(request.prompt(a.id+'-'+a.attempts),request.images,request.aspectRatio),callback+a.id);}
    catch(e){
     if(e.providerStatus===429){
      // A rejected rate-limit request did not create a prediction. Keep its
      // allowance/attempt and defer via the existing lease rather than asking
      // the customer to retry or immediately hammering the provider again.
      if(clock()-Date.parse(queuedAt)>=CHARACTER_SET_STALL_MS)await finish({status:'failed',attempts:a.attempts-1,error:'The illustration service is busy. Retry later; your photos, payment and redo allowance are saved.'});
      else await repo.patchAsset(id,{status:'queued',attempts:a.attempts-1,updated_at:queuedAt,lease_id:null,lease_until:new Date(clock()+Math.max(12000,Math.min(60000,e.retryAfterMs||15000))+parseInt(id.slice(0,3),16)%2000).toISOString(),error:'Waiting for the illustration service. Your place is saved.'},'&lease_id=eq.'+lease);
     }else if(e.providerStatus&&e.providerStatus<500)await finish({status:'failed',error:'Character preparation could not start. No redo was used. Please retry.'});
     else await finish({status:'submitting',error:'Confirming the generation request. Your allowance is safe.'});return;
    }
    a=await repo.patchAsset(id,{provider_id:prediction.id,status:'processing',model_version:typeof prediction.version==='string'?prediction.version:null,error:null,updated_at:iso()},'&lease_id=eq.'+lease);
   }else if(a.status==='submitting'&&!a.provider_id){
    const recent=await provider.recent();prediction=recent.results?.find(p=>p.webhook===callback+a.id||p.input?.prompt?.includes('Tracking reference '+a.id+'-'+a.attempts));
    if(!prediction){await finish(stalled()?{status:'failed',error:UNCONFIRMED}:{error:'Waiting for the provider to confirm the request.'});return;}
    a=await repo.patchAsset(id,{provider_id:prediction.id,status:'processing',updated_at:iso()},'&lease_id=eq.'+lease);
   }else if(a.provider_id&&!a.raw_key)prediction=await provider.get(a.provider_id);
   if(prediction?.status==='failed'||prediction?.status==='canceled'){await finish({status:a.attempts<2?'queued':'failed',provider_id:null,error:a.attempts<2?'A technical attempt failed. Retrying without using a redo.':'Character preparation failed. No redo was used. Please retry.'});return;}
   const output=Array.isArray(prediction?.output)?prediction.output[0]:prediction?.output;
   if(!a.raw_key&&typeof output!=='string'){await finish(stalled()?{status:'failed',error:'Character creation is taking too long. Retry to check the existing attempt. Your photos and payment are saved; no redo was used.'}:{status:'processing'});return;}
   const folder='persistent/'+a.owner_id+'/'+a.invitation_id+'/character-sets/'+set.id+'/'+a.asset.replace(':','-');
   stage='download';let bytes;
   if(a.raw_key)bytes=await store.bytes(a.raw_key);
   else{
    // Persist the provider locator and bytes before any processing: outputs expire.
    await store.save(folder+'/prediction-'+a.attempts+'.json',{id:prediction.id,status:prediction.status,output,savedAt:iso()});
    bytes=await provider.output(output);stage='persist';
    const raw=folder+'/provider-'+a.attempts+'.png';await persistBytes(raw,bytes,'image/png');
    a=await repo.patchAsset(id,{status:'preparing',raw_key:raw,updated_at:iso()},'&lease_id=eq.'+lease);if(!a)return;
   }
   stage='prepare';let prepared;
   try{
    if(a.asset.startsWith('pose:')){
     const pose=profile.poses.find(p=>'pose:'+p.slot===a.asset);
     const original=(await reference(inventory[pose.slot])).original,cutout=a.scene_input?.mode==='cutout';
     prepared=await align(bytes,original,{minSilhouette:cutout?0:pose.minSilhouette});
     if(!cutout&&pose.slot==='receptionCouple'&&set.prompt_revision!==CHARACTER_SET_PROMPT_REVISION)await verifyReceptionSilhouette(prepared.bytes);
    }
    else prepared=await identityImage(bytes);
   }catch(e){
    if(e.code!=='CHARACTER_QUALITY')throw e;
    // An unusable generation gets a fresh bounded attempt; it never uses a redo.
    await finish({status:a.attempts<3?'queued':'failed',provider_id:null,raw_key:null,error:a.attempts<3?'Refining this character automatically. No redo is used.':'This character did not match the approved scene. Retry, or contact support; no redo was used.'});return;
   }
   const key=folder+'/prepared-'+a.attempts+'.png',sha256=hash(prepared.bytes);await persistBytes(key,prepared.bytes,'image/png');
   const preview=await characterPreview(prepared.bytes),previewKey=folder+'/preview-'+a.attempts+'.webp';await persistBytes(previewKey,preview,'image/webp');
   await store.save('media/'+a.id+'.json',mediaRecord(a,set,key,sha256,{bytes:prepared.bytes.length,alignment:prepared.alignment,previewKey,previewBytes:preview.length,previewContentType:'image/webp',previewSha256:hash(preview)}));
   await finish({status:'ready',output_key:key,output_sha256:sha256,output_media_id:a.id,error:null});
   await advance(set.id);
  }catch(e){
   console.error('Character set step failed',id,{stage,name:e.name,providerStatus:e.providerStatus||null});
   await finish(a.raw_key?{status:'failed',error:'Your generated image is saved, but preparation was interrupted. Retry to finish it; no redo is needed.'}:a.status==='submitting'&&!a.provider_id&&stalled()?{status:'failed',error:UNCONFIRMED}:stage==='provider'&&e.providerStatus===404?{status:'failed',provider_id:null,error:'The provider result expired. Retry using your saved photos; no redo was used.'}:stalled()||[401,403].includes(e.providerStatus)?{status:'failed',error:'The character service is temporarily unavailable. Your photos and payment are saved. Retry or contact support; no redo was used.'}:{error:'The character service was interrupted. We are checking the existing attempt; your photos and payment are saved.'});
  }
 }
 // Customer retry of failed assets only; completed assets are never regenerated.
 async function retry(owner,id){
  const {set,draft}=await ownedSet(owner,id);if(!OPEN.includes(set.status))return {set,retried:[]};
  await payments.requireAccess(owner,draft.id,draft.template_id);
  const failed=(await repo.assets(set.id)).filter(a=>a.status==='failed');
  if(failed.some(a=>(a.attempts>=3&&!a.raw_key&&!a.provider_id)||/Contact support before retrying/.test(a.error||'')))throw new HttpError(409,'Automatic retries are exhausted. Contact support; your redo allowance has not been used.');
  const retried=[];
  for(const a of failed){const r=await repo.patchAsset(a.id,{status:a.raw_key?'preparing':a.provider_id?'processing':'queued',error:null,lease_id:null,lease_until:null,updated_at:iso()},'&status=eq.failed');if(r)retried.push(r.id);}
  return {set,retried};
 }
 async function approve(owner,id,revision){
  const {set,draft}=await ownedSet(owner,id),{profile,version}=await profileFor(draft);
  if(set.profile!==profile.id||set.master_version!==version)throw new HttpError(409,'These characters belong to a different invitation version.');
  if(!Number.isInteger(revision))throw new HttpError(409,'Reload the saved version before approving.');
  if(!set.approved_current){
   const assets=await repo.assets(set.id);
   if(profile.poses.some(pose=>assets.find(a=>a.asset==='pose:'+pose.slot)?.status!=='ready'))throw new HttpError(409,'Every scene character must be ready before approval.');
   await materialize(set);
   for(const pose of profile.poses){const a=assets.find(x=>x.asset==='pose:'+pose.slot),m=(await store.read('media/'+a.output_media_id+'.json'))?.value;if(m?.owner!==owner||m.characterSetId!==set.id||m.characterSlot!==pose.slot||m.characterProfile!==profile.id||m.sha256!==a.output_sha256)throw new HttpError(409,'A character file is unavailable. Retry or contact support.');}
  }
  return draftView(await repo.approve({p_owner:owner,p_set:set.id,p_revision:revision,p_slots:profile.poses.map(p=>p.slot)}));
 }
 async function resumeAfterCallback(id){
  await process(id);
  const asset=await repo.asset(id);if(!asset||asset.status!=='ready')return;
  const remaining=(await repo.assets(asset.set_id)).filter(a=>a.status==='queued');
  await Promise.all(remaining.slice(0,2).map(a=>process(a.id)));
 }
 async function recover(){
  const pending=await repo.pending(3);await Promise.all(pending.map(a=>process(a.id)));
  for(const set of await repo.moving(12)){try{await materialize(set);await advance(set.id);}catch(e){console.error('Character set reconciliation will retry',set.id,e.name);}}
  return pending.length;
 }
 return {list,view,submit,revise,confirm,process,resumeAfterCallback,advance,retry,approve,recover,materialize,profileFor,provider};
}
