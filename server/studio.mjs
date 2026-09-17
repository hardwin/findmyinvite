import {randomUUID} from 'node:crypto';
import {HttpError,bodyJson,bearer,configured,db,method,promotion,publicData,rate,respond,slugValue,tokenHash,validateData} from './core.mjs';
import {STUDIO_TEMPLATES,applyStudioMessage,bindHtml,snapshotHtml,studioTemplateIds} from './studio-html.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MUSIC=new Set(['','/assets/track1.mp3','/assets/track3.mp3','/assets/temple/invite-bg.mp3']);
function ownerHash(token){return tokenHash(token);}
function projectId(value){if(typeof value!=='string'||!UUID.test(value))throw new HttpError(400,'Choose a valid studio draft.');return value.toLowerCase();}
function busy(row){return Boolean(row?.session_id&&row.lock_until&&Date.parse(row.lock_until)>Date.now());}
function view(row,extra={}){
 return {
  id:row.id,
  template:row.template_id,
  data:publicData(row.data),
  html:row.html,
  revision:row.revision,
  publishedSlug:row.published_slug||'',
  busy:busy(row),
  status:busy(row)?'Customizing your invitation…':extra.status,
  message:extra.message
 };
}
function studioData(input,template,slug='studio-draft'){
 if(!STUDIO_TEMPLATES[template])throw new HttpError(400,'That studio design is not available.');
 const music=typeof input?.music==='string'&&MUSIC.has(input.music)?input.music:(template==='royal-temple'?'/assets/temple/invite-bg.mp3':'/assets/track1.mp3');
 const valid=validateData({...input,template:template==='royal-temple'?'royal-prestige':template,music:MUSIC.has(input?.music)?(input.music==='/assets/temple/invite-bg.mp3'?'/assets/track3.mp3':input.music):music},slug);
 const data={...valid.data,template,music,studioId:typeof input?.studioId==='string'?input.studioId:undefined};
 return {data,expires_at:valid.expires_at};
}
async function loadOwned(id,token){
 const rows=await db('studio_projects?id=eq.'+encodeURIComponent(id)+'&select=*&limit=1');
 const row=rows?.[0];
 if(!row)throw new HttpError(404,'Studio draft not found.');
 if(row.owner_hash!==ownerHash(token))throw new HttpError(403,'This recovery key cannot open that studio draft.');
 return row;
}
async function writeVersion(row,message){
 await db('studio_versions',{method:'POST',headers:{Prefer:'return=minimal'},body:{project_id:row.id,revision:row.revision,data:row.data,html:row.html,git_sha:row.git_sha||null,message:String(message||'').slice(0,1000)}});
}
async function bump(row,data,html,message){
 const htmlBound=bindHtml(html||row.html,data);
 const next=await db('studio_projects?id=eq.'+row.id+'&revision=eq.'+row.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:{data,html:htmlBound,revision:row.revision+1,session_id:null,run_started_at:null,run_revision:null,updated_at:new Date().toISOString()}});
 if(!next?.length)throw new HttpError(409,'Studio draft or operation lease changed');
 await writeVersion(next[0],message);
 return next[0];
}
async function acquireLock(row){
 const until=new Date(Date.now()+120000).toISOString();
 const locked=await db('studio_projects?id=eq.'+row.id+'&revision=eq.'+row.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:{lock_until:until,updated_at:new Date().toISOString()}});
 if(!locked?.length)throw new HttpError(409,'Studio draft or operation lease changed');
 return locked[0];
}
export async function handleStudio(req,res){
 const url=new URL(req.url,'https://findmyinvite.com');
 const action=url.searchParams.get('action')||'';
 if(action==='config'){
  method(req,['GET']);
  return respond(res,200,{authenticated:true,configured:configured(),templates:studioTemplateIds()});
 }
 if(action==='login'){
  method(req,['POST']);
  return respond(res,200,{ok:true,authenticated:true});
 }
 if(action==='public'){
  method(req,['GET']);
  const slug=slugValue(url.searchParams.get('slug')||'');
  const rows=await db('studio_publications?slug=eq.'+encodeURIComponent(slug)+'&select=html,data,revision,slug&limit=1');
  const row=rows?.[0];
  if(!row)throw new HttpError(404,'Invitation not found.');
  return respond(res,200,{slug:row.slug,html:row.html,invitation:publicData(row.data),revision:row.revision});
 }
 if(action==='create'){
  method(req,['POST']);
  if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
  await rate(req,'studio-create',10,3600);
  const body=await bodyJson(req,200000);
  const template=String(body.template||'');
  if(!studioTemplateIds().includes(template))throw new HttpError(400,'That studio design is not available.');
  const token=String(body.token||'');
  const prepared=studioData(body.data||{},template);
  const html=bindHtml(snapshotHtml(template),prepared.data);
  const id=randomUUID();
  const rows=await db('studio_projects',{method:'POST',headers:{Prefer:'return=representation'},body:{id,owner_hash:ownerHash(token),template_id:template,data:{...prepared.data,studioId:id},html,revision:0}});
  const row=rows[0];
  await writeVersion(row,'Created in Love Studio');
  return respond(res,201,view(row));
 }
 const id=projectId(url.searchParams.get('id'));
 const token=bearer(req);
 if(!token)throw new HttpError(401,'Open this studio draft with your private access key.');
 const row=await loadOwned(id,token);
 if(action==='read'){
  method(req,['GET']);
  return respond(res,200,view(row));
 }
 if(action==='history'){
  method(req,['GET']);
  const versions=await db('studio_versions?project_id=eq.'+id+'&select=revision,message,created_at,git_sha&order=revision.desc&limit=50')||[];
  return respond(res,200,{versions});
 }
 if(action==='poll'){
  method(req,['POST']);
  const current=await loadOwned(id,token);
  return respond(res,200,{...view(current),done:!busy(current)});
 }
 if(action==='cancel'){
  method(req,['POST']);
  const cancelled=await db('studio_projects?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:{session_id:null,run_started_at:null,run_revision:null,updated_at:new Date().toISOString()}});
  return respond(res,200,view(cancelled[0]||row,{status:'Change cancelled.'}));
 }
 if(action==='save'){
  method(req,['POST']);
  const body=await bodyJson(req,200000);
  if(Number(body.revision)!==row.revision)throw new HttpError(409,'Studio draft or operation lease changed');
  const prepared=studioData({...row.data,...body.data,studioId:id},row.template_id);
  const saved=await bump(row,{...prepared.data,studioId:id},snapshotHtml(row.template_id),'Saved details');
  return respond(res,200,view(saved));
 }
 if(action==='run'){
  method(req,['POST']);
  const body=await bodyJson(req,200000);
  if(Number(body.revision)!==row.revision)throw new HttpError(409,'Studio draft or operation lease changed');
  const message=String(body.message||'').trim();
  if(!message||message.length>2000)throw new HttpError(400,'Tell Lovebot what to change.');
  const applied=applyStudioMessage(row.data,message,String(body.section||''));
  const prepared=studioData({...applied.data,studioId:id},row.template_id);
  const saved=await bump(row,{...prepared.data,studioId:id},snapshotHtml(row.template_id),message);
  return respond(res,200,{...view(saved),done:true,message:applied.reply});
 }
 if(action==='restore'){
  method(req,['POST']);
  const body=await bodyJson(req);
  if(Number(body.revision)!==row.revision)throw new HttpError(409,'Studio draft or operation lease changed');
  const target=Number(body.target);
  if(!Number.isInteger(target)||target<0)throw new HttpError(400,'Choose a saved version.');
  const versions=await db('studio_versions?project_id=eq.'+id+'&revision=eq.'+target+'&select=*&limit=1');
  const version=versions?.[0];
  if(!version)throw new HttpError(404,'That version is not available.');
  const saved=await bump(row,version.data,version.html,'Restored version '+(target+1));
  return respond(res,200,view(saved));
 }
 if(action==='publish'){
  method(req,['POST']);
  if(!promotion().active)throw new HttpError(403,'Free creation is available during the launch offer.');
  const body=await bodyJson(req,200000);
  if(Number(body.revision)!==row.revision)throw new HttpError(409,'Studio draft or operation lease changed');
  const slug=slugValue(body.slug);
  const hash=ownerHash(String(body.managementToken||''));
  const prepared=studioData({...row.data,studioId:id},row.template_id,slug);
  await acquireLock(row);
  const lockedRow=await loadOwned(id,token);
  try{
   await db('rpc/studio_publish',{method:'POST',body:{p_id:id,p_revision:lockedRow.revision,p_lock_until:lockedRow.lock_until,p_slug:slug,p_hash:hash,p_data:{...prepared.data,studioId:id},p_expires:prepared.expires_at}});
  }catch(error){
   if(error instanceof HttpError&&error.status===409)throw new HttpError(409,error.message==='This address is already in use.'?'Address unavailable':error.message);
   throw error;
  }
  const published=await loadOwned(id,token);
  return respond(res,200,view(published,{status:'Your invitation is published'}));
 }
 throw new HttpError(400,'Unknown studio action.');
}
export {handleStudio as default};
