import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stabiliseTempleMotion} from '../shared/temple-motion-authoring.mjs';
import {composeTemplePlane,templeLayerMatrix} from '../shared/temple-plane.mjs';
const source=JSON.parse(await readFile(new URL('../public/assets/video-masters/temple-v1/motion.json',import.meta.url)));
const point=(m,x,y)=>{const z=m[2][0]*x+m[2][1]*y+m[2][2];return [(m[0][0]*x+m[0][1]*y+m[0][2])/z,(m[1][0]*x+m[1][1]*y+m[1][2])/z];};
test('authoring preserves the immutable released motion and every unrelated layer',()=>{
 const before=JSON.stringify(source),hold={id:'family',start:518,end:574};
 const {motion}=stabiliseTempleMotion(source,[hold]);assert.equal(JSON.stringify(source),before);
 for(let n=0;n<1296;n++)for(const e of source.frames[n])if(e.asset!=='family'||n<506||n>586)assert.deepEqual(motion.frames[n].find(x=>x.asset===e.asset),e);
 assert.deepEqual(motion.occlusion,source.occlusion);
});
test('the board and every point of its text use one linear trajectory with no alternating corrections',()=>{
 const {motion,report}=stabiliseTempleMotion(source,[{id:'family',start:518,end:574}]);
 assert.ok(report[0].maxCorrection<.5);
 for(const p of [[220,420],[490,780],[355,650]])for(let n=519;n<574;n++){
  const samples=[n-1,n,n+1].map(f=>point(motion.frames[f].find(e=>e.asset==='family').matrix,...p));
  for(let axis=0;axis<2;axis++)assert.ok(Math.abs(samples[2][axis]-2*samples[1][axis]+samples[0][axis])<1e-9);
 }
});
test('missing movement fails rather than producing a guessed transform',()=>{
 assert.throws(()=>stabiliseTempleMotion(source,[{id:'family',start:1,end:10}]),/Missing family movement/);
});
test('writing perspective is local to the board and uses its shared camera transform',()=>{
 const camera=[[1.1,0,20],[0,1.1,-10],[0,0,1]],plane=[[1,.02,0],[.04,1,0],[.00002,.00001,1]];
 assert.equal(composeTemplePlane(camera),camera);
 const local=point(plane,330,600),expected=point(camera,...local),actual=point(composeTemplePlane(camera,plane),330,600);
 assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-9);
});

test('floating lettering has independent motion while character and legacy matrices stay unchanged',()=>{
 const matrix=[[1,0,10],[0,1,20],[0,0,1]],textMatrix=[[1.02,0,-8],[0,1.02,6],[0,0,1]];
 const legacy={asset:'groom',matrix},revised={...legacy,textMatrix},before=JSON.stringify(revised);
 assert.equal(templeLayerMatrix(legacy,true),matrix);
 assert.equal(templeLayerMatrix(revised),matrix);
 assert.equal(templeLayerMatrix(revised,true),textMatrix);
 assert.notDeepEqual(point(templeLayerMatrix(revised,true),550,600),point(templeLayerMatrix(revised),550,600));
 assert.equal(JSON.stringify(revised),before);
 // Every existing frame continues to select the same original matrix object.
 for(const frame of source.frames)for(const entry of frame){
  assert.equal(templeLayerMatrix(entry),entry.matrix);
  assert.equal(templeLayerMatrix(entry,true),entry.matrix);
 }
});
