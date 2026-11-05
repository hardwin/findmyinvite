import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/auth.mjs';
import {googleRedirectOrigin} from '../server/google-auth.mjs';
import {authReturnPath} from '../shared/auth-return.mjs';
async function request(action,body){const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};await handler({url:'/api/auth?action='+action,method:'POST',body,headers:{},socket:{remoteAddress:'local'}},res);return res;}
function setup(t,fetch){const old={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service',SUPABASE_ANON_KEY:'public-key',SITE_ORIGIN:'https://findmyinvite.com',RATE_LIMIT_SECRET:'test-012345678901234567890123456789'});delete process.env.SMS_AUTH_ENABLED;t.mock.method(globalThis,'fetch',fetch);t.after(()=>{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);});}
test('Google authorize uses PKCE, fixed provider and allowlisted callback without exposing credentials',async t=>{
 setup(t,async url=>url.includes('/rpc/')?new Response('true'):Response.json({external:{google:true}}));
 const r=await request('google-start',{origin:'https://findmyinvite.com',challenge:'c'.repeat(43),flow:'a'.repeat(64)});assert.equal(r.code,200);
 const u=new URL(r.body.url);assert.equal(u.origin,'https://fixture.supabase.co');assert.equal(u.searchParams.get('provider'),'google');assert.equal(u.searchParams.get('code_challenge_method'),'s256');assert.equal(u.searchParams.get('redirect_to'),'https://findmyinvite.com/auth/callback?flow='+'a'.repeat(64));assert.equal(JSON.stringify(r.body).includes('private-service'),false);
 assert.equal((await request('google-start',{origin:'https://evil.example',challenge:'c'.repeat(43),flow:'a'.repeat(64)})).code,400);
});
test('disabled Google provider and parked SMS cannot start login',async t=>{let calls=0;setup(t,async url=>{calls++;return url.includes('/rpc/')?new Response('true'):Response.json({external:{google:false}});});assert.equal((await request('google-start',{origin:'https://findmyinvite.com',challenge:'c'.repeat(43),flow:'a'.repeat(64)})).code,503);const count=calls;for(const action of ['sms-send','sms-verify'])assert.equal((await request(action,{phone:'9876543210',token:'123456'})).code,404);assert.equal(calls,count);});
test('Google code exchange forwards verifier using public key and returns only app session',async t=>{
 setup(t,async(url,o)=>{if(url.includes('/rpc/'))return new Response('true');assert.ok(url.endsWith('/token?grant_type=pkce'));assert.equal(o.headers.apikey,'public-key');assert.deepEqual(JSON.parse(o.body),{auth_code:'one-time-code',code_verifier:'v'.repeat(64)});return Response.json({access_token:'session',refresh_token:'refresh',expires_in:3600,user:{id:'google-user',email:'host@example.com'},provider_token:'must-not-expose'});});
 const r=await request('google-exchange',{code:'one-time-code',verifier:'v'.repeat(64)});assert.equal(r.code,200);assert.equal(r.body.user.id,'google-user');assert.equal(r.body.provider_token,undefined);assert.equal((await request('google-exchange',{code:'one-time-code',verifier:'short'})).code,400);
});
test('expired or incorrect code never creates a session',async t=>{setup(t,async url=>url.includes('/rpc/')?new Response('true'):Response.json({error:'invalid_grant'},{status:400}));const r=await request('google-exchange',{code:'expired',verifier:'v'.repeat(64)});assert.equal(r.code,400);assert.equal(r.body.access_token,undefined);});
test('return paths and redirect origins cannot send sessions to external destinations',()=>{
 for(const value of ['https://evil.example','//evil.example','/\\evil.example','/auth/callback','/personalise\n'])assert.equal(authReturnPath(value),'/dashboard');
 assert.equal(authReturnPath('/personalise?version=one'),'/personalise?version=one');
 assert.throws(()=>googleRedirectOrigin('http://localhost:5173',{NODE_ENV:'production'}));
 assert.throws(()=>googleRedirectOrigin('https://findmyinvite.com.evil.example',{}));
 assert.equal(googleRedirectOrigin('http://127.0.0.1:5173',{}),'http://127.0.0.1:5173');
});
