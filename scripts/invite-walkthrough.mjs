#!/usr/bin/env node
// Local bake helper (dev). Production rebakes: POST /api/invite-export?action=bake on Vercel Sandbox.
// REUSE_CLIPS=1 FORCE=1 node scripts/invite-walkthrough.mjs royal-prestige-12
import {loadEnv} from 'vite';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {captureInviteMedia,resolveExport,walkthroughPaths,readWalkthroughManifest} from '../server/invite-walkthrough.mjs';

Object.assign(process.env,loadEnv('development',process.cwd(),''));
delete process.env.VERCEL; // allow local Playwright bake

const id=process.argv[2]||'royal-prestige-12';
const force=process.env.FORCE==='1'||process.argv.includes('--force');
const formats=(process.env.FORMATS||'video,image,pdf').split(',').map(s=>s.trim()).filter(Boolean);
const origin=(process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const pagesDir=join(ROOT,'work','exports',id+'-pages');

let heroClip,pageClips,heroFrame,pageFrames;

if(process.env.REUSE_CLIPS==='1'){
 const names=await readdir(pagesDir).catch(()=>[]);
 heroClip=names.includes('hero.mp4')?join(pagesDir,'hero.mp4'):null;
 heroFrame=names.includes('hero-frame.png')?join(pagesDir,'hero-frame.png'):null;
 pageClips=names.filter(n=>/^page-\d+.*\.mp4$/i.test(n)).sort().map(n=>join(pagesDir,n));
 pageFrames=names.filter(n=>/^page-\d+.*\.png$/i.test(n)).sort().map(n=>join(pagesDir,n));
 console.log('reusing clips from',pagesDir,'pages=',pageClips.length);
 if(!heroClip||!pageClips.length)throw new Error('REUSE_CLIPS=1 but clips missing in '+pagesDir);
}else{
 console.log('live-capturing',id,'from',origin,'(390×844 → 720×1280 → Blob)');
 const captured=await captureInviteMedia({templateId:id,origin,outDir:pagesDir});
 heroClip=captured.heroClip;
 pageClips=captured.pageClips;
 heroFrame=captured.heroFrame;
 pageFrames=captured.pageFrames;
}
console.log('heroClip',heroClip||'(none)');
pageClips.forEach(s=>console.log(' ',s));

for(const format of formats){
 const r=await resolveExport({
  templateId:id,
  format,
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  forceRebuild:force
 });
 console.log(format,r.cached?'cached':'built+blob',r.url||r.path);
}
console.log('manifest',JSON.stringify((await readWalkthroughManifest())[id]||{},null,2));
console.log('blob paths',walkthroughPaths(id).blobVideo);
