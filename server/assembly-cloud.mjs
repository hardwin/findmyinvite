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
 // Heartbeats use env already injected into the sandbox. Detach the long Template 1
 // worker so the serverless launch can finish; the sandbox itself stays up to 2h.
 // Sandbox images have neither apt nor xz — ship ffmpeg via npm ffmpeg-static.
 return [
  'set -euo pipefail',
  'cd findmyinvite 2>/dev/null || true',
  'pwd',
  'ls -la scripts/assembly-cloud-worker.mjs',
  'heartbeat(){ curl -fsS -X POST "${ASSEMBLY_CALLBACK_URL}?action=template1-progress" -H "Content-Type: application/json" -H "X-Assembly-Job-Id: ${ASSEMBLY_JOB_ID}" -H "X-Assembly-Job-Secret: ${ASSEMBLY_CALLBACK_SECRET}" -d "$1" || true; }',
  'heartbeat \'{"status":"running","phase":"queued","percent":1,"label":"Sandbox up","detail":"sandbox boot started"}\'',
  'mkdir -p "$HOME/bin"',
  'export PATH="$HOME/bin:$PATH"',
  'if [ ! -d node_modules/ffmpeg-static ] || [ ! -d node_modules ]; then',
  '  heartbeat \'{"status":"running","phase":"queued","percent":3,"label":"Installing npm deps…","detail":"npm ci --omit=dev (includes ffmpeg-static)"}\'',
  '  npm ci --omit=dev',
  'fi',
  'if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then',
  '  heartbeat \'{"status":"running","phase":"queued","percent":5,"label":"Linking ffmpeg…","detail":"copy ffmpeg-static + ffprobe-static into PATH"}\'',
  '  node --input-type=module <<\'NODE\'',
  'import {copyFileSync,chmodSync,mkdirSync} from "node:fs";',
  'import {join} from "node:path";',
  'import {homedir} from "node:os";',
  'import {createRequire} from "node:module";',
  'const require=createRequire(import.meta.url);',
  'const bin=join(homedir(),"bin");',
  'mkdirSync(bin,{recursive:true});',
  'const ffmpeg=require("ffmpeg-static");',
  'const ffprobe=require("ffprobe-static").path;',
  'if(!ffmpeg||!ffprobe)throw new Error("ffmpeg-static / ffprobe-static missing after npm ci");',
  'copyFileSync(ffmpeg,join(bin,"ffmpeg"));',
  'copyFileSync(ffprobe,join(bin,"ffprobe"));',
  'chmodSync(join(bin,"ffmpeg"),0o755);',
  'chmodSync(join(bin,"ffprobe"),0o755);',
  'console.log("ffmpeg",ffmpeg);',
  'console.log("ffprobe",ffprobe);',
  'NODE',
  'fi',
  'command -v ffmpeg',
  'command -v ffprobe',
  'ffmpeg -version | head -1',
  'heartbeat \'{"status":"running","phase":"pin","percent":6,"label":"Starting Template 1 worker…","detail":"node scripts/assembly-cloud-worker.mjs"}\'',
  'nohup env PATH="$HOME/bin:$PATH" node scripts/assembly-cloud-worker.mjs > /tmp/assembly-worker.log 2>&1 &',
  'WORKER_PID=$!',
  'echo "worker pid $WORKER_PID"',
  'sleep 4',
  'if ! kill -0 "$WORKER_PID" 2>/dev/null; then',
  '  echo "worker died during boot:" >&2',
  '  cat /tmp/assembly-worker.log >&2 || true',
  '  heartbeat \'{"status":"failed","phase":"failed","percent":0,"label":"Failed","detail":"worker exited before first heartbeat","error":"worker exited before first heartbeat"}\'',
  '  exit 1',
  'fi',
  'heartbeat \'{"status":"running","phase":"pin","percent":8,"label":"Worker alive","detail":"Template 1 worker detached"}\'',
  'echo $WORKER_PID'
 ].join('\n');
}

async function commandExitCode(result){
 if(!result)return 0;
 if(typeof result.exitCode==='number')return result.exitCode;
 if(typeof result.exit==='number')return result.exit;
 if(typeof result.wait==='function'){
  const finished=await result.wait();
  if(typeof finished?.exitCode==='number')return finished.exitCode;
 }
 return 0;
}

async function commandText(result,stream){
 try{
  if(typeof result?.[stream]==='function')return String(await result[stream]()||'');
  return String(result?.[stream]||'');
 }catch{
  return '';
 }
}

async function reportLaunchFailure(jobId,secret,message,{env,fetchImpl}){
 try{
  await reportCloudProgress(jobId,secret,{status:'failed',phase:'failed',percent:0,label:'Failed',detail:message,error:message},{env,fetchImpl});
 }catch(error){
  console.error('assembly launch failure report failed',error?.message||error);
  await patchAssemblyJob(jobId,{status:'failed',phase:'failed',error:message,detail:message},{env,fetchImpl}).catch(()=>{});
 }
}

export async function defaultLaunchSandbox({jobId,secret,input,env=process.env,fetchImpl=fetch}){
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
 const sandboxId=sandbox.sandboxId||null;
 await patchAssemblyJob(jobId,{sandboxId,status:'running',detail:'Sandbox '+(sandboxId||'?')+' created · booting worker'},{env,fetchImpl});
 try{
  const result=await sandbox.runCommand({
   cmd:'bash',
   args:['-lc',workerBootCommand()],
   env:sandboxEnv(jobId,secret,input,env)
  });
  const code=await commandExitCode(result);
  if(code!==0){
   const stderr=await commandText(result,'stderr');
   const stdout=await commandText(result,'stdout');
   throw new Error((stderr||stdout||'Sandbox boot exited '+code).slice(0,700));
  }
 }catch(error){
  const message=error instanceof Error?error.message:'Sandbox boot failed.';
  await reportLaunchFailure(jobId,secret,message,{env,fetchImpl});
  try{await sandbox.stop();}catch{/* ignore */}
  throw error;
 }
 // Leave the sandbox running — the detached worker owns the job for up to 2h.
 return sandboxId;
}

const pendingLaunches=[];

function schedule(promise){
 const tracked=Promise.resolve(promise).catch(error=>{
  console.error('cloud assembly scheduled launch failed',error?.message||error);
 });
 pendingLaunches.push(tracked);
 try{
  import('@vercel/functions').then(({waitUntil})=>{
   if(typeof waitUntil==='function')waitUntil(tracked);
  }).catch(()=>{});
 }catch{/* local / tests */}
 return tracked;
}

/** Test helper: flush waitUntil-scheduled sandbox launches. */
export async function flushCloudLaunches(){
 await Promise.all(pendingLaunches.splice(0,pendingLaunches.length));
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

 // Return the job id immediately; boot the sandbox under waitUntil.
 schedule((async()=>{
  try{
   const sandboxId=await launchImpl({jobId:id,secret,input,env,fetchImpl});
   if(sandboxId){
    // Keep heartbeat label/detail; only ensure sandbox id + running status stick.
    await patchAssemblyJob(id,{sandboxId,status:'running'},{env,fetchImpl});
   }
  }catch(error){
   const message=error instanceof Error?error.message:'Could not start Vercel Sandbox.';
   console.error('cloud assembly launch failed',id,message);
   await reportLaunchFailure(id,secret,message,{env,fetchImpl});
  }
 })());

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
