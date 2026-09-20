import {useEffect,useState} from 'react';
import {Check,ExternalLink,Loader2,Play,RefreshCw,X} from 'lucide-react';
import {Badge} from '@/akay/ui/badge';
import {Button} from '@/akay/ui/button';
import {Input,Select} from '@/akay/ui/input';
import {Sheet,SheetContent,SheetHeader,SheetTitle} from '@/akay/ui/sheet';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/akay/ui/table';

 type Item={
 id:string;style_name:string;slug_hint:string;primary_keyword:string;style_lanes:string[];
 angle:string;evidence_summary:string;reference_urls:string[];ai_prompt:string;
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

function label(value:string){return (value||'').replaceAll('_',' ')||'—';}
function pinUrl(item:Item){return item.reference_urls.find(u=>/pinterest\.com\/search/i.test(u))||item.reference_urls[0]||'';}

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
   if(!res.ok||!body||!Array.isArray(body.items))throw new Error(body?.error||'Load failed.');
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
  }catch(err){setError(err instanceof Error?err.message:'Load failed.');}
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
   if(!res.ok)throw new Error((body as {error?:string}).error||'Save failed.');
   setNotice(status==='approved'?'Approved':'Rejected');
   if((body as {item?:Item}).item)setOpen((body as {item:Item}).item);
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Save failed.');}
  finally{setBusy('');}
 }

 async function runPulseNow(){
  setBusy('pulse');setError('');setNotice('Running…');
  try{
   const res=await fetch('/api/akay-inspirations?action=run',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({force:true})
   });
   if(res.status===401){location.assign('/akay');return;}
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error((body as {error?:string}).error||'Pulse failed.');
   const inserted=Number((body as {inserted?:number}).inserted)||0;
   const skipped=Number((body as {skipped?:number}).skipped)||0;
   setNotice('+'+inserted+' / skip '+skipped);
   await load(0);
  }catch(err){setError(err instanceof Error?err.message:'Pulse failed.');setNotice('');}
  finally{setBusy('');}
 }

 const items=data?.items||[];
 const counts=data?.status_counts||emptyCounts;
 const today=data?.today_pulses||emptyToday;
 const more=Boolean(data&&items.length<data.total);
 const pulsing=busy==='pulse';

 return <div className="space-y-2">
  <div className="flex items-center justify-between gap-2">
   <h1 className="text-base font-semibold">Inspirations</h1>
   <div className="flex items-center gap-1">
    <Button type="button" size="sm" disabled={Boolean(busy)} onClick={()=>void runPulseNow()}>
     {pulsing?<Loader2 className="size-3.5 animate-spin"/>:<Play className="size-3.5"/>}
     {pulsing?'…':'Run'}
    </Button>
    <Button type="button" size="icon" variant="outline" disabled={pulsing} aria-label="Refresh" onClick={()=>void load(0)}><RefreshCw className="size-3.5"/></Button>
   </div>
  </div>

  <div className="flex flex-wrap items-center gap-1.5">
   {([['','All'],['morning','AM '+today.morning],['afternoon','PM '+today.afternoon],['evening','Eve '+today.evening]] as const).map(([value,text])=>(
    <Button key={value||'all'} type="button" size="sm" variant={(filters.pulse_slot||'')===value?'default':'outline'} onClick={()=>writeFilters({...filters,pulse_slot:value})}>{text}</Button>
   ))}
   <span className="mx-1 h-4 w-px bg-border"/>
   {([['queued','Q '+counts.queued],['approved','Ok '+counts.approved],['rejected','No '+counts.rejected],['all','All '+counts.all]] as const).map(([value,text])=>(
    <Button key={value} type="button" size="sm" variant={filters.status===value?'default':'outline'} onClick={()=>writeFilters({...filters,status:value})}>{text}</Button>
   ))}
   <Select className="ml-auto w-28" aria-label="Lane" value={filters.lane} onChange={e=>writeFilters({...filters,lane:e.target.value})}>
    <option value="">Lane</option>
    {(data?.facets.lanes||[]).map(lane=><option key={lane} value={lane}>{label(lane)}</option>)}
   </Select>
   <Input className="w-36" type="search" placeholder="Search" value={query} onChange={e=>setQuery(e.target.value)}/>
  </div>

  {(notice||error)&&<p className={'rounded-md border px-2 py-1 text-xs '+(error?'border-red-200 bg-red-50 text-red-700':'border-emerald-200 bg-emerald-50 text-emerald-800')} role={error?'alert':'status'}>{error||notice}</p>}
  {loading&&!data&&<p className="text-xs text-muted-foreground">Loading…</p>}
  {data&&items.length===0&&<p className="text-xs text-muted-foreground">No styles</p>}

  <div className="overflow-hidden rounded-md border">
   <Table>
    <TableHeader>
     <TableRow>
      <TableHead>Style</TableHead>
      <TableHead className="hidden md:table-cell">Blog</TableHead>
      <TableHead>Lane</TableHead>
      <TableHead className="w-[1%]"></TableHead>
     </TableRow>
    </TableHeader>
    <TableBody>
     {items.map(item=>{
      const pin=pinUrl(item);
      return <TableRow key={item.id} className={open?.id===item.id?'bg-muted/40':''}>
       <TableCell>
        <button type="button" className="text-left" onClick={()=>setOpen(item)}>
         <p className="text-sm font-medium leading-snug">{item.style_name}</p>
         <p className="text-[11px] text-muted-foreground">{item.sku_hint||item.primary_keyword}</p>
        </button>
       </TableCell>
       <TableCell className="hidden max-w-[14rem] md:table-cell">
        {item.blog_title?(
         <a className="line-clamp-2 text-xs text-blue-600 hover:underline" href={'/akay/blog-queue?q='+encodeURIComponent(item.blog_title)}>{item.blog_title}</a>
        ):<span className="text-xs text-muted-foreground">—</span>}
       </TableCell>
       <TableCell>
        <div className="flex flex-wrap gap-1">
         <Badge variant={item.status==='approved'?'success':item.status==='rejected'?'danger':'secondary'}>{item.status}</Badge>
         {(item.style_lanes||[]).slice(0,1).map(lane=><Badge key={lane} variant="outline">{label(lane)}</Badge>)}
        </div>
       </TableCell>
       <TableCell>
        <div className="flex items-center gap-1">
         {pin&&<Button type="button" size="icon" variant="ghost" aria-label="Open Pinterest" asChild>
          <a href={pin} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5"/></a>
         </Button>}
         {item.status==='queued'&&<>
          <Button type="button" size="icon" disabled={Boolean(busy)} aria-label="Approve" onClick={()=>void decide(item.id,'approved')}><Check/></Button>
          <Button type="button" size="icon" variant="outline" disabled={Boolean(busy)} aria-label="Reject" onClick={()=>void decide(item.id,'rejected')}><X/></Button>
         </>}
        </div>
       </TableCell>
      </TableRow>;
     })}
    </TableBody>
   </Table>
  </div>

  {more&&<Button type="button" variant="outline" size="sm" disabled={loading} onClick={()=>void load(offset+25)}>More</Button>}

  <Sheet open={Boolean(open)} onOpenChange={v=>{if(!v)setOpen(null);}}>
   {open&&<SheetContent>
    <SheetHeader>
     <SheetTitle>{open.style_name}</SheetTitle>
     <Badge variant="secondary">{open.status}</Badge>
    </SheetHeader>
    <p className="text-xs text-muted-foreground">{open.sku_hint} · {open.primary_keyword}</p>
    {open.blog_title&&<a className="text-xs text-blue-600 underline" href={'/akay/blog-queue?q='+encodeURIComponent(open.blog_title)}>Blog · {open.blog_title}</a>}
    <p className="text-xs"><span className="font-medium">Angle</span> — {open.angle||'—'}</p>
    <p className="text-xs"><span className="font-medium">Prompt</span> — {open.ai_prompt||'—'}</p>
    {pinUrl(open)&&<a className="inline-flex items-center gap-1 text-xs text-blue-600 underline" href={pinUrl(open)} target="_blank" rel="noopener">Pinterest search <ExternalLink className="size-3"/></a>}
    {open.status==='queued'&&<div className="mt-auto flex gap-2 pt-2">
     <Button type="button" className="flex-1" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'approved')}><Check className="size-3.5"/> Approve</Button>
     <Button type="button" variant="outline" className="flex-1" disabled={Boolean(busy)} onClick={()=>void decide(open.id,'rejected')}><X className="size-3.5"/> Reject</Button>
    </div>}
   </SheetContent>}
  </Sheet>
 </div>;
}
