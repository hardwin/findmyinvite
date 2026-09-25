/**
 * Invite walkthrough — live webpage VIDEO (not stills).
 * Opening (asset mp4, hold trimmed, 3% zoom) → fade → Hero live record
 * → fadewhite → each slide live record (motifs + motion).
 * Capture at phone CSS viewport 390×844 (matches live mobile layout).
 * Deliver 720×1280 @30 CRF20 — fill frame, no letterbox.
 * Media ships on Vercel Blob only (git = website + template code).
 * Live manifest: Blob walkthrough/manifest.json (merged over shipped JSON).
 * Skips Moments, RSVP, Transport, Accommodation, Gifts.
 */
import {createRequire} from 'node:module';
import {mkdir,rm,writeFile,access,copyFile,readFile} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {put} from '@vercel/blob';
import {run,probeMedia,assertMuted} from './assembly-template1-craft.mjs';
import {HOLD_SECONDS} from './assembly-template1-prompts.mjs';
import {HttpError} from './core.mjs';

const require=createRequire(import.meta.url);
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const ASSETS=join(ROOT,'public','assets');
const CATALOGUE=join(ASSETS,'catalogue','v1');
const MANIFEST_PATH=join(CATALOGUE,'walkthrough-manifest.json');
const LIVE_MANIFEST_BLOB='walkthrough/manifest.json';
const WORK=join(ROOT,'work','exports');

const PAGE_SECONDS=1.65;
const SOFT_XFADE=0.55;
const FPS=30;
/** CSS pixels — iPhone-class so chapter cards fill like the real site. */
const VIEW_W=390;
const VIEW_H=844;
/** Deliver 720p vertical (9:16). */
const MASTER_W=720;
const MASTER_H=1280;
const CRF=20;
const PRESET='veryfast';
const OPEN_ZOOM=0.03;

const SKIP_SECTIONS=new Set(['gallery','rsvp','transport','accommodation','gifts']);

const ENCODE_COMMON=['-an','-c:v','libx264','-crf',String(CRF),'-preset',PRESET,'-pix_fmt','yuv420p','-r',String(FPS),'-movflags','+faststart'];

/** Fill 9:16 canvas (crop), never letterbox/pad black bars. */
function scaleFill(w=MASTER_W,h=MASTER_H){
 return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=${FPS}`;
}

export function ffmpegBin(){
 try{const p=require('ffmpeg-static');if(p)return p;}catch{/* */}
 return 'ffmpeg';
}

async function ffmpeg(args){
 return run(ffmpegBin(),['-hide_banner','-y',...args]);
}

async function exists(path){
 try{await access(path,fsConstants.R_OK);return true;}catch{return false;}
}

export function walkthroughPaths(templateId){
 const id=String(templateId||'').replace(/[^a-z0-9-]/gi,'');
 return {
  id,
  opening:join(ASSETS,id+'.mp4'),
  hero:join(ASSETS,id+'-hero.mp4'),
  poster:join(ASSETS,id+'.jpg'),
  couple:join(ASSETS,id+'-couple.jpg'),
  bride:join(ASSETS,id+'-bride.jpg'),
  groom:join(ASSETS,id+'-groom.jpg'),
  // Local work cache only — never the public CDN path for walkthrough media.
  workVideo:join(WORK,id,'walkthrough.mp4'),
  workImage:join(WORK,id,'walkthrough.png'),
  workPdf:join(WORK,id,'walkthrough.pdf'),
  blobVideo:'walkthrough/'+id+'-walkthrough.mp4',
  blobImage:'walkthrough/'+id+'-walkthrough.png',
  blobPdf:'walkthrough/'+id+'-walkthrough.pdf'
 };
}

export async function readShippedWalkthroughManifest(){
 try{
  return JSON.parse(await readFile(MANIFEST_PATH,'utf8'));
 }catch{
  return {};
 }
}

async function readLiveWalkthroughManifest(){
 try{
  const token=process.env.BLOB_READ_WRITE_TOKEN;
  if(!token)return {};
  const {get}=await import('@vercel/blob');
  const res=await get(LIVE_MANIFEST_BLOB,{access:'private',token});
  if(!res||res.statusCode!==200)return {};
  const text=await new Response(res.stream).text();
  return JSON.parse(text||'{}');
 }catch{
  return {};
 }
}

/** Shipped git JSON merged under live Blob overrides (Blob wins). */
export async function readWalkthroughManifest(){
 const shipped=await readShippedWalkthroughManifest();
 const live=await readLiveWalkthroughManifest();
 const out={...shipped};
 for(const [id,row] of Object.entries(live||{})){
  out[id]={...(out[id]||{}),...row,blob:{...(out[id]?.blob||{}),...(row?.blob||{})}};
 }
 return out;
}

export async function writeWalkthroughManifest(data){
 await mkdir(CATALOGUE,{recursive:true});
 await writeFile(MANIFEST_PATH,JSON.stringify(data,null,2)+'\n');
}

/** Persist live catalog to Blob so rebakes do not need a git push. */
export async function writeLiveWalkthroughManifest(data){
 const body=JSON.stringify(data,null,2)+'\n';
 await put(LIVE_MANIFEST_BLOB,body,{
  access:'private',
  contentType:'application/json',
  token:blobToken(),
  addRandomSuffix:false,
  allowOverwrite:true,
  cacheControlMaxAge:60
 });
 try{await writeWalkthroughManifest(data);}catch{/* sandbox has no need to ship */}
 return data;
}

function mimeForFormat(format){
 if(format==='pdf')return 'application/pdf';
 if(format==='image')return 'image/png';
 return 'video/mp4';
}

function blobToken(){
 const t=process.env.BLOB_READ_WRITE_TOKEN;
 if(!t)throw new HttpError(503,'BLOB_READ_WRITE_TOKEN required — walkthrough media is Blob-only.');
 return t;
}

/** Same-origin download URL (private Blob store — clients never hit blob.vercel-storage.com directly). */
export function walkthroughServeUrl(templateId,format){
 const id=String(templateId||'').replace(/[^a-z0-9-]/gi,'');
 const formatKey=format==='pdf'?'pdf':format==='image'?'image':'video';
 return '/api/invite-export?action=file&template='+encodeURIComponent(id)+'&format='+formatKey;
}

/** Upload local file to private Vercel Blob; manifest keeps serve URL + blob URL. */
export async function uploadWalkthroughBlob({templateId,format,filePath,duration}){
 const p=walkthroughPaths(templateId);
 const formatKey=format==='pdf'?'pdf':format==='image'?'image':'video';
 const pathname=formatKey==='video'?p.blobVideo:formatKey==='image'?p.blobImage:p.blobPdf;
 const buf=await readFile(filePath);
 // Store is private — access:'public' is rejected (same as face-swap / media).
 const blob=await put(pathname,buf,{
  access:'private',
  contentType:mimeForFormat(formatKey),
  token:blobToken(),
  addRandomSuffix:false,
  allowOverwrite:true,
  cacheControlMaxAge:31536000
 });
 const serve=walkthroughServeUrl(p.id,formatKey);
 const manifest=await readWalkthroughManifest();
 const row={...(manifest[p.id]||{})};
 row[formatKey]=serve;
 row.blob=row.blob||{};
 row.blob[formatKey]=blob.url;
 if(formatKey==='video'&&duration!=null)row.duration=Number(duration)||row.duration;
 row.updatedAt=new Date().toISOString();
 row.viewport='390x844';
 row.deliver='720x1280';
 manifest[p.id]=row;
 await writeLiveWalkthroughManifest(manifest);
 return {url:serve,blobUrl:blob.url,pathname,format:formatKey,id:p.id};
}

/** Fetch private walkthrough blob bytes (server-side only). */
export async function fetchWalkthroughBlob(templateId,format){
 const p=walkthroughPaths(templateId);
 const formatKey=format==='pdf'?'pdf':format==='image'?'image':'video';
 const manifest=await readWalkthroughManifest();
 const blobUrl=manifest?.[p.id]?.blob?.[formatKey];
 if(!blobUrl)return null;
 const upstream=await fetch(blobUrl,{headers:{Authorization:'Bearer '+blobToken()}});
 if(!upstream.ok)throw new HttpError(502,'Walkthrough blob fetch failed ('+upstream.status+').');
 const buf=Buffer.from(await upstream.arrayBuffer());
 return {buf,contentType:upstream.headers.get('content-type')||mimeForFormat(formatKey),url:walkthroughServeUrl(p.id,formatKey)};
}

function loadPlaywright(){
 const candidates=[
  process.env.PLAYWRIGHT_MODULE,
  'playwright',
  'playwright-core',
  '/home/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  '/home/user/.hermes/hermes-agent/node_modules/playwright'
 ].filter(Boolean);
 let last;
 for(const mod of candidates){
  try{return require(mod);}catch(e){last=e;}
 }
 throw last||new Error('playwright not found');
}

async function launchBrowser(pw){
 const launchOpts={
  headless:true,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']
 };
 // Optional remote browser (Browserless / Browserbase) — Sandbox-friendly.
 if(process.env.BROWSER_WS_ENDPOINT){
  const {chromium}=await import('playwright-core');
  return chromium.connectOverCDP(process.env.BROWSER_WS_ENDPOINT);
 }
 // Prefer full Playwright chromium when installed (recordVideo works).
 if(process.env.WALKTHROUGH_CLOUD_WORKER==='1'&&process.env.CHROMIUM_PACK!=='1'){
  try{
   return await pw.chromium.launch(launchOpts);
  }catch(error){
   console.warn('playwright chromium launch failed, trying @sparticuz/chromium',error?.message||error);
  }
 }
 // Bundled Chromium fallback (may not support recordVideo on all hosts).
 if(process.env.WALKTHROUGH_CLOUD_WORKER==='1'||process.env.CHROMIUM_PACK==='1'){
  const chromium=(await import('@sparticuz/chromium')).default;
  try{chromium.setGraphicsMode(false);}catch{/* */}
  const {chromium:pwChromium}=await import('playwright-core');
  return pwChromium.launch({
   args:[...chromium.args,'--disable-dev-shm-usage','--single-process','--no-zygote'],
   executablePath:await chromium.executablePath(),
   headless:true
  });
 }
 if(process.env.PLAYWRIGHT_CHANNEL){
  return pw.chromium.launch({...launchOpts,channel:process.env.PLAYWRIGHT_CHANNEL});
 }
 try{
  return await pw.chromium.launch({...launchOpts,channel:'chrome'});
 }catch{
  return pw.chromium.launch(launchOpts);
 }
}

async function prepExportPage(page){
 await page.addStyleTag({content:`
  .sound-toggle,.language-toggle,.use-design,.skip-opening,.invite-download-menu{visibility:hidden!important}
  body{background:#0a0a0a!important;margin:0!important}
  html,body,.invitation-page,.invite-pager-live,.invite-swiper,.invite-slide,.invite-slide-shell,.invite-slide-scroll{width:100%!important;max-width:100%!important;height:100%!important;min-height:100%!important}
  .invitation-export .invite-pager-live .invite-chapter-inner,
  .invitation-export.invitation-page .invite-chapter-inner,
  .invitation-export .invite-pager-live .invite-section:has(.invite-guest-stack) .invite-chapter-inner,
  .invitation-export .invite-pager-live .invite-chapter:has(.invite-guest-stack) .invite-chapter-inner{
   width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;box-sizing:border-box!important
  }
  .invitation-export .invite-pager-live .invite-person-stage{width:min(280px,78vw)!important}
 `});
 await page.evaluate(()=>document.fonts.ready).catch(()=>{});
 await page.evaluate(()=>{
  document.querySelectorAll('.scratch-heart').forEach(el=>{
   el.classList.add('is-revealed');
   el.setAttribute('data-scratch','done');
   el.querySelectorAll('.scratch-foil-layer').forEach(n=>n.remove());
  });
  document.querySelectorAll('[data-section="gallery"]').forEach(n=>n.remove());
  document.querySelector('.invitation-page')?.classList.add('invitation-open','invitation-export');
  document.querySelectorAll('.cinematic-opening').forEach(v=>{
   v.classList.add('is-spent');
   try{v.pause();}catch{/* */}
  });
  document.querySelectorAll('.cinematic-hero-loop').forEach(v=>{
   v.classList.add('is-live');
   try{v.muted=true;v.play().catch(()=>{});}catch{/* */}
  });
  document.querySelectorAll('.invitation-hero').forEach(h=>h.classList.add('has-hero-loop'));
 });
}

async function slideTo(page,idx){
 await page.evaluate((i)=>{
  const swiper=document.querySelector('.invite-swiper')?.swiper;
  if(swiper)swiper.slideTo(i,0);
 },idx);
}

async function waitImages(page){
 await page.waitForFunction(()=>{
  const slide=document.querySelector('.swiper-slide-active');
  if(!slide)return true;
  const imgs=[...slide.querySelectorAll('img')];
  if(!imgs.length)return true;
  return imgs.every(img=>img.complete&&img.naturalWidth>0);
 },{timeout:10000}).catch(()=>{});
}

/** Scale any clip to master 720×1280 @30 — fill/crop, no black bars. */
async function toMaster(input,outMp4,extraVf=''){
 const scale=scaleFill();
 const vf=extraVf?`${extraVf},${scale}`:scale;
 await ffmpeg(['-i',input,'-vf',vf,...ENCODE_COMMON,outMp4]);
}

/** Opening asset: trim hold + 3% steady zoom → master (fill). */
async function openingMaster(openingPath,outMp4){
 const info=await probeMedia(openingPath);
 const trimTo=Math.max(SOFT_XFADE+1,info.duration-HOLD_SECONDS);
 const frames=Math.max(2,Math.round(trimTo*FPS));
 const z=`zoompan=z='1+${OPEN_ZOOM}*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${MASTER_W}x${MASTER_H}:fps=${FPS}`;
 const prep=`scale=${MASTER_W}:${MASTER_H}:force_original_aspect_ratio=increase,crop=${MASTER_W}:${MASTER_H}`;
 await ffmpeg(['-i',openingPath,'-t',String(trimTo),'-an','-vf',`${prep},${z}`,...ENCODE_COMMON,outMp4]);
}

async function xfadePair(a,b,out,transition,duration,offset){
 await ffmpeg([
  '-i',a,'-i',b,
  '-filter_complex',`[0:v][1:v]xfade=transition=${transition}:duration=${duration}:offset=${offset.toFixed(3)},format=yuv420p,fps=${FPS}[v]`,
  '-map','[v]',...ENCODE_COMMON,out
 ]);
}

async function chainSoftFades(clips,outPath,dir){
 if(clips.length===1){
  await copyFile(clips[0],outPath);
  return;
 }
 let current=clips[0];
 for(let i=1;i<clips.length;i++){
  const info=await probeMedia(current);
  const dur=Math.max(SOFT_XFADE+0.2,info.duration||PAGE_SECONDS);
  const offset=Math.max(0,dur-SOFT_XFADE);
  const next=join(dir,'chain-'+String(i).padStart(2,'0')+'.mp4');
  await xfadePair(current,clips[i],next,'fadewhite',SOFT_XFADE,offset);
  current=next;
 }
 await copyFile(current,outPath);
}

async function extractFrame(videoPath,outPng,atSec=0.3){
 await ffmpeg(['-ss',String(atSec),'-i',videoPath,'-frames:v','1','-update','1',outPng]);
}

/**
 * Live Playwright record of hero + content slides (continuous session, then trim).
 * Returns { heroClip, pageClips, heroFrame, pageFrames }.
 */
export async function captureInviteMedia({templateId,origin,outDir}){
 const pw=loadPlaywright();
 const id=walkthroughPaths(templateId).id;
 const p=walkthroughPaths(id);
 const base=(origin||process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
 const url=base+'/invite/demo?template='+encodeURIComponent(id)+'&export=1';
 await mkdir(outDir,{recursive:true});
 const rawDir=join(outDir,'raw');
 await mkdir(rawDir,{recursive:true});

 let heroDur=6;
 try{
  const hi=await probeMedia(p.hero);
  if(hi.duration>1)heroDur=hi.duration;
 }catch{/* default */}

 const browser=await launchBrowser(pw);

 const segments=[]; // {kind,start,end,label}
 try{
  const context=await browser.newContext({
   viewport:{width:VIEW_W,height:VIEW_H},
   deviceScaleFactor:2,
   isMobile:true,
   hasTouch:true,
   reducedMotion:'no-preference',
   recordVideo:{dir:rawDir,size:{width:VIEW_W,height:VIEW_H}}
  });
  const page=await context.newPage();
  const recStart=Date.now();
  const mark=()=>(Date.now()-recStart)/1000;

  await page.route('**/api/analytics**',r=>r.fulfill({status:204}));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForSelector('.invitation-page',{timeout:45000});
  await prepExportPage(page);
  await page.waitForTimeout(800);

  const slideMeta=await page.evaluate((skip)=>{
   const skipTitle=/transportation|accommodation|gifts|rsvp|our moments/i;
   const slides=[...document.querySelectorAll('.invite-swiper .swiper-slide')];
   return slides.map((slide,i)=>{
    const hero=!!slide.querySelector('.invitation-hero');
    const section=slide.querySelector('[data-section]')?.getAttribute('data-section')||'';
    const heading=(slide.querySelector('h2')?.textContent||'').trim();
    const blob=((slide.querySelector('.invite-chapter-inner')||slide).textContent||'').slice(0,160);
    const skipSection=(section&&skip.includes(section))||skipTitle.test(heading)||skipTitle.test(blob);
    return {i,hero,section,heading,ok:!(hero||skipSection)};
   });
  },[...SKIP_SECTIONS]);

  const heroIndex=slideMeta.findIndex(s=>s.hero);
  const targets=slideMeta.filter(s=>s.ok);

  // --- Hero live ---
  if(heroIndex>=0){
   await slideTo(page,heroIndex);
   await prepExportPage(page);
   await page.waitForSelector('.couple-overlay',{timeout:10000}).catch(()=>{});
   await page.waitForFunction(()=>{
    const v=document.querySelector('.cinematic-hero-loop');
    return v&&v.readyState>=2;
   },{timeout:15000}).catch(()=>{});
   await page.evaluate(()=>{
    const v=document.querySelector('.cinematic-hero-loop');
    if(v){v.muted=true;v.currentTime=0;v.play().catch(()=>{});}
   });
   await page.waitForTimeout(250);
   const start=mark();
   await page.waitForTimeout(Math.round(heroDur*1000));
   segments.push({kind:'hero',start,end:mark(),label:'hero'});
  }

  // --- Content slides live ---
  for(let n=0;n<targets.length;n++){
   const t=targets[n];
   await slideTo(page,t.i);
   await page.evaluate(()=>{
    document.querySelectorAll('.scratch-heart').forEach(el=>{
     el.classList.add('is-revealed');
     el.setAttribute('data-scratch','done');
     el.querySelectorAll('.scratch-foil-layer').forEach(n=>n.remove());
    });
   });
   await waitImages(page);
   await page.waitForTimeout(350);
   const start=mark();
   await page.waitForTimeout(Math.round(PAGE_SECONDS*1000));
   segments.push({
    kind:'page',
    start,
    end:mark(),
    label:'page-'+String(n).padStart(2,'0')+(t.section?'-'+t.section:'')
   });
  }

  const videoObj=page.video();
  await context.close();
  const rawPath=videoObj?await videoObj.path():'';
  if(!rawPath||!(await exists(rawPath)))throw new Error('Playwright recordVideo produced no file.');

  // Normalize raw → intermediate HQ, then trim segments
  const rawMaster=join(outDir,'session-master.mp4');
  await toMaster(rawPath,rawMaster);

  let heroClip='';
  const pageClips=[];
  const pageFrames=[];
  let heroFrame='';

  for(const seg of segments){
   const dur=Math.max(0.4,seg.end-seg.start);
   const out=join(outDir,seg.label+'.mp4');
   // Small pad back so we don't clip the first frame after slide settle
   const ss=Math.max(0,seg.start);
   await ffmpeg(['-ss',String(ss),'-i',rawMaster,'-t',String(dur),...ENCODE_COMMON,out]);
   if(seg.kind==='hero'){
    heroClip=out;
    heroFrame=join(outDir,'hero-frame.png');
    await extractFrame(out,heroFrame,Math.min(0.5,dur/3));
   }else{
    pageClips.push(out);
    const frame=join(outDir,seg.label+'.png');
    await extractFrame(out,frame,0.25);
    pageFrames.push(frame);
   }
  }

  await rm(rawPath,{force:true}).catch(()=>{});
  return {heroClip,pageClips,heroFrame,pageFrames,pageStills:pageFrames,heroStill:heroFrame};
 }finally{
  await browser.close();
 }
}

/** @deprecated */
export async function captureViewportChapters(opts){
 const {pageFrames}=await captureInviteMedia(opts);
 return pageFrames;
}

export async function buildWalkthroughVideo({templateId,heroClip,pageClips,outPath,workDir}){
 const p=walkthroughPaths(templateId);
 if(!(await exists(p.opening)))throw new HttpError(404,'Opening video missing for '+p.id);
 const dir=workDir||join(WORK,p.id+'-'+Date.now());
 await mkdir(dir,{recursive:true});
 const openingZ=join(dir,'opening-z.mp4');
 const heroZ=join(dir,'hero-z.mp4');
 const pagesJoined=join(dir,'pages-joined.mp4');
 const head=join(dir,'head.mp4');
 const master=join(dir,'master-4k.mp4');
 try{
  await openingMaster(p.opening,openingZ);

  let hClip=heroClip;
  let pClips=pageClips;
  if(!hClip||!pClips?.length){
   const captured=await captureInviteMedia({
    templateId:p.id,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(dir,'capture')
   });
   hClip=hClip||captured.heroClip;
   pClips=(pClips&&pClips.length)?pClips:captured.pageClips;
  }
  if(!hClip||!(await exists(hClip)))throw new HttpError(500,'Hero live clip missing.');
  if(!pClips?.length)throw new HttpError(500,'No live page clips.');

  // Ensure master geometry (clips already master from trim, but normalize)
  await toMaster(hClip,heroZ);
  const normalizedPages=[];
  for(let i=0;i<pClips.length;i++){
   const out=join(dir,'page-n-'+String(i).padStart(2,'0')+'.mp4');
   await toMaster(pClips[i],out);
   normalizedPages.push(out);
  }
  await chainSoftFades(normalizedPages,pagesJoined,dir);

  const openInfo=await probeMedia(openingZ);
  const openDur=Math.max(SOFT_XFADE+0.2,openInfo.duration||1);
  await xfadePair(openingZ,heroZ,head,'fade',SOFT_XFADE,Math.max(0,openDur-SOFT_XFADE));

  const headInfo=await probeMedia(head);
  const headDur=Math.max(SOFT_XFADE+0.2,headInfo.duration||1);
  await xfadePair(head,pagesJoined,master,'fadewhite',SOFT_XFADE,Math.max(0,headDur-SOFT_XFADE));

  await mkdir(dirname(outPath),{recursive:true});
  // Deliver 1080×1920 directly (no 4K/8K upscale).
  await copyFile(master,outPath);
  await assertMuted(outPath,'walkthrough.mp4');
  return {path:outPath,pages:pClips.length,master,...await probeMedia(outPath)};
 }finally{
  if(!workDir)await rm(dir,{recursive:true,force:true}).catch(()=>{});
 }
}

export async function buildWalkthroughImage({templateId,heroFrame,heroClip,pageFrames,outPath}){
 let frame=heroFrame;
 if(!frame||!(await exists(frame))){
  if(heroClip&&await exists(heroClip)){
   frame=outPath+'.tmp-hero.png';
   await extractFrame(heroClip,frame,0.4);
  }else{
   const c=await captureInviteMedia({
    templateId,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,String(templateId)+'-img-capture')
   });
   frame=c.heroFrame||c.pageFrames?.[0];
  }
 }
 if(!frame||!(await exists(frame)))throw new HttpError(404,'No image frame.');
 await mkdir(dirname(outPath),{recursive:true});
 await ffmpeg(['-i',frame,'-vf',scaleFill(),'-frames:v','1','-update','1',outPath]);
 return {path:outPath};
}

export async function buildWalkthroughPdf({pageFrames,pageClips,outPath,templateId}){
 let frames=pageFrames;
 if(!frames?.length){
  if(pageClips?.length){
   frames=[];
   const dir=join(WORK,'pdf-frames-'+Date.now());
   await mkdir(dir,{recursive:true});
   for(let i=0;i<pageClips.length;i++){
    const png=join(dir,'p'+i+'.png');
    await extractFrame(pageClips[i],png,0.25);
    frames.push(png);
   }
  }else{
   const c=await captureInviteMedia({
    templateId,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,String(templateId)+'-pdf-capture')
   });
   frames=c.pageFrames;
  }
 }
 if(!frames?.length)throw new HttpError(404,'No pages for PDF.');
 const dir=join(WORK,'pdf-'+Date.now());
 await mkdir(dir,{recursive:true});
 try{
  const jpgs=[];
  for(let i=0;i<frames.length;i++){
   const jpg=join(dir,'j'+i+'.jpg');
   await ffmpeg(['-i',frames[i],'-vf',`${scaleFill().replace(',fps='+FPS,'')},format=yuvj420p`,'-q:v','2',jpg]);
   jpgs.push(await readFile(jpg));
  }
  const letterW=612,letterH=792;
  const body=[];
  const push=(buf)=>{body.push(typeof buf==='string'?Buffer.from(buf):buf);};
  push('%PDF-1.4\n');
  push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  const kids=jpgs.map((_,i)=>(3+i*3)+' 0 R').join(' ');
  push(`2 0 obj<< /Type /Pages /Kids [${kids}] /Count ${jpgs.length} >>endobj\n`);
  for(let i=0;i<jpgs.length;i++){
   const pageObj=3+i*3;
   const contentObj=pageObj+1;
   const imageObj=pageObj+2;
   const img=jpgs[i];
   const maxW=letterW-72,maxH=letterH-72;
   const scale=Math.min(maxW/MASTER_W,maxH/MASTER_H);
   const dw=MASTER_W*scale,dh=MASTER_H*scale;
   const x=(letterW-dw)/2,y=(letterH-dh)/2;
   const content=`q\n${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;
   push(`${pageObj} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${letterW} ${letterH}] /Contents ${contentObj} 0 R /Resources << /XObject << /Im${i} ${imageObj} 0 R >> >> >>endobj\n`);
   push(`${contentObj} 0 obj<< /Length ${Buffer.byteLength(content)} >>stream\n${content}endstream\nendobj\n`);
   push(`${imageObj} 0 obj<< /Type /XObject /Subtype /Image /Width ${MASTER_W} /Height ${MASTER_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>stream\n`);
   push(img);
   push('\nendstream\nendobj\n');
  }
  const real=[];
  let pos=0;
  for(let i=0;i<body.length;i++){real.push(pos);pos+=body[i].length;}
  const xrefStart=pos;
  let xref=`xref\n0 ${3+jpgs.length*3}\n0000000000 65535 f \n`;
  for(let obj=1;obj<=2+jpgs.length*3;obj++){
   xref+=String(real[obj]).padStart(10,'0')+' 00000 n \n';
  }
  push(xref);
  push(`trailer<< /Size ${3+jpgs.length*3} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);
  await mkdir(dirname(outPath),{recursive:true});
  await writeFile(outPath,Buffer.concat(body));
  return {path:outPath,pages:jpgs.length};
 }finally{
  await rm(dir,{recursive:true,force:true}).catch(()=>{});
 }
}

export async function resolveExport({templateId,format,heroClip,pageClips,heroFrame,pageFrames,forceRebuild=false}){
 const p=walkthroughPaths(templateId);
 const formatKey=format==='pdf'?'pdf':format==='image'?'image':'video';
 const manifest=await readWalkthroughManifest();
 const cachedServe=manifest?.[p.id]?.[formatKey];
 const cachedBlob=manifest?.[p.id]?.blob?.[formatKey];
 if(!forceRebuild&&cachedBlob){
  return {path:null,url:cachedServe||walkthroughServeUrl(p.id,formatKey),cached:true,format:formatKey,id:p.id};
 }
 // On Vercel serverless: never run Playwright — operator must POST action=bake (Sandbox).
 // Sandbox worker sets WALKTHROUGH_CLOUD_WORKER=1 and is allowed to bake.
 if(process.env.VERCEL&&process.env.WALKTHROUGH_CLOUD_WORKER!=='1'){
  throw new HttpError(404,'Walkthrough not baked yet. Operator: POST /api/invite-export?action=bake');
 }
 const outDir=join(WORK,p.id);
 await mkdir(outDir,{recursive:true});
 const out=formatKey==='video'?p.workVideo:formatKey==='image'?p.workImage:p.workPdf;

 let hClip=heroClip,pClips=pageClips,hFrame=heroFrame,pFrames=pageFrames;
 if(formatKey==='video'||!hClip||!pClips?.length){
  if(!hClip||!pClips?.length){
   const c=await captureInviteMedia({
    templateId:p.id,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(outDir,'capture')
   });
   hClip=hClip||c.heroClip;
   pClips=pClips?.length?pClips:c.pageClips;
   hFrame=hFrame||c.heroFrame;
   pFrames=pFrames?.length?pFrames:c.pageFrames;
  }
 }

 let built;
 if(formatKey==='video'){
  if(forceRebuild||!(await exists(out))){
   built=await buildWalkthroughVideo({templateId:p.id,heroClip:hClip,pageClips:pClips,outPath:out,workDir:join(outDir,'build')});
  }else{
   built=await probeMedia(out).catch(()=>({}));
  }
 }else if(formatKey==='image')built=await buildWalkthroughImage({templateId:p.id,heroFrame:hFrame,heroClip:hClip,pageFrames:pFrames,outPath:out});
 else built=await buildWalkthroughPdf({templateId:p.id,pageFrames:pFrames,pageClips:pClips,outPath:out});

 const uploaded=await uploadWalkthroughBlob({
  templateId:p.id,
  format:formatKey,
  filePath:out,
  duration:built?.duration
 });
 return {path:out,url:uploaded.url,cached:false,format:formatKey,id:p.id};
}
