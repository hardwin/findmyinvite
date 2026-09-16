import {useEffect,useMemo,useState} from 'react';

export type ShortlistItem={
 id:string;title:string;url:string;reason:string;suggested_tier:string;batch:string;status:string;
 created_at:string;updated_at:string;competitor_id:string;competitor_name:string;competitor_slug:string;
 is_direct:boolean;relation:string|null;category:string;homepage:string;catalogue_urls:string[];
 replication_id:string|null;replication_status:string|null;
};
type Payload={items:ShortlistItem[];total:number;status_counts:{proposed:number;approved:number;rejected:number;all:number};competitors:{id:string;name:string}[];batches:string[]};

function ist(value:string){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(date);
}

export default function AkayShortlist(){
 const [filters,setFilters]=useState(()=>{
  const q=new URLSearchParams(location.search);
  return {status:q.get('status')||'proposed',tier:q.get('tier')||'',competitor_id:q.get('competitor_id')||'',batch:q.has('batch')?String(q.get('batch')||''):null,direct:q.get('direct')==='1',q:q.get('q')||''};
 });
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [loading,setLoading]=useState(true);
 const [selected,setSelected]=useState<string[]>([]);
 const [open,setOpen]=useState<ShortlistItem|null>(null);
 const [busy,setBusy]=useState('');

 function writeFilters(next:typeof filters){
  const url=new URL(location.href);
  url.pathname='/akay/shortlist';
  const q=url.searchParams;
  q.set('status',next.status||'proposed');
  (['tier','competitor_id','q'] as const).forEach(key=>{if(next[key])q.set(key,next[key]);else q.delete(key);});
  if(next.batch===null)q.delete('batch');else q.set('batch',next.batch);
  if(next.direct)q.set('direct','1');else q.delete('direct');
  history.replaceState({},'',url);
  setFilters(next);setSelected([]);setOpen(null);
 }

 async function load(){
  setLoading(true);setError('');
  try{
   const q=new URLSearchParams(location.search);
   if(!q.get('status'))q.set('status','proposed');
   const res=await fetch('/api/akay-shortlist?action=list&'+q.toString(),{credentials:'same-origin'});
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Could not load the shortlist.');
   setData(body);
  }catch(err){setError(err instanceof Error?err.message:'Could not load the shortlist.');}
  finally{setLoading(false);}
 }
 const [query,setQuery]=useState(filters.q);
 useEffect(()=>{setQuery(filters.q);},[filters.q]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{if(query!==filters.q)writeFilters({...filters,q:query});},400);
  return()=>window.clearTimeout(timer);
 },[query,filters]);
 useEffect(()=>{void load();},[filters]);

 async function decide(ids:string[],status:'approved'|'rejected'){
  if(!ids.length)return;
  setBusy(status);setError('');setNotice('');
  try{
   const action=ids.length===1?'decide':'bulk';
   const res=await fetch('/api/akay-shortlist?action='+action,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(ids.length===1?{id:ids[0],status}:{ids,status})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Could not save that decision.');
   if(body.failed?.length)setError(body.failed.map((row:{id:string;reason:string})=>row.reason).join(' '));
   const ok=ids.length===1?1:(body.ok||[]).length;
   setNotice(ok?(status==='approved'?ok+' approved and queued.':ok+' rejected.'):'');
   setSelected([]);
   if(open&&ids.includes(open.id))setOpen(null);
   await load();
  }catch(err){setError(err instanceof Error?err.message:'Could not save that decision.');}
  finally{setBusy('');}
 }

 const counts=data?.status_counts||{proposed:0,approved:0,rejected:0,all:0};
 const proposed=useMemo(()=>new Set((data?.items||[]).filter(item=>item.status==='proposed').map(item=>item.id)),[data]);
 const selectable=selected.filter(id=>proposed.has(id));

 return <div className="akay-shortlist">
  <div className="akay-top">
   <h1>Shortlist</h1>
   <div className="akay-actions"><button type="button" className="quiet" onClick={()=>void load()}>Refresh</button></div>
  </div>
  {notice&&<p className="akay-notice" role="status">{notice}</p>}
  {error&&<p className="akay-error" role="alert">{error}</p>}
  <div className="akay-chips" role="tablist" aria-label="Status">
   {([['proposed','Proposed'],['approved','Approved'],['rejected','Rejected'],['all','All']] as const).map(([value,label])=>
    <button key={value} type="button" role="tab" aria-selected={filters.status===value} onClick={()=>writeFilters({...filters,status:value})}>{label} {counts[value==='all'?'all':value]}</button>
   )}
  </div>
  <form className="akay-filters" onSubmit={e=>e.preventDefault()}>
   <label>Tier<select value={filters.tier} onChange={e=>writeFilters({...filters,tier:e.target.value})}><option value="">All tiers</option><option value="classic">Classic</option><option value="royal">Royal</option></select></label>
   <label>Competitor<select value={filters.competitor_id} onChange={e=>writeFilters({...filters,competitor_id:e.target.value})}><option value="">All competitors</option>{(data?.competitors||[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label>Batch<select value={filters.batch??'__all'} onChange={e=>writeFilters({...filters,batch:e.target.value==='__all'?null:e.target.value})}><option value="__all">All batches</option>{(data?.batches||[]).map(batch=><option key={batch||'unbatched'} value={batch}>{batch||'Unbatched'}</option>)}</select></label>
   <label className="akay-check"><input type="checkbox" checked={filters.direct} onChange={e=>writeFilters({...filters,direct:e.target.checked})}/> Direct only</label>
   <label className="akay-search">Search<input type="search" enterKeyHint="search" placeholder="Title or URL" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  </form>
  {selectable.length>0&&<div className="akay-bulk">
   <span>{selectable.length} selected</span>
   <button type="button" disabled={Boolean(busy)} onClick={()=>void decide(selectable,'approved')}>Approve selected</button>
   <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide(selectable,'rejected')}>Reject selected</button>
  </div>}
  {loading&&!data&&<p className="akay-empty">Loading candidates…</p>}
  {data&&data.items.length===0&&<p className="akay-empty">{filters.status==='approved'?'Nothing approved yet. Clear Proposed first.':filters.status==='rejected'?'Nothing rejected yet.':(filters.q||filters.tier||filters.competitor_id||filters.direct||filters.batch!==null)?'No candidates match — reset filters.':'No proposed candidates.'}</p>}
  <ul className="akay-cards">
   {(data?.items||[]).map(item=>{
    const can=item.status==='proposed';
    return <li key={item.id} className={'akay-candidate'+(open?.id===item.id?' selected':'')}>
     <label className="akay-pick">{can?<input type="checkbox" checked={selected.includes(item.id)} onChange={e=>setSelected(e.target.checked?[...selected,item.id]:selected.filter(id=>id!==item.id))}/>:<input type="checkbox" disabled/>}</label>
     <button type="button" className="akay-candidate-main" onClick={()=>setOpen(item)}>
      <strong>{item.title}</strong>
      <span className="akay-meta">{item.competitor_name}{item.is_direct&&<i className="akay-badge">Direct</i>}</span>
      <span className="akay-meta"><i className={'akay-chip tier-'+item.suggested_tier}>{item.suggested_tier}</i><i className={'akay-chip status-'+item.status}>{item.status}</i>{item.batch||'—'}</span>
      <span className="akay-reason">{item.reason||'No reason yet.'}</span>
      <span className="akay-meta">{ist(item.updated_at)}</span>
     </button>
     <div className="akay-row-actions">
      <a className="akay-link" href={item.url} target="_blank" rel="noopener">Open</a>
      {can&&<>
       <button type="button" disabled={Boolean(busy)} onClick={()=>void decide([item.id],'approved')}>Approve</button>
       <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide([item.id],'rejected')}>Reject</button>
      </>}
     </div>
    </li>;
   })}
  </ul>
  {open&&<div className="akay-drawer" role="dialog" aria-modal="true" aria-labelledby="akay-drawer-title">
   <button type="button" className="akay-scrim" aria-label="Close" onClick={()=>setOpen(null)}/>
   <div className="akay-sheet">
    <header><h2 id="akay-drawer-title">{open.title}</h2><i className={'akay-chip status-'+open.status}>{open.status}</i><button type="button" className="quiet" onClick={()=>setOpen(null)}>Close</button></header>
    <p className="akay-meta">{open.competitor_name} · {open.category.replaceAll('_',' ')||'—'} · {open.is_direct?'Direct':'Indirect'}{open.homepage&&<> · <a href={open.homepage} target="_blank" rel="noopener">Homepage</a></>}</p>
    <p><a className="akay-link" href={open.url} target="_blank" rel="noopener">Open template</a></p>
    {open.catalogue_urls.length>0&&<ul className="akay-catalogs">{open.catalogue_urls.map(url=><li key={url}><a href={url} target="_blank" rel="noopener">{url}</a></li>)}</ul>}
    <p className="akay-meta">Tier {open.suggested_tier} · Batch {open.batch||'—'}</p>
    <p className="akay-full-reason">{open.reason||'No reason yet.'}</p>
    <p className="akay-meta">Created {ist(open.created_at)} · Updated {ist(open.updated_at)}</p>
    {open.status==='approved'&&<p className="akay-meta">In queue · {open.replication_status||'queued'}</p>}
    {open.status==='rejected'&&<p className="akay-meta">Decided · rejected</p>}
    <footer>
     {open.status==='proposed'?<>
      <button type="button" className="quiet" disabled={Boolean(busy)} onClick={()=>void decide([open.id],'rejected')}>Reject</button>
      <button type="button" disabled={Boolean(busy)} onClick={()=>void decide([open.id],'approved')}>Approve</button>
     </>:<p className="akay-empty">Decided · {open.status}</p>}
    </footer>
   </div>
  </div>}
 </div>;
}
