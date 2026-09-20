import {useEffect,useState} from 'react';
import AkayPagePreview from './AkayPagePreview';

type Item={
 id:string;style_name:string;slug_hint:string;primary_keyword:string;style_lanes:string[];
 angle:string;evidence_summary:string;reference_urls:string[];preview:string;ai_prompt:string;
 sku_hint:string;blog_seed_keywords:string[];blog_topic_id:string|null;blog_title:string;
 seo_volume:number|null;seo_competition:number|null;
 seo_locale:string;pulse_slot:string;pulse_date:string;fingerprint:string;status:string;
 run_id:string|null;created_at:string;updated_at:string;
};
type Payload={
 items:Item[];total:number;
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

export default function AkayInspirations(){
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
 const [open,setOpen]=useState<Item|null>(null);
 const [offset,setOffset]=useState(0);

 function writeFilters(next:typeof filters){
  const url=new URL(location.href);url.pathname='/akay/inspirations';
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
   const res=await fetch('/api/akay-inspirations?action=list&'+q.toString(),{credentials:'same-origin'});
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body||!Array.isArray(body.items))throw new Error(body?.error||'Could not load inspirations.');
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
  }catch(err){setError(err instanceof Error?err.message:'Could not load inspirations.');}
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
   const res=await fetch('/api/akay-inspirations?action=decide',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id,status})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error((body as {error?:string}).error||'Could not save that decision.');
   setNotice(status==='approved'?'Approved · ready for SKU spawn (phase 2).':'Rejected.');
   if((body as {item?:Item}).item)setOpen((body as {item:Item}).item);
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Could not save that decision.');}
  finally{setBusy('');}
 }

 async function runPulseNow(){
  setBusy('pulse');setError('');setNotice('Running Style Pulse… ≥25 styles (~3 min)');
  try{
   const res=await fetch('/api/akay-inspirations?action=run',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({force:true})
   });
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error((body as {error?:string}).error||'Style pulse failed.');
   const inserted=Number((body as {inserted?:number}).inserted)||0;
   const skipped=Number((body as {skipped?:number}).skipped)||0;
   const slot=String((body as {slot?:string}).slot||'pulse');
   const duplicate=Boolean((body as {duplicate?:boolean}).duplicate);
   setNotice(duplicate
    ?('Already ran '+slot+' today.')
    :('Style '+slot+': +'+inserted+' / skip '+skipped));
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Style pulse failed.');setNotice('');}
  finally{setBusy('');}
 }

 const items=data?.items||[];
 const counts=data?.status_counts||emptyCounts;
 const today=data?.today_pulses||emptyToday;
 const more=Boolean(data&&items.length<data.total);
 const pulsing=busy==='pulse';

 return <div className="akay-shortlist akay-blog-queue akay-inspirations">
  <div className="akay-blog-row akay-blog-row-title">
   <h1>Inspirations</h1>
   <div className="akay-actions">
    <button type="button" disabled={Boolean(busy)} onClick={()=>void runPulseNow()}>{pulsing?'Running…':'Run styles'}</button>
    <button type="button" className="quiet" disabled={pulsing} onClick={()=>void load(0)}>Refresh</button>
   </div>
  </div>
  <div className="akay-blog-row akay-blog-row-filters" role="toolbar" aria-label="Inspiration filters">
   <div className="akay-chips" role="tablist" aria-label="Today pulses">
    <button type="button" role="tab" aria-selected={filters.pulse_slot==='morning'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='morning'?'':'morning'})}>AM {today.morning}</button>
    <button type="button" role="tab" aria-selected={filters.pulse_slot==='afternoon'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='afternoon'?'':'afternoon'})}>PM {today.afternoon}</button>
    <button type="button" role="tab" aria-selected={filters.pulse_slot==='evening'} onClick={()=>writeFilters({...filters,pulse_slot:filters.pulse_slot==='evening'?'':'evening'})}>Eve {today.evening}</button>
    <button type="button" role="tab" aria-selected={!filters.pulse_slot} onClick={()=>writeFilters({...filters,pulse_slot:''})}>Slots</button>
   </div>
   <div className="akay-chips" role="tablist" aria-label="Status">
    {([['queued','Q'],['approved','Ok'],['rejected','No'],['all','All']] as const).map(([value,text])=>
     <button key={value} type="button" role="tab" aria-selected={filters.status===value} title={value} onClick={()=>writeFilters({...filters,status:value})}>{text} {value==='all'?counts.all:counts[value]}</button>
    )}
   </div>
   <form className="akay-filters" onSubmit={e=>e.preventDefault()}>
    <label><span className="akay-sr">Lane</span><select aria-label="Lane" value={filters.lane} onChange={e=>writeFilters({...filters,lane:e.target.value})}><option value="">Lane</option>{(data?.facets.lanes||[]).map(lane=><option key={lane} value={lane}>{label(lane)}</option>)}</select></label>
    <label className="akay-search"><span className="akay-sr">Search</span><input type="search" enterKeyHint="search" aria-label="Search" placeholder="Style or SKU" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   </form>
  </div>
  {(notice||error)&&<p className={error?'akay-error':'akay-notice akay-blog-status'} role={error?'alert':'status'}>{error||notice}</p>}
  {loading&&!data&&<p className="akay-empty">Loading…</p>}
  {data&&items.length===0&&<p className="akay-empty">{filters.q||filters.lane||filters.pulse_slot||filters.status!=='queued'?'No styles match — reset filters.':'No inspirations yet. Runs 1 min after Blog pulse.'}</p>}
  <ul className="akay-cards akay-blog-grid">
   {items.map(item=>
    <li key={item.id} className={'akay-candidate plain akay-blog-card'+(open?.id===item.id?' selected':'')}>
     <button type="button" className="akay-candidate-main" onClick={()=>setOpen(item)}>
      <AkayPagePreview src={item.preview||''} alt={item.style_name} className="card"/>
      <strong>{item.style_name}</strong>
      <span className="akay-meta">{item.sku_hint||item.primary_keyword||'—'}</span>
      {item.blog_title&&<span className="akay-meta akay-blog-backlink" title={item.blog_title}>Blog · {item.blog_title}</span>}
      <span className="akay-meta">
       <i className={'akay-chip status-'+item.status}>{item.status}</i>
       {(item.style_lanes||[]).slice(0,1).map(lane=><i key={lane} className="akay-chip">{label(lane)}</i>)}
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
  {open&&<div className="akay-drawer" role="dialog" aria-modal="true" aria-labelledby="akay-insp-title">
   <button type="button" className="akay-scrim" aria-label="Close" onClick={()=>setOpen(null)}/>
   <div className="akay-sheet">
    <header><h2 id="akay-insp-title">{open.style_name}</h2><i className={'akay-chip status-'+open.status}>{open.status}</i><button type="button" className="quiet" onClick={()=>setOpen(null)}>Close</button></header>
    <AkayPagePreview src={open.preview||''} alt={open.style_name} className="sheet"/>
    <p className="akay-meta">{open.sku_hint} · {open.primary_keyword} · {open.pulse_slot} · SEO vol {open.seo_volume??'—'}</p>
    <p className="akay-meta">{(open.style_lanes||[]).map(label).join(' · ')||'—'}</p>
    {open.blog_title&&<p className="akay-full-reason"><strong>Blog backlink</strong> — <a className="akay-link" href={'/akay/blog-queue?q='+encodeURIComponent(open.blog_title)}>{open.blog_title}</a></p>}
    <p className="akay-full-reason"><strong>Angle</strong> — {open.angle||'—'}</p>
    <p className="akay-full-reason"><strong>Evidence</strong> — {open.evidence_summary||'—'}</p>
    <p className="akay-full-reason"><strong>AI prompt</strong> — {open.ai_prompt||'—'}</p>
    {(open.blog_seed_keywords||[]).length>0&&<p className="akay-meta">Blog seeds: {open.blog_seed_keywords.join(' · ')}</p>}
    {(open.reference_urls||[]).length>0&&<ul className="akay-gaps">{open.reference_urls.map(url=><li key={url}><a className="akay-link" href={url} target="_blank" rel="noopener">{url}</a></li>)}</ul>}
    <p className="akay-meta">Updated {ist(open.updated_at)}</p>
    {open.status==='queued'&&<footer className="akay-row-actions">
     <button type="button" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'approved')}>Approve for SKUs</button>
     <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'rejected')}>Reject</button>
    </footer>}
   </div>
  </div>}
 </div>;
}
