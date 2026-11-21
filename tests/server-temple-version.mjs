import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {videoNewOrSavedVersion,videoDraftVersion,videoMasterVersion,pinVideoMasterVersion} from '../shared/video-master-version.mjs';
import {loadVideoMaster,requireVideoRelease,renderDigest,videoService} from '../server/video-personalise.mjs';
import {draftService} from '../server/personalization-drafts.mjs';
import {TEMPLE_DEFAULTS} from '../shared/temple-video.mjs';
const id='temple-v1',v1=await loadVideoMaster(id,1),v2=await loadVideoMaster(id,2),v3=await loadVideoMaster(id,3);
test('new Temple invitations select v3 while existing drafts retain their version',()=>{
 assert.equal(videoNewOrSavedVersion(id,null),3);
 assert.equal(videoNewOrSavedVersion(id,{content:{groom:'Existing'}}),1);
 assert.equal(videoNewOrSavedVersion(id,{masterVersion:2}),2);
 assert.equal(videoDraftVersion(id,undefined),1);
 assert.equal(videoNewOrSavedVersion(id,{masterVersion:3}),3);
 assert.equal(pinVideoMasterVersion(id,{content:{}},null),3);
 for(const value of [0,4,'3',NaN])assert.throws(()=>videoMasterVersion(id,value));
 assert.throws(()=>pinVideoMasterVersion(id,{masterVersion:2},{payload:{content:{}}}),/different/);
 assert.throws(()=>pinVideoMasterVersion(id,{}, {payload:{masterVersion:2}}),/different/);
});
test('both Temple versions retain locked source footage and original characters',async()=>{
 const approved=structuredClone(v2);delete approved.version;delete approved.release;delete approved.assets.motion.path;
 assert.equal(createHash('sha256').update(JSON.stringify(approved)).digest('hex'),'94e0ad67cc30f4f9f0e760f0c38919cea344d21e935d7a80c102e95374f3d383','The owner-approved full-film appearance must remain unchanged');
 for(const [key,asset] of Object.entries(v1.assets)){
  const bytes=await readFile(new URL('../public'+asset.path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,key);
  if(key!=='motion')assert.deepEqual(v2.assets[key],asset,key);
 }
 assert.deepEqual(v2.output,v1.output);assert.deepEqual(v2.scenes,v1.scenes);
 assert.notEqual(v2.assets.motion.path,v1.assets.motion.path);
 assert.deepEqual(await loadVideoMaster(id),v3);
 assert.notEqual(renderDigest('owner',v1,{},[]),renderDigest('owner',v2,{},[]));
 const old=JSON.parse(await readFile(new URL('../public'+v1.assets.motion.path,import.meta.url))),current=JSON.parse(await readFile(new URL('../public'+v2.assets.motion.path,import.meta.url)));
 assert.equal(current.frames.length,1296);assert.deepEqual(current.occlusion,old.occlusion);
 // The approved review already contained the earlier trial's character paths.
 // Preserve those exact paths, rather than reverting to pre-trial production.
 const characters=current.frames.map(entries=>entries.filter(e=>['groom','bride','closing'].includes(e.asset)).map(e=>({asset:e.asset,matrix:e.matrix})));
 assert.equal(createHash('sha256').update(JSON.stringify(characters)).digest('hex'),'e8cbdae31d5c6530ed706825fb391fbdb068dee29c1aa2fbc6ce8f0220960657');
});
test('v3 restyles typography and wardrobe while preserving the base plate and every motion track',async()=>{
 const changed=new Set(['groom','bride','closing']);
 for(const [key,asset]of Object.entries(v2.assets))if(!changed.has(key))assert.deepEqual(v3.assets[key],asset,key);
 for(const asset of Object.values(v3.assets))assert.equal(createHash('sha256').update(await readFile(new URL('../public'+asset.path,import.meta.url))).digest('hex'),asset.sha256);
 for(const key of ['output','scenes','textPlanes','petals','layerOrder'])assert.deepEqual(v3[key],v2[key],key);
 for(const [scene,blocks]of Object.entries(v3.text)){
  assert.deepEqual(blocks.map(b=>b.binding),v2.text[scene].map(b=>b.binding));
  for(const block of blocks){assert.ok(['Arima-700','MuktaMalar-600'].includes(block.font));assert.equal(block.color,scene==='ceremony'?'#FFF0C8':/Label$/.test(block.binding)||['groomTitle','brideTitle','dateShort'].includes(block.binding)?'#77501F':'#124D4B');}
 }
 assert.notEqual(renderDigest('owner',v2,{},[]),renderDigest('owner',v3,{},[]));
 assert.throws(()=>pinVideoMasterVersion(id,{masterVersion:3},{payload:{masterVersion:2}}),/different/);
});
test('the Temple draft boundary rejects changing a saved version',async()=>{
 const invitation=randomUUID(),owner=randomUUID();let row=null,writes=0;
 const service=draftService({store:{},query:async(path,opts)=>{
  if(path.startsWith('personalization_drafts?'))return row?[row]:[];
  assert.equal(path,'rpc/fmi_save_personalization_draft');writes++;row={id:invitation,template_id:id,payload:opts.body.p_payload,revision:writes};return [row];
 }});
 const input={id:invitation,kind:'video',templateId:id,revision:0,payload:{masterVersion:2,content:{groom:'Sample'}}};
 assert.equal((await service.save(owner,input)).payload.masterVersion,2);
 await assert.rejects(service.save(owner,{...input,revision:1,payload:{content:{}}}),/different/);assert.equal(writes,1);
 row={...row,payload:{content:{groom:'Legacy'}}};
 assert.equal((await service.save(owner,{...input,revision:1,payload:{content:{groom:'Legacy edit'}}})).payload.masterVersion,1);
 await assert.rejects(service.save(owner,{...input,revision:2}),/different/);
});
test('Temple render jobs carry their saved master version and require the qualified v2 worker',async()=>{
 const env={VERCEL:'1',VIDEO_PERSONALISE_ENABLED:'1',VIDEO_RENDER_SNAPSHOT_ID:'legacy',BLOB_READ_WRITE_TOKEN:'test'};
 assert.doesNotThrow(()=>requireVideoRelease(v1,env));
 assert.throws(()=>requireVideoRelease(v2,env),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(v2,{...env,VIDEO_TEMPLE_SNAPSHOT_ID:'qualified-v2'}));
 assert.throws(()=>requireVideoRelease(v3,{...env,VIDEO_TEMPLE_SNAPSHOT_ID:'qualified-v2'}),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(v3,{...env,VIDEO_TEMPLE_V3_SNAPSHOT_ID:'qualified-v3'}));
 const jobs=[];
 for(const version of [1,2,3]){
  const rows=new Map(),store={async read(k){return rows.get(k)||null;},async save(k,value){rows.set(k,{value,etag:'1'});}};
  const service=videoService({store,env:{VIDEO_PERSONALISE_ENABLED:'1'},masterLoader:async(template,requested)=>{assert.equal(requested,version);return loadVideoMaster(template,requested);},launch:async job=>jobs.push(job)});
  await service.start('owner-'+version,TEMPLE_DEFAULTS,id,randomUUID(),version);
 }
 assert.equal(jobs[0].master.version,1);assert.equal(jobs[1].master.version,2);
 assert.equal(jobs[1].master.assets.motion.path,v2.assets.motion.path);
 assert.equal(jobs[2].master.version,3);assert.equal(jobs[2].master.assets.groom.path,v3.assets.groom.path);
});
