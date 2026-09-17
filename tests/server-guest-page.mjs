import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import middleware,{config} from '../middleware.js';
import {guestPageNotFound,isGuestInvitationPath,NOT_FOUND_HTML,writeNotFound} from '../server/guest-page.mjs';
import {reserved} from '../server/core.mjs';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789'};
const live=[{slug:'test-couple',published:true,expires_at:'2099-01-01T00:00:00Z',data:{}}];
async function withDb(rows,fn){
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,env);
 global.fetch=async()=>new Response(JSON.stringify(rows),{status:200});
 try{return await fn();}
 finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
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
  assert.equal(await guestPageNotFound('/wedding-invitation-classic-does-not-exist-xyz'),true);
  assert.equal(await guestPageNotFound('/templates'),false);
 });
 await withDb([{...live[0],published:false}],async()=>{
  assert.equal(await guestPageNotFound('/test-couple'),true);
 });
 await withDb([{...live[0],expires_at:'2020-01-01T00:00:00Z'}],async()=>{
  assert.equal(await guestPageNotFound('/test-couple'),true);
 });
 await withDb(live,async()=>{
  assert.equal(await guestPageNotFound('/test-couple'),false);
 });
});
test('unconfigured or database errors fail open so live guest links keep working',async()=>{
 const old=process.env.SUPABASE_URL;
 delete process.env.SUPABASE_URL;
 try{assert.equal(await guestPageNotFound('/test-couple'),false);}
 finally{if(old!==undefined)process.env.SUPABASE_URL=old;}
 await withDb(live,async()=>{
  global.fetch=async()=>{throw new Error('network');};
  assert.equal(await guestPageNotFound('/test-couple'),false);
 });
});
test('Vercel middleware returns HTTP 404 HTML for unknown slugs and continues for published invites',async()=>{
 assert.equal(config.runtime,'nodejs');
 assert.match(config.matcher[0],/templates\$/);
 await withDb([],async()=>{
  const missing=await middleware(new Request('https://findmyinvite.com/wedding-invitation-classic-does-not-exist-xyz'));
  assert.equal(missing.status,404);
  assert.equal(missing.headers.get('content-type'),'text/html; charset=utf-8');
  assert.equal(await missing.text(),NOT_FOUND_HTML);
  assert.match(NOT_FOUND_HTML,/https:\/\/findmyinvite.com\/templates/);
  const head=await middleware(new Request('https://findmyinvite.com/wedding-invitation-classic-does-not-exist-xyz',{method:'HEAD'}));
  assert.equal(head.status,404);
  assert.equal(await head.text(),'');
 });
 await withDb(live,async()=>{
  assert.equal(await middleware(new Request('https://findmyinvite.com/test-couple')),undefined);
 });
 await withDb(live,async()=>{
  assert.equal(await middleware(new Request('https://findmyinvite.com/templates')),undefined);
 });
});
test('local adapter writes a real 404 and SPA routing still mounts published guest slugs',async()=>{
 const chunks=[];
 const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(body){chunks.push(body||'');}};
 assert.equal(writeNotFound({method:'GET'},res),true);
 assert.equal(res.statusCode,404);
 assert.equal(chunks.join(''),NOT_FOUND_HTML);
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/\/\^\\\/\[a-z0-9\]\[a-z0-9-\]\{2,47\}\$\/\.test\(path\)\?<PublicInvitation slug=\{path\.slice\(1\)}\/>/);
 const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(vercel.proxy.entrypoint,'middleware.js');
 assert.ok(vercel.rewrites.some(rule=>rule.destination==='/index.html'));
 assert.ok(vercel.rewrites.some(rule=>rule.destination==='/api/share?slug=:slug'));
});
