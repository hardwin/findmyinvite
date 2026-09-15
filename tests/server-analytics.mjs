import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {passwordOk,issueSession,sessionOk,cookieHeader} from '../server/akay-gate.mjs';
import {summarize} from '../server/akay-insights.mjs';
import handler from '../api/analytics.mjs';
import {slugValue} from '../server/core.mjs';
const session='11111111-1111-4111-8111-111111111111';
const visitor='22222222-2222-4222-8222-222222222222';
const code='1414';
async function request(url,{method='GET',body,cookie}={}){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await handler({url,method,body,headers:{cookie:cookie||'',host:'127.0.0.1'},socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}
test('operator code stays on the server and is not in the frontend',async()=>{
 assert.equal(passwordOk(code),true);
 assert.equal(passwordOk('0000'),false);
 assert.equal(passwordOk('14140'),false);
 assert.throws(()=>slugValue('akay'));
 const files=['../src/AkayAdmin.tsx','../src/analytics.ts','../src/App.tsx','../src/Home.tsx','../src/components.tsx','../src/main.tsx'];
 for(const file of files){
  const source=await readFile(new URL(file,import.meta.url),'utf8');
  assert.equal(source.includes(code),false,file+' leaked the operator code');
  if(file.endsWith('Home.tsx')||file.endsWith('components.tsx'))assert.equal(source.includes('/akay'),false,file+' linked the operator page');
 }
});
test('gate cookie is HttpOnly and does not contain the operator code',async()=>{
 const denied=await request('/api/analytics?action=gate',{method:'POST',body:{gate:'0000'}});
 assert.equal(denied.code,401);
 const allowed=await request('/api/analytics?action=gate',{method:'POST',body:{gate:code}});
 assert.equal(allowed.code,200);
 const cookie=String(allowed.headers['Set-Cookie']||'');
 assert.match(cookie,/HttpOnly/);
 assert.equal(cookie.includes(code),false);
 const req={headers:{cookie:'fmi_akay='+cookie.split('=')[1].split(';')[0]}};
 assert.equal(sessionOk(req),true);
 assert.equal(sessionOk({headers:{}}),false);
 assert.equal(cookieHeader(issueSession(),false).includes(code),false);
});
test('insights require a valid session; collect validates and skips the operator path',async()=>{
 const originalFetch=global.fetch,env={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 const stored=[];
 global.fetch=async(url,options={})=>{
  const parsed=new URL(url),path=parsed.pathname.replace('/rest/v1/',''),method=options.method||'GET';
  if(path==='rpc/consume_rate_limit')return new Response('true',{status:200});
  if(path==='analytics_events'&&method==='POST'){stored.push(JSON.parse(options.body));return new Response(null,{status:201});}
  if(path.startsWith('analytics_events'))return new Response(JSON.stringify(stored),{status:200});
  throw new Error('Unexpected '+path);
 };
 try{
  assert.equal((await request('/api/analytics?action=insights')).code,401);
  const gated=await request('/api/analytics?action=gate',{method:'POST',body:{gate:code}});
  const cookie=String(gated.headers['Set-Cookie']).split(';')[0];
  const open=await request('/api/analytics?action=insights&days=7',{cookie});
  assert.equal(open.code,200);
  assert.equal(open.body.insights.totals.pageviews,0);
  const skip=await request('/api/analytics?action=collect',{method:'POST',body:{type:'pageview',path:'/akay',session,visitor,dwell:0,viewport:'390x844',referrer:''}});
  assert.equal(skip.code,202);assert.equal(stored.length,0);
  const bad=await request('/api/analytics?action=collect',{method:'POST',body:{type:'pageview',path:'/templates',session:'nope',visitor,dwell:0}});
  assert.equal(bad.code,400);
  const ok=await request('/api/analytics?action=collect',{method:'POST',body:{type:'pageview',path:'/templates',session,visitor,dwell:0,viewport:'1440x900',referrer:'https://findmyinvite.com/'}});
  assert.equal(ok.code,202);assert.equal(stored[0].path,'/templates');assert.equal(JSON.stringify(stored).includes(code),false);
 }finally{
  global.fetch=originalFetch;
  for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];
  Object.assign(process.env,env);
 }
});
test('journey summary counts unique visitors, flows and time on page',()=>{
 const insight=summarize([
  {occurred_at:'2026-09-15T10:00:00Z',session_id:'s1',visitor_id:'v1',path:'/',event_type:'pageview',dwell_ms:0},
  {occurred_at:'2026-09-15T10:00:20Z',session_id:'s1',visitor_id:'v1',path:'/',event_type:'heartbeat',dwell_ms:20000},
  {occurred_at:'2026-09-15T10:01:00Z',session_id:'s1',visitor_id:'v1',path:'/templates',event_type:'pageview',dwell_ms:0},
  {occurred_at:'2026-09-15T10:02:00Z',session_id:'s2',visitor_id:'v2',path:'/',event_type:'pageview',dwell_ms:5000}
 ]);
 assert.equal(insight.totals.pageviews,3);
 assert.equal(insight.totals.visitors,2);
 assert.equal(insight.flow[0].from,'/');
 assert.equal(insight.flow[0].to,'/templates');
 assert.equal(insight.funnel[0].count,2);
 assert.equal(insight.pages.find(p=>p.path==='/')?.avgDwellMs,12500);
});
