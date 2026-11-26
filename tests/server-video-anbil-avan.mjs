import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ANBIL_AVAN_ID as id,ANBIL_AVAN_DEFINITION as definition,ANBIL_AVAN_FIELDS,ANBIL_AVAN_POSE_SLOTS,ANBIL_AVAN_CUTS,ANBIL_AVAN_CHARACTER_PROFILE,posesForIdentity} from '../shared/anbil-avan-video.mjs';
import {catalogVideo,VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {videoDefinition,normalizeVideoContent,assertMaster,MUSIC} from '../shared/video-personalization.mjs';
import {prepareSceneMaster,sceneSchema} from '../server/video-scene-details.mjs';
import {PUBLIC_VIDEO_IDS,isPublicVideo} from '../shared/video-visibility.mjs';
import {videoOffer,videoQuote} from '../shared/video-pricing.mjs';
import {isFreeVideo} from '../shared/video-access.mjs';
import {isVersionedVideo,videoMasterVersion,videoNewOrSavedVersion,videoDraftVersion,pinVideoMasterVersion} from '../shared/video-master-version.mjs';
import {usesOriginalAnbilAvanAudio,usesOriginalWereNextAudio,usesOriginalOonjalAudio} from '../shared/music-selection.mjs';
import {videoDefaultMusic} from '../server/video-music.mjs';
import {requireVideoRelease,loadVideoMaster,videoService} from '../server/video-personalise.mjs';
import {hash} from '../server/video-personalise-store.mjs';
import {catalogPreviewPlayback} from '../shared/catalog-preview-playback.mjs';
import {matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';
import {validateMicroDescription} from '../shared/catalog-identity.mjs';
import descriptions from '../shared/catalog-descriptions.json' with {type:'json'};
import seeds from '../shared/music-seeds.json' with {type:'json'};
import {renderSceneVideo} from '../scripts/render-scene-video.mjs';
import {renderPersonalizedVideo} from '../scripts/render-personalized-video.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=JSON.parse(await readFile('public/assets/video-masters/'+id+'/manifest-v1.json','utf8'));
const proofs={default:'a'.repeat(64),personalized:'b'.repeat(64)};
const released={...raw,release:{approved:true,rendererVersion:'scene-film-v1',cloudVerified:true,proofs}};
const uuid=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
const allPoses=(prefix=0)=>Object.fromEntries(ANBIL_AVAN_POSE_SLOTS.map((slot,i)=>[slot,{id:uuid(prefix+i),mode:'prepared',confirmed:true}]));

test('soundtrack revision changes only audio and preview; approved layers and prior master stay immutable',async()=>{
 const revised=await loadVideoMaster(id,1);
 assert.equal(definition.name,'Mazhavillaye');
 assert.equal(definition.form.title,'Personalise Mazhavillaye');
 assert.notEqual(revised.source.audioSha256,raw.source.audioSha256);
 const {audioSha256,soundtrackRevision,...source}=revised.source;
 const {audioSha256:oldAudio,...oldSource}=raw.source;
 assert.deepEqual(source,oldSource);
 assert.deepEqual({...revised,source:raw.source,catalog:raw.catalog},raw);
 assert.match(revised.catalog.preview,/preview-mazhavillaye-v1\.mp4$/);
 assert.equal(usesOriginalAnbilAvanAudio(raw,{mode:'library',id:'anbil-avan-original'}),true);
});

test('Mazhavillaye is ₹299 + 18% GST (₹352.82) with no offer; existing prices are unchanged',()=>{
 assert.deepEqual(videoOffer(id),{basePaise:29900,originalPaise:0,offerLabel:'',tier:'premium'});
 assert.deepEqual(videoQuote(id),{basePaise:29900,taxBps:1800,taxPaise:5382,totalPaise:35282,taxLabel:'GST',currency:'INR'});
 assert.equal((videoQuote(id).totalPaise/100).toFixed(2),'352.82');
 assert.equal(isFreeVideo(id),false);
 assert.deepEqual(videoOffer('wedding-bells-v1'),{basePaise:69900,originalPaise:159900,offerLabel:'Christmas Offer',tier:'premium'});
 for(const old of ['film-oonjal-v1','film-were-next-v1'])assert.deepEqual(videoOffer(old),{basePaise:29900,originalPaise:0,offerLabel:'',tier:'premium'});
 assert.deepEqual(videoOffer('film-tiles-v1'),{basePaise:0,originalPaise:0,offerLabel:'',tier:'standard'});
 assert.deepEqual(videoOffer('unlisted-paid-v1'),{basePaise:49900,originalPaise:99900,offerLabel:'',tier:'standard'});
});

test('public release adds Mazhavillaye after the existing three approved designs',()=>{
 assert.deepEqual(PUBLIC_VIDEO_IDS,['wedding-bells-v1','film-oonjal-v1','film-were-next-v1',id]);
 assert.equal(isPublicVideo(id),true);
 assert.equal(catalogVideo(id),definition);assert.equal(videoDefinition(id,1),definition);
 assert.equal(VIDEO_CATALOG.filter(d=>d.id===id).length,1);assert.equal(VIDEO_CATALOG.at(-2).id,'film-were-next-v1');
 assert.equal(validateMicroDescription(descriptions.video[id]),'Illustrated love story');
 assert.equal(catalogPreviewPlayback(id,'preview.mp4').embeddedMusic,true);
 for(const query of ['Christian','Hindu','Muslim','Save the Date'])assert.equal(matchesDiscoverySearch({id},query),false,query);
 assert.equal(raw.release.approved,true);assert.equal(raw.release.cloudVerified,true);
});

test('version one is pinned for new and saved drafts',async()=>{
 assert.equal(isVersionedVideo(id),true);
 assert.equal(videoNewOrSavedVersion(id,null),1);assert.equal(videoDraftVersion(id,{}),1);assert.equal(videoMasterVersion(id,1),1);
 assert.throws(()=>videoMasterVersion(id,2),/Mazhavillaye version is unavailable/);
 assert.equal(pinVideoMasterVersion(id,{},null),1);assert.equal(pinVideoMasterVersion(id,{masterVersion:1},{payload:{masterVersion:1}}),1);
 assert.throws(()=>pinVideoMasterVersion(id,{masterVersion:2},{payload:{}}),/Mazhavillaye/);
 const pinned=await loadVideoMaster(id,1),current=await loadVideoMaster(id);
 for(const m of [pinned,current]){assert.equal(m.version,1);assert.equal(m.renderProfile,'layered-2d-v1');}
});

test('dedicated form exposes exactly the eight details; headings, music and nine poses are not uploads',async()=>{
 const questions=definition.form.steps.flatMap(s=>s.questions);
 assert.deepEqual(questions.map(q=>q.path),[...ANBIL_AVAN_FIELDS]);
 assert.deepEqual(definition.form.steps.map(s=>s.id),['couple','wedding','reception','characters','review']);
 assert.ok(questions.every(q=>q.required));
 assert.deepEqual(questions.map(q=>q.type),['text','text','date','time','text','date','time','text']);
 assert.deepEqual([...(await sceneSchema(id)).FIELD_KEYS],[...ANBIL_AVAN_FIELDS]);
 assert.equal(ANBIL_AVAN_POSE_SLOTS.length,9);assert.deepEqual(definition.photoSlots.map(s=>s.slot),[...ANBIL_AVAN_POSE_SLOTS]);
 assert.ok(definition.photoSlots.every(s=>s.mode==='prepared'));
 const inventory=JSON.parse(await readFile('public'+ANBIL_AVAN_CHARACTER_PROFILE.inventory,'utf8'));
 assert.deepEqual(Object.keys(inventory),[...ANBIL_AVAN_POSE_SLOTS]);
 ANBIL_AVAN_CHARACTER_PROFILE.poses.forEach((pose,i)=>{assert.equal(inventory[pose.slot].sceneIndex,i);assert.equal(raw.scenes[i].id,pose.scene);});
 assert.deepEqual(posesForIdentity('bride'),['openingCouple','heartCouple','umbrellaBride','bridePortrait','weddingCouple','receptionCouple','closingCouple']);
 assert.deepEqual(posesForIdentity('groom'),['openingCouple','heartCouple','groomPrint','groomPortrait','weddingCouple','receptionCouple','closingCouple']);
});

test('normalisation locks the recording, trims text and accepts only one complete prepared set',()=>{
 const example=definition.example,options={complete:true,templateId:id,masterVersion:1};
 const content=normalizeVideoContent({...example,bride:'  Priya ',music:{mode:'library',id:'heartwarming'}},options);
 assert.deepEqual(content.music,{mode:'library',id:'mazhavillaye-posted-v1'});assert.equal(content.bride,'Priya');
 assert.deepEqual(Object.keys(content),[...ANBIL_AVAN_FIELDS,'photos','music']);
 assert.deepEqual(normalizeVideoContent({...example,music:{mode:'upload',id:uuid(99)}},options).music,{mode:'library',id:'mazhavillaye-posted-v1'});
 const all=allPoses();assert.deepEqual(normalizeVideoContent({...example,photos:all},options).photos,all);
 const {closingCouple,...partial}=all;assert.ok(closingCouple);
 assert.throws(()=>normalizeVideoContent({...example,photos:partial},options),/one approved set/);
 assert.throws(()=>normalizeVideoContent({...example,photos:{...all,openingCouple:{...all.openingCouple,mode:'frame'}}},options),/Confirm the openingCouple/);
 assert.throws(()=>normalizeVideoContent({...example,photos:{...all,bridePortrait:{...all.bridePortrait,confirmed:false}}},options),/Confirm the bridePortrait/);
 // Raw portrait-style slots are not part of this design and never bind to a pose.
 assert.deepEqual(normalizeVideoContent({...example,photos:{bride:{id:uuid(1),mode:'frame',confirmed:true}}},options).photos,{});
 assert.throws(()=>normalizeVideoContent({...example,weddingDate:'2026-02-30'},options),/valid date/);
 assert.throws(()=>normalizeVideoContent({...example,receptionTime:'25:00'},options),/valid time/);
 assert.throws(()=>normalizeVideoContent({...example,bride:'<b>Priya</b>'},options),/Check bride/);
 assert.throws(()=>normalizeVideoContent({...example,groom:'A'.repeat(33)},options),/Check groom/);
 const draft=normalizeVideoContent(definition.defaults,{templateId:id});assert.equal(draft.bride,'');assert.deepEqual(draft.music,{mode:'library',id:'mazhavillaye-posted-v1'});
});

test('scene preparation keeps the approved cuts and rejects missing or oversized text',async()=>{
 assert.doesNotThrow(()=>assertMaster(raw));
 const prepared=await prepareSceneMaster(raw,normalizeVideoContent(definition.example,{complete:true,templateId:id}));
 assert.deepEqual(prepared.output,{width:720,height:1280,fps:25,frames:876,duration:35.04});
 assert.deepEqual([prepared.scenes[0].start,...prepared.scenes.map(s=>s.end)],[...ANBIL_AVAN_CUTS]);
 assert.deepEqual(prepared.scenes.map(s=>[s.id,s.start,s.end,s.reviewFrame]),raw.scenes.map(s=>[s.id,s.start,s.end,s.reviewFrame]));
 assert.doesNotThrow(()=>assertMaster(prepared));
 await assert.rejects(prepareSceneMaster(raw,{...definition.example,bride:''}),e=>e.code==='TEXT_FIT'&&e.field==='bride');
 await assert.rejects(prepareSceneMaster(raw,{...definition.example,weddingVenue:'V'.repeat(61)}),e=>e.code==='TEXT_FIT'&&e.field==='weddingVenue');
});

test('master validation is bound to the layered profile, exact timeline and a cloud-verified release',async()=>{
 assert.throws(()=>assertMaster({...raw,release:{...raw.release,approved:false}},{released:true}),/prepared/);
 const approved={...raw,release:{...raw.release,approved:true,cloudVerified:false,proofs}};
 assert.throws(()=>assertMaster(approved,{released:true}),/prepared/);
 assert.doesNotThrow(()=>assertMaster(released,{released:true}));
 for(const changed of [{...raw,renderProfile:undefined},{...raw,renderProfile:'layered-2d-v2'},{...raw,version:2},{...raw,sceneFrame:'/assets/video-scenes/v1/frame.html'},{...raw,output:{...raw.output,fps:24,frames:841,duration:841/24}},{...raw,scenes:raw.scenes.map((s,i)=>i===1?{...s,start:69}:s)},{...raw,source:{}}])assert.throws(()=>assertMaster(changed));
 const wereNext=JSON.parse(await readFile('public/assets/video-masters/film-were-next-v1/manifest-v1.json','utf8'));
 assert.throws(()=>assertMaster({...wereNext,renderProfile:'layered-2d-v1'}),/render profile/);
 assert.doesNotThrow(()=>assertMaster(wereNext,{released:true}));
});

test('downloads require the dedicated layered worker snapshot',()=>{
 const env={VERCEL:'1',VIDEO_PERSONALISE_ENABLED:'1',BLOB_READ_WRITE_TOKEN:'test-only',VIDEO_SCENE_SNAPSHOT_ID:'scene-worker',VIDEO_WERE_NEXT_SNAPSHOT_ID:'were-next-worker'};
 assert.throws(()=>requireVideoRelease(released,env),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(released,{...env,VIDEO_ANBIL_AVAN_SNAPSHOT_ID:'anbil-avan-worker'}));
 assert.throws(()=>requireVideoRelease({...raw,release:{...raw.release,approved:false}},{...env,VIDEO_ANBIL_AVAN_SNAPSHOT_ID:'anbil-avan-worker'}),/still being prepared/);
});

test('the pre-mixed recording is exact, locked, available in other pickers and never refaded or looped',async()=>{
 const music={mode:'library',id:'mazhavillaye-posted-v1'};
 assert.equal(usesOriginalAnbilAvanAudio(raw,music),true);
 assert.equal(usesOriginalAnbilAvanAudio({...raw,version:2},music),false);
 assert.equal(usesOriginalAnbilAvanAudio(raw,{mode:'library',id:'heartwarming'}),false);
 assert.equal(usesOriginalWereNextAudio(raw,music),false);assert.equal(usesOriginalOonjalAudio(raw,music),false);
 assert.deepEqual(videoDefaultMusic(id,{assignments:[{id,trackId:'heartwarming'}],tracks:[{id:'heartwarming'}]},1),music);
 assert.equal(MUSIC[music.id].path,'/assets/music-library/mazhavillaye-posted-v1.m4a');assert.doesNotMatch(MUSIC[music.id].credit,/Trimmed and faded/);
 const seed=seeds.find(t=>t.id===music.id);assert.equal(seed.status,'ready');assert.equal(seed.archived,false);assert.equal(seed.duration,35.04);
 assert.equal(sha(await readFile('public/assets/music-library/mazhavillaye-posted-v1.m4a')),(await loadVideoMaster(id)).source.audioSha256);
});

function renderFixture(){
 const records=new Map(),launched=[];
 const store={read:async key=>records.has(key)?{value:records.get(key),etag:'etag'}:null,save:async(key,value)=>{records.set(key,structuredClone(value));}};
 const service=videoService({store,env:{VIDEO_PERSONALISE_ENABLED:'1'},masterLoader:async()=>released,libraryMusic:async()=>({id:'library-mazhavillaye-posted-v1',kind:'audio',key:'library/mazhavillaye-posted-v1/x.audio',sha256:raw.source.audioSha256,library:true,credit:'Original soundtrack'}),launch:async job=>{launched.push(job);}});
 const add=(owner,invitationId,photos,patch={})=>{for(const [slot,p] of Object.entries(photos))records.set('media/'+p.id+'.json',{id:p.id,owner,invitationId,kind:'image',status:'ready',key:'persistent/'+owner+'/'+invitationId+'/characters/'+slot+'.webp',sha256:hash(slot+p.id),contentType:'image/webp',durable:true,expiresAt:null,characterSetId:uuid(500),characterProfile:'anbil-avan-2d-v1',characterMasterVersion:1,characterSlot:slot,...(typeof patch==='function'?patch(slot):patch)});};
 const unlock=()=>{for(const key of [...records.keys()])if(key.startsWith('locks/'))records.delete(key);};
 return {records,launched,service,add,unlock};
}

test('exports bind all nine prepared layers from one owner-scoped set; raw uploads never fill a pose',async()=>{
 const owner=uuid(900),invitation=uuid(901),photos=allPoses(),f=renderFixture();f.add(owner,invitation,photos);
 const job=await f.service.start(owner,{...definition.example,photos},id,invitation,1);
 assert.equal(job.status,'queued');const record=f.launched[0];
 assert.deepEqual(record.media.filter(m=>m.slot).map(m=>[m.slot,m.mode]),ANBIL_AVAN_POSE_SLOTS.map(slot=>[slot,'prepared']));
 assert.deepEqual(record.content.music,{mode:'library',id:'mazhavillaye-posted-v1'});assert.equal(record.master.renderProfile,'layered-2d-v1');
 // A text-only edit reuses the same prepared character files and needs no new media.
 f.unlock();await f.service.start(owner,{...definition.example,weddingVenue:'Udupi',photos},id,invitation,1);
 assert.notEqual(f.launched[1].id,record.id);assert.deepEqual(f.launched[1].media.map(m=>m.sha256),record.media.map(m=>m.sha256));
 const cases=[
  ['raw upload',{characterSetId:undefined,characterProfile:undefined},/Prepare and confirm/],
  ['Temple job output',{characterSetId:undefined,characterProfile:undefined,characterJobId:uuid(77)},/Prepare and confirm/],
  ['another invitation',{invitationId:uuid(902)},/Prepare and confirm/],
  ['another profile',{characterProfile:'temple-cartoon-face-edit-v2'},/Prepare and confirm/],
  ['mixed sets',slot=>slot==='closingCouple'?{characterSetId:uuid(501)}:{},/one approved set/]
 ];
 for(const [label,patch,expected] of cases){const g=renderFixture();g.add(owner,invitation,photos,patch);await assert.rejects(g.service.start(owner,{...definition.example,photos},id,invitation,1),expected,label);assert.equal(g.launched.length,0,label);}
 const other=renderFixture();other.add(uuid(903),invitation,photos);
 await assert.rejects(other.service.start(owner,{...definition.example,photos},id,invitation,1),e=>e.status===404);
});

test('layered masters dispatch to the layered renderer before scene preparation; other films never do',async()=>{
 const tampered={...raw,assets:{sceneBundle:{...raw.assets.sceneBundle,sha256:'0'.repeat(64)}}};
 await assert.rejects(renderSceneVideo({master:tampered,content:definition.example,requireRelease:false,output:'unused.mp4',cache:{owner:uuid(1),store:{}}}),/Layered bundle checksum mismatch/);
 await assert.rejects(renderPersonalizedVideo({master:tampered,content:definition.example,requireRelease:false,output:'unused.mp4',cache:{owner:uuid(1),store:{}}}),/Layered bundle checksum mismatch/);
 const wereNext=JSON.parse(await readFile('public/assets/video-masters/film-were-next-v1/manifest-v1.json','utf8'));
 await assert.rejects(renderSceneVideo({master:{...wereNext,assets:{sceneBundle:{...wereNext.assets.sceneBundle,sha256:'0'.repeat(64)}}},content:catalogVideo('film-were-next-v1').example,requireRelease:false,output:'unused.mp4'}),/Scene asset index checksum mismatch/);
});
