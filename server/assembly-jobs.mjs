import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {HttpError} from './core.mjs';

export function newJobId(){
 return randomBytes(6).toString('hex');
}

export function newCallbackSecret(){
 return randomBytes(24).toString('hex');
}

export function hashSecret(secret){
 return createHash('sha256').update(String(secret||'')).digest('hex');
}

export function secretsMatch(provided,storedHash){
 const actual=hashSecret(provided);
 if(typeof storedHash!=='string'||storedHash.length!==64)return false;
 try{
  return timingSafeEqual(Buffer.from(actual,'utf8'),Buffer.from(storedHash,'utf8'));
 }catch{
  return false;
 }
}

export function assemblyBranchName(cloneId){
 const id=String(cloneId||'').trim();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw new HttpError(400,'Invalid clone id for branch.');
 return 'assembly/'+id;
}

export function githubTreeUrl(cloneId,repo='hardwin/findmyinvite'){
 return 'https://github.com/'+repo+'/tree/'+assemblyBranchName(cloneId);
}

export function githubCompareUrl(cloneId,repo='hardwin/findmyinvite'){
 return 'https://github.com/'+repo+'/compare/main...'+assemblyBranchName(cloneId);
}

export function vercelPreviewUrl(cloneId,env=process.env){
 const branch=assemblyBranchName(cloneId).replace(/\//g,'-');
 const template=String(env.ASSEMBLY_PREVIEW_HOST||'');
 if(template.includes('{branch}'))return template.replaceAll('{branch}',branch);
 if(template)return template.replace(/\/$/,'')+'/invite/demo?template='+cloneId;
 const project=String(env.VERCEL_PROJECT_NAME||'findmyinvite');
 const team=String(env.VERCEL_TEAM_SLUG||'hardwins-projects');
 return 'https://'+project+'-git-'+branch+'-'+team+'.vercel.app';
}

export function viewFromRow(row){
 if(!row)return null;
 const assets=row.assets&&typeof row.assets==='object'?row.assets:{};
 const prompts=assets.prompts&&typeof assets.prompts==='object'?assets.prompts:null;
 return {
  jobId:row.id,
  status:row.status,
  phase:row.phase,
  percent:row.percent,
  label:row.label,
  detail:row.detail||'',
  displayName:row.input?.displayName||'',
  parentId:row.input?.parentId||'',
  pinUrl:row.input?.pinUrl||'',
  cloneId:row.clone_id||null,
  demo:row.demo||null,
  branch:row.branch||null,
  githubUrl:row.github_url||null,
  previewUrl:row.preview_url||null,
  spend:row.spend||{budget:0,used:0,remaining:0},
  palette:row.palette||null,
  assets,
  prompts,
  written:row.written||[],
  moderationStop:Boolean(row.moderation_stop),
  error:row.error||null,
  cancelRequested:Boolean(row.cancel_requested),
  publishRequested:Boolean(assets.publishRequested),
  createdAt:row.created_at?Date.parse(row.created_at):0,
  updatedAt:row.updated_at?Date.parse(row.updated_at):0,
  sandboxId:row.sandbox_id||null
 };
}

async function jobsRequest(path,{method='GET',body,headers={},env=process.env,fetchImpl=fetch}={}){
 const base=String(env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw new HttpError(503,'Assembly jobs store is not configured.');
 if(!/qqvcptjkfcjkwbkookcm/.test(base))throw new HttpError(503,'Assembly jobs must use FindMyInvite Supabase qqvcptjkfcjkwbkookcm.');
 const response=await fetchImpl(base+'/rest/v1/'+path,{
  method,
  headers:{
   apikey:key,
   Authorization:'Bearer '+key,
   'Content-Type':'application/json',
   Prefer:'return=representation',
   ...headers
  },
  body:body===undefined?undefined:JSON.stringify(body)
 });
 if(!response.ok){
  console.error('assembly_jobs request failed',response.status);
  throw new HttpError(503,'Could not update the Assembly job.');
 }
 const raw=await response.text();
 return raw?JSON.parse(raw):null;
}

export async function insertAssemblyJob(row,{env=process.env,fetchImpl=fetch}={}){
 const stored={
  id:row.id,
  status:row.status||'queued',
  phase:row.phase||'queued',
  percent:row.percent||0,
  label:row.label||'Queued…',
  detail:row.detail||'',
  input:row.input||{},
  spend:row.spend||{},
  palette:row.palette||null,
  assets:row.assets||{},
  written:row.written||[],
  clone_id:row.cloneId||null,
  demo:row.demo||null,
  branch:row.branch||null,
  github_url:row.githubUrl||null,
  preview_url:row.previewUrl||null,
  sandbox_id:row.sandboxId||null,
  callback_secret:row.callbackSecretHash,
  cancel_requested:false,
  moderation_stop:false,
  error:null
 };
 const rows=await jobsRequest('assembly_jobs',{method:'POST',body:stored,env,fetchImpl});
 return viewFromRow(Array.isArray(rows)?rows[0]:rows);
}

export async function getAssemblyJob(jobId,{env=process.env,fetchImpl=fetch}={}){
 const id=String(jobId||'');
 if(!/^[0-9a-f]{8,32}$/.test(id))return null;
 const rows=await jobsRequest('assembly_jobs?id=eq.'+id+'&select=*&limit=1',{env,fetchImpl});
 return Array.isArray(rows)&&rows[0]?rows[0]:null;
}

export async function listAssemblyJobs({env=process.env,fetchImpl=fetch,limit=20}={}){
 const rows=await jobsRequest('assembly_jobs?select=id,status,phase,percent,label,detail,input,spend,palette,assets,written,clone_id,demo,branch,github_url,preview_url,sandbox_id,cancel_requested,moderation_stop,error,created_at,updated_at&order=updated_at.desc&limit='+limit,{env,fetchImpl});
 return (Array.isArray(rows)?rows:[]).map(viewFromRow);
}

export async function patchAssemblyJob(jobId,patch,{env=process.env,fetchImpl=fetch}={}){
 const body={updated_at:new Date().toISOString()};
 if(patch.status!=null)body.status=patch.status;
 if(patch.phase!=null)body.phase=patch.phase;
 if(patch.percent!=null)body.percent=patch.percent;
 if(patch.label!=null)body.label=patch.label;
 if(patch.detail!=null)body.detail=patch.detail;
 if(patch.spend!=null)body.spend=patch.spend;
 if(patch.palette!==undefined)body.palette=patch.palette;
 if(patch.assets!=null)body.assets=patch.assets;
 if(patch.written!=null)body.written=patch.written;
 if(patch.cloneId!==undefined)body.clone_id=patch.cloneId;
 if(patch.demo!==undefined)body.demo=patch.demo;
 if(patch.branch!==undefined)body.branch=patch.branch;
 if(patch.githubUrl!==undefined)body.github_url=patch.githubUrl;
 if(patch.previewUrl!==undefined)body.preview_url=patch.previewUrl;
 if(patch.sandboxId!==undefined)body.sandbox_id=patch.sandboxId;
 if(patch.cancelRequested!=null)body.cancel_requested=Boolean(patch.cancelRequested);
 if(patch.moderationStop!=null)body.moderation_stop=Boolean(patch.moderationStop);
 if(patch.error!==undefined)body.error=patch.error;
 const rows=await jobsRequest('assembly_jobs?id=eq.'+encodeURIComponent(jobId),{method:'PATCH',body,env,fetchImpl});
 return viewFromRow(Array.isArray(rows)?rows[0]:rows);
}
