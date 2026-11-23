import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WERE_NEXT_ID as id,WERE_NEXT_DEFINITION as definition} from '../shared/were-next-video.mjs';
import {assertMaster,normalizeVideoContent} from '../shared/video-personalization.mjs';
import {prepareSceneMaster} from '../server/video-scene-details.mjs';
import {PUBLIC_VIDEO_IDS} from '../shared/video-visibility.mjs';
import {usesOriginalWereNextAudio} from '../shared/music-selection.mjs';
import {videoDefaultMusic} from '../server/video-music.mjs';
import {dateParts,validateFields} from '../public/assets/video-scenes/v1/editor/details-were-next.js';
import {videoOffer,videoQuote} from '../shared/video-pricing.mjs';
import {isFreeVideo} from '../shared/video-access.mjs';
import {catalogPreviewPlayback} from '../shared/catalog-preview-playback.mjs';
import {videoNewOrSavedVersion,videoDraftVersion,videoMasterVersion} from '../shared/video-master-version.mjs';
import {requireVideoRelease,loadVideoMaster} from '../server/video-personalise.mjs';
import previews from '../shared/catalog-preview-media.mjs';
import {templateShareData} from '../server/template-share.mjs';
import {matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';
const master=JSON.parse(await readFile('public/assets/video-masters/'+id+'/manifest.json'));

test('new template is ₹299, has one embedded preview soundtrack and pins version one',async()=>{
 assert.equal(videoOffer(id).basePaise,29900);assert.equal(videoOffer(id).originalPaise,0);
 assert.equal(videoQuote(id).totalPaise,35282);assert.equal(isFreeVideo(id),false);
 assert.equal(matchesDiscoverySearch({id},'Save the Date'),true);
 for(const religion of ['Christian','Hindu','Muslim'])assert.equal(matchesDiscoverySearch({id},religion),false);
 assert.equal(catalogPreviewPlayback(id,'preview.mp4').embeddedMusic,true);
 assert.equal(videoNewOrSavedVersion(id,null),1);assert.equal(videoDraftVersion(id,{}),1);
 assert.throws(()=>videoMasterVersion(id,2));assert.deepEqual(await loadVideoMaster(id,1),master);
 const env={VERCEL:'1',VIDEO_PERSONALISE_ENABLED:'1',BLOB_READ_WRITE_TOKEN:'test',VIDEO_SCENE_SNAPSHOT_ID:'old-worker'};
 assert.throws(()=>requireVideoRelease(master,env),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(master,{...env,VIDEO_WERE_NEXT_SNAPSHOT_ID:'qualified-worker'}));
 const entry=templateShareData({id,name:definition.name,...previews.videos[id],quote:videoQuote(id)},'video');
 assert.equal(entry.amountPaise,29900);assert.ok(entry.video.endsWith('/were-next-v1/preview.mp4'));
 for(const path of [entry.poster,entry.video,...Object.values(previews.videos[id].posters)])assert.ok((await readFile('public'+path)).length>0);
});
test('approved release is public and rejects unqualified or altered masters',()=>{
 assert.equal(PUBLIC_VIDEO_IDS.includes(id),true);
 assert.doesNotThrow(()=>assertMaster(master));
 assert.doesNotThrow(()=>assertMaster(master,{released:true}));
 assert.throws(()=>assertMaster({...master,release:{approved:false}},{released:true}),/prepared/);
 for(const changed of [{...master,version:2},{...master,sceneFrame:undefined},{...master,output:{...master.output,fps:24,frames:240}}])assert.throws(()=>assertMaster(changed));
});
test('source frame rate and all 300 frames survive preparation',async()=>{
 const prepared=await prepareSceneMaster(master,definition.example);
 assert.deepEqual(prepared.output,{width:720,height:1280,fps:30,frames:300,duration:10});
 assert.deepEqual(prepared.scenes.map(s=>[s.start,s.end]),[[0,150],[150,192],[192,300]]);
 const legacy=JSON.parse(await readFile('public/assets/video-masters/film-oonjal-v1/manifest.json'));
 const old=await prepareSceneMaster(legacy,{brideEn:'Diya',groomEn:'Arun',weddingDate:'2027-12-21'});
 assert.equal(old.output.fps,24);assert.equal(old.output.frames,828);
});
test('two confirmed photo uploads bind independently; partial date never becomes sample date',async()=>{
 const photos={opening:{id:'11111111-1111-4111-8111-111111111111',mode:'frame',confirmed:true},reveal:{id:'22222222-2222-4222-8222-222222222222',mode:'frame',confirmed:true}};
 const content=normalizeVideoContent({...definition.defaults,photos},{templateId:id});
 assert.deepEqual(content.photos,photos);assert.equal(content.weddingDate,'');
 assert.deepEqual(definition.photoSlots.map(s=>s.slot),['opening','reveal']);
 await assert.rejects(prepareSceneMaster(master,content),/date/);
 assert.throws(()=>normalizeVideoContent({...content,photos:{opening:{...photos.opening,confirmed:false}}},{templateId:id}),/Confirm/);
});
test('date ordinals and invalid dates are deterministic',()=>{
 for(const [day,suffix]of [[1,'st'],[2,'nd'],[3,'rd'],[11,'th'],[12,'th'],[13,'th'],[21,'st'],[22,'nd'],[23,'rd'],[31,'st']])assert.equal(dateParts('2027-12-'+String(day).padStart(2,'0'))[1],suffix);
 assert.deepEqual(dateParts(''),[]);assert.deepEqual(dateParts('2027-02-30'),[]);
 assert.equal(validateFields({...definition.example,weddingDate:'2027-02-30'}).ok,false);
 assert.equal(validateFields({...definition.example,opening:'A'.repeat(65)}).ok,false);
});
test('reference audio is exact, scoped to this version and selected by default',async()=>{
 const music={mode:'library',id:'were-next-original'};
 assert.equal(usesOriginalWereNextAudio(master,music),true);
 assert.equal(usesOriginalWereNextAudio({...master,version:2},music),false);
 assert.deepEqual(videoDefaultMusic(id,{assignments:[],tracks:[{id:music.id}]},1),music);
 const bytes=await readFile('public/assets/music-library/were-next-original.m4a');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),master.source.audioSha256);
});

test('runtime assets are immutable and the two mobile illustrations stay below 1.5 MiB',async()=>{
 const bytes=await readFile('public'+master.assets.sceneBundle.path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),master.assets.sceneBundle.sha256);
 const index=JSON.parse(bytes);
 for(const [path,sha256] of Object.entries(index.files))assert.equal(createHash('sha256').update(await readFile('public'+path)).digest('hex'),sha256,path);
 const images=await Promise.all(['opening','reveal'].map(slot=>readFile('public/assets/video-scenes/were-next-v1/assets/couple-'+slot+'.webp')));
 assert.ok(images.reduce((size,b)=>size+b.length,0)<1.5*1024*1024);
 assert.ok((await readFile('public'+previews.videos[id].posters[640])).length<150*1024);
});
