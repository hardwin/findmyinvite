/**
 * Walkthrough cloud bake — Vercel Pro Sandbox (same pattern as Assembly).
 * Operator POST /api/invite-export?action=bake → Sandbox captures hero + chapter stills,
 * Flare recreate → xAI 4s Imagine clips, stitches 720p, uploads private Blob.
 */
import {HttpError} from './core.mjs';
import {publicBakeError} from './invite-walkthrough-imagine.mjs';
import {hashSecret,newCallbackSecret,newJobId,secretsMatch} from './assembly-jobs.mjs';
import {put} from '@vercel/blob';

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

function sandboxEnv(jobId,secret,templateId,env,extra={}){
 const capture=String(extra.captureOrigin||env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
 return {
  WALKTHROUGH_CLOUD_WORKER:'1',
  WALKTHROUGH_JOB_ID:jobId,
  WALKTHROUGH_CALLBACK_SECRET:secret,
  WALKTHROUGH_CALLBACK_URL:callbackUrl(env),
  WALKTHROUGH_TEMPLATE:templateId,
  WALKTHROUGH_FORMATS:String(extra.formats||env.WALKTHROUGH_FORMATS||'video'),
  CAPTURE_ORIGIN:capture,
  SITE_ORIGIN:String(env.SITE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,''),
  BLOB_READ_WRITE_TOKEN:env.BLOB_READ_WRITE_TOKEN,
  XAI_API_KEY:env.XAI_API_KEY||'',
  REPLICATE_API_TOKEN:env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY||'',
  PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS:'1',
  ASSEMBLY_GITHUB_TOKEN:env.ASSEMBLY_GITHUB_TOKEN||env.GITHUB_TOKEN||'',
  BROWSER_WS_ENDPOINT:env.BROWSER_WS_ENDPOINT||''
 };
}

export function walkthroughWorkerBootCommand(){
 return [
  'set -euo pipefail',
  'heartbeat(){ curl -fsS -X POST "${WALKTHROUGH_CALLBACK_URL}?action=bake-progress" -H "Content-Type: application/json" -H "X-Walkthrough-Job-Id: ${WALKTHROUGH_JOB_ID}" -H "X-Walkthrough-Job-Secret: ${WALKTHROUGH_CALLBACK_SECRET}" -d "$1" || true; }',
  'heartbeat \'{"status":"running","percent":2,"label":"Sandbox up","detail":"boot started"}\'',
  // Detach the long clone+npm+chrome+worker so the function can finish.
  // Empty Sandbox (no git source) — private-repo git source never got a sandboxId.
  'cat > /tmp/walkthrough-boot.sh <<\'EOS\'',
  'set -euo pipefail',
  'heartbeat(){ curl -fsS -X POST "${WALKTHROUGH_CALLBACK_URL}?action=bake-progress" -H "Content-Type: application/json" -H "X-Walkthrough-Job-Id: ${WALKTHROUGH_JOB_ID}" -H "X-Walkthrough-Job-Secret: ${WALKTHROUGH_CALLBACK_SECRET}" -d "$1" || true; }',
  'trap \'heartbeat "{\\"status\\":\\"failed\\",\\"percent\\":0,\\"label\\":\\"Failed\\",\\"error\\":\\"boot failed\\",\\"detail\\":\\"boot failed\\"}"\' ERR',
  'WORKDIR="$HOME/fmi"',
  'mkdir -p "$WORKDIR" "$HOME/bin"',
  'export PATH="$HOME/bin:$PATH"',
  'export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1',
  'heartbeat \'{"status":"running","percent":6,"label":"Fetching main…","detail":"codeload tarball"}\'',
  'if [ -n "${ASSEMBLY_GITHUB_TOKEN:-}" ]; then',
  '  curl -fsSL -H "Authorization: Bearer ${ASSEMBLY_GITHUB_TOKEN}" "https://codeload.github.com/hardwin/findmyinvite/tar.gz/refs/heads/main" | tar -xz -C "$WORKDIR" --strip-components=1',
  'else',
  '  curl -fsSL "https://codeload.github.com/hardwin/findmyinvite/tar.gz/refs/heads/main" | tar -xz -C "$WORKDIR" --strip-components=1',
  'fi',
  'cd "$WORKDIR"',
  'test -f scripts/walkthrough-cloud-worker.mjs',
  'if [ ! -d node_modules ]; then',
  '  heartbeat \'{"status":"running","percent":10,"label":"npm ci…","detail":"installing deps"}\'',
  '  npm ci --omit=dev --loglevel=error',
  'fi',
  'heartbeat \'{"status":"running","percent":16,"label":"Chrome libs…","detail":"dnf nss/gtk for Sparticuz on Amazon Linux"}\'',
  'sudo dnf install -y nss nspr atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr libXfixes mesa-libgbm alsa-lib gtk3 libxshmfence',
  'if ! command -v ffmpeg >/dev/null 2>&1; then',
  '  heartbeat \'{"status":"running","percent":20,"label":"Linking ffmpeg…","detail":"ffmpeg-static"}\'',
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
  'heartbeat \'{"status":"running","percent":24,"label":"Capturing…","detail":"Chrome screenshots"}\'',
  'exec env PATH="$HOME/bin:$PATH" LD_LIBRARY_PATH="/tmp:${LD_LIBRARY_PATH:-}" WALKTHROUGH_CLOUD_WORKER=1 CHROMIUM_PACK=1 node scripts/walkthrough-cloud-worker.mjs',
  'EOS',
  'chmod +x /tmp/walkthrough-boot.sh',
  'nohup bash /tmp/walkthrough-boot.sh > /tmp/walkthrough-boot.log 2>&1 &',
  'BOOT_PID=$!',
  'echo "boot pid $BOOT_PID"',
  'sleep 4',
  'if ! kill -0 "$BOOT_PID" 2>/dev/null; then',
  '  cat /tmp/walkthrough-boot.log >&2 || true',
  '  heartbeat \'{"status":"failed","percent":0,"label":"Failed","detail":"boot exited early","error":"boot exited early"}\'',
  '  exit 1',
  'fi',
  'heartbeat \'{"status":"running","percent":4,"label":"Booting…","detail":"clone + Chrome in background"}\'',
  'echo $BOOT_PID'
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

export async function launchWalkthroughSandbox({jobId,secret,templateId,captureOrigin,formats,env=process.env}){
 const extra={captureOrigin,formats};
 const {Sandbox}=await import('@vercel/sandbox');
 const sandbox=await Sandbox.create({
  ...sandboxCredentials(env),
  runtime:'node24',
  timeout:45*60*1000,
  resources:{vcpus:4},
  env:sandboxEnv(jobId,secret,templateId,env,extra)
  // Empty VM — git source never assigned a sandboxId (clone/auth). Boot curls main.
 });
 const sandboxId=sandbox.sandboxId||null;
 await patchWalkthroughJob(jobId,{sandboxId,status:'running',percent:3,label:'Sandbox created',detail:sandboxId||''},env);
 try{
  const result=await sandbox.runCommand({
   cmd:'bash',
   args:['-lc',walkthroughWorkerBootCommand()],
   env:sandboxEnv(jobId,secret,templateId,env,extra)
  });
  const code=await commandExitCode(result);
  if(code!==0){
   const stderr=await commandText(result,'stderr');
   const stdout=await commandText(result,'stdout');
   const raw=stderr||stdout||'Sandbox boot exited '+code;
   throw Object.assign(new Error(publicBakeError(raw)),{debugError:raw.slice(0,2000)});
  }
 }catch(error){
  const raw=error instanceof Error?error.message:'Sandbox boot failed.';
  const debugError=String(error?.debugError||raw).slice(0,2000);
  const message=publicBakeError(raw);
  await patchWalkthroughJob(jobId,{status:'failed',percent:0,label:'Failed',error:message,detail:message,debugError},env).catch(()=>{});
  try{await sandbox.stop();}catch{/* */}
  throw error;
 }
 return sandboxId;
}

export async function startWalkthroughBake(templateId,{env=process.env,captureOrigin,formats}={}){
 if(!walkthroughCloudEnabled(env)){
  throw new HttpError(503,'Walkthrough cloud bake not configured: '+walkthroughCloudMissing(env).join(', '));
 }
 const id=String(templateId||'').replace(/[^a-z0-9-]/gi,'');
 if(!id)throw new HttpError(400,'Valid template id required.');
 const origin=String(captureOrigin||env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
 const jobId=newJobId();
 const secret=newCallbackSecret();
 const job={
  id:jobId,
  templateId:id,
  captureOrigin:origin,
  formats:formats||'video',
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
 schedule(launchWalkthroughSandbox({jobId,secret,templateId:id,captureOrigin:origin,formats:job.formats,env}).catch(async error=>{
  const raw=error instanceof Error?error.message:'Launch failed';
  const message=publicBakeError(raw);
  await patchWalkthroughJob(jobId,{status:'failed',percent:0,label:'Failed',error:message,detail:message,debugError:raw.slice(0,2000)},env).catch(()=>{});
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
  detail:patch.detail!=null?publicBakeError(patch.detail):job.detail,
  error:patch.error!=null?publicBakeError(patch.error):job.error,
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
