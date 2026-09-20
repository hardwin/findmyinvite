import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 STYLE_LANES,
 STYLE_PULSE_SLOTS,
 STYLE_TARGET_MIN,
 STYLE_BATCH_SIZE,
 STYLE_MAX_BATCHES,
 styleLaneMix,
 buildStylePulsePrompt,
 filterNovelStyles,
 applyPinterestSoftGate,
 styleFingerprint,
 buildStyleReferenceUrls,
 sanitizeReferenceUrls,
 resolveBlogSeed
} from '../server/style-pulse.mjs';
import {parseInspirationListQuery,cleanInspirationId,decideInspirationStatus} from '../server/akay-inspirations.mjs';
import handler from '../api/akay-inspirations.mjs';
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

test('Style Pulse targets ≥25 South India lanes with blog backlinks',()=>{
 assert.equal(STYLE_TARGET_MIN,25);
 assert.ok(STYLE_MAX_BATCHES*STYLE_BATCH_SIZE>=STYLE_TARGET_MIN);
 assert.ok(STYLE_LANES.includes('hindu_traditional'));
 assert.ok(STYLE_LANES.includes('romantic_ai_couple'));
 assert.deepEqual(Object.keys(STYLE_PULSE_SLOTS).sort(),['afternoon','evening','morning']);
 const morning=styleLaneMix('morning');
 const topics=[{id:'11111111-1111-1111-8111-111111111111',title:'Rising Trend of Digital Invitations for Bengaluru’s Traditional Iyengar Weddings',primary_keyword:'Iyengar wedding invitations'}];
 const prompt=buildStylePulsePrompt({
  slot:'morning',date:'2026-09-20',lanes:morning,
  existingNames:['Old style'],blogTopics:topics,
  targetCount:15,batchIndex:1,batchTotal:3
 });
 assert.match(prompt,/EXACT title/i);
 assert.match(prompt,/Do NOT invent reference_urls/i);
 assert.match(prompt,/Iyengar/);
 assert.equal(styleFingerprint('Temple Gold','hindu_traditional').length,64);
});

test('reference URLs reject hallucinated pin IDs and use search links',()=>{
 const built=buildStyleReferenceUrls({primary_keyword:'Iyengar wedding invitations',style_name:'Iyengar Scripted Legacy'});
 assert.ok(built[0].includes('pinterest.com/search/pins'));
 assert.ok(built[0].includes('Iyengar'));
 assert.ok(built[1].includes('unsplash.com/s/photos/'));
 assert.deepEqual(sanitizeReferenceUrls([
  'https://www.pinterest.com/pin/567488040032279278/',
  'https://www.pinterest.com/search/pins/?q=test',
  'not-a-url'
 ]),['https://www.pinterest.com/search/pins/?q=test']);
});

test('resolveBlogSeed matches exact blog title',()=>{
 const seeds=[{id:'a',title:'Kerala’s Onam Wedding Celebrations Translating Into Digital Invitation Trends',primary_keyword:'Onam wedding invitation'}];
 const hit=resolveBlogSeed({blog_title:'Kerala’s Onam Wedding Celebrations Translating Into Digital Invitation Trends',blog_seed_keywords:[]},seeds);
 assert.equal(hit?.id,'a');
 assert.equal(resolveBlogSeed({blog_title:'Totally unrelated',blog_seed_keywords:[]},seeds),null);
});

test('filterNovelStyles soft-keeps thin evidence and blocks duplicate blog backlinks',()=>{
 const soft=filterNovelStyles([
  {style_name:'Fresh Kanjivaram gold invite mood',primary_keyword:'kanjivaram invite',validation:'SUPPORTED',ai_prompt:'x',blog_title:'Blog A'},
  {style_name:'Second style same blog',primary_keyword:'x',validation:'SUPPORTED',ai_prompt:'x',blog_title:'Blog A'},
  {style_name:'Thin romantic dusk couple',primary_keyword:'romantic couple',validation:'INSUFFICIENT_DATA',ai_prompt:'x',blog_title:'Blog B'}
 ],['Old style'],{softEvidence:true});
 assert.equal(soft.accepted.length,2);
 assert.ok(soft.skipped.some(s=>s.reason==='duplicate_blog_backlink'));
});

test('Pinterest soft gate without partner token',()=>{
 const skip=applyPinterestSoftGate({});
 assert.ok(skip.limitations[0].includes('PINTEREST_TRENDS_SOFT_SKIP'));
});

test('inspiration list query and decide guards',()=>{
 const q=parseInspirationListQuery('/api/akay-inspirations?action=list&status=queued&lane=creative_ai&limit=10');
 assert.equal(q.status,'queued');
 assert.equal(q.lane,'creative_ai');
 assert.throws(()=>parseInspirationListQuery('/api/akay-inspirations?lane=bollywood'));
 assert.throws(()=>cleanInspirationId('nope'));
 assert.equal(decideInspirationStatus('approved'),'approved');
 assert.throws(()=>decideInspirationStatus('queued'));
});

test('inspirations API requires session; pulse requires cron; run is session-gated',async()=>{
 const prev=process.env.BLOG_PULSE_CRON_SECRET;
 process.env.BLOG_PULSE_CRON_SECRET='test-cron-secret';
 try{
  const open=await request('/api/akay-inspirations?action=list',{headers:{cookie:''}});
  assert.equal(open.statusCode,401);
  const pulseDenied=await request('/api/akay-inspirations?action=pulse',{method:'POST',headers:{cookie:''}});
  assert.equal(pulseDenied.statusCode,401);
  const runDenied=await request('/api/akay-inspirations?action=run',{method:'POST',headers:{cookie:''}});
  assert.equal(runDenied.statusCode,401);
  const ui=await readFile(new URL('../src/AkayInspirations.tsx',import.meta.url),'utf8');
  assert.match(ui,/blog_title/);
  assert.match(ui,/PinterestEmbed/);
  assert.match(ui,/aria-label="Approve"/);
 }finally{
  if(prev===undefined)delete process.env.BLOG_PULSE_CRON_SECRET;
  else process.env.BLOG_PULSE_CRON_SECRET=prev;
 }
});

test('AkayAdmin registers Inspirations; vercel cron is +1 min after blog',async()=>{
 const admin=await readFile(new URL('../src/AkayAdmin.tsx',import.meta.url),'utf8');
 assert.match(admin,/inspirations/);
 assert.match(admin,/AkayInspirations/);
 assert.match(admin,/akay\.css/);
 const vercel=await readFile(new URL('../vercel.json',import.meta.url),'utf8');
 assert.match(vercel,/"31 2 \* \* \*"/);
 const sql=await readFile(new URL('../supabase/012_inspiration_blog_backlink.sql',import.meta.url),'utf8');
 assert.match(sql,/blog_topic_id/);
 assert.match(sql,/blog_title/);
});
