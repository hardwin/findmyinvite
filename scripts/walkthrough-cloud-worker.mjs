#!/usr/bin/env node
// Runs inside a Vercel Sandbox: live phone capture → 720p → private Blob.
import {captureInviteMedia,resolveExport,readWalkthroughManifest,walkthroughServeUrl} from '../server/invite-walkthrough.mjs';
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
 await report({status:'running',percent:30,label:'Capturing…',detail:'Playwright phone viewport 390×844'});
 const outDir=join(ROOT,'work','exports',templateId+'-pages');
 await mkdir(outDir,{recursive:true});
 const {heroClip,pageClips,heroFrame,pageFrames}=await captureInviteMedia({
  templateId,
  origin,
  outDir
 });
 console.log('captured pages',pageClips.length);

 await report({status:'running',percent:55,label:'Encoding video…',detail:'720×1280 soft fades'});
 const video=await resolveExport({
  templateId,
  format:'video',
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  forceRebuild:true
 });
 console.log('video',video.url);

 await report({status:'running',percent:75,label:'Image + PDF…',detail:'still exports'});
 const image=await resolveExport({
  templateId,
  format:'image',
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  forceRebuild:true
 });
 const pdf=await resolveExport({
  templateId,
  format:'pdf',
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  forceRebuild:true
 });

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
 await report({status:'failed',percent:0,label:'Failed',error:message,detail:message});
 process.exit(1);
}
