#!/usr/bin/env node
// Bake catalogue walkthrough exports (Opening→Transition→Hero→pages @1.5s).
// Usage: node scripts/invite-walkthrough.mjs royal-prestige-12
// Optional: FORCE=1 to rebuild; CAPTURE_ORIGIN + PLAYWRIGHT_MODULE for viewport stills.
import {resolveExport} from '../server/invite-walkthrough.mjs';

const id=process.argv[2]||'royal-prestige-12';
const force=process.env.FORCE==='1'||process.argv.includes('--force');
const formats=(process.env.FORMATS||'video,image,pdf').split(',').map(s=>s.trim()).filter(Boolean);

for(const format of formats){
 const r=await resolveExport({templateId:id,format,forceRebuild:force});
 console.log(format,r.cached?'cached':'built',r.url||r.path);
}
