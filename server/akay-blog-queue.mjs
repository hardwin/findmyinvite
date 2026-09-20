import {HttpError,configured} from './core.mjs';
import {pagePreview} from './akay-preview.mjs';
import {mapQueueItem,runSouthPulse,slugHint,SIGNAL_LANES} from './south-pulse.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses=new Set(['queued','approved','rejected','published']);
const slots=new Set(['morning','afternoon','evening']);

export function cleanId(value){
 if(typeof value!=='string'||!uuid.test(value))throw new HttpError(400,'Choose a valid topic.');
 return value.toLowerCase();
}

export function decideStatus(value){
 if(value!=='approved'&&value!=='rejected')throw new HttpError(400,'Choose approve or reject.');
 return value;
}

export function parseListQuery(url){
 const q=new URL(url,'https://findmyinvite.com').searchParams;
 const status=q.get('status')||'queued';
 if(status!=='all'&&!statuses.has(status))throw new HttpError(400,'Unknown status filter.');
 const lane=q.get('lane')||'';
 if(lane&&!SIGNAL_LANES.includes(lane))throw new HttpError(400,'Unknown lane filter.');
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
  console.error('Blog queue API REST failed',response.status,path);
  throw new HttpError(503,'Could not load the blog queue.');
 }
 const range=response.headers.get('content-range')||'';
 const total=range.includes('/')?Number(range.split('/')[1]):(Array.isArray(data)?data.length:0);
 return {data,total};
}

function listWhere(query,includeStatus=true){
 const parts=[];
 if(includeStatus&&query.status!=='all')parts.push('status=eq.'+query.status);
 if(query.pulse_slot)parts.push('pulse_slot=eq.'+query.pulse_slot);
 if(query.lane)parts.push('signal_lanes=cs.{'+query.lane+'}');
 if(query.q)parts.push('or=(title.ilike.'+encodeURIComponent(like(query.q))+',primary_keyword.ilike.'+encodeURIComponent(like(query.q))+')');
 return parts.join('&');
}

export async function listTopics(query){
 const where=listWhere(query);
 const countWhere=listWhere(query,false);
 const path=where?'blog_topic_queue?select=*&'+where:'blog_topic_queue?select=*';
 const list=await rest(path+'&order=updated_at.desc&limit='+query.limit+'&offset='+query.offset,{prefer:'count=exact'});
 const counts=await rest('blog_topic_queue?select=status'+(countWhere?'&'+countWhere:'')+'&limit=1000');
 const facets=await rest('blog_topic_queue?select=signal_lanes,pulse_slot,pulse_date,status&limit=1000');
 const status_counts={queued:0,approved:0,rejected:0,published:0,all:0};
 for(const row of counts.data||[]){
  if(statuses.has(row.status))status_counts[row.status]+=1;
  status_counts.all+=1;
 }
 const laneSet=new Set();
 const today={morning:0,afternoon:0,evening:0};
 const todayIst=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const row of facets.data||[]){
  for(const lane of row.signal_lanes||[])laneSet.add(lane);
  if(row.pulse_date===todayIst&&row.status==='queued'&&today[row.pulse_slot]!==undefined)today[row.pulse_slot]+=1;
 }
 return {
  items:(list.data||[]).map(mapQueueItem),
  total:Number.isFinite(list.total)?list.total:(list.data||[]).length,
  status_counts,
  facets:{lanes:[...laneSet].sort(),pulse_slots:['morning','afternoon','evening']},
  today_pulses:today
 };
}

async function readItem(id){
 const found=await rest('blog_topic_queue?id=eq.'+id+'&select=*&limit=1');
 const row=found.data?.[0];
 if(!row)throw new HttpError(404,'Topic not found.');
 return mapQueueItem(row);
}

async function createBlogDraft(item){
 const slugBase=slugHint(item.title||item.slug_hint||'south-pulse-topic');
 let slug=slugBase;
 for(let i=0;i<6;i+=1){
  const exists=await rest('blog_posts?slug=eq.'+encodeURIComponent(slug)+'&select=slug&limit=1');
  if(!Array.isArray(exists.data)||!exists.data.length)break;
  slug=slugBase+'-'+(i+2);
 }
 const excerpt=(item.angle||item.evidence_summary||'').slice(0,280);
 const body=[
  item.angle||'',
  '',
  item.evidence_summary||'',
  '',
  (item.source_urls||[]).map(u=>'- '+u).join('\n')
 ].join('\n').trim();
 await rest('blog_posts',{
  method:'POST',
  body:{
   slug,
   title:item.title,
   excerpt,
   body:body||excerpt||item.title,
   published:false,
   published_at:null
  },
  conflict:'Blog slug already exists.'
 });
 return slug;
}

export async function decideTopic(id,status){
 const current=await rest('blog_topic_queue?id=eq.'+id+'&select=*&limit=1');
 const row=current.data?.[0];
 if(!row)throw new HttpError(404,'Topic not found.');
 if(row.status!=='queued')throw new HttpError(409,'This topic is already decided.');
 let blog_slug=null;
 if(status==='approved')blog_slug=await createBlogDraft(mapQueueItem(row));
 await rest('blog_topic_queue?id=eq.'+id,{
  method:'PATCH',
  body:{status,updated_at:new Date().toISOString()}
 });
 return {item:await readItem(id),blog_slug};
}

export async function runPulse(options={}){
 return runSouthPulse(options);
}

export async function runManualPulse({force=true,forceSlot}={}){
 return runSouthPulse({force:Boolean(force),forceSlot:forceSlot||undefined});
}

export {pagePreview,SIGNAL_LANES};
