import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
process.env.FMI_OWNER_LOCAL='1';
process.env.FMI_OWNER_DB=resolve('work/owner-tests/'+randomUUID()+'.sqlite');
process.env.FMI_OWNER_VAULT_FILE=resolve('work/owner-tests/'+randomUUID()+'.key');
delete process.env.VERCEL;
const {get,list,save,revisions}=await import('../server/owner/store.mjs');
const {passwordHash,verifyPassword,hashToken,cookie,revokeAll}=await import('../server/owner/auth.mjs');
const {default:handler}=await import('../api/owner.mjs');
const {organicSeries,forecast}=await import('../server/owner/reporting.mjs');
const {periodFinance,organicTrend,leadMetrics,orderedFunnel,aeoComparisons}=await import('../shared/owner-metrics.mjs');
const {searchDay,adsDay}=await import('../server/owner/sync.mjs');
const {safeMarkdown,articleHtml}=await import('../server/owner/content.mjs');
const {encrypt,decrypt}=await import('../server/owner/integrations.mjs');
const fixturePassword='local-test-'+randomUUID();
await save('identity','owner',{username:'AkayAdmin',passwordHash:await passwordHash(fixturePassword),actorId:randomUUID(),epoch:1});
let ownerCookie,csrf;
async function call(action,body,extra={}){const res={headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body},end(body){this.body=body}};await handler({url:'/api/owner?action='+action,method:body===undefined?'GET':'POST',body,headers:{host:'local.test',origin:'http://local.test',cookie:ownerCookie,'x-owner-csrf':csrf,...extra},socket:{remoteAddress:'fixture'}},res);return res;}
const report={sourceReportId:'grok-1',sourceRevision:1,date:'2026-10-20',timezone:'Asia/Kolkata',platform:'Instagram',account:'fmi',commentInquiries:5,dmInquiries:3,uniqueInquirers:6,cutoff:'2026-10-20T18:29:59Z',complete:true,collectedAt:'2026-10-20T19:00:00Z',posts:[{postId:'post-1',url:'https://example.org/post',commentInquiries:5,dmInquiries:3}]};
test('salted owner password, secure production cookie, authorization, CSRF and legacy rejection',async()=>{
 const identity=await get('identity','owner');assert.notEqual(identity.passwordHash,fixturePassword);assert(await verifyPassword(fixturePassword,identity.passwordHash));assert.notEqual(await passwordHash(fixturePassword),identity.passwordHash);
 assert.equal((await call('snapshot',undefined,{cookie:'fmi_akay=legacy; fmi_workspace=legacy'})).code,401);
 const login=await call('login',{username:'AkayAdmin',password:fixturePassword});assert.equal(login.code,200);csrf=login.body.csrf;ownerCookie=login.headers['Set-Cookie'].split(';')[0];assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict; Max-Age=43200/);
 assert.equal((await call('session')).body.authenticated,true);
 assert.equal((await call('save',{kind:'project',data:{name:'Forbidden'}},{'x-owner-csrf':''})).code,403);
 assert.equal((await call('save',{kind:'project',data:{name:'Forbidden'}},{origin:'https://other.test'})).code,403);
 process.env.FMI_OWNER_LOCAL='0';assert.match(cookie('token'),/Secure/);process.env.FMI_OWNER_LOCAL='1';
});
test('revision conflicts and persisted ticket moves cannot overwrite later work',async()=>{
 const created=await call('save',{kind:'project',data:{name:'Release'}});assert.equal(created.code,200);const project=created.body.record;
 const agent=(await call('save',{kind:'resource',data:{name:'Grok fixture',type:'Agent'}})).body.record;
 const ticket=(await call('save',{kind:'ticket',data:{name:'Review invitation',projectId:project.id,assigneeId:agent.id}})).body.record;
 const {id,revision,updatedAt,...data}=ticket;
 assert.equal((await call('save',{kind:'ticket',id,revision,data:{...data,status:'Review'}})).code,200);
 assert.equal((await call('save',{kind:'ticket',id,revision,data:{...data,status:'Done'}})).code,409);
 assert.equal((await get('ticket',id)).status,'Review');
});
test('financial invariants are atomic under competing partial payments and source retries',async()=>{
 const sale=(await call('save',{kind:'sale',data:{name:'Custom invite',product:'Custom invitation',date:'2026-10-20',total:118,tax:18,sourceId:'sale-1'}})).body.record;
 const responses=await Promise.all([1,2].map(i=>call('save',{kind:'receipt',data:{saleId:sale.id,date:'2026-10-20',amount:80,kind:'Payment',sourceId:'pay-'+i}})));
 assert.equal(responses.filter(r=>r.code===200).length,1);assert.equal(responses.filter(r=>r.code===400||r.code===409).length,1);
 const receipt=responses.find(r=>r.code===200).body.record;
 assert.equal((await call('save',{kind:'receipt',data:{saleId:sale.id,date:'2026-10-20',amount:1,kind:'Payment',sourceId:receipt.sourceId}})).code,409);
 assert.equal((await call('save',{kind:'receipt',data:{saleId:sale.id,date:'2026-10-20',amount:81,kind:'Refund',sourceId:'too-much'}})).code,400);
 const {id,revision,updatedAt,...data}=sale;assert.equal((await call('save',{kind:'sale',id,revision,data:{...data,total:200}})).code,409);
});
test('Grok snapshots are idempotent replacements; details and post breakdowns never increment totals',async()=>{
 const resource=(await list('resource'))[0],key=(await call('key-create',{label:'Organic fixture',resourceId:resource.id,scopes:['organic:write']})).body.token;
 const ingest=(body)=>call('ingest',body,{authorization:'Bearer '+key,cookie:''});
 const result=await ingest({kind:'daily',records:[report]});assert.equal(result.body.results[0].accepted,true);
 const retry=await ingest({kind:'daily',records:[report]});assert.equal(retry.body.results[0].duplicate,true);
 const stale=await ingest({kind:'daily',records:[{...report,sourceRevision:1,dmInquiries:9}]});assert.equal(stale.body.results[0].status,409);
 await ingest({kind:'daily',records:[{...report,sourceRevision:2,dmInquiries:4}]});
 const old=await ingest({kind:'daily',records:[report]});assert.equal(old.body.results[0].status,409);
 const lead={externalId:'lead-1',contactId:'person-1',account:'fmi',platform:'Instagram',channel:'dm',firstInquiryAt:'2026-10-20T10:00:00Z'};
 await ingest({kind:'lead',records:[lead]});await ingest({kind:'lead',records:[lead]});assert.equal((await list('lead')).length,1);
 const series=organicSeries(await list('daily'),1,[],Date.parse('2026-10-20T17:00:00Z'));assert.equal(series[0].inquiries,9);
 assert.equal((await ingest({kind:'article',records:[]})).code,403);
 const attempt=await ingest({kind:'lead',records:[{id:'other-owner-record',data:{...lead,externalId:'different'}}]});assert.equal(attempt.body.results[0].status,403);
 const dry=await ingest({kind:'daily',dryRun:true,records:[{...report,date:'2099-01-01'}]});assert.equal(dry.body.results[0].accepted,false);
 const keyRow=(await list('key'))[0];await call('key-revoke',{id:keyRow.id});assert.equal((await ingest({kind:'daily',records:[report]})).code,403);
});
test('agent ticket scope binds both assignee and assigned project; draft scope cannot publish',async()=>{
 const agent=(await list('resource'))[0],project=(await list('project'))[0],ticket=(await list('ticket'))[0];const key=(await call('key-create',{label:'Operations',resourceId:agent.id,scopes:['tickets:write','content:draft'],projectIds:[project.id]})).body.token;
 const {id,revision,updatedAt,...data}=ticket;
 let result=await call('ingest',{kind:'ticket',records:[{id,revision,data:{...data,status:'Done'}}]},{authorization:'Bearer '+key,cookie:''});assert.equal(result.body.results[0].accepted,true);
 result=await call('ingest',{kind:'ticket',records:[{id,revision:revision+1,data:{...data,assigneeId:'someone-else'}}]},{authorization:'Bearer '+key,cookie:''});assert.equal(result.body.results[0].status,403);
 result=await call('ingest',{kind:'article',records:[{name:'Test',slug:'test',body:'Article',author:'Grok',language:'English',status:'Published'}]},{authorization:'Bearer '+key,cookie:''});assert.equal(result.body.results[0].status,403);
});
test('missing, partial and zero inquiries are different, including IST overdue boundaries',()=>{
 const now=Date.parse('2026-10-22T04:31:00Z');let series=organicSeries([{...report,commentInquiries:0,dmInquiries:0}],3,[],now);
 assert.equal(series[0].status,'Complete');assert.equal(series[0].inquiries,0);assert.equal(series[1].status,'Missing');assert.equal(series[1].inquiries,null);assert(organicTrend(series,{},now).overdue);
 assert.equal(organicTrend(series,{},Date.parse('2026-10-22T04:29:00Z')).overdue,false);
 series=organicSeries([{...report,complete:false}],3,[],now);assert.equal(series[0].status,'Partial');assert.equal(forecast(series),null);
 const complete=Array.from({length:28},(_,i)=>({date:'2026-09-'+String(i+1).padStart(2,'0'),status:'Complete',inquiries:i<21?10:5}));assert.equal(forecast(complete).thirty,263);assert(organicTrend(complete,{},now).declineAlert);
});
test('finance separates capture/refund dates and allocates GST correctly across tiny partial payments',()=>{
 const sale={id:'sale',total:118,tax:18},receipts=Array.from({length:118},(_,i)=>({id:String(i).padStart(3,'0'),saleId:'sale',date:'2026-10-20',kind:'Payment',amount:1}));
 const result=periodFinance([], [sale],receipts,[],'2026-10-20','2026-10-20');assert.equal(result.tax,18);assert.equal(result.netSales,100);
 const orders=[{status:'refunded',amount:118,tax_paise:18,purpose:'publish',captured_at:'2026-10-19T10:00:00Z',refunded_at:'2026-10-20T10:00:00Z'},{status:'captured',amount:23482,tax_paise:3582,purpose:'publish',created_at:'2026-10-20'}];
 const day=periodFinance(orders,[],[],[],'2026-10-20','2026-10-20');assert.equal(day.gross,0);assert.equal(day.refunds,118);assert.equal(day.netSales,-100);
});
test('overlapping contact channels and order links do not inflate conversions or revenue',()=>{
 const leads=[{id:'a',platform:'Instagram',account:'fmi',contactId:'1',orderId:'o'},{id:'b',platform:'Instagram',account:'fmi',contactId:'1',orderId:'o'},{id:'c',platform:'Instagram',account:'fmi',contactId:'2'}];
 const result=leadMetrics(leads,[],[{id:'o',amount:118,tax_paise:18,status:'captured'}]);assert.equal(result.trackedContacts,2);assert.equal(result.linkedRevenue,100);assert.equal(result.conversion,50);
});
test('search paging preserves reporting semantics; totals are not sums of query rows',async()=>{
 const requests=[];const result=await searchDay({account:'sc-domain:findmyinvite.com'},'2026-10-20','fixture',async(url,options)=>{const b=JSON.parse(options.body);requests.push(b);if(b.dimensions.length===1)return {rows:[{clicks:500,impressions:1000,position:3}],metadata:{first_incomplete_date:'2026-10-20'}};return {rows:b.startRow===0?Array.from({length:25000},()=>({keys:['query','https://findmyinvite.com/','MOBILE','ind'],clicks:1,impressions:2,position:3})):[]};});
 assert.equal(result.complete,false);assert.equal(result.totals.clicks,500);assert.equal(requests.at(-1).startRow,25000);assert.equal(result.timezone,'America/Los_Angeles');
});
test('Meta paging uses an opaque cursor on the fixed provider host',async()=>{
 const calls=[];const result=await adsDay({provider:'Meta',account:'act_1',currency:'INR',timezone:'Asia/Kolkata'},'2026-10-20','fixture',async url=>{calls.push(String(url));return calls.length===1?{data:[{campaign_id:'1',campaign_name:'A',spend:'2.35',impressions:'10',clicks:'1'}],paging:{next:'http://127.0.0.1/private',cursors:{after:'opaque'}}}:{data:[]}});
 assert(calls.every(u=>u.startsWith('https://graph.facebook.com/')));assert.equal(result.totals.spend,235);assert.match(calls[1],/after=opaque/);
});
test('Markdown and article output cannot execute stored HTML; credentials are encrypted',async()=>{
 const html=safeMarkdown('<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="https://example.org">safe</a>');assert.doesNotMatch(html,/script|onerror|javascript:/);assert.match(html,/https:\/\/example.org/);
 const encrypted=encrypt({refresh_token:'fixture-secret'});assert(!encrypted.includes('fixture-secret'));assert.equal(decrypt(encrypted).refresh_token,'fixture-secret');
 const article=(await call('save',{kind:'article',data:{name:'Journal fixture',slug:'journal-fixture',body:'A thoughtful and detailed article for this isolated fixture only.',author:'FMI',language:'English',excerpt:'Preview',status:'Draft'}})).body.record;
 assert.equal((await revisions(article.id)).length,1);
 assert.match(articleHtml({title:'Example',slug:'example',body:'Text',excerpt:'Story',published_at:'2026-10-20T10:00:00Z'}),/rel="canonical"/);
});
test('sign out all sessions revokes existing cookies',async()=>{await revokeAll();assert.equal((await call('session')).body.authenticated,false);assert.equal((await call('save',{kind:'project',data:{name:'No'}})).code,401);});

test('applied captured payments count in revenue without inventing capture timestamps',async()=>{
 const {reportingDate,relativeOrderTime}=await import('../shared/order-display.mjs');
 const o={status:'captured',purpose:'publish',amount:118,tax_paise:18,created_at:'2026-11-03T23:00:00Z',applied_at:'2026-11-04T09:10:36Z'};
 const row={...o,reporting_at:reportingDate(o)};assert.equal(row.captured_at,undefined);const m=periodFinance([row],[],[],[],'2026-11-04','2026-11-04');assert.equal(m.netSales,100);assert.equal(m.gross,118);assert.equal(m.tax,18);assert.equal(m.orders,1);
 assert.equal(reportingDate({...o,status:'created'}),null);assert.equal(reportingDate({...o,applied_at:null}),null);assert.equal(reportingDate({...o,captured_at:'2026-11-04T09:09:00Z'}),'2026-11-04T09:09:00Z');
 const now=Date.parse('2026-11-04T12:00:00Z');assert.equal(relativeOrderTime('2026-11-04T11:58:00Z',now),'2mins ago');assert.equal(relativeOrderTime('2026-11-01T12:00:00Z',now),'3days ago');
 const {orderNumbers}=await import('../server/owner/store.mjs');const a=await orderNumbers(['stable-a','stable-b']);const b=await orderNumbers(['stable-b','stable-a','stable-c']);assert.equal(a['stable-a'],b['stable-a']);assert.equal(a['stable-b'],b['stable-b']);assert.equal(b['stable-c'],a['stable-b']+1);
});
