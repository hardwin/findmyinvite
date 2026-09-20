import {Component,useEffect,useMemo,useState,type FormEvent,type MouseEvent,type ReactNode} from 'react';
import './akay-admin.css';
import AkayShortlist from './AkayShortlist';
import AkayCompetitors from './AkayCompetitors';
import AkayUpcoming from './AkayUpcoming';
import AkayBlogQueue from './AkayBlogQueue';

type Insights={
 totals:{pageviews:number;sessions:number;visitors:number;avgDwellMs:number;events:number};
 byDay:{day:string;pageviews:number;sessions:number}[];
 pages:{path:string;views:number;visitors:number;avgDwellMs:number;totalDwellMs:number}[];
 flow:{from:string;to:string;count:number}[];
 journeys:{session:string;steps:string[];durationMs:number;lastSeen:string}[];
 funnel:{step:string;count:number}[];
 recent:{at:string;path:string;type:string;dwellMs:number}[];
};
type Section='traffic'|'journeys'|'live'|'shortlist'|'competitors'|'upcoming'|'blog-queue';
const nav: {id:Section;href:string;label:string}[]=[
 {id:'traffic',href:'/akay',label:'Traffic'},
 {id:'journeys',href:'/akay/journeys',label:'Journeys'},
 {id:'live',href:'/akay/live',label:'Live'},
 {id:'shortlist',href:'/akay/shortlist',label:'Shortlist'},
 {id:'competitors',href:'/akay/competitors',label:'Competitors'},
 {id:'upcoming',href:'/akay/upcoming',label:'Upcoming'},
 {id:'blog-queue',href:'/akay/blog-queue',label:'Blog queue'}
];
function sectionOf(path=location.pathname):Section{
 const rest=path.replace(/^\/akay\/?/,'').replace(/\/$/,'');
 if(rest==='shortlist'||rest.startsWith('shortlist?'))return 'shortlist';
 if(rest==='competitors'||rest.startsWith('competitors?'))return 'competitors';
 if(rest==='upcoming'||rest.startsWith('upcoming?'))return 'upcoming';
 if(rest==='blog-queue'||rest.startsWith('blog-queue?'))return 'blog-queue';
 if(rest==='journeys')return 'journeys';
 if(rest==='live')return 'live';
 return 'traffic';
}
function isOps(section:Section){return section==='shortlist'||section==='competitors'||section==='upcoming'||section==='blog-queue';}
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
class DeskPanel extends Component<{children:ReactNode},{message:string}>{
 state={message:''};
 static getDerivedStateFromError(error:Error){return {message:error.message||'This panel failed to load.'};}
 render(){return this.state.message?<p className="akay-error" role="alert">{this.state.message}</p>:this.props.children;}
}

export default function AkayAdmin(){
 const [gate,setGate]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [days,setDays]=useState(7);
 const [loading,setLoading]=useState(false);
 const [insights,setInsights]=useState<Insights|null>(null);
 const [section,setSection]=useState<Section>(()=>sectionOf());

 useEffect(()=>{
  document.title='Operator · FindMyInvite';
  const meta=document.createElement('meta');meta.name='robots';meta.content='noindex, nofollow';document.head.appendChild(meta);
  const onPop=()=>setSection(sectionOf());
  addEventListener('popstate',onPop);
  return()=>{meta.remove();removeEventListener('popstate',onPop);};
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

 function go(event:MouseEvent<HTMLAnchorElement>,href:string,id:Section){
  event.preventDefault();
  event.stopPropagation();
  if(location.pathname!==href)history.pushState({},'',href);
  setSection(id);
 }

 const byDay=insights?.byDay||[];
 const pages=insights?.pages||[];
 const funnel=insights?.funnel||[];
 const flow=insights?.flow||[];
 const journeys=insights?.journeys||[];
 const recent=insights?.recent||[];
 const maxViews=Math.max(1,...byDay.map(d=>d.pageviews),1);
 const maxPage=Math.max(1,...pages.map(p=>p.views),1);
 const maxFunnel=Math.max(1,...funnel.map(f=>f.count),1);
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
   <p>Private desk. There is no password change on this page.</p>
   <label>Access code<input type="password" inputMode="numeric" autoComplete="off" value={gate} onChange={e=>setGate(e.target.value)} required/></label>
   {error&&<p className="akay-error" role="alert">{error}</p>}
   <button type="submit" disabled={loading}>{loading?'Checking…':'Enter'}</button>
  </form></main>;
 }

 const totals=insights?.totals;
 const title=nav.find(item=>item.id===section)?.label||'Operator';
 return <div className="akay-app">
  <main className="akay-shell">
   {!isOps(section)&&<div className="akay-top">
    <div><h1>{title}</h1></div>
    <div className="akay-actions">
     {[1,7,30].map(n=><button key={n} type="button" aria-pressed={days===n} onClick={()=>setDays(n)}>{n===1?'24 h':n+'d'}</button>)}
     <button type="button" className="quiet" onClick={()=>void load(days)}>Refresh</button>
     <button type="button" className="quiet" onClick={()=>void leave()}>Lock</button>
    </div>
   </div>}
   {isOps(section)&&<div className="akay-lock-row"><button type="button" className="quiet" onClick={()=>void leave()}>Lock</button></div>}
   {error&&!isOps(section)&&<p className="akay-error" role="alert">{error}</p>}
   {!isOps(section)&&loading&&!insights&&<p className="akay-empty">Loading insights…</p>}
   {section==='traffic'&&insights&&<DeskPanel>
    <section className="akay-kpis" aria-label="Totals">
     <div className="akay-card akay-kpi"><span>Page views</span><strong>{totals?.pageviews??0}</strong></div>
     <div className="akay-card akay-kpi"><span>Visitors</span><strong>{totals?.visitors??0}</strong></div>
     <div className="akay-card akay-kpi"><span>Sessions</span><strong>{totals?.sessions??0}</strong></div>
     <div className="akay-card akay-kpi"><span>Avg time</span><strong>{formatMs(totals?.avgDwellMs||0)}</strong></div>
    </section>
    <section className="akay-card"><h2>Traffic over time</h2>
     {byDay.length?<svg className="akay-chart" viewBox="0 0 600 160" role="img" aria-label="Page views over time"><path d={chart} fill="#e0c07833" stroke="#e0c078" strokeWidth="2"/>{byDay.map((d,i)=>{const x=byDay.length===1?300:(i/(byDay.length-1))*600;const y=150-10-((d.pageviews/maxViews)*126);return <circle key={d.day} cx={x} cy={y} r="4" fill="#e8c98a"/>})}</svg>:<p className="akay-empty">No page views in this range yet.</p>}
     <p className="akay-empty">{byDay.map(d=>d.day.slice(5)+' · '+d.pageviews).join('   ')}</p>
    </section>
    <section className="akay-card"><h2>Where they go</h2>
     {funnel.map(step=><div className="akay-bar" key={step.step}><span>{step.step}</span><i style={{width:Math.max(8,(step.count/maxFunnel)*100)+'%'}}/><span>{step.count}</span></div>)}
    </section>
    <section className="akay-card"><h2>Time on each page</h2>
     {pages.length?pages.map(page=><div className="akay-bar" key={page.path}><span>{page.path}</span><i style={{width:Math.max(8,(page.views/maxPage)*100)+'%'}}/><span>{page.views} · {formatMs(page.avgDwellMs)}</span></div>):<p className="akay-empty">No page timings yet.</p>}
    </section>
   </DeskPanel>}
   {section==='journeys'&&insights&&<DeskPanel>
    <section className="akay-card"><h2>Navigation flows</h2>
     {flow.length?flow.map(item=><div className="akay-flow" key={item.from+item.to}><span className="akay-chip">{item.from}</span><span className="akay-arrow">→</span><span className="akay-chip">{item.to}</span><strong>{item.count}</strong></div>):<p className="akay-empty">Flows appear after someone opens more than one page in a session.</p>}
    </section>
    <section className="akay-card"><h2>User journeys</h2>
     {journeys.length?journeys.map(j=><div className="akay-journey" key={j.session+String(j.lastSeen)}>
      {(j.steps||[]).map((step,i)=><span key={step+i}>{i>0&&<span className="akay-arrow"> → </span>}<span className="akay-chip">{step}</span></span>)}
      <span>{formatMs(j.durationMs)} · {formatTime(String(j.lastSeen))}</span>
     </div>):<p className="akay-empty">Journeys appear as sessions collect page views.</p>}
    </section>
   </DeskPanel>}
   {section==='live'&&insights&&<DeskPanel><section className="akay-card"><h2>Live activity</h2>
    {recent.length?recent.map((row,i)=><div className="akay-recent" key={String(row.at)+row.path+i}><span>{formatTime(String(row.at))}</span><span>{row.type}</span><span>{row.path}</span><span>{row.dwellMs?formatMs(row.dwellMs):'—'}</span></div>):<p className="akay-empty">No events recorded yet.</p>}
   </section></DeskPanel>}
   {section==='shortlist'&&<DeskPanel><AkayShortlist/></DeskPanel>}
   {section==='competitors'&&<DeskPanel><AkayCompetitors/></DeskPanel>}
   {section==='upcoming'&&<DeskPanel><AkayUpcoming/></DeskPanel>}
   {section==='blog-queue'&&<DeskPanel><AkayBlogQueue/></DeskPanel>}
  </main>
  <nav className="akay-nav" aria-label="Operator">
   {nav.map(item=><a key={item.id} href={item.href} aria-current={section===item.id?'page':undefined} onClick={e=>go(e,item.href,item.id)}>{item.label}</a>)}
  </nav>
 </div>;
}
