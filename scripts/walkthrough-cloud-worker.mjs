#!/usr/bin/env node
// Runs inside a Vercel Sandbox: live phone capture → 720p → private Blob.
import {captureInviteMedia,resolveExport,readWalkthroughManifest,walkthroughServeUrl} from '../server/invite-walkthrough.mjs';
import {publicBakeError} from '../server/invite-walkthrough-imagine.mjs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';

const env=process.env;
const jobId=String(env.WALKTHROUGH_JOB_ID||'');
const secret=String(env.WALKTHROUGH_CALLBACK_SECRET||'');
const callback=String(env.WALKTHROUGH_CALLBACK_URL||'').replace(/\/$/,'');
const templateId=String(env.WALKTHROUGH_TEMPLATE||'').trim();
const origin=String(env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
const ROOT=fileURLToPath(new URL('..',import.meta.url));

async function report(patch){
 if(!jobId||!secret||!callback)return;
 try{
  await fetch(callback+'?action=bake-progress',{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'X-Walkthrough-Job-Id':jobId,
    'X-Walkthrough-Job-Secret':secret
   },
   body:JSON.stringify(patch)
  });
 }catch(error){
  console.error('progress callback failed',error?.message||error);
 }
}

async function done(urls){
 await fetch(callback+'?action=bake-done',{
  method:'POST',
  headers:{
   'Content-Type':'application/json',
   'X-Walkthrough-Job-Id':jobId,
   'X-Walkthrough-Job-Secret':secret
  },
  body:JSON.stringify({urls})
 });
}

if(!jobId||!secret||!callback||!templateId){
 console.error('WALKTHROUGH_JOB_ID, SECRET, CALLBACK_URL, TEMPLATE required.');
 process.exit(1);
}

if(!env.BLOB_READ_WRITE_TOKEN){
 console.error('BLOB_READ_WRITE_TOKEN required.');
 await report({status:'failed',percent:0,label:'Failed',error:'BLOB_READ_WRITE_TOKEN missing'});
 process.exit(1);
}

try{
 await report({status:'running',percent:22,label:'Capturing…',detail:'Hero live + chapter stills'});
 const outDir=join(ROOT,'work','exports',templateId+'-pages');
 await mkdir(outDir,{recursive:true});
 const {heroClip,pageClips,heroFrame,pageFrames,chapters}=await captureInviteMedia({
  templateId,
  origin,
  outDir
 });
 console.log('captured chapters',(chapters||[]).map(c=>c.id).join(','));

 await report({status:'running',percent:40,label:'Imagine chapters…',detail:'Flare recreate → xAI 4s bullet-time'});
 const video=await resolveExport({
  templateId,
  format:'video',
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  chapters,
  forceRebuild:true,
  onProgress:p=>report({
   status:'running',
   percent:Math.min(74,40+Math.round((p.percent||0)*0.3)),
   label:p.phase==='imagine'?'Imagine '+p.label:'Flare '+p.label,
   detail:(p.phase||'')+' '+(p.id||'')+' '+(p.index+1)+'/'+p.total
  })
 });
 console.log('video',video.url);

 const formats=String(env.WALKTHROUGH_FORMATS||'video').split(',').map(s=>s.trim()).filter(Boolean);
 let image={url:null};
 let pdf={url:null};
 if(formats.includes('image')||formats.includes('pdf')){
  await report({status:'running',percent:75,label:'Image + PDF…',detail:'still exports'});
 }
 if(formats.includes('image')){
  image=await resolveExport({
   templateId,
   format:'image',
   heroClip,
   pageClips,
   heroFrame,
   pageFrames,
   forceRebuild:true
  });
 }
 if(formats.includes('pdf')){
  pdf=await resolveExport({
   templateId,
   format:'pdf',
   heroClip,
   pageClips,
   heroFrame,
   pageFrames,
   forceRebuild:true
  });
 }

 const row=(await readWalkthroughManifest())[templateId]||{};
 const urls={
  video:row.video||walkthroughServeUrl(templateId,'video'),
  image:row.image||walkthroughServeUrl(templateId,'image'),
  pdf:row.pdf||walkthroughServeUrl(templateId,'pdf'),
  blob:row.blob||null,
  duration:row.duration||null
 };
 console.log('urls',JSON.stringify(urls));
 await done(urls);
 await report({status:'ready',percent:100,label:'Ready',detail:'Blob updated',urls});
 process.exit(0);
}catch(error){
 const message=error instanceof Error?error.message:String(error);
 console.error('walkthrough bake failed',message);
 const safe=publicBakeError(message);
 await report({status:'failed',percent:0,label:'Failed',error:safe,detail:safe});
 process.exit(1);
}
