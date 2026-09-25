/**
 * Walkthrough cloud bake — Vercel Pro Sandbox (same pattern as Assembly).
 * Operator POST /api/invite-export?action=bake → Sandbox captures hero + chapter stills,
 * Flare recreate → xAI 4s Imagine clips, stitches 720p, uploads private Blob.
 */
import {HttpError} from './core.mjs';
import {hashSecret,newCallbackSecret,newJobId,secretsMatch} from './assembly-jobs.mjs';
import {put} from '@vercel/blob';

const REPO_URL='https://github.com/hardwin/findmyinvite.git';
const JOB_PREFIX='walkthrough/jobs/';

export function walkthroughCloudEnabled(env=process.env){
 return Boolean(env.BLOB_READ_WRITE_TOKEN)
  && Boolean(env.VERCEL_OIDC_TOKEN||(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID));
}

export function walkthroughCloudMissing(env=process.env){
 const missing=[];
 if(!env.BLOB_READ_WRITE_TOKEN)missing.push('BLOB_READ_WRITE_TOKEN');
 if(!(env.VERCEL_OIDC_TOKEN||(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID)))missing.push('Vercel Sandbox credentials');
 return missing;
}

function bakeSecret(env=process.env){
 return String(env.WALKTHROUGH_BAKE_SECRET||env.ASSEMBLY_CALLBACK_SECRET||env.RATE_LIMIT_SECRET||'').trim();
}

/** Operator auth for starting a bake (header or body secret). */
export function assertBakeOperator(req,body={},env=process.env){
 const expected=bakeSecret(env);
 if(!expected)throw new HttpError(503,'WALKTHROUGH_BAKE_SECRET (or ASSEMBLY_CALLBACK_SECRET) not configured.');
 const provided=String(
  req.headers['x-walkthrough-bake-secret']
  ||req.headers['x-assembly-job-secret']
  ||body.secret
  ||''
 ).trim();
 if(!provided||provided!==expected)throw new HttpError(401,'Bake secret required.');
}

export function callbackUrl(env=process.env){
 return String(env.WALKTHROUGH_CALLBACK_URL||env.ASSEMBLY_CALLBACK_URL||'https://findmyinvite.com/api/invite-export').replace(/\/$/,'');
}

function sandboxCredentials(env=process.env){
 if(env.VERCEL_TOKEN&&env.VERCEL_TEAM_ID&&env.VERCEL_PROJECT_ID){
  return {token:env.VERCEL_TOKEN,teamId:env.VERCEL_TEAM_ID,projectId:env.VERCEL_PROJECT_ID};
 }
 return {};
}

function blobToken(env=process.env){
 const t=env.BLOB_READ_WRITE_TOKEN;
 if(!t)throw new HttpError(503,'BLOB_READ_WRITE_TOKEN required.');
 return t;
}

async function putJob(job){
 await put(JOB_PREFIX+job.id+'.json',JSON.stringify(job,null,2),{
  access:'private',
  contentType:'application/json',
  token:blobToken(),
  addRandomSuffix:false,
  allowOverwrite:true,
  cacheControlMaxAge:30
 });
 return job;
}

export async function getWalkthroughJob(jobId,env=process.env){
 const id=String(jobId||'').replace(/[^a-z0-9-]/gi,'');
 if(!id)return null;
 try{
  const {get}=await import('@vercel/blob');
  const res=await get(JOB_PREFIX+id+'.json',{access:'private',token:blobToken(env)});
  if(!res||res.statusCode!==200)return null;
  return JSON.parse(await new Response(res.stream).text());
 }catch{
  return null;
 }
}

export async function patchWalkthroughJob(jobId,patch,env=process.env){
 const cur=await getWalkthroughJob(jobId,env);
 if(!cur)throw new HttpError(404,'Walkthrough bake job not found.');
 const next={...cur,...patch,updatedAt:new Date().toISOString()};
 await putJob(next);
 return next;
}

function sandboxEnv(jobId,secret,templateId,env){
 return {
  WALKTHROUGH_CLOUD_WORKER:'1',
  WALKTHROUGH_JOB_ID:jobId,
  WALKTHROUGH_CALLBACK_SECRET:secret,
  WALKTHROUGH_CALLBACK_URL:callbackUrl(env),
  WALKTHROUGH_TEMPLATE:templateId,
  CAPTURE_ORIGIN:String(env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,''),
  BLOB_READ_WRITE_TOKEN:env.BLOB_READ_WRITE_TOKEN,
  PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS:'1',
  BROWSER_WS_ENDPOINT:env.BROWSER_WS_ENDPOINT||''
 };
}

export function walkthroughWorkerBootCommand(){
 return [
  'set -euo pipefail',
  'cd findmyinvite 2>/dev/null || true',
  'pwd',
  'ls -la scripts/walkthrough-cloud-worker.mjs',
  'heartbeat(){ curl -fsS -X POST "${WALKTHROUGH_CALLBACK_URL}?action=bake-progress" -H "Content-Type: application/json" -H "X-Walkthrough-Job-Id: ${WALKTHROUGH_JOB_ID}" -H "X-Walkthrough-Job-Secret: ${WALKTHROUGH_CALLBACK_SECRET}" -d "$1" || true; }',
  'heartbeat \'{"status":"running","percent":2,"label":"Sandbox up","detail":"boot started"}\'',
  'mkdir -p "$HOME/bin"',
  'export PATH="$HOME/bin:$PATH"',
  'export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1',
  'if [ ! -d node_modules ]; then',
  '  heartbeat \'{"status":"running","percent":8,"label":"npm ci…","detail":"installing deps"}\'',
  '  npm ci --omit=dev',
  'fi',
  'heartbeat \'{"status":"running","percent":12,"label":"Playwright chromium…","detail":"skip host deps validation"}\'',
  'npm install playwright@1.49.1 --no-save --no-fund --no-audit',
  'npx playwright install chromium',
  'if ! command -v ffmpeg >/dev/null 2>&1; then',
  '  heartbeat \'{"status":"running","percent":18,"label":"Linking ffmpeg…","detail":"ffmpeg-static"}\'',
  '  node --input-type=module <<\'NODE\'',
  'import {copyFileSync,chmodSync,mkdirSync} from "node:fs";',
  'import {join} from "node:path";',
  'import {homedir} from "node:os";',
  'import {createRequire} from "node:module";',
  'const require=createRequire(import.meta.url);',
  'const bin=join(homedir(),"bin");',
  'mkdirSync(bin,{recursive:true});',
  'const ffmpeg=require("ffmpeg-static");',
  'if(!ffmpeg)throw new Error("ffmpeg-static missing");',
  'copyFileSync(ffmpeg,join(bin,"ffmpeg"));',
  'chmodSync(join(bin,"ffmpeg"),0o755);',
  'try{const ffprobe=require("ffprobe-static").path;copyFileSync(ffprobe,join(bin,"ffprobe"));chmodSync(join(bin,"ffprobe"),0o755);}catch{}',
  'NODE',
  'fi',
  'heartbeat \'{"status":"running","percent":22,"label":"Starting worker…","detail":"playwright chromium + walkthrough worker"}\'',
  // Prefer stock Playwright chromium in Sandbox (recordVideo). Sparticuz is fallback if PLAYWRIGHT fails.
  'nohup env PATH="$HOME/bin:$PATH" PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 WALKTHROUGH_CLOUD_WORKER=1 node scripts/walkthrough-cloud-worker.mjs > /tmp/walkthrough-worker.log 2>&1 &',
  'WORKER_PID=$!',
  'echo "worker pid $WORKER_PID"',
  'sleep 6',
  'if ! kill -0 "$WORKER_PID" 2>/dev/null; then',
  '  cat /tmp/walkthrough-worker.log >&2 || true',
  '  heartbeat \'{"status":"failed","percent":0,"label":"Failed","detail":"worker exited early","error":"worker exited early"}\'',
  '  exit 1',
  'fi',
  'heartbeat \'{"status":"running","percent":25,"label":"Worker alive","detail":"capturing"}\'',
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

const pendingLaunches=[];

function schedule(promise){
 const tracked=Promise.resolve(promise).catch(error=>{
  console.error('walkthrough sandbox launch failed',error?.message||error);
 });
 pendingLaunches.push(tracked);
 try{
  import('@vercel/functions').then(({waitUntil})=>{
   if(typeof waitUntil==='function')waitUntil(tracked);
  }).catch(()=>{});
 }catch{/* local */}
 return tracked;
}

export async function launchWalkthroughSandbox({jobId,secret,templateId,env=process.env}){
 const {Sandbox}=await import('@vercel/sandbox');
 const snapshotId=env.ASSEMBLY_FFMPEG_SNAPSHOT_ID;
 const sandbox=await Sandbox.create({
  ...sandboxCredentials(env),
  runtime:'node24',
  timeout:45*60*1000,
  resources:{vcpus:4},
  env:sandboxEnv(jobId,secret,templateId,env),
  source:snapshotId
   ?{type:'snapshot',snapshotId}
   :{type:'git',url:REPO_URL,depth:1,revision:'main'}
 });
 const sandboxId=sandbox.sandboxId||null;
 await patchWalkthroughJob(jobId,{sandboxId,status:'running',percent:3,label:'Sandbox created',detail:sandboxId||''},env);
 try{
  const result=await sandbox.runCommand({
   cmd:'bash',
   args:['-lc',walkthroughWorkerBootCommand()],
   env:sandboxEnv(jobId,secret,templateId,env)
  });
  const code=await commandExitCode(result);
  if(code!==0){
   const stderr=await commandText(result,'stderr');
   const stdout=await commandText(result,'stdout');
   throw new Error((stderr||stdout||'Sandbox boot exited '+code).slice(0,700));
  }
 }catch(error){
  const message=error instanceof Error?error.message:'Sandbox boot failed.';
  await patchWalkthroughJob(jobId,{status:'failed',percent:0,label:'Failed',error:message,detail:message},env).catch(()=>{});
  try{await sandbox.stop();}catch{/* */}
  throw error;
 }
 return sandboxId;
}

export async function startWalkthroughBake(templateId,{env=process.env}={}){
 if(!walkthroughCloudEnabled(env)){
  throw new HttpError(503,'Walkthrough cloud bake not configured: '+walkthroughCloudMissing(env).join(', '));
 }
 const id=String(templateId||'').replace(/[^a-z0-9-]/gi,'');
 if(!id)throw new HttpError(400,'Valid template id required.');
 const jobId=newJobId();
 const secret=newCallbackSecret();
 const job={
  id:jobId,
  templateId:id,
  status:'queued',
  percent:0,
  label:'Queued',
  detail:'Launching Sandbox…',
  secretHash:hashSecret(secret),
  sandboxId:null,
  error:null,
  urls:null,
  createdAt:new Date().toISOString(),
  updatedAt:new Date().toISOString()
 };
 await putJob(job);
 schedule(launchWalkthroughSandbox({jobId,secret,templateId:id,env}).catch(async error=>{
  const message=error instanceof Error?error.message:'Launch failed';
  await patchWalkthroughJob(jobId,{status:'failed',percent:0,label:'Failed',error:message,detail:message},env).catch(()=>{});
 }));
 return {jobId,status:'queued',templateId:id,secret};
}

export async function reportWalkthroughProgress(jobId,secret,patch,env=process.env){
 const job=await getWalkthroughJob(jobId,env);
 if(!job)throw new HttpError(404,'Job not found.');
 if(!secretsMatch(secret,job.secretHash))throw new HttpError(401,'Invalid job secret.');
 const next={
  status:patch.status||job.status,
  percent:typeof patch.percent==='number'?patch.percent:job.percent,
  label:patch.label||job.label,
  detail:patch.detail!=null?String(patch.detail):job.detail,
  error:patch.error!=null?String(patch.error):job.error,
  urls:patch.urls||job.urls
 };
 return patchWalkthroughJob(jobId,next,env);
}

export async function completeWalkthroughBake(jobId,secret,payload,env=process.env){
 const job=await reportWalkthroughProgress(jobId,secret,{
  status:'ready',
  percent:100,
  label:'Ready',
  detail:'Uploaded to Blob',
  urls:payload?.urls||null,
  error:null
 },env);
 return job;
}
