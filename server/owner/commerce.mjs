import {videoNames} from '../catalog-identity.mjs';
import {identityFields} from '../../shared/catalog-identity.mjs';
import {reportingDate} from '../../shared/order-display.mjs';

export function reportingCatalog(source) {
 const identities=new Map(source.identities.rows.map(row=>[row.kind+':'+row.template_id,row]));
 const decorate=(kind,row)=>({...row,kind,...identityFields(identities.get(kind+':'+row.id))});
 const websites=source.templates.rows.map(row=>decorate('website',row));
 const names=videoNames(source.videoCatalog.rows);
 // Keep retired templates visible in historical sales, even if only their ID survives.
 for(const row of source.videoOrders.rows)if(!names.has(row.template_id))names.set(row.template_id,row.template_id);
 const videos=[...names].map(([id,name])=>decorate('video',{id,name}));
 return {websites,designs:[...websites,...videos]};
}

export function commerceOrders(source,records,designs) {
 const templates=new Map(designs.map(t=>[t.kind+':'+t.id,t]));
 const versions=new Map(source.versions.rows.map(v=>[v.id,v.template_id]));
 const evidence=new Map(records['order-date'].map(r=>[r.orderId,r]));
 const contexts=new Map(records['order-context'].map(r=>[r.id,r]));
 const rows=[
  ...source.orders.rows,
  ...source.legacyPayments.rows.map(p=>({...p,owner_id:p.host,purpose:p.sku?.startsWith('video')?'video':'legacy website',product:p.sku||'Legacy sale'})),
  ...source.videoOrders.rows.map(o=>({...o,amount:o.total_paise,purpose:'video'})),
 ];
 return rows.map(o=>{
  const diy=!!o.template_id&&o.purpose==='video';
  const template=templates.get(diy?'video:'+o.template_id:'website:'+versions.get(o.template_version_id));
  const date=evidence.get(o.id),context=contexts.get(o.id);
  const capturedAt=o.captured_at||date?.capturedAt||null;
  const confirmed=['captured','refunded'].includes(o.status);
  const reportAt=reportingDate({...o,captured_at:capturedAt})||(confirmed&&diy?o.unlocked_at:null);
  const basis=capturedAt?'Verified capture time':!reportAt?'Date not verified':diy?'Video unlocked after payment confirmation':'Payment applied to invitation';
  return {...o,templateCode:template?.templateCode,productName:template?.name||o.product||'Wedding website',
   sku:template?.id||o.sku||'website',reporting_at:reportAt||null,reporting_basis:basis,captured_at:capturedAt,
   refunded_at:o.refunded_at||date?.refundedAt||null,tax_paise:o.tax_paise??date?.taxPaise??null,
   analyticsSession:context?.session,language:context?.language,device:context?.device,source:context?.attribution?.source||'Unattributed'};
 });
}
