import {HttpError} from '../core.mjs';
import {inOwnerWindow,readOwnerPeriod} from '../../shared/owner-period.mjs';
import {snapshot} from './reporting.mjs';

export async function salesReport(params) {
 const view=params.get('view')||'captures';
 if(!['captures','templates'].includes(view))throw new HttpError(400,'Choose captures or templates.');
 const selection=readOwnerPeriod(params);
 const data=view==='captures'
  ?await snapshot(selection,true,'reports','orders')
  :await snapshot(selection,true,'template-insights');
 // Consumers can retry an incomplete window without recording a false zero or moving their cursor.
 const required=['orders','legacyPayments','videoOrders','videoCatalog','templates','versions','identities','records.order-date'];
 if(view==='templates')required.push('records.product-event','records.order-context');
 const incomplete=required.filter(key=>data.sources[key]?.status!=='Connected');
 if(incomplete.length)throw new HttpError(503,'Retry this report. Incomplete sources: '+incomplete.join(', '));
 const result={
  range:{start:data.range.start,end:data.range.end,timezone:'Asia/Kolkata'},
  readAt:data.generatedAt,
  oldestSourceReadAt:required.map(key=>data.sources[key].updatedAt).sort()[0]
 };
 if(view==='templates')return {...result,currency:'INR',amountUnit:'paise',templates:data.templateInsights};
 const sales=[...data.orders,...data.foreignOrders].filter(o=>
  ['captured','refunded'].includes(o.status)&&inOwnerWindow(o.reporting_at,data.range));
 return {...result,amountUnit:'minor currency units',sales:sales.map(o=>({
  orderId:o.id,templateCode:o.templateCode||null,productName:o.productName,sku:o.sku,
  purpose:o.purpose,status:o.status,amount:o.amount,tax:o.tax_paise,currency:o.currency,
  reportedAt:o.reporting_at,dateBasis:o.reporting_basis
 })).sort((a,b)=>Date.parse(b.reportedAt)-Date.parse(a.reportedAt)||a.orderId.localeCompare(b.orderId))};
}
