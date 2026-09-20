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
 assert.equal(STYLE_LANES.includes('creative_ai'),false);
 assert.equal(STYLE_LANES.includes('modern_minimal'),false);
 assert.deepEqual(Object.keys(STYLE_PULSE_SLOTS).sort(),['afternoon','evening','morning']);
 const morning=styleLaneMix('morning');
 const topics=[{id:'11111111-1111-1111-8111-111111111111',title:'Rising Trend of Digital Invitations for Bengaluru’s Traditional Iyengar Weddings',primary_keyword:'Iyengar wedding invitations'}];
 const prompt=buildStylePulsePrompt({
  slot:'morning',date:'2026-09-20',lanes:morning,
  existingNames:['Old style'],blogTopics:topics,
  targetCount:15,batchIndex:1,batchTotal:3
 });
 assert.match(prompt,/EXACT title/i);
 assert.match(prompt,/romantic\/cute couple|ALLOWED lanes only/i);
 assert.match(prompt,/Iyengar/);
 assert.equal(styleFingerprint('Temple Gold','hindu_traditional').length,64);
});

test('reference URLs are clean Pinterest search (no doubled wedding invitation, no Unsplash)',()=>{
 const built=buildStyleReferenceUrls({primary_keyword:'Yakshagana wedding invitation',style_name:'Yakshagana Folk'});
 assert.equal(built.length,1);
 assert.ok(built[0].includes('pinterest.com/search/pins'));
 const q=decodeURIComponent(built[0].split('q=')[1]||'');
 assert.equal((q.match(/wedding invitation/gi)||[]).length,1);
 assert.equal(q.includes('aesthetic'),false);
 const messy=buildStyleReferenceUrls({
  primary_keyword:'Yakshagana wedding invitation wedding invitation aesthetic',
  style_name:'Yakshagana Folk'
 });
 const messyQ=decodeURIComponent(messy[0].split('q=')[1]||'');
 assert.equal(messyQ,'Yakshagana wedding invitation');
 assert.deepEqual(sanitizeReferenceUrls([
  'https://www.pinterest.com/pin/567488040032279278/',
  'https://www.pinterest.com/search/pins/?q=test',
  'not-a-url'
 ]),['https://www.pinterest.com/search/pins/?q=test']);
});

test('filterNovelStyles skips non-romantic non-traditional styles',()=>{
 const soft=filterNovelStyles([
  {style_name:'Fresh Kanjivaram gold invite mood',primary_keyword:'kanjivaram invite',lanes:['hindu_traditional'],validation:'SUPPORTED',ai_prompt:'x',blog_title:'Blog A'},
  {style_name:'Hyderabad Biryani Feast',primary_keyword:'biryani invite',lanes:['creative_ai'],validation:'SUPPORTED',ai_prompt:'x',blog_title:'Blog Food'},
  {style_name:'Romantic dusk couple',primary_keyword:'romantic couple',lanes:['romantic_ai_couple'],validation:'INSUFFICIENT_DATA',ai_prompt:'x',blog_title:'Blog B'}
 ],['Old style'],{softEvidence:true});
 assert.equal(soft.accepted.length,2);
 assert.ok(soft.skipped.some(s=>s.reason==='not_romantic_or_traditional'));
});

test('Pinterest soft gate without partner token',()=>{
 const skip=applyPinterestSoftGate({});
 assert.ok(skip.limitations[0].includes('PINTEREST_TRENDS_SOFT_SKIP'));
});

test('inspiration list query and decide guards',()=>{
 const q=parseInspirationListQuery('/api/akay-inspirations?action=list&status=queued&lane=romantic_ai_couple&limit=10');
 assert.equal(q.status,'queued');
 assert.equal(q.lane,'romantic_ai_couple');
 assert.throws(()=>parseInspirationListQuery('/api/akay-inspirations?lane=creative_ai'));
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
  assert.match(ui,/aria-label="Approve"/);
  assert.match(ui,/Table/);
  assert.equal(ui.includes('PinterestEmbed'),false);
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
