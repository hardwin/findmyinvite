#!/usr/bin/env node
// Local bake helper (dev). Production rebakes: POST /api/invite-export?action=bake on Vercel Sandbox.
// FORCE=1 FORMATS=video node scripts/invite-walkthrough.mjs royal-prestige-12
// CAPTURE_ONLY=1 skips Flare + Imagine (stills + hero only).
import {loadEnv} from 'vite';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {captureInviteMedia,resolveExport,walkthroughPaths,readWalkthroughManifest} from '../server/invite-walkthrough.mjs';
import {EXPORT_VIDEO_CHAPTERS} from '../server/invite-walkthrough-imagine.mjs';

Object.assign(process.env,loadEnv('development',process.cwd(),''));
delete process.env.VERCEL; // allow local Playwright bake

const id=process.argv[2]||'royal-prestige-12';
const force=process.env.FORCE==='1'||process.argv.includes('--force');
const formats=(process.env.FORMATS||'video,image,pdf').split(',').map(s=>s.trim()).filter(Boolean);
const origin=(process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const pagesDir=join(ROOT,'work','exports',id+'-pages');

let heroClip,pageClips,heroFrame,pageFrames,chapters;

if(process.env.REUSE_CLIPS==='1'){
 const names=await readdir(pagesDir).catch(()=>[]);
 heroClip=names.includes('hero.mp4')?join(pagesDir,'hero.mp4'):null;
 heroFrame=names.includes('hero-frame.png')?join(pagesDir,'hero-frame.png'):null;
 pageClips=names.filter(n=>/^imagine-.*\.mp4$/i.test(n)).sort().map(n=>join(pagesDir,n));
 pageFrames=EXPORT_VIDEO_CHAPTERS.map(c=>c.id+'.png').filter(n=>names.includes(n)).map(n=>join(pagesDir,n));
 chapters=EXPORT_VIDEO_CHAPTERS.filter(c=>names.includes(c.id+'.jpg')).map(c=>({
  ...c,
  still:join(pagesDir,c.id+'.jpg'),
  png:join(pagesDir,c.id+'.png'),
  heading:c.label
 }));
 console.log('reusing stills from',pagesDir,'chapters=',chapters.length,'imagine=',pageClips.length);
 if(!heroClip||!chapters.length)throw new Error('REUSE_CLIPS=1 but hero/chapters missing in '+pagesDir);
}else{
 console.log('export-video',id,'from',origin,'(hero live + chapter stills → Flare → Imagine 4s)');
 const captured=await captureInviteMedia({templateId:id,origin,outDir:pagesDir});
 heroClip=captured.heroClip;
 pageClips=captured.pageClips;
 heroFrame=captured.heroFrame;
 pageFrames=captured.pageFrames;
 chapters=captured.chapters;
}
console.log('heroClip',heroClip||'(none)');
(chapters||[]).forEach(c=>console.log('  still',c.id,c.still||c.png));

if(process.env.CAPTURE_ONLY==='1'){
 console.log('CAPTURE_ONLY=1 — skipping Flare/Imagine stitch');
 process.exit(0);
}

for(const format of formats){
 const r=await resolveExport({
  templateId:id,
  format,
  heroClip,
  pageClips,
  heroFrame,
  pageFrames,
  chapters,
  forceRebuild:force
 });
 console.log(format,r.cached?'cached':'built+blob',r.url||r.path);
}
console.log('manifest',JSON.stringify((await readWalkthroughManifest())[id]||{},null,2));
console.log('blob paths',walkthroughPaths(id).blobVideo);
