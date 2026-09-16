export function payloadFrom(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!Array.isArray(body.items))return null;
 const counts=body.status_counts&&typeof body.status_counts==='object'&&!Array.isArray(body.status_counts)?body.status_counts:{};
 const competitors=Array.isArray(body.competitors)?body.competitors.filter(row=>row&&typeof row==='object'&&typeof row.id==='string'):[];
 return {
  items:body.items.filter(row=>row&&typeof row==='object'&&typeof row.id==='string').map(item=>({
   ...item,
   reason:item.reason||'',
   batch:item.batch||'',
   category:item.category||'',
   catalogue_urls:Array.isArray(item.catalogue_urls)?item.catalogue_urls.filter(url=>typeof url==='string'):[],
   competitor_name:item.competitor_name||''
  })),
  total:Number(body.total)||0,
  status_counts:{
   proposed:Number(counts.proposed)||0,
   approved:Number(counts.approved)||0,
   rejected:Number(counts.rejected)||0,
   all:Number(counts.all)||0
  },
  competitors:competitors.map(row=>({id:row.id,name:row.name||row.id})),
  batches:Array.isArray(body.batches)?body.batches.map(batch=>String(batch??'')):[]
 };
}
