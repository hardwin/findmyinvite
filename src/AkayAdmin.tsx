import {Component,useEffect,useMemo,useState,type FormEvent,type MouseEvent,type ReactNode} from 'react';
import {Area,AreaChart,Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {Lock,RefreshCw} from 'lucide-react';
import './akay.css';
import './akay-admin.css';
import {Button} from '@/akay/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/akay/ui/card';
import {Input} from '@/akay/ui/input';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/akay/ui/table';
import {Tabs,TabsList,TabsTrigger} from '@/akay/ui/tabs';
import AkayShortlist from './AkayShortlist';
import AkayCompetitors from './AkayCompetitors';
import AkayUpcoming from './AkayUpcoming';
import AkayBlogQueue from './AkayBlogQueue';
import AkayInspirations from './AkayInspirations';

type Insights={
 totals:{pageviews:number;sessions:number;visitors:number;avgDwellMs:number;events:number};
 byDay:{day:string;pageviews:number;sessions:number}[];
 pages:{path:string;views:number;visitors:number;avgDwellMs:number;totalDwellMs:number}[];
 flow:{from:string;to:string;count:number}[];
 journeys:{session:string;steps:string[];durationMs:number;lastSeen:string}[];
 funnel:{step:string;count:number}[];
 recent:{at:string;path:string;type:string;dwellMs:number}[];
};
type Section='traffic'|'journeys'|'live'|'shortlist'|'competitors'|'upcoming'|'blog-queue'|'inspirations';
const nav:{id:Section;href:string;label:string}[]=[
 {id:'traffic',href:'/akay',label:'Traffic'},
 {id:'journeys',href:'/akay/journeys',label:'Journeys'},
 {id:'live',href:'/akay/live',label:'Live'},
 {id:'shortlist',href:'/akay/shortlist',label:'Shortlist'},
 {id:'competitors',href:'/akay/competitors',label:'Competitors'},
 {id:'upcoming',href:'/akay/upcoming',label:'Upcoming'},
 {id:'blog-queue',href:'/akay/blog-queue',label:'Blog'},
 {id:'inspirations',href:'/akay/inspirations',label:'Styles'}
];
function sectionOf(path=location.pathname):Section{
 const rest=path.replace(/^\/akay\/?/,'').replace(/\/$/,'');
 if(rest==='shortlist'||rest.startsWith('shortlist?'))return 'shortlist';
 if(rest==='competitors'||rest.startsWith('competitors?'))return 'competitors';
 if(rest==='upcoming'||rest.startsWith('upcoming?'))return 'upcoming';
 if(rest==='blog-queue'||rest.startsWith('blog-queue?'))return 'blog-queue';
 if(rest==='inspirations'||rest.startsWith('inspirations?'))return 'inspirations';
 if(rest==='journeys')return 'journeys';
 if(rest==='live')return 'live';
 return 'traffic';
}
function isOps(section:Section){return section==='shortlist'||section==='competitors'||section==='upcoming'||section==='blog-queue'||section==='inspirations';}
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
 static getDerivedStateFromError(error:Error){return {message:error.message||'Panel failed.'};}
 render(){return this.state.message?<p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700" role="alert">{this.state.message}</p>:this.props.children;}
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
  }catch(err){setError(err instanceof Error?err.message:'Could not load insights.');}
  finally{setLoading(false);}
 }

 useEffect(()=>{void load(days);},[days]);

 async function enter(event:FormEvent){
  event.preventDefault();setError('');setLoading(true);
  try{
   const res=await fetch('/api/analytics?action=gate',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({gate})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Access denied.');
   setGate('');setAuthed(true);await load(days);
  }catch(err){setError(err instanceof Error?err.message:'Access denied.');setAuthed(false);}
  finally{setLoading(false);}
 }

 async function leave(){
  await fetch('/api/analytics?action=leave-gate',{method:'POST',credentials:'same-origin'});
  setAuthed(false);setInsights(null);setGate('');
 }

 function go(event:MouseEvent<HTMLAnchorElement>,href:string,id:Section){
  event.preventDefault();
  if(location.pathname!==href)history.pushState({},'',href);
  setSection(id);
 }

 const byDay=insights?.byDay||[];
 const pages=insights?.pages||[];
 const funnel=insights?.funnel||[];
 const flow=insights?.flow||[];
 const journeys=insights?.journeys||[];
 const recent=insights?.recent||[];
 const chartData=useMemo(()=>byDay.map(d=>({day:d.day.slice(5),views:d.pageviews,sessions:d.sessions})),[byDay]);
 const funnelData=useMemo(()=>funnel.map(f=>({name:f.step,count:f.count})),[funnel]);

 if(!authed){
  return <main className="akay-app flex min-h-svh items-center justify-center p-4">
   <Card className="w-full max-w-sm">
    <CardHeader>
     <CardTitle>Operator</CardTitle>
    </CardHeader>
    <CardContent>
     <form onSubmit={enter} autoComplete="off" className="flex flex-col gap-3">
      <Input type="password" inputMode="numeric" autoComplete="off" placeholder="Access code" value={gate} onChange={e=>setGate(e.target.value)} required/>
      {error&&<p className="text-xs text-red-600" role="alert">{error}</p>}
      <Button type="submit" disabled={loading}>{loading?'…':'Enter'}</Button>
     </form>
    </CardContent>
   </Card>
  </main>;
 }

 const totals=insights?.totals;

 return <div className="akay-app pb-16">
  <header className="sticky top-0 z-40 border-b bg-background/95 px-3 py-2 backdrop-blur">
   <div className="mx-auto flex max-w-6xl flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
     <Tabs value={section} onValueChange={v=>{
      const item=nav.find(n=>n.id===v);
      if(!item)return;
      if(location.pathname!==item.href)history.pushState({},'',item.href);
      setSection(item.id);
     }}>
      <TabsList className="h-8 w-full justify-start overflow-x-auto">
       {nav.map(item=><TabsTrigger key={item.id} value={item.id} className="px-2">{item.label}</TabsTrigger>)}
      </TabsList>
     </Tabs>
     <div className="flex shrink-0 items-center gap-1">
      {!isOps(section)&&[1,7,30].map(n=>(
       <Button key={n} type="button" size="sm" variant={days===n?'default':'outline'} onClick={()=>setDays(n)}>{n===1?'24h':n+'d'}</Button>
      ))}
      {!isOps(section)&&<Button type="button" size="icon" variant="ghost" aria-label="Refresh" onClick={()=>void load(days)}><RefreshCw className="size-3.5"/></Button>}
      <Button type="button" size="icon" variant="ghost" aria-label="Lock" onClick={()=>void leave()}><Lock className="size-3.5"/></Button>
     </div>
    </div>
   </div>
  </header>

  <main className="mx-auto max-w-6xl space-y-3 p-3">
   {error&&!isOps(section)&&<p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700" role="alert">{error}</p>}
   {!isOps(section)&&loading&&!insights&&<p className="text-sm text-muted-foreground">Loading…</p>}

   {section==='traffic'&&insights&&<DeskPanel>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
     {[
      ['Views',totals?.pageviews??0],
      ['Visitors',totals?.visitors??0],
      ['Sessions',totals?.sessions??0],
      ['Avg',formatMs(totals?.avgDwellMs||0)]
     ].map(([label,value])=>(
      <Card key={String(label)}><CardContent className="p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></CardContent></Card>
     ))}
    </div>
    <Card>
     <CardHeader className="pb-1"><CardTitle>Traffic</CardTitle></CardHeader>
     <CardContent className="h-40">
      {chartData.length?(
       <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
         <CartesianGrid strokeDasharray="3 3" vertical={false}/>
         <XAxis dataKey="day" tick={{fontSize:10}}/>
         <YAxis tick={{fontSize:10}} width={28}/>
         <Tooltip/>
         <Area type="monotone" dataKey="views" stroke="hsl(221 83% 53%)" fill="hsl(221 83% 53% / 0.15)" strokeWidth={2}/>
        </AreaChart>
       </ResponsiveContainer>
      ):<p className="text-xs text-muted-foreground">No data</p>}
     </CardContent>
    </Card>
    <div className="grid gap-2 md:grid-cols-2">
     <Card>
      <CardHeader className="pb-1"><CardTitle>Funnel</CardTitle></CardHeader>
      <CardContent className="h-40">
       <ResponsiveContainer width="100%" height="100%">
        <BarChart data={funnelData} margin={{top:4,right:4,left:0,bottom:0}}>
         <CartesianGrid strokeDasharray="3 3" vertical={false}/>
         <XAxis dataKey="name" tick={{fontSize:9}} interval={0} angle={-20} textAnchor="end" height={48}/>
         <YAxis tick={{fontSize:10}} width={28}/>
         <Tooltip/>
         <Bar dataKey="count" fill="hsl(221 83% 53%)" radius={[3,3,0,0]}/>
        </BarChart>
       </ResponsiveContainer>
      </CardContent>
     </Card>
     <Card>
      <CardHeader className="pb-1"><CardTitle>Pages</CardTitle></CardHeader>
      <CardContent className="p-0">
       <Table>
        <TableHeader><TableRow><TableHead>Path</TableHead><TableHead>Views</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
        <TableBody>
         {pages.slice(0,12).map(page=>(
          <TableRow key={page.path}><TableCell className="max-w-[10rem] truncate font-mono text-xs">{page.path}</TableCell><TableCell className="tabular-nums">{page.views}</TableCell><TableCell className="tabular-nums text-xs">{formatMs(page.avgDwellMs)}</TableCell></TableRow>
         ))}
         {!pages.length&&<TableRow><TableCell colSpan={3} className="text-muted-foreground">No pages</TableCell></TableRow>}
        </TableBody>
       </Table>
      </CardContent>
     </Card>
    </div>
   </DeskPanel>}

   {section==='journeys'&&insights&&<DeskPanel>
    <Card>
     <CardHeader className="pb-1"><CardTitle>Flows</CardTitle></CardHeader>
     <CardContent className="p-0">
      <Table>
       <TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>n</TableHead></TableRow></TableHeader>
       <TableBody>
        {flow.slice(0,30).map(item=>(
         <TableRow key={item.from+item.to}><TableCell className="font-mono text-xs">{item.from}</TableCell><TableCell className="font-mono text-xs">{item.to}</TableCell><TableCell className="tabular-nums">{item.count}</TableCell></TableRow>
        ))}
        {!flow.length&&<TableRow><TableCell colSpan={3} className="text-muted-foreground">No flows</TableCell></TableRow>}
       </TableBody>
      </Table>
     </CardContent>
    </Card>
    <Card>
     <CardHeader className="pb-1"><CardTitle>Sessions</CardTitle></CardHeader>
     <CardContent className="space-y-2">
      {journeys.slice(0,20).map(j=>(
       <div key={j.session+String(j.lastSeen)} className="rounded-md border px-2 py-1.5 text-xs">
        <div className="flex flex-wrap gap-1">{(j.steps||[]).map((step,i)=><span key={step+i} className="rounded bg-muted px-1.5 py-0.5">{step}</span>)}</div>
        <p className="mt-1 text-muted-foreground">{formatMs(j.durationMs)} · {formatTime(String(j.lastSeen))}</p>
       </div>
      ))}
      {!journeys.length&&<p className="text-xs text-muted-foreground">No journeys</p>}
     </CardContent>
    </Card>
   </DeskPanel>}

   {section==='live'&&insights&&<DeskPanel>
    <Card>
     <CardHeader className="pb-1"><CardTitle>Live</CardTitle></CardHeader>
     <CardContent className="p-0">
      <Table>
       <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Type</TableHead><TableHead>Path</TableHead><TableHead>Dwell</TableHead></TableRow></TableHeader>
       <TableBody>
        {recent.slice(0,40).map((row,i)=>(
         <TableRow key={String(row.at)+row.path+i}>
          <TableCell className="whitespace-nowrap text-xs">{formatTime(String(row.at))}</TableCell>
          <TableCell className="text-xs">{row.type}</TableCell>
          <TableCell className="max-w-[12rem] truncate font-mono text-xs">{row.path}</TableCell>
          <TableCell className="tabular-nums text-xs">{row.dwellMs?formatMs(row.dwellMs):'—'}</TableCell>
         </TableRow>
        ))}
        {!recent.length&&<TableRow><TableCell colSpan={4} className="text-muted-foreground">No events</TableCell></TableRow>}
       </TableBody>
      </Table>
     </CardContent>
    </Card>
   </DeskPanel>}

   {section==='shortlist'&&<DeskPanel><AkayShortlist/></DeskPanel>}
   {section==='competitors'&&<DeskPanel><AkayCompetitors/></DeskPanel>}
   {section==='upcoming'&&<DeskPanel><AkayUpcoming/></DeskPanel>}
   {section==='blog-queue'&&<DeskPanel><AkayBlogQueue/></DeskPanel>}
   {section==='inspirations'&&<DeskPanel><AkayInspirations/></DeskPanel>}
  </main>

  <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t bg-background px-2 py-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom))] md:hidden" aria-label="Operator">
   {nav.map(item=>(
    <a key={item.id} href={item.href} aria-current={section===item.id?'page':undefined} onClick={e=>go(e,item.href,item.id)}
     className={'shrink-0 rounded-md px-2.5 py-2 text-xs font-medium '+(section===item.id?'bg-muted text-foreground':'text-muted-foreground')}>{item.label}</a>
   ))}
  </nav>
 </div>;
}
