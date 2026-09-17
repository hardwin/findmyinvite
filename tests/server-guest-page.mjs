import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import handler from '../api/guest-page.mjs';
import {GATE_HEADER,guestDecision,guestPageNotFound,isGuestInvitationPath,NOT_FOUND_HTML,writeNotFound} from '../server/guest-page.mjs';
import {reserved} from '../server/core.mjs';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789'};
const live=[{slug:'test-couple',published:true,expires_at:'2099-01-01T00:00:00Z',data:{}}];
const spa='<!doctype html><title>SPA</title>';
async function withDb(rows,fn){
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,env);
 global.fetch=async url=>{
  const href=String(url);
  if(href.includes('/rest/v1/invitations'))return new Response(JSON.stringify(rows),{status:200});
  if(href.includes('/index.html'))return new Response(spa,{status:200});
  return new Response('unexpected '+href,{status:500});
 };
 try{return await fn();}
 finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
}
async function api(url,method='GET'){
 const res={headers:{},body:'',code:0,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},end(b){this.body=b||'';if(!this.code)this.code=this.statusCode||200;}};
 await handler({url,method,headers:{host:'findmyinvite.com','x-forwarded-proto':'https'}},res);
 return res;
}
test('storefront, reserved and asset paths are not treated as guest invitations',()=>{
 for(const path of ['/','/templates','/create','/dashboard','/login','/signup','/forgot-password','/about','/contact','/blog','/terms','/privacy-policy','/refund-policy','/shipping-policy','/akay','/grand-launch','/manage/test-couple','/invite/demo','/api/invitations','/assets/track1.mp3','/robots.txt','/sitemap.xml']){
  assert.equal(isGuestInvitationPath(path),false,path);
 }
 assert.equal(isGuestInvitationPath('/wedding-invitation-classic-does-not-exist-xyz'),true);
 assert.equal(isGuestInvitationPath('/test-couple/'),true);
 assert.equal(reserved.has('templates'),true);
});
test('unknown unpublished and expired guest slugs are missing; live published slugs are not',async()=>{
 await withDb([],async()=>{
  assert.equal((await guestDecision('/wedding-invitation-classic-7')).gate,'404');
  assert.equal(await guestPageNotFound('/templates'),false);
  assert.equal((await guestDecision('/templates')).gate,'skip');
 });
 await withDb([{...live[0],published:false}],async()=>{
  assert.equal((await guestDecision('/test-couple')).gate,'404');
 });
 await withDb([{...live[0],expires_at:'2020-01-01T00:00:00Z'}],async()=>{
  assert.equal((await guestDecision('/test-couple')).gate,'404');
 });
 await withDb(live,async()=>{
  assert.equal((await guestDecision('/test-couple')).gate,'pass');
 });
});
test('unconfigured or database errors fail open so published guest links keep working',async()=>{
 const old=process.env.SUPABASE_URL;
 delete process.env.SUPABASE_URL;
 try{assert.equal((await guestDecision('/test-couple')).gate,'open');}
 finally{if(old!==undefined)process.env.SUPABASE_URL=old;}
 await withDb(live,async()=>{
  global.fetch=async()=>{throw new Error('network');};
  assert.equal((await guestDecision('/test-couple')).gate,'open');
 });
});
test('guest-page API returns real 404 HTML for dead slugs and 200 SPA for published or reserved paths',async()=>{
 await withDb([],async()=>{
  const missing=await api('/api/guest-page?slug=zzzz-not-a-real-invite-999');
  assert.equal(missing.code,404);
  assert.equal(missing.headers[GATE_HEADER],'404');
  assert.equal(missing.body,NOT_FOUND_HTML);
  assert.match(NOT_FOUND_HTML,/https:\/\/findmyinvite.com\/templates/);
  assert.equal(missing.headers['Content-Type'],'text/html; charset=utf-8');
 });
 await withDb(live,async()=>{
  const published=await api('/api/guest-page?slug=test-couple');
  assert.equal(published.code,200);
  assert.equal(published.headers[GATE_HEADER],'pass');
  assert.match(String(published.body),/SPA|root|FindMyInvite/);
 });
 await withDb(live,async()=>{
  const templates=await api('/api/guest-page?slug=templates');
  assert.equal(templates.code,200);
  assert.equal(templates.headers[GATE_HEADER],'skip');
  assert.equal(templates.headers['X-Robots-Tag'],undefined);
 });
 const chunks=[];
 const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(body){chunks.push(body||'');}};
 assert.equal(writeNotFound({method:'GET'},res),true);
 assert.equal(res.statusCode,404);
 assert.equal(res.headers[GATE_HEADER],'404');
 assert.equal(chunks.join(''),NOT_FOUND_HTML);
});
test('guest lookup does not require RATE_LIMIT_SECRET',async()=>{
 await withDb([],async()=>{
  delete process.env.RATE_LIMIT_SECRET;
  assert.equal((await guestDecision('/zzzz-not-a-real-invite-999')).gate,'404');
  const missing=await api('/api/guest-page?slug=zzzz-not-a-real-invite-999');
  assert.equal(missing.code,404);
  assert.equal(missing.headers[GATE_HEADER],'404');
 });
});
test('SPA catch-all stays after the guest-page rewrite and client still mounts PublicInvitation',async()=>{
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/\/\^\\\/\[a-z0-9\]\[a-z0-9-\]\{2,47\}\$\/\.test\(path\)\?<PublicInvitation slug=\{path\.slice\(1\)}\/>/);
 const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(vercel.proxy,undefined);
 const destinations=vercel.rewrites.map(rule=>rule.destination);
 assert.equal(destinations[0],'/api/share?slug=:slug');
 assert.equal(destinations[1],'/api/guest-page?slug=:slug');
 assert.equal(vercel.rewrites[1].source,'/:slug([a-z0-9][a-z0-9-]{2,47})');
 assert.equal(destinations[2],'/index.html');
 assert.match(destinations[2]=== '/index.html' ? vercel.rewrites[2].source : '',/robots/);
 assert.ok(vercel.functions['api/guest-page.mjs'].includeFiles.includes('index.html'));
 const files=await readFile(new URL('../vercel.json',import.meta.url),'utf8');
 assert.equal(files.includes('middleware'),false);
 await assert.rejects(()=>access(new URL('../middleware.js',import.meta.url)));
});
