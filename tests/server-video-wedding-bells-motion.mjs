import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {treatmentAt,treatmentCorners,treatmentVisibility} from '../src/video/film-text-treatment.mjs';
const master=JSON.parse(await readFile(new URL('../public/assets/video-masters/wedding-bells-v1/manifest.json',import.meta.url)));
const data=JSON.parse(await readFile(new URL('../public'+master.assets.surfaces.path,import.meta.url)));

test('first-ten-second treatment cannot affect older masters or later scenes',()=>{
 assert.equal(treatmentAt({},'groom',132),null);
 for(const id of ['opening','invitation','groom','bride','family']){
  assert(treatmentAt(data,id,0));
  for(const f of [-1,300,315,831])assert.equal(treatmentAt(data,id,f),null);
 }
 assert.equal(treatmentAt(data,'venue',280),null);
});
test('floating text has one velocity and locked scale/angle across its entire scene',()=>{
 for(const id of ['opening','groom','bride']){
  const t=data.textTreatment.scenes[id];assert(t.linearMotion);assert.equal(t.planarTrack,undefined);
  const initial=treatmentCorners(t,t.start);
  for(let f=t.start+1;f<t.end-1;f++){
   const p=treatmentCorners(t,f-1),q=treatmentCorners(t,f),r=treatmentCorners(t,f+1);
   for(let vertex=0;vertex<4;vertex++)for(let axis=0;axis<2;axis++){
    assert(Math.abs(r[vertex][axis]-2*q[vertex][axis]+p[vertex][axis])<1e-9,'Text velocity changed within the scene.');
    assert(Math.abs((q[vertex][axis]-q[0][axis])-(initial[vertex][axis]-initial[0][axis]))<1e-9,'Text size or perspective changed.');
   }
  }
  for(let f=t.start;f<t.end;f++){
   const first=treatmentCorners(t,f);treatmentCorners(t,t.start);
   assert.deepEqual(treatmentCorners(t,f),first);assert(first.flat().every(Number.isFinite));
   const [a,b,c,d]=first;assert((b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])>0,'The text plane folded over.');
   const {opacity,left,right}=treatmentVisibility(t,f);assert(opacity>=0&&opacity<=1);assert(Number.isFinite(left)&&Number.isFinite(right));
  }
  assert.equal(treatmentCorners(t,t.end),null);
 }
});
test('board lettering uses the actual base film plane with no independent movement',()=>{
 for(const id of ['invitation','family']){
  const t=data.textTreatment.scenes[id];assert.equal(t.linearMotion,undefined);assert.equal(t.planes,undefined);
  assert.equal(t.planarSourceSha256,master.assets.background.sha256);
  assert(t.trackingQuality.medianFitError<1);assert(t.trackingQuality.p95FitError<4);
  for(let f=t.start;f<t.end;f++){
   const q=treatmentCorners(t,f),row=t.planarTrack.find(r=>r.frame===f);assert(row);assert.deepEqual(q,row.corners);
   const [a,b,c,d]=q;assert(q.flat().every(Number.isFinite));assert((b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])>0);
  }
 }
 assert.equal(treatmentAt(data,'family',300),null);
 assert.deepEqual(data.textTreatment.scenes.family.fields,{});
});

test('the prior motion version remains reproducible for the before/after comparison',async()=>{
 const previous=JSON.parse(await readFile(new URL('../public/assets/video-masters/wedding-bells-v1/surfaces-first10-type-v1.json',import.meta.url)));
 const t=previous.textTreatment.scenes.bride;
 assert.deepEqual(treatmentCorners(t,200).flat(),t.planes.find(p=>p[0]===200).slice(1));
 assert.deepEqual(treatmentCorners(t,200),treatmentCorners(t,200));
 assert.equal(treatmentCorners(t,t.end),null);
});
