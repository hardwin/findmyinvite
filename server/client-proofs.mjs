// Client approval desk: register a client job, upload stills, share a private /proof/{token} link,
// collect per-scene approve / change decisions, then mark video and dispatch.
import {randomBytes} from 'node:crypto';
import {HttpError,db,text} from './core.mjs';

export const STATUSES=['registered','stills_review','changes_requested','approved','video','dispatched','cancelled'];
const OPERATOR_STATUS=new Set(['approved','video','dispatched','cancelled']);
const REVIEWABLE=new Set(['stills_review','changes_requested']);

let store=null;
/** Blob storage for stills. Tests swap this with setProofStore. */
async function blobStore(){
 if(store)return store;
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'Still uploads are not configured yet.');
 const {put,get}=await import('@vercel/blob');
 store={
  async put(pathname,bytes,contentType){await put(pathname,bytes,{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType,cacheControlMaxAge:60});},
  async get(pathname){const blob=await get(pathname,{access:'private',useCache:false});if(!blob||blob.statusCode!==200)return null;return {stream:blob.stream,contentType:blob.blob.contentType};}
 };
 return store;
}
export function setProofStore(impl){store=impl;}

export const newJobId=()=>randomBytes(6).toString('hex');
export const newProofToken=()=>randomBytes(24).toString('hex');
export function jobIdValue(v){if(typeof v!=='string'||!/^[0-9a-f]{12}$/.test(v))throw new HttpError(400,'Invalid client job.');return v;}
export function tokenValue(v){if(typeof v!=='string'||!/^[a-f0-9]{48}$/.test(v))throw new HttpError(404,'This approval link is not valid.');return v;}
export function sceneValue(v){const n=Number(v);if(!Number.isInteger(n)||n<1||n>40)throw new HttpError(400,'Scene must be 1–40.');return n;}
export const stillPath=(jobId,scene,version)=>`client-proofs/${jobId}/scene-${scene}-v${version}.jpg`;

export function decodeStill(value){
 if(typeof value!=='string')throw new HttpError(400,'Choose an image.');
 const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!m)throw new HttpError(400,'Use a JPEG, PNG or WebP image.');
 const bytes=Buffer.from(m[2],'base64');
 if(bytes.length<12||bytes.length>2*1048576)throw new HttpError(413,'Each still must be no larger than 2 MB.');
 const actual=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'webp':null;
 if(actual!==m[1])throw new HttpError(400,'The image does not match its file type.');
 return {bytes,contentType:'image/'+actual};
}

const ownerFilter=gate=>gate.kind==='supabase'?'&owner_id=eq.'+encodeURIComponent(gate.user.id):'';
const ownerOf=gate=>gate.kind==='supabase'?gate.user.id:'';
const now=()=>new Date().toISOString();

async function log(jobId,kind,actor,{scene=null,round=0,detail=''}={}){
 await db('client_job_log',{method:'POST',body:{job_id:jobId,kind,actor,scene,round,detail:String(detail||'').slice(0,1000)},headers:{Prefer:'return=minimal'}});
}

export async function loadJob(gate,id){
 const rows=await db('client_jobs?id=eq.'+jobIdValue(id)+ownerFilter(gate)+'&select=*&limit=1');
 if(!rows?.[0])throw new HttpError(404,'Client job not found.');
 return rows[0];
}
async function patchJob(id,patch){
 const rows=await db('client_jobs?id=eq.'+id,{method:'PATCH',body:{...patch,updated_at:now()},headers:{Prefer:'return=representation'}});
 return rows?.[0];
}
const stillsOf=id=>db('client_job_stills?job_id=eq.'+id+'&select=*&order=scene.asc');

export function proofUrl(origin,token){return origin.replace(/\/$/,'')+'/proof/'+token;}

export function jobView(row,origin){
 return {id:row.id,couple:row.couple,clientName:row.client_name,clientPhone:row.client_phone,template:row.template,notes:row.notes,
  status:row.status,round:row.round,finalUrl:row.final_url,sentAt:row.sent_at,approvedAt:row.approved_at,dispatchedAt:row.dispatched_at,
  createdAt:row.created_at,updatedAt:row.updated_at,proofUrl:proofUrl(origin,row.proof_token)};
}
function stillView(s,src){
 return {scene:s.scene,title:s.title,caption:s.caption,version:s.version,decision:s.decision,comment:s.comment,decidedAt:s.decided_at,image:src(s)};
}

export async function createJob(gate,body,origin){
 const row={id:newJobId(),couple:text(body.couple,120,true),client_name:text(body.clientName||'',120),client_phone:text(body.clientPhone||'',32).replace(/[^\d+]/g,''),
  template:text(body.template||'',80),notes:text(body.notes||'',2000),status:'registered',round:0,proof_token:newProofToken(),owner_id:ownerOf(gate)};
 const rows=await db('client_jobs',{method:'POST',body:row,headers:{Prefer:'return=representation'}});
 await log(row.id,'registered','operator',{detail:row.couple});
 return jobView(rows?.[0]||row,origin);
}

export async function jobDetail(gate,id,origin){
 const row=await loadJob(gate,id);
 const [stills,events]=await Promise.all([stillsOf(row.id),db('client_job_log?job_id=eq.'+row.id+'&select=kind,actor,scene,round,detail,created_at&order=created_at.asc')]);
 return {job:jobView(row,origin),stills:(stills||[]).map(s=>stillView(s,x=>`/api/client-proof?action=image&id=${row.id}&scene=${x.scene}&v=${x.version}`)),log:events||[]};
}

export async function uploadStill(gate,id,scene,body){
 const row=await loadJob(gate,id);
 if(['dispatched','cancelled'].includes(row.status))throw new HttpError(409,'This job is closed.');
 const n=sceneValue(scene),photo=decodeStill(body.dataUrl);
 const existing=(await db('client_job_stills?job_id=eq.'+row.id+'&scene=eq.'+n+'&select=*&limit=1'))?.[0];
 const version=existing?existing.version+1:1;
 await (await blobStore()).put(stillPath(row.id,n,version),photo.bytes,photo.contentType);
 const still={job_id:row.id,scene:n,title:text(body.title??existing?.title??'',120),caption:text(body.caption??existing?.caption??'',600),version,decision:'pending',comment:'',decided_at:null,updated_at:now()};
 await db('client_job_stills?on_conflict=job_id,scene',{method:'POST',body:still,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
 await log(row.id,'still_uploaded','operator',{scene:n,round:row.round,detail:'v'+version});
 return {scene:n,version};
}

export async function sendForApproval(gate,id,origin){
 const row=await loadJob(gate,id);
 if(['approved','video','dispatched','cancelled'].includes(row.status))throw new HttpError(409,'Stills are already approved or the job is closed.');
 const stills=await stillsOf(row.id);
 if(!stills?.length)throw new HttpError(400,'Upload at least one still first.');
 if(!stills.some(s=>s.decision!=='approved'))throw new HttpError(400,'Every still is already approved.');
 const updated=await patchJob(row.id,{status:'stills_review',round:row.round+1,sent_at:now()});
 await log(row.id,'sent','operator',{round:row.round+1,detail:stills.filter(s=>s.decision!=='approved').length+' stills'});
 return jobView(updated||row,origin);
}

export async function setStatus(gate,id,body,origin){
 const row=await loadJob(gate,id),status=body.status;
 if(!OPERATOR_STATUS.has(status))throw new HttpError(400,'Choose approved, video, dispatched or cancelled.');
 const patch={status};
 if(status==='approved')patch.approved_at=now();
 if(status==='dispatched'){
  const url=text(body.finalUrl||'',500);
  if(url&&!/^https:\/\//.test(url))throw new HttpError(400,'Final link must start with https://');
  patch.final_url=url;patch.dispatched_at=now();
 }
 const updated=await patchJob(row.id,patch);
 await log(row.id,status==='approved'?'approved':status,'operator',{round:row.round,detail:patch.final_url||text(body.note||'',300)});
 return jobView(updated||row,origin);
}

export async function rotateLink(gate,id,origin){
 const row=await loadJob(gate,id);
 const updated=await patchJob(row.id,{proof_token:newProofToken()});
 await log(row.id,'link_rotated','operator',{round:row.round});
 return jobView(updated||row,origin);
}

export async function listJobs(gate,origin){
 const rows=await db('client_jobs?select=*&order=updated_at.desc&limit=200'+ownerFilter(gate))||[];
 const ids=rows.map(r=>r.id);
 const events=ids.length?await db('client_job_log?job_id=in.('+ids.join(',')+')&kind=in.(sent,approved,change,dispatched)&select=job_id,kind,scene,round,created_at&order=created_at.asc')||[]:[];
 const stills=ids.length?await db('client_job_stills?job_id=in.('+ids.join(',')+')&select=job_id,scene,title,decision')||[]:[];
 return {jobs:rows.map(r=>({...jobView(r,origin),...progressOf(stills.filter(s=>s.job_id===r.id))})),insights:insights(rows,events,stills)};
}

function progressOf(stills){
 return {stillCount:stills.length,approvedCount:stills.filter(s=>s.decision==='approved').length,changeCount:stills.filter(s=>s.decision==='change').length};
}

const hours=ms=>Math.round(ms/36e5*10)/10;
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:null;
export function insights(rows,events,stills){
 const byStatus=Object.fromEntries(STATUSES.map(s=>[s,0]));
 for(const r of rows)byStatus[r.status]=(byStatus[r.status]||0)+1;
 const firstSent={},firstApproved={},firstDispatched={};
 for(const e of events){
  const t=Date.parse(e.created_at);
  if(e.kind==='sent'&&!(e.job_id in firstSent))firstSent[e.job_id]=t;
  if(e.kind==='approved'&&e.scene==null&&!(e.job_id in firstApproved))firstApproved[e.job_id]=t;
  if(e.kind==='dispatched'&&!(e.job_id in firstDispatched))firstDispatched[e.job_id]=t;
 }
 const approvedRows=rows.filter(r=>r.id in firstApproved);
 const toApprove=approvedRows.filter(r=>r.id in firstSent).map(r=>hours(firstApproved[r.id]-firstSent[r.id]));
 const toDispatch=rows.filter(r=>r.id in firstDispatched&&r.id in firstApproved).map(r=>hours(firstDispatched[r.id]-firstApproved[r.id]));
 const titleOf={};for(const s of stills)titleOf[s.job_id+':'+s.scene]=s.title;
 const changed={};
 for(const e of events.filter(e=>e.kind==='change')){const key=titleOf[e.job_id+':'+e.scene]||('Scene '+e.scene);changed[key]=(changed[key]||0)+1;}
 return {
  total:rows.length,byStatus,
  awaitingClient:byStatus.stills_review,
  needsWork:byStatus.changes_requested,
  readyForVideo:byStatus.approved,
  avgRoundsToApproval:avg(approvedRows.map(r=>r.round)),
  firstPassApprovalRate:approvedRows.length?Math.round(approvedRows.filter(r=>r.round<=1).length/approvedRows.length*100):null,
  avgHoursToApproval:avg(toApprove),
  avgHoursApprovalToDispatch:avg(toDispatch),
  topChangedScenes:Object.entries(changed).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([title,count])=>({title,count}))
 };
}

async function jobByToken(token){
 const rows=await db('client_jobs?proof_token=eq.'+tokenValue(token)+'&select=*&limit=1');
 const row=rows?.[0];
 if(!row||row.status==='registered'||row.status==='cancelled')throw new HttpError(404,'This approval link is not ready or has been closed.');
 return row;
}

export async function clientProof(token){
 const row=await jobByToken(token);
 const stills=await stillsOf(row.id);
 return {couple:row.couple,status:row.status,round:row.round,canReview:REVIEWABLE.has(row.status),
  finalUrl:row.status==='dispatched'?row.final_url:'',
  stills:(stills||[]).map(s=>stillView(s,x=>`/api/client-proof?action=proof-image&token=${token}&scene=${x.scene}&v=${x.version}`))};
}

export async function clientDecide(token,body){
 const row=await jobByToken(token);
 if(!REVIEWABLE.has(row.status))throw new HttpError(409,'These stills are no longer open for review.');
 if(!Array.isArray(body.decisions)||!body.decisions.length||body.decisions.length>40)throw new HttpError(400,'Choose approve or change for at least one scene.');
 const stills=await stillsOf(row.id),byScene=new Map((stills||[]).map(s=>[s.scene,s]));
 const seen=new Set();
 for(const d of body.decisions){
  const scene=sceneValue(d?.scene),still=byScene.get(scene);
  if(!still||seen.has(scene))throw new HttpError(400,'Unknown or repeated scene.');
  seen.add(scene);
  if(!['approved','change'].includes(d.decision))throw new HttpError(400,'Choose approve or change.');
  if(d.decision==='change'&&!String(d.comment||'').trim())throw new HttpError(400,`Tell us what to change in scene ${scene}.`);
  if(d.version!==undefined&&Number(d.version)!==still.version)throw new HttpError(409,'A newer version of a still was uploaded. Please reload the page.');
 }
 const at=now();
 for(const d of body.decisions){
  const scene=Number(d.scene),comment=d.decision==='change'?text(String(d.comment),1000,true):'';
  await db('client_job_stills?job_id=eq.'+row.id+'&scene=eq.'+scene,{method:'PATCH',body:{decision:d.decision,comment,decided_at:at,updated_at:at},headers:{Prefer:'return=minimal'}});
  byScene.get(scene).decision=d.decision;
  await log(row.id,d.decision==='approved'?'approved':'change','client',{scene,round:row.round,detail:comment});
 }
 const all=[...byScene.values()];
 const status=all.every(s=>s.decision==='approved')?'approved':all.some(s=>s.decision==='change')?'changes_requested':'stills_review';
 const patch={status};if(status==='approved')patch.approved_at=at;
 await patchJob(row.id,patch);
 await log(row.id,'client_submit','client',{round:row.round,detail:`${all.filter(s=>s.decision==='approved').length}/${all.length} approved`});
 if(status==='approved')await log(row.id,'approved','client',{round:row.round,detail:'all stills approved'});
 return {status,approved:all.filter(s=>s.decision==='approved').length,total:all.length};
}

export async function streamStill(jobId,scene,version){
 const s=(await db('client_job_stills?job_id=eq.'+jobId+'&scene=eq.'+sceneValue(scene)+'&select=version&limit=1'))?.[0];
 if(!s)throw new HttpError(404,'Still not found.');
 const v=version?Number(version):s.version;
 if(!Number.isInteger(v)||v<1||v>s.version)throw new HttpError(404,'Still not found.');
 const blob=await (await blobStore()).get(stillPath(jobId,sceneValue(scene),v));
 if(!blob)throw new HttpError(404,'Still not found.');
 return blob;
}
export async function streamClientStill(token,scene,version){
 const row=await jobByToken(token);
 return streamStill(row.id,scene,version);
}
