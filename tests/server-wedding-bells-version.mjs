import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {weddingBellsNewOrSavedVersion,pinWeddingBellsVersion,weddingBellsVersion} from '../shared/wedding-bells-version.mjs';
import {loadVideoMaster,renderDigest,videoService} from '../server/video-personalise.mjs';
import {referenceContent} from '../shared/wedding-bells-video.mjs';
import {draftService} from '../server/personalization-drafts.mjs';
const v1=await loadVideoMaster('wedding-bells-v1',1),v2=await loadVideoMaster('wedding-bells-v1',2);
const readAsset=path=>readFile(new URL('../public'+path,import.meta.url));
test('new invitations select v2, existing unversioned drafts retain v1, unsupported bindings fail',()=>{
 assert.equal(weddingBellsNewOrSavedVersion(null),2);
 assert.equal(weddingBellsNewOrSavedVersion({content:{groom:'Existing'}}),1);
 assert.equal(weddingBellsNewOrSavedVersion({masterVersion:2,content:{}}),2);
 for(const value of [0,3,'2',NaN])assert.throws(()=>weddingBellsVersion(value));
 assert.throws(()=>pinWeddingBellsVersion({masterVersion:2},{payload:{content:{}}}),/different/);
 assert.throws(()=>pinWeddingBellsVersion({}, {payload:{masterVersion:2}}),/different/);
});
test('v1 remains byte-locked; v2 preserves all footage, fonts, materials, content and audio',async()=>{
 assert.equal(v1.assets.background.sha256,'190ea2e43dc44fc6874a50576fefddee34d136d02b79caa105cde582a602d095');
 assert.equal(v1.assets.surfaces.sha256,'ba366bd8d5e77d08c0fc60c3401fdba9ca355554ac9b2ff56e8d1774e11eb6ed');
 assert.equal(v1.assets.restoration.sha256,'efb31cb3b91ef39683e0d21afd452d88b99fa2bfae4330ef117329f10ae263d0');
 for(const [key,asset] of Object.entries(v1.assets)){
  const actual=createHash('sha256').update(await readAsset(asset.path)).digest('hex');assert.equal(actual,asset.sha256,key);
  if(!['surfaces','restoration'].includes(key))assert.deepEqual(v2.assets[key],asset,key);
 }
 const old=JSON.parse(await readAsset(v1.assets.surfaces.path)),current=JSON.parse(await readAsset(v2.assets.surfaces.path));
 assert.equal(Object.keys(current.motionTracks).length,9);delete current.motionTracks;assert.deepEqual(current,old);
 assert.deepEqual(v2.output,v1.output);assert.deepEqual(v2.scenes,v1.scenes);assert.deepEqual(v2.cleanTextRanges,v1.cleanTextRanges);
 assert.deepEqual(await loadVideoMaster('wedding-bells-v1'),v2);
 assert.notEqual(renderDigest('owner',v1,{},[]),renderDigest('owner',v2,{},[]));
});
test('saved Wedding Bells binding is enforced at the draft boundary',async()=>{
 const id=randomUUID(),owner=randomUUID();let row=null,writes=0;
 const service=draftService({store:{},query:async(path,opts)=>{
  if(path.startsWith('personalization_drafts?'))return row?[row]:[];
  assert.equal(path,'rpc/fmi_save_personalization_draft');writes++;
  row={id,owner_id:owner,kind:'video',template_id:'wedding-bells-v1',payload:opts.body.p_payload,revision:writes,updated_at:new Date().toISOString()};return [row];
 }});
 const input={id,kind:'video',templateId:'wedding-bells-v1',revision:0,payload:{masterVersion:2,content:{groom:'Daniel'}}};
 assert.equal((await service.save(owner,input)).payload.masterVersion,2);
 assert.equal((await service.save(owner,{...input,revision:1,payload:{...input.payload,content:{groom:'New name'}}})).payload.masterVersion,2);
 await assert.rejects(service.save(owner,{...input,revision:2,payload:{content:{}}}),/different/);assert.equal(writes,2);
 row={...row,payload:{content:{groom:'Legacy'}}};
 assert.equal((await service.save(owner,{...input,revision:2,payload:{content:{groom:'Legacy edit'}}})).payload.masterVersion,1);
 await assert.rejects(service.save(owner,{...input,revision:3}),/different/);assert.equal(writes,3);
});
test('render jobs carry the saved master version through to the export worker',async()=>{
 const jobs=[];
 for(const version of [1,2]){
  const rows=new Map(),store={async read(k){return rows.get(k)||null;},async save(k,value){rows.set(k,{value,etag:'1'});}};
  const service=videoService({store,env:{VIDEO_PERSONALISE_ENABLED:'1'},masterLoader:async(id,requested)=>{assert.equal(requested,version);const master=await loadVideoMaster(id,requested);return {...master,release:v1.release};},launch:async job=>jobs.push(job)});
  await service.start('owner-'+version,{...referenceContent,music:{mode:'none'}},'wedding-bells-v1',randomUUID(),version);
 }
 assert.equal(jobs[0].master.version,1);assert.equal(jobs[1].master.version,2);
 assert.equal(jobs[0].master.assets.surfaces.path,v1.assets.surfaces.path);assert.equal(jobs[1].master.assets.surfaces.path,v2.assets.surfaces.path);
});
