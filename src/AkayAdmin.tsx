import {useEffect,useMemo,useState} from 'react';
import type {FormEvent} from 'react';
import './akay-admin.css';

type Insights={
 totals:{pageviews:number;sessions:number;visitors:number;avgDwellMs:number;events:number};
 byDay:{day:string;pageviews:number;sessions:number}[];
 pages:{path:string;views:number;visitors:number;avgDwellMs:number;totalDwellMs:number}[];
 flow:{from:string;to:string;count:number}[];
 journeys:{session:string;steps:string[];durationMs:number;lastSeen:string}[];
 funnel:{step:string;count:number}[];
 recent:{at:string;path:string;type:string;dwellMs:number}[];
};

function formatMs(ms:number){
 if(ms<1000)return ms+' ms';
 if(ms<60000)return (ms/1000).toFixed(1)+' s';
 return Math.round(ms/60000)+' min';
}
function formatTime(value:string){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(date);
}

const emptyInsights:Insights={
 totals:{pageviews:0,sessions:0,visitors:0,avgDwellMs:0,events:0},
 byDay:[],pages:[],flow:[],journeys:[],
 funnel:[{step:'Home',count:0},{step:'Templates',count:0},{step:'Create',count:0},{step:'Guest invitation',count:0},{step:'Content pages',count:0}],
 recent:[]
};

export default function AkayAdmin(){
 const [gate,setGate]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [days,setDays]=useState(7);
 const [loading,setLoading]=useState(false);
 const [insights,setInsights]=useState<Insights|null>(null);

 useEffect(()=>{
  document.title='Operator · FindMyInvite';
  const meta=document.createElement('meta');meta.name='robots';meta.content='noindex, nofollow';document.head.appendChild(meta);
  return ()=>meta.remove();
 },[]);

 async function load(nextDays=days){
  setLoading(true);setError('');
  try{
   const res=await fetch('/api/analytics?action=insights&days='+nextDays,{credentials:'same-origin'});
   if(res.status===401){setAuthed(false);setInsights(null);return;}
   const body=await res.json().catch(()=>({}));
   if(!res.ok){
    setAuthed(true);setInsights(current=>current||emptyInsights);
    throw new Error(body.error||'Could not load insights.');
   }
   setAuthed(true);setInsights(body.insights);
  }catch(err){setError(err instanceof Error?err.message:'Could not load insights.')}
  finally{setLoading(false)}
 }

 useEffect(()=>{void load(days)},[days]);

 async function enter(event:FormEvent){
  event.preventDefault();setError('');setLoading(true);
  try{
   const res=await fetch('/api/analytics?action=gate',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({gate})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'That access code is not accepted.');
   setGate('');setAuthed(true);await load(days);
  }catch(err){setError(err instanceof Error?err.message:'That access code is not accepted.');setAuthed(false)}
  finally{setLoading(false)}
 }

 async function leave(){
  await fetch('/api/analytics?action=leave-gate',{method:'POST',credentials:'same-origin'});
  setAuthed(false);setInsights(null);setGate('');
 }

 const maxViews=Math.max(1,...(insights?.byDay.map(d=>d.pageviews)||[1]));
 const maxPage=Math.max(1,...(insights?.pages.map(p=>p.views)||[1]));
 const maxFunnel=Math.max(1,...(insights?.funnel.map(f=>f.count)||[1]));
 const chart=useMemo(()=>{
  const series=insights?.byDay||[];
  if(!series.length)return '';
  const h=150,w=600,max=Math.max(1,...series.map(d=>d.pageviews));
  const points=series.map((d,i)=>{
   const x=series.length===1?w/2:(i/(series.length-1))*w;
   const y=h-10-((d.pageviews/max)*(h-24));
   return x+','+y;
  });
  return `M 0 ${h} L ${points.join(' L ')} L ${w} ${h} Z`;
 },[insights]);

 if(!authed){
  return <main className="akay-gate"><form onSubmit={enter} autoComplete="off">
   <h1>Operator</h1>
   <p>Private traffic desk. There is no password change on this page.</p>
   <label>Access code<input type="password" inputMode="numeric" autoComplete="off" value={gate} onChange={e=>setGate(e.target.value)} required/></label>
   {error&&<p className="akay-error" role="alert">{error}</p>}
   <button type="submit" disabled={loading}>{loading?'Checking…':'Enter'}</button>
  </form></main>;
 }

 const totals=insights?.totals;
 return <main className="akay-shell">
  <div className="akay-top">
   <div><h1>Traffic & journeys</h1></div>
   <div className="akay-actions">
    {[1,7,30].map(n=><button key={n} type="button" aria-pressed={days===n} onClick={()=>setDays(n)}>{n===1?'24 hours':n+' days'}</button>)}
    <button type="button" className="quiet" onClick={()=>void load(days)}>Refresh</button>
    <button type="button" className="quiet" onClick={()=>void leave()}>Lock</button>
   </div>
  </div>
  {error&&<p className="akay-error" role="alert">{error}</p>}
  {loading&&!insights&&<p className="akay-empty">Loading insights…</p>}
  {insights&&<>
   <section className="akay-kpis" aria-label="Totals">
    <div className="akay-card akay-kpi"><span>Page views</span><strong>{totals?.pageviews??0}</strong></div>
    <div className="akay-card akay-kpi"><span>Visitors</span><strong>{totals?.visitors??0}</strong></div>
    <div className="akay-card akay-kpi"><span>Sessions</span><strong>{totals?.sessions??0}</strong></div>
    <div className="akay-card akay-kpi"><span>Avg time / view</span><strong>{formatMs(totals?.avgDwellMs||0)}</strong></div>
   </section>
   <div className="akay-grid">
    <section className="akay-card"><h2>Traffic over time</h2>
     {insights.byDay.length?<svg className="akay-chart" viewBox="0 0 600 160" role="img" aria-label="Page views over time"><path d={chart} fill="#e0c07833" stroke="#e0c078" strokeWidth="2"/>{insights.byDay.map((d,i)=>{const x=insights.byDay.length===1?300:(i/(insights.byDay.length-1))*600;const y=150-10-((d.pageviews/maxViews)*126);return <circle key={d.day} cx={x} cy={y} r="4" fill="#e8c98a"/>})}</svg>:<p className="akay-empty">No page views in this range yet. Browse the storefront, then refresh.</p>}
     <p className="akay-empty">{insights.byDay.map(d=>d.day.slice(5)+' · '+d.pageviews).join('   ')}</p>
    </section>
    <section className="akay-card"><h2>Where they go</h2>
     {insights.funnel.map(step=><div className="akay-bar" key={step.step}><span>{step.step}</span><i style={{width:Math.max(8,(step.count/maxFunnel)*100)+'%'}}/><span>{step.count} people</span></div>)}
    </section>
   </div>
   <section className="akay-card"><h2>Time on each page</h2>
    {insights.pages.length?insights.pages.map(page=><div className="akay-bar" key={page.path}><span>{page.path}</span><i style={{width:Math.max(8,(page.views/maxPage)*100)+'%'}}/><span>{page.views} views · {formatMs(page.avgDwellMs)} avg · {page.visitors} people</span></div>):<p className="akay-empty">No page timings yet.</p>}
   </section>
   <section className="akay-card"><h2>Navigation flows</h2>
    {insights.flow.length?insights.flow.map(item=><div className="akay-flow" key={item.from+item.to}><span className="akay-chip">{item.from}</span><span className="akay-arrow">→</span><span className="akay-chip">{item.to}</span><strong>{item.count}</strong></div>):<p className="akay-empty">Flows appear after someone opens more than one page in a session.</p>}
   </section>
   <section className="akay-card"><h2>User journeys</h2>
    {insights.journeys.length?insights.journeys.map(j=><div className="akay-journey" key={j.session+String(j.lastSeen)}>
     {j.steps.map((step,i)=><span key={step+i}>{i>0&&<span className="akay-arrow"> → </span>}<span className="akay-chip">{step}</span></span>)}
     <span>{formatMs(j.durationMs)} · {formatTime(String(j.lastSeen))}</span>
    </div>):<p className="akay-empty">Journeys appear as sessions collect page views.</p>}
   </section>
   <section className="akay-card"><h2>Live activity</h2>
    {insights.recent.length?insights.recent.map((row,i)=><div className="akay-recent" key={String(row.at)+row.path+i}><span>{formatTime(String(row.at))}</span><span>{row.type}</span><span>{row.path}</span><span>{row.dwellMs?formatMs(row.dwellMs):'—'}</span></div>):<p className="akay-empty">No events recorded yet.</p>}
   </section>
  </>}
 </main>;
}
