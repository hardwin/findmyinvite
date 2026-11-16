import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {identityFields,templateCode,validateMicroDescription} from '../shared/catalog-identity.mjs';
import {registerVideoIdentities,saveCatalogDescription,withCatalogIdentity} from '../server/catalog-identity.mjs';
import {matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
test('FMI identifiers survive ordering/name changes and match exact numeric searches',async()=>{
 const registry=[{template_id:'one',template_number:7,micro_description:'Opening church doors'},{template_id:'two',template_number:70,micro_description:'Golden temple doors'}];
 const decorate=items=>withCatalogIdentity(items,'website',async()=>registry);
 const rows=await decorate([{id:'two',name:'New name'},{id:'one',name:'Renamed'}]);
 assert.deepEqual(rows.map(r=>r.templateCode),['FMI#0070','FMI#0007']);
 assert.equal(matchesDiscoverySearch(rows[1],'FMI#7'),true);assert.equal(matchesDiscoverySearch(rows[0],'FMI#7'),false);
 assert.equal(templateCode(10000),'FMI#10000');assert.throws(()=>templateCode(-1));
 assert.deepEqual(identityFields(undefined),{});
});
test('registration only inserts missing code-defined videos and preserves edited metadata',async()=>{
 const known=['temple-v1','kerala-christian-v1','wedding-bells-v1',...VIDEO_CATALOG.map(v=>v.id)];
 let writes=[];const query=async(path,options)=>{if(options){writes.push({path,...options});return null;}return known.slice(1).map(id=>({template_id:id,micro_description:'Admin authored text'}));};
 assert.equal(await registerVideoIdentities(query),1);
 assert.equal(writes.length,1);assert.equal(writes[0].headers.Prefer,'resolution=ignore-duplicates');
 assert.equal(writes[0].body.length,1);assert.equal(writes[0].body[0].template_id,'temple-v1');
 assert.equal(Object.hasOwn(writes[0].body[0],'template_number'),false);
 assert.equal(await registerVideoIdentities(async()=>known.map(template_id=>({template_id}))),0);
});
test('all current video definitions have distinct, at most four-word authored descriptions',async()=>{
 const seeds=JSON.parse(await readFile(new URL('../shared/catalog-descriptions.json',import.meta.url)));
 const values=Object.values(seeds).flatMap(Object.values);
 assert.equal(new Set(values.map(v=>v.toLowerCase())).size,values.length);
 values.forEach(v=>assert.equal(validateMicroDescription(v),v));
 for(const id of ['temple-v1','kerala-christian-v1','wedding-bells-v1',...VIDEO_CATALOG.map(v=>v.id)])assert.ok(seeds.video[id],id);
});
test('metadata updates cannot change identifiers and reject invalid descriptions before database access',async()=>{
 let call;const query=async(path,options)=>{call={path,options};return {template_number:7};};
 await saveCatalogDescription({kind:'video',templateId:'film-drive-v1',microDescription:'Choose  your road scene',template_number:999},query);
 assert.deepEqual(call.options.body,{p_kind:'video',p_template:'film-drive-v1',p_description:'Choose your road scene'});
 for(const text of ['','one two three four five','<script>'])await assert.rejects(()=>saveCatalogDescription({kind:'video',templateId:'film-drive-v1',microDescription:text},()=>{throw Error('Should not query');}),/one to four/);
 await assert.rejects(()=>saveCatalogDescription({kind:'invalid',templateId:'film-drive-v1',microDescription:'Short description'},query),/Invalid template/);
});
