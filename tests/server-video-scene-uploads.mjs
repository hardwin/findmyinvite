import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {sceneUploadPrompt,uploadedEveryScene} from '../shared/scene-uploads.mjs';
import {photoCutout} from '../server/video-photo-cutout.mjs';
import {validateSceneUpload} from '../server/video-scene-upload.mjs';
import {validatePreparedCharacters} from '../server/video-character-access.mjs';
const definition=videoDefinition('film-anbil-avan-v1',1);

test('the role shown in the prompt, review and saved selection belongs to this scene',async()=>{
 const scene=definition.photoSlots.find(s=>s.slot==='umbrellaBride'),names={bride:'Priya',groom:'Arun'};
 const prompt=sceneUploadPrompt(definition,scene,true,names);
 assert.match(prompt,/bride \(Priya\)/);assert.match(prompt,/Image 1 is my personal photo/);assert.match(prompt,/Image 2 is the style sample/);assert.doesNotMatch(prompt,/Arun/);
 const photos=Object.fromEntries(definition.photoSlots.map(s=>[s.slot,{id:randomUUID(),mode:'cutout',confirmed:true}]));
 const checks=Object.fromEntries(Object.entries(photos).map(([k,p])=>[k,p.id]));
 const payload={content:{photos},personalPhotosEnabled:true,sceneChecks:checks,photoWorkflow:'scene-uploads',masterVersion:1};
 const args={templateId:definition.id,draft:{payload}};
 assert.equal(uploadedEveryScene(definition,photos,checks),true);
 await validatePreparedCharacters('owner','draft',photos,undefined,args);
 checks.umbrellaBride=photos.groomPortrait.id;
 await assert.rejects(validatePreparedCharacters('owner','draft',photos,undefined,args),/confirm each scene/);
 const media={invitationId:'draft',sha256:'duplicate',sceneUpload:{slot:'umbrellaBride',templateId:definition.id,masterVersion:1}};
 await assert.rejects(validateSceneUpload(media,{id:'draft',template_id:definition.id,payload:{content:{photos:{groomPortrait:photos.groomPortrait}}}},async()=>({sha256:'duplicate'})),/Groom portrait/);
});

test('a scene keeps its uploaded pixels and incurs at most one background request; transparent input is free',async()=>{
 const base=await sharp({create:{width:160,height:200,channels:3,background:'#cc3322'}}).png().toBuffer();
 const shape=await sharp({create:{width:90,height:150,channels:3,background:'blue'}}).png().toBuffer();
 const matte=await sharp({create:{width:160,height:200,channels:4,background:'#0000'}}).composite([{input:shape,left:35,top:25}]).png().toBuffer();
 for(const transparent of [false,true]){
  const media={id:randomUUID(),owner:'owner',invitationId:'draft',key:'source',kind:'image',status:'ready',contentType:'image/png',sceneUpload:{templateId:definition.id,masterVersion:1,slot:'umbrellaBride'}};
  let record=media,maskCalls=0;
  const blobs=new Map([['source',transparent?matte:base]]);
  const store={read:async()=>({value:record,etag:record}),save:async(k,v,{etag})=>{if(etag!==record)throw Error('Conflict');record=v;},bytes:async k=>blobs.get(k),putBytes:async(k,v)=>blobs.set(k,v)};
  const provider={sceneBackgroundMask:async()=>{maskCalls++;return {id:'cut'};},get:async()=>({status:'succeeded',output:'mask'}),output:async()=>matte};
  assert.equal((await photoCutout(store,media,{provider})).started,false);
  await photoCutout(store,media,{start:true,provider});
  assert.deepEqual(await photoCutout(store,media,{start:true,provider}),{ready:true});
  assert.deepEqual(await photoCutout(store,media,{start:true,provider}),{ready:true});assert.equal(maskCalls,transparent?0:1);
  const img=sharp(blobs.get(record.cutoutKey)),info=await img.metadata();assert.equal(info.width,1122);assert.equal(info.height,1402);
  const raw=await img.raw().toBuffer(),pos=raw.findIndex((v,i)=>i%4===3&&v===255)-3;
  assert.ok(pos>=0);assert.deepEqual(Array.from(raw.subarray(pos,pos+3)),transparent?[0,0,255]:[204,51,34]);
 }
});
