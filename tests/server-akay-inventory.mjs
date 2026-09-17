import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/akay-inventory.mjs';
import {issueSession} from '../server/akay-gate.mjs';
import {parseCompetitorQuery,parseUpcomingQuery,httpUrl,pagePreview,relationBadge,mapCompetitor,mapUpcoming,upcomingChips,tierNote} from '../server/akay-inventory.mjs';
const ayozan='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const riwaaz='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function cookie(){return 'fmi_akay='+issueSession();}
async function request(url,{method='GET',secret=true}={}){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await handler({url,method,headers:{cookie:secret?cookie():''},socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}
test('inventory HTTP URLs stay verified and junk is dropped',()=>{
 assert.equal(httpUrl('https://ayozan.com/'),'https://ayozan.com/');
 assert.equal(httpUrl('http://www.riwaaz.in/invitations/video'),'http://www.riwaaz.in/invitations/video');
 assert.equal(httpUrl('javascript:alert(1)'),'');
 assert.equal(httpUrl('/templates/foo'),'');
 assert.equal(httpUrl(''),'');
 assert.match(pagePreview('https://ayozan.com/'),/mshots\/v1\/https%3A%2F%2Fayozan.com%2F/);
 assert.match(pagePreview('https://ayozan.com/'),/vpw=390/);
 assert.equal(pagePreview('javascript:alert(1)'),'');
 assert.equal(pagePreview('/templates/foo'),'');
});
test('Ayozan is Direct, Riwaaz is Indirect, others have no relation badge',()=>{
 assert.equal(relationBadge({is_direct:true,relation:'direct'}),'direct');
 assert.equal(relationBadge({is_direct:false,relation:'indirect'}),'indirect');
 assert.equal(relationBadge({is_direct:false,relation:null}),'');
 const mapped=mapCompetitor({id:ayozan,name:'Ayozan',homepage:'https://ayozan.com/',catalogue_urls:['https://ayozan.com/c/wedding-invitation-cards','not-a-url'],is_direct:true,relation:'direct',category:'freemium_cheap'},{proposed:2,approved:1});
 assert.equal(mapped.badge,'direct');
 assert.equal(mapped.catalogue_count,1);
 assert.equal(mapped.shortlist_counts.proposed,2);
 assert.match(mapped.preview,/mshots/);
 assert.equal(mapUpcoming({id:riwaaz,source_url:'ftp://x',name:'Card'}).source_url,'');
 assert.equal(mapUpcoming({id:riwaaz,source_url:'ftp://x',name:'Card'}).preview,'');
});
test('upcoming chips match Ayozan 140/106 and Riwaaz 78/37',()=>{
 const chips=upcomingChips([
  {source_competitor:'ayozan',design_code:'classic',count:140},
  {source_competitor:'ayozan',design_code:'royal',n:106},
  {source_competitor:'riwaaz',design_code:'classic',count:78},
  {source_competitor:'riwaaz',design_code:'royal',count:37}
 ]);
 assert.deepEqual(chips,{ayozan_classic:140,ayozan_royal:106,riwaaz_classic:78,riwaaz_royal:37,all:361});
 assert.match(tierNote({source_competitor:'ayozan',design_code:'classic'}),/direct/);
 assert.match(tierNote({source_competitor:'riwaaz',design_code:'royal'}),/indirect/);
 assert.match(tierNote({source_competitor:'riwaaz',design_code:'royal'}),/never an MP4/);
});
test('list query defaults and rejects unknown filters',()=>{
 const competitors=parseCompetitorQuery('/api/akay-inventory?view=competitors');
 assert.equal(competitors.limit,25);
 assert.equal(competitors.direct,false);
 assert.equal(parseUpcomingQuery('/api/akay-inventory?view=upcoming').status,'');
 assert.equal(parseUpcomingQuery('/api/akay-inventory?view=upcoming&status=queued').status,'queued');
 assert.throws(()=>parseCompetitorQuery('/api/akay-inventory?relation=cousin'));
 assert.throws(()=>parseUpcomingQuery('/api/akay-inventory?design_code=gold'));
});
test('inventory reads require the operator session and reject writes',async()=>{
 assert.equal((await request('/api/akay-inventory?view=competitors',{secret:false})).code,401);
 assert.equal((await request('/api/akay-inventory?view=upcoming',{method:'POST'})).code,405);
 assert.equal((await request('/api/akay-inventory?view=upcoming',{method:'PATCH'})).code,405);
});
test('list competitors joins shortlist counts; upcoming chips stay unfiltered',async()=>{
 const env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 const competitors=[{id:ayozan,name:'Ayozan',slug:'ayozan',homepage:'https://ayozan.com/',catalogue_urls:['https://ayozan.com/c/wedding-invitation-cards'],category:'freemium_cheap',geography:'India',is_direct:true,relation:'direct',notes:'Direct webpage rival.',created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-16T00:00:00Z'},
  {id:riwaaz,name:'Riwaaz',slug:'riwaaz',homepage:'https://www.riwaaz.in/',catalogue_urls:['https://www.riwaaz.in/'],category:'marketplace_templates',geography:'India',is_direct:false,relation:'indirect',notes:'Video rival.',created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-16T00:00:00Z'}];
 const queue=Array.from({length:361},(_,i)=>({
  id:'cccccccc-cccc-4ccc-8ccc-'+String(i).padStart(12,'0'),
  name:'Seed '+i,slug:'seed-'+i,source_competitor:i<246?'ayozan':'riwaaz',
  source_url:i<246?'https://ayozan.com/templates/x':'https://www.riwaaz.in/invitations/wedding-card/ayodhya',
  design_code:i<140||(i>=246&&i<324)?'classic':'royal',
  intended_use:i<140?'free_basic_classic':i<246?'free_basic_royal':'variation',
  status:'queued',notes:'',created_at:'2026-09-01T00:00:00Z',updated_at:'2026-09-16T00:00:00Z'
 }));
 const originalFetch=global.fetch;
 global.fetch=async(url)=>{
  const parsed=new URL(url),path=parsed.pathname.replace('/rest/v1/',''),select=parsed.searchParams.get('select')||'';
  if(path==='competitors'){
   const rows=select==='category'?competitors.map(c=>({category:c.category})):competitors;
   return new Response(JSON.stringify(rows),{status:200,headers:{'content-range':'0-'+(rows.length-1)+'/'+competitors.length}});
  }
  if(path==='shortlist_candidates')return new Response(JSON.stringify([{competitor_id:ayozan,status:'proposed'},{competitor_id:ayozan,status:'approved'}]),{status:200});
  if(path==='upcoming_design_queue'){
   if(select==='source_competitor,intended_use,design_code,status')return new Response(JSON.stringify(queue.map(row=>({source_competitor:row.source_competitor,intended_use:row.intended_use,design_code:row.design_code,status:row.status}))),{status:200});
   const limit=Number(parsed.searchParams.get('limit')||25);
   const offset=Number(parsed.searchParams.get('offset')||0);
   const slice=queue.slice(offset,offset+limit);
   return new Response(JSON.stringify(slice),{status:200,headers:{'content-range':offset+'-'+(offset+slice.length-1)+'/'+queue.length}});
  }
  throw new Error('Unexpected '+path);
 };
 try{
  const listed=await request('/api/akay-inventory?view=competitors');
  assert.equal(listed.code,200);
  assert.equal(listed.body.items.length,2);
  assert.equal(listed.body.items.find(item=>item.name==='Ayozan').badge,'direct');
  assert.equal(listed.body.items.find(item=>item.name==='Riwaaz').badge,'indirect');
  assert.equal(listed.body.items.find(item=>item.name==='Ayozan').shortlist_counts.proposed,1);
  assert.match(listed.body.items.find(item=>item.name==='Ayozan').preview,/mshots/);
  const upcoming=await request('/api/akay-inventory?view=upcoming');
  assert.equal(upcoming.code,200);
  assert.equal(upcoming.body.total,361);
  assert.equal(upcoming.body.items.length,25);
  assert.deepEqual(upcoming.body.chips,{ayozan_classic:140,ayozan_royal:106,riwaaz_classic:78,riwaaz_royal:37,all:361});
  assert.equal(JSON.stringify(upcoming.body).includes('Approve'),false);
 }finally{
  global.fetch=originalFetch;
  for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];
  Object.assign(process.env,env);
 }
});
test('operator desk adds competitors and upcoming without inventing a combined insights page',async()=>{
 const admin=await readFile(new URL('../src/AkayAdmin.tsx',import.meta.url),'utf8');
 const api=await readFile(new URL('../api/akay-inventory.mjs',import.meta.url),'utf8');
 const upcoming=await readFile(new URL('../src/AkayUpcoming.tsx',import.meta.url),'utf8');
 const competitors=await readFile(new URL('../src/AkayCompetitors.tsx',import.meta.url),'utf8');
 const preview=await readFile(new URL('../src/AkayPagePreview.tsx',import.meta.url),'utf8');
 assert.match(admin,/\/akay\/competitors/);
 assert.match(admin,/\/akay\/upcoming/);
 assert.equal(admin.includes('Traffic & journeys'),false);
 assert.equal(upcoming.includes('Approve'),false);
 assert.equal(competitors.includes('Approve'),false);
 assert.match(upcoming,/Ayozan Classic/);
 assert.match(upcoming,/AkayPagePreview/);
 assert.match(competitors,/AkayPagePreview/);
 assert.match(preview,/mshots|page preview|Preview unavailable/);
 assert.match(api,/method\(req,\['GET'\]\)/);
});
