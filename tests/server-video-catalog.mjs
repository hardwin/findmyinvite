import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';import {videoDefinition,normalizeVideoContent,assertMaster} from '../shared/video-personalization.mjs';import {sceneSchema,prepareSceneMaster} from '../server/video-scene-details.mjs';
import {requireVideoRelease} from '../server/video-personalise.mjs';
import {invitationNames} from '../shared/draft-display.mjs';
test('draft and review titles retain language, name order, birthdays and housewarmings',()=>{
 assert.equal(invitationNames({groomEn:'Kavin',groomTa:'கவின்',brideTa:'நித்யா',lang:'ta',order:'bride_first'}),'நித்யா & கவின்');
 assert.equal(invitationNames({groomMl:'അരുൺ',brideMl:'ദിയ'}),'അരുൺ & ദിയ');
 assert.equal(invitationNames({name1:'Diya',name2:'Rose'}),'Diya Rose');
 assert.equal(invitationNames({family:'Kumar family',hosts:'Kumar'}),'Kumar family');
 assert.equal(invitationNames({groomName:'Alex',brideName:'Anna'}),'Alex & Anna');
 assert.equal(invitationNames(), '');
});
const future=content=>Object.fromEntries(Object.entries(content).map(([k,v])=>[k,typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)?'2027'+v.slice(4):v]));
test('Word Tiles accepts its locked revision and preserves the previous master',async()=>{
 const current=JSON.parse(await readFile('public/assets/video-masters/film-tiles-v1/manifest.json'));
 const previous=JSON.parse(await readFile('public/assets/video-masters/film-tiles-v1/manifest-v1.json'));
 assert.doesNotThrow(()=>assertMaster(current,{released:true}));
 assert.doesNotThrow(()=>assertMaster(previous,{released:true}));
 assert.throws(()=>assertMaster({...current,sceneFrame:'https://example.com/frame.html'},{released:true}),/Unsupported scene frame/);
 assert.throws(()=>assertMaster({...current,assets:previous.assets},{released:true}),/still being prepared/);
});
test('scene downloads require their own worker while the existing Temple worker remains valid',async()=>{
 const raw=JSON.parse(await readFile('public/assets/video-masters/film-drive-v1/manifest.json'));
 const scene={...raw,release:{approved:true,rendererVersion:raw.rendererVersion,proofs:{default:'a'.repeat(64),personalized:'b'.repeat(64)}}};
 const env={VERCEL:'1',VIDEO_PERSONALISE_ENABLED:'1',VIDEO_RENDER_SNAPSHOT_ID:'existing-temple-worker',BLOB_READ_WRITE_TOKEN:'test-only'};
 assert.throws(()=>requireVideoRelease(scene,env),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(scene,{...env,VIDEO_SCENE_SNAPSHOT_ID:'new-scene-worker'}));
 const temple=JSON.parse(await readFile('public/assets/video-masters/temple-v1/manifest.json'));
 assert.doesNotThrow(()=>requireVideoRelease(temple,env));
 assert.throws(()=>normalizeVideoContent({...VIDEO_CATALOG[0].example,title:'<img src=x onerror=alert(1)>'},{templateId:scene.id}),/Check/);
});
test('all 38 additional designs have unique scene forms; Tamil 3D remains excluded',async()=>{
 assert.equal(VIDEO_CATALOG.length,38);assert.equal(new Set(VIDEO_CATALOG.map(d=>d.id)).size,38);assert.equal(VIDEO_CATALOG.some(d=>d.design==='thoon'),false);
 for(const d of VIDEO_CATALOG){assert.equal(videoDefinition(d.id),d);const schema=await sceneSchema(d.id),questions=d.form.steps.flatMap(s=>s.questions),keys=questions.map(q=>q.path);assert.equal(new Set(keys).size,keys.length,d.id+' repeats an editable field');
  const expected=schema.FIELD_KEYS.filter(k=>!/^photo.*(?:Id|Box)$/.test(k)&&!['music','songId','songName','songStart','songSeconds','songOk'].includes(k));assert.deepEqual([...keys].sort(),[...expected].sort(),d.id+' loses a field');
  for(const s of d.form.steps.filter(s=>!['music','review'].includes(s.id)))assert.ok(s.scene,d.id+' has a scene-independent step');
  assert.deepEqual(d.form.steps.slice(-2).map(s=>s.id),['music','review']);
 }
});
for(const d of VIDEO_CATALOG)test(d.name+': valid personalized fields, timeline and release isolation',async()=>{
 const raw=JSON.parse(await readFile('public/assets/video-masters/'+d.id+'/manifest.json')),master=assertMaster(raw),content=normalizeVideoContent(future(d.example),{complete:true,templateId:d.id});
 const actual=await prepareSceneMaster(master,content);assertMaster(actual);assert.equal(actual.scenes[0].start,0);assert.equal(actual.scenes.at(-1).end,actual.output.frames);
 assert.throws(()=>normalizeVideoContent({...content,[d.form.steps.flatMap(s=>s.questions)[0].path]:'\u0000'},{templateId:d.id}));
 const schema=await sceneSchema(d.id),required=schema.requiredKeys?.(content)||[];const field=required.find(k=>Object.hasOwn(content,k));if(field){await assert.rejects(()=>prepareSceneMaster(master,{...content,[field]:''}));}
 if(!master.release.approved)assert.throws(()=>assertMaster(master,{released:true}),/prepared/);
});
test('optional scenes change duration while preserving scene/form binding',async()=>{
 for(const slug of ['walk','veedu']){const d=VIDEO_CATALOG.find(d=>d.design===slug),master=JSON.parse(await readFile('public/assets/video-masters/'+d.id+'/manifest.json'));
  const full=future(d.example),without={...full,receptionDate:'',receptionFrom:'',receptionTo:'',receptionVenue:''};
  const a=await prepareSceneMaster(master,full,{complete:false}),b=await prepareSceneMaster(master,without,{complete:false});assert.ok(b.output.duration<a.output.duration,slug);assert.equal(b.scenes.some(s=>s.id==='reception'),false);
 }
});
test('new photo slots are private, confirmed and template-specific',()=>{
 const birthday=VIDEO_CATALOG.find(d=>d.design==='rajakumari'),id='11111111-1111-4111-8111-111111111111';
 assert.deepEqual(normalizeVideoContent({...birthday.defaults,photos:{child:{id,mode:'frame',confirmed:true}}},{templateId:birthday.id}).photos,{child:{id,mode:'frame',confirmed:true}});
 assert.throws(()=>normalizeVideoContent({...birthday.defaults,photos:{child:{id,mode:'frame',confirmed:false}}},{templateId:birthday.id}));
 assert.throws(()=>normalizeVideoContent({...birthday.defaults,photos:{child:{id:'https://example.com/photo.jpg',mode:'frame',confirmed:true}}},{templateId:birthday.id}));
});
