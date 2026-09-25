/**
 * Invite walkthrough export — NOT AI video.
 * Opening (3% zoom, hold trimmed) → soft fade → Hero with names (5% zoom)
 * → soft fadewhite → webpage sections (gentle zoom in/out, no shake).
 * Skips Moments, RSVP, Transport, Accommodation, Gifts.
 */
import {createRequire} from 'node:module';
import {mkdir,rm,writeFile,access,copyFile,readFile} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {run,probeMedia,assertMuted,FIT_9_16} from './assembly-template1-craft.mjs';
import {HOLD_SECONDS} from './assembly-template1-prompts.mjs';
import {HttpError} from './core.mjs';

const require=createRequire(import.meta.url);
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const ASSETS=join(ROOT,'public','assets');
const CATALOGUE=join(ASSETS,'catalogue','v1');
const WORK=join(ROOT,'work','exports');

const PAGE_SECONDS=1.55;
const SOFT_XFADE=0.55; // same soft fade as opening→hero, used everywhere
const FPS=24;
const W=720;
const H=1280;
const OPEN_ZOOM=0.03; // 3%
const HERO_ZOOM=0.05; // 5%
const PAGE_ZOOM=0.045; // gentle in/out

/** Sections never included in the marketing walkthrough. */
const SKIP_SECTIONS=new Set(['gallery','rsvp','transport','accommodation','gifts']);

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
  prebakedVideo:join(CATALOGUE,id+'-walkthrough.mp4'),
  prebakedImage:join(CATALOGUE,id+'-walkthrough.png'),
  prebakedPdf:join(CATALOGUE,id+'-walkthrough.pdf'),
  publicVideo:'/assets/catalogue/v1/'+id+'-walkthrough.mp4',
  publicImage:'/assets/catalogue/v1/'+id+'-walkthrough.png',
  publicPdf:'/assets/catalogue/v1/'+id+'-walkthrough.pdf'
 };
}

export async function fallbackPageStills(templateId){
 const p=walkthroughPaths(templateId);
 const picks=[];
 for(const file of [p.bride,p.groom]){
  if(await exists(file))picks.push(file);
 }
 for(let i=1;i<=5;i++){
  const plate=join(ASSETS,p.id+'-section-'+i+'.jpg');
  if(await exists(plate))picks.push(plate);
 }
 const seen=new Set();
 return picks.filter(f=>{if(seen.has(f))return false;seen.add(f);return true;});
}

function loadPlaywright(){
 const candidates=[
  process.env.PLAYWRIGHT_MODULE,
  'playwright',
  '/home/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  '/home/user/.hermes/hermes-agent/node_modules/playwright'
 ].filter(Boolean);
 let last;
 for(const mod of candidates){
  try{return require(mod);}catch(e){last=e;}
 }
 throw last||new Error('playwright not found');
}

async function prepExportPage(page){
 await page.addStyleTag({content:`
  .sound-toggle,.language-toggle,.use-design,.skip-opening,.invite-download-menu{visibility:hidden!important}
  body{background:#0a0a0a!important}
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
  // Reveal hero names: spend opening, show hero loop + overlay.
  document.querySelectorAll('.cinematic-opening').forEach(v=>{
   v.classList.add('is-spent');
   try{v.pause();}catch{/* */}
  });
  document.querySelectorAll('.cinematic-hero-loop').forEach(v=>{
   v.classList.add('is-live');
   try{v.play().catch(()=>{});}catch{/* */}
  });
  document.querySelectorAll('.invitation-hero').forEach(h=>h.classList.add('has-hero-loop'));
 });
}

/**
 * Capture hero frame (with couple names/details) + content section stills.
 */
export async function captureInviteMedia({templateId,origin,outDir}){
 const pw=loadPlaywright();
 const id=walkthroughPaths(templateId).id;
 const base=(origin||process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
 const url=base+'/invite/demo?template='+encodeURIComponent(id)+'&export=1';
 await mkdir(outDir,{recursive:true});
 const browser=await pw.chromium.launch({
  channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',
  headless:true
 });
 let heroStill='';
 const pageStills=[];
 try{
  const context=await browser.newContext({
   viewport:{width:390,height:844},
   deviceScaleFactor:2,
   reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  await page.route('**/api/analytics**',r=>r.fulfill({status:204}));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('.invitation-page',{timeout:30000});
  await prepExportPage(page);
  await page.waitForTimeout(700);

  // --- Hero with names ---
  const heroIndex=await page.evaluate(()=>{
   const slides=[...document.querySelectorAll('.invite-swiper .swiper-slide')];
   return slides.findIndex(s=>s.querySelector('.invitation-hero'));
  });
  if(heroIndex>=0){
   await page.evaluate((idx)=>{
    const swiper=document.querySelector('.invite-swiper')?.swiper;
    if(swiper)swiper.slideTo(idx,0);
   },heroIndex);
   await prepExportPage(page);
   await page.waitForSelector('.couple-overlay',{timeout:8000}).catch(()=>{});
   await page.waitForTimeout(500);
   heroStill=join(outDir,'hero-with-names.png');
   await page.screenshot({path:heroStill,type:'png',fullPage:false});
  }

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

  const targets=slideMeta.filter(s=>s.ok);
  for(let n=0;n<targets.length;n++){
   const t=targets[n];
   await page.evaluate((idx)=>{
    const swiper=document.querySelector('.invite-swiper')?.swiper;
    if(swiper)swiper.slideTo(idx,0);
   },t.i);
   await page.waitForTimeout(400);
   await page.evaluate(()=>{
    document.querySelectorAll('.scratch-heart').forEach(el=>{
     el.classList.add('is-revealed');
     el.setAttribute('data-scratch','done');
     el.querySelectorAll('.scratch-foil-layer').forEach(n=>n.remove());
    });
   });
   await page.waitForFunction(()=>{
    const slide=document.querySelector('.swiper-slide-active');
    if(!slide)return true;
    const imgs=[...slide.querySelectorAll('img')];
    if(!imgs.length)return true;
    return imgs.every(img=>img.complete&&img.naturalWidth>0);
   },{timeout:8000}).catch(()=>{});
   await page.waitForTimeout(200);
   const file=join(outDir,'section-'+String(n).padStart(2,'0')+(t.section?'-'+t.section:'')+'.png');
   await page.screenshot({path:file,type:'png',fullPage:false});
   pageStills.push(file);
  }
  await context.close();
 }finally{
  await browser.close();
 }
 return {heroStill,pageStills};
}

/** @deprecated use captureInviteMedia */
export async function captureViewportChapters(opts){
 const {pageStills}=await captureInviteMedia(opts);
 return pageStills;
}

/** Steady zoom on a video (opening 3% / hero asset path). */
async function videoSteadyZoom(input,outMp4,zoomAmount){
 const info=await probeMedia(input);
 const dur=Math.max(0.5,info.duration||1);
 const frames=Math.max(2,Math.round(dur*FPS));
 const vf=`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},zoompan=z='1+${zoomAmount}*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS}`;
 await ffmpeg(['-i',input,'-an','-vf',vf,'-t',String(dur),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outMp4]);
}

/** Still → gentle zoom in OR zoom out (no shake). */
async function stillToClip(stillPath,outMp4,seconds=PAGE_SECONDS,variant=0){
 const frames=Math.max(2,Math.round(seconds*FPS));
 const zoomIn=variant%2===0;
 const zExpr=zoomIn
  ?`1+${PAGE_ZOOM}*on/${frames}`
  :`${1+PAGE_ZOOM}-${PAGE_ZOOM}*on/${frames}`;
 const vf=`${FIT_9_16},zoompan=z='${zExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`;
 await ffmpeg(['-loop','1','-i',stillPath,'-t',String(seconds),'-vf',vf,'-an','-c:v','libx264','-pix_fmt','yuv420p','-r',String(FPS),outMp4]);
}

/** Hero webpage frame (names on top) with 5% steady zoom for hero duration. */
async function heroNamedClip(heroStill,heroMp4,outMp4){
 const info=await probeMedia(heroMp4);
 const dur=Math.max(2,info.duration||6);
 const frames=Math.max(2,Math.round(dur*FPS));
 const zExpr=`1+${HERO_ZOOM}*on/${frames}`;
 const vf=`${FIT_9_16},zoompan=z='${zExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`;
 await ffmpeg(['-loop','1','-i',heroStill,'-t',String(dur),'-vf',vf,'-an','-c:v','libx264','-pix_fmt','yuv420p','-r',String(FPS),outMp4]);
}

async function xfadePair(a,b,out,transition,duration,offset){
 await ffmpeg([
  '-i',a,'-i',b,
  '-filter_complex',`[0:v][1:v]xfade=transition=${transition}:duration=${duration}:offset=${offset.toFixed(3)},format=yuv420p[v]`,
  '-map','[v]','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out
 ]);
}

/** Soft fade-to-white between every clip (wedding-pleasing, same family as open→hero). */
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

export async function buildWalkthroughVideo({templateId,pageStills,heroStill,outPath,workDir}){
 const p=walkthroughPaths(templateId);
 if(!(await exists(p.opening)))throw new HttpError(404,'Opening video missing for '+p.id);
 if(!(await exists(p.hero)))throw new HttpError(404,'Hero video missing for '+p.id);
 const dir=workDir||join(WORK,p.id+'-'+Date.now());
 await mkdir(dir,{recursive:true});
 const openingTrim=join(dir,'opening-trim.mp4');
 const openingZ=join(dir,'opening-z.mp4');
 const heroZ=join(dir,'hero-z.mp4');
 const pagesJoined=join(dir,'pages-joined.mp4');
 const head=join(dir,'head.mp4');
 const final=join(dir,'final.mp4');
 try{
  // Trim crafted hold so transition starts when motion ends (~12s not 15s).
  const openInfo=await probeMedia(p.opening);
  const trimTo=Math.max(SOFT_XFADE+1,openInfo.duration-HOLD_SECONDS);
  await ffmpeg(['-i',p.opening,'-t',String(trimTo),'-an','-c:v','libx264','-pix_fmt','yuv420p',openingTrim]);
  await videoSteadyZoom(openingTrim,openingZ,OPEN_ZOOM);

  let mediaHero=heroStill;
  let mediaPages=pageStills;
  if(!mediaPages?.length||!mediaHero){
   try{
    const captured=await captureInviteMedia({
     templateId:p.id,
     origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
     outDir:join(dir,'pages')
    });
    mediaHero=mediaHero||captured.heroStill;
    mediaPages=(mediaPages&&mediaPages.length)?mediaPages:captured.pageStills;
   }catch(err){
    console.warn('[walkthrough] viewport capture failed:',err?.message||err);
    if(!mediaPages?.length)mediaPages=await fallbackPageStills(p.id);
   }
  }
  if(!mediaPages.length)throw new HttpError(500,'No page stills for walkthrough.');

  if(mediaHero&&await exists(mediaHero)){
   await heroNamedClip(mediaHero,p.hero,heroZ);
  }else{
   // Fallback: raw hero with 5% zoom (no names).
   await videoSteadyZoom(p.hero,heroZ,HERO_ZOOM);
  }

  const pageClips=[];
  for(let i=0;i<mediaPages.length;i++){
   const clip=join(dir,'page-'+String(i).padStart(2,'0')+'.mp4');
   await stillToClip(mediaPages[i],clip,PAGE_SECONDS,i);
   pageClips.push(clip);
  }
  await chainSoftFades(pageClips,pagesJoined,dir);

  // Opening → soft fade → Hero (names) — early, seamless.
  const openZInfo=await probeMedia(openingZ);
  const openDur=Math.max(SOFT_XFADE+0.2,openZInfo.duration||1);
  await xfadePair(openingZ,heroZ,head,'fade',SOFT_XFADE,Math.max(0,openDur-SOFT_XFADE));

  // Hero → soft fadewhite → pages
  const headInfo=await probeMedia(head);
  const headDur=Math.max(SOFT_XFADE+0.2,headInfo.duration||1);
  await xfadePair(head,pagesJoined,final,'fadewhite',SOFT_XFADE,Math.max(0,headDur-SOFT_XFADE));

  await mkdir(dirname(outPath),{recursive:true});
  await ffmpeg(['-i',final,'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outPath]);
  await assertMuted(outPath,'walkthrough.mp4');
  return {path:outPath,pages:mediaPages.length,...await probeMedia(outPath)};
 }finally{
  if(!workDir)await rm(dir,{recursive:true,force:true}).catch(()=>{});
 }
}

export async function buildWalkthroughImage({templateId,pageStills,heroStill,outPath}){
 const p=walkthroughPaths(templateId);
 let stills=pageStills;
 let hero=heroStill;
 if(!stills?.length){
  try{
   const c=await captureInviteMedia({
    templateId:p.id,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,p.id+'-img-pages')
   });
   stills=c.pageStills;
   hero=hero||c.heroStill;
  }catch{
   stills=await fallbackPageStills(p.id);
  }
 }
 const scratch=stills.find(s=>/scratch/i.test(s));
 const src=hero||scratch||stills[0];
 if(!src||!(await exists(src)))throw new HttpError(404,'No image source for '+p.id);
 await mkdir(dirname(outPath),{recursive:true});
 await ffmpeg(['-i',src,'-vf',FIT_9_16,'-frames:v','1','-update','1',outPath]);
 return {path:outPath};
}

export async function buildWalkthroughPdf({pageStills,outPath,templateId,heroStill}){
 let stills=pageStills;
 if(!stills?.length){
  try{
   const c=await captureInviteMedia({
    templateId,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,String(templateId)+'-pdf-pages')
   });
   stills=c.pageStills;
  }catch{
   stills=await fallbackPageStills(templateId);
  }
 }
 if(!stills.length)throw new HttpError(404,'No pages for PDF.');
 const dir=join(WORK,'pdf-'+Date.now());
 await mkdir(dir,{recursive:true});
 try{
  const jpgs=[];
  for(let i=0;i<stills.length;i++){
   const jpg=join(dir,'j'+i+'.jpg');
   await ffmpeg(['-i',stills[i],'-vf',FIT_9_16,'-q:v','3',jpg]);
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
   const scale=Math.min(maxW/W,maxH/H);
   const dw=W*scale,dh=H*scale;
   const x=(letterW-dw)/2,y=(letterH-dh)/2;
   const content=`q\n${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;
   push(`${pageObj} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${letterW} ${letterH}] /Contents ${contentObj} 0 R /Resources << /XObject << /Im${i} ${imageObj} 0 R >> >> >>endobj\n`);
   push(`${contentObj} 0 obj<< /Length ${Buffer.byteLength(content)} >>stream\n${content}endstream\nendobj\n`);
   push(`${imageObj} 0 obj<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>stream\n`);
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

export async function resolveExport({templateId,format,pageStills,heroStill,forceRebuild=false}){
 const p=walkthroughPaths(templateId);
 const formatKey=format==='pdf'?'pdf':format==='image'?'image':'video';
 const prebaked=formatKey==='video'?p.prebakedVideo:formatKey==='image'?p.prebakedImage:p.prebakedPdf;
 const publicPath=formatKey==='video'?p.publicVideo:formatKey==='image'?p.publicImage:p.publicPdf;
 if(!forceRebuild&&await exists(prebaked)){
  return {path:prebaked,url:publicPath,cached:true,format:formatKey,id:p.id};
 }
 const outDir=join(WORK,p.id);
 await mkdir(outDir,{recursive:true});
 const out=join(outDir,formatKey==='video'?'walkthrough.mp4':formatKey==='image'?'walkthrough.png':'walkthrough.pdf');
 if(formatKey==='video')await buildWalkthroughVideo({templateId:p.id,pageStills,heroStill,outPath:out});
 else if(formatKey==='image')await buildWalkthroughImage({templateId:p.id,pageStills,heroStill,outPath:out});
 else await buildWalkthroughPdf({templateId:p.id,pageStills,heroStill,outPath:out});
 try{
  await mkdir(CATALOGUE,{recursive:true});
  await copyFile(out,prebaked);
  return {path:prebaked,url:publicPath,cached:false,format:formatKey,id:p.id};
 }catch{
  return {path:out,url:null,cached:false,format:formatKey,id:p.id};
 }
}
