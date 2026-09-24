import {useChat} from '@ai-sdk/react';
import {DefaultChatTransport,getToolName,isToolUIPart,type UIMessage} from 'ai';
import {
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
 type ChangeEvent,
 type FormEvent,
 type KeyboardEvent
} from 'react';
import './assembly-chat.css';

type JobStatus={
 jobId:string;
 status:string;
 phase:string;
 percent:number;
 label:string;
 detail?:string;
 displayName?:string;
 cloneId?:string|null;
 demo?:string|null;
 branch?:string|null;
 githubUrl?:string|null;
 previewUrl?:string|null;
 stills?:{first:string|null;last:string|null};
 error?:string|null;
};

function needsApproval(job:Pick<JobStatus,'status'|'phase'|'stills'>){
 const status=String(job.status||'');
 const phase=String(job.phase||'');
 if(status==='review'||phase==='review')return true;
 const hasStills=Boolean(job.stills?.first&&job.stills?.last);
 if((status==='failed'||status==='cancelled')&&hasStills)return true;
 return false;
}

type Attachment={id:string;url:string;name:string};

const JOB_KEY='fmi.assembly.t1JobId';
const CHAT_KEY='fmi.assembly.chatId';

function readStore(key:string){
 try{return sessionStorage.getItem(key)||'';}catch{return '';}
}
function writeStore(key:string,value:string){
 try{
  if(value)sessionStorage.setItem(key,value);
  else sessionStorage.removeItem(key);
 }catch{/* private mode */}
}

function fileToDataUrl(file:File){
 return new Promise<string>((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Could not read image.'));
  reader.onerror=()=>reject(new Error('Could not read image.'));
  reader.readAsDataURL(file);
 });
}

async function uploadImage(dataUrl:string,kind:'ref'|'person'|'hero'='ref'){
 const res=await fetch('/api/assembly-chat?action=upload',{
  method:'POST',
  credentials:'same-origin',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({dataUrl,kind})
 });
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(body.error||'Upload failed.');
 return String(body.url||'');
}

function messageText(message:UIMessage){
 return (message.parts||[])
  .filter((part):part is {type:'text';text:string}=>part.type==='text'&&typeof (part as {text?:string}).text==='string')
  .map(part=>part.text)
  .join('\n')
  .trim();
}

function toolPayload(part:Record<string,unknown>){
 const output=part.output??part.result;
 return output&&typeof output==='object'?output as Record<string,unknown>:null;
}

function collectUrls(value:unknown):string[]{
 if(typeof value==='string'&&/^https?:\/\//i.test(value))return [value];
 if(Array.isArray(value))return value.flatMap(collectUrls);
 if(value&&typeof value==='object'){
  const obj=value as Record<string,unknown>;
  return [
   ...collectUrls(obj.urls),
   ...collectUrls(obj.url),
   ...collectUrls(obj.previewUrl),
   ...collectUrls(obj.heroImageUrl),
   ...collectUrls(obj.imageUrl)
  ];
 }
 return [];
}

function Thinking({text,streaming}:{text:string;streaming?:boolean}){
 if(!text&&!streaming)return null;
 return (
  <details className="asm-chat-thinking" open={Boolean(streaming)}>
   <summary>{streaming?'Thinking…':'Thought process'}</summary>
   <pre>{text||'…'}</pre>
  </details>
 );
}

function Stills({urls,label}:{urls:string[];label?:string}){
 if(!urls.length)return null;
 return (
  <div className="asm-chat-images" role="group" aria-label={label||'Images'}>
   {urls.map((url,index)=>(
    <figure className="asm-chat-still" key={url+'-'+index}>
     <img src={url} alt={(label||'Image')+' '+(index+1)} loading="lazy"/>
     <figcaption>
      <span>{label||'Image'}{urls.length>1?' '+(index+1):''}</span>
      <a href={url} download target="_blank" rel="noreferrer">Download</a>
     </figcaption>
    </figure>
   ))}
  </div>
 );
}

function JobCard({jobId,onUpdate}:{jobId:string;onUpdate?:(job:JobStatus)=>void}){
 const [job,setJob]=useState<JobStatus|null>(null);
 const [err,setErr]=useState('');
 const [approveBusy,setApproveBusy]=useState(false);

 useEffect(()=>{
  let alive=true;
  async function poll(){
   try{
    const res=await fetch('/api/assembly?action=template1-status&jobId='+encodeURIComponent(jobId),{credentials:'same-origin'});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.error||'Status failed.');
    if(!alive)return;
    setJob(body);
    setErr('');
    onUpdate?.(body);
    writeStore(JOB_KEY,body.jobId||jobId);
   }catch(error){
    if(alive)setErr(error instanceof Error?error.message:'Status failed.');
   }
  }
  void poll();
  const timer=window.setInterval(()=>void poll(),2000);
  return()=>{alive=false;window.clearInterval(timer);};
 },[jobId,onUpdate]);

 async function approve(){
  if(!job||approveBusy)return;
  setApproveBusy(true);
  setErr('');
  try{
   const res=await fetch('/api/assembly?action=template1-proceed',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:job.jobId||jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Approve failed.');
   setJob(body);
   onUpdate?.(body);
  }catch(error){
   setErr(error instanceof Error?error.message:'Approve failed.');
  }finally{
   setApproveBusy(false);
  }
 }

 const percent=Math.max(4,Math.min(100,Number(job?.percent)||4));
 const vibe=String(job?.displayName||'').trim();
 const showApprove=job?needsApproval(job):false;

 return (
  <div className="asm-chat-progress" data-testid="asm-chat-progress">
   <h3>{vibe||job?.label||'Working on your invite…'}</h3>
   {vibe&&job?.label&&<p className="asm-chat-status">{job.label}</p>}
   <p>{job?.detail||err||'Live Template 1 progress'}</p>
   <div className="asm-chat-bar" aria-hidden="true"><i style={{width:percent+'%'}}/></div>
   <p>{percent}% · {job?.phase||'…'}{job?.status?' · '+job.status:''}{vibe?' · VIBE '+vibe:''}</p>
   {(job?.stills?.first||job?.stills?.last)&&(
    <Stills label="Opening stills" urls={[job.stills?.first,job.stills?.last].filter((u):u is string=>Boolean(u))}/>
   )}
   {showApprove&&(
    <div className="asm-chat-approve-row">
     <button
      type="button"
      className="asm-chat-approve"
      disabled={approveBusy}
      onClick={()=>void approve()}
     >
      {approveBusy?'Approving…':'Approve'}
     </button>
    </div>
   )}
   {(job?.previewUrl||job?.demo||job?.githubUrl)&&(
    <div className="asm-chat-preview-card">
     {(job.previewUrl||job.demo)&&(
      <a href={job.previewUrl||job.demo||'#'} target="_blank" rel="noreferrer">{job.previewUrl||job.demo}</a>
     )}
     {job.githubUrl&&<a href={job.githubUrl} target="_blank" rel="noreferrer">{job.branch||'GitHub branch'}</a>}
    </div>
   )}
   {job?.error&&<p className="asm-chat-alert" role="alert">{job.error}</p>}
  </div>
 );
}

function MessageView({
 message,
 onChip,
 busy
}:{
 message:UIMessage;
 onChip:(text:string)=>void;
 busy:boolean;
}){
 const nodes:React.ReactNode[]=[];
 const parts=message.parts||[];

 for(let i=0;i<parts.length;i++){
  const part=parts[i] as Record<string,unknown> & {type:string};
  if(part.type==='text'&&typeof part.text==='string'&&part.text.trim()){
   nodes.push(<div className="asm-chat-bubble" key={message.id+'-t-'+i}>{part.text}</div>);
   continue;
  }
  if(part.type==='reasoning'||part.type==='thinking'){
   nodes.push(
    <Thinking
     key={message.id+'-r-'+i}
     text={String(part.text||part.reasoning||'')}
     streaming={part.state==='streaming'}
    />
   );
   continue;
  }
  if(isToolUIPart(part as never)){
   const name=getToolName(part as never);
   const state=String(part.state||'');
   const output=toolPayload(part);
   const urls=[...new Set(collectUrls(output))];
   const foundJobId=typeof output?.jobId==='string'?output.jobId:'';
   nodes.push(
    <div className="asm-chat-tool" key={message.id+'-tool-'+i}>
     <strong>{name}</strong>
     {' · '}
     {state==='output-available'||state==='result'?'done':(state.replace(/-/g,' ')||'running')}
    </div>
   );
   if(urls.length)nodes.push(<Stills key={message.id+'-img-'+i} urls={urls} label={name}/>);
   if(foundJobId)nodes.push(<JobCard key={message.id+'-job-'+i} jobId={foundJobId}/>);
   if(name==='list_music'&&Array.isArray(output?.tracks)){
    const tracks=output.tracks as Array<{id?:string;displayName?:string}>;
    nodes.push(
     <div className="asm-chat-chips" key={message.id+'-music-'+i}>
      {tracks.map(track=>(
       <button
        key={String(track.id)}
        type="button"
        className="asm-chat-chip"
        disabled={busy}
        onClick={()=>onChip('Use music track "'+(track.displayName||track.id)+'" (id: '+track.id+').')}
       >
        {track.displayName||track.id}
       </button>
      ))}
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>onChip('Skip music — use the default track.')}>Skip</button>
     </div>
    );
   }
   if(name==='mix_image'&&urls[0]){
    nodes.push(
     <div className="asm-chat-chips" key={message.id+'-mix-'+i}>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>onChip('Lock this final image: '+urls[0])}>Lock this image</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>onChip('Remix with a stronger style twist.')}>Remix</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>onChip('Retry the image mix.')}>Retry</button>
     </div>
    );
   }
   continue;
  }
  if(part.type==='file'&&typeof part.url==='string'&&String(part.mediaType||'').startsWith('image/')){
   nodes.push(<Stills key={message.id+'-file-'+i} urls={[part.url]} label="Attachment"/>);
  }
 }

 if(message.role==='user'&&!nodes.length){
  const fallback=messageText(message);
  if(fallback)nodes.push(<div className="asm-chat-bubble" key={message.id+'-fb'}>{fallback}</div>);
 }

 return <>{nodes}</>;
}

export default function AssemblyChat({
 parentId,
 cloud,
 onUnauth
}:{
 parentId:string;
 cloud:boolean;
 writable:boolean;
 onUnauth:()=>void;
}){
 const [input,setInput]=useState('');
 const [attachments,setAttachments]=useState<Attachment[]>([]);
 const [localError,setLocalError]=useState('');
 const [jobId,setJobId]=useState(()=>readStore(JOB_KEY));
 const [vibeName,setVibeName]=useState('');
 const bottomRef=useRef<HTMLDivElement|null>(null);
 const fileRef=useRef<HTMLInputElement|null>(null);
 const cameraRef=useRef<HTMLInputElement|null>(null);

 const chatId=useMemo(()=>{
  const existing=readStore(CHAT_KEY);
  if(existing)return existing;
  const id=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'chat-'+Date.now();
  writeStore(CHAT_KEY,id);
  return id;
 },[]);

  const welcome=useMemo<UIMessage[]>(()=>[{
  id:'asm-welcome',
  role:'assistant',
  parts:[{
   type:'text',
   text:'Hi — I\'m your Assembly Coach. Paste a Pinterest pin (or attach / snap a photo), and I\'ll mix a hero image then run Template 1 with you.'
  }]
 }],[]);

 const [providerLabel,setProviderLabel]=useState('');

 useEffect(()=>{
  let alive=true;
  (async()=>{
   try{
    const res=await fetch('/api/assembly-chat?action=bootstrap',{credentials:'same-origin'});
    const body=await res.json().catch(()=>({}));
    if(!alive||!res.ok)return;
    const label=[body.provider,body.model].filter(Boolean).join(' · ');
    setProviderLabel(label);
   }catch{/* ignore */}
  })();
  return()=>{alive=false;};
 },[]);

 const transport=useMemo(()=>new DefaultChatTransport({
  api:'/api/assembly-chat',
  credentials:'include',
  body:{parentId,chatId},
  fetch:async(input,init)=>{
   const res=await fetch(input,init);
   if(!res.ok){
    let detail='';
    try{
     const type=res.headers.get('content-type')||'';
     if(type.includes('application/json')){
      const body=await res.clone().json();
      detail=String(body.error||body.message||'');
     }else{
      detail=(await res.clone().text()).slice(0,240);
     }
    }catch{/* ignore */}
    if(res.status===404){
     throw new Error(detail||'Chat API not found (404). Restart the Vite/dev server so /api/assembly-chat is mounted.');
    }
    if(res.status===503){
     throw new Error(detail||'Chat backend not ready (missing OPENAI_API_KEY?).');
    }
    if(res.status===401){
     throw new Error(detail||'Session expired — open /akay and enter the access code.');
    }
    throw new Error(detail||('Chat failed ('+res.status+').'));
   }
   return res;
  }
 }),[parentId,chatId]);

 const {messages,sendMessage,status,error,setMessages,stop}=useChat({
  transport,
  messages:welcome
 });
 const busy=status==='submitted'||status==='streaming';

 useEffect(()=>{
  bottomRef.current?.scrollIntoView({behavior:'smooth',block:'end'});
 },[messages,status,attachments.length]);

 useEffect(()=>{
  if(!error)return;
  if(/401|access code|akay|session expired/i.test(error.message))onUnauth();
 },[error,onUnauth]);

 const sendChip=useCallback((text:string)=>{
  if(!text.trim()||busy)return;
  void sendMessage({text:text.trim()});
 },[busy,sendMessage]);

 async function addFiles(list:FileList|null,kind:'ref'|'hero'='ref'){
  if(!list?.length)return;
  setLocalError('');
  try{
   const next:Attachment[]=[];
   for(const file of Array.from(list).slice(0,4)){
    if(!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type))throw new Error('Use JPEG, PNG, or WebP.');
    if(file.size>8*1024*1024)throw new Error('Each image must be under 8MB.');
    const dataUrl=await fileToDataUrl(file);
    const url=await uploadImage(dataUrl,kind==='hero'?'hero':'ref');
    next.push({id:url,url,name:file.name||'photo'});
   }
   setAttachments(prev=>[...prev,...next].slice(-6));
  }catch(err){
   setLocalError(err instanceof Error?err.message:'Upload failed.');
  }
 }

 async function onSubmit(event?:FormEvent){
  event?.preventDefault();
  const text=input.trim();
  if((!text&&!attachments.length)||busy)return;
  setLocalError('');
  const lines=attachments.map((item,i)=>'Attached image '+(i+1)+': '+item.url).join('\n');
  const payload=[text,lines].filter(Boolean).join('\n\n');
  setInput('');
  setAttachments([]);
  try{
   await sendMessage({text:payload});
  }catch(err){
   setLocalError(err instanceof Error?err.message:'Could not send.');
  }
 }

 function onKeyDown(event:KeyboardEvent<HTMLTextAreaElement>){
  if(event.key==='Enter'&&!event.shiftKey){
   event.preventDefault();
   void onSubmit();
  }
 }

 async function cancelJob(){
  if(!jobId)return;
  setLocalError('');
  try{
   const res=await fetch('/api/assembly?action=template1-cancel',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){onUnauth();return;}
   if(!res.ok)throw new Error(body.error||'Cancel failed.');
   void sendMessage({text:'Cancelled Template 1 job '+jobId+'.'});
  }catch(err){
   setLocalError(err instanceof Error?err.message:'Cancel failed.');
  }
 }

 return (
  <div className="asm-chat-shell" data-testid="asm-chat">
   <aside className="asm-chat-rail" aria-label="Operator controls">
    <p className="asm-chat-brand">Assembly desk</p>
    <p className="asm-chat-status">{cloud?'Cloud Template 1':'Local Template 1'}</p>
    {providerLabel&&<p className="asm-chat-status">{providerLabel}</p>}
    {jobId&&<p className="asm-chat-status">Job {jobId}</p>}
    {vibeName&&<p className="asm-chat-status">VIBE · {vibeName}</p>}
    <a className="asm-chat-link" href="/assembly/pipeline">Pipeline</a>
    <button type="button" className="asm-chat-ghost" disabled={!jobId||busy} onClick={()=>void cancelJob()}>Cancel job</button>
    <button type="button" className="asm-chat-ghost" disabled={!jobId||busy} onClick={()=>sendChip('Retry / resume the Template 1 job '+jobId+'.')}>Retry / resume</button>
    <button
     type="button"
     className="asm-chat-ghost"
     onClick={()=>{setMessages(welcome);writeStore(JOB_KEY,'');setJobId('');setVibeName('');}}
    >
     New chat
    </button>
   </aside>

   <header className="asm-chat-top">
    <p className="asm-chat-brand">FindMyInvite · Assembly</p>
    <div className="asm-chat-top-actions">
     <a className="asm-chat-link" href="/assembly/pipeline">Pipeline</a>
     <button type="button" className="asm-chat-ghost" disabled={!jobId||busy} onClick={()=>void cancelJob()}>Cancel</button>
     <button type="button" className="asm-chat-ghost" disabled={!jobId||busy} onClick={()=>sendChip('Retry / resume the Template 1 job '+jobId+'.')}>Retry</button>
    </div>
   </header>

   <div className="asm-chat-thread" role="log" aria-live="polite">
    {messages.map(message=>(
     <article className="asm-chat-msg" data-role={message.role} key={message.id}>
      <MessageView message={message} onChip={sendChip} busy={busy}/>
     </article>
    ))}

    {messages.length<=1&&(
     <div className="asm-chat-chips" style={{marginTop:4}}>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>sendChip('Hi! I have a Pinterest pin ready.')}>I have a Pin</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>sendChip('Hi — I will upload or take a hero photo instead of a Pin.')}>Upload / camera</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>sendChip('Hi — show me the music library first.')}>Pick music</button>
     </div>
    )}

    {jobId&&<JobCard jobId={jobId} onUpdate={job=>{
     if(job.jobId)setJobId(job.jobId);
     if(job.displayName)setVibeName(job.displayName);
    }}/>}

    {busy&&<p className="asm-chat-status">Thinking…</p>}
    <div ref={bottomRef}/>
   </div>

   <form className="asm-chat-composer" onSubmit={event=>void onSubmit(event)}>
    <div className="asm-chat-composer-inner">
     {(localError||error?.message)&&(
      <p className="asm-chat-alert" role="alert">{localError||error?.message}</p>
     )}
     {!!attachments.length&&(
      <div className="asm-chat-thumbs">
       {attachments.map(item=>(
        <div className="asm-chat-thumb" key={item.id}>
         <img src={item.url} alt={item.name}/>
         <button type="button" aria-label="Remove" onClick={()=>setAttachments(prev=>prev.filter(x=>x.id!==item.id))}>×</button>
        </div>
       ))}
      </div>
     )}
     <div className="asm-chat-attach-row">
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>fileRef.current?.click()}>Attach</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>cameraRef.current?.click()}>Camera</button>
      <button type="button" className="asm-chat-chip" disabled={busy} onClick={()=>sendChip('Skip this optional step.')}>Skip</button>
      {busy&&<button type="button" className="asm-chat-chip" onClick={()=>stop()}>Stop</button>}
     </div>
     <div className="asm-chat-input-row">
      <textarea
       rows={1}
       placeholder="Message Assembly…"
       value={input}
       disabled={busy&&status==='submitted'}
       onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>setInput(event.target.value)}
       onKeyDown={onKeyDown}
       aria-label="Message"
      />
      <button className="asm-chat-send" type="submit" disabled={busy||(!input.trim()&&!attachments.length)} aria-label="Send">↑</button>
     </div>
     <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event=>{void addFiles(event.target.files);event.target.value='';}}/>
     <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={event=>{void addFiles(event.target.files,'hero');event.target.value='';}}/>
    </div>
   </form>
  </div>
 );
}
