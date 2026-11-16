import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WEDDING_BELLS_ID,WEDDING_BELLS_OUTPUT,form,defaults,referenceContent,weddingBellsText,weddingBellsLayerVisibility} from '../shared/wedding-bells-video.mjs';
import {assertMaster,videoDefinition,normalizeVideoContent,MUSIC} from '../shared/video-personalization.mjs';
import {requireVideoRelease,renderDigest} from '../server/video-personalise.mjs';
import {videoDefaultMusic} from '../server/video-music.mjs';
import {renderWorkerEnvironment} from '../server/video-personalise-cloud.mjs';
import {matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';
const master=JSON.parse(await readFile(new URL('../public/assets/video-masters/wedding-bells-v1/manifest.json',import.meta.url)));

test('Wedding Bells keeps its nine-scene form, empty customer details, and 30 fps source timeline',()=>{
 assert.equal(videoDefinition(WEDDING_BELLS_ID).form,form);assert.deepEqual(master.output,WEDDING_BELLS_OUTPUT);
 assert.equal(form.steps.filter(s=>s.scene&&!['music','review'].includes(s.id)).length,9);
 assert.equal(new Set(form.steps.flatMap(s=>s.questions.map(q=>q.path))).size,form.steps.flatMap(s=>s.questions).length);
 for(const key of ['groom','bride','groomShort','brideShort','weddingDate','receptionDate'])assert.equal(defaults[key],'');
 assert.equal(form.steps.some(s=>s.questions.some(q=>q.path==='weddingTime')),false);
 assert.deepEqual(videoDefinition(WEDDING_BELLS_ID).photoSlots,[]);
});
test('dates, short names and optional blanks bind without reference-name leakage',()=>{
 const c=normalizeVideoContent({...referenceContent,groom:'Daniel Joseph',bride:'Maria Mathew',groomShort:'Daniel',brideShort:'Maria',receptionDate:'2027-02-14',weddingDate:'2027-02-15',groomMother:'',host3:''},{complete:true,templateId:WEDDING_BELLS_ID});
 const text=weddingBellsText(c);assert.equal(text.coupleShort,'Daniel & Maria');assert.equal(text.dateRange,'14 & 15 FEBRUARY\n2027');assert.equal(text.receptionDateLabel,'14th February 2027');assert.equal(text.groomMother,'');assert.equal(text.host3,'');
 assert.equal(weddingBellsText({...c,receptionDate:'2027-12-31',weddingDate:'2028-01-01'}).dateRange,'31ST DECEMBER 2027\n1ST JANUARY 2028');
 assert.equal(weddingBellsText({...defaults}).dateRange,'');assert.equal(weddingBellsText({...defaults}).coupleShort,'');
 assert.throws(()=>normalizeVideoContent({...c,weddingDate:'2027-02-30'},{complete:true,templateId:WEDDING_BELLS_ID}));
});
test('text-only cache identity changes with edits; characters cannot enter an unsupported renderer',()=>{
 const c=normalizeVideoContent(referenceContent,{complete:true,templateId:WEDDING_BELLS_ID});
 assert.notEqual(renderDigest('test',master,c,[]),renderDigest('test',master,{...c,groom:'Different name'},[]));
 assert.throws(()=>normalizeVideoContent({...c,photos:{groom:{id:'12345678-1234-1234-1234-123456789012',mode:'prepared',confirmed:true}}},{templateId:WEDDING_BELLS_ID}),/original characters/);
});
test('original soundtrack is the default only when available and owner overrides are respected',()=>{
 assert.doesNotMatch(MUSIC['wedding-bells-original'].credit,/trimmed|faded/i);
 const tracks=[{id:'wedding-bells-original'}];assert.deepEqual(videoDefaultMusic(WEDDING_BELLS_ID,{tracks,assignments:[]}),{mode:'library',id:'wedding-bells-original'});
 assert.deepEqual(videoDefaultMusic(WEDDING_BELLS_ID,{tracks:[],assignments:[]}),{mode:'none'});
 assert.deepEqual(videoDefaultMusic(WEDDING_BELLS_ID,{tracks,assignments:[{id:WEDDING_BELLS_ID,trackId:''}]}),{mode:'none'});
});
test('unqualified master cannot be released, retimed or made to read outside its asset directory',()=>{
 assert.equal(assertMaster(master),master);assert.throws(()=>assertMaster({...master,release:{approved:false}},{released:true}),/still being prepared/);
 assert.throws(()=>requireVideoRelease({...master,release:{approved:true}}, {VIDEO_PERSONALISE_ENABLED:'1'}),/still being prepared/);
 assert.throws(()=>assertMaster({...master,output:{...master.output,fps:24}}),/Unsupported/);
 assert.throws(()=>assertMaster({...master,assets:{...master.assets,background:{...master.assets.background,path:'/other.mp4'}}}),/Invalid/);
});
test('qualified tracked-film release needs its dedicated worker without affecting existing renderer bindings',()=>{
 const approved={...master,release:{approved:true,rendererVersion:'tracked-film-v1',cloudVerified:true,proofs:{default:'a'.repeat(64),personalized:'b'.repeat(64)}}};
 assert.equal(assertMaster(approved,{released:true}),approved);
 const env={VERCEL:'1',VIDEO_PERSONALISE_ENABLED:'1',BLOB_READ_WRITE_TOKEN:'test-only',VIDEO_RENDER_SNAPSHOT_ID:'legacy',VIDEO_SCENE_SNAPSHOT_ID:'scene'};
 assert.throws(()=>requireVideoRelease(approved,env),/not configured/);
 assert.doesNotThrow(()=>requireVideoRelease(approved,{...env,VIDEO_TRACKED_SNAPSHOT_ID:'tracked'}));
 const worker=renderWorkerEnvironment({BLOB_READ_WRITE_TOKEN:'storage',OPENAI_API_KEY:'never',XAI_API_KEY:'never'},{tracked:true});
 assert.match(worker.VIDEO_CHROMIUM_PATH,/scene-browser/);assert.doesNotMatch(JSON.stringify(worker),/never|API_KEY/);
});
test('Wedding Bells is searchable as a Christian church wedding video',()=>{
 const row={id:WEDDING_BELLS_ID,name:'Wedding Bells',kind:'video'};
 for(const q of ['Wedding Bells','Christian','Church wedding','3d video'])assert.equal(matchesDiscoverySearch(row,q),true,q);
 for(const q of ['Hindu','Muslim','Temple','birthday'])assert.equal(matchesDiscoverySearch(row,q),false,q);
});
test('all pilot assets and the original AAC stream are content locked',async()=>{
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const a of Object.values(master.assets))assert.equal(sha(await readFile(new URL('../public'+a.path,import.meta.url))),a.sha256);
 assert.equal(sha(await readFile(new URL('../public/assets/music-library/wedding-bells-original.m4a',import.meta.url))),master.assets.audio.sha256);
 const surfaces=JSON.parse(await readFile(new URL('../public'+master.assets.surfaces.path,import.meta.url)));
 for(const s of surfaces.scenes){assert(s.track.every(r=>Number.isInteger(r.frame)&&r.corners.flat().every(Number.isFinite)));assert(s.fields.every(f=>Array.isArray(f.region)&&f.region.length===4));}
});

test('text-free trial bypasses cleanup, restores unchanged wording, and stops before the parents scene',()=>{
 const trial={...master,cleanTextRanges:[{start:0,end:240}]};
 for(const frame of [0,9,75,132,186,239])for(const unchanged of [true,false])assert.deepEqual(weddingBellsLayerVisibility(trial,frame,unchanged),{restore:false,text:true});
 for(const frame of [240,299,300,831]){
  assert.deepEqual(weddingBellsLayerVisibility(trial,frame,true),{restore:false,text:false});
  assert.deepEqual(weddingBellsLayerVisibility(trial,frame,false),{restore:true,text:true});
 }
 const legacy={...master};delete legacy.cleanTextRanges;
 assert.deepEqual(weddingBellsLayerVisibility(legacy,9,true),{restore:false,text:false});
 assert.deepEqual(weddingBellsLayerVisibility(legacy,9,false),{restore:true,text:true});
 for(const ranges of [[{start:0,end:833}],[{start:240,end:0}],[{start:0,end:240},{start:239,end:300}]])assert.throws(()=>assertMaster({...master,cleanTextRanges:ranges}),/text-free frame range/);
});

test('the full clean base renders every text binding without any restoration patch',async()=>{
 assert.deepEqual(master.cleanTextRanges,[{start:0,end:832}]);
 for(let frame=0;frame<master.output.frames;frame++)for(const unchanged of [true,false]){
  assert.deepEqual(weddingBellsLayerVisibility(master,frame,unchanged),{restore:false,text:true});
 }
 const surfaces=JSON.parse(await readFile(new URL('../public'+master.assets.surfaces.path,import.meta.url)));
 assert.equal(surfaces.textTreatment.scenes.invitation.ornament,undefined,'The clean board already contains its original divider.');
 assert.equal(master.trial.sourceSha256,'cc209e96e91d47e97b29561d563d01a8b53a603bfe8f268ba8798b9395e40330');
});
