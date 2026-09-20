import {useEffect,useState} from 'react';
import AkayPagePreview from './AkayPagePreview';

type Topic={
 id:string;title:string;slug_hint:string;primary_keyword:string;signal_lanes:string[];
 supports_topic_id:string|null;angle:string;evidence_summary:string;source_urls:string[];
 preview:string;seo_volume:number|null;seo_competition:number|null;seo_locale:string;
 pulse_slot:string;pulse_date:string;fingerprint:string;status:string;run_id:string|null;
 created_at:string;updated_at:string;
};
type Payload={
 items:Topic[];total:number;
 status_counts:{queued:number;approved:number;rejected:number;published:number;all:number};
 facets:{lanes:string[];pulse_slots:string[]};
 today_pulses:{morning:number;afternoon:number;evening:number};
};
const emptyCounts={queued:0,approved:0,rejected:0,published:0,all:0};
const emptyToday={morning:0,afternoon:0,evening:0};

function ist(value:string){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(date);
}
function label(value:string){return (value||'').replaceAll('_',' ')||'—';}

export default function AkayBlogQueue(){
 const [filters,setFilters]=useState(()=>{
  const q=new URLSearchParams(location.search);
  return {status:q.get('status')||'queued',lane:q.get('lane')||'',pulse_slot:q.get('pulse_slot')||'',q:q.get('q')||''};
 });
 const [query,setQuery]=useState(filters.q);
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [open,setOpen]=useState<Topic|null>(null);
 const [offset,setOffset]=useState(0);

 function writeFilters(next:typeof filters){
  const url=new URL(location.href);url.pathname='/akay/blog-queue';
  const q=url.searchParams;
  (['status','lane','pulse_slot','q'] as const).forEach(key=>{if(next[key])q.set(key,next[key]);else q.delete(key);});
  history.replaceState({},'',url);
  setFilters(next);setOpen(null);setOffset(0);setData(null);
 }

 async function load(nextOffset=0){
  setLoading(true);setError('');
  try{
   const q=new URLSearchParams(location.search);
   if(!q.get('status'))q.set('status','queued');
   q.set('limit','25');q.set('offset',String(nextOffset));
   const res=await fetch('/api/akay-blog-queue?action=list&'+q.toString(),{credentials:'same-origin'});
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body||!Array.isArray(body.items))throw new Error(body?.error||'Could not load the blog queue.');
   const payload:Payload={
    items:body.items,
    total:Number(body.total)||body.items.length,
    status_counts:body.status_counts&&typeof body.status_counts==='object'?{...emptyCounts,...body.status_counts}:emptyCounts,
    facets:{
     lanes:Array.isArray(body.facets?.lanes)?body.facets.lanes:[],
     pulse_slots:Array.isArray(body.facets?.pulse_slots)?body.facets.pulse_slots:['morning','afternoon','evening']
    },
    today_pulses:body.today_pulses&&typeof body.today_pulses==='object'?{...emptyToday,...body.today_pulses}:emptyToday
   };
   setData(current=>nextOffset&&current?{...payload,items:[...current.items,...payload.items]}:payload);
   setOffset(nextOffset);
  }catch(err){setError(err instanceof Error?err.message:'Could not load the blog queue.');}
  finally{setLoading(false);}
 }

 useEffect(()=>{setQuery(filters.q);},[filters.q]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{if(query!==filters.q)writeFilters({...filters,q:query});},400);
  return()=>window.clearTimeout(timer);
 },[query,filters]);
 useEffect(()=>{void load(0);},[filters]);

 async function decide(id:string,status:'approved'|'rejected'){
  setBusy(status);setError('');setNotice('');
  try{
   const res=await fetch('/api/akay-blog-queue?action=decide',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id,status})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error((body as {error?:string}).error||'Could not save that decision.');
   const slug=(body as {blog_slug?:string}).blog_slug;
   setNotice(status==='approved'?(slug?'Approved · draft blog/'+slug:'Approved.'):'Rejected.');
   if((body as {item?:Topic}).item)setOpen((body as {item:Topic}).item);
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Could not save that decision.');}
  finally{setBusy('');}
 }

 async function runPulseNow(){
  setBusy('pulse');setError('');setNotice('Running South Pulse… this can take up to a minute.');
  try{
   const res=await fetch('/api/akay-blog-queue?action=run',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({force:true})
   });
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error((body as {error?:string}).error||'Pulse failed.');
   const inserted=Number((body as {inserted?:number}).inserted)||0;
   const skipped=Number((body as {skipped?:number}).skipped)||0;
   const slot=String((body as {slot?:string}).slot||'pulse');
   const duplicate=Boolean((body as {duplicate?:boolean}).duplicate);
   setNotice(duplicate
    ?('Already ran '+slot+' today — force cleared and re-ran, or nothing new passed novelty/SEO.')
    :('Pulse '+slot+': inserted '+inserted+', skipped '+skipped+'.'));
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Pulse failed.');setNotice('');}
  finally{setBusy('');}
 }

 const items=data?.items||[];
 const counts=data?.status_counts||emptyCounts;
 const today=data?.today_pulses||emptyToday;
 const more=Boolean(data&&items.length<data.total);
 const pulsing=busy==='pulse';

 return <div className="akay-shortlist">
  <div className="akay-top">
   <h1>Blog queue</h1>
   <div className="akay-actions">
    <button type="button" disabled={Boolean(busy)} onClick={()=>void runPulseNow()}>{pulsing?'Running…':'Run pulse now'}</button>
    <button type="button" className="quiet" disabled={pulsing} onClick={()=>void load(0)}>Refresh</button>
   </div>
  </div>
  <p className="akay-notice">South Pulse · 3× daily IST (08:00 / 14:00 / 20:00) plus manual start. Occasions + Tamil cinema, songs, celebs, entertainment, news — South India only. Novel supporting topics; never paraphrases of the queue. Manual runs capped at 3/hour.</p>
  {notice&&<p className="akay-notice" role="status">{notice}</p>}
  {error&&<p className="akay-error" role="alert">{error}</p>}
  <div className="akay-chips" role="tablist" aria-label="Today pulses">
   <button type="button" role="tab" aria-selected={filters.pulse_slot==='morning'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='morning'?'':'morning'})}>Morning {today.morning}</button>
   <button type="button" role="tab" aria-selected={filters.pulse_slot==='afternoon'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='afternoon'?'':'afternoon'})}>Afternoon {today.afternoon}</button>
   <button type="button" role="tab" aria-selected={filters.pulse_slot==='evening'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='evening'?'':'evening'})}>Evening {today.evening}</button>
   <button type="button" role="tab" aria-selected={!filters.pulse_slot} onClick={()=>writeFilters({...filters,pulse_slot:''})}>All slots</button>
  </div>
  <div className="akay-chips" role="tablist" aria-label="Status">
   {([['queued','Queued'],['approved','Approved'],['rejected','Rejected'],['all','All']] as const).map(([value,text])=>
    <button key={value} type="button" role="tab" aria-selected={filters.status===value} onClick={()=>writeFilters({...filters,status:value})}>{text} {value==='all'?counts.all:counts[value]}</button>
   )}
  </div>
  <form className="akay-filters" onSubmit={e=>e.preventDefault()}>
   <label>Lane<select value={filters.lane} onChange={e=>writeFilters({...filters,lane:e.target.value})}><option value="">All lanes</option>{(data?.facets.lanes||[]).map(lane=><option key={lane} value={lane}>{label(lane)}</option>)}</select></label>
   <label className="akay-search">Search<input type="search" enterKeyHint="search" placeholder="Title or keyword" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  </form>
  {loading&&!data&&<p className="akay-empty">Loading South Pulse topics…</p>}
  {data&&items.length===0&&<p className="akay-empty">{filters.q||filters.lane||filters.pulse_slot||filters.status!=='queued'?'No topics match — reset filters.':'No queued topics yet. Next pulse at 08:00 / 14:00 / 20:00 IST.'}</p>}
  <ul className="akay-cards">
   {items.map(item=>
    <li key={item.id} className={'akay-candidate plain'+(open?.id===item.id?' selected':'')}>
     <button type="button" className="akay-candidate-main" onClick={()=>setOpen(item)}>
      <AkayPagePreview src={item.preview||''} alt={item.title}/>
      <strong>{item.title}</strong>
      <span className="akay-meta">{item.primary_keyword||'—'} · {item.pulse_slot} · {item.pulse_date}</span>
      <span className="akay-meta">
       {(item.signal_lanes||[]).slice(0,3).map(lane=><i key={lane} className="akay-chip">{label(lane)}</i>)}
       <i className={'akay-chip status-'+item.status}>{item.status}</i>
       {item.seo_volume!=null&&<i className="akay-chip">vol {item.seo_volume}</i>}
      </span>
     </button>
     {item.status==='queued'&&<div className="akay-row-actions">
      <button type="button" disabled={Boolean(busy)} onClick={()=>void decide(item.id,'approved')}>Approve</button>
      <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide(item.id,'rejected')}>Reject</button>
     </div>}
    </li>
   )}
  </ul>
  {more&&<div className="akay-actions"><button type="button" className="quiet" disabled={loading} onClick={()=>void load(offset+25)}>Load more</button></div>}
  {open&&<div className="akay-drawer" role="dialog" aria-modal="true" aria-labelledby="akay-blog-title">
   <button type="button" className="akay-scrim" aria-label="Close" onClick={()=>setOpen(null)}/>
   <div className="akay-sheet">
    <header><h2 id="akay-blog-title">{open.title}</h2><i className={'akay-chip status-'+open.status}>{open.status}</i><button type="button" className="quiet" onClick={()=>setOpen(null)}>Close</button></header>
    <AkayPagePreview src={open.preview||''} alt={open.title} className="sheet"/>
    <p className="akay-meta">{open.primary_keyword} · {open.pulse_slot} · {open.pulse_date} · SEO vol {open.seo_volume??'—'}</p>
    <p className="akay-meta">{(open.signal_lanes||[]).map(label).join(' · ')||'—'}</p>
    <p className="akay-full-reason"><strong>Angle</strong> — {open.angle||'—'}</p>
    <p className="akay-full-reason"><strong>Evidence</strong> — {open.evidence_summary||'—'}</p>
    {open.supports_topic_id&&<p className="akay-meta">Supports topic {open.supports_topic_id}</p>}
    {(open.source_urls||[]).length>0&&<ul className="akay-gaps">{open.source_urls.map(url=><li key={url}><a className="akay-link" href={url} target="_blank" rel="noopener">{url}</a></li>)}</ul>}
    <p className="akay-meta">Updated {ist(open.updated_at)}</p>
    {open.status==='queued'&&<footer className="akay-row-actions">
     <button type="button" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'approved')}>Approve → draft</button>
     <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'rejected')}>Reject</button>
    </footer>}
   </div>
  </div>}
 </div>;
}
