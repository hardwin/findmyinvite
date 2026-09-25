/**
 * Export Video (₹400 add-on) — Imagine chapter pipeline.
 * Screenshot → Flare recreate (not a photocopy) → xAI grok-imagine-video 4s bullet-time.
 * Playbook: documents/export-video.md
 */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {put} from '@vercel/blob';
import {runXaiImagineVideo} from './assembly-ai.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';
import {STILL_MODEL} from './assembly-template1-prompts.mjs';
import {blobProxyUrl} from './face-swap.mjs';
import {HttpError} from './core.mjs';

export const CHAPTER_SECONDS=4;
export const CHAPTER_SECONDS_FALLBACK=6;
export const EXPORT_VIDEO_PRICE_INR=400;

/** Locked chapter order for Export Video. Match heading and/or data-section. */
export const EXPORT_VIDEO_CHAPTERS=Object.freeze([
 {id:'bride',label:'The Bride',section:'bride',match:/the bride/i},
 {id:'groom',label:'The Groom',section:'groom',match:/the groom/i},
 {id:'date',label:'Save the Date',section:'date',match:/scratch to reveal|save the date|تاریخ/i},
 {id:'timeline',label:'Program Timeline',section:'timeline',match:/program timeline/i},
 {id:'venue',label:'Venue',section:'venue',match:/^venue$/i},
 {id:'preevents',label:'Pre-Wedding Events',section:'preevents',match:/pre-wedding events/i},
 {id:'finale',label:'We can\'t wait to celebrate with you',section:'finale',match:/can.?t wait to celebrate/i}
]);

const TYPE_LAW='Big bold unique display lettering with 3D pastel oil-paint / gouache texture, levitating in sharp focus in front of the scene. Soft parallax depth. No UI chrome, no buttons, no browser, no watermark, no extra logos.';

export function matchExportChapter(slide,{section='',heading=''}={}){
 const spec=typeof slide==='string'?EXPORT_VIDEO_CHAPTERS.find(c=>c.id===slide):slide;
 if(!spec)return false;
 const sec=String(section||'').toLowerCase();
 if(spec.section&&sec===spec.section)return true;
 return spec.match.test(String(heading||'').trim());
}

export function pickExportChapters(slides){
 const used=new Set();
 return EXPORT_VIDEO_CHAPTERS.map(spec=>{
  const hit=(slides||[]).find((s,i)=>!used.has(i)&&matchExportChapter(spec,s));
  if(!hit)return null;
  used.add((slides||[]).indexOf(hit));
  return {...spec,slideIndex:hit.i,heading:hit.heading||spec.label,text:hit.text||''};
 }).filter(Boolean);
}

export function flareChapterPrompt({label,heading,text}={}){
 const title=String(heading||label||'Invitation chapter').trim();
 const facts=String(text||'').replace(/\s+/g,' ').trim().slice(0,420);
 return [
  'Recreate this wedding-invitation chapter as an ORIGINAL cinematic 9:16 still — do not photocopy or screenshot the reference.',
  'Keep every fact exactly (names, dates, places, event titles). Enrich background + paper with the same theme as the reference (motifs, palette, florals).',
  'Hero words: "'+title+'". '+TYPE_LAW,
  facts?'Facts to keep visible: '+facts:''
 ].filter(Boolean).join(' ');
}

export function imagineChapterPrompt({label,heading}={}){
 const title=String(heading||label||'Invitation').trim();
 return [
  CHAPTER_SECONDS+'-second vertical 9:16 bullet-time cinematic shot.',
  'Camera slowly orbits the levitating 3D pastel-paint typography. Big bold "'+title+'" stays in sharp focus with parallax — background motifs drift opposite the camera.',
  'Text floats, slight rotation, paint texture catching light. No new titles, no extra people, no UI, no zoom crash.',
  'Start and end on the same composition as the reference last-frame image.'
 ].join(' ');
}

function siteOrigin(env=process.env){
 return String(env.SITE_ORIGIN||env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
}

function blobToken(env=process.env){
 const t=env.BLOB_READ_WRITE_TOKEN;
 if(!t)throw new HttpError(503,'BLOB_READ_WRITE_TOKEN required for Export Video refs.');
 return t;
}

export async function uploadWalkthroughRef({templateId,name,buffer,contentType='image/jpeg',env=process.env}){
 const id=String(templateId||'').replace(/[^a-z0-9-]/gi,'');
 const safe=String(name||'ref').replace(/[^a-z0-9.-]/gi,'');
 const pathname='walkthrough/'+id+'/refs/'+safe;
 const blob=await put(pathname,buffer,{
  access:'private',
  contentType,
  token:blobToken(env),
  addRandomSuffix:false,
  allowOverwrite:true,
  cacheControlMaxAge:31536000
 });
 return {url:blob.url,fetchUrl:blobProxyUrl(blob.url,siteOrigin(env)),pathname};
}

async function runImagineVideoWithDuration(opts){
 try{
  return await runXaiImagineVideo({...opts,duration:CHAPTER_SECONDS});
 }catch(error){
  const msg=String(error?.message||error);
  if(/duration|invalid|must be/i.test(msg)){
   console.warn('xAI rejected '+CHAPTER_SECONDS+'s, retrying '+CHAPTER_SECONDS_FALLBACK+'s');
   return await runXaiImagineVideo({...opts,duration:CHAPTER_SECONDS_FALLBACK});
  }
  throw error;
 }
}

/**
 * For each captured still: Flare recreate → xAI 4s bullet-time.
 * Returns ordered local mp4 paths (raw Imagine downloads).
 */
export async function generateImagineChapters({templateId,chapters,outDir,env=process.env,onProgress}={}){
 if(!chapters?.length)throw new HttpError(400,'Export Video needs chapter stills before Imagine.');
 await mkdir(outDir,{recursive:true});
 const clips=[];
 for(let i=0;i<chapters.length;i++){
  const ch=chapters[i];
  const label=ch.label||ch.id;
  if(typeof onProgress==='function')onProgress({
   index:i,
   total:chapters.length,
   id:ch.id,
   label,
   phase:'flare',
   percent:Math.round(10+(i/chapters.length)*70)
  });
  const stillBuf=ch.buffer||await readFile(ch.still||ch.path);
  const ref=await uploadWalkthroughRef({
   templateId,
   name:ch.id+'-shot.jpg',
   buffer:stillBuf,
   env
  });
  const flare=await runReplicateImage({
   role:'export-'+ch.id,
   model:STILL_MODEL,
   prompt:flareChapterPrompt(ch),
   image:ref.fetchUrl,
   inputFidelity:'high',
   env
  });
  const flarePath=join(outDir,'flare-'+ch.id+'.jpg');
  await writeFile(flarePath,flare.buffer);
  const flareRef=await uploadWalkthroughRef({
   templateId,
   name:ch.id+'-flare.jpg',
   buffer:flare.buffer,
   env
  });
  if(typeof onProgress==='function')onProgress({
   index:i,
   total:chapters.length,
   id:ch.id,
   label,
   phase:'imagine',
   percent:Math.round(20+(i/chapters.length)*70)
  });
  const video=await runImagineVideoWithDuration({
   image:{url:flareRef.fetchUrl},
   lastFrame:{url:flareRef.fetchUrl},
   prompt:imagineChapterPrompt(ch),
   env
  });
  const mp4=join(outDir,'imagine-'+ch.id+'.mp4');
  await writeFile(mp4,video.buffer);
  clips.push({
   id:ch.id,
   label,
   path:mp4,
   flarePath,
   flareUrl:flareRef.fetchUrl,
   requestId:video.requestId||'',
   costUsd:video.costUsd
  });
  console.log('imagine-chapter',ch.id,mp4);
 }
 return clips;
}
