/**
 * Invite walkthrough export — NOT AI video.
 * ffmpeg lineup: Opening → Transition → Hero → each page @1.5s (still + gentle motion).
 * Scratch date revealed in capture; Moments/gallery omitted.
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

const PAGE_SECONDS=1.5;
const TRANSITION_SECONDS=0.6;
const FPS=24;
const W=720;
const H=1280;

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

/** Still list when Playwright viewport capture is unavailable (Moments excluded). */
export async function fallbackPageStills(templateId){
 const p=walkthroughPaths(templateId);
 const picks=[];
 for(const file of [p.couple,p.poster,p.bride,p.groom]){
  if(await exists(file))picks.push(file);
 }
 for(let i=1;i<=5;i++){
  const plate=join(ASSETS,p.id+'-section-'+i+'.jpg');
  if(await exists(plate))picks.push(plate);
 }
 const seen=new Set();
 return picks.filter(f=>{if(seen.has(f))return false;seen.add(f);return true;});
}

async function stillToClip(stillPath,outMp4,seconds=PAGE_SECONDS){
 const frames=Math.max(1,Math.round(seconds*FPS));
 const vf=`${FIT_9_16},zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`;
 await ffmpeg(['-loop','1','-i',stillPath,'-t',String(seconds),'-vf',vf,'-an','-c:v','libx264','-pix_fmt','yuv420p','-r',String(FPS),outMp4]);
}

async function normalizeClip(input,outMp4){
 await ffmpeg(['-i',input,'-an','-vf',`scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${FPS}`,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outMp4]);
}

function concatList(files){
 return files.map(f=>"file '"+f.replace(/'/g,"'\\''")+"'").join('\n')+'\n';
}

/** Build mute walkthrough: Opening → Transition → Hero → pages @1.5s. */
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
 const transition=join(dir,'transition.mp4');
 const list=join(dir,'concat.txt');
 try{
  await normalizeClip(p.opening,openingN);
  await normalizeClip(p.hero,heroN);
  await ffmpeg(['-sseof','-'+String(TRANSITION_SECONDS+0.05),'-i',openingN,'-t',String(TRANSITION_SECONDS),'-an','-c:v','libx264','-pix_fmt','yuv420p',openTail]);
  await ffmpeg(['-i',heroN,'-t',String(TRANSITION_SECONDS),'-an','-c:v','libx264','-pix_fmt','yuv420p',heroHead]);
  await ffmpeg([
   '-i',openTail,'-i',heroHead,
   '-filter_complex',`[0:v][1:v]xfade=transition=fade:duration=${TRANSITION_SECONDS}:offset=0,format=yuv420p[v]`,
   '-map','[v]','-an','-c:v','libx264','-pix_fmt','yuv420p',transition
  ]);
  const stills=(pageStills&&pageStills.length)?pageStills:await fallbackPageStills(p.id);
  if(!stills.length)throw new HttpError(500,'No page stills for walkthrough.');
  const pageClips=[];
  for(let i=0;i<stills.length;i++){
   const clip=join(dir,'page-'+String(i).padStart(2,'0')+'.mp4');
   await stillToClip(stills[i],clip,PAGE_SECONDS);
   pageClips.push(clip);
  }
  const parts=[openingN,transition,heroN,...pageClips];
  await writeFile(list,concatList(parts));
  await mkdir(dirname(outPath),{recursive:true});
  await ffmpeg(['-f','concat','-safe','0','-i',list,'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',outPath]);
  await assertMuted(outPath,'walkthrough.mp4');
  return {path:outPath,pages:stills.length,...await probeMedia(outPath)};
 }finally{
  if(!workDir)await rm(dir,{recursive:true,force:true}).catch(()=>{});
 }
}

export async function buildWalkthroughImage({templateId,pageStills,outPath}){
 const p=walkthroughPaths(templateId);
 const stills=(pageStills&&pageStills.length)?pageStills:await fallbackPageStills(p.id);
 const src=stills[0]||((await exists(p.couple))?p.couple:p.poster);
 if(!src||!(await exists(src)))throw new HttpError(404,'No image source for '+p.id);
 await mkdir(dirname(outPath),{recursive:true});
 await ffmpeg(['-i',src,'-vf',FIT_9_16,'-frames:v','1','-update','1',outPath]);
 return {path:outPath};
}

/** Multi-page Letter PDF from stills (JPEG-in-PDF, no pdf-lib). */
export async function buildWalkthroughPdf({pageStills,outPath,templateId}){
 const stills=(pageStills&&pageStills.length)?pageStills:await fallbackPageStills(templateId);
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
  const offsets=[0];
  const push=(buf)=>{
   offsets.push(body.reduce((n,b)=>n+b.length,0));
   body.push(typeof buf==='string'?Buffer.from(buf):buf);
  };
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
  const xrefStart=body.reduce((n,b)=>n+b.length,0);
  let xref=`xref\n0 ${3+jpgs.length*3}\n0000000000 65535 f \n`;
  // Object n starts at offsets[n] (offsets[0] unused sentinel before first push after %PDF)
  // After pushes: offsets[1]=pos of obj1... but first push is %PDF at offsets[1]=0 incorrectly.
  // Fix: rebuild offsets properly
  const real=[];
  let pos=0;
  for(let i=0;i<body.length;i++){
   real.push(pos);
   pos+=body[i].length;
  }
  // Objects start at body indices 1..end-? — map object number to byte offset:
  // body[0]=header, body[1]=obj1, body[2]=obj2, then for each page 3 chunks...
  xref=`xref\n0 ${3+jpgs.length*3}\n0000000000 65535 f \n`;
  for(let obj=1;obj<=2+jpgs.length*3;obj++){
   const idx=obj; // body[obj] holds object `obj` content (body[0] is header)
   xref+=String(real[idx]).padStart(10,'0')+' 00000 n \n';
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
