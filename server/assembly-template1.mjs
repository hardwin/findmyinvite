// Template 1 job runner: pin → parallel gen → craft → assemble → preview. Never publishes.
import {randomBytes} from 'node:crypto';
import {access,mkdir,readFile,rm,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError} from './core.mjs';
import {ROOT,fsWritesAllowed,assemblePremium,loadPremiumParents,knownTemplateIds,nextCloneIds,cleanCloneName} from './assembly.mjs';
import {resolveReferenceImage,normalizeReferenceImage,resolveReplicateImageUrl} from './assembly-ai.mjs';
import {buildPrompts,writeTemplate1PromptsFromPin,styleCardToParams,TEXT_QA_PROMPT,OPENING_SECONDS,HERO_SECONDS} from './assembly-template1-prompts.mjs';
import {createLedger,estimateCost,runReplicateImage,runHeroVideo,runOpeningVideo,detectBakedText,dataUrlFromJpeg,isModerationError} from './assembly-template1-gen.mjs';
import {toStill720,craftOpening,craftHero,stagePlates,copyInto,extractPalette,assertMuted} from './assembly-template1-craft.mjs';
import {themeCss,patchThemeCss,patchPreviewDefaults,patchMusicTracks,patchDataRow,patchAppMusicOption} from './assembly-template1-theme.mjs';
import {getMusicTrack} from './music-library.mjs';
import {lookupFaceSwapSolos} from './face-swap.mjs';

export function jobsDir(root=ROOT){return join(root,'work','assembly-jobs');}
export const JOBS_DIR=jobsDir();
const jobs=new Map();

export const PHASES=['queued','pin','stills','review','gen','craft','assemble','preview'];
const PHASE_PERCENT={queued:0,pin:6,stills:18,review:36,gen:48,craft:78,assemble:90,preview:100,failed:0,cancelled:0};
const PHASE_LABEL={
 queued:'Queued…',
 pin:'Reading pin + writing prompts…',
 stills:'Painting intro & outro stills…',
 review:'Approve intro & outro stills',
 gen:'Generating videos + plates…',
 craft:'Crafting: mute, +3s hold, plates, music…',
 assemble:'Assembling clone into repo…',
 preview:'Your invite is ready',
 failed:'Failed',
 cancelled:'Cancelled'
};

function stillAssetUrl(jobId,role,bust){
 let url='/api/assembly?action=template1-asset&jobId='+encodeURIComponent(jobId)+'&role='+encodeURIComponent(role);
 if(bust)url+='&v='+encodeURIComponent(String(bust));
 return url;
}

function stillsFromAssets(job){
 const id=job.id||job.jobId||'';
 const assets=job.assets||{};
 const first=assets['opening-first'];
 const last=assets['opening-last'];
 const bust=job.updatedAt||'';
 return {
  first:first?.jpg||first?.png?stillAssetUrl(id,'opening-first',bust):null,
  last:last?.jpg||last?.png?stillAssetUrl(id,'opening-last',bust):null
 };
}

export function normalizeOpeningStillRole(role){
 const raw=String(role||'').trim().toLowerCase();
 if(raw==='first'||raw==='opening-first'||raw==='door'||raw==='door-first')return 'opening-first';
 if(raw==='last'||raw==='opening-last')return 'opening-last';
 throw new HttpError(400,'Iterate Door-First (first) or last still.');
}

export const DEFAULT_COUPLE={groom:'Ashok',bride:'Supriya',groomDetails:'Son of Mr. & Mrs. Hardwin',brideDetails:'Daughter of Mr. & Mrs. Rao'};

export function slugify(name){
 return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'template1';
}

export function validateTemplate1Input(body={}){
 const heroImageUrl=String(body.heroImageUrl||body.hero_image_url||'').trim();
 const pinUrlRaw=String(body.pinUrl||body.pin_url||'').trim();
 const sourceRaw=heroImageUrl||pinUrlRaw;
 let source;
 try{source=new URL(sourceRaw);}catch{throw new HttpError(400,'Paste a Pinterest pin, direct image URL, or lock a hero image first.');}
 if(source.protocol!=='https:'&&source.protocol!=='http:')throw new HttpError(400,'Image URL must be http(s).');
 let pinUrl=source.toString();
 if(pinUrlRaw){
  try{
   const pin=new URL(pinUrlRaw);
   if(pin.protocol==='https:'||pin.protocol==='http:')pinUrl=pin.toString();
  }catch{/* keep source */}
 }
 let heroUrl='';
 if(heroImageUrl){
  let hero;
  try{hero=new URL(heroImageUrl);}catch{throw new HttpError(400,'Hero image URL must be http(s).');}
  if(hero.protocol!=='https:'&&hero.protocol!=='http:')throw new HttpError(400,'Hero image URL must be http(s).');
  heroUrl=hero.toString();
 }
 const displayName=cleanCloneName(body.displayName||body.display_name,'');
 if(!displayName)throw new HttpError(400,'Give the clone a display name.');
 const parentId=String(body.parentId||body.parent_id||'royal-prestige-4').trim();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parentId))throw new HttpError(400,'Invalid parent id.');
 const musicId=String(body.musicId||body.music_library_id||'').trim();
 if(!musicId)throw new HttpError(400,'Pick a tap track from the music library.');
 const budgetUsd=Number(body.budgetUsd??body.budget_usd??4);
 if(!Number.isFinite(budgetUsd)||budgetUsd<=0||budgetUsd>50)throw new HttpError(400,'Budget must be between $0.01 and $50.');
 const names=Array.isArray(body.coupleNames)?body.coupleNames.map(v=>String(v||'').trim()).filter(Boolean):[];
 const couple={
  ...DEFAULT_COUPLE,
  groom:names[0]||DEFAULT_COUPLE.groom,
  bride:names[1]||DEFAULT_COUPLE.bride
 };
 if(typeof body.groomDetails==='string'&&body.groomDetails.trim())couple.groomDetails=body.groomDetails.trim().slice(0,200);
 if(typeof body.brideDetails==='string'&&body.brideDetails.trim())couple.brideDetails=body.brideDetails.trim().slice(0,200);
 const promptParams={};
 if(body.promptParams&&typeof body.promptParams==='object'){
  for(const [k,v] of Object.entries(body.promptParams))if(typeof v==='string' )promptParams[k]=v.slice(0,300);
 }
 // Optional Face Swap solos → Bride/Groom chapters (photos[0]/[1]).
 let brideImageUrl=optionalHttpsUrl(body.brideImageUrl||body.bride_image_url||body.brideUrl,'Bride portrait');
 let groomImageUrl=optionalHttpsUrl(body.groomImageUrl||body.groom_image_url||body.groomUrl,'Groom portrait');
 let coupleImageUrl=optionalHttpsUrl(body.coupleImageUrl||body.couple_image_url||body.coupleUrl,'Couple still')||heroUrl||pinUrl;
 // If the agent only locked the couple still, recover solos from the Face Swap cache.
 if((!brideImageUrl||!groomImageUrl)&&coupleImageUrl){
  const cached=lookupFaceSwapSolos(coupleImageUrl)||lookupFaceSwapSolos(heroUrl)||lookupFaceSwapSolos(pinUrl);
  if(cached){
   if(!brideImageUrl)brideImageUrl=cached.brideUrl||'';
   if(!groomImageUrl)groomImageUrl=cached.groomUrl||'';
   if(!coupleImageUrl)coupleImageUrl=cached.coupleUrl||coupleImageUrl;
  }
 }
 return {pinUrl,heroImageUrl:heroUrl,displayName,parentId,musicId,budgetUsd,couple,promptParams,brideImageUrl,groomImageUrl,coupleImageUrl};
}

function optionalHttpsUrl(value,label){
 const raw=String(value||'').trim();
 if(!raw)return '';
 let parsed;
 try{parsed=new URL(raw);}catch{throw new HttpError(400,label+' must be http(s).');}
 if(parsed.protocol!=='https:'&&parsed.protocol!=='http:')throw new HttpError(400,label+' must be http(s).');
 return parsed.toString();
}

/** Download a Face Swap still into public/assets/{id}-{role}.jpg for Bride/Groom chapters. */
export async function stageFaceSwapStill(url,id,role,{root=ROOT,fetchImpl=fetch}={}){
 if(!url)return '';
 const image=normalizeReferenceImage(await resolveReferenceImage(url,{fetchImpl}));
 const assets=join(root,'public','assets');
 await mkdir(assets,{recursive:true});
 const name=id+'-'+role+'.jpg';
 await writeFile(join(assets,name),image.buffer);
 return '/assets/'+name;
}

function view(job){
 return {
  jobId:job.id||job.jobId,
  status:job.status,
  phase:job.phase,
  percent:job.percent,
  label:job.label,
  detail:job.detail||'',
  displayName:job.input?.displayName||job.displayName||'',
  parentId:job.input?.parentId||job.parentId||'',
  cloneId:job.cloneId||null,
  demo:job.demo||null,
  spend:job.ledger?.snapshot?job.ledger.snapshot():(job.spend||null),
  palette:job.palette||null,
  assets:job.assets||{},
  prompts:promptsForView(job.prompts),
  written:job.written||[],
  stills:stillsFromAssets(job),
  regenRole:job.regenRole||null,
  moderationStop:Boolean(job.moderationStop),
  error:job.error||null,
  createdAt:job.createdAt,
  updatedAt:job.updatedAt
 };
}

function promptsForView(prompts){
 if(!prompts||typeof prompts!=='object')return null;
 const out={};
 for(const key of ['first','last','lastRegen','plate1','plate2','heroStill','heroVideo','opening','source']){
  if(typeof prompts[key]==='string'&&prompts[key])out[key]=prompts[key];
 }
 return Object.keys(out).length?out:null;
}

function viewFromManifest(raw={}){
 const jobId=String(raw.jobId||raw.id||'');
 if(!jobId)return null;
 return {
  jobId,
  status:raw.status||'failed',
  phase:raw.phase||raw.status||'failed',
  percent:Number(raw.percent)||0,
  label:raw.label||'',
  detail:raw.detail||'',
  displayName:raw.displayName||raw.input?.displayName||'',
  parentId:raw.parentId||raw.input?.parentId||'',
  cloneId:raw.cloneId||null,
  demo:raw.demo||null,
  spend:raw.spend||null,
  palette:raw.palette||null,
  assets:raw.assets||{},
  written:raw.written||[],
  stills:stillsFromAssets({id:jobId,assets:raw.assets||{}}),
  regenRole:raw.regenRole||null,
  moderationStop:Boolean(raw.moderationStop),
  error:raw.error||null,
  createdAt:raw.createdAt||0,
  updatedAt:raw.updatedAt||raw.createdAt||0
 };
}

function pickStill(still){
 if(!still)return null;
 return {url:still.url||null,jpg:still.jpg||null,png:still.png||null};
}

function stillsWaveFromJob(job){
 if(job.stillsWave?.first?.jpg&&job.stillsWave?.last?.jpg)return {first:pickStill(job.stillsWave.first),last:pickStill(job.stillsWave.last)};
 const first=job.assets?.['opening-first'];
 const last=job.assets?.['opening-last'];
 if(!first?.jpg||!last?.jpg)return null;
 return {first:pickStill(first),last:pickStill(last)};
}

async function persist(job){
 try{
  const dir=job.workdir||join(jobsDir(job.root||ROOT),job.id||job.jobId||'');
  if(!dir||dir.endsWith('assembly-jobs'))return;
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'manifest.json'),JSON.stringify({
   ...view(job),
   input:job.input,
   prompts:job.prompts||null,
   styleCard:job.styleCard||null,
   pinImageUrl:job.pinImageUrl||null,
   stillsWave:stillsWaveFromJob(job)
  },null,2));
 }catch(error){console.error('Template 1 manifest write failed',error?.message||error);}
}

export async function hydrateLiveJob(jobId,root=ROOT){
 const id=String(jobId||'');
 if(!id)return null;
 if(jobs.has(id))return jobs.get(id);
 try{
  const raw=JSON.parse(await readFile(join(jobsDir(root),id,'manifest.json'),'utf8'));
  if(!raw.input)return null;
  const ledger=createLedger(raw.input.budgetUsd||raw.spend?.budget||4);
  for(const entry of raw.spend?.entries||[])ledger.charge(entry.role,entry.usd,entry);
  const job={
   id,
   status:raw.status||'failed',
   phase:raw.phase||raw.status||'failed',
   percent:Number(raw.percent)||0,
   label:raw.label||'',
   detail:raw.detail||'',
   input:raw.input,
   ledger,
   prompts:raw.prompts||null,
   styleCard:raw.styleCard||null,
   assets:raw.assets||{},
   stillsWave:raw.stillsWave||null,
   pinImageUrl:raw.pinImageUrl||null,
   palette:raw.palette||null,
   cloneId:raw.cloneId||null,
   demo:raw.demo||null,
   root,
   workdir:join(jobsDir(root),id),
   createdAt:raw.createdAt||Date.now(),
   updatedAt:raw.updatedAt||Date.now()
  };
  if(!job.stillsWave)job.stillsWave=stillsWaveFromJob(job);
  jobs.set(id,job);
  return job;
 }catch{return null;}
}

function update(job,patch){
 Object.assign(job,patch);
 if(patch.phase){
  job.percent=PHASE_PERCENT[patch.phase]??job.percent;
  job.label=PHASE_LABEL[patch.phase]||patch.phase;
 }
 if(patch.percent!=null)job.percent=patch.percent;
 if(patch.label)job.label=patch.label;
 job.updatedAt=Date.now();
 void persist(job);
 if(typeof job.onUpdate==='function'){
  try{job.onUpdate(view(job));}catch(error){console.error('Template 1 onUpdate failed',error?.message||error);}
 }
 return job;
}

function checkCancelled(job){
 if(job.cancelRequested)throw new HttpError(499,'Cancelled by operator.');
}

export function getTemplate1Job(jobId){
 const job=jobs.get(String(jobId||''));
 return job?view(job):null;
}

function resumeOrphanedJob(job,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl}={}){
 if(!job||!job.id||job.status!=='running'||job.workerAlive)return;
 job.stillsWave=stillsWaveFromJob(job)||job.stillsWave;
 job.workerAlive=true;
 if(job.phase==='gen'||job.phase==='craft'||job.phase==='assemble'){
  if(!job.stillsWave?.first?.jpg||!job.stillsWave?.last?.jpg)return;
  update(job,{detail:'Resuming — opening on xAI (first + last frame)…'});
  void continueTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
  return;
 }
 if(job.phase==='queued'||job.phase==='pin'||job.phase==='stills'){
  void runTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
 }
}

export async function loadTemplate1Job(jobId,root=ROOT){
 const id=String(jobId||'');
 if(!id)return null;
 const live=jobs.get(id);
 if(live){
  resumeOrphanedJob(live);
  return view(live);
 }
 const job=await hydrateLiveJob(id,root);
 if(job){
  resumeOrphanedJob(job);
  return view(job);
 }
 try{
  const raw=JSON.parse(await readFile(join(jobsDir(root),id,'manifest.json'),'utf8'));
  return viewFromManifest(raw);
 }catch{return null;}
}

export function listTemplate1Jobs(){
 return [...jobs.values()].sort((a,b)=>b.createdAt-a.createdAt).slice(0,20).map(view);
}

export async function listTemplate1JobsResolved(root=ROOT){
 const byId=new Map();
 try{
  const dirs=await readdir(jobsDir(root),{withFileTypes:true});
  for(const ent of dirs){
   if(!ent.isDirectory())continue;
   try{
    const raw=JSON.parse(await readFile(join(jobsDir(root),ent.name,'manifest.json'),'utf8'));
    const item=viewFromManifest({...raw,jobId:raw.jobId||ent.name});
    if(item)byId.set(item.jobId,item);
   }catch{/* skip bad manifests */}
  }
 }catch{/* no jobs dir yet */}
 for(const item of listTemplate1Jobs())byId.set(item.jobId,item);
 return [...byId.values()].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,20);
}

export function cancelTemplate1Job(jobId){
 const job=jobs.get(String(jobId||''));
 if(!job)throw new HttpError(404,'Job not found.');
 if(job.status!=='running')return view(job);
 job.cancelRequested=true;
 update(job,{detail:'Cancel requested — stopping after the current inference call.'});
 return view(job);
}

/** True when operator can retry a local Template 1 job. */
export function localJobCanRetry(job){
 if(!job)return false;
 const status=String(job.status||'');
 if(status==='preview'||status==='review'||status==='discarded')return false;
 // Allow force-retry while running/queued — workers can hang after prompts with no error.
 if(status==='failed'||status==='cancelled'||status==='running'||status==='queued')return true;
 return false;
}

/**
 * Retry a failed/stuck local job. If opening stills already exist, continue from videos;
 * otherwise re-run pin → prompts → stills on the same job id.
 */
export async function retryTemplate1Job(jobId,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,root=ROOT}={}){
 if(!fsWritesAllowed(env))throw new HttpError(503,'Template 1 runs locally only (repo writes + ffmpeg). Use this desk on your Cursor machine or CloudAgent.');
 const job=await hydrateLiveJob(jobId,root);
 if(!job)throw new HttpError(404,'Job not found.');
 if(!localJobCanRetry(job))throw new HttpError(409,'Only failed or stuck jobs can be retried.');
 if(job.regenRole)throw new HttpError(409,'Wait for the still iteration to finish before retrying.');

 job.stillsWave=stillsWaveFromJob(job);
 if(job.stillsWave?.first?.jpg&&job.stillsWave?.last?.jpg){
  return proceedTemplate1Job(jobId,{env,fetchImpl,sleepImpl,openaiClient,qaImpl,root});
 }

 job.cancelRequested=false;
 job.error=null;
 job.moderationStop=false;
 job.workerAlive=true;
 job.assets={};
 job.stillsWave=null;
 job.prompts=Object.keys(job.input?.promptParams||{}).length?buildPrompts(job.input.promptParams):null;
 job.styleCard=null;
 job.pinImageUrl=null;
 job.palette=null;
 job.cloneId=null;
 job.demo=null;
 job.written=[];
 job.ledger=createLedger(job.input?.budgetUsd||4);
 job.status='running';
 update(job,{
  phase:'queued',
  percent:0,
  label:PHASE_LABEL.queued,
  detail:'Retrying from pin + prompts…'
 });
 void runTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
 return view(job);
}

/** Permanently drop a queued / failed / cancelled local job from the pipeline board. */
export async function discardTemplate1Job(jobId,root=ROOT){
 const id=String(jobId||'');
 if(!/^[a-f0-9]{8,32}$/i.test(id))throw new HttpError(400,'Invalid job.');
 const live=jobs.get(id);
 const snap=live?view(live):await loadTemplate1Job(id,root);
 if(!snap)throw new HttpError(404,'Job not found.');
 const status=String(snap.status||'');
 const discardable=status==='queued'||status==='failed'||status==='cancelled'
  ||(status==='running'&&Number(snap.percent||0)===0);
 if(!discardable)throw new HttpError(409,'Only queued or failed jobs can be discarded.');
 if(live){
  live.cancelRequested=true;
  jobs.delete(id);
 }
 const dir=join(jobsDir(root),id);
 try{await rm(dir,{recursive:true,force:true});}catch{/* already gone */}
 return {ok:true,discarded:true,jobId:id};
}

export async function proceedTemplate1Job(jobId,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,root=ROOT}={}){
 const job=await hydrateLiveJob(jobId,root);
 if(!job)throw new HttpError(404,'Job not found. Keep this tab open after stills, then tap Proceed to generate (Rs. 499).');
 if(job.regenRole)throw new HttpError(409,'Wait for the still iteration to finish before approving.');
 job.stillsWave=stillsWaveFromJob(job);
 const staleRunning=job.status==='running'&&!job.assets?.['opening-video']?.path;
 const canRetry=(job.status==='failed'||job.status==='cancelled'||staleRunning)&&job.stillsWave?.first?.jpg&&job.stillsWave?.last?.jpg;
 if(job.status!=='review'&&!canRetry)throw new HttpError(409,'Approve intro & outro stills first.');
 if(!job.stillsWave?.first?.jpg||!job.stillsWave?.last?.jpg)throw new HttpError(409,'Stills are not ready to continue.');
 job.status='running';
 job.error=null;
 job.workerAlive=true;
 update(job,{phase:'gen',detail:canRetry?'Retrying videos from approved stills…':'Stills approved — generating videos…'});
 void continueTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
 return view(job);
}

/** Re-paint Door-First or last opening still while job is in review. Optional note steers the next take. */
export async function regenTemplate1Still(jobId,{role,note}={},{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,root=ROOT}={}){
 const job=await hydrateLiveJob(jobId,root);
 if(!job)throw new HttpError(404,'Job not found.');
 const which=normalizeOpeningStillRole(role);
 if(job.status!=='review'&&job.phase!=='review')throw new HttpError(409,'Iterate Door-First / last only while reviewing stills.');
 if(job.regenRole)throw new HttpError(409,'A still is already regenerating.');
 if(!job.pinImageUrl)throw new HttpError(409,'Pin image missing — cannot regenerate.');
 if(!job.prompts?.first||!job.prompts?.last)throw new HttpError(409,'Prompts missing — cannot regenerate.');
 if(!job.ledger)throw new HttpError(409,'Spend ledger missing — cannot regenerate.');

 const twist=String(note||'').trim().slice(0,300);
 const label=which==='opening-first'?'Door-First':'last';
 job.regenRole=which;
 job.error=null;
 update(job,{
  status:'review',
  phase:'review',
  detail:'Iterating '+label+(twist?' — '+twist.slice(0,80):'')+'…'
 });

 void (async()=>{
  try{
   checkCancelled(job);
   const {ledger,prompts,workdir}=job;
   const gen=join(workdir,'gen');
   await mkdir(gen,{recursive:true});
   const fileBase=which;
   let prompt=which==='opening-first'?prompts.first:prompts.last;
   if(twist)prompt=String(prompt||'').trim()+' Operator note: '+twist;

   ledger.reserve(which,estimateCost('still'));
   const result=await runReplicateImage({prompt,image:job.pinImageUrl,env,fetchImpl,sleepImpl,role:which});
   ledger.charge(which,result.costUsd,{predictionId:result.predictionId});
   const raw=join(gen,fileBase+'-raw.jpg');
   await writeFile(raw,result.buffer);
   const out=await toStill720({input:raw,outPng:join(gen,fileBase+'.png'),outJpg:join(gen,fileBase+'-720.jpg')});
   job.assets[which]={
    url:result.url,
    predictionId:result.predictionId,
    png:out.png,
    jpg:out.jpg,
    costUsd:result.costUsd,
    iterated:true,
    note:twist||undefined
   };

   if(which==='opening-last'){
    const qa=qaImpl?await qaImpl(result.buffer):await detectBakedText(result.buffer,{env,openaiClient,qaPrompt:TEXT_QA_PROMPT});
    job.assets['opening-last'].qa=qa;
    if(qa.hasText){
     update(job,{detail:'LAST had baked text — one regen with stronger no-text clause'});
     ledger.reserve('opening-last',estimateCost('still'));
     const regenPrompt=(prompts.lastRegen||prompts.last)+(twist?' Operator note: '+twist:'');
     const again=await runReplicateImage({prompt:regenPrompt,image:job.pinImageUrl,env,fetchImpl,sleepImpl,role:'opening-last'});
     ledger.charge('opening-last',again.costUsd,{predictionId:again.predictionId});
     await writeFile(raw,again.buffer);
     const out2=await toStill720({input:raw,outPng:join(gen,fileBase+'.png'),outJpg:join(gen,fileBase+'-720.jpg')});
     job.assets['opening-last']={
      url:again.url,
      predictionId:again.predictionId,
      png:out2.png,
      jpg:out2.jpg,
      costUsd:again.costUsd,
      iterated:true,
      regen:true,
      note:twist||undefined,
      qa:{...qa,regenerated:true}
     };
    }
   }

   job.stillsWave=stillsWaveFromJob(job);
   job.regenRole=null;
   update(job,{
    status:'review',
    phase:'review',
    detail:'Approve intro & outro stills, then proceed to videos. · $'+ledger.used.toFixed(2)+' used'
   });
  }catch(error){
   const cancelled=error?.status===499||job.cancelRequested;
   const moderated=isModerationError(error)&&!(error instanceof HttpError&&error.status===402);
   const message=error instanceof HttpError||error?.message?String(error.message):'Still iteration failed.';
   console.error('Template 1 still regen failed',job.id,message);
   job.regenRole=null;
   update(job,{
    status:cancelled?'cancelled':(moderated?'failed':'review'),
    phase:cancelled?'cancelled':(moderated?'failed':'review'),
    moderationStop:moderated&&!cancelled,
    error:cancelled||moderated?message:null,
    detail:moderated?'Moderation stop — no auto-retry. Spend $'+job.ledger.used.toFixed(2)+'.'
     :(cancelled?message:'Still iteration failed — try again. '+message)
   });
  }
 })();

 return view(job);
}

/** Gen fan-out with per-call budget gate. Independent calls run concurrently; dependent ones chain. */
export async function runGenPhase(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl}){
 const {ledger,prompts,workdir}=job;
 const gen=join(workdir,'gen');
 await mkdir(gen,{recursive:true});
 const setDetail=(text)=>update(job,{detail:text});

 const still=async(role,prompt,image,fileBase)=>{
  checkCancelled(job);
  ledger.reserve(role,estimateCost('still'));
  const result=await runReplicateImage({prompt,image,env,fetchImpl,sleepImpl,role});
  ledger.charge(role,result.costUsd,{predictionId:result.predictionId});
  const raw=join(gen,fileBase+'-raw.jpg');
  await writeFile(raw,result.buffer);
  const out=await toStill720({input:raw,outPng:join(gen,fileBase+'.png'),outJpg:join(gen,fileBase+'-720.jpg')});
  job.assets[role]={url:result.url,predictionId:result.predictionId,png:out.png,jpg:out.jpg,costUsd:result.costUsd};
  setDetail(role+' ready · $'+ledger.used.toFixed(2)+' used');
  return {...result,...out};
 };

 const lastWithQa=async()=>{
  let last=await still('opening-last',prompts.last,job.pinImageUrl,'opening-last');
  const qa=qaImpl?await qaImpl(last.buffer):await detectBakedText(last.buffer,{env,openaiClient,qaPrompt:TEXT_QA_PROMPT});
  job.assets['opening-last'].qa=qa;
  if(qa.hasText){
   setDetail('LAST had baked text — one regen with stronger no-text clause');
   last=await still('opening-last',prompts.lastRegen,job.pinImageUrl,'opening-last');
   job.assets['opening-last'].regen=true;
   job.assets['opening-last'].qa={...qa,regenerated:true};
  }
  return last;
 };

 // Wave 1: intro + outro stills only — operator must approve before spend on video.
 const [first,last]=await Promise.all([
  still('opening-first',prompts.first,job.pinImageUrl,'opening-first'),
  lastWithQa()
 ]);
 return {first,last};
}

async function existingAsset(job,role,fileKey='jpg'){
 const asset=job.assets?.[role];
 const path=asset?.[fileKey]||asset?.path;
 if(!path)return null;
 try{await access(path);return asset;}catch{return null;}
}

export async function runRestGenPhase(job,{first,last},{env,fetchImpl,sleepImpl}){
 const {ledger,prompts,workdir}=job;
 const gen=join(workdir,'gen');
 await mkdir(gen,{recursive:true});
 const setDetail=(text)=>update(job,{detail:text});

 const still=async(role,prompt,image,fileBase)=>{
  const kept=await existingAsset(job,role);
  if(kept){setDetail(role+' reused · $'+ledger.used.toFixed(2)+' used');return kept;}
  checkCancelled(job);
  ledger.reserve(role,estimateCost('still'));
  const result=await runReplicateImage({prompt,image,env,fetchImpl,sleepImpl,role});
  ledger.charge(role,result.costUsd,{predictionId:result.predictionId});
  const raw=join(gen,fileBase+'-raw.jpg');
  await writeFile(raw,result.buffer);
  const out=await toStill720({input:raw,outPng:join(gen,fileBase+'.png'),outJpg:join(gen,fileBase+'-720.jpg')});
  job.assets[role]={url:result.url,predictionId:result.predictionId,png:out.png,jpg:out.jpg,costUsd:result.costUsd};
  setDetail(role+' ready · $'+ledger.used.toFixed(2)+' used');
  return {...result,...out};
 };

 await Promise.all([
  still('plate1',prompts.plate1,job.pinImageUrl,'plate1'),
  still('plate2',prompts.plate2,job.pinImageUrl,'plate2')
 ]);

 const heroChain=async()=>{
  const kept=await existingAsset(job,'hero-video','path');
  if(kept?.path){setDetail('hero video reused · $'+ledger.used.toFixed(2)+' used');return kept.path;}
  const heroStill=await still('hero-still',prompts.heroStill,last.url,'hero-still');
  checkCancelled(job);
  ledger.reserve('hero-video',estimateCost('hero-video',{duration:HERO_SECONDS}));
  const hero=await runHeroVideo({imageUrl:heroStill.url,prompt:prompts.heroVideo,env,fetchImpl});
  ledger.charge('hero-video',hero.costUsd,{predictionId:hero.predictionId});
  const path=join(gen,'hero-video.mp4');
  await writeFile(path,hero.buffer);
  job.assets['hero-video']={url:hero.url,predictionId:hero.predictionId,path,costUsd:hero.costUsd};
  setDetail('hero video ready · $'+ledger.used.toFixed(2)+' used');
  return path;
 };
 const openingChain=async()=>{
  const kept=await existingAsset(job,'opening-video','path');
  if(kept?.path&&kept.provider==='xai'){setDetail('opening video reused · $'+ledger.used.toFixed(2)+' used');return kept.path;}
  checkCancelled(job);
  ledger.reserve('opening-video',estimateCost('opening-video',{duration:OPENING_SECONDS}));
  setDetail('Opening on xAI (first + last frame) — usually 1–3 min…');
  const [firstJpg,lastJpg]=await Promise.all([readFile(first.jpg),readFile(last.jpg)]);
  const opening=await runOpeningVideo({
   firstDataUrl:dataUrlFromJpeg(firstJpg),
   lastDataUrl:dataUrlFromJpeg(lastJpg),
   firstUrl:first.url,
   lastUrl:last.url,
   prompt:prompts.opening,
   env,
   fetchImpl,
   sleepImpl,
   onTick:()=>setDetail('Opening on xAI — still rendering… $'+ledger.used.toFixed(2)+' used')
  });
  ledger.charge('opening-video',opening.costUsd,{requestId:opening.requestId||opening.predictionId,provider:opening.provider||'xai'});
  const path=join(gen,'opening-video.mp4');
  await writeFile(path,opening.buffer);
  job.assets['opening-video']={url:opening.url,requestId:opening.requestId,predictionId:opening.predictionId,path,costUsd:opening.costUsd,respectModeration:opening.respectModeration,provider:opening.provider};
  setDetail('opening video ready · $'+ledger.used.toFixed(2)+' used');
  return path;
 };
 const [heroPath,openingPath]=await Promise.all([heroChain(),openingChain()]);
 return {heroPath,openingPath,gen};
}

export async function runCraftPhase(job,{heroPath,openingPath,gen}){
 const slug=slugify(job.input.displayName);
 const inbox=join(job.root,'work','assembly-inbox',slug);
 await mkdir(inbox,{recursive:true});
 const opening=await craftOpening({sourceVideo:openingPath,outDir:inbox});
 const hero=await craftHero({sourceVideo:heroPath,outDir:inbox});
 for(const name of ['opening-first','opening-last','hero-still','plate1','plate2']){
  await copyInto(join(gen,name+'.png'),inbox,name+'.png');
 }
 const track=await getMusicTrack(job.input.musicId,job.root);
 await copyInto(track.path,inbox,slug+'-music.mp3');
 job.assets.craft={opening:{path:opening.path,duration:opening.duration,width:opening.width,height:opening.height,audioStreams:opening.audioStreams},hero:{path:hero.path,duration:hero.duration,width:hero.width,height:hero.height,audioStreams:hero.audioStreams},music:{id:track.id,displayName:track.displayName,file:track.file}};
 job.inbox=inbox;
 job.track=track;
 update(job,{detail:'opening '+opening.duration.toFixed(2)+'s · hero '+hero.duration.toFixed(2)+'s · both video-only'});
 return {inbox,slug,track};
}

export async function runAssemblePhase(job,{inbox,track}){
 const opening=join(inbox,'opening.mp4');
 const hero=join(inbox,'hero.mp4');
 await assertMuted(opening,'opening.mp4');
 await assertMuted(hero,'hero.mp4');
 const root=job.root;
 const base={parentId:job.input.parentId,opening,hero,names:[job.input.displayName],root};
 const dry=await assemblePremium({...base,dryRun:true});
 job.dryRun=dry;
 checkCancelled(job);
 const real=await assemblePremium({...base,dryRun:false});
 const clone=real.clones[0];
 const id=clone.id;
 const written=real.written.slice();
 written.push(...await stagePlates({plate1:join(inbox,'plate1.png'),plate2:join(inbox,'plate2.png'),id,root}));

 // Face Swap solos → chapter portraits (photos[0]/[1]) + faceSwap blob for hero poster.
 let previewExtras={};
 if(job.input.brideImageUrl&&job.input.groomImageUrl){
  update(job,{detail:'Staging Face Swap bride & groom portraits into the clone…'});
  const bridePath=await stageFaceSwapStill(job.input.brideImageUrl,id,'bride',{root,fetchImpl:globalThis.fetch});
  const groomPath=await stageFaceSwapStill(job.input.groomImageUrl,id,'groom',{root,fetchImpl:globalThis.fetch});
  const couplePath=await stageFaceSwapStill(job.input.coupleImageUrl||job.input.heroImageUrl||job.input.pinUrl,id,'couple',{root,fetchImpl:globalThis.fetch});
  written.push('public'+bridePath,'public'+groomPath,'public'+couplePath);
  previewExtras={
   photos:[bridePath,groomPath],
   faceSwap:{status:'ready',coupleUrl:couplePath,brideUrl:bridePath,groomUrl:groomPath}
  };
  job.assets.faceSwap={bride:bridePath,groom:groomPath,couple:couplePath};
 }

 const cssPath=join(root,'src','invitation3.css');
 await writeFile(cssPath,patchThemeCss(await readFile(cssPath,'utf8'),id,job.palette,{displayName:job.input.displayName}));
 written.push('src/invitation3.css');
 const invPath=join(root,'src','Invitation.tsx');
 await writeFile(invPath,patchPreviewDefaults(await readFile(invPath,'utf8'),id,{...job.input.couple,...previewExtras}));
 written.push('src/Invitation.tsx');
 const dataPath=join(root,'src','data.ts');
 await writeFile(dataPath,patchDataRow(await readFile(dataPath,'utf8'),id,{music:track.file,musicName:track.displayName,color:job.palette?.primary}));
 const corePath=join(root,'server','core.mjs');
 await writeFile(corePath,patchMusicTracks(await readFile(corePath,'utf8'),track.url));
 const appPath=join(root,'src','App.tsx');
 await writeFile(appPath,patchAppMusicOption(await readFile(appPath,'utf8'),id,track.url,track.displayName));
 written.push('src/App.tsx');
 job.cloneId=id;
 job.written=[...new Set(written)];
 job.demo='/invite/demo?template='+id;
 return {id,demo:job.demo,written:job.written};
}

export function startTemplate1Job(rawInput,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,run=true,root=ROOT,onUpdate}={}){
 if(!fsWritesAllowed(env))throw new HttpError(503,'Template 1 runs locally only (repo writes + ffmpeg). Use this desk on your Cursor machine or CloudAgent.');
 if(!env.XAI_API_KEY)throw new HttpError(503,'xAI is not configured (XAI_API_KEY). Opening video requires it.');
 if(!(env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY))throw new HttpError(503,'Replicate is not configured (REPLICATE_API_TOKEN).');
 if(!env.OPENAI_API_KEY&&!openaiClient)throw new HttpError(503,'OpenAI is not configured (OPENAI_API_KEY). Template 1 prompt writer needs gpt-6-astra.');
 const input=validateTemplate1Input(rawInput);
 const id=randomBytes(6).toString('hex');
 const job={
  id,
  status:'running',
  phase:'queued',
  percent:0,
  label:PHASE_LABEL.queued,
  detail:'',
  input,
  ledger:createLedger(input.budgetUsd),
  // Provisional until pin phase; Astra Light rewrites from the pin every run.
  prompts:Object.keys(input.promptParams||{}).length?buildPrompts(input.promptParams):null,
  styleCard:null,
  assets:{},
  root,
  workdir:join(jobsDir(root),id),
  createdAt:Date.now(),
  updatedAt:Date.now(),
  onUpdate:typeof onUpdate==='function'?onUpdate:null
 };
 jobs.set(id,job);
 job.workerAlive=true;
 if(run)void runTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
 return {jobId:id,prompts:job.prompts,spend:job.ledger.snapshot()};
}

export async function runTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl}){
 try{
  await mkdir(job.workdir,{recursive:true});
  update(job,{phase:'pin'});
  const parents=await loadPremiumParents(job.root);
  if(!parents.some(p=>p.id===job.input.parentId))throw new HttpError(400,'Parent must be a Premium cinematic template with an intro video.');
  await getMusicTrack(job.input.musicId,job.root);
  const imageUrl=job.input.heroImageUrl||job.input.pinUrl;
  const image=normalizeReferenceImage(await resolveReferenceImage(imageUrl,{fetchImpl}));
  const pinPath=join(job.workdir,'pin-ref'+image.ext);
  await writeFile(pinPath,image.buffer);
  job.assets.pin={sourceUrl:image.sourceUrl,path:pinPath,bytes:image.buffer.length};
  job.pinImageUrl=await resolveReplicateImageUrl(image,{env,fetchImpl});
  job.palette=await extractPalette(pinPath);
  update(job,{detail:'pin ready · writing prompts with Astra Light…'});
  checkCancelled(job);

  const written=await writeTemplate1PromptsFromPin({
   image,
   env,
   openaiClient,
   promptParams:Object.keys(job.input.promptParams||{}).length?job.input.promptParams:undefined
  });
  const prompts=written.prompts?{...written.prompts,params:styleCardToParams(written.styleCard||{}),source:written.source||'astra'}:written;
  if(written.styleCard)job.styleCard=written.styleCard;
  job.prompts=prompts;
  update(job,{detail:'prompts '+String(prompts.source||'astra')+' · '+String(job.styleCard?.STYLE_MEDIUM||prompts.params?.style||'').slice(0,60)+' · palette '+job.palette.primary+' / '+job.palette.secondary});
  checkCancelled(job);

  update(job,{phase:'stills'});
  const wave=await runGenPhase(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
  job.stillsWave=wave;
  checkCancelled(job);
  update(job,{
   status:'review',
   phase:'review',
   percent:36,
   label:PHASE_LABEL.review,
   detail:'Approve intro & outro stills, then proceed to videos.'
  });
 }catch(error){
  const cancelled=error?.status===499||job.cancelRequested;
  const moderated=isModerationError(error)&&!(error instanceof HttpError&&error.status===402);
  const message=error instanceof HttpError||error?.message?String(error.message):'Template 1 job failed.';
  console.error('Template 1 job failed',job.id,message);
  update(job,{
   status:cancelled?'cancelled':'failed',
   phase:cancelled?'cancelled':'failed',
   moderationStop:moderated&&!cancelled,
   error:message,
   detail:moderated?'Moderation stop — no auto-retry. Spend $'+job.ledger.used.toFixed(2)+'.':message
  });
 }
}

export async function continueTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl}){
 try{
  checkCancelled(job);
  job.stillsWave=stillsWaveFromJob(job)||job.stillsWave;
  if(!job.stillsWave?.first?.jpg||!job.stillsWave?.last?.jpg)throw new HttpError(409,'Stills are not ready to continue.');
  update(job,{status:'running',phase:'gen'});
  const genOut=await runRestGenPhase(job,job.stillsWave,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
  checkCancelled(job);
  update(job,{phase:'craft'});
  const craftOut=await runCraftPhase(job,genOut);
  checkCancelled(job);
  update(job,{phase:'assemble'});
  await runAssemblePhase(job,craftOut);
  update(job,{status:'preview',phase:'preview',detail:'Clone '+job.cloneId+' · spend $'+job.ledger.used.toFixed(2)+' of $'+job.ledger.budget.toFixed(2)+' · Publish held'});
 }catch(error){
  const cancelled=error?.status===499||job.cancelRequested;
  const moderated=isModerationError(error)&&!(error instanceof HttpError&&error.status===402);
  const message=error instanceof HttpError||error?.message?String(error.message):'Template 1 job failed.';
  console.error('Template 1 continue failed',job.id,message);
  update(job,{
   status:cancelled?'cancelled':'failed',
   phase:cancelled?'cancelled':'failed',
   moderationStop:moderated&&!cancelled,
   error:message,
   detail:moderated?'Moderation stop — no auto-retry. Spend $'+job.ledger.used.toFixed(2)+'.':message
  });
 }
}

/** Test/CLI helper: theme + registry patch for an already-assembled clone (no gen spend). */
export {themeCss,nextCloneIds,knownTemplateIds};
