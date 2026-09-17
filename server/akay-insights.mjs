const content=new Set(['/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy']);
const reserved=new Set(['grand-launch','create','dashboard','gallery','templates','login','signup','forgot-password','about','contact','privacy-policy','terms','refund-policy','shipping-policy','blog','demo','admin','manage','invite','akay','invitations']);
function guestPath(path){return typeof path==='string'&&/^\/[a-z0-9][a-z0-9-]{2,47}$/.test(path)&&!reserved.has(path.slice(1));}
export function summarize(rows){
 const events=Array.isArray(rows)?rows.filter(e=>e&&typeof e==='object'):[];
 const pageviews=events.filter(e=>e.event_type==='pageview');
 const sessions=new Set(events.map(e=>e.session_id).filter(Boolean));
 const visitors=new Set(events.map(e=>e.visitor_id).filter(Boolean));
 const dwell=events.reduce((n,e)=>n+(Number(e.dwell_ms)||0),0);
 const dayMap=new Map();
 for(const e of pageviews){
  const day=String(e.occurred_at||'').slice(0,10)||'unknown';
  const rec=dayMap.get(day)||{day,pageviews:0,sessions:new Set()};
  rec.pageviews+=1;if(e.session_id)rec.sessions.add(e.session_id);dayMap.set(day,rec);
 }
 const byDay=[...dayMap.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(d=>({day:d.day,pageviews:d.pageviews,sessions:d.sessions.size}));
 const pageMap=new Map();
 for(const e of events){
  const path=typeof e.path==='string'?e.path:'/';
  const rec=pageMap.get(path)||{path,views:0,visitors:new Set(),dwell:0};
  if(e.event_type==='pageview')rec.views+=1;
  if(e.visitor_id)rec.visitors.add(e.visitor_id);
  rec.dwell+=Number(e.dwell_ms)||0;pageMap.set(path,rec);
 }
 const pages=[...pageMap.values()].map(p=>({path:p.path,views:p.views,visitors:p.visitors.size,avgDwellMs:p.views?Math.round(p.dwell/p.views):p.dwell,totalDwellMs:p.dwell})).sort((a,b)=>b.views-a.views||b.totalDwellMs-a.totalDwellMs).slice(0,24);
 const bySession=new Map();
 for(const e of events){const id=e.session_id;if(!id)continue;const list=bySession.get(id)||[];list.push(e);bySession.set(id,list);}
 const journeys=[];const flows=new Map();
 for(const [session,list] of bySession){
  const ordered=list.slice().sort((a,b)=>String(a.occurred_at).localeCompare(String(b.occurred_at)));
  const steps=[];
  for(const e of ordered){if(e.event_type==='pageview'&&e.path&&steps.at(-1)!==e.path)steps.push(e.path);}
  if(!steps.length)continue;
  const durationMs=ordered.reduce((n,e)=>n+(Number(e.dwell_ms)||0),0);
  journeys.push({session:String(session).slice(0,8),steps,durationMs,lastSeen:ordered.at(-1).occurred_at});
  for(let i=0;i<steps.length-1;i++){const key=steps[i]+'\0'+steps[i+1];flows.set(key,(flows.get(key)||0)+1);}
 }
 journeys.sort((a,b)=>String(b.lastSeen).localeCompare(String(a.lastSeen)));
 const flow=[...flows.entries()].map(([key,count])=>{const [from,to]=key.split('\0');return {from,to,count};}).sort((a,b)=>b.count-a.count).slice(0,16);
 const hit=pred=>{const ids=new Set();for(const e of pageviews){if(pred(e.path)&&e.visitor_id)ids.add(e.visitor_id);}return ids.size;};
 const funnel=[
  {step:'Home',count:hit(p=>p==='/')},
  {step:'Templates',count:hit(p=>p==='/templates')},
  {step:'Create',count:hit(p=>p==='/create')},
  {step:'Guest invitation',count:hit(guestPath)},
  {step:'Content pages',count:hit(p=>content.has(p)||String(p).startsWith('/blog'))}
 ];
 const recent=events.slice().sort((a,b)=>String(b.occurred_at).localeCompare(String(a.occurred_at))).slice(0,30).map(e=>({at:e.occurred_at,path:e.path,type:e.event_type,dwellMs:Number(e.dwell_ms)||0}));
 return {totals:{pageviews:pageviews.length,sessions:sessions.size,visitors:visitors.size,avgDwellMs:pageviews.length?Math.round(dwell/pageviews.length):0,events:events.length},byDay,pages,flow,journeys:journeys.slice(0,24),funnel,recent};
}
