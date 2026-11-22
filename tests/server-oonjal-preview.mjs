import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPlate,seekPlate} from '../public/assets/video-scenes/oonjal-v3/media-r2.js';
import {videoRequiresLocalPreview,validateMaaplaDetails} from '../shared/video-preview-requirement.mjs';
import {normalizeVideoContent,videoDefinition} from '../shared/video-personalization.mjs';
import {prepareSceneMaster,sceneSchema} from '../server/video-scene-details.mjs';
import {loadVideoMaster} from '../server/video-personalise.mjs';

class MetadataOnlyVideo extends EventTarget {
 readyState=0;seeking=false;time=0;
 load(){queueMicrotask(()=>{this.readyState=1;this.dispatchEvent(new Event('loadedmetadata'));});}
 get currentTime(){return this.time;}
 set currentTime(value){this.seeking=true;queueMicrotask(()=>{this.time=value;this.readyState=2;this.seeking=false;this.dispatchEvent(new Event('canplay'));});}
}
test('metadata-only preload can seek its first personalised frame without loadeddata or seeked',async()=>{
 const video=new MetadataOnlyVideo();await loadPlate(video,'preview.mp4');
 assert.equal(video.readyState,1);assert.equal(video.muted,true);assert.equal(video.playsInline,true);
 await seekPlate(video,252);assert.equal(Math.floor(video.currentTime*24),252);
 await seekPlate(video,75);assert.equal(Math.floor(video.currentTime*24),75);
});
test('cached readiness, missing media and disposed previews always settle',async()=>{
 const cached=new MetadataOnlyVideo();cached.readyState=2;cached.load=()=>{};
 await loadPlate(cached,'cached.mp4');await seekPlate(cached,0);
 const stalled=new MetadataOnlyVideo();stalled.load=()=>{};
 await assert.rejects(loadPlate(stalled,'stalled.mp4',{timeoutMs:10}),/taking too long/);
 const controller=new AbortController();const pending=loadPlate(stalled,'closed.mp4',{signal:controller.signal});controller.abort();
 await assert.rejects(pending,{name:'AbortError'});
});
test('Maapla can export without a local decoder while retaining server validation and other templates preview gates',async()=>{
 const master=await loadVideoMaster('film-oonjal-v1',3);
 assert.equal(videoRequiresLocalPreview(master),false);
 for(const m of [undefined,{id:'film-oonjal-v1',version:1},{id:'film-oonjal-v1',version:3},{id:'temple-v1',version:3,assetRevision:2},{id:'wedding-bells-v1',version:2,assetRevision:2}])assert.equal(videoRequiresLocalPreview(m),true);
 const options={complete:true,templateId:master.id,masterVersion:3};
 const content=normalizeVideoContent({...videoDefinition(master.id,3).example,brideEn:'Mozhi',groomEn:'Arjun',weddingDate:'2027-09-22'},options);
 const schema=await sceneSchema(master.id);assert.doesNotThrow(()=>validateMaaplaDetails(content,schema));
 assert.throws(()=>validateMaaplaDetails({...content,weddingDate:'2020-01-01'},schema));
 assert.throws(()=>validateMaaplaDetails({...content,brideEn:'A name longer than twelve characters'},schema));
 assert.equal((await prepareSceneMaster(master,content)).output.frames,828);
 assert.throws(()=>normalizeVideoContent({...content,brideEn:''},options));
 assert.throws(()=>normalizeVideoContent({...content,weddingDate:'2027-02-30'},options));
 await assert.rejects(prepareSceneMaster(master,{...content,weddingDate:'2020-01-01'}));
});
