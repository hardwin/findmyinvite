import {inOwnerWindow} from './owner-period.mjs';

export function templatePerformance(templates,versions,events,orders,range,sources={},filtered=false) {
 const versionsById=new Map(versions.map(v=>[v.id,v.template_id]));
 const byTemplate=new Map();
 for(const event of events){
  if(!inOwnerWindow(event.at,range))continue;
  const id=versionsById.get(event.templateId)||event.templateId;
  if(!byTemplate.has(id))byTemplate.set(id,[]);
  byTemplate.get(id).push(event);
 }
 return templates.map(({id,kind,name,templateCode})=>{
  const list=byTemplate.get(id)||[];
  const available=key=>sources[key]?.status!=='Unavailable';
  const eventsKnown=available('records.product-event')&&(kind==='video'||available('versions'));
  const paymentsKnown=available('records.order-date')&&(kind==='video'?available('videoOrders'):available('orders')&&available('versions'))
   &&(!filtered||available('records.order-context'));
  const payments=orders.filter(o=>['captured','refunded'].includes(o.status)
   && (kind==='video'?o.template_id===id:versionsById.get(o.template_version_id)===id));
  const captured=payments.filter(o=>inOwnerWindow(o.reporting_at,range));
  const refunded=payments.filter(o=>o.status==='refunded'&&inOwnerWindow(o.refunded_at,range));
  const net=rows=>rows.reduce((sum,row)=>sum+row.amount-row.tax_paise,0);
  const count=type=>eventsKnown?new Set(list.filter(e=>e.type===type).map(e=>e.session)).size:null;
  const paidSessions=new Set(captured.map(o=>o.analyticsSession).filter(Boolean));
  const abandoned=list.filter(e=>e.type==='form_start'&&!paidSessions.has(e.session)&&Date.parse(e.at)<range.untilMs-86400000);
  return {id,kind,templateCode,name,previews:count('preview'),starts:count('form_start'),checkouts:count('checkout'),
   purchases:paymentsKnown?captured.filter(o=>o.purpose!=='renew').length:null,renewals:paymentsKnown?captured.filter(o=>o.purpose==='renew').length:null,
   revenue:!paymentsKnown||[...captured,...refunded].some(o=>o.tax_paise==null)?null:net(captured)-net(refunded),
   abandonedStarts:paymentsKnown&&eventsKnown&&available('records.order-context')?new Set(abandoned.map(e=>e.session)).size:null,errors:count('error')};
 });
}
