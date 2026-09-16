import {useEffect,useState} from 'react';

type Upcoming={
 id:string;name:string;slug:string;source_competitor:string;source_url:string;design_code:string;
 category_hint:string;intended_use:string;status:string;notes:string;created_at:string;updated_at:string;
};
type Chips={ayozan_classic:number;ayozan_royal:number;riwaaz_classic:number;riwaaz_royal:number;all:number};
type Payload={items:Upcoming[];total:number;chips:Chips;facets:{sources:string[];intended_use:string[]}};
const emptyChips:Chips={ayozan_classic:0,ayozan_royal:0,riwaaz_classic:0,riwaaz_royal:0,all:0};
const scoutGaps=[
 'Ayozan claims 500+ wedding designs; Scout verified 246 titled (140 Classic / 106 Royal). Untitled SKU variants were not invented.',
 'Riwaaz video catalogue claims 800+ with 0 SSR titles. Named cards: 115 of 129+ claimed (78 Classic / 37 Royal). Recreate as webpage, never MP4.'
];

function ist(value:string){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(date);
}
function label(value:string){return (value||'').replaceAll('_',' ')||'—';}
function tierNote(item:Upcoming){
 const source=item.source_competitor;
 const code=item.design_code==='royal'?'Royal':'Classic';
 if(source==='ayozan')return 'Ayozan is a direct competitor. This seed is a free_basic '+code+' webpage recreate.';
 if(source==='riwaaz')return 'Riwaaz is indirect (video competitor). This variation seed is a '+code+' webpage recreate — never an MP4 clone.';
 return code+' · read-only.';
}

export default function AkayUpcoming(){
 const [filters,setFilters]=useState(()=>{
  const q=new URLSearchParams(location.search);
  return {source:q.get('source')||'',intended_use:q.get('intended_use')||'',design_code:q.get('design_code')||'',status:q.get('status')||'',q:q.get('q')||''};
 });
 const [query,setQuery]=useState(filters.q);
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [open,setOpen]=useState<Upcoming|null>(null);
 const [offset,setOffset]=useState(0);

 function writeFilters(next:typeof filters){
  const url=new URL(location.href);url.pathname='/akay/upcoming';
  const q=url.searchParams;
  (['source','intended_use','design_code','status','q'] as const).forEach(key=>{if(next[key])q.set(key,next[key]);else q.delete(key);});
  history.replaceState({},'',url);
  setFilters(next);setOpen(null);setOffset(0);setData(null);
 }

 async function load(nextOffset=0){
  setLoading(true);setError('');
  try{
   const q=new URLSearchParams(location.search);
   q.set('limit','25');q.set('offset',String(nextOffset));
   const res=await fetch('/api/akay-inventory?view=upcoming&'+q.toString(),{credentials:'same-origin'});
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body||!Array.isArray(body.items))throw new Error(body?.error||'Could not load upcoming designs.');
   const payload:Payload={
    items:body.items,total:Number(body.total)||body.items.length,
    chips:body.chips&&typeof body.chips==='object'?{...emptyChips,...body.chips}:emptyChips,
    facets:{sources:Array.isArray(body.facets?.sources)?body.facets.sources:[],intended_use:Array.isArray(body.facets?.intended_use)?body.facets.intended_use:[]}
   };
   setData(current=>nextOffset&&current?{...payload,items:[...current.items,...payload.items]}:payload);
   setOffset(nextOffset);
  }catch(err){setError(err instanceof Error?err.message:'Could not load upcoming designs.');}
  finally{setLoading(false);}
 }

 useEffect(()=>{setQuery(filters.q);},[filters.q]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{if(query!==filters.q)writeFilters({...filters,q:query});},400);
  return()=>window.clearTimeout(timer);
 },[query,filters]);
 useEffect(()=>{void load(0);},[filters]);

 function chip(source:string,code:string){
  return filters.source===source&&filters.design_code===code&&!filters.intended_use;
 }

 const items=data?.items||[];
 const chips=data?.chips||emptyChips;
 const more=data&&items.length<data.total;
 return <div className="akay-shortlist">
  <div className="akay-top"><h1>Upcoming</h1><div className="akay-actions"><button type="button" className="quiet" onClick={()=>void load(0)}>Refresh</button></div></div>
  {error&&<p className="akay-error" role="alert">{error}</p>}
  <p className="akay-notice">Scout-verified gaps. Ayozan 500+ claimed vs 246 titled. Riwaaz video 800+ claimed vs 0 SSR titles; cards 129+ claimed vs 115 named.</p>
  <div className="akay-chips" role="tablist" aria-label="Queue">
   <button type="button" role="tab" aria-selected={chip('ayozan','classic')} onClick={()=>writeFilters({...filters,source:'ayozan',design_code:'classic',intended_use:''})}>Ayozan Classic {chips.ayozan_classic}</button>
   <button type="button" role="tab" aria-selected={chip('ayozan','royal')} onClick={()=>writeFilters({...filters,source:'ayozan',design_code:'royal',intended_use:''})}>Ayozan Royal {chips.ayozan_royal}</button>
   <button type="button" role="tab" aria-selected={chip('riwaaz','classic')} onClick={()=>writeFilters({...filters,source:'riwaaz',design_code:'classic',intended_use:''})}>Riwaaz Classic {chips.riwaaz_classic}</button>
   <button type="button" role="tab" aria-selected={chip('riwaaz','royal')} onClick={()=>writeFilters({...filters,source:'riwaaz',design_code:'royal',intended_use:''})}>Riwaaz Royal {chips.riwaaz_royal}</button>
   <button type="button" role="tab" aria-selected={!filters.source&&!filters.design_code} onClick={()=>writeFilters({...filters,source:'',design_code:'',intended_use:''})}>All {chips.all}</button>
  </div>
  <form className="akay-filters" onSubmit={e=>e.preventDefault()}>
   <label>Source<select value={filters.source} onChange={e=>writeFilters({...filters,source:e.target.value})}><option value="">All sources</option>{(data?.facets.sources||[]).map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>Use<select value={filters.intended_use} onChange={e=>writeFilters({...filters,intended_use:e.target.value})}><option value="">All uses</option>{(data?.facets.intended_use||[]).map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>
   <label>Tier<select value={filters.design_code} onChange={e=>writeFilters({...filters,design_code:e.target.value})}><option value="">All tiers</option><option value="classic">Classic</option><option value="royal">Royal</option></select></label>
   <label>Status<select value={filters.status} onChange={e=>writeFilters({...filters,status:e.target.value})}><option value="">All statuses</option><option value="queued">Queued</option><option value="in_progress">In progress</option><option value="shipped">Shipped</option></select></label>
   <label className="akay-search">Search<input type="search" enterKeyHint="search" placeholder="Name, slug or tier" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  </form>
  <ul className="akay-gaps">{scoutGaps.map(text=><li key={text}>{text}</li>)}</ul>
  {loading&&!data&&<p className="akay-empty">Loading upcoming designs…</p>}
  {data&&items.length===0&&<p className="akay-empty">{filters.q||filters.source||filters.intended_use||filters.design_code||filters.status?'No upcoming designs match — reset filters.':'No upcoming designs yet.'}</p>}
  <ul className="akay-cards">
   {items.map(item=>
    <li key={item.id} className={'akay-candidate plain'+(open?.id===item.id?' selected':'')}>
     <button type="button" className="akay-candidate-main" onClick={()=>setOpen(item)}>
      <strong>{item.name}</strong>
      <span className="akay-meta">{item.source_competitor} · {item.slug}</span>
      <span className="akay-meta"><i className={'akay-chip tier-'+item.design_code}>{item.design_code||'—'}</i><i className="akay-chip">{label(item.intended_use)}</i><i className={'akay-chip status-'+item.status}>{item.status||'—'}</i></span>
      <span className="akay-meta">{ist(item.updated_at)}</span>
     </button>
     <div className="akay-row-actions">{item.source_url&&<a className="akay-link" href={item.source_url} target="_blank" rel="noopener">Open source</a>}</div>
    </li>
   )}
  </ul>
  {more&&<div className="akay-actions"><button type="button" className="quiet" disabled={loading} onClick={()=>void load(offset+25)}>Load more</button></div>}
  {open&&<div className="akay-drawer" role="dialog" aria-modal="true" aria-labelledby="akay-up-title">
   <button type="button" className="akay-scrim" aria-label="Close" onClick={()=>setOpen(null)}/>
   <div className="akay-sheet">
    <header><h2 id="akay-up-title">{open.name}</h2><i className={'akay-chip tier-'+open.design_code}>{open.design_code}</i><button type="button" className="quiet" onClick={()=>setOpen(null)}>Close</button></header>
    <p className="akay-meta">{open.source_competitor} · {label(open.intended_use)} · {open.status}</p>
    {open.source_url&&<p><a className="akay-link" href={open.source_url} target="_blank" rel="noopener">Open source</a></p>}
    <p className="akay-full-reason">{open.notes||'No notes yet.'}</p>
    <p className="akay-meta">{tierNote(open)}</p>
    <p className="akay-meta">Created {ist(open.created_at)} · Updated {ist(open.updated_at)}</p>
   </div>
  </div>}
 </div>;
}
