import {groupRows,organicTrend,periodFinance,orderedFunnel,leadMetrics,aeoComparisons} from './metrics.mjs';
import {sectionData,readTables,sourceMetadata} from './section-data.mjs';
import {reportingCatalog,commerceOrders} from './commerce.mjs';
import {templatePerformance} from '../../shared/template-performance.mjs';
import {resolveOwnerPeriod,inOwnerWindow,orderPeriodActivity,sameTimeSales} from '../../shared/owner-period.mjs';
import {orderNumbers} from './store.mjs';
const istDayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
export const dayOf=value=>istDayFormatter.format(new Date(value));
export function organicSeries(reports,days,accounts=[],now=Date.now(),asOf=now){
 const expected=accounts.length?accounts:[...new Map(reports.map(r=>[r.platform+'|'+r.account,{platform:r.platform,account:r.account}])).values()];
 return Array.from({length:days},(_,i)=>{const date=dayOf(now-(days-1-i)*86400000),rows=reports.filter(r=>r.date===date&&expected.some(a=>a.platform===r.platform&&a.account===r.account));const complete=expected.length>0&&expected.every(a=>rows.some(r=>r.platform===a.platform&&r.account===a.account&&r.complete));return {date,comments:rows.length?rows.reduce((n,r)=>n+r.commentInquiries,0):null,dms:rows.length?rows.reduce((n,r)=>n+r.dmInquiries,0):null,inquiries:rows.length?rows.reduce((n,r)=>n+r.commentInquiries+r.dmInquiries,0):null,status:complete?'Complete':date===dayOf(asOf)&&rows.length?'So far':rows.length?'Partial':'Missing',reports:rows.length,expected:expected.length};});
}
export function finance(orders,sales,receipts,expenses){
 const captured=orders.filter(o=>o.status==='captured'),refunded=orders.filter(o=>o.status==='refunded');
 const gross=[...captured,...refunded].reduce((n,o)=>n+Number(o.amount||0),0)+receipts.filter(r=>r.kind==='Payment').reduce((n,r)=>n+r.amount,0);
 const refunds=refunded.reduce((n,o)=>n+Number(o.amount||0),0)+receipts.filter(r=>r.kind==='Refund').reduce((n,r)=>n+r.amount,0);
 const tax=captured.reduce((n,o)=>n+Number(o.tax_paise||0),0)+receipts.reduce((n,r)=>{const sale=sales.find(s=>s.id===r.saleId);return n+(sale?.total?Math.round(r.amount*sale.tax/sale.total)*(r.kind==='Refund'?-1:1):0);},0);
 const costs=expenses.reduce((n,e)=>n+e.amount,0);return {gross,refunds,tax,netSales:gross-refunds-tax,expenses:costs,result:gross-refunds-tax-costs,orders:captured.filter(o=>o.purpose==='publish').length,renewals:captured.filter(o=>o.purpose==='renew').length};
}
export function forecast(series){const complete=series.slice(-28).filter(s=>s.status==='Complete'&&s.date<dayOf(Date.now()));if(complete.length<14)return null;const average=complete.reduce((n,s)=>n+(s.inquiries||0),0)/complete.length;return {days:complete.length,seven:Math.round(average*7),thirty:Math.round(average*30),low:Math.round(average*30*.8),high:Math.round(average*30*1.2)};}
const definitions={
 identities:'catalog_identity?select=kind,template_id,template_number,micro_description&order=template_number',
 orders:'website_orders?select=id,invitation_id,owner_id,template_version_id,purpose,base_paise,tax_paise,amount,currency,status,applied_at,created_at,captured_at,refunded_at&order=id',
 videoOrders:'video_invitation_orders?select=id,owner_id,template_id,free_access,total_paise,base_paise,tax_paise,currency,status,created_at,unlocked_at,refunded_at&order=id',
 videoCatalog:'video_templates?select=id,customer_name,name&order=id',
 legacyPayments:'payments?select=id,host,status,amount,currency,sku,slug,created_at,captured_at,refunded_at,tax_paise&order=id',
 templates:'template_catalog?generation=eq.2&select=id,name,description,thumbnail,published,isactive,current_version_id&order=id',
 invitations:'invitations?template_version_id=not.is.null&select=id,slug,owner_id,template_version_id,published,first_published_at,expires_at,deleted_at,created_at&order=id',
 versions:'template_versions?select=id,template_id,revision,approved_at&order=id',
 clients:'client_jobs?select=id,couple,client_name,status,created_at&order=id',
 jobs:'assembly_jobs?select=id,status,phase,percent,error,created_at,spend&order=id',
 traffic:'analytics_events?select=id,occurred_at,session_id,visitor_id,path,event_type,dwell_ms,referrer,viewport&order=id',
 legacyCosts:'website_costs?select=month,amount_paise,note&order=month',
};
export const sources=(force=false,keys=Object.keys(definitions))=>readTables(definitions,keys,null,force);

export async function snapshot(selection,force=false,section='all',report='orders'){
 const now=Date.now(),range=resolveOwnerPeriod(selection,now),{start:cutoff,end,days}=range;
 const {source,records,logs,health}=await sectionData(definitions,section,report,range,force);
 const trafficAvailable=[source.traffic,source.invitations].every(s=>['Connected','Stale'].includes(s.status));
 const guestPaths=new Set(source.invitations.rows.map(r=>'/'+r.slug));
 const allTraffic=source.traffic.rows.filter(r=>inOwnerWindow(r.occurred_at,range)&&!/^\/(akay|cms|manager|assembly|proof|workspace)(\/|$)/.test(r.path));
 const traffic=trafficAvailable?allTraffic.filter(r=>!guestPaths.has(r.path)&&!r.path.startsWith('/invite/')):[];
 if(section==='visitors'){
  return {generatedAt:new Date().toISOString(),sources:sourceMetadata(health),totals:{visitors:trafficAvailable?new Set(traffic.map(r=>r.visitor_id)).size:null}};
 }
 const {websites:templates,designs}=reportingCatalog(source);
 const prefs=records.preferences[0]||{};
 const combinedOrders=commerceOrders(source,records,designs);
 const showOrderNumbers=['all','sales','finance','overview','customers'].includes(section);
 let numbers={};
 if(showOrderNumbers&&combinedOrders.length){
  const ids=[...combinedOrders].sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')||a.id.localeCompare(b.id)).map(o=>o.id);
  const signal=AbortSignal.timeout(5000);
  try{
   numbers=await orderNumbers(ids,signal);
   health.orderNumbers={rows:ids,status:'Connected',updatedAt:new Date().toISOString()};
  }catch{
   health.orderNumbers={rows:[],status:'Unavailable',updatedAt:null,error:signal.aborted?'Timed out after 5 seconds. Showing original order IDs.':'Read failed. Showing original order IDs.'};
  }
 }
 const allOrders=combinedOrders.filter(o=>o.currency==='INR').map(o=>({...o,orderNumber:numbers[o.id]}));
 const undated=allOrders.filter(o=>['captured','refunded'].includes(o.status)&&(!o.reporting_at||o.tax_paise==null||o.status==='refunded'&&!o.refunded_at));
 const orders=allOrders.flatMap(o=>{const activity=orderPeriodActivity(o,range);return activity?[{...o,...activity}]:[];});
 const receipts=records.receipt,expenses=[...records.expense];
 for(const report of records['ad-day'].filter(a=>a.currency==='INR')){const sourceId='ads:'+report.provider+':'+report.account+':'+report.date;if(!expenses.some(e=>e.sourceId===sourceId))expenses.push({id:sourceId,sourceId,date:report.date,amount:report.totals.spend||0,name:report.provider+' reported spend',category:'Advertising',provenance:report.provenance});}
 for(const run of [...records.run.map(r=>({...r,costKind:'run'})),...records.time.map(r=>({...r,costKind:'time',occurredAt:r.date+'T12:00:00+05:30'}))]){const sourceId=run.costSourceId||run.costKind+':'+run.id;if(run.cost&&!expenses.some(e=>e.sourceId===sourceId))expenses.push({id:sourceId,sourceId,date:dayOf(run.occurredAt),amount:run.cost,name:run.name,category:'Production',provenance:'Agent report'});}
 const money=periodFinance(allOrders,records.sale,receipts,expenses,cutoff,end,range.untilMs);
 const previous=periodFinance(allOrders,records.sale,receipts,expenses,range.previousStart,range.previousEnd);
 const paymentKeys=['orders','legacyPayments','videoOrders','records.order-date'];
 const unavailable=key=>health[key]?.status==='Unavailable';
 const missingOnline=paymentKeys.some(unavailable);
 const missingPayments=missingOnline||['records.receipt','records.sale'].some(unavailable);
 const missingCosts=['records.expense','records.ad-day','records.run','records.time'].some(unavailable);
 for(const totals of [money,previous]){
  if(missingPayments)for(const key of ['gross','refunds','tax','netSales','result','orders','renewals','videoSales'])totals[key]=null;
  if(missingCosts)totals.expenses=totals.result=null;
 }
 const paymentReads=paymentKeys.map(key=>health[key]?.updatedAt).filter(Boolean);
 const through=Math.min(range.untilMs,...paymentReads.map(value=>Date.parse(value)+1));
 const intraday=!missingOnline&&paymentReads.length===paymentKeys.length&&through>range.fromMs?sameTimeSales(allOrders,{...range,untilMs:through}):null;
 const organic=organicSeries(records.daily,Math.max(28,days),prefs.organicAccounts||[],range.untilMs-1,now);
 const viewsByDay=new Map();
 for(const event of traffic){if(event.event_type==='pageview'){const date=dayOf(event.occurred_at);viewsByDay.set(date,(viewsByDay.get(date)||0)+1);}}
 const daily=organic.slice(-days).map(d=>{const totals=periodFinance(allOrders,records.sale,receipts,expenses,d.date,d.date,range.untilMs);return {...d,label:d.date.slice(5),revenue:missingPayments?null:totals.netSales,expenses:missingCosts?null:totals.expenses,purchases:missingPayments?null:totals.orders,visits:!trafficAvailable?null:(viewsByDay.get(d.date)||0)};});
 const reported=organic.slice(-days),totals={...money,visitors:trafficAvailable?new Set(traffic.map(r=>r.visitor_id)).size:null,sessions:trafficAvailable?new Set(traffic.map(r=>r.session_id)).size:null,views:trafficAvailable?traffic.filter(r=>r.event_type==='pageview').length:null,guestViews:trafficAvailable?allTraffic.filter(r=>guestPaths.has(r.path)||r.path.startsWith('/invite/')).length:null,inquiries:reported.some(d=>d.inquiries!==null)?reported.reduce((n,d)=>n+(d.inquiries||0),0):null};
 const events=records['product-event'].filter(e=>inOwnerWindow(e.at,range));
 const templateInsights=['all','template-insights'].includes(section)?templatePerformance(designs,source.versions.rows,events,orders,range,health):[];
 const funnel=orderedFunnel(events,allOrders.filter(o=>inOwnerWindow(o.reporting_at,range))).map(row=>{
  const unknown=unavailable('records.product-event')||row.stage==='purchase_confirmed'&&(missingOnline||unavailable('records.order-context'));
  return unknown?{...row,sessions:null}:row;
 });
 const knownDates=['all','insights'].includes(section)?[...allOrders.filter(o=>o.reporting_at).map(o=>dayOf(o.reporting_at)),...receipts.map(r=>r.date)].sort():[],historyDays=knownDates.length?Math.min(28,Math.floor((now-Date.parse(knownDates[0]+'T00:00:00+05:30'))/86400000)):0;
 const revenueForecast=historyDays>=14&&!undated.length&&!missingPayments&&!missingCosts&&source.orders.status==='Connected'&&source.legacyPayments.status==='Connected'&&source.videoOrders?.status==='Connected'?(()=>{const historyStart=dayOf(now-historyDays*86400000),historyEnd=dayOf(now-86400000),m=periodFinance(allOrders,records.sale,receipts,expenses,historyStart,historyEnd);const revenue=Math.round(m.netSales/historyDays*30),orders=Math.round((m.orders+m.renewals)/historyDays*30);return {days:historyDays,revenue,orders,low:Math.min(Math.round(revenue*.8),Math.round(revenue*1.2)),high:Math.max(Math.round(revenue*.8),Math.round(revenue*1.2))};})():null;
 const byPath=Object.entries(groupRows(traffic,r=>r.path)).map(([path,rows])=>({path,visits:rows.filter(r=>r.event_type==='pageview').length,engagementMinutes:Math.round(rows.reduce((n,r)=>n+r.dwell_ms,0)/60000)}));
 const journeys=Object.entries(groupRows(traffic,r=>r.session_id)).map(([id,rows])=>({id,first:rows.reduce((a,b)=>a.occurred_at<b.occurred_at?a:b).occurred_at,steps:rows.filter(r=>r.event_type==='pageview').sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)).map(r=>r.path).join(' → ')}));
 const firstVisits=Object.values(groupRows(traffic.filter(r=>r.event_type==='pageview'),r=>r.session_id)).map(rows=>rows.reduce((a,b)=>a.occurred_at<b.occurred_at?a:b));
 const trafficDimensions=Object.entries(groupRows(firstVisits,r=>{try{const u=new URL(r.referrer);return u.hostname==='findmyinvite.com'?'Internal / unknown':u.hostname}catch{return 'Direct / unknown'}})).map(([source,rows])=>({source,sessions:rows.length}));
 const devices=Object.entries(groupRows(firstVisits,r=>{const width=Number(String(r.viewport).split('x')[0]);return !width?'Unknown':width<600?'Mobile':width<1000?'Tablet':'Desktop'})).map(([device,rows])=>({device,sessions:rows.length}));
 const landings=Object.entries(groupRows(firstVisits,r=>r.path)).map(([path,rows])=>({path,sessions:rows.length}));
 const activityHours=Object.entries(groupRows(traffic.filter(r=>r.event_type==='pageview'),r=>{const local=new Date(Date.parse(r.occurred_at)+330*60000).toISOString();return local.slice(0,10)+' '+local.slice(11,13)+':00'})).map(([hour,rows])=>({hour,pageviews:rows.length}));
 const customers=['all','customers'].includes(section)?[...new Set([...allOrders.map(o=>o.owner_id),...records.sale.map(s=>s.customer)].filter(Boolean))].map(id=>({id,name:records.customer.find(c=>c.customerId===id)?.name||id,notes:records.customer.find(c=>c.customerId===id)?.notes||'',orders:allOrders.filter(o=>o.owner_id===id&&o.status==='captured').length,invitations:source.invitations.rows.filter(i=>i.owner_id===id).length,linkedLeads:records.lead.filter(l=>l.customerId===id).length,revenue:allOrders.some(o=>o.owner_id===id&&o.status==='captured'&&o.tax_paise==null)?null:allOrders.filter(o=>o.owner_id===id&&o.status==='captured').reduce((n,o)=>n+o.amount-o.tax_paise,0)+periodFinance([],records.sale,receipts.filter(r=>records.sale.some(s=>s.id===r.saleId&&s.customer===id)),[],'1900-01-01',dayOf(now)).netSales})):[];
 return {days,range,intraday,generatedAt:new Date().toISOString(),sources:sourceMetadata(health),totals,previous,foreignOrders:combinedOrders.filter(o=>o.currency!=='INR'&&orderPeriodActivity(o,range)),revenueForecast,daily,forecast:forecast(organic),organicTrend:organicTrend(organic,prefs),leadMetrics:leadMetrics(records.lead,records['lead-merge'],allOrders),aeo:aeoComparisons(records.observation,records.benchmark),funnel,templateInsights,customers,journeys,byPath,trafficDimensions,devices,landings,activityHours,undated,expenses,records,orders,templates,versions:source.versions.rows,invitations:source.invitations.rows,clients:source.clients.rows,jobs:source.jobs.rows,traffic:traffic.slice(-2000).reverse(),legacyCosts:source.legacyCosts.rows,audit:logs.filter(r=>inOwnerWindow(r.at,range)),limitations:['Historical payments without capture dates are listed for reconciliation and excluded from dated revenue.','Operating result includes recorded costs only.','Anonymous traffic, guest visits and inquiries are separate populations.']};
}
