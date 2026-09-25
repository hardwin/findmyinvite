/**
 * Invite walkthrough export — NOT AI video.
 * Lineup: Opening → Transition → Hero → webpage sections @1.5s
 *   (full viewport capture with text + motifs; Moments omitted).
 * No couple/poster stills (already covered by Opening/Hero videos).
 */
import {createRequire} from 'node:module';
import {mkdir,rm,writeFile,access,copyFile,readFile} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {run,probeMedia,assertMuted,FIT_9_16} from './assembly-template1-craft.mjs';
import {HttpError} from './core.mjs';

const require=createRequire(import.meta.url);
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const ASSETS=join(ROOT,'public','assets');
const CATALOGUE=join(ASSETS,'catalogue','v1');
const WORK=join(ROOT,'work','exports');

const PAGE_SECONDS=1.55;
const PAGE_XFADE=0.32;
const OPEN_HERO_XFADE=0.55;
const FPS=24;
const W=720;
const H=1280;

/** Fast dynamic xfade presets — rotate per section. */
const PAGE_TRANSITIONS=[
 'slideleft','slideright','slideup','slidedown',
 'wipeleft','wiperight','wipeup','wipedown',
 'circlecrop','radial','dissolve','pixelize',
 'hblur','fadeblack','diagtl','diagtr'
];

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

/**
 * Fallback stills — NEVER couple/poster (those duplicate Opening/Hero).
 * Prefer bride/groom + section plates only when Playwright capture failed.
 */
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

/**
 * Capture full-viewport webpage sections (text + motifs).
 * Skips hero (already in opening/hero videos) and Moments/gallery.
 */
export async function captureViewportChapters({templateId,origin,outDir}){
 const pw=loadPlaywright();
 const id=walkthroughPaths(templateId).id;
 const base=(origin||process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
 const url=base+'/invite/demo?template='+encodeURIComponent(id)+'&export=1';
 await mkdir(outDir,{recursive:true});
 const browser=await pw.chromium.launch({
  channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',
  headless:true
 });
 const stills=[];
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
  await page.addStyleTag({content:`
    .sound-toggle,.language-toggle,.use-design,.skip-opening,.invite-download-menu{visibility:hidden!important}
    body{background:#0a0a0a!important}
  `});
  await page.evaluate(()=>document.fonts.ready).catch(()=>{});
  // Force export affordances even if query missed a deploy race.
  await page.evaluate(()=>{
   document.querySelectorAll('.scratch-heart').forEach(el=>{
    el.classList.add('is-revealed');
    el.setAttribute('data-scratch','done');
    el.querySelectorAll('.scratch-foil-layer').forEach(n=>n.remove());
   });
   document.querySelectorAll('[data-section="gallery"]').forEach(n=>n.remove());
   document.querySelector('.invitation-page')?.classList.add('invitation-open','invitation-export');
  });
  await page.waitForTimeout(900);

  const slideMeta=await page.evaluate(()=>{
   const swiperEl=document.querySelector('.invite-swiper');
   const swiper=swiperEl&&swiperEl.swiper;
   const slides=[...document.querySelectorAll('.invite-swiper .swiper-slide')];
   return slides.map((slide,i)=>{
    const hero=!!slide.querySelector('.invitation-hero');
    const gallery=!!slide.querySelector('[data-section="gallery"]');
    const section=slide.querySelector('[data-section]')?.getAttribute('data-section')||'';
    return {i,hero,gallery,section,ok:!(hero||gallery)};
   });
  });

  const targets=slideMeta.filter(s=>s.ok);
  if(!targets.length)throw new Error('No capturable invite sections (hero/gallery excluded).');

  for(let n=0;n<targets.length;n++){
   const t=targets[n];
   await page.evaluate((idx)=>{
    const swiperEl=document.querySelector('.invite-swiper');
    const swiper=swiperEl&&swiperEl.swiper;
    if(swiper)swiper.slideTo(idx,0);
   },t.i);
   await page.waitForTimeout(450);
   // Re-assert scratch revealed after slide (hypertext may remount).
   await page.evaluate(()=>{
    document.querySelectorAll('.scratch-heart').forEach(el=>{
     el.classList.add('is-revealed');
     el.setAttribute('data-scratch','done');
     el.querySelectorAll('.scratch-foil-layer').forEach(n=>n.remove());
    });
   });
   // Wait for section photos (bride/groom) so frames aren't empty beige.
   await page.waitForFunction(()=>{
    const slide=document.querySelector('.swiper-slide-active');
    if(!slide)return true;
    const imgs=[...slide.querySelectorAll('img')];
    if(!imgs.length)return true;
    return imgs.every(img=>img.complete&&img.naturalWidth>0);
   },{timeout:8000}).catch(()=>{});
   await page.waitForTimeout(250);
   const file=join(outDir,'section-'+String(n).padStart(2,'0')+(t.section?'-'+t.section:'')+'.png');
   await page.screenshot({path:file,type:'png',fullPage:false});
   stills.push(file);
  }
  await context.close();
 }finally{
  await browser.close();
 }
 return stills;
}

/**
 * Strong zoom + pan + shake — marketing kinetic feel.
 * Variant cycles pan direction so each section feels different.
 */
async function stillToClip(stillPath,outMp4,seconds=PAGE_SECONDS,variant=0){
 const frames=Math.max(1,Math.round(seconds*FPS));
 // Fit then kinetic zoompan. Shake via sin/cos on x/y; zoom climbs harder.
 const panX=[
  "iw/2-(iw/zoom/2)+10*sin(on*0.55)",
  "iw/2-(iw/zoom/2)+14*sin(on*0.7)-on*0.35",
  "iw/2-(iw/zoom/2)-12*sin(on*0.6)+on*0.4",
  "iw/2-(iw/zoom/2)+8*cos(on*0.5)"
 ][variant%4];
 const panY=[
  "ih/2-(ih/zoom/2)+8*cos(on*0.48)",
  "ih/2-(ih/zoom/2)-10*sin(on*0.52)+on*0.25",
  "ih/2-(ih/zoom/2)+12*cos(on*0.62)",
  "ih/2-(ih/zoom/2)-9*cos(on*0.58)-on*0.3"
 ][variant%4];
 const zExpr="if(eq(on,0),1.04,min(zoom+0.0024,1.28))";
 const vf=`${FIT_9_16},zoompan=z='${zExpr}':x='${panX}':y='${panY}':d=${frames}:s=${W}x${H}:fps=${FPS}`;
 await ffmpeg(['-loop','1','-i',stillPath,'-t',String(seconds),'-vf',vf,'-an','-c:v','libx264','-pix_fmt','yuv420p','-r',String(FPS),outMp4]);
}

async function normalizeClip(input,outMp4){
 await ffmpeg(['-i',input,'-an','-vf',`scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${FPS}`,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outMp4]);
}

async function xfadePair(a,b,out,transition,duration,offset){
 await ffmpeg([
  '-i',a,'-i',b,
  '-filter_complex',`[0:v][1:v]xfade=transition=${transition}:duration=${duration}:offset=${offset.toFixed(3)},format=yuv420p[v]`,
  '-map','[v]','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out
 ]);
}

/** Chain clips with a rotating fast transition between each. */
async function chainWithTransitions(clips,outPath,dir,seed=0){
 if(clips.length===1){
  await copyFile(clips[0],outPath);
  return;
 }
 let current=clips[0];
 for(let i=1;i<clips.length;i++){
  const info=await probeMedia(current);
  const dur=Math.max(PAGE_XFADE+0.15,info.duration||PAGE_SECONDS);
  const offset=Math.max(0,dur-PAGE_XFADE);
  const transition=PAGE_TRANSITIONS[(seed+i-1)%PAGE_TRANSITIONS.length];
  const next=join(dir,'chain-'+String(i).padStart(2,'0')+'.mp4');
  await xfadePair(current,clips[i],next,transition,PAGE_XFADE,offset);
  current=next;
 }
 await copyFile(current,outPath);
}

/** Build mute walkthrough: Opening → Transition → Hero → webpage pages. */
export async function buildWalkthroughVideo({templateId,pageStills,outPath,workDir}){
 const p=walkthroughPaths(templateId);
 if(!(await exists(p.opening)))throw new HttpError(404,'Opening video missing for '+p.id);
 if(!(await exists(p.hero)))throw new HttpError(404,'Hero video missing for '+p.id);
 const dir=workDir||join(WORK,p.id+'-'+Date.now());
 await mkdir(dir,{recursive:true});
 const openingN=join(dir,'opening-n.mp4');
 const heroN=join(dir,'hero-n.mp4');
 const openTail=join(dir,'open-tail.mp4');
 const heroHead=join(dir,'hero-head.mp4');
 const ohBridge=join(dir,'open-hero-bridge.mp4');
 const pagesJoined=join(dir,'pages-joined.mp4');
 const final=join(dir,'final.mp4');
 try{
  await normalizeClip(p.opening,openingN);
  await normalizeClip(p.hero,heroN);
  await ffmpeg(['-sseof','-'+String(OPEN_HERO_XFADE+0.05),'-i',openingN,'-t',String(OPEN_HERO_XFADE),'-an','-c:v','libx264','-pix_fmt','yuv420p',openTail]);
  await ffmpeg(['-i',heroN,'-t',String(OPEN_HERO_XFADE),'-an','-c:v','libx264','-pix_fmt','yuv420p',heroHead]);
  await xfadePair(openTail,heroHead,ohBridge,'fade',OPEN_HERO_XFADE,0);

  let stills=(pageStills&&pageStills.length)?pageStills:null;
  if(!stills||!stills.length){
   try{
    stills=await captureViewportChapters({
     templateId:p.id,
     origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
     outDir:join(dir,'pages')
    });
   }catch(err){
    console.warn('[walkthrough] viewport capture failed, fallback stills:',err?.message||err);
    stills=await fallbackPageStills(p.id);
   }
  }
  if(!stills.length)throw new HttpError(500,'No page stills for walkthrough.');

  const pageClips=[];
  for(let i=0;i<stills.length;i++){
   const clip=join(dir,'page-'+String(i).padStart(2,'0')+'.mp4');
   await stillToClip(stills[i],clip,PAGE_SECONDS,i);
   pageClips.push(clip);
  }
  await chainWithTransitions(pageClips,pagesJoined,dir,p.id.length);

  // Opening full → bridge → Hero full → pages (with their own transitions).
  // Soft wipe into pages so the webpage reel starts punchy.
  const afterHero=join(dir,'after-hero.mp4');
  const openInfo=await probeMedia(openingN);
  const openDur=Math.max(OPEN_HERO_XFADE+0.2,openInfo.duration||1);
  // Rebuild: opening + short bridge + hero, then xfade into pages.
  const headList=join(dir,'head.txt');
  await writeFile(headList,[openingN,ohBridge,heroN].map(f=>"file '"+f.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
  await ffmpeg(['-f','concat','-safe','0','-i',headList,'-an','-c:v','libx264','-pix_fmt','yuv420p',afterHero]);

  const headInfo=await probeMedia(afterHero);
  const headDur=Math.max(PAGE_XFADE+0.2,headInfo.duration||1);
  await xfadePair(afterHero,pagesJoined,final,'slideup',PAGE_XFADE,Math.max(0,headDur-PAGE_XFADE));

  await mkdir(dirname(outPath),{recursive:true});
  await ffmpeg(['-i',final,'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outPath]);
  await assertMuted(outPath,'walkthrough.mp4');
  return {path:outPath,pages:stills.length,...await probeMedia(outPath)};
 }finally{
  if(!workDir)await rm(dir,{recursive:true,force:true}).catch(()=>{});
 }
}

export async function buildWalkthroughImage({templateId,pageStills,outPath}){
 const p=walkthroughPaths(templateId);
 let stills=(pageStills&&pageStills.length)?pageStills:null;
 if(!stills||!stills.length){
  try{
   stills=await captureViewportChapters({
    templateId:p.id,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,p.id+'-img-pages')
   });
  }catch{
   stills=await fallbackPageStills(p.id);
  }
 }
 // Prefer scratch / mid section — not opening couple art.
 const scratch=stills.find(s=>/scratch/i.test(s));
 const src=scratch||stills[Math.min(1,stills.length-1)]||stills[0];
 if(!src||!(await exists(src)))throw new HttpError(404,'No image source for '+p.id);
 await mkdir(dirname(outPath),{recursive:true});
 await ffmpeg(['-i',src,'-vf',FIT_9_16,'-frames:v','1','-update','1',outPath]);
 return {path:outPath};
}

/** Multi-page Letter PDF from webpage section stills. */
export async function buildWalkthroughPdf({pageStills,outPath,templateId}){
 let stills=(pageStills&&pageStills.length)?pageStills:null;
 if(!stills||!stills.length){
  try{
   stills=await captureViewportChapters({
    templateId,
    origin:process.env.CAPTURE_ORIGIN||'https://findmyinvite.com',
    outDir:join(WORK,String(templateId)+'-pdf-pages')
   });
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

export async function resolveExport({templateId,format,pageStills,forceRebuild=false}){
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
 if(formatKey==='video')await buildWalkthroughVideo({templateId:p.id,pageStills,outPath:out});
 else if(formatKey==='image')await buildWalkthroughImage({templateId:p.id,pageStills,outPath:out});
 else await buildWalkthroughPdf({templateId:p.id,pageStills,outPath:out});
 try{
  await mkdir(CATALOGUE,{recursive:true});
  await copyFile(out,prebaked);
  return {path:prebaked,url:publicPath,cached:false,format:formatKey,id:p.id};
 }catch{
  return {path:out,url:null,cached:false,format:formatKey,id:p.id};
 }
}
