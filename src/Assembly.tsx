import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ExternalLink,RefreshCw} from 'lucide-react';
import './akay.css';
import {Button} from '@/akay/ui/button';
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/akay/ui/card';
import {Input,Select} from '@/akay/ui/input';
import {Progress} from '@/akay/ui/progress';
import {Separator} from '@/akay/ui/separator';

type Parent={
 id:string;
 name:string;
 description:string;
 introUrl:string;
 posterUrl:string;
 video?:string;
 heroVideo?:string;
 heroUrl?:string;
};
type InboxFile={name:string;bytes:number;mtime:string};
type ClonePlan={id:string;name:string;image:string;video:string;n:number};
type AssembleResult={
 dryRun:boolean;
 clones:ClonePlan[];
 demos:{id:string;name:string;demo:string}[];
 mode?:string;
};
type GenerateStatus={
 jobId:string;
 status:string;
 stage:string;
 percent:number;
 label:string;
 opening?:string|null;
 hero?:string|null;
 error?:string|null;
};

type MusicTrack={id:string;displayName:string;url:string;durationS:number};
type Template1Status={
 jobId:string;
 status:string;
 phase:string;
 percent:number;
 label:string;
 detail?:string;
 displayName?:string;
 cloneId?:string|null;
 demo?:string|null;
 spend?:{budget:number;used:number;remaining:number};
 palette?:{primary:string;secondary:string;cream:string}|null;
 moderationStop?:boolean;
 error?:string|null;
};

function kb(bytes:number){return Math.round(bytes/1024)+' KB'}
function usd(value:number|undefined){return '$'+(Number(value)||0).toFixed(2)}
function inboxPreviewUrl(name:string){return '/api/assembly?action=preview&file='+encodeURIComponent(name)}
function PhoneVideo({src,poster,label,loop=false}:{src:string;poster?:string;label:string;loop?:boolean}){
 return (
  <div className="space-y-1">
   <p className="text-xs font-medium text-muted-foreground">{label}</p>
   <div className="mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-md border bg-black">
    <video
     key={src}
     className="h-full w-full object-cover"
     src={src}
     poster={poster}
     controls
     playsInline
     preload="metadata"
     muted={loop}
     loop={loop}
    />
   </div>
  </div>
 );
}

const ASSEMBLE_STAGES=[
 {at:8,label:'Preparing clone…'},
 {at:28,label:'Encoding opening…'},
 {at:55,label:'Encoding hero loop…'},
 {at:78,label:'Patching registries…'},
 {at:92,label:'Writing catalogue assets…'}
];

export default function Assembly(){
 const [code,setCode]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [writable,setWritable]=useState(false);
 const [inboxPath,setInboxPath]=useState('work/assembly-inbox');
 const [parents,setParents]=useState<Parent[]>([]);
 const [parentId,setParentId]=useState('');
 const [inbox,setInbox]=useState<InboxFile[]>([]);
 const [opening,setOpening]=useState('');
 const [hero,setHero]=useState('');
 const [cloneName,setCloneName]=useState('');
 const [plan,setPlan]=useState<ClonePlan|null>(null);
 const [result,setResult]=useState<AssembleResult|null>(null);
 const [imageUrl,setImageUrl]=useState('');
 const [previewFile,setPreviewFile]=useState('');
 const [genJob,setGenJob]=useState<GenerateStatus|null>(null);
 const [assembleProgress,setAssembleProgress]=useState<{percent:number;label:string}|null>(null);
 const assembleTimer=useRef<ReturnType<typeof setInterval>|null>(null);
 const [tracks,setTracks]=useState<MusicTrack[]>([]);
 const [t1Pin,setT1Pin]=useState('');
 const [t1Name,setT1Name]=useState('');
 const [t1Groom,setT1Groom]=useState('Ashok');
 const [t1Bride,setT1Bride]=useState('Supriya');
 const [t1Music,setT1Music]=useState('');
 const [t1Budget,setT1Budget]=useState('4');
 const [t1Job,setT1Job]=useState<Template1Status|null>(null);

 useEffect(()=>{
  document.title='Assembly · FindMyInvite';
  const meta=document.createElement('meta');
  meta.name='robots';
  meta.content='noindex,nofollow';
  document.head.appendChild(meta);
  return()=>{meta.remove();};
 },[]);

 useEffect(()=>()=>{
  if(assembleTimer.current)clearInterval(assembleTimer.current);
 },[]);

 async function loadInbox(){
  const res=await fetch('/api/assembly?action=inbox',{credentials:'same-origin'});
  const body=await res.json().catch(()=>({}));
  if(res.status===401){setAuthed(false);return;}
  if(!res.ok)throw new Error(body.error||'Could not list inbox.');
  setInbox(body.inbox||[]);
  if(body.path)setInboxPath(String(body.path));
 }

 async function loadTracks(){
  const res=await fetch('/api/assembly?action=music-library',{credentials:'same-origin'});
  const body=await res.json().catch(()=>({}));
  if(res.status===401){setAuthed(false);return;}
  if(!res.ok)throw new Error(body.error||'Could not load music library.');
  const list:MusicTrack[]=body.tracks||[];
  setTracks(list);
  setT1Music(current=>current&&list.some(t=>t.id===current)?current:(list[0]?.id||''));
 }

 async function loadParents(preferId=''){
  const parentRes=await fetch('/api/assembly?action=parents',{credentials:'same-origin'});
  const parentBody=await parentRes.json().catch(()=>({}));
  if(parentRes.status===401){setAuthed(false);return [];}
  if(!parentRes.ok)throw new Error(parentBody.error||'Could not load Premium parents.');
  const list:Parent[]=parentBody.parents||[];
  setParents(list);
  setParentId(current=>{
   if(preferId&&list.some(item=>item.id===preferId))return preferId;
   if(current&&list.some(item=>item.id===current))return current;
   return list[0]?.id||'';
  });
  return list;
 }

 async function loadPlan(id:string,name=''){
  if(!id){setPlan(null);return;}
  const res=await fetch('/api/assembly?action=plan',{
   method:'POST',
   credentials:'same-origin',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({parentId:id,count:1,names:name?[name]:[]})
  });
  const body=await res.json().catch(()=>({}));
  if(res.status===401){setAuthed(false);return;}
  if(!res.ok)throw new Error(body.error||'Could not plan clone.');
  const next:ClonePlan|undefined=(body.clones||[])[0];
  setPlan(next||null);
  if(next)setCloneName(current=>current&&current!==next.name?current:next.name);
 }

 async function bootstrap(){
  setBusy(true);
  setError('');
  try{
   const statusRes=await fetch('/api/assembly?action=status',{credentials:'same-origin'});
   if(statusRes.status===401){setAuthed(false);return;}
   const status=await statusRes.json().catch(()=>({}));
   if(!statusRes.ok)throw new Error(status.error||'Could not open Assembly.');
   setAuthed(true);
   setWritable(Boolean(status.writable));
   if(status.inbox)setInboxPath(String(status.inbox));
   await loadParents();
   await loadTracks();
   if(status.writable)await loadInbox();
  }catch(err){
   setError(err instanceof Error?err.message:'Could not open Assembly.');
  }finally{
   setBusy(false);
  }
 }

 useEffect(()=>{
  if(!t1Job||t1Job.status!=='running')return;
  const timer=setInterval(()=>{
   void (async()=>{
    try{
     const res=await fetch('/api/assembly?action=template1-status&jobId='+encodeURIComponent(t1Job.jobId),{credentials:'same-origin'});
     const body=await res.json().catch(()=>({}));
     if(res.status===401){setAuthed(false);return;}
     if(!res.ok)throw new Error(body.error||'Template 1 status failed.');
     setT1Job(body);
     if(body.status==='preview'){
      await loadParents(parentId);
      await loadPlan(parentId);
     }
     if(body.status==='failed')setError(body.error||'Template 1 failed.');
    }catch(err){
     setError(err instanceof Error?err.message:'Template 1 status failed.');
    }
   })();
  },2500);
  return()=>clearInterval(timer);
 },[t1Job?.jobId,t1Job?.status]);

 async function onTemplate1Start(){
  const pin=t1Pin.trim();
  if(!pin){setError('Paste the Pinterest pin URL.');return;}
  if(!t1Name.trim()){setError('Give the clone a display name.');return;}
  if(!t1Music){setError('Pick a tap track from the music library.');return;}
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/assembly?action=template1-start',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     pinUrl:pin,
     displayName:t1Name.trim(),
     coupleNames:[t1Groom.trim(),t1Bride.trim()],
     parentId,
     musicId:t1Music,
     budgetUsd:Number(t1Budget)||4
    })
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){setAuthed(false);return;}
   if(!res.ok)throw new Error(body.error||'Could not start Template 1.');
   setT1Job({jobId:body.jobId,status:'running',phase:'queued',percent:0,label:'Queued…',spend:body.spend});
  }catch(err){
   setError(err instanceof Error?err.message:'Could not start Template 1.');
  }finally{
   setBusy(false);
  }
 }

 async function onTemplate1Cancel(){
  if(!t1Job)return;
  try{
   const res=await fetch('/api/assembly?action=template1-cancel',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:t1Job.jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Cancel failed.');
   setT1Job(body);
  }catch(err){
   setError(err instanceof Error?err.message:'Cancel failed.');
  }
 }

 useEffect(()=>{void bootstrap();},[]);

 useEffect(()=>{
  if(!authed||!parentId)return;
  setCloneName('');
  void loadPlan(parentId).catch(err=>setError(err instanceof Error?err.message:'Plan failed.'));
 },[authed,parentId]);

 useEffect(()=>{
  if(!genJob||genJob.status==='done'||genJob.status==='error')return;
  const timer=setInterval(()=>{
   void (async()=>{
    try{
     const res=await fetch('/api/assembly?action=generate-status&jobId='+encodeURIComponent(genJob.jobId),{credentials:'same-origin'});
     const body=await res.json().catch(()=>({}));
     if(res.status===401){setAuthed(false);return;}
     if(!res.ok)throw new Error(body.error||'Generate status failed.');
     setGenJob(body);
     if(body.status==='done'){
      await loadInbox();
      if(body.opening)setOpening(body.opening);
      if(body.hero)setHero(body.hero);
      setPreviewFile(body.opening||'');
     }
     if(body.status==='error')setError(body.error||'Generate failed.');
    }catch(err){
     setError(err instanceof Error?err.message:'Generate status failed.');
    }
   })();
  },1500);
  return()=>clearInterval(timer);
 },[genJob?.jobId,genJob?.status]);

 async function onGate(event:FormEvent){
  event.preventDefault();
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/analytics?action=gate',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gate:code})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Access denied.');
   setCode('');
   await bootstrap();
  }catch(err){
   setError(err instanceof Error?err.message:'Access denied.');
   setAuthed(false);
  }finally{
   setBusy(false);
  }
 }

 async function onUpload(files:FileList|null){
  if(!files?.length)return;
  setBusy(true);
  setError('');
  try{
   for(const file of Array.from(files)){
    const buffer=await file.arrayBuffer();
    const res=await fetch('/api/assembly?action=stage&filename='+encodeURIComponent(file.name),{
     method:'POST',
     credentials:'same-origin',
     headers:{
      'Content-Type':'application/octet-stream',
      'X-Assembly-Filename':file.name
     },
     body:buffer
    });
    const body=await res.json().catch(()=>({}));
    if(res.status===401){setAuthed(false);return;}
    if(!res.ok)throw new Error(body.error||'Upload failed for '+file.name);
   }
   await loadInbox();
  }catch(err){
   setError(err instanceof Error?err.message:'Upload failed.');
  }finally{
   setBusy(false);
  }
 }

 function clearAssembleProgress(){
  if(assembleTimer.current){
   clearInterval(assembleTimer.current);
   assembleTimer.current=null;
  }
  setAssembleProgress(null);
 }

 function startAssembleProgress(dryRun:boolean){
  clearAssembleProgress();
  if(dryRun){
   setAssembleProgress({percent:40,label:'Dry run…'});
   return;
  }
  let step=0;
  setAssembleProgress({percent:ASSEMBLE_STAGES[0].at,label:ASSEMBLE_STAGES[0].label});
  assembleTimer.current=setInterval(()=>{
   step=Math.min(step+1,ASSEMBLE_STAGES.length-1);
   setAssembleProgress({percent:ASSEMBLE_STAGES[step].at,label:ASSEMBLE_STAGES[step].label});
  },2800);
 }

 async function onGenerate(){
  const url=imageUrl.trim();
  if(!url){setError('Paste a Pinterest or image URL.');return;}
  setBusy(true);
  setError('');
  setGenJob(null);
  try{
   const res=await fetch('/api/assembly?action=generate-pair',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({imageUrl:url})
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){setAuthed(false);return;}
   if(!res.ok)throw new Error(body.error||'Could not start generate.');
   setGenJob({
    jobId:body.jobId,
    status:'running',
    stage:'queued',
    percent:0,
    label:'Queued…'
   });
  }catch(err){
   setError(err instanceof Error?err.message:'Could not start generate.');
  }finally{
   setBusy(false);
  }
 }

 async function onAssemble(dryRun:boolean){
  if(!parentId){setError('Pick a Premium parent.');return;}
  if(!opening){setError('Pick an opening video for the new clone.');return;}
  if(!plan){setError('Clone plan is not ready.');return;}
  setBusy(true);
  setError('');
  setResult(null);
  startAssembleProgress(dryRun);
  try{
   const res=await fetch('/api/assembly?action=assemble',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     parentId,
     opening,
     hero,
     names:[cloneName||plan.name],
     dryRun
    })
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){setAuthed(false);return;}
   if(!res.ok)throw new Error(body.error||'Assemble failed.');
   setAssembleProgress({percent:100,label:dryRun?'Dry run ready':'Loaded into clone'});
   setResult(body);
   if(!dryRun){
    await loadParents(parentId);
    await loadPlan(parentId);
    setOpening('');
    setHero('');
   }
  }catch(err){
   setError(err instanceof Error?err.message:'Assemble failed.');
   clearAssembleProgress();
  }finally{
   if(assembleTimer.current){
    clearInterval(assembleTimer.current);
    assembleTimer.current=null;
   }
   setBusy(false);
   if(!dryRun)setTimeout(()=>setAssembleProgress(null),1600);
   else setTimeout(()=>setAssembleProgress(null),900);
  }
 }

 const parent=parents.find(item=>item.id===parentId);
 const generating=Boolean(genJob&&genJob.status!=='done'&&genJob.status!=='error');
 const t1Running=Boolean(t1Job&&t1Job.status==='running');
 const canAssemble=Boolean(writable&&!busy&&!generating&&!t1Running&&parentId&&opening&&plan);
 const canRunT1=Boolean(writable&&!busy&&!generating&&!t1Running&&parentId&&t1Pin.trim()&&t1Name.trim()&&t1Music);

 if(!authed){
  return (
   <main className="akay-app flex min-h-svh items-center justify-center p-4">
    <Card className="w-full max-w-sm">
     <CardHeader>
      <CardTitle>Assembly</CardTitle>
      <CardDescription>Same access code as /akay.</CardDescription>
     </CardHeader>
     <CardContent>
      <form onSubmit={onGate} autoComplete="off" className="flex flex-col gap-3">
       <Input type="password" placeholder="Access code" value={code} onChange={e=>setCode(e.target.value)} autoFocus required/>
       {error&&<p className="text-xs text-red-600" role="alert">{error}</p>}
       <Button type="submit" disabled={busy}>{busy?'…':'Enter'}</Button>
      </form>
     </CardContent>
    </Card>
   </main>
  );
 }

 return (
  <div className="akay-app min-h-svh pb-16">
   <header className="border-b bg-background px-3 py-2">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
     <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Operator</p>
      <h1 className="text-sm font-semibold">Assembly</h1>
     </div>
     <Button type="button" variant="outline" size="sm" asChild>
      <a href="/akay">Back to Akay</a>
     </Button>
    </div>
   </header>

   <main className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
    {!writable&&(
     <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900" role="status">
      This host cannot write the git tree. Use Assembly on your local machine.
     </p>
    )}
    {error&&<p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700" role="alert">{error}</p>}

    <Card>
     <CardHeader>
      <CardTitle>1. Parent (read-only)</CardTitle>
      <CardDescription>Reference only — Assembly never changes the parent.</CardDescription>
     </CardHeader>
     <CardContent className="space-y-3">
      <Select value={parentId} onChange={e=>setParentId(e.target.value)} aria-label="Premium parent">
       {parents.map(item=><option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
      </Select>
      {parent&&(
       <>
        <div className="grid gap-3 sm:grid-cols-2">
         <PhoneVideo label="Opening" src={parent.introUrl} poster={parent.posterUrl}/>
         {parent.heroUrl
          ?<PhoneVideo label="Hero loop" src={parent.heroUrl} loop/>
          :<div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Hero loop</p>
            <div className="mx-auto flex aspect-[9/16] w-full max-w-[200px] items-center justify-center rounded-md border border-dashed bg-muted/40 px-3 text-center text-xs text-muted-foreground">
             No hero on this parent
            </div>
           </div>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
         <span className="line-clamp-2 flex-1">{parent.description}</span>
         <Button type="button" variant="outline" size="sm" asChild>
          <a href={'/invite/demo?template='+parent.id} target="_blank" rel="noreferrer">
           Parent demo <ExternalLink className="size-3.5"/>
          </a>
         </Button>
        </div>
       </>
      )}
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <CardTitle>Template 1 — one pin → preview clone</CardTitle>
      <CardDescription>Pin → stills + videos (Replicate / xAI) → mute + 3s hold → assemble on the parent above. Stops at preview. Publish stays with Akay.</CardDescription>
     </CardHeader>
     <CardContent className="space-y-3">
      {!writable&&(
       <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900" role="status">
        Template 1 needs ffmpeg + repo writes, so it runs on Akay's CloudAgent or your Cursor machine — not on findmyinvite.com. This card is a read-only view of the flow here; tell Akay “run Template 1” with a pin to start a job.
       </p>
      )}
      <Input
       type="url"
       placeholder="https://pin.it/… or https://www.pinterest.com/pin/…"
       value={t1Pin}
       disabled={!writable||busy||t1Running}
       onChange={e=>setT1Pin(e.target.value)}
       aria-label="Template 1 pin URL"
      />
      <div className="grid gap-2 sm:grid-cols-2">
       <Input maxLength={80} placeholder="Display name (e.g. Kaatrukulle)" value={t1Name} disabled={!writable||busy||t1Running} onChange={e=>setT1Name(e.target.value)} aria-label="Template 1 display name"/>
       <Select value={t1Music} disabled={!writable||busy||t1Running} onChange={e=>setT1Music(e.target.value)} aria-label="Template 1 tap music">
        {!tracks.length&&<option value="">No library tracks</option>}
        {tracks.map(track=><option key={track.id} value={track.id}>{track.displayName}{track.durationS?' · '+Math.round(track.durationS)+'s':''}</option>)}
       </Select>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
       <Input maxLength={40} placeholder="Groom" value={t1Groom} disabled={!writable||busy||t1Running} onChange={e=>setT1Groom(e.target.value)} aria-label="Template 1 groom name"/>
       <Input maxLength={40} placeholder="Bride" value={t1Bride} disabled={!writable||busy||t1Running} onChange={e=>setT1Bride(e.target.value)} aria-label="Template 1 bride name"/>
       <Input type="number" min={0.5} max={50} step={0.5} value={t1Budget} disabled={!writable||busy||t1Running} onChange={e=>setT1Budget(e.target.value)} aria-label="Template 1 budget USD"/>
      </div>
      <div className="flex flex-wrap gap-2">
       <Button type="button" disabled={!canRunT1} onClick={()=>void onTemplate1Start()}>{t1Running?'Running…':'Run Template 1'}</Button>
       {t1Running&&<Button type="button" variant="outline" onClick={()=>void onTemplate1Cancel()}>Cancel after current step</Button>}
      </div>
      {t1Job&&(
       <div className="space-y-2 rounded-md border p-2" role="status" data-testid="template1-status">
        <Progress value={t1Job.percent} label={t1Job.label}/>
        {t1Job.detail&&<p className="text-xs text-muted-foreground">{t1Job.detail}</p>}
        <p className="text-xs">
         Spend {usd(t1Job.spend?.used)} of {usd(t1Job.spend?.budget)} · remaining {usd(t1Job.spend?.remaining)}
         {t1Job.palette&&<span className="ml-2 inline-flex items-center gap-1 align-middle">
          <i className="inline-block size-3 rounded-full border" style={{background:t1Job.palette.primary}} aria-label={'Primary '+t1Job.palette.primary}/>
          <i className="inline-block size-3 rounded-full border" style={{background:t1Job.palette.secondary}} aria-label={'Secondary '+t1Job.palette.secondary}/>
          <i className="inline-block size-3 rounded-full border" style={{background:t1Job.palette.cream}} aria-label={'Paper '+t1Job.palette.cream}/>
         </span>}
        </p>
        {t1Job.moderationStop&&<p className="text-xs text-amber-800">Moderation stop — no auto-retry. Adjust the brief and run again.</p>}
        {t1Job.status==='preview'&&t1Job.demo&&(
         <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" asChild>
           <a href={t1Job.demo} target="_blank" rel="noreferrer">{t1Job.displayName||t1Job.cloneId} preview <ExternalLink className="size-3.5"/></a>
          </Button>
          <span className="text-xs text-muted-foreground">Preview the clone, then tell Akay: notes / regen / Publish.</span>
         </div>
        )}
       </div>
      )}
     </CardContent>
    </Card>

    <Card>
     <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
      <div className="space-y-1">
       <CardTitle>2. Inbox</CardTitle>
       <CardDescription>Generate from a Pinterest/image URL, or upload videos into <code className="text-[11px]">{inboxPath}</code>.</CardDescription>
      </div>
      <Button type="button" size="icon" variant="outline" disabled={!writable||busy||generating} aria-label="Refresh inbox" onClick={()=>void loadInbox().catch(err=>setError(err instanceof Error?err.message:'Inbox refresh failed.'))}>
       <RefreshCw className="size-3.5"/>
      </Button>
     </CardHeader>
     <CardContent className="space-y-3">
      <div className="space-y-2 rounded-md border p-2">
       <p className="text-xs font-medium">AI opening + hero</p>
       <Input
        type="url"
        placeholder="https://www.pinterest.com/pin/… or direct image URL"
        value={imageUrl}
        disabled={!writable||busy||generating}
        onChange={e=>setImageUrl(e.target.value)}
        aria-label="Pinterest or image URL"
       />
       <Button type="button" disabled={!writable||busy||generating||!imageUrl.trim()} onClick={()=>void onGenerate()}>
        {generating?'Generating…':'Generate opening + hero'}
       </Button>
       {genJob&&(
        <Progress value={genJob.percent} label={genJob.label+(genJob.status==='done'?' · saved to inbox':'')}/>
       )}
      </div>

      <Input
       type="file"
       accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.mkv"
       multiple
       disabled={!writable||busy||generating}
       onChange={e=>void onUpload(e.currentTarget.files)}
      />
      <Separator/>
      <ul className="space-y-2">
       {inbox.map(file=>(
        <li key={file.name} className="space-y-2 rounded-md border px-2 py-1.5 text-sm">
         <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium">{file.name}</span>
          <div className="flex shrink-0 items-center gap-2">
           <span className="text-xs text-muted-foreground">{kb(file.bytes)}</span>
           <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={()=>setPreviewFile(current=>current===file.name?'':file.name)}
           >
            {previewFile===file.name?'Hide':'Preview'}
           </Button>
          </div>
         </div>
         {previewFile===file.name&&(
          <PhoneVideo
           label={file.name.includes('-hero')?'Hero preview':'Opening preview'}
           src={inboxPreviewUrl(file.name)}
           loop={file.name.includes('-hero')}
          />
         )}
        </li>
       ))}
       {!inbox.length&&<li className="text-xs text-muted-foreground">No videos in inbox yet.</li>}
      </ul>
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <CardTitle>3. New clone</CardTitle>
      <CardDescription>Opening and hero apply only to this new template.</CardDescription>
     </CardHeader>
     <CardContent className="space-y-3">
      {plan?(
       <div className="space-y-1">
        <p className="font-mono text-[11px] text-muted-foreground">{plan.id}</p>
        <Input maxLength={80} value={cloneName} onChange={e=>setCloneName(e.target.value)} aria-label="Clone display name" placeholder="Display name"/>
       </div>
      ):(
       <p className="text-xs text-muted-foreground">Pick a parent to plan the next id.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
       <div className="space-y-2">
        <label className="space-y-1 text-sm">
         <span className="font-medium">Opening (required)</span>
         <Select value={opening} onChange={e=>setOpening(e.target.value)} aria-label="Clone opening video">
          <option value="">Inbox video…</option>
          {inbox.map(file=><option key={file.name} value={file.name}>{file.name}</option>)}
         </Select>
        </label>
        {opening
         ?<PhoneVideo label="Opening preview" src={inboxPreviewUrl(opening)}/>
         :<div className="mx-auto flex aspect-[9/16] w-full max-w-[200px] items-center justify-center rounded-md border border-dashed bg-muted/40 px-3 text-center text-xs text-muted-foreground">Pick an opening</div>}
       </div>
       <div className="space-y-2">
        <label className="space-y-1 text-sm">
         <span className="font-medium">Hero loop (optional)</span>
         <Select value={hero} onChange={e=>setHero(e.target.value)} aria-label="Clone hero video">
          <option value="">None</option>
          {inbox.map(file=><option key={file.name} value={file.name}>{file.name}</option>)}
         </Select>
        </label>
        {hero
         ?<PhoneVideo label="Hero preview" src={inboxPreviewUrl(hero)} loop/>
         :<div className="mx-auto flex aspect-[9/16] w-full max-w-[200px] items-center justify-center rounded-md border border-dashed bg-muted/40 px-3 text-center text-xs text-muted-foreground">No hero selected</div>}
       </div>
      </div>

      {assembleProgress&&(
       <Progress value={assembleProgress.percent} label={assembleProgress.label}/>
      )}

      <div className="flex flex-wrap gap-2">
       <Button type="button" variant="outline" disabled={!canAssemble} onClick={()=>void onAssemble(true)}>Dry run</Button>
       <Button type="button" disabled={!canAssemble} onClick={()=>void onAssemble(false)}>{busy&&!generating?'Loading into clone…':'Assemble into repo'}</Button>
      </div>
     </CardContent>
    </Card>

    {result&&(
     <Card>
      <CardHeader>
       <CardTitle>{result.dryRun?'Dry run ready':'Assembled'}</CardTitle>
       <CardDescription>{result.dryRun?'Parent untouched. Assemble when ready.':'Preview the new clone, then tell Akay: Publish.'}</CardDescription>
      </CardHeader>
      <CardContent>
       <ul className="space-y-2">
        {result.demos.map(demo=>(
         <li key={demo.id}>
          <Button type="button" variant="outline" size="sm" asChild>
           <a href={demo.demo}>{demo.name}</a>
          </Button>
         </li>
        ))}
       </ul>
      </CardContent>
     </Card>
    )}
   </main>
  </div>
 );
}
