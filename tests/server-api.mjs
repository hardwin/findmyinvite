import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/invitations.mjs';
import {tokenHash,slugValue} from '../server/core.mjs';
import {db} from '../server/core.mjs';
const token='ab'.repeat(32);
const record={id:'00000000-0000-0000-0000-000000000001',slug:'test-couple',data:{bride:'Bride',groom:'Groom',sections:{rsvp:true}},published:true,expires_at:'2099-01-01T00:00:00Z',management_hash:tokenHash(token)};
async function request(url,authorization){const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};await handler({url,method:'GET',headers:authorization?{authorization}:{}},res);return res;}
test('public DTO excludes secret, private routes reject wrong token, expired public reads fail',async()=>{const oldFetch=global.fetch,oldEnv={...process.env};process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';process.env.RATE_LIMIT_SECRET='test-rate-secret-01234567890123456789';let row={...record};global.fetch=async()=>new Response(JSON.stringify([row]),{status:200});try{const read=await request('/api/invitations?action=read&slug=test-couple');assert.equal(read.code,200);assert.equal(JSON.stringify(read.body).includes(record.management_hash),false);assert.equal((await request('/api/invitations?action=manage&slug=test-couple','Bearer '+'cd'.repeat(32))).code,403);assert.equal((await request('/api/invitations?action=manage&slug=test-couple','Bearer '+token)).code,200);row={...record,published:false};assert.equal((await request('/api/invitations?action=read&slug=test-couple')).code,404);row={...record,expires_at:'2020-01-01T00:00:00Z'};assert.equal((await request('/api/invitations?action=read&slug=test-couple')).code,404);assert.equal((await request('/api/invitations?action=manage&slug=test-couple','Bearer '+token)).code,200);}finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv);}});
test('unconfigured API fails closed rather than accepting local storage',async()=>{const old=process.env.SUPABASE_URL;delete process.env.SUPABASE_URL;try{const res=await request('/api/invitations?action=read&slug=test-couple');assert.equal(res.code,503);const config=await request('/api/invitations?action=config');assert.equal(config.body.configured,false);assert.ok(config.body.serverNow);}finally{if(old!==undefined)process.env.SUPABASE_URL=old;}});
test('PostgREST minimal successful writes have no JSON body',async()=>{const oldFetch=global.fetch,oldEnv={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789'});global.fetch=async()=>new Response(null,{status:201});try{assert.equal(await db('responses',{method:'POST',body:{}}),null);}finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv);}});

async function studioLegacyHarness(t,run){
 const env={...process.env},writes=[];
 let row={...record,data:{...record.data,template:'royal-temple',studioId:'11111111-2222-4333-8444-555555555555',address:'Mumbai, India'}};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789'});
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.ok(String(url).startsWith('https://example.supabase.co/rest/v1/invitations?'));
  if(options.method==='PATCH'){const body=JSON.parse(options.body);writes.push(body);row={...row,...body};}else assert.equal(options.method,'GET');
  return new Response(JSON.stringify([row]),{status:200});
 });
 async function update(body,authToken=token){
  const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;}};
  await handler({url:'/api/invitations?action=update&slug=test-couple',method:'POST',headers:{authorization:'Bearer '+authToken},body},res);return res;
 }
 try{await run({update,writes,row:()=>row});}finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
}

test('legacy status-only updates preserve Studio template identity and invitation content',async t=>{
 await studioLegacyHarness(t,async({update,writes,row})=>{
  const saved=structuredClone(row().data);
  for(const published of [false,true]){
   const result=await update({published});assert.equal(result.code,200);assert.equal(result.body.published,published);
   assert.deepEqual(row().data,saved);assert.deepEqual(result.body.invitation,{...saved,id:record.slug});
  }
  assert.equal(writes.length,2);
  for(const write of writes)assert.deepEqual(Object.keys(write).sort(),['published','updated_at']);
 });
});

test('legacy editor cannot replace or clear Studio content even with a valid management key',async t=>{
 await studioLegacyHarness(t,async({update,writes,row})=>{
  const saved=structuredClone(row().data);
  for(const body of [{data:{...saved,bride:'Changed'},published:true},{data:null,published:false},{data:{},published:false},{}, {published:'false'}]){
   const result=await update(body);assert.equal(result.code,400);assert.match(result.body.error,/Love Studio/);
  }
  assert.equal(writes.length,0);assert.deepEqual(row().data,saved);
 });
});

test('Studio publication status still requires the existing invitation management key',async t=>{
 await studioLegacyHarness(t,async({update,writes,row})=>{
  assert.equal((await update({published:false},'cd'.repeat(32))).code,403);
  assert.equal(writes.length,0);assert.equal(row().published,true);
 });
});

test('studio is reserved as an invitation slug',()=>{
 assert.throws(()=>slugValue('studio'),{status:400});
 assert.equal(slugValue('studio-wedding'),'studio-wedding');
});

