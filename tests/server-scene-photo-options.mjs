import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {hash} from '../server/video-personalise-store.mjs';
import {photoCutout} from '../server/video-photo-cutout.mjs';
import {prepareIllustratedPhoto} from '../server/video-scene-photo-option.mjs';
import {sceneReferencePath} from '../shared/scene-photo-art.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';

test('each scene option keeps its own reference, reviewable transparent PNG and original file',async()=>{
 const records=new Map(),blobs=new Map(),store={
  read:async k=>records.has(k)?{value:structuredClone(records.get(k)),etag:hash(records.get(k))}:null,
  save:async(k,v,o={})=>{if(o.create&&records.has(k)||o.etag&&hash(records.get(k))!==o.etag)throw Error('Conflict');records.set(k,structuredClone(v));},
  bytes:async k=>blobs.get(k),putBytes:async(k,b)=>{if(blobs.has(k))throw Error('Already saved');blobs.set(k,b);}
 };
 const subject=await sharp({create:{width:60,height:100,channels:4,background:'teal'}}).png().toBuffer();
 const photos=await sharp({create:{width:160,height:160,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:subject,left:50,top:40}]).png().toBuffer();
 const draft={id:randomUUID(),owner_id:randomUUID(),template_id:'film-were-next-v1',payload:{masterVersion:1}},optionId=randomUUID();
 const media={id:randomUUID(),owner:draft.owner_id,invitationId:draft.id,durable:true,key:'photo',status:'ready',kind:'image',sha256:hash(photos),contentType:'image/png',bytes:photos.length};
 blobs.set('photo',photos);await store.save('media/'+media.id+'.json',media);
 const calls=[],provider={create:async(input,hook)=>{calls.push({input,hook});return {id:'job'};},get:async()=>({status:'succeeded',output:'provider-output'}),output:async()=>photos};
 const request={store,media,draft,slot:'opening',optionId,onStart:async()=>{},provider};
 assert.deepEqual(await prepareIllustratedPhoto(request),{ready:false,id:optionId});
 assert.equal(calls.length,1);assert.match(calls[0].input.prompt,/every garment/);assert.equal(calls[0].input.input_images.length,2);
 const option=records.get('media/'+optionId+'.json');assert.deepEqual(await photoCutout(store,option,{provider}),{ready:true});
 assert.deepEqual(await prepareIllustratedPhoto(request),{ready:true,id:optionId});
 assert.equal(calls.length,1);assert.ok(records.get('media/'+optionId+'.json').cutoutKey);
 assert.equal(records.get('media/'+media.id+'.json').cutoutKey,undefined);
 await assert.rejects(prepareIllustratedPhoto({...request,slot:'reveal'}),/reference again/);
 await assert.rejects(prepareIllustratedPhoto({...request,draft:{...draft,id:randomUUID()}}),/this invitation/);
 assert.equal(sceneReferencePath(videoDefinition('film-oonjal-v1',3),'bride'),null);
 assert.ok(sceneReferencePath(videoDefinition('film-jannal-v1'),'groom'));
});
