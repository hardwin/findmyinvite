import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {catalogVersion} from '../server/template-cms.mjs';
import {publicPreviewVersion,respondPreview} from '../server/template-preview.mjs';
import {requestPreviewVersion} from '../src/templates/preview-request.mjs';
import {previewReadiness} from '../src/templates/preview-readiness.mjs';
import templatesHandler from '../api/templates.mjs';

const id='11111111-1111-4111-8111-111111111111',newId='22222222-2222-4222-8222-222222222222';
const version={id,template_id:'christian-bells',renderer:'christian-editorial-v3',approved_at:'2026-11-01',defaults:{groom:'Alex'},field_schema:{fields:[]},revision:3};
test('current catalogue version needs two reads and still checks publication and approval',async()=>{
 const calls=[];
 const query=async path=>{calls.push(path);return path.startsWith('template_catalog')?[{current_version_id:id}]:[version];};
 assert.equal(await catalogVersion(id,query),version);
 assert.equal(calls.length,2);
 assert.match(calls[1],/isactive=eq.true&published=eq.true/);
 await assert.rejects(catalogVersion(id,async path=>path.startsWith('template_catalog')?[]:[version]),{status:404});
 await assert.rejects(catalogVersion(id,async()=>[{...version,approved_at:null}]),{status:404});
 await assert.rejects(catalogVersion(id,async path=>path.startsWith('template_catalog')?[{current_version_id:id}]:[{...version,renderer:'unknown'}]),{status:404});
});
test('superseded links resolve to the current approved version, never a different template',async()=>{
 const query=async path=>path.startsWith('template_catalog')?[{current_version_id:newId}]:[{...version,id:path.includes(newId)?newId:id}];
 assert.equal((await catalogVersion(id,query)).id,newId);
 await assert.rejects(catalogVersion(id,async path=>path.includes(newId)?[{...version,id:newId,template_id:'another'}]:query(path)),{status:404});
});
test('music and identity reads start together; only public version fields are returned',async()=>{
 let release;
 const waiting=new Promise(resolve=>release=resolve);
 const result=await publicPreviewVersion(id,{
  readVersion:async()=>({...version,private_metadata:'excluded'}),
  music:async v=>{await waiting;return {...v,defaults:{...v.defaults,music:'/api/music?id=sample'}};},
  identity:async v=>{release();return {...v,templateCode:'FMI#0001'};}
 });
 assert.equal(result.defaults.music,'/api/music?id=sample');
 assert.equal(result.templateCode,'FMI#0001');
 assert.equal(result.private_metadata,undefined);
 assert.equal(result.approved_at,undefined);
 const headers={};let body;
 respondPreview({setHeader:(k,v)=>headers[k]=v,status:()=>({json:value=>body=value})},result);
 assert.equal(headers['CDN-Cache-Control'],'public, s-maxage=60');
 assert.deepEqual(body,{version:result});
});
test('public preview fetch omits authentication and allows browser caching',async()=>{
 const result=await requestPreviewVersion(id,{fetcher:async(url,options)=>{
  assert.equal(url,'/api/templates?action=preview&id='+id);
  assert.equal(options.credentials,'omit');
  assert.equal(options.headers,undefined);
  assert.equal(options.cache,undefined);
  assert.ok(options.signal);
  return {ok:true,json:async()=>({version})};
 }});
 assert.equal(result,version);
 await assert.rejects(requestPreviewVersion(id,{fetcher:async()=>({ok:false,json:async()=>({error:'Unavailable'})})}),/Unavailable/);
});
test('preview API ignores expired customer credentials and never caches unavailable templates',async()=>{
 const originalFetch=globalThis.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://preview-test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-server-key';
 let published=true;const calls=[];
 globalThis.fetch=async input=>{
  const url=new URL(input);calls.push(url.pathname);
  assert.equal(url.origin,'https://preview-test.invalid');
  const rows=url.pathname.endsWith('/template_versions')?[version]:url.pathname.endsWith('/template_catalog')?(published?[{current_version_id:id}]:[]):[{template_number:1,micro_description:'Opening church doors'}];
  return new Response(JSON.stringify(rows),{status:200});
 };
 const response=()=>({headers:{},setHeader(key,value){this.headers[key]=value;},status(code){this.code=code;return this;},json(body){this.body=body;}});
 try{
  const req={method:'GET',url:'/api/templates?action=preview&id='+id,headers:{authorization:'Bearer expired-customer-session'}};
  const ok=response();await templatesHandler(req,ok);
  assert.equal(ok.code,200);assert.equal(ok.body.version.id,id);assert.equal(ok.headers['Cache-Control'],'public, max-age=30');
  assert.ok(calls.every(path=>path.startsWith('/rest/v1/')));
  published=false;const missing=response();await templatesHandler(req,missing);
  assert.equal(missing.code,404);assert.equal(missing.headers['Cache-Control'],'no-store');assert.equal(missing.headers['CDN-Cache-Control'],undefined);
 }finally{globalThis.fetch=originalFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
test('readiness waits for the design, not the soundtrack or unrelated resource load',()=>{
 const dom=new JSDOM('<div data-preview-slot><div data-invitation-design><p>Preparing</p></div><button>Mute music</button></div>');
 const slot=dom.window.document.querySelector('[data-preview-slot]'),design=slot.querySelector('[data-invitation-design]');
 assert.equal(previewReadiness(slot,'christian-editorial-v3'),'loading');
 design.innerHTML='<img src="cover.webp">';
 assert.equal(previewReadiness(slot,'christian-editorial-v3'),'ready');
 design.innerHTML='<iframe></iframe>';
 const frame=design.querySelector('iframe'),doc=frame.contentDocument;
 doc.body.innerHTML='<button>Open invitation</button><img src="slow-lower-page-photo.webp">';
 Object.defineProperty(doc,'readyState',{value:'interactive',configurable:true});
 assert.equal(previewReadiness(slot,'kerala-kasavu-v2'),'ready');
 assert.equal(previewReadiness(slot,'midnight-stage-v1'),'loading');
 doc.documentElement.dataset.fmiReady='true';
 assert.equal(previewReadiness(slot,'midnight-stage-v1'),'ready');
 doc.body.innerHTML='<div id="doors"><button>Open</button></div>';
 assert.equal(previewReadiness(slot,'midnight-stage-v1'),'loading');
 doc.querySelector('#doors').classList.add('ready');
 assert.equal(previewReadiness(slot,'midnight-stage-v1'),'ready');
 design.innerHTML='<p role="alert">Design unavailable</p>';
 assert.equal(previewReadiness(slot,'christian-editorial-v3'),'error');
 dom.window.close();
});
