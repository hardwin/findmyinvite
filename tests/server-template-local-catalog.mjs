import test from 'node:test';
import assert from 'node:assert/strict';
import {localTemplateCatalog} from '../server/local-template-catalog.mjs';
const id='9725dcb9-beb8-492f-a7f3-e3adbfd4fc76';
const stored={id,template_id:'ivory-lace',renderer:'ivory-lace-v1',revision:2,approved_at:null,field_schema:{version:1,fields:[]},defaults:{bride:'Stored partner'}};
function response(){return {setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;}};}
test('local catalog and selection use the same stored version without mutating shared approval',async()=>{
 const deps={readIds:async()=>[id],readVersion:async selected=>{assert.equal(selected,id);return stored;},query:async path=>path.includes('generation=')?[{id:'existing',current_version_id:'published',sort_order:1}]:[{id:'ivory-lace',name:'Lace & Pearls',sort_order:4}]};
 const catalog=response(),selection=response();
 assert.equal(await localTemplateCatalog({url:'/api/templates?action=public',method:'GET'},catalog,deps),true);
 assert.equal(catalog.body.templates[0].id,'existing');
 assert.equal(catalog.body.templates[1].current_version_id,id);
 await localTemplateCatalog({url:'/api/templates?action=version&id='+id,method:'GET'},selection,deps);
 assert.deepEqual(selection.body.version.defaults,stored.defaults);
 assert.equal(selection.body.version.id,catalog.body.templates[1].current_version_id);
 assert.equal(selection.body.version.localPreview,true);
 assert.equal(stored.approved_at,null);
});
test('local release adapter does not intercept writes, unrelated routes or unselected versions',async()=>{
 const deps={readIds:async()=>[id],readVersion:()=>{throw Error('Unexpected version read');},query:()=>{throw Error('Unexpected catalog read');}};
 for(const req of [{url:'/api/templates?action=publish',method:'POST'},{url:'/api/invitations?action=v2-create',method:'POST'},{url:'/api/templates?action=version&id=another',method:'GET'},{url:'/api/templates?action=list',method:'GET'}])assert.equal(await localTemplateCatalog(req,response(),deps),false);
 assert.equal(await localTemplateCatalog({url:'/api/templates?action=public',method:'GET'},response(),{...deps,readIds:async()=>[]}),false);
});

test('old local selection resolves to the same newer stored version without affecting approved or saved invitations',async()=>{
 const old='11111111-1111-4111-8111-111111111111';
 const current={...stored,revision:3};
 const deps={readIds:async()=>[id],readVersion:async value=>value===id?current:{...stored,id:old,revision:2}};
 const res=response();
 assert.equal(await localTemplateCatalog({url:'/api/templates?action=version&id='+old,method:'GET'},res,deps),true);
 assert.equal(res.body.version.id,id);
 assert.equal(await localTemplateCatalog({url:'/api/templates?action=version&id='+old,method:'GET'},response(),{...deps,readVersion:async value=>value===id?current:{...stored,id:old,revision:2,approved_at:'2026-01-01'}}),false);
 assert.equal(await localTemplateCatalog({url:'/api/invitations?action=v2-manage&slug=example',method:'GET'},response(),deps),false);
});
