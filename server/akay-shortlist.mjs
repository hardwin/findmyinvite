import {HttpError,configured} from './core.mjs';
import {pagePreview} from './akay-preview.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses=new Set(['proposed','approved','rejected']);
const tiers=new Set(['classic','royal']);
const sorts={updated_at:'updated_at.desc',created_at:'created_at.desc',title:'title.asc'};
export function cleanId(value){
 if(typeof value!=='string'||!uuid.test(value))throw new HttpError(400,'Choose a valid candidate.');
 return value.toLowerCase();
}
export function decideStatus(value){
 if(value!=='approved'&&value!=='rejected')throw new HttpError(400,'Choose approve or reject.');
 return value;
}
export function parseListQuery(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 const status=q.get('status')||'proposed';
 if(status!=='all'&&!statuses.has(status))throw new HttpError(400,'Unknown status filter.');
 const tier=q.get('tier')||'';
 if(tier&&!tiers.has(tier))throw new HttpError(400,'Unknown tier filter.');
 const competitor_id=q.get('competitor_id')||'';
 if(competitor_id&&!uuid.test(competitor_id))throw new HttpError(400,'Unknown competitor filter.');
 const batch=q.has('batch')?String(q.get('batch')||''):null;
 const search=String(q.get('q')||'').trim().slice(0,80).replace(/[*(),]/g,'');
 const sort=sorts[q.get('sort')||'updated_at']||sorts.updated_at;
 const limit=Math.min(50,Math.max(1,Number(q.get('limit')||25)||25));
 const offset=Math.min(5000,Math.max(0,Number(q.get('offset')||0)||0));
 return {status,tier,competitor_id,batch,direct:q.get('direct')==='1',q:search,sort,limit,offset};
}
function like(value){return '*'+value.replace(/%/g,'')+'*';}
function filters(query,includeStatus=true){
 const parts=[];
 if(includeStatus&&query.status!=='all')parts.push('status=eq.'+query.status);
 if(query.tier)parts.push('suggested_tier=eq.'+query.tier);
 if(query.competitor_id)parts.push('competitor_id=eq.'+query.competitor_id);
 if(query.batch!==null)parts.push('batch=eq.'+encodeURIComponent(query.batch));
 const search=query.q?'or(title.ilike.'+like(query.q)+',url.ilike.'+like(query.q)+')':'';
 const direct=query.direct?'or(competitors.is_direct.eq.true,competitors.relation.eq.direct)':'';
 if(search&&direct)parts.push('and=('+search+','+direct+')');
 else if(search)parts.push('or=(title.ilike.'+encodeURIComponent(like(query.q))+',url.ilike.'+encodeURIComponent(like(query.q))+')');
 else if(direct)parts.push('or=(competitors.is_direct.eq.true,competitors.relation.eq.direct)');
 return parts.join('&');
}
function competitor(row){return row?.competitors&&!Array.isArray(row.competitors)?row.competitors:row?.competitors?.[0]||{};}
function queue(row){const value=row?.replication_queue;const item=Array.isArray(value)?value[0]:value;return item&&typeof item==='object'?item:null;}
export function mapItem(row){
 const c=competitor(row),r=queue(row);
 return {
  id:row.id,title:row.title,url:row.url,preview:pagePreview(row.url),reason:row.reason||'',suggested_tier:row.suggested_tier,
  batch:row.batch||'',status:row.status,created_at:row.created_at,updated_at:row.updated_at,competitor_id:row.competitor_id,
  competitor_name:c.name||'',competitor_slug:c.slug||'',is_direct:Boolean(c.is_direct)||c.relation==='direct',
  relation:c.relation||null,category:c.category||'',homepage:c.homepage||'',catalogue_urls:Array.isArray(c.catalogue_urls)?c.catalogue_urls:[],
  replication_id:r?.id||null,replication_status:r?.status||null
 };
}
async function rest(path,{method='GET',body,prefer,conflict}={}){
 if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{
  method,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:prefer||'return=representation'},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const raw=await response.text();
 let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 if(!response.ok){
  if(response.status===409)throw new HttpError(409,conflict||'Conflict.');
  console.error('Shortlist request failed',response.status);
  throw new HttpError(503,'Could not save your changes. Please try again.');
 }
 const range=response.headers.get('content-range')||'';
 const total=range.includes('/')?Number(range.split('/')[1]):(Array.isArray(data)?data.length:0);
 return {data,total};
}
const select='id,title,url,reason,suggested_tier,batch,status,created_at,updated_at,competitor_id,competitors!inner(name,slug,is_direct,relation,category,homepage,catalogue_urls),replication_queue(id,status)';
export async function listCandidates(query){
 const where=filters(query);
 const countWhere=filters(query,false);
 const path=where?'shortlist_candidates?select='+select+'&'+where:'shortlist_candidates?select='+select;
 const list=await rest(path+'&order='+query.sort+'&limit='+query.limit+'&offset='+query.offset,{prefer:'count=exact'});
 const counts=await rest('shortlist_candidates?select=status'+(countWhere?'&'+countWhere:'')+'&limit=1000');
 const facets=await rest('shortlist_candidates?select=competitor_id,batch,competitors!inner(id,name)'+(countWhere?'&'+countWhere:'')+'&limit=1000');
 const status_counts={proposed:0,approved:0,rejected:0,all:0};
 for(const row of counts.data||[]){if(statuses.has(row.status))status_counts[row.status]+=1;status_counts.all+=1;}
 const competitors=[],seen=new Set();
 const batches=new Set();
 for(const row of facets.data||[]){
  batches.add(row.batch||'');
  const id=row.competitor_id,name=competitor(row).name||'';
  if(id&&!seen.has(id)){seen.add(id);competitors.push({id,name});}
 }
 competitors.sort((a,b)=>a.name.localeCompare(b.name));
 return {
  items:(list.data||[]).map(mapItem),
  total:Number.isFinite(list.total)?list.total:(list.data||[]).length,
  status_counts,
  competitors,
  batches:[...batches].sort((a,b)=>a.localeCompare(b))
 };
}
async function readItem(id){
 const found=await rest('shortlist_candidates?id=eq.'+id+'&select='+select+'&limit=1');
 const row=found.data?.[0];if(!row)throw new HttpError(404,'Candidate not found.');
 return mapItem(row);
}
function rpcPayload(data){
 const row=Array.isArray(data)?data[0]:data;
 return row&&typeof row==='object'&&!Array.isArray(row)?row:null;
}
async function decideRpc(id,status){
 const fn=status==='approved'?'approve_shortlist_candidate':'reject_shortlist_candidate';
 const result=await rest('rpc/'+fn,{method:'POST',body:{p_id:id}});
 const payload=rpcPayload(result.data);
 if(!payload||payload.ok===false){
  if(payload?.error==='not_found')throw new HttpError(404,'Candidate not found.');
  throw new HttpError(409,'This candidate is already decided.');
 }
 if(status==='rejected')return {candidate:await readItem(id),replication_queue:null};
 const queueId=payload.queue_id||payload.queueId;
 return {
  candidate:await readItem(id),
  replication_queue:{id:queueId||null,status:payload.queue_status||payload.queueStatus||'queued'}
 };
}
export async function decideCandidate(id,status){
 return decideRpc(id,status);
}
export async function bulkDecide(ids,status){
 if(!Array.isArray(ids)||!ids.length)throw new HttpError(400,'Select at least one candidate.');
 if(ids.length>50)throw new HttpError(400,'Select up to 50 candidates.');
 const ok=[],failed=[];
 for(const value of ids){
  try{await decideCandidate(cleanId(value),status);ok.push(cleanId(value));}
  catch(error){failed.push({id:typeof value==='string'?value:'',reason:error instanceof HttpError?error.message:'Could not save.'});}
 }
 return {ok,failed};
}
