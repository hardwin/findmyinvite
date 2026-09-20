import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 isNearParaphrase,
 filterNovelTopics,
 normalizeTitle,
 titleFingerprint,
 pulseSlotFor,
 laneMix,
 buildPulsePrompt,
 SIGNAL_LANES,
 PULSE_SLOTS
} from '../server/south-pulse.mjs';
import {parseListQuery,cleanId,decideStatus} from '../server/akay-blog-queue.mjs';
import handler from '../api/akay-blog-queue.mjs';
import {issueSession} from '../server/akay-gate.mjs';

function cookie(){return 'fmi_akay='+issueSession();}
async function request(url,{method='GET',headers={},cron=false}={}){
 const res={headers:{},statusCode:200,body:null,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(b){this.body=b;return this;}};
 await handler({
  method,url,
  headers:{
   ...(cron?{authorization:'Bearer test-cron-secret'}:{cookie:cookie()}),
   ...headers
  }
 },res);
 return res;
}

test('near-paraphrase gate rejects duplicates and rephrases',()=>{
 const existing=['Chennai wedding invitation trends 2026'];
 assert.equal(isNearParaphrase('Chennai wedding invitation trends 2026',existing),true);
 assert.equal(isNearParaphrase('Chennai wedding invitation trends for 2026',existing),true);
 assert.equal(isNearParaphrase('Unique Tamil wedding song playlist for digital invites',existing),false);
 assert.equal(normalizeTitle("Raja's Wedding"),'rajas wedding');
 assert.equal(titleFingerprint('Hello').length,64);
});

test('filterNovelTopics drops insufficient and paraphrase rows',()=>{
 const result=filterNovelTopics([
  {title:'Fresh Coimbatore temple wedding invite ideas',primary_keyword:'coimbatore temple wedding',validation:'SUPPORTED'},
  {title:'Chennai wedding invitation trends for 2026',primary_keyword:'chennai wedding',validation:'SUPPORTED'},
  {title:'Weak signal',primary_keyword:'x',validation:'INSUFFICIENT_DATA'}
 ],['Chennai wedding invitation trends 2026']);
 assert.equal(result.accepted.length,1);
 assert.equal(result.accepted[0].title,'Fresh Coimbatore temple wedding invite ideas');
 assert.ok(result.skipped.some(s=>s.reason==='near_paraphrase'));
 assert.ok(result.skipped.some(s=>s.reason==='insufficient_evidence'));
});

test('South India pulse slots and lanes stay locked',()=>{
 assert.deepEqual(Object.keys(PULSE_SLOTS).sort(),['afternoon','evening','morning']);
 assert.ok(SIGNAL_LANES.includes('tamil_cinema'));
 assert.ok(SIGNAL_LANES.includes('occasion'));
 const morning=laneMix('morning');
 assert.ok(morning.includes('occasion'));
 assert.ok(morning.includes('news'));
 const prompt=buildPulsePrompt({slot:'morning',date:'2026-09-20',lanes:morning,existingTitles:['Old topic']});
 assert.match(prompt,/SOUTH INDIA ONLY/i);
 assert.match(prompt,/Never Worldwide|Worldwide/i);
 assert.match(prompt,/Old topic/);
 assert.ok(['morning','afternoon','evening'].includes(pulseSlotFor(new Date('2026-09-20T02:30:00Z'))));
});

test('list query parsing and decide guards',()=>{
 const q=parseListQuery('/api/akay-blog-queue?action=list&status=queued&lane=occasion&limit=10');
 assert.equal(q.status,'queued');
 assert.equal(q.lane,'occasion');
 assert.equal(q.limit,10);
 assert.throws(()=>parseListQuery('/api/akay-blog-queue?status=nope'));
 assert.throws(()=>parseListQuery('/api/akay-blog-queue?lane=bollywood'));
 assert.throws(()=>cleanId('not-a-uuid'));
 assert.equal(decideStatus('approved'),'approved');
 assert.throws(()=>decideStatus('queued'));
});

test('blog queue API requires session; pulse requires cron secret; run is session-gated',async()=>{
 const prev=process.env.BLOG_PULSE_CRON_SECRET;
 process.env.BLOG_PULSE_CRON_SECRET='test-cron-secret';
 try{
  const open=await request('/api/akay-blog-queue?action=list',{headers:{cookie:''}});
  assert.equal(open.statusCode,401);
  const pulseDenied=await request('/api/akay-blog-queue?action=pulse',{method:'POST',headers:{cookie:''}});
  assert.equal(pulseDenied.statusCode,401);
  const runDenied=await request('/api/akay-blog-queue?action=run',{method:'POST',headers:{cookie:''}});
  assert.equal(runDenied.statusCode,401);
  const api=await readFile(new URL('../api/akay-blog-queue.mjs',import.meta.url),'utf8');
  assert.match(api,/action==='run'/);
  assert.match(api,/runManualPulse/);
  const ui=await readFile(new URL('../src/AkayBlogQueue.tsx',import.meta.url),'utf8');
  assert.match(ui,/Run pulse now/);
  assert.match(ui,/action=run/);
 }finally{
  if(prev===undefined)delete process.env.BLOG_PULSE_CRON_SECRET;
  else process.env.BLOG_PULSE_CRON_SECRET=prev;
 }
});

test('AkayAdmin registers Blog queue and stays unlinked from public pages',async()=>{
 const admin=await readFile(new URL('../src/AkayAdmin.tsx',import.meta.url),'utf8');
 assert.match(admin,/blog-queue/);
 assert.match(admin,/Blog queue/);
 assert.match(admin,/AkayBlogQueue/);
 for(const file of ['Home.tsx','components.tsx']){
  const source=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
  assert.equal(source.includes('/akay'),false,file+' must not link /akay');
 }
 const vercel=await readFile(new URL('../vercel.json',import.meta.url),'utf8');
 assert.match(vercel,/akay-blog-queue/);
 assert.match(vercel,/"30 2 \* \* \*"/);
 assert.match(vercel,/"30 8 \* \* \*"/);
 assert.match(vercel,/"30 14 \* \* \*"/);
 const sql=await readFile(new URL('../supabase/010_blog_topic_queue.sql',import.meta.url),'utf8');
 assert.match(sql,/blog_topic_queue/);
 assert.match(sql,/blog_pulse_runs/);
});
