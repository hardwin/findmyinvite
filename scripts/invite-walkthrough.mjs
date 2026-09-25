#!/usr/bin/env node
// Bake catalogue walkthrough: Opening→Transition→Hero→webpage sections.
// Usage: node scripts/invite-walkthrough.mjs royal-prestige-12 --force
// CAPTURE_ORIGIN=https://findmyinvite.com PLAYWRIGHT_MODULE=… FORCE=1
import {captureViewportChapters,resolveExport,walkthroughPaths} from '../server/invite-walkthrough.mjs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const id=process.argv[2]||'royal-prestige-12';
const force=process.env.FORCE==='1'||process.argv.includes('--force');
const formats=(process.env.FORMATS||'video,image,pdf').split(',').map(s=>s.trim()).filter(Boolean);
const origin=(process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const pagesDir=join(ROOT,'work','exports',id+'-pages');

console.log('capturing viewport sections',id,'from',origin);
const stills=await captureViewportChapters({templateId:id,origin,outDir:pagesDir});
console.log('captured',stills.length,'sections');
stills.forEach(s=>console.log(' ',s));

for(const format of formats){
 const r=await resolveExport({templateId:id,format,pageStills:stills,forceRebuild:force||true});
 console.log(format,r.cached?'cached':'built',r.url||r.path);
}
console.log('public',walkthroughPaths(id).publicVideo);
