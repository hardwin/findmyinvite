import {HttpError,configured} from './core.mjs';
import {mapInspirationItem,runStylePulse,STYLE_LANES} from './style-pulse.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses=new Set(['queued','approved','rejected','published']);
const slots=new Set(['morning','afternoon','evening']);

export function cleanInspirationId(value){
 if(typeof value!=='string'||!uuid.test(value))throw new HttpError(400,'Choose a valid inspiration.');
 return value.toLowerCase();
}

export function decideInspirationStatus(value){
 if(value!=='approved'&&value!=='rejected')throw new HttpError(400,'Choose approve or reject.');
 return value;
}

export function parseInspirationListQuery(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 const status=q.get('status')||'queued';
 if(status!=='all'&&!statuses.has(status))throw new HttpError(400,'Unknown status filter.');
 const lane=q.get('lane')||'';
 if(lane&&!STYLE_LANES.includes(lane))throw new HttpError(400,'Unknown lane filter.');
 const pulse_slot=q.get('pulse_slot')||'';
 if(pulse_slot&&!slots.has(pulse_slot))throw new HttpError(400,'Unknown pulse slot filter.');
 const search=String(q.get('q')||'').trim().slice(0,80).replace(/[*(),]/g,'');
 const limit=Math.min(50,Math.max(1,Number(q.get('limit')||25)||25));
 const offset=Math.min(5000,Math.max(0,Number(q.get('offset')||0)||0));
 return {status,lane,pulse_slot,q:search,limit,offset};
}

function like(value){return '*'+value.replace(/%/g,'')+'*';}

async function rest(path,{method='GET',body,prefer,conflict}={}){
 if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{
  method,
  headers:{
   apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,
   Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,
   'Content-Type':'application/json',
   Prefer:prefer||'return=representation'
  },
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const raw=await response.text();
 let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 if(!response.ok){
  if(response.status===409)throw new HttpError(409,conflict||'Conflict.');
  console.error('Inspiration queue API REST failed',response.status,path);
  throw new HttpError(503,'Could not load the inspiration queue.');
 }
 const range=response.headers.get('content-range')||'';
 const total=range.includes('/')?Number(range.split('/')[1]):(Array.isArray(data)?data.length:0);
 return {data,total};
}

function listWhere(query,includeStatus=true){
 const parts=[];
 if(includeStatus&&query.status!=='all')parts.push('status=eq.'+query.status);
 if(query.pulse_slot)parts.push('pulse_slot=eq.'+query.pulse_slot);
 if(query.lane)parts.push('style_lanes=cs.{'+query.lane+'}');
 if(query.q)parts.push('or=(style_name.ilike.'+encodeURIComponent(like(query.q))+',primary_keyword.ilike.'+encodeURIComponent(like(query.q))+',sku_hint.ilike.'+encodeURIComponent(like(query.q))+')');
 return parts.join('&');
}

export async function listInspirations(query){
 const where=listWhere(query);
 const countWhere=listWhere(query,false);
 const path=where?'inspiration_queue?select=*&'+where:'inspiration_queue?select=*';
 const list=await rest(path+'&order=updated_at.desc&limit='+query.limit+'&offset='+query.offset,{prefer:'count=exact'});
 const counts=await rest('inspiration_queue?select=status'+(countWhere?'&'+countWhere:'')+'&limit=1000');
 const facets=await rest('inspiration_queue?select=style_lanes,pulse_slot,pulse_date,status&limit=1000');
 const status_counts={queued:0,approved:0,rejected:0,published:0,all:0};
 for(const row of counts.data||[]){
  if(statuses.has(row.status))status_counts[row.status]+=1;
  status_counts.all+=1;
 }
 const laneSet=new Set();
 const today={morning:0,afternoon:0,evening:0};
 const todayIst=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const row of facets.data||[]){
  for(const lane of row.style_lanes||[])laneSet.add(lane);
  if(row.pulse_date===todayIst&&row.status==='queued'&&today[row.pulse_slot]!==undefined)today[row.pulse_slot]+=1;
 }
 return {
  items:(list.data||[]).map(mapInspirationItem),
  total:Number.isFinite(list.total)?list.total:(list.data||[]).length,
  status_counts,
  facets:{lanes:[...laneSet].sort(),pulse_slots:['morning','afternoon','evening']},
  today_pulses:today
 };
}

async function readItem(id){
 const found=await rest('inspiration_queue?id=eq.'+id+'&select=*&limit=1');
 const row=found.data?.[0];
 if(!row)throw new HttpError(404,'Inspiration not found.');
 return mapInspirationItem(row);
}

export async function decideInspiration(id,status){
 const current=await rest('inspiration_queue?id=eq.'+id+'&select=*&limit=1');
 const row=current.data?.[0];
 if(!row)throw new HttpError(404,'Inspiration not found.');
 if(row.status!=='queued')throw new HttpError(409,'This inspiration is already decided.');
 await rest('inspiration_queue?id=eq.'+id,{
  method:'PATCH',
  body:{status,updated_at:new Date().toISOString()}
 });
 return {item:await readItem(id)};
}

export async function runInspirationPulse(options={}){
 return runStylePulse(options);
}

export async function runManualInspirationPulse({force=true,forceSlot}={}){
 return runStylePulse({force:Boolean(force),forceSlot:forceSlot||undefined});
}

export {STYLE_LANES};
