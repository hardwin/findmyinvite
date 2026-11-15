import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.FMI_OWNER_LOCAL='1';process.env.FMI_OWNER_DB=join(mkdtempSync(join(tmpdir(),'fmi-video-music-')),'test.sqlite');
const {save}=await import('../server/owner/store.mjs');
const {pinVideoLibraryMusic,videoMusicCatalog,videoDefaultMusic}=await import('../server/video-music.mjs');
const {videoConfig,videoService,renderDigest}=await import('../server/video-personalise.mjs');
const {normalizeVideoContent,VIDEO_EXAMPLE,MUSIC}=await import('../shared/video-personalization.mjs');
const {hash}=await import('../server/video-personalise-store.mjs');
const {defaultWebsiteMusicId,libraryMusicUrl}=await import('../shared/music-selection.mjs');
const bytes=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1024,7)]);
function store(){const records=new Map(),files=new Map();return {records,files,async putBytes(key,data){if(files.has(key))throw Error('Already exists');files.set(key,Buffer.from(data));},async bytes(key){if(!files.has(key))throw Error('Missing');return files.get(key);},async read(key){return records.get(key)||null;},async save(key,value){records.set(key,{value:structuredClone(value),etag:hash(value)});}};}

test('source-silent websites keep silence; other defaults and legacy aliases remain valid',()=>{
 for(const id of ['christian-bells','theeram','thiruvarul'])assert.equal(defaultWebsiteMusicId(id),'');
 assert.equal(defaultWebsiteMusicId('stained-glass'),'canon-in-d');
 assert.equal(defaultWebsiteMusicId('golden-hour'),'heartwarming');
 assert.equal(libraryMusicUrl('canon'),'/api/music?id=canon-in-d');assert.equal(MUSIC.canon,MUSIC['canon-in-d']);
});
test('video assignments use the same active library as websites and preserve existing selections',async()=>{
 await save('music-assignment','film-drive-v1',{trackId:'canon-in-d'},0);
 const catalog=await videoMusicCatalog(),config=await videoConfig({VIDEO_PERSONALISE_ENABLED:'1'},'film-drive-v1',catalog);
 assert.deepEqual(config.defaults.music,{mode:'library',id:'canon-in-d'});
 assert.equal(config.musicTracks.find(t=>t.id==='canon-in-d').url,libraryMusicUrl('canon'));
 assert.deepEqual(videoDefaultMusic('film-vector-v1',catalog),{mode:'none'});
 assert.deepEqual(normalizeVideoContent({...VIDEO_EXAMPLE,music:{mode:'library',id:'canon'}}).music,{mode:'library',id:'canon'});
 const filtered={...catalog,tracks:catalog.tracks.filter(t=>t.id!=='canon-in-d')};assert.equal(videoDefaultMusic('film-drive-v1',filtered).mode,'none');
 assert.equal(JSON.stringify(config).includes('objectPath'),false);
});
test('library bytes, attribution and hash are pinned independently of later metadata changes',async()=>{
 const storage=store(),track={id:'new-track',status:'ready',asset:'/assets/music-library/new.mp3',credit:'Author',licenseUrl:'https://example.com/license'};
 const options={lookup:async()=>track,readAsset:async()=>bytes};
 const first=await pinVideoLibraryMusic('new-track',storage,options),again=await pinVideoLibraryMusic('new-track',storage,options);
 assert.equal(first.sha256,hash(bytes));assert.equal(first.key,again.key);assert.equal(storage.files.size,1);assert.equal(first.kind,'audio');assert.match(first.credit,/Author.*Trimmed and faded.*license/);
 const changed=await pinVideoLibraryMusic('new-track',storage,{...options,readAsset:async()=>Buffer.concat([bytes,Buffer.from('changed')])});assert.notEqual(first.key,changed.key);assert.equal(hash(await storage.bytes(first.key)),first.sha256);
 assert.notEqual(renderDigest('owner',{}, {},[first]),renderDigest('owner',{}, {},[changed]));
});
test('legacy and archived selections resolve; missing, pending and arbitrary paths fail before rendering',async()=>{
 let lookedUp;const storage=store(),lookup=async id=>{lookedUp=id;return {id,status:'ready',archived:true,asset:'/assets/music-library/canon-in-d.mp3'};};
 await pinVideoLibraryMusic('canon',storage,{lookup,readAsset:async()=>bytes});assert.equal(lookedUp,'canon-in-d');
 for(const track of [null,{status:'pending'},{status:'ready',asset:'https://remote.example/music.mp3'},{status:'ready',asset:'/assets/music-library/../secret.mp3'},{status:'ready',objectPath:'customer-upload/private'}])await assert.rejects(pinVideoLibraryMusic('new-track',storage,{lookup:async()=>track,readAsset:()=>{throw Error('Should not read');}}));
});
test('private owner recordings are bounded, pinned and never exposed as customer URLs',async()=>{
 const storage=store(),track={id:'uploaded-track',status:'ready',objectPath:'website-music/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'};
 const options={lookup:async()=>track,blob:async(path)=>{assert.equal(path,track.objectPath);return {stream:ReadableStream.from([bytes])};}};
 const media=await pinVideoLibraryMusic(track.id,storage,options);assert.equal(media.bytes,bytes.length);assert.equal(JSON.stringify(media).includes('website-music'),false);
 await assert.rejects(pinVideoLibraryMusic(track.id,storage,{...options,blob:async()=>({stream:ReadableStream.from([Buffer.alloc(21*1048576)])})}),/limit/);
});
test('unknown library selections cannot create a render job',async()=>{
 const {readFile}=await import('node:fs/promises');const master=JSON.parse(await readFile('public/assets/video-masters/temple-v1/manifest.json'));
 const storage=store();let launches=0;const service=videoService({store:storage,env:{VIDEO_PERSONALISE_ENABLED:'1'},masterLoader:async()=>master,launch:async()=>launches++,libraryMusic:async()=>{throw Error('Unavailable recording');}});
 const {TEMPLE_DEFAULTS}=await import('../shared/temple-video.mjs');
 await assert.rejects(service.start('test-owner',{...TEMPLE_DEFAULTS,music:{mode:'library',id:'unknown-track'}},'temple-v1'),/Unavailable recording/);assert.equal(launches,0);assert.equal(storage.records.size,0);
});
