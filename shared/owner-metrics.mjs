export const groupRows=(rows,key)=>rows.reduce((groups,row)=>{(groups[key(row)]||=[]).push(row);return groups;},Object.create(null));
const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
export const businessDay=value=>dayFormatter.format(new Date(value));
export function receiptTaxes(sales,receipts){
 const balances=new Map();return [...receipts].sort((a,b)=>(a.date+'|'+(a.updatedAt||'')+'|'+(a.id||'')).localeCompare(b.date+'|'+(b.updatedAt||'')+'|'+(b.id||''))).map(r=>{const sale=sales.find(s=>s.id===r.saleId),old=balances.get(r.saleId)||0,next=old+r.amount*(r.kind==='Refund'?-1:1);balances.set(r.saleId,next);const allocate=paid=>sale?.total?Number((BigInt(paid)*BigInt(sale.tax)*2n+BigInt(sale.total))/(2n*BigInt(sale.total))):0;return {...r,allocatedTax:allocate(next)-allocate(old)};});
}
export function organicTrend(series,preferences={},now=Date.now()){
 const prior=series.filter(d=>d.date<businessDay(now)).slice(-14),current=prior.slice(-7),previous=prior.slice(0,7);
 const comparable=prior.length===14&&prior.every(d=>d.status==='Complete');
 const total=rows=>rows.reduce((n,r)=>n+(r.inquiries||0),0),a=total(current),b=total(previous);
 let zeroStreak=0;for(const d of [...series.filter(d=>d.date<businessDay(now))].reverse()){if(d.status==='Complete'&&d.inquiries===0)zeroStreak++;else break;}
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23'}).format(now));
 const yesterday=series.find(d=>d.date===businessDay(now-86400000));
 return {comparable,current:comparable?a:null,previous:comparable?b:null,change:comparable?a-b:null,percent:comparable&&b?Math.round((a-b)/b*100):null,zeroStreak,zeroAlert:zeroStreak>=(preferences.zeroDays||3),declineAlert:comparable&&b>=10&&(b-a)/b*100>=(preferences.leadDropPercent||30),overdue:hour>=10&&!!yesterday?.expected&&yesterday.status!=='Complete'};
}
export function periodFinance(orders,sales,receipts,expenses,start,end){
 const within=date=>date&&businessDay(date)>=start&&businessDay(date)<=end;
 const captured=orders.filter(o=>['captured','refunded'].includes(o.status)&&within(o.captured_at||o.reporting_at));
 const refunded=orders.filter(o=>o.status==='refunded'&&within(o.refunded_at));
 const paid=receiptTaxes(sales,receipts).filter(r=>r.date>=start&&r.date<=end);
 const gross=captured.reduce((n,o)=>n+o.amount,0)+paid.filter(r=>r.kind==='Payment').reduce((n,r)=>n+r.amount,0);
 const refunds=refunded.reduce((n,o)=>n+o.amount,0)+paid.filter(r=>r.kind==='Refund').reduce((n,r)=>n+r.amount,0);
 const tax=captured.reduce((n,o)=>n+o.tax_paise,0)-refunded.reduce((n,o)=>n+o.tax_paise,0)+paid.reduce((n,r)=>n+r.allocatedTax,0);
 const costs=expenses.filter(e=>e.date>=start&&e.date<=end).reduce((n,e)=>n+e.amount,0);
 const taxUnknown=[...captured,...refunded].some(o=>o.tax_paise==null);
 return {gross,refunds,tax:taxUnknown?null:tax,netSales:taxUnknown?null:gross-refunds-tax,expenses:costs,result:taxUnknown?null:gross-refunds-tax-costs,orders:captured.filter(o=>o.purpose!=='renew').length+new Set(receipts.filter(r=>r.kind==='Payment'&&r.date>=start&&r.date<=end&&!receipts.some(p=>p.saleId===r.saleId&&p.kind==='Payment'&&p.date<start)).map(r=>r.saleId)).size,renewals:captured.filter(o=>o.purpose==='renew').length,videoSales:captured.filter(o=>o.purpose==='video').length,taxUnknown};
}
export function orderedFunnel(events,orders){
 const groups=groupRows(events,e=>e.session);const names=['template_selected','preview','form_start','checkout'];const counts=names.map(()=>0);let purchases=0;
 for(const rows of Object.values(groups)){
  rows.sort((a,b)=>a.at.localeCompare(b.at));let at=0;
  for(const row of rows){if(row.type===names[at]){counts[at]++;at++;}if(at===4)break;}
  if(at===4&&orders.some(o=>o.analyticsSession===rows[0].session&&['captured','refunded'].includes(o.status)))purchases++;
 }
 return [...names.map((stage,i)=>({stage,sessions:counts[i]})),{stage:'purchase_confirmed',sessions:purchases}];
}
export function leadMetrics(leads,merges,orders){
 const active=leads.filter(l=>!merges.some(m=>m.id===l.id));
 const contacts=new Map();for(const lead of active){const key=lead.platform+'|'+lead.account+'|'+lead.contactId;const list=contacts.get(key)||[];list.push(lead);contacts.set(key,list);}
 const matchedOrderIds=new Set(active.map(l=>l.orderId).filter(Boolean)),matched=orders.filter(o=>matchedOrderIds.has(o.id)&&['captured','refunded'].includes(o.status));
 const converted=[...contacts.values()].filter(rows=>rows.some(l=>matched.some(o=>o.id===l.orderId))).length;
 const responses=active.filter(l=>l.firstResponseAt).map(l=>(Date.parse(l.firstResponseAt)-Date.parse(l.firstInquiryAt))/60000);
 return {records:active.length,trackedContacts:contacts.size,linkedOrders:matched.length,convertedContacts:converted,conversion:contacts.size?converted/contacts.size*100:null,linkedRevenue:matched.some(o=>o.status!=='refunded'&&o.tax_paise==null)?null:matched.reduce((n,o)=>n+(o.status==='refunded'?0:o.amount-o.tax_paise),0),responseMinutes:responses.length?responses.reduce((a,b)=>a+b,0)/responses.length:null,responseCoverage:responses.length};
}
export function aeoComparisons(observations,benchmarks){
 const rows=observations.filter(o=>o.kind==='AEO'&&o.benchmarkId&&benchmarks.some(b=>b.id===o.benchmarkId&&b.locale===o.locale));
 const groups=groupRows(rows,o=>o.engine+'|'+o.surface+'|'+o.locale+'|'+businessDay(o.observedAt));
 return Object.entries(groups).map(([key,items])=>{const latest=[...new Map(items.sort((a,b)=>a.observedAt.localeCompare(b.observedAt)).map(o=>[o.benchmarkId,o])).values()];const [engine,surface,locale,date]=key.split('|'),expected=benchmarks.filter(b=>b.locale===locale).length,citations=latest.filter(o=>o.citedUrl&&new URL(o.citedUrl).hostname==='findmyinvite.com').length;return {date,engine,surface,locale,observed:latest.length,expected,coverage:expected?Math.round(latest.length/expected*100)+'%':'Unknown',citationRate:latest.length?Math.round(citations/latest.length*100)+'%':'—',comparable:expected>0&&latest.length===expected&&latest.every(o=>benchmarks.some(b=>b.id===o.benchmarkId&&(b.revision||1)===(o.benchmarkRevision||1)))?'Full benchmark':'Partial benchmark'};});
}
