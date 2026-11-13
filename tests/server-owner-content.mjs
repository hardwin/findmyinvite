import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
process.env.FMI_OWNER_LOCAL='1';process.env.FMI_OWNER_DB=resolve('work/owner-tests/'+randomUUID()+'.sqlite');
process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';delete process.env.VERCEL;
const {boundedPublicFetch,publicAuditPath,inspectPage,robotsAllows}=await import('../server/owner/seo.mjs');
const {save,get}=await import('../server/owner/store.mjs');
const {publicArticles,articleHtml,sitemapXml,publishedRevision,promoteScheduled}=await import('../server/owner/content.mjs');
const {sources,snapshot}=await import('../server/owner/reporting.mjs');
test('technical crawler rejects arbitrary origins, private routes and redirect targets',async()=>{
 for(const path of ['/akay','/proof/a','/api/invitations','/ashok-wedding','//127.0.0.1','/blog/../../api/owner','/blog/a?url=http://localhost'])assert.equal(publicAuditPath(path),false);
 let calls=0;const request=async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new Response('',{status:302,headers:{location:'http://169.254.169.254'}})};
 await assert.rejects(boundedPublicFetch('http://localhost','/',request));await assert.rejects(boundedPublicFetch('https://findmyinvite.com','/akay',request));
 assert.equal((await boundedPublicFetch('https://findmyinvite.com','/blog',request)).status,302);assert.equal(calls,1);
 await assert.rejects(boundedPublicFetch('https://findmyinvite.com','/',async()=>new Response('x'.repeat(1048577))),/bounded audit size/);
});
test('robots group selection and longest matching allow rule avoid false findings',()=>{
 const rules='User-agent: OtherBot\nDisallow: /\nUser-agent: *\nDisallow: /private\nAllow: /private/public\n';
 assert.equal(robotsAllows(rules,'/blog'),true);assert.equal(robotsAllows(rules,'/private'),false);assert.equal(robotsAllows(rules,'/private/public/a'),true);
 const html=articleHtml({title:'A story',slug:'a-story',excerpt:'A description',body:'## Details\n[Templates](/templates)',published_at:'2026-10-01T00:00:00Z',language:'Tamil'});
 assert.match(html,/<html lang="ta">/);assert.match(html,/application\/ld\+json/);assert.match(html,/rel="canonical"/);assert.equal(inspectPage(html,'http://127.0.0.1:5173/blog/a-story',new Headers(),'<loc>http://127.0.0.1:5173/blog/a-story</loc>').filter(r=>!r[1]).length,0);
});
test('published blog snapshots, future drafts and cancelled schedules retain correct public visibility',async()=>{
 const fetchBefore=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify([{slug:'existing-article',title:'Original',excerpt:'Keep',body:'Original content',published_at:'2026-01-01T00:00:00Z'}]));
 try{
  const article={name:'Owner article',slug:'owner-article',excerpt:'Hello',body:'A meaningful owner article with enough content.',author:'FMI',language:'Hindi',status:'Published',publishAt:'2026-01-02T00:00:00Z'};
  await save('article','published',article);await save('article','published',{...article,status:'Draft',body:'SECRET DRAFT'},1);
  await save('article','private',{...article,slug:'private-article',status:'Draft'});
  await save('article','future',{...article,slug:'future-article',status:'Scheduled',publishAt:'2099-01-01T00:00:00Z'});
  await save('article','due',{...article,slug:'due-article',status:'Scheduled',publishAt:'2026-01-03T00:00:00Z'});
  const rows=await publicArticles();assert.equal(rows.find(r=>r.slug==='existing-article').body,'Original content');assert.equal(rows.find(r=>r.slug==='owner-article').body,article.body);assert(!rows.some(r=>r.slug==='private-article'||r.slug==='future-article'));assert(rows.some(r=>r.slug==='due-article'));
  const sitemap=await sitemapXml();assert.match(sitemap,/existing-article/);assert(!sitemap.includes('private-article'));assert(!sitemap.includes('future-article'));
  await promoteScheduled();assert.equal((await get('article','due')).status,'Published');assert.equal((await get('article','future')).status,'Scheduled');
  assert.equal(publishedRevision([{at:'2026-01-02T00:00:00Z',data:{status:'Draft'}},{at:'2026-01-01T00:00:00Z',data:{status:'Scheduled',publishAt:'2026-01-03T00:00:00Z'}}]),undefined);
 }finally{globalThis.fetch=fetchBefore;}
});
test('aggregate sources paginate beyond 1000 rows and dashboard calculations stay bounded',async()=>{
 const original=globalThis.fetch;const now=new Date().toISOString();const calls=[];
 globalThis.fetch=async value=>{const u=new URL(value),offset=Number(u.searchParams.get('offset')||0);calls.push(u.pathname+'|'+offset);const size=offset===0?1000:offset===1000?205:0;const rows=u.pathname.endsWith('/website_orders')?Array.from({length:size},(_,i)=>({id:'order-'+(offset+i),status:'captured',currency:'INR',purpose:'publish',amount:118,tax_paise:18,base_paise:100,captured_at:now,created_at:now})):u.pathname.endsWith('/analytics_events')?Array.from({length:size},(_,i)=>({id:offset+i,session_id:'s'+i,visitor_id:'v'+i,path:'/templates',event_type:'pageview',occurred_at:now,dwell_ms:0})):[];return new Response(JSON.stringify(rows))};
 try{const start=Date.now(),data=await snapshot(30,true);assert.equal(data.totals.gross,1205*118);assert.equal(data.totals.netSales,1205*100);assert.equal(data.totals.orders,1205);assert.equal(data.totals.views,1205);assert(calls.includes('/rest/v1/website_orders|1000'));assert(Date.now()-start<5000,'Repeated date calculations must not stall owner requests');}finally{globalThis.fetch=original;}
});
