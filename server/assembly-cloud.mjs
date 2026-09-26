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
 discardAssemblyJob,
 secretsMatch,
 vercelPreviewUrl,
 viewFromRow
} from './assembly-jobs.mjs';

export const ASSEMBLY_INPUT_FILE='/tmp/assembly-input.json';
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
  ASSEMBLY_INPUT_FILE,
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

export function sandboxLaunchError(error,env=process.env){
 const detail=error?.json?.error;
 const message=typeof detail==='string'?detail:(detail?.message||error?.json?.message||error?.message||'Could not start Vercel Sandbox.');
 const code=detail?.code||error?.json?.code;
 const status=error?.response?.status;
 let safe='Cloud worker startup failed'+(status?' (HTTP '+status+')':'')+': '+(code?code+' — ':'')+message;
 for(const [key,value] of Object.entries(env)){
  if(/TOKEN|SECRET|KEY|PASSWORD/i.test(key)&&typeof value==='string'&&value.length>=6)safe=safe.split(value).join('[redacted]');
 }
 return safe.slice(0,900);
}

export async function defaultLaunchSandbox({jobId,secret,input,env=process.env,fetchImpl=fetch,createSandbox}){
 const create=createSandbox||((await import('@vercel/sandbox')).Sandbox.create);
 const snapshotId=env.ASSEMBLY_FFMPEG_SNAPSHOT_ID;
 const sandbox=await create({
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
  // Detailed approved prompts exceed Sandbox's 4KB environment limit. Transfer
  // job data intact via its filesystem, before the worker can start.
  await sandbox.writeFiles([{path:ASSEMBLY_INPUT_FILE,content:Buffer.from(JSON.stringify(input))}]);
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
   const message=sandboxLaunchError(error,env);
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

export async function discardCloudTemplate1Job(jobId,{env=process.env,fetchImpl=fetch}={}){
 return discardAssemblyJob(jobId,{env,fetchImpl});
}

/** True when operator can re-launch the same job id from saved input. */
export function cloudJobCanRetry(row){
 if(!row)return false;
 const status=String(row.status||'');
 // Preview/review are past the point of a full re-run; use Resume push / Approve instead.
 if(status==='preview'||status==='discarded'||status==='review')return false;
 // Failed/cancelled always. Running/queued also — sandbox can hang mid-pin with no error.
 if(status==='failed'||status==='cancelled'||status==='running'||status==='queued')return true;
 return false;
}

/**
 * Re-run a failed/stuck cloud Template 1 job with the same jobId + saved input.
 * Resets progress, spins a fresh sandbox, continues the workflow from pin/prompts.
 */
export async function retryCloudTemplate1Job(jobId,{env=process.env,fetchImpl=fetch,launchImpl=defaultLaunchSandbox}={}){
 if(!cloudAssemblyEnabled(env)){
  throw new HttpError(503,'Cloud Assembly is not configured ('+cloudMissing(env).join(', ')+').');
 }
 const id=String(jobId||'');
 const row=await getAssemblyJob(id,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 if(!cloudJobCanRetry(row)){
  throw new HttpError(409,'Only failed or stuck jobs can be retried. Use Resume push if GitHub push stalled.');
 }
 const input=validateTemplate1Input(row.input||{});
 const secret=newCallbackSecret();
 const budget=Number(input.budgetUsd)||Number(row.spend?.budget)||4;
 const view=await patchAssemblyJob(id,{
  status:'queued',
  phase:'queued',
  percent:0,
  label:'Retrying…',
  detail:'Re-launching Vercel Sandbox…',
  spend:{budget,used:0,remaining:budget},
  palette:null,
  assets:{},
  written:[],
  cloneId:null,
  demo:null,
  branch:null,
  githubUrl:null,
  previewUrl:null,
  sandboxId:null,
  cancelRequested:false,
  moderationStop:false,
  error:null,
  callbackSecretHash:hashSecret(secret)
 },{env,fetchImpl});

 schedule((async()=>{
  try{
   const sandboxId=await launchImpl({jobId:id,secret,input,env,fetchImpl});
   if(sandboxId){
    await patchAssemblyJob(id,{sandboxId,status:'running'},{env,fetchImpl});
   }
  }catch(error){
   const message=sandboxLaunchError(error,env);
   console.error('cloud assembly retry launch failed',id,message);
   await reportLaunchFailure(id,secret,message,{env,fetchImpl});
  }
 })());

 return {jobId:id,spend:view?.spend||{budget,used:0,remaining:budget},cloud:true,retried:true};
}

/** Resume after a git-push failure: reuse the live Sandbox tree (no re-gen). */
export async function resumeCloudPush(jobId,{env=process.env,fetchImpl=fetch}={}){
 if(!cloudAssemblyEnabled(env)){
  throw new HttpError(503,'Cloud Assembly is not configured ('+cloudMissing(env).join(', ')+').');
 }
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 const cloneId=String(row.clone_id||'').trim();
 const sandboxId=String(row.sandbox_id||'').trim();
 if(!cloneId)throw new HttpError(400,'This job has no assembled clone to push.');
 if(!sandboxId)throw new HttpError(400,'Sandbox id missing — cannot resume push. Re-run Template 1.');
 const token=String(env.ASSEMBLY_GITHUB_TOKEN||'');
 if(!token)throw new HttpError(503,'ASSEMBLY_GITHUB_TOKEN missing.');
 const lineage=attachLineage(cloneId,env);
 const written=Array.isArray(row.written)?row.written:[];

 await patchAssemblyJob(jobId,{
  status:'running',
  phase:'assemble',
  percent:95,
  label:'Pushing GitHub branch…',
  detail:'Resuming push on '+sandboxId,
  error:null,
  branch:lineage.branch,
  githubUrl:lineage.githubUrl,
  previewUrl:lineage.previewUrl,
  demo:lineage.demo
 },{env,fetchImpl});

 const {Sandbox}=await import('@vercel/sandbox');
 let sandbox;
 try{
  sandbox=await Sandbox.get({sandboxId,...sandboxCredentials(env)});
 }catch(error){
  const message=error instanceof Error?error.message:'Sandbox no longer available.';
  await patchAssemblyJob(jobId,{status:'failed',phase:'failed',error:message,detail:message},{env,fetchImpl});
  throw new HttpError(410,'Sandbox expired — re-run Template 1. ('+message.slice(0,120)+')');
 }
 try{
  if(typeof sandbox.extendTimeout==='function'){
   await sandbox.extendTimeout(30*60*1000).catch(()=>{});
  }
  const fileArgs=written
   .filter(path=>path&&!String(path).startsWith('work/')&&!String(path).includes('.env'))
   .slice(0,80);
  const addCmd=fileArgs.length
   ?('git add -- '+fileArgs.map(p=>"'"+String(p).replace(/'/g,"'\\''")+"'").join(' '))
   :'git add -A';
  const script=[
   'set -euo pipefail',
   'cd findmyinvite 2>/dev/null || true',
   'pwd',
   'git status --short | head -40',
   'git checkout -B '+lineage.branch,
   addCmd,
   'git status --short | head -40',
   'git commit -m "Assemble '+cloneId+' (Template 1 cloud preview)" || true',
   'git push -u "https://x-access-token:${ASSEMBLY_GITHUB_TOKEN}@github.com/'+REPO+'.git" '+lineage.branch,
   'echo PUSH_OK'
  ].join('\n');
  const result=await sandbox.runCommand({
   cmd:'bash',
   args:['-lc',script],
   env:{
    ASSEMBLY_GITHUB_TOKEN:token,
    GIT_AUTHOR_NAME:'Akay Assembly',
    GIT_AUTHOR_EMAIL:'akay-assembly@findmyinvite.com',
    GIT_COMMITTER_NAME:'Akay Assembly',
    GIT_COMMITTER_EMAIL:'akay-assembly@findmyinvite.com'
   }
  });
  const code=typeof result?.exitCode==='number'?result.exitCode:(typeof result?.exit==='number'?result.exit:0);
  if(code!==0){
   const stderr=typeof result?.stderr==='function'?await result.stderr():String(result?.stderr||'');
   const stdout=typeof result?.stdout==='function'?await result.stdout():String(result?.stdout||'');
   throw new Error((stderr||stdout||'git push exited '+code).slice(0,700));
  }
 }catch(error){
  const message=error instanceof Error?error.message:'Resume push failed.';
  await patchAssemblyJob(jobId,{status:'failed',phase:'failed',error:message,detail:message},{env,fetchImpl});
  throw new HttpError(503,message.slice(0,300));
 }

 return patchAssemblyJob(jobId,{
  status:'preview',
  phase:'preview',
  percent:100,
  label:'Preview ready — say notes / regen / Publish',
  detail:'Clone '+cloneId+' on '+lineage.branch,
  error:null,
  cloneId,
  demo:lineage.demo,
  branch:lineage.branch,
  githubUrl:lineage.githubUrl,
  previewUrl:lineage.previewUrl
 },{env,fetchImpl});
}

export function applyWorkerPatch(body={}){
 const patch={};
 if(typeof body.status==='string')patch.status=body.status;
 if(typeof body.phase==='string')patch.phase=body.phase;
 if(Number.isFinite(Number(body.percent)))patch.percent=Math.max(0,Math.min(100,Number(body.percent)));
 if(typeof body.label==='string')patch.label=body.label.slice(0,200);
 if(typeof body.detail==='string')patch.detail=body.detail.slice(0,700);
 if(body.spend&&typeof body.spend==='object')patch.spend=body.spend;
 if(body.palette&&typeof body.palette==='object')patch.palette=body.palette;
 if(typeof body.cloneId==='string')patch.cloneId=body.cloneId;
 if(typeof body.demo==='string')patch.demo=body.demo;
 if(Array.isArray(body.written))patch.written=body.written.slice(0,80);
 if(body.moderationStop!=null)patch.moderationStop=Boolean(body.moderationStop);
 if(body.error===null||typeof body.error==='string')patch.error=body.error===null?null:body.error.slice(0,900);
 if(typeof body.branch==='string')patch.branch=body.branch;
 if(typeof body.githubUrl==='string')patch.githubUrl=body.githubUrl;
 if(typeof body.previewUrl==='string')patch.previewUrl=body.previewUrl;
 if(body.prompts&&typeof body.prompts==='object')patch.prompts=sanitizePrompts(body.prompts);
 if(body.assets&&typeof body.assets==='object')patch.assets=body.assets;
 return patch;
}

function sanitizePrompts(prompts){
 const out={};
 for(const key of ['first','last','lastRegen','plate1','plate2','heroStill','heroVideo','opening','source']){
  if(typeof prompts[key]==='string'&&prompts[key])out[key]=prompts[key].slice(0,8000);
 }
 return Object.keys(out).length?out:null;
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
 if(patch.prompts||patch.assets){
  const current=row.assets&&typeof row.assets==='object'?{...row.assets}:{};
  if(patch.assets)Object.assign(current,patch.assets);
  if(patch.prompts)current.prompts=patch.prompts;
  patch.assets=current;
  delete patch.prompts;
 }
 return patchAssemblyJob(jobId,patch,{env,fetchImpl});
}

export async function requestPublishCloudJob(jobId,{env=process.env,fetchImpl=fetch}={}){
 // Back-compat alias — same as addToCatalog.
 return addCloneToCatalog(jobId,{env,fetchImpl});
}

/** Upsert template_catalog via service_role already on Vercel. No pasted SQL. */
export async function addCloneToCatalog(jobId,{env=process.env,fetchImpl=fetch}={}){
 const row=await getAssemblyJob(jobId,{env,fetchImpl});
 if(!row)throw new HttpError(404,'Job not found.');
 const cloneId=String(row.clone_id||'').trim();
 if(!cloneId)throw new HttpError(400,'This job has no clone id yet.');
 const base=String(env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw new HttpError(503,'Supabase service role is not configured on this host.');
 if(!/qqvcptjkfcjkwbkookcm/.test(base))throw new HttpError(503,'Catalogue writes must use FindMyInvite Supabase qqvcptjkfcjkwbkookcm.');

 const name=String(row.input?.displayName||cloneId).slice(0,80);
 const description=String(row.input?.description||'Prestigious cinematic opening with refined elegance and grandeur').slice(0,240);
 const sortOrder=Number.isFinite(Number(row.input?.sortOrder))?Number(row.input.sortOrder):25;
 const payload={
  id:cloneId,
  name,
  description,
  collection:'royal',
  badge:'New',
  sort_order:sortOrder,
  published:true,
  updated_at:new Date().toISOString()
 };
 const response=await fetchImpl(base+'/rest/v1/template_catalog?on_conflict=id',{
  method:'POST',
  headers:{
   apikey:key,
   Authorization:'Bearer '+key,
   'Content-Type':'application/json',
   Prefer:'resolution=merge-duplicates,return=representation'
  },
  body:JSON.stringify(payload)
 });
 if(!response.ok){
  const text=await response.text().catch(()=>'');
  console.error('template_catalog upsert failed',response.status,text.slice(0,300));
  throw new HttpError(503,'Could not add this clone to the live catalogue.');
 }

 const assets=row.assets&&typeof row.assets==='object'?{...row.assets}:{};
 assets.publishRequested=true;
 assets.catalogPublished=true;
 assets.catalogPublishedAt=new Date().toISOString();
 assets.mergeUrl=assets.mergeUrl||publishMergeUrl(cloneId);
 return patchAssemblyJob(jobId,{
  assets,
  detail:'Catalogue live — clone '+cloneId+' published=true. Merge PR if assets are not on main yet.'
 },{env,fetchImpl});
}

export function publishMergeUrl(cloneId,repo=REPO){
 const id=String(cloneId||'').trim();
 if(!id)return 'https://github.com/'+repo+'/pulls';
 // Known Publish PR for the first cloud reward clone.
 if(id==='royal-prestige-5')return 'https://github.com/'+repo+'/pull/29';
 return 'https://github.com/'+repo+'/compare/main...publish/'+id+'?expand=1';
}

export function assemblyMergeUrl(cloneId,repo=REPO){
 const id=String(cloneId||'').trim();
 if(!id)return 'https://github.com/'+repo+'/pulls';
 return 'https://github.com/'+repo+'/compare/main...assembly/'+id+'?expand=1';
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
