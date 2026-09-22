// Template 1 job runner: pin → parallel gen → craft → assemble → preview. Never publishes.
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError} from './core.mjs';
import {ROOT,fsWritesAllowed,assemblePremium,loadPremiumParents,knownTemplateIds,nextCloneIds,cleanCloneName} from './assembly.mjs';
import {resolveReferenceImage,normalizeReferenceImage,resolveReplicateImageUrl} from './assembly-ai.mjs';
import {buildPrompts,writeTemplate1PromptsFromPin,styleCardToParams,TEXT_QA_PROMPT,OPENING_SECONDS,HERO_SECONDS} from './assembly-template1-prompts.mjs';
import {createLedger,estimateCost,runReplicateImage,runHeroVideo,runOpeningVideo,detectBakedText,dataUrlFromJpeg,isModerationError} from './assembly-template1-gen.mjs';
import {toStill720,craftOpening,craftHero,stagePlates,copyInto,extractPalette,assertMuted} from './assembly-template1-craft.mjs';
import {themeCss,patchThemeCss,patchPreviewDefaults,patchMusicTracks,patchDataRow,patchAppMusicOption} from './assembly-template1-theme.mjs';
import {getMusicTrack} from './music-library.mjs';

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

function stillAssetUrl(jobId,role){
 return '/api/assembly?action=template1-asset&jobId='+encodeURIComponent(jobId)+'&role='+encodeURIComponent(role);
}

function stillsFromAssets(job){
 const id=job.id||job.jobId||'';
 const assets=job.assets||{};
 const first=assets['opening-first'];
 const last=assets['opening-last'];
 return {
  first:first?.jpg||first?.png?stillAssetUrl(id,'opening-first'):null,
  last:last?.jpg||last?.png?stillAssetUrl(id,'opening-last'):null
 };
}

export const DEFAULT_COUPLE={groom:'Ashok',bride:'Supriya',groomDetails:'Son of Mr. & Mrs. Hardwin',brideDetails:'Daughter of Mr. & Mrs. Rao'};

export function slugify(name){
 return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'template1';
}

export function validateTemplate1Input(body={}){
 const pinUrl=String(body.pinUrl||body.pin_url||'').trim();
 let parsed;
 try{parsed=new URL(pinUrl);}catch{throw new HttpError(400,'Paste a Pinterest pin or direct image URL.');}
 if(parsed.protocol!=='https:'&&parsed.protocol!=='http:')throw new HttpError(400,'Pin URL must be http(s).');
 const displayName=cleanCloneName(body.displayName||body.display_name,'');
 if(!displayName)throw new HttpError(400,'Give the clone a display name.');
 const parentId=String(body.parentId||body.parent_id||'royal-prestige-2').trim();
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
 return {pinUrl:parsed.toString(),displayName,parentId,musicId,budgetUsd,couple,promptParams};
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
  written:job.written||[],
  stills:stillsFromAssets(job),
  moderationStop:Boolean(job.moderationStop),
  error:job.error||null,
  createdAt:job.createdAt,
  updatedAt:job.updatedAt
 };
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
  await mkdir(job.workdir,{recursive:true});
  await writeFile(join(job.workdir,'manifest.json'),JSON.stringify({
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
 return job;
}

function checkCancelled(job){
 if(job.cancelRequested)throw new HttpError(499,'Cancelled by operator.');
}

export function getTemplate1Job(jobId){
 const job=jobs.get(String(jobId||''));
 return job?view(job):null;
}

export async function loadTemplate1Job(jobId,root=ROOT){
 const id=String(jobId||'');
 if(!id)return null;
 const mem=getTemplate1Job(id);
 if(mem)return mem;
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

export async function proceedTemplate1Job(jobId,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,root=ROOT}={}){
 const job=await hydrateLiveJob(jobId,root);
 if(!job)throw new HttpError(404,'Job not found. Keep this tab open after stills, then tap Proceed to generate (Rs. 499).');
 if(job.status!=='review')throw new HttpError(409,'Approve intro & outro stills first.');
 job.stillsWave=stillsWaveFromJob(job);
 if(!job.stillsWave?.first?.jpg||!job.stillsWave?.last?.jpg)throw new HttpError(409,'Stills are not ready to continue.');
 job.status='running';
 update(job,{phase:'gen',detail:'Stills approved — generating videos…'});
 void continueTemplate1Job(job,{env,fetchImpl,sleepImpl,openaiClient,qaImpl});
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

export async function runRestGenPhase(job,{first,last},{env,fetchImpl,sleepImpl}){
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

 await Promise.all([
  still('plate1',prompts.plate1,job.pinImageUrl,'plate1'),
  still('plate2',prompts.plate2,job.pinImageUrl,'plate2')
 ]);

 const heroChain=async()=>{
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
  checkCancelled(job);
  ledger.reserve('opening-video',estimateCost('opening-video',{duration:OPENING_SECONDS}));
  const [firstJpg,lastJpg]=await Promise.all([readFile(first.jpg),readFile(last.jpg)]);
  const opening=await runOpeningVideo({firstDataUrl:dataUrlFromJpeg(firstJpg),lastDataUrl:dataUrlFromJpeg(lastJpg),prompt:prompts.opening,env,fetchImpl,sleepImpl});
  ledger.charge('opening-video',opening.costUsd,{requestId:opening.requestId,ticks:opening.costUsd});
  const path=join(gen,'opening-video.mp4');
  await writeFile(path,opening.buffer);
  job.assets['opening-video']={url:opening.url,requestId:opening.requestId,path,costUsd:opening.costUsd,respectModeration:opening.respectModeration};
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

 const cssPath=join(root,'src','invitation3.css');
 await writeFile(cssPath,patchThemeCss(await readFile(cssPath,'utf8'),id,job.palette,{displayName:job.input.displayName}));
 written.push('src/invitation3.css');
 const invPath=join(root,'src','Invitation.tsx');
 await writeFile(invPath,patchPreviewDefaults(await readFile(invPath,'utf8'),id,job.input.couple));
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

export function startTemplate1Job(rawInput,{env=process.env,fetchImpl=fetch,sleepImpl,openaiClient,qaImpl,run=true,root=ROOT}={}){
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
  updatedAt:Date.now()
 };
 jobs.set(id,job);
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
  const image=normalizeReferenceImage(await resolveReferenceImage(job.input.pinUrl,{fetchImpl}));
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
