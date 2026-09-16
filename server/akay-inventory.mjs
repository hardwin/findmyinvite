import {HttpError,configured} from './core.mjs';
const relations=new Set(['direct','indirect']);
const codes=new Set(['classic','royal']);
const statuses=new Set(['queued','in_progress','shipped']);
const slug=/^[a-z0-9_][a-z0-9_-]{0,47}$/i;
function token(value,max=80){return String(value||'').trim().slice(0,max).replace(/[*(),]/g,'');}
function like(value){return '*'+value.replace(/%/g,'')+'*';}
function page(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 return {
  limit:Math.min(50,Math.max(1,Number(q.get('limit')||25)||25)),
  offset:Math.min(5000,Math.max(0,Number(q.get('offset')||0)||0)),
  q:token(q.get('q'))
 };
}
export function httpUrl(value){
 if(typeof value!=='string')return '';
 const text=value.trim();
 return /^https?:\/\//i.test(text)?text:'';
}
export function parseCompetitorQuery(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 const category=token(q.get('category'),40);
 const relation=q.get('relation')||'';
 if(relation&&!relations.has(relation))throw new HttpError(400,'Unknown relation filter.');
 if(category&&!slug.test(category))throw new HttpError(400,'Unknown category filter.');
 return {...page(url),category,relation,direct:q.get('direct')==='1'};
}
export function parseUpcomingQuery(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 const source=token(q.get('source'),40).toLowerCase();
 const intended_use=token(q.get('intended_use'),40);
 const design_code=(q.get('design_code')||'').toLowerCase();
 const status=q.get('status')||'';
 if(source&&!slug.test(source))throw new HttpError(400,'Unknown source filter.');
 if(intended_use&&!slug.test(intended_use))throw new HttpError(400,'Unknown intended_use filter.');
 if(design_code&&!codes.has(design_code))throw new HttpError(400,'Unknown design_code filter.');
 if(status&&status!=='all'&&!statuses.has(status))throw new HttpError(400,'Unknown status filter.');
 return {...page(url),source,intended_use,design_code,status:status==='all'?'':status};
}
export function relationBadge(row){
 if(row?.is_direct||row?.relation==='direct')return 'direct';
 if(row?.relation==='indirect')return 'indirect';
 return '';
}
export function mapCompetitor(row,counts={}){
 const urls=Array.isArray(row.catalogue_urls)?row.catalogue_urls.map(httpUrl).filter(Boolean):[];
 return {
  id:row.id,name:row.name||'',slug:row.slug||'',homepage:httpUrl(row.homepage),catalogue_urls:urls,
  catalogue_count:urls.length,category:row.category||'',geography:row.geography||'',
  price_notes:row.price_notes||'',product_type:row.product_type||'',notes:row.notes||'',
  is_direct:Boolean(row.is_direct)||row.relation==='direct',relation:row.relation||null,
  badge:relationBadge(row),created_at:row.created_at,updated_at:row.updated_at,
  shortlist_counts:{
   proposed:Number(counts.proposed)||0,
   approved:Number(counts.approved)||0,
   rejected:Number(counts.rejected)||0
  }
 };
}
export function mapUpcoming(row){
 return {
  id:row.id,name:row.name||'',slug:row.slug||'',source_competitor:row.source_competitor||'',
  source_url:httpUrl(row.source_url),design_code:row.design_code||'',category_hint:row.category_hint||'',
  intended_use:row.intended_use||'',status:row.status||'',notes:row.notes||'',
  created_at:row.created_at,updated_at:row.updated_at
 };
}
export function upcomingChips(rows=[]){
 const chips={ayozan_classic:0,ayozan_royal:0,riwaaz_classic:0,riwaaz_royal:0,all:0};
 for(const row of rows){
  const n=Number(row.count??row.n??1)||1;
  chips.all+=n;
  const source=String(row.source_competitor||'').toLowerCase();
  const code=String(row.design_code||'').toLowerCase();
  if(source==='ayozan'&&code==='classic')chips.ayozan_classic+=n;
  if(source==='ayozan'&&code==='royal')chips.ayozan_royal+=n;
  if(source==='riwaaz'&&code==='classic')chips.riwaaz_classic+=n;
  if(source==='riwaaz'&&code==='royal')chips.riwaaz_royal+=n;
 }
 return chips;
}
export function tierNote(row){
 const source=String(row?.source_competitor||'').toLowerCase();
 const code=row?.design_code==='royal'?'Royal':'Classic';
 if(source==='ayozan')return 'Ayozan is a direct competitor. This seed is a free_basic '+code+' webpage recreate.';
 if(source==='riwaaz')return 'Riwaaz is indirect (video competitor). This variation seed is a '+code+' webpage recreate — never an MP4 clone.';
 return code+' · read-only.';
}
async function rest(path,{prefer}={}){
 if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{
  method:'GET',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:prefer||'return=representation'}
 });
 const raw=await response.text();
 let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 if(!response.ok){
  console.error('Inventory request failed',response.status);
  throw new HttpError(503,'Could not load inventory.');
 }
 const range=response.headers.get('content-range')||'';
 const total=range.includes('/')?Number(range.split('/')[1]):(Array.isArray(data)?data.length:0);
 return {data,total};
}
function competitorWhere(query){
 const parts=[];
 if(query.category)parts.push('category=eq.'+encodeURIComponent(query.category));
 if(query.relation)parts.push('relation=eq.'+query.relation);
 const search=query.q?'or(name.ilike.'+encodeURIComponent(like(query.q))+',slug.ilike.'+encodeURIComponent(like(query.q))+')':'';
 const direct=query.direct?'or(is_direct.eq.true,relation.eq.direct)':'';
 if(search&&direct)parts.push('and=('+search+','+direct+')');
 else if(search)parts.push('or='+search.slice(2));
 else if(direct)parts.push('or=(is_direct.eq.true,relation.eq.direct)');
 return parts.join('&');
}
function upcomingWhere(query){
 const parts=[];
 if(query.source)parts.push('source_competitor=eq.'+encodeURIComponent(query.source));
 if(query.intended_use)parts.push('intended_use=eq.'+encodeURIComponent(query.intended_use));
 if(query.design_code)parts.push('design_code=eq.'+query.design_code);
 if(query.status)parts.push('status=eq.'+query.status);
 if(query.q)parts.push('or=(name.ilike.'+encodeURIComponent(like(query.q))+',slug.ilike.'+encodeURIComponent(like(query.q))+',design_code.ilike.'+encodeURIComponent(like(query.q))+')');
 return parts.join('&');
}
export async function listCompetitors(query){
 const where=competitorWhere(query);
 const path=where?'competitors?select=*&'+where:'competitors?select=*';
 const list=await rest(path+'&order=name.asc&limit='+query.limit+'&offset='+query.offset,{prefer:'count=exact'});
 const tallies=await rest('shortlist_candidates?select=competitor_id,status&limit=1000');
 const counts=new Map();
 for(const row of tallies.data||[]){
  const current=counts.get(row.competitor_id)||{proposed:0,approved:0,rejected:0};
  if(row.status==='proposed'||row.status==='approved'||row.status==='rejected')current[row.status]+=1;
  counts.set(row.competitor_id,current);
 }
 const items=(list.data||[]).map(row=>mapCompetitor(row,counts.get(row.id)));
 const names=await rest('competitors?select=category&limit=100');
 const categories=[...new Set((names.data||[]).map(row=>row.category).filter(Boolean))].sort();
 return {items,total:Number.isFinite(list.total)?list.total:items.length,facets:{categories}};
}
export async function listUpcoming(query){
 const where=upcomingWhere(query);
 const path=where?'upcoming_design_queue?select=*&'+where:'upcoming_design_queue?select=*';
 const list=await rest(path+'&order=updated_at.desc&limit='+query.limit+'&offset='+query.offset,{prefer:'count=exact'});
 const facetRows=await rest('upcoming_design_queue?select=source_competitor,intended_use,design_code,status&limit=1000');
 const chips=upcomingChips(facetRows.data||[]);
 const sources=[...new Set((facetRows.data||[]).map(row=>row.source_competitor).filter(Boolean))].sort();
 const uses=[...new Set((facetRows.data||[]).map(row=>row.intended_use).filter(Boolean))].sort();
 return {items:(list.data||[]).map(mapUpcoming),total:Number.isFinite(list.total)?list.total:(list.data||[]).length,chips,facets:{sources,intended_use:uses}};
}
