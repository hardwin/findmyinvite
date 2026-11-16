import {catalogIdentities} from './catalog-identity.mjs';
import {identityFields} from '../shared/catalog-identity.mjs';
import {db,HttpError} from './core.mjs';
import {version} from './template-cms.mjs';
import {videoInvitationId} from './video-payments.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {videoStore,hash} from './video-personalise-store.mjs';
import {del} from '@vercel/blob';
const table='personalization_drafts';
export const draftView=r=>({id:r.id,kind:r.kind,templateId:r.template_id,payload:r.payload,revision:r.revision,updatedAt:r.updated_at,lastJobId:r.last_job_id});
export function draftService({query=db,store=videoStore()}={}){
 const one=async(path,options)=>(await query(path,options))?.[0]||null;
 async function get(owner,id,{optional=false,deleted=false}={}){id=videoInvitationId(id);const r=await one(table+'?id=eq.'+id+'&owner_id=eq.'+owner+'&select=*');if(!r){if(optional)return null;throw new HttpError(404,'Invitation not found.');}if(r.deleted_at&&!deleted)throw new HttpError(410,'This invitation has been deleted.');return r;}
 async function pinBytes(key,bytes,type){try{await store.putBytes(key,bytes,type);}catch(e){const existing=await store.bytes(key).catch(()=>null);if(!existing||hash(existing)!==hash(bytes))throw e;}}
 async function pinMedia(owner,id,mediaId){
  if(!/^[a-f0-9-]{36}$/.test(mediaId||''))return;
  const saved=await store.read('media/'+mediaId+'.json'),m=saved?.value;
  if(!m||m.owner!==owner)throw new HttpError(404,'An uploaded file is unavailable. Select it again.');
  if(m.invitationId&&m.invitationId!==id)throw new HttpError(400,'Upload this photo to the current invitation.');
  if(m.durable||m.status!=='ready')return;
  const base='persistent/'+owner+'/'+id+'/'+mediaId,key=base+'/original';
  if(m.status==='ready'){
   const bytes=await store.bytes(m.key);await pinBytes(key,bytes,m.contentType);
   if(m.cutoutKey)await pinBytes(base+'/cutout.png',await store.bytes(m.cutoutKey),'image/png');
  }
  await store.save('media/'+mediaId+'.json',{...m,invitationId:id,durable:true,expiresAt:null,...(m.status==='ready'?{key,...(m.cutoutKey?{cutoutKey:base+'/cutout.png'}:{})}:{})},{etag:saved.etag});
 }
 async function save(owner,b){
  const id=videoInvitationId(b.id);if(!['video','website'].includes(b.kind)||typeof b.templateId!=='string'||!b.payload||Array.isArray(b.payload)||typeof b.payload!=='object'||!Number.isInteger(b.revision)||b.revision<0)throw new HttpError(400,'Invalid draft.');
  if(b.kind==='video')videoDefinition(b.templateId);else await version(b.templateId);
  // Raw incomplete form values are recoverable; export/publication still perform full validation.
  const payload=JSON.parse(JSON.stringify(b.payload));delete payload.owner;delete payload.paid;delete payload.unlocked;
  if(b.kind==='website'&&payload.slug){const website=await one('invitations?slug=eq.'+encodeURIComponent(payload.slug)+'&owner_id=eq.'+owner+'&select=id');if(!website)throw new HttpError(404,'Invitation not found.');}
  const row=await query('rpc/fmi_save_personalization_draft',{method:'POST',body:{p_id:id,p_owner:owner,p_kind:b.kind,p_template:b.templateId,p_payload:payload,p_revision:b.revision}});
  const result=Array.isArray(row)?row[0]:row;
  if(b.kind==='video'){
   const ids=new Set([...Object.values(payload.content?.photos||{}).map(p=>p?.id),payload.content?.music?.mode==='upload'?payload.content.music.id:null,...Object.values(payload.pending||{}).map(p=>p?.id),...Object.values(payload.references||{}).map(p=>p?.id)].filter(Boolean));
   for(const mediaId of ids)await pinMedia(owner,id,mediaId);
  }
  return draftView(result);
 }
 async function jobView(owner,id){if(!id)return null;const j=(await store.read('jobs/'+id+'.json'))?.value;if(j?.owner!==owner)return {id,status:'expired'};return {id,status:Date.parse(j.expiresAt)<=Date.now()?'expired':j.status,progress:j.progress,expiresAt:j.expiresAt,error:j.error,contentRevision:j.contentRevision,download:j.status==='ready'&&Date.parse(j.expiresAt)>Date.now()?'/api/video-personalise?action=download&id='+id:undefined};}
 async function list(owner){
  const [drafts,websites,purchases,websitePurchases]=await Promise.all([query(table+'?owner_id=eq.'+owner+'&deleted_at=is.null&order=updated_at.desc&limit=200'),query('invitations?owner_id=eq.'+owner+'&template_version_id=not.is.null&deleted_at=is.null&superseded_by=is.null&order=updated_at.desc&limit=200'),query('video_invitation_orders?owner_id=eq.'+owner+'&select=id,template_id,status,created_at'),query('website_orders?owner_id=eq.'+owner+'&select=invitation_id,status&order=created_at.desc')]);
  const all=await query(table+'?owner_id=eq.'+owner+'&select=id,payload,deleted_at');const known=new Set(all.map(r=>r.id));const slugs=new Set(all.map(r=>r.payload?.slug).filter(Boolean));
  const items=drafts.map(draftView);
  for(const w of websites)if(!known.has(w.id)&&!slugs.has(w.slug))items.push({id:w.id,kind:'website',templateId:w.template_version_id,revision:0,payload:{content:w.draft_content,slug:w.slug,serverRevision:w.draft_revision,formStepId:w.form_step_id},updatedAt:w.updated_at,published:w.published});
  const missing=purchases.filter(p=>!known.has(p.id));
  if(missing.length){
   const restored=new Map();for(const file of await store.list('jobs/')){const j=(await store.read(file))?.value;if(j?.owner===owner&&missing.some(p=>p.id===j.invitationId)){const old=restored.get(j.invitationId);if(!old||j.createdAt>old.createdAt)restored.set(j.invitationId,j);}}
   for(const p of missing){const j=restored.get(p.id);items.push({id:p.id,kind:'video',templateId:p.template_id,revision:0,payload:j?{content:j.content,step:7,formStepId:'review',formVersion:2,jobContent:JSON.stringify(j.content)}:{missingDetails:true},lastJobId:j?.id,updatedAt:j?.createdAt||p.created_at});}
  }
  const versionIds=[...new Set(items.filter(d=>d.kind==='website').map(d=>d.templateId))];
  const versions=versionIds.length?await query('template_versions?id=in.('+versionIds.join(',')+')&select=id,template_id'):[];
  const catalog=versions.length?await query('template_catalog?id=in.('+[...new Set(versions.map(v=>v.template_id))].map(encodeURIComponent).join(',')+')&select=id,name,thumbnail'):[];
  const identities=await catalogIdentities(undefined,query);
  const characters=await query('video_character_jobs?owner_id=eq.'+owner+'&status=in.(queued,submitting,processing,preparing,review)&select=invitation_id,status&limit=200');
  return Promise.all(items.map(async d=>{const p=purchases.find(p=>p.id===d.id),website=websites.find(w=>w.id===d.id||w.slug===d.payload?.slug),meta=catalog.find(c=>c.id===versions.find(v=>v.id===d.templateId)?.template_id);return {...d,...identityFields(identities.find(r=>r.kind===d.kind&&r.template_id===(d.kind==='video'?d.templateId:meta?.id))),characterReview:characters.some(j=>j.invitation_id===d.id),templateName:d.kind==='video'?videoDefinition(d.templateId).name:meta?.name,thumbnail:d.kind==='video'?'/assets/video-masters/'+d.templateId+'/poster.jpg':meta?.thumbnail,job:d.kind==='video'?await jobView(owner,d.lastJobId||d.payload?.job?.id):null,payment:p?.status||(websitePurchases.some(p=>p.invitation_id===website?.id&&p.status==='captured')?'captured':null),published:website?.published||false,expiresAt:website?.first_published_at?website.expires_at:null};}));
 }
 async function remove(owner,id){
  let row=await get(owner,id,{optional:true,deleted:true});
  if(!row){const found=(await list(owner)).find(d=>d.id===id);if(!found)throw new HttpError(404,'Invitation not found.');await save(owner,{...found,revision:0});row=await get(owner,id);}
  const websitePath='invitations?'+(row.payload.slug?'slug=eq.'+encodeURIComponent(row.payload.slug):'id=eq.'+id)+'&owner_id=eq.'+owner;
  if(row.kind==='video'){
   const active=await query('video_character_jobs?invitation_id=eq.'+id+'&owner_id=eq.'+owner+'&status=in.(queued,submitting,processing,preparing)&select=id&limit=1');if(active.length)throw new HttpError(409,'Wait for character preparation to finish before deleting this invitation.');
   const job=await jobView(owner,row.last_job_id||row.payload?.job?.id);if(job&&['queued','running'].includes(job.status))throw new HttpError(409,'Wait for the active render to finish before deleting this invitation.');
  }else{const w=await one(websitePath+'&select=id,published');if(w?.published)throw new HttpError(409,'Published websites cannot be deleted here.');if(w)await query('invitations?id=eq.'+w.id+'&owner_id=eq.'+owner,{method:'PATCH',body:{deleted_at:new Date().toISOString()}});}
  await query(table+'?id=eq.'+id+'&owner_id=eq.'+owner,{method:'PATCH',body:{deleted_at:new Date().toISOString()}});
  if(row.kind==='website'){const website=await one(websitePath+'&select=id');if(website){const media=await query('template_media?invitation_id=eq.'+website.id+'&select=id,object_path');for(const m of media){if(m.object_path)await del(m.object_path);await query('template_media?id=eq.'+m.id+'&invitation_id=eq.'+website.id,{method:'DELETE'});}}}
  if(row.kind==='video'){
   await query('video_character_jobs?invitation_id=eq.'+id+'&owner_id=eq.'+owner,{method:'DELETE'});
   for(const key of await store.list('persistent/'+owner+'/'+id+'/'))await store.remove(key);
   for(const key of await store.list('media/')){const m=(await store.read(key))?.value;if(m?.owner===owner&&m.invitationId===id){if(m.key)await store.remove(m.key);if(m.cutoutKey)await store.remove(m.cutoutKey);await store.remove(key);}}
   for(const key of await store.list('jobs/')){const j=(await store.read(key))?.value;if(j?.owner===owner&&j.invitationId===id){if(j.resultKey)await store.remove(j.resultKey);await store.remove(key);}}
  }
  await query(table+'?id=eq.'+id+'&owner_id=eq.'+owner,{method:'PATCH',body:{payload:{},last_job_id:null}});
 }
 async function cleanupDeleted(){const rows=await query(table+'?deleted_at=not.is.null&payload=neq.{}&select=id,owner_id&limit=25');for(const r of rows){try{await remove(r.owner_id,r.id);}catch(e){console.error('Deleted invitation cleanup will retry',r.id,e.name);}}}
 const deleted=async owner=>(await query(table+'?owner_id=eq.'+owner+'&deleted_at=not.is.null&select=id')).map(r=>r.id);
 return {get,save,list,remove,pinMedia,jobView,cleanupDeleted,deleted};
}
