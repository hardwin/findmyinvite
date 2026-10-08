import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/client-proof.mjs';
import {issueSession} from '../server/akay-gate.mjs';
import {insights,setProofStore} from '../server/client-proofs.mjs';
import {postgrestMock,memoryStore} from './helpers/postgrest-mock.mjs';

const JPEG='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1]).toString('base64');
const operator='fmi_akay='+issueSession();

function call(url,{method='GET',body,cookie,auth}={}){
 return new Promise(resolve=>{
  const res={headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;resolve(this);},
   write(){},end(){resolve(this);},on(){},once(){},emit(){},destroy(){resolve(this);},headersSent:false};
  const headers={host:'findmyinvite.com','x-forwarded-proto':'https'};
  if(cookie)headers.cookie=cookie;if(auth)headers.authorization='Bearer '+auth;
  handler({url,method,body,headers,socket:{remoteAddress:'127.0.0.1'}},res);
 });
}

function setup(){
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 delete process.env.VERCEL;delete process.env.SITE_ORIGIN;
 const pg=postgrestMock(),store=memoryStore();
 global.fetch=async(url,options)=>{
  const u=new URL(url);
  if(u.pathname==='/auth/v1/user')return new Response('{}',{status:401});
  return pg.handler(url,options);
 };
 setProofStore(store);
 return {pg,store,restore(){global.fetch=oldFetch;process.env=oldEnv;setProofStore(null);}};
}

test('operator actions require the manager gate',async()=>{
 const env=setup();
 try{
  assert.equal((await call('/api/client-proof?action=list')).code,401);
  assert.equal((await call('/api/client-proof?action=create',{method:'POST',body:{couple:'A & B'}})).code,401);
 }finally{env.restore();}
});

test('register → upload → send → client changes one scene → resend → client approves → video → dispatch',async()=>{
 const env=setup();
 try{
  const created=await call('/api/client-proof?action=create',{method:'POST',cookie:operator,body:{couple:'Blessing & Stephy',clientName:'Stephy',clientPhone:'+91 98765-43210',template:'kerala-christian-v1'}});
  assert.equal(created.code,201);
  const job=created.body.job;
  assert.match(job.id,/^[0-9a-f]{12}$/);
  assert.equal(job.clientPhone,'+919876543210');
  assert.match(job.proofUrl,/^https:\/\/findmyinvite\.com\/proof\/[a-f0-9]{48}$/);
  const token=job.proofUrl.split('/').pop();

  assert.equal((await call('/api/client-proof?action=proof&token='+token)).code,404,'link closed until sent');
  assert.equal((await call(`/api/client-proof?action=send&id=${job.id}`,{method:'POST',cookie:operator})).code,400,'no stills yet');

  for(const scene of [1,2,3])assert.equal((await call(`/api/client-proof?action=still&id=${job.id}&scene=${scene}`,{method:'POST',cookie:operator,body:{dataUrl:JPEG,title:'Scene '+scene}})).code,200);
  assert.equal((await call(`/api/client-proof?action=still&id=${job.id}&scene=4`,{method:'POST',cookie:operator,body:{dataUrl:'data:image/png;base64,'+Buffer.from('this is not a real png image').toString('base64')}})).code,400);
  assert.equal(env.store.blobs.size,3);

  const sent=await call(`/api/client-proof?action=send&id=${job.id}`,{method:'POST',cookie:operator});
  assert.equal(sent.body.job.status,'stills_review');assert.equal(sent.body.job.round,1);

  const proof=await call('/api/client-proof?action=proof&token='+token);
  assert.equal(proof.code,200);
  assert.equal(proof.body.couple,'Blessing & Stephy');
  assert.equal(proof.body.canReview,true);
  assert.equal(proof.body.stills.length,3);
  assert.ok(!('proofUrl' in proof.body)&&!('clientPhone' in proof.body)&&!('notes' in proof.body),'client sees no operator fields');

  assert.equal((await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:2,decision:'change'}]}})).code,400,'change needs a comment');
  assert.equal((await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:9,decision:'approved'}]}})).code,400,'unknown scene');
  const r1=await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:1,decision:'approved',version:1},{scene:2,decision:'change',comment:'Remove the priest',version:1},{scene:3,decision:'approved',version:1}]}});
  assert.equal(r1.code,200);assert.equal(r1.body.status,'changes_requested');assert.equal(r1.body.approved,2);

  const re=await call(`/api/client-proof?action=still&id=${job.id}&scene=2`,{method:'POST',cookie:operator,body:{dataUrl:JPEG}});
  assert.equal(re.body.version,2);
  const detail=await call(`/api/client-proof?action=job&id=${job.id}`,{cookie:operator});
  assert.equal(detail.body.stills.find(s=>s.scene===2).decision,'pending');
  assert.equal(detail.body.stills.find(s=>s.scene===2).title,'Scene 2','title kept on replace');
  assert.equal((await call(`/api/client-proof?action=send&id=${job.id}`,{method:'POST',cookie:operator})).body.job.round,2);

  const p2=await call('/api/client-proof?action=proof&token='+token);
  assert.deepEqual(p2.body.stills.map(s=>s.decision),['approved','pending','approved']);
  assert.equal((await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:2,decision:'approved',version:1}]}})).code,409,'stale version rejected');
  const r2=await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:2,decision:'approved',version:2}]}});
  assert.equal(r2.body.status,'approved');
  assert.equal((await call('/api/client-proof?action=decide&token='+token,{method:'POST',body:{decisions:[{scene:2,decision:'approved'}]}})).code,409,'closed after approval');

  assert.equal((await call(`/api/client-proof?action=status&id=${job.id}`,{method:'POST',cookie:operator,body:{status:'video'}})).body.job.status,'video');
  assert.equal((await call(`/api/client-proof?action=status&id=${job.id}`,{method:'POST',cookie:operator,body:{status:'dispatched',finalUrl:'http://x'}})).code,400);
  const done=await call(`/api/client-proof?action=status&id=${job.id}`,{method:'POST',cookie:operator,body:{status:'dispatched',finalUrl:'https://example.com/final.mp4'}});
  assert.equal(done.body.job.status,'dispatched');
  assert.equal((await call('/api/client-proof?action=proof&token='+token)).body.finalUrl,'https://example.com/final.mp4');

  const list=await call('/api/client-proof?action=list',{cookie:operator});
  assert.equal(list.body.jobs[0].approvedCount,3);
  assert.equal(list.body.insights.byStatus.dispatched,1);
  assert.equal(list.body.insights.avgRoundsToApproval,2);
  assert.equal(list.body.insights.firstPassApprovalRate,0);
  assert.deepEqual(list.body.insights.topChangedScenes,[{title:'Scene 2',count:1}]);

  const kinds=env.pg.data.client_job_log.map(e=>e.kind);
  for(const k of ['registered','still_uploaded','sent','change','client_submit','approved','video','dispatched'])assert.ok(kinds.includes(k),k);

  const rotated=await call(`/api/client-proof?action=rotate&id=${job.id}`,{method:'POST',cookie:operator});
  assert.notEqual(rotated.body.job.proofUrl,job.proofUrl);
  assert.equal((await call('/api/client-proof?action=proof&token='+token)).code,404,'old link stops working');
 }finally{env.restore();}
});

test('client still images are served only for that token and existing versions',async()=>{
 const env=setup();
 try{
  const job=(await call('/api/client-proof?action=create',{method:'POST',cookie:operator,body:{couple:'A & B'}})).body.job;
  await call(`/api/client-proof?action=still&id=${job.id}&scene=1`,{method:'POST',cookie:operator,body:{dataUrl:JPEG}});
  await call(`/api/client-proof?action=send&id=${job.id}`,{method:'POST',cookie:operator});
  const token=job.proofUrl.split('/').pop();
  assert.equal((await call(`/api/client-proof?action=proof-image&token=${'0'.repeat(48)}&scene=1`)).code,404);
  assert.equal((await call(`/api/client-proof?action=proof-image&token=${token}&scene=1&v=5`)).code,404);
  assert.equal((await call(`/api/client-proof?action=proof-image&token=bad&scene=1`)).code,404);
 }finally{env.restore();}
});

test('insights ignore per-scene approvals when timing job approval',()=>{
 const rows=[{id:'a',status:'approved',round:1}];
 const ev=[{job_id:'a',kind:'sent',scene:null,created_at:'2026-10-08T00:00:00Z'},{job_id:'a',kind:'approved',scene:3,created_at:'2026-10-08T01:00:00Z'},{job_id:'a',kind:'approved',scene:null,created_at:'2026-10-08T04:00:00Z'}];
 const i=insights(rows,ev,[]);
 assert.equal(i.avgHoursToApproval,4);
 assert.equal(i.firstPassApprovalRate,100);
});

test('client proof tables are service-role only and the page is not indexed or tracked',async()=>{
 const sql=await readFile(new URL('../supabase/015_client_proofs.sql',import.meta.url),'utf8');
 for(const t of ['client_jobs','client_job_stills','client_job_log'])assert.match(sql,new RegExp('alter table public\\.'+t+' enable row level security'));
 assert.match(sql,/revoke all on public\.client_jobs, public\.client_job_stills, public\.client_job_log from anon, authenticated/);
 const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.ok(vercel.headers.some(h=>h.source==='/proof/(.*)'&&h.headers.some(x=>x.key==='X-Robots-Tag')));
 assert.match(await readFile(new URL('../src/analytics.ts',import.meta.url),'utf8'),/akay\|assembly\|proof/);
});
