import {HttpError} from './core.mjs';
import {validateTemplate1Input} from './assembly-template1.mjs';
import {
 assemblyBranchName,
 githubCompareUrl,
 githubTreeUrl,
 hashSecret,
 insertAssemblyJob,
 getAssemblyJob,
 listAssemblyJobs,
 newCallbackSecret,
 newJobId,
 patchAssemblyJob,
 secretsMatch,
 vercelPreviewUrl,
 viewFromRow
} from './assembly-jobs.mjs';

const REPO='hardwin/findmyinvite';
const REPO_URL='https://github.com/hardwin/findmyinvite.git';

export function cloudAssemblyEnabled(env=process.env){
 return env.ASSEMBLY_CLOUD==='1'
  && Boolean(env.XAI_API_KEY)
  && Boolean(env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY)
  && Boolean(env.OPENAI_API_KEY)
  && Boolean(env.ASSEMBLY_GITHUB_TOKEN)
  && Boolean(env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY)
  && Boolean(env.VERCEL_OIDC_TOKEN||(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID));
}

export function cloudMissing(env=process.env){
 const missing=[];
 if(env.ASSEMBLY_CLOUD!=='1')missing.push('ASSEMBLY_CLOUD=1');
 if(!env.XAI_API_KEY)missing.push('XAI_API_KEY');
 if(!(env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY))missing.push('REPLICATE_API_TOKEN');
 if(!env.OPENAI_API_KEY)missing.push('OPENAI_API_KEY');
 if(!env.ASSEMBLY_GITHUB_TOKEN)missing.push('ASSEMBLY_GITHUB_TOKEN');
 if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)missing.push('SUPABASE service role');
 if(!(env.VERCEL_OIDC_TOKEN||(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID)))missing.push('Vercel Sandbox credentials');
 return missing;
}

export function callbackUrl(env=process.env){
 const raw=String(env.ASSEMBLY_CALLBACK_URL||'https://findmyinvite.com/api/assembly').replace(/\/$/,'');
 return raw;
}

export function sandboxCredentials(env=process.env){
 if(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID){
  return {token:env.VERCEL_TOKEN,teamId:env.VERCEL_TEAM_ID,projectId:env.VERCEL_PROJECT_ID};
 }
 return {};
}

function sandboxEnv(jobId,secret,input,env){
 return {
  ASSEMBLY_FS:'1',
  ASSEMBLY_CLOUD_WORKER:'1',
  ASSEMBLY_JOB_ID:jobId,
  ASSEMBLY_CALLBACK_SECRET:secret,
  ASSEMBLY_CALLBACK_URL:callbackUrl(env),
  ASSEMBLY_INPUT:JSON.stringify(input),
  ASSEMBLY_GITHUB_TOKEN:env.ASSEMBLY_GITHUB_TOKEN,
  ASSEMBLY_GITHUB_REPO:REPO,
  XAI_API_KEY:env.XAI_API_KEY,
  REPLICATE_API_TOKEN:env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY||'',
  OPENAI_API_KEY:env.OPENAI_API_KEY||'',
  ASSEMBLY_PROMPT_MODEL:env.ASSEMBLY_PROMPT_MODEL||'',
  GIT_AUTHOR_NAME:'Akay Assembly',
  GIT_AUTHOR_EMAIL:'akay-assembly@findmyinvite.com',
  GIT_COMMITTER_NAME:'Akay Assembly',
  GIT_COMMITTER_EMAIL:'akay-assembly@findmyinvite.com'
 };
}

export function workerBootCommand(){
 return [
  'set -euo pipefail',
  'if [ -d findmyinvite ]; then cd findmyinvite; fi',
  'if ! command -v ffmpeg >/dev/null 2>&1; then',
  '  curl -fsSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ',
  '  FFMPEG_DIR=$(echo ffmpeg-*-amd64-static)',
  '  sudo cp "$FFMPEG_DIR/ffmpeg" "$FFMPEG_DIR/ffprobe" /usr/local/bin/',
  'fi',
  'if [ ! -d node_modules ]; then npm ci --omit=dev; fi',
  'nohup node scripts/assembly-cloud-worker.mjs > /tmp/assembly-worker.log 2>&1 &',
  'echo $!'
 ].join('\n');
}

export async function defaultLaunchSandbox({jobId,secret,input,env=process.env}){
 const {Sandbox}=await import('@vercel/sandbox');
 const snapshotId=env.ASSEMBLY_FFMPEG_SNAPSHOT_ID;
 const sandbox=await Sandbox.create({
  ...sandboxCredentials(env),
  runtime:'node24',
  timeout:2*60*60*1000,
  resources:{vcpus:4},
  env:sandboxEnv(jobId,secret,input,env),
  source:snapshotId
   ?{type:'snapshot',snapshotId}
   :{type:'git',url:REPO_URL,depth:1,revision:'main'}
 });
 await sandbox.runCommand('bash',['-lc',workerBootCommand()]);
 return sandbox.sandboxId||sandbox.id||null;
}

export async function startCloudTemplate1Job(rawInput,{env=process.env,fetchImpl=fetch,launchImpl=defaultLaunchSandbox}={}){
 if(!cloudAssemblyEnabled(env)){
  throw new HttpError(503,'Cloud Assembly is not configured ('+cloudMissing(env).join(', ')+').');
 }
 const input=validateTemplate1Input(rawInput);
 const id=newJobId();
 const secret=newCallbackSecret();
 const view=await insertAssemblyJob({
  id,
  status:'queued',
  phase:'queued',
  percent:0,
  label:'Queued…',
  detail:'Starting Vercel Sandbox…',
  input,
  spend:{budget:input.budgetUsd,used:0,remaining:input.budgetUsd},
  callbackSecretHash:hashSecret(secret)
 },{env,fetchImpl});
 try{
  const sandboxId=await launchImpl({jobId:id,secret,input,env});
  if(sandboxId)await patchAssemblyJob(id,{sandboxId,status:'running',detail:'Sandbox '+sandboxId+' · worker starting'},{env,fetchImpl});
 }catch(error){
  const message=error instanceof Error?error.message:'Could not start Vercel Sandbox.';
  await patchAssemblyJob(id,{status:'failed',phase:'failed',error:message,detail:message},{env,fetchImpl});
  throw new HttpError(503,'Could not start the Assembly sandbox.');
 }
 return {jobId:id,spend:view.spend,cloud:true};
}

export async function getCloudTemplate1Job(jobId,{env=process.env,fetchImpl=fetch}={}){
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 return row?viewFromRow(row):null;
}

export async function listCloudTemplate1Jobs(opts={}){
 return listAssemblyJobs(opts);
}

export async function cancelCloudTemplate1Job(jobId,{env=process.env,fetchImpl=fetch}={}){
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 if(row.status!=='queued'&&row.status!=='running')return viewFromRow(row);
 return patchAssemblyJob(jobId,{
  cancelRequested:true,
  detail:'Cancel requested — worker will stop after the current inference call.'
 },{env,fetchImpl});
}

export function applyWorkerPatch(body={}){
 const patch={};
 if(typeof body.status==='string')patch.status=body.status;
 if(typeof body.phase==='string')patch.phase=body.phase;
 if(Number.isFinite(Number(body.percent)))patch.percent=Math.max(0,Math.min(100,Number(body.percent)));
 if(typeof body.label==='string')patch.label=body.label.slice(0,200);
 if(typeof body.detail==='string')patch.detail=body.detail.slice(0,500);
 if(body.spend&&typeof body.spend==='object')patch.spend=body.spend;
 if(body.palette&&typeof body.palette==='object')patch.palette=body.palette;
 if(typeof body.cloneId==='string')patch.cloneId=body.cloneId;
 if(typeof body.demo==='string')patch.demo=body.demo;
 if(Array.isArray(body.written))patch.written=body.written.slice(0,80);
 if(body.moderationStop!=null)patch.moderationStop=Boolean(body.moderationStop);
 if(body.error===null||typeof body.error==='string')patch.error=body.error;
 if(typeof body.branch==='string')patch.branch=body.branch;
 if(typeof body.githubUrl==='string')patch.githubUrl=body.githubUrl;
 if(typeof body.previewUrl==='string')patch.previewUrl=body.previewUrl;
 return patch;
}

export async function reportCloudProgress(jobId,secret,body,{env=process.env,fetchImpl=fetch}={}){
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 if(!secretsMatch(secret,row.callback_secret))throw new HttpError(401,'Invalid Assembly job secret.');
 const patch=applyWorkerPatch(body);
 if(typeof body.cloneId==='string'&&body.cloneId&&!patch.branch){
  patch.branch=assemblyBranchName(body.cloneId);
  patch.githubUrl=githubCompareUrl(body.cloneId,REPO);
  patch.previewUrl=vercelPreviewUrl(body.cloneId,env)+'/invite/demo?template='+body.cloneId;
  patch.demo=patch.demo||'/invite/demo?template='+body.cloneId;
 }
 return patchAssemblyJob(jobId,patch,{env,fetchImpl});
}

export async function syncCloudJob(jobId,secret,{env=process.env,fetchImpl=fetch}={}){
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 if(!secretsMatch(secret,row.callback_secret))throw new HttpError(401,'Invalid Assembly job secret.');
 return {cancelRequested:Boolean(row.cancel_requested),status:row.status};
}

export function attachLineage(cloneId,env=process.env){
 const branch=assemblyBranchName(cloneId);
 return {
  cloneId,
  branch,
  githubUrl:githubCompareUrl(cloneId,REPO),
  githubTree:githubTreeUrl(cloneId,REPO),
  previewUrl:vercelPreviewUrl(cloneId,env)+'/invite/demo?template='+cloneId,
  demo:'/invite/demo?template='+cloneId
 };
}
