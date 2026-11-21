import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {HttpError} from '../server/core.mjs';
import {PUBLIC_VIDEO_IDS,isPublicVideo} from '../shared/video-visibility.mjs';
import {requireVideoVisibility} from '../server/video-visibility.mjs';
import {resolveTemplateShare} from '../server/template-share.mjs';
import videoHandler from '../api/video-personalise.mjs';
import draftHandler from '../api/drafts.mjs';

const owner=randomUUID(),other=randomUUID(),operatorId=randomUUID(),draftId=randomUUID(),hidden='temple-v1';
const deny=async()=>{throw new HttpError(403,'Not an operator.');};
const anonymous=async()=>{throw new HttpError(401,'Sign in.');};

test('public visibility is explicit and independent of free pricing or renderer approval',async()=>{
 assert.deepEqual(PUBLIC_VIDEO_IDS,['wedding-bells-v1']);
 for(const id of ['temple-v1','film-drive-v1','kerala-christian-v1','invented'])assert.equal(isPublicVideo(id),false);
 await requireVideoVisibility({},'wedding-bells-v1',null,{authenticate:()=>assert.fail('Public design must not require authentication')});
 await assert.rejects(requireVideoVisibility({},hidden,null,{authenticate:anonymous,authorizeOperator:deny}),{status:404});
 await requireVideoVisibility({},hidden,null,{authenticate:anonymous,authorizeOperator:async()=>({id:operatorId})});
});

test('hidden invitations require a matching saved owner/template or a legacy purchase',async()=>{
 const options={user:{id:owner},authorizeOperator:deny};
 const row={id:draftId,kind:'video',template_id:hidden,deleted_at:null};
 await requireVideoVisibility({},hidden,draftId,{...options,query:async path=>{assert.match(path,new RegExp('owner_id=eq.'+owner));return [row];}});
 for(const patch of [{template_id:'wedding-bells-v1'},{kind:'website'},{deleted_at:new Date().toISOString()}]){
  await assert.rejects(requireVideoVisibility({},hidden,draftId,{...options,query:async path=>{assert.match(path,/^personalization_drafts/);return [{...row,...patch}];}}),{status:404});
 }
 await requireVideoVisibility({},hidden,draftId,{...options,query:async path=>path.startsWith('video_invitation_orders?')?[{id:draftId}]:[]});
 await assert.rejects(requireVideoVisibility({},hidden,draftId,{...options,query:async()=>[]}),{status:404});
 await assert.rejects(requireVideoVisibility({},hidden,'bad&owner_id=anything',{...options,query:()=>assert.fail('Invalid ID must not reach the database')}),{status:404});
 await assert.rejects(requireVideoVisibility({},hidden,null,{...options,authorizeOperator:async()=>{throw new HttpError(503,'Authentication unavailable.');}}),{status:503});
});

test('hidden share pages and images cannot be restored by a stale catalogue response',async()=>{
 await assert.rejects(resolveTemplateShare(new URLSearchParams({kind:'video',product:hidden}),'https://findmyinvite.com',()=>assert.fail('Hidden share must fail before lookup')),{status:404});
});

test('HTTP boundaries hide new designs while preserving existing work and operator access',async t=>{
 const previous={...process.env},originalFetch=globalThis.fetch,rows=new Map(),calls=[];
 Object.assign(process.env,{SUPABASE_URL:'https://visibility.test',SUPABASE_SERVICE_ROLE_KEY:'test-only',RATE_LIMIT_SECRET:'test-only-rate-secret'.repeat(3),VIDEO_LOCAL_STORE:'1',VIDEO_PERSONALISE_ENABLED:'1'});
 delete process.env.VERCEL;delete process.env.FMI_OWNER_LOCAL;
 globalThis.fetch=async(input,options={})=>{
  const url=new URL(input),path=url.pathname;
  assert.equal(url.origin,'https://visibility.test','Test must not call external services');
  calls.push(path);
  const json=value=>new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
  if(path==='/auth/v1/user'){const id={'Bearer owner':owner,'Bearer other':other,'Bearer operator':operatorId}[options.headers.Authorization];return id?json({id}):new Response('{}',{status:401});}
  if(path==='/rest/v1/rpc/consume_rate_limit')return json(true);
  if(path==='/rest/v1/cms_operators')return json(url.searchParams.get('user_id')==='eq.'+operatorId?[{user_id:operatorId}]:[]);
  if(path==='/rest/v1/personalization_drafts')return json([...rows.values()].filter(row=>row.id===url.searchParams.get('id')?.slice(3)&&row.owner_id===url.searchParams.get('owner_id')?.slice(3)));
  if(path==='/rest/v1/rpc/fmi_save_personalization_draft'){
   const b=JSON.parse(options.body),row={id:b.p_id,owner_id:b.p_owner,kind:b.p_kind,template_id:b.p_template,payload:b.p_payload,revision:b.p_revision+1,updated_at:new Date().toISOString(),deleted_at:null};rows.set(row.id,row);return json([row]);
  }
  return json([]);
 };
 async function request(handler,url,token,body){const headers={},result={status:0,headers,body:null};const res={headersSent:false,setHeader:(key,value)=>{headers[key.toLowerCase()]=value;},status(code){result.status=code;return this;},json(value){result.body=value;}};await handler({url,method:body?'POST':'GET',headers:token?{authorization:'Bearer '+token}:{},body},res);return result;}
 try{
  await t.test('public catalogue contains only Wedding Bells with its unchanged premium offer',async()=>{
   const r=await request(videoHandler,'/?action=templates');assert.equal(r.status,200);
   assert.deepEqual(r.body.templates.map(x=>x.id),PUBLIC_VIDEO_IDS);
   assert.equal(r.body.templates[0].quote.basePaise,69900);assert.equal(r.body.templates[0].originalPaise,159900);
   assert.match(r.headers['cache-control'],/s-maxage=60/);
  });
  await t.test('public default opens Wedding Bells and hidden direct configurations return 404',async()=>{
   const r=await request(videoHandler,'/?action=template');assert.equal(r.status,200);assert.equal(r.body.id,'wedding-bells-v1');
   for(const id of [hidden,'film-drive-v1']){const response=await request(videoHandler,'/?template='+id);assert.equal(response.status,404);assert.equal(response.body.master,undefined);}
  });
  await t.test('full internal catalogue requires an operator and is never publicly cached',async()=>{
   for(const token of [undefined,'owner'])assert.ok([401,403].includes((await request(videoHandler,'/?action=templates&includeHidden=1',token)).status));
   const r=await request(videoHandler,'/?action=templates&includeHidden=1','operator');assert.equal(r.status,200);assert.equal(r.body.templates.length,40);assert.ok(r.body.templates.some(row=>row.id===hidden));assert.equal(r.headers['cache-control'],'private, no-store');assert.equal(r.headers.vary,'Cookie, Authorization');
  });
  await t.test('ordinary customers cannot create hidden drafts, upload, pay or start a render',async()=>{
   const b={id:draftId,invitationId:draftId,kind:'video',templateId:hidden,revision:0,payload:{content:{}}};
   assert.equal((await request(draftHandler,'/?action=save','owner',b)).status,404);
   for(const action of ['reserve','payment-order','render'])assert.equal((await request(videoHandler,'/?action='+action,'owner',b)).status,404);
   assert.equal(rows.size,0);assert.equal(calls.includes('/rest/v1/rpc/fmi_save_personalization_draft'),false);
  });
  await t.test('existing owners can load and save hidden designs without changing their version',async()=>{
   rows.set(draftId,{id:draftId,owner_id:owner,kind:'video',template_id:hidden,payload:{masterVersion:1,content:{}},revision:3,deleted_at:null});
   const url='/?template='+hidden+'&masterVersion=1&invitationId='+draftId;
   const r=await request(videoHandler,url,'owner');assert.equal(r.status,200);assert.equal(r.body.master.version,1);assert.equal(r.body.price.amount,0);assert.equal(r.headers['cache-control'],'no-store');
   assert.equal((await request(videoHandler,url,'other')).status,404);
   assert.equal((await request(videoHandler,url.replace(hidden,'film-drive-v1'),'owner')).status,404);
   const saved=await request(draftHandler,'/?action=save','owner',{id:draftId,kind:'video',templateId:hidden,payload:{masterVersion:1,content:{groom:'Updated'}},revision:3});assert.equal(saved.status,200);assert.equal(saved.body.draft.payload.masterVersion,1);assert.equal(saved.body.draft.revision,4);
   rows.get(draftId).deleted_at=new Date().toISOString();assert.equal((await request(videoHandler,url,'owner')).status,404);
  });
  await t.test('operators can open retained designs directly for customization',async()=>{
   const r=await request(videoHandler,'/?template='+hidden,'operator');assert.equal(r.status,200);assert.equal(r.body.id,hidden);assert.equal(r.body.master.version,2);
  });
 }finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});
