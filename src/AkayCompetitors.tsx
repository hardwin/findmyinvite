import {useEffect,useState} from 'react';

type Counts={proposed:number;approved:number;rejected:number};
type Competitor={
 id:string;name:string;slug:string;homepage:string;catalogue_urls:string[];catalogue_count:number;
 category:string;geography:string;notes:string;is_direct:boolean;relation:string|null;badge:string;
 created_at:string;updated_at:string;shortlist_counts:Counts;
};
type Payload={items:Competitor[];total:number;facets:{categories:string[]}};

function ist(value:string){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(date);
}
function label(value:string){return (value||'').replaceAll('_',' ')||'—';}

export default function AkayCompetitors(){
 const [filters,setFilters]=useState(()=>{
  const q=new URLSearchParams(location.search);
  return {category:q.get('category')||'',direct:q.get('direct')==='1',relation:q.get('relation')||'',q:q.get('q')||''};
 });
 const [query,setQuery]=useState(filters.q);
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState<Competitor|null>(null);

 function writeFilters(next:typeof filters){
  const url=new URL(location.href);url.pathname='/akay/competitors';
  const q=url.searchParams;
  (['category','relation','q'] as const).forEach(key=>{if(next[key])q.set(key,next[key]);else q.delete(key);});
  if(next.direct)q.set('direct','1');else q.delete('direct');
  history.replaceState({},'',url);
  setFilters(next);setOpen(null);
 }

 async function load(){
  setLoading(true);setError('');
  try{
   const q=new URLSearchParams(location.search);
   const res=await fetch('/api/akay-inventory?view=competitors&'+q.toString(),{credentials:'same-origin'});
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body||!Array.isArray(body.items))throw new Error(body?.error||'Could not load competitors.');
   setData({items:body.items,total:Number(body.total)||body.items.length,facets:{categories:Array.isArray(body.facets?.categories)?body.facets.categories:[]}});
  }catch(err){setError(err instanceof Error?err.message:'Could not load competitors.');}
  finally{setLoading(false);}
 }

 useEffect(()=>{setQuery(filters.q);},[filters.q]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{if(query!==filters.q)writeFilters({...filters,q:query});},400);
  return()=>window.clearTimeout(timer);
 },[query,filters]);
 useEffect(()=>{void load();},[filters]);

 const items=data?.items||[];
 const categories=data?.facets.categories||[];
 return <div className="akay-shortlist">
  <div className="akay-top"><h1>Competitors</h1><div className="akay-actions"><button type="button" className="quiet" onClick={()=>void load()}>Refresh</button></div></div>
  {error&&<p className="akay-error" role="alert">{error}</p>}
  <form className="akay-filters" onSubmit={e=>e.preventDefault()}>
   <label>Category<select value={filters.category} onChange={e=>writeFilters({...filters,category:e.target.value})}><option value="">All categories</option>{categories.map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>
   <label>Relation<select value={filters.relation} onChange={e=>writeFilters({...filters,relation:e.target.value})}><option value="">All relations</option><option value="direct">Direct</option><option value="indirect">Indirect</option></select></label>
   <label className="akay-check"><input type="checkbox" checked={filters.direct} onChange={e=>writeFilters({...filters,direct:e.target.checked})}/> Direct only</label>
   <label className="akay-search">Search<input type="search" enterKeyHint="search" placeholder="Name or slug" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  </form>
  {loading&&!data&&<p className="akay-empty">Loading competitors…</p>}
  {data&&items.length===0&&<p className="akay-empty">{filters.q||filters.category||filters.relation||filters.direct?'No competitors match — reset filters.':'No competitors yet.'}</p>}
  <ul className="akay-cards">
   {items.map(item=>{
    const counts=item.shortlist_counts||{proposed:0,approved:0,rejected:0};
    return <li key={item.id} className={'akay-candidate plain'+(open?.id===item.id?' selected':'')}>
     <button type="button" className="akay-candidate-main" onClick={()=>setOpen(item)}>
      <strong>{item.name}</strong>
      <span className="akay-meta">{label(item.category)}{item.badge==='direct'&&<i className="akay-badge">Direct</i>}{item.badge==='indirect'&&<i className="akay-badge">Indirect</i>}</span>
      <span className="akay-meta">{item.geography||'—'}</span>
      <span className="akay-meta">{item.catalogue_count} catalogues · Shortlist {counts.proposed}/{counts.approved}/{counts.rejected}</span>
      <span className="akay-meta">{ist(item.updated_at)}</span>
     </button>
     <div className="akay-row-actions">{item.homepage&&<a className="akay-link" href={item.homepage} target="_blank" rel="noopener">Homepage</a>}</div>
    </li>;
   })}
  </ul>
  {open&&<div className="akay-drawer" role="dialog" aria-modal="true" aria-labelledby="akay-comp-title">
   <button type="button" className="akay-scrim" aria-label="Close" onClick={()=>setOpen(null)}/>
   <div className="akay-sheet">
    <header><h2 id="akay-comp-title">{open.name}</h2>{open.badge&&<i className="akay-chip">{open.badge}</i>}<button type="button" className="quiet" onClick={()=>setOpen(null)}>Close</button></header>
    <p className="akay-meta">{label(open.category)} · {open.geography||'—'}</p>
    {open.homepage&&<p><a className="akay-link" href={open.homepage} target="_blank" rel="noopener">Open homepage</a></p>}
    {open.catalogue_urls.length>0&&<ul className="akay-catalogs">{open.catalogue_urls.map(url=><li key={url}><a href={url} target="_blank" rel="noopener">{url}</a></li>)}</ul>}
    <p className="akay-full-reason">{open.notes||'No notes yet.'}</p>
    <p className="akay-meta">Shortlist · proposed {open.shortlist_counts.proposed} · approved {open.shortlist_counts.approved} · rejected {open.shortlist_counts.rejected}</p>
    <p className="akay-meta">Created {ist(open.created_at)} · Updated {ist(open.updated_at)}</p>
   </div>
  </div>}
 </div>;
}
