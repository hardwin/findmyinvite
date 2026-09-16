import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/akay-shortlist.mjs';
import analytics from '../api/analytics.mjs';
import {issueSession} from '../server/akay-gate.mjs';
import {parseListQuery,mapItem,decideStatus} from '../server/akay-shortlist.mjs';
import {payloadFrom} from '../src/akay-shortlist-payload.mjs';
const id='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const competitor='33333333-3333-4333-8333-333333333333';
function cookie(){return 'fmi_akay='+issueSession();}
async function request(url,{method='GET',body,secret=true}={}){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await handler({url,method,body,headers:{cookie:secret?cookie():''},socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}
function row(overrides={}){
 return {
  id,title:'Royal foil suite',url:'https://varumo.example/template',reason:'High demand wedding look',suggested_tier:'royal',batch:'A',status:'proposed',
  created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-01T00:00:00Z',competitor_id:competitor,
  competitors:{name:'Varumo',slug:'varumo',is_direct:true,relation:'direct',category:'premium_cinematic',homepage:'https://varumo.example',catalogue_urls:['https://varumo.example/all']},
  replication_queue:[],
  ...overrides
 };
}
test('shortlist payloadFrom keeps a missing items array from crashing the desk',()=>{
 assert.equal(payloadFrom({error:'Publishing is not configured yet.'}),null);
 assert.equal(payloadFrom({}),null);
 const payload=payloadFrom({items:[{id,title:'Royal foil suite',catalogue_urls:null,category:null}],status_counts:{proposed:1},competitors:[{id:competitor,name:'Varumo'}],batches:['A']});
 assert.ok(payload);
 assert.equal(payload.items.length,1);
 assert.deepEqual(payload.items[0].catalogue_urls,[]);
 assert.equal(payload.status_counts.proposed,1);
});
test('shortlist list defaults to proposed and maps competitor plus queue',()=>{
 const query=parseListQuery('/api/akay-shortlist');
 assert.equal(query.status,'proposed');
 assert.equal(query.limit,25);
 const item=mapItem(row({replication_queue:[{id:'q1',status:'queued'}]}));
 assert.equal(item.competitor_name,'Varumo');
 assert.equal(item.is_direct,true);
 assert.equal(item.replication_status,'queued');
 assert.equal(item.catalogue_urls[0],'https://varumo.example/all');
 assert.throws(()=>decideStatus('queued'));
});
test('shortlist mutations require the operator session and skip public analytics',async()=>{
 assert.equal((await request('/api/akay-shortlist?action=list',{secret:false})).code,401);
 const skipped=await (async()=>{
  const res={headers:{},setHeader(){},status(n){this.code=n;return this;},json(b){this.body=b;}};
  await analytics({url:'/api/analytics?action=collect',method:'POST',body:{type:'pageview',path:'/akay/shortlist',session:id,visitor:other,dwell:0},headers:{},socket:{remoteAddress:'127.0.0.1'}},res);
  return res;
 })();
 assert.equal(skipped.code,202);
});
test('approve enqueues once; re-approve is 409; reject leaves queue empty',async()=>{
 const env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 const candidates=[row()];const queue=[];
 const originalFetch=global.fetch;
 global.fetch=async(url,options={})=>{
  const parsed=new URL(url),path=parsed.pathname.replace('/rest/v1/',''),method=options.method||'GET',payload=options.body?JSON.parse(options.body):null;
  if(path==='rpc/consume_rate_limit')return new Response('true',{status:200});
  if(path==='shortlist_candidates'){
   if(method==='GET'){
    const select=parsed.searchParams.get('select')||'';
    if(select==='status')return new Response(JSON.stringify(candidates.map(c=>({status:c.status}))),{status:200,headers:{'content-range':'0-0/'+candidates.length}});
    if(select.startsWith('competitor_id'))return new Response(JSON.stringify(candidates.map(c=>({competitor_id:c.competitor_id,batch:c.batch,competitors:c.competitors}))),{status:200});
    const status=parsed.searchParams.get('status');
    const rows=status&&status.startsWith('eq.')?candidates.filter(c=>c.status===status.slice(3)):candidates;
    const idFilter=parsed.searchParams.get('id');
    const filtered=idFilter&&idFilter.startsWith('eq.')?rows.filter(c=>c.id===idFilter.slice(3)):rows;
    return new Response(JSON.stringify(filtered.map(c=>({...c,replication_queue:queue.filter(q=>q.candidate_id===c.id)}))),{status:200,headers:{'content-range':'0-'+(filtered.length-1)+'/'+filtered.length}});
   }
   if(method==='PATCH'){
    const idFilter=parsed.searchParams.get('id')?.replace('eq.','');
    const statusFilter=parsed.searchParams.get('status')?.replace('eq.','');
    const match=candidates.find(c=>c.id===idFilter&&(!statusFilter||c.status===statusFilter));
    if(!match)return new Response('[]',{status:200});
    Object.assign(match,payload);
    return new Response(JSON.stringify([match]),{status:200});
   }
  }
  if(path==='replication_queue'){
   if(method==='POST'){
    if(queue.some(q=>q.candidate_id===payload.candidate_id))return new Response('[]',{status:200});
    const created={id:'44444444-4444-4444-8444-444444444444',status:payload.status||'queued',candidate_id:payload.candidate_id};
    queue.push(created);return new Response(JSON.stringify([created]),{status:201});
   }
   const candidate=parsed.searchParams.get('candidate_id')?.replace('eq.','');
   return new Response(JSON.stringify(queue.filter(q=>q.candidate_id===candidate)),{status:200});
  }
  throw new Error('Unexpected '+path+' '+method);
 };
 try{
  const listed=await request('/api/akay-shortlist?action=list');
  assert.equal(listed.code,200);
  assert.equal(listed.body.items[0].title,'Royal foil suite');
  assert.equal(listed.body.status_counts.proposed,1);
  const approved=await request('/api/akay-shortlist?action=decide',{method:'POST',body:{id,status:'approved'}});
  assert.equal(approved.code,200);
  assert.equal(approved.body.candidate.status,'approved');
  assert.equal(approved.body.replication_queue.status,'queued');
  assert.equal(queue.length,1);
  const again=await request('/api/akay-shortlist?action=decide',{method:'POST',body:{id,status:'approved'}});
  assert.equal(again.code,409);
  assert.equal(queue.length,1);
  candidates[0].status='proposed';queue.length=0;
  const rejected=await request('/api/akay-shortlist?action=decide',{method:'POST',body:{id,status:'rejected'}});
  assert.equal(rejected.code,200);
  assert.equal(rejected.body.candidate.status,'rejected');
  assert.equal(queue.length,0);
  candidates[0].status='proposed';
  const bulk=await request('/api/akay-shortlist?action=bulk',{method:'POST',body:{ids:[id],status:'approved'}});
  assert.equal(bulk.code,200);
  assert.deepEqual(bulk.body.ok,[id]);
  assert.equal(queue.length,1);
 }finally{
  global.fetch=originalFetch;
  for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];
  Object.assign(process.env,env);
 }
});
test('operator desk splits traffic journeys live and shortlist and stays unlinked',async()=>{
 const admin=await readFile(new URL('../src/AkayAdmin.tsx',import.meta.url),'utf8');
 assert.match(admin,/\/akay\/shortlist/);
 assert.match(admin,/\/akay\/journeys/);
 assert.match(admin,/\/akay\/live/);
 assert.equal(admin.includes('Traffic & journeys'),false);
 const vite=await readFile(new URL('../run.mjs',import.meta.url),'utf8');
 assert.match(vite,/base:'\/'/);
 const shortlist=await readFile(new URL('../src/AkayShortlist.tsx',import.meta.url),'utf8');
 assert.equal(shortlist.toLowerCase().includes('forgot'),false);
 assert.match(shortlist,/Approve/);
 assert.match(shortlist,/akay-shortlist-payload/);
 assert.match(shortlist,/data\?\.items/);
 assert.equal(shortlist.includes('data.items.length'),false);
 assert.match(admin,/DeskPanel/);
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/path\.startsWith\('\/akay'\)/);
 const home=await readFile(new URL('../src/Home.tsx',import.meta.url),'utf8');
 const header=await readFile(new URL('../src/components.tsx',import.meta.url),'utf8');
 assert.equal(home.includes('/akay'),false);
 assert.equal(header.includes('/akay'),false);
});
