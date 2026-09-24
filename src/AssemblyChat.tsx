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
 type KeyboardEvent,
 type ReactNode
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
 regenRole?:string|null;
 error?:string|null;
};

type Attachment={id:string;url:string;name:string};

type ChatRecord={
 id:string;
 title:string;
 updatedAt:number;
 messages:UIMessage[];
 jobId?:string;
};

const JOB_KEY='fmi.assembly.t1JobId';
const CHAT_KEY='fmi.assembly.chatId';
const CHATS_KEY='fmi.assembly.chats.v1';
const ACTIVE_KEY='fmi.assembly.activeChatId';

const SUGGESTIONS=[
 {emo:'💍',text:'We are planning our wedding — help me shape the digital invite'},
 {emo:'✨',text:'I want a dreamy anime-style couple portrait for the opening'},
 {emo:'🌸',text:'Talk me through the mood first — temple, garden, or modern glam?'}
];

function readSession(key:string){
 try{return sessionStorage.getItem(key)||'';}catch{return '';}
}
function writeSession(key:string,value:string){
 try{
  if(value)sessionStorage.setItem(key,value);
  else sessionStorage.removeItem(key);
 }catch{/* private */}
}
function readChats():ChatRecord[]{
 try{
  const raw=localStorage.getItem(CHATS_KEY);
  if(!raw)return [];
  const parsed=JSON.parse(raw);
  return Array.isArray(parsed)?parsed as ChatRecord[]:[];
 }catch{return [];}
}
function writeChats(list:ChatRecord[]){
 try{localStorage.setItem(CHATS_KEY,JSON.stringify(list.slice(0,40)));}catch{/* */}
}
function newId(){
 return (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'c-'+Date.now();
}
function messageText(message:UIMessage){
 return (message.parts||[])
  .filter((part):part is {type:'text';text:string}=>part.type==='text'&&typeof (part as {text?:string}).text==='string')
  .map(part=>part.text)
  .join('\n')
  .trim();
}
function titleFrom(messages:UIMessage[]){
 for(const message of messages){
  if(message.role!=='user')continue;
  const text=messageText(message).replace(/\s+/g,' ').trim();
  if(text)return text.slice(0,48)+(text.length>48?'…':'');
 }
 return 'New chat';
}
function needsApproval(job:Pick<JobStatus,'status'|'phase'|'stills'>){
 const status=String(job.status||'');
 const phase=String(job.phase||'');
 if(status==='review'||phase==='review')return true;
 const has=Boolean(job.stills?.first&&job.stills?.last);
 return (status==='failed'||status==='cancelled')&&has;
}
function fileToDataUrl(file:File){
 return new Promise<string>((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Could not read image.'));
  reader.onerror=()=>reject(new Error('Could not read image.'));
  reader.readAsDataURL(file);
 });
}
async function uploadImage(dataUrl:string,kind:'ref'|'hero'='ref'){
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

function Icon({d,size=18}:{d:string;size?:number}){
 return (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
   <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
 );
}

function CameraIcon({size=20}:{size?:number}){
 return (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
   <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
 );
}

function Stills({urls,label}:{urls:string[];label?:string}){
 if(!urls.length)return null;
 return (
  <div className="asm-gpt-images" role="group" aria-label={label||'Images'}>
   {urls.map((url,i)=>(
    <figure className="asm-gpt-still" key={url+'-'+i}>
     <img src={url} alt={(label||'Image')+' '+(i+1)} loading="lazy"/>
     <figcaption>
      <span>{label||'Image'}{urls.length>1?' '+(i+1):''}</span>
      <a href={url} download target="_blank" rel="noreferrer">Download</a>
     </figcaption>
    </figure>
   ))}
  </div>
 );
}

function ReviewStills({
 job,
 busy,
 onIterate
}:{
 job:JobStatus;
 busy:boolean;
 onIterate:(role:'first'|'last')=>void;
}){
 const first=job.stills?.first;
 const last=job.stills?.last;
 if(!first&&!last)return null;
 const regenerating=String(job.regenRole||'');
 return (
  <div className="asm-gpt-images" role="group" aria-label="Opening stills">
   {first&&(
    <figure className="asm-gpt-still">
     <img src={first} alt="Door-First" loading="lazy"/>
     <figcaption>
      <span>Door-First</span>
      <a href={first} download target="_blank" rel="noreferrer">Download</a>
     </figcaption>
     {needsApproval(job)&&(
      <button
       type="button"
       className="asm-gpt-iterate"
       disabled={busy||Boolean(regenerating)}
       onClick={()=>onIterate('first')}
      >
       {regenerating==='opening-first'?'Iterating…':'Iterate'}
      </button>
     )}
    </figure>
   )}
   {last&&(
    <figure className="asm-gpt-still">
     <img src={last} alt="Last still" loading="lazy"/>
     <figcaption>
      <span>Last</span>
      <a href={last} download target="_blank" rel="noreferrer">Download</a>
     </figcaption>
     {needsApproval(job)&&(
      <button
       type="button"
       className="asm-gpt-iterate"
       disabled={busy||Boolean(regenerating)}
       onClick={()=>onIterate('last')}
      >
       {regenerating==='opening-last'?'Iterating…':'Iterate'}
      </button>
     )}
    </figure>
   )}
  </div>
 );
}

function JobCard({jobId,onUpdate}:{jobId:string;onUpdate?:(job:JobStatus)=>void}){
 const [job,setJob]=useState<JobStatus|null>(null);
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);

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
    writeSession(JOB_KEY,body.jobId||jobId);
   }catch(error){
    if(alive)setErr(error instanceof Error?error.message:'Status failed.');
   }
  }
  void poll();
  const timer=window.setInterval(()=>void poll(),2000);
  return()=>{alive=false;window.clearInterval(timer);};
 },[jobId,onUpdate]);

 async function approve(){
  if(!job||busy||job.regenRole)return;
  setBusy(true);
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
   setBusy(false);
  }
 }

 async function iterate(role:'first'|'last'){
  if(!job||busy||job.regenRole)return;
  setBusy(true);
  setErr('');
  try{
   const res=await fetch('/api/assembly?action=template1-regen-still',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:job.jobId||jobId,role})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Iterate failed.');
   setJob(body);
   onUpdate?.(body);
  }catch(error){
   setErr(error instanceof Error?error.message:'Iterate failed.');
  }finally{
   setBusy(false);
  }
 }

 const percent=Math.max(4,Math.min(100,Number(job?.percent)||4));
 const vibe=String(job?.displayName||'').trim();
 const reviewing=Boolean(job&&needsApproval(job));

 return (
  <div className="asm-gpt-job">
   <h3>{vibe||job?.label||'Working on your invite…'}</h3>
   <p>{job?.detail||err||'Live Template 1 progress'}</p>
   <div className="asm-gpt-meter" aria-hidden="true"><i style={{width:percent+'%'}}/></div>
   <p>{percent}% · {job?.phase||'…'}{job?.status?' · '+job.status:''}</p>
   {job&&reviewing?(
    <ReviewStills job={job} busy={busy} onIterate={role=>void iterate(role)}/>
   ):(
    (job?.stills?.first||job?.stills?.last)&&(
     <Stills label="Opening stills" urls={[job.stills?.first,job.stills?.last].filter((u):u is string=>Boolean(u))}/>
    )
   )}
   {job&&reviewing&&(
    <button type="button" className="asm-gpt-approve" disabled={busy||Boolean(job.regenRole)} onClick={()=>void approve()}>
     {busy&&!job.regenRole?'Approving…':'Approve'}
    </button>
   )}
   {(job?.previewUrl||job?.demo||job?.githubUrl)&&(
    <div className="asm-gpt-chips">
     {(job.previewUrl||job.demo)&&(
      <a className="asm-gpt-chip" href={job.previewUrl||job.demo||'#'} target="_blank" rel="noreferrer">Preview</a>
     )}
     {job.githubUrl&&<a className="asm-gpt-chip" href={job.githubUrl} target="_blank" rel="noreferrer">{job.branch||'GitHub'}</a>}
    </div>
   )}
   {job?.error&&<p className="asm-gpt-alert" role="alert">{job.error}</p>}
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
 const nodes:ReactNode[]=[];
 const parts=message.parts||[];
 const isUser=message.role==='user';

 for(let i=0;i<parts.length;i++){
  const part=parts[i] as Record<string,unknown> & {type:string};
  if(part.type==='text'&&typeof part.text==='string'&&part.text.trim()){
   nodes.push(
    isUser
     ?<div className="asm-gpt-user-bubble" key={message.id+'-t-'+i}>{part.text}</div>
     :<div className="asm-gpt-assistant" key={message.id+'-t-'+i}>{part.text}</div>
   );
   continue;
  }
  if(part.type==='reasoning'||part.type==='thinking'){
   nodes.push(
    <details className="asm-gpt-think" key={message.id+'-r-'+i} open={part.state==='streaming'}>
     <summary>{part.state==='streaming'?'Thinking…':'Thought process'}</summary>
     <pre>{String(part.text||part.reasoning||'…')}</pre>
    </details>
   );
   continue;
  }
  if(isToolUIPart(part as never)){
   const name=getToolName(part as never);
   const state=String(part.state||'');
   const output=toolPayload(part);
   const urls=[...new Set(collectUrls(output))];
   const foundJob=typeof output?.jobId==='string'?output.jobId:'';
   nodes.push(
    <div className="asm-gpt-tool" key={message.id+'-tool-'+i}>
     <strong>{name}</strong>
     {' · '}
     {state==='output-available'||state==='result'?'done':(state.replace(/-/g,' ')||'running')}
    </div>
   );
   if(urls.length)nodes.push(<Stills key={message.id+'-img-'+i} urls={urls} label={name}/>);
   if(foundJob)nodes.push(<JobCard key={message.id+'-job-'+i} jobId={foundJob}/>);
   if(name==='list_music'&&Array.isArray(output?.tracks)){
    const tracks=output.tracks as Array<{id?:string;displayName?:string}>;
    nodes.push(
     <div className="asm-gpt-chips" key={message.id+'-music-'+i}>
      {tracks.map(track=>(
       <button
        key={String(track.id)}
        type="button"
        className="asm-gpt-chip"
        disabled={busy}
        onClick={()=>onChip('Use music track "'+(track.displayName||track.id)+'" (id: '+track.id+').')}
       >
        {track.displayName||track.id}
       </button>
      ))}
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Skip music — use the default track.')}>Skip</button>
     </div>
    );
   }
   if(name==='mix_image'&&urls[0]){
    nodes.push(
     <div className="asm-gpt-chips" key={message.id+'-mix-'+i}>
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Lock this final image: '+urls[0])}>Lock this image</button>
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Remix with a stronger style twist.')}>Remix</button>
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Retry the image mix.')}>Retry</button>
     </div>
    );
   }
   continue;
  }
  if(part.type==='file'&&typeof part.url==='string'&&String(part.mediaType||'').startsWith('image/')){
   nodes.push(<Stills key={message.id+'-file-'+i} urls={[part.url]} label="Attachment"/>);
  }
 }

 if(isUser&&!nodes.length){
  const fallback=messageText(message);
  if(fallback)nodes.push(<div className="asm-gpt-user-bubble" key={message.id+'-fb'}>{fallback}</div>);
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
 const [navOpen,setNavOpen]=useState(false);
 const [input,setInput]=useState('');
 const [attachments,setAttachments]=useState<Attachment[]>([]);
 const [localError,setLocalError]=useState('');
 const [jobId,setJobId]=useState(()=>readSession(JOB_KEY));
 const [chats,setChats]=useState<ChatRecord[]>(()=>readChats());
 const [chatId,setChatId]=useState(()=>{
  let active='';
  try{active=localStorage.getItem(ACTIVE_KEY)||'';}catch{/* */}
  active=active||readSession(CHAT_KEY);
  const existing=readChats();
  if(active&&existing.some(c=>c.id===active))return active;
  const id=newId();
  writeSession(CHAT_KEY,id);
  try{localStorage.setItem(ACTIVE_KEY,id);}catch{/* */}
  return id;
 });

 const bottomRef=useRef<HTMLDivElement|null>(null);
 const fileRef=useRef<HTMLInputElement|null>(null);
 const cameraRef=useRef<HTMLInputElement|null>(null);
 const skipPersist=useRef(false);

 const seedMessages=useMemo(()=>{
  const found=readChats().find(c=>c.id===chatId);
  return found?.messages?.length?found.messages:[];
 },[chatId]);

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
     }else detail=(await res.clone().text()).slice(0,240);
    }catch{/* */}
    if(res.status===404)throw new Error(detail||'Chat API not found (404).');
    if(res.status===503)throw new Error(detail||'Chat backend not ready (missing XAI_API_KEY?).');
    if(res.status===401)throw new Error(detail||'Session expired — open /akay and enter the access code.');
    throw new Error(detail||('Chat failed ('+res.status+').'));
   }
   return res;
  }
 }),[parentId,chatId]);

 const {messages,sendMessage,status,error,setMessages,stop}=useChat({
  id:chatId,
  transport,
  messages:seedMessages
 });

 const busy=status==='submitted'||status==='streaming';
 const hasThread=messages.some(m=>m.role==='user'||Boolean(messageText(m)));

 useEffect(()=>{
  bottomRef.current?.scrollIntoView({behavior:'smooth',block:'end'});
 },[messages,status,attachments.length]);

 useEffect(()=>{
  if(!error)return;
  if(/401|access code|akay|session expired/i.test(error.message))onUnauth();
 },[error,onUnauth]);

 useEffect(()=>{
  if(skipPersist.current){skipPersist.current=false;return;}
  if(!messages.length)return;
  const record:ChatRecord={
   id:chatId,
   title:titleFrom(messages),
   updatedAt:Date.now(),
   messages,
   jobId:jobId||undefined
  };
  setChats(prev=>{
   const next=[record,...prev.filter(c=>c.id!==chatId)].sort((a,b)=>b.updatedAt-a.updatedAt);
   writeChats(next);
   return next;
  });
  writeSession(CHAT_KEY,chatId);
  try{localStorage.setItem(ACTIVE_KEY,chatId);}catch{/* */}
 },[messages,chatId,jobId]);

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
    const url=await uploadImage(dataUrl,kind);
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
  try{await sendMessage({text:payload});}
  catch(err){setLocalError(err instanceof Error?err.message:'Could not send.');}
 }

 function onKeyDown(event:KeyboardEvent<HTMLTextAreaElement>){
  if(event.key==='Enter'&&!event.shiftKey){
   event.preventDefault();
   void onSubmit();
  }
 }

 function startNewChat(){
  const id=newId();
  skipPersist.current=true;
  setChatId(id);
  setMessages([]);
  setInput('');
  setAttachments([]);
  setLocalError('');
  setJobId('');
  writeSession(JOB_KEY,'');
  writeSession(CHAT_KEY,id);
  try{localStorage.setItem(ACTIVE_KEY,id);}catch{/* */}
  setNavOpen(false);
 }

 function openChat(id:string){
  if(id===chatId){setNavOpen(false);return;}
  const found=chats.find(c=>c.id===id)||readChats().find(c=>c.id===id);
  skipPersist.current=true;
  setChatId(id);
  setMessages(found?.messages||[]);
  setJobId(found?.jobId||'');
  if(found?.jobId)writeSession(JOB_KEY,found.jobId);
  writeSession(CHAT_KEY,id);
  try{localStorage.setItem(ACTIVE_KEY,id);}catch{/* */}
  setInput('');
  setAttachments([]);
  setLocalError('');
  setNavOpen(false);
 }

 async function copyText(text:string){
  try{await navigator.clipboard.writeText(text);}catch{/* */}
 }

 const ready=Boolean(input.trim()||attachments.length);

 const composer=(
  <div className="asm-gpt-composer">
   <div className="asm-gpt-composer-box">
    {(localError||error?.message)&&(
     <p className="asm-gpt-alert" role="alert">{localError||error?.message}</p>
    )}
    {!!attachments.length&&(
     <div className="asm-gpt-thumbs">
      {attachments.map(item=>(
       <div className="asm-gpt-thumb" key={item.id}>
        <img src={item.url} alt={item.name}/>
        <button type="button" aria-label="Remove" onClick={()=>setAttachments(prev=>prev.filter(x=>x.id!==item.id))}>×</button>
       </div>
      ))}
     </div>
    )}
    <form className="asm-gpt-input" onSubmit={event=>void onSubmit(event)}>
     <button type="button" className="asm-gpt-round" aria-label="Attach" disabled={busy} onClick={()=>fileRef.current?.click()}>
      <Icon d="M12 5v14M5 12h14" size={20}/>
     </button>
     <textarea
      className="asm-gpt-field"
      rows={1}
      placeholder={hasThread?'Ask Assembly':'Ask Assembly…'}
      value={input}
      disabled={busy}
      onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>setInput(event.target.value)}
      onKeyDown={onKeyDown}
      aria-label="Message"
     />
     <button type="button" className="asm-gpt-round asm-gpt-camera" aria-label="Camera" disabled={busy} onClick={()=>cameraRef.current?.click()}>
      <CameraIcon/>
     </button>
     {busy?(
      <button type="button" className="asm-gpt-round asm-gpt-send" aria-label="Stop" onClick={()=>stop()}>
       <Icon d="M8 8h8v8H8z" size={16}/>
      </button>
     ):(
      <button type="submit" className="asm-gpt-round asm-gpt-send" disabled={!ready} aria-label="Send">
       <Icon d="M12 19V5M5 12l7-7 7 7" size={18}/>
      </button>
     )}
     <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e=>{void addFiles(e.target.files);e.target.value='';}}/>
     <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={e=>{void addFiles(e.target.files,'hero');e.target.value='';}}/>
    </form>
   </div>
  </div>
 );

 return (
  <div className={'asm-gpt'+(navOpen?' is-open':'')} data-testid="asm-chat">
   <button type="button" className="asm-gpt-backdrop" aria-label="Close menu" onClick={()=>setNavOpen(false)}/>

   <aside className="asm-gpt-side" aria-label="Chat history">
    <div className="asm-gpt-side-head">
     <div className="asm-gpt-mark" aria-hidden="true">A</div>
     <button type="button" className="asm-gpt-icon asm-gpt-close" aria-label="Close sidebar" onClick={()=>setNavOpen(false)}>
      <Icon d="M4 6h16M4 12h10M4 18h16"/>
     </button>
    </div>

    <button type="button" className="asm-gpt-new" onClick={startNewChat}>
     <Icon d="M12 5v14M5 12h14"/>
     New chat
    </button>

    <p className="asm-gpt-chats-h">Chats</p>
    <div className="asm-gpt-hist">
     {chats.length===0&&<p className="asm-gpt-hist-empty">Your conversations will show up here.</p>}
     {chats.map(chat=>(
      <button
       key={chat.id}
       type="button"
       className={'asm-gpt-hist-btn'+(chat.id===chatId?' is-on':'')}
       onClick={()=>openChat(chat.id)}
       title={chat.title}
      >
       {chat.title||'New chat'}
      </button>
     ))}
    </div>

    <div className="asm-gpt-side-foot">
     <div className="asm-gpt-ava" aria-hidden="true">FM</div>
     <div className="asm-gpt-user">
      <strong>FindMyInvite</strong>
      <span>{cloud?'Cloud · Assembly':'Local · Assembly'}</span>
     </div>
     <a className="asm-gpt-icon" href="/assembly/pipeline" title="Pipeline" aria-label="Pipeline">
      <Icon d="M4 10h16M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M5 10v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>
     </a>
    </div>
   </aside>

   <section className="asm-gpt-main">
    <header className="asm-gpt-top">
     <div style={{display:'flex',alignItems:'center',gap:4}}>
      <button type="button" className="asm-gpt-icon asm-gpt-menu" aria-label="Open sidebar" onClick={()=>setNavOpen(true)}>
       <Icon d="M4 6h16M4 12h16M4 18h16"/>
      </button>
      <span className="asm-gpt-model">Assembly</span>
     </div>
     <div className="asm-gpt-top-actions">
      <a className="asm-gpt-pill ghost" href="/assembly/pipeline">Pipeline</a>
      <button type="button" className="asm-gpt-pill solid" onClick={startNewChat}>New chat</button>
     </div>
    </header>

    <div className="asm-gpt-scroll" role="log" aria-live="polite">
     {!hasThread?(
      <div className="asm-gpt-home">
       <h1>What&apos;s on your mind today?</h1>
       <div className="asm-gpt-home-col">
        {composer}
        <ul className="asm-gpt-suggestions">
         {SUGGESTIONS.map(item=>(
          <li key={item.text}>
           <button type="button" className="asm-gpt-suggestion" disabled={busy} onClick={()=>sendChip(item.text)}>
            <span className="emo" aria-hidden="true">{item.emo}</span>
            <span className="txt">{item.text}</span>
           </button>
          </li>
         ))}
        </ul>
       </div>
      </div>
     ):(
      <>
       <div className="asm-gpt-thread">
        {messages.map(message=>{
         const text=messageText(message);
         return (
          <article className="asm-gpt-msg" data-role={message.role} key={message.id}>
           <MessageView message={message} onChip={sendChip} busy={busy}/>
           {message.role==='assistant'&&text&&(
            <div className="asm-gpt-actions">
             <button type="button" className="asm-gpt-act" aria-label="Copy" onClick={()=>void copyText(text)}>
              <Icon d="M9 9h10v10H9zM5 5h10v2" size={16}/>
             </button>
             <button type="button" className="asm-gpt-act" aria-label="Share" onClick={()=>void copyText(text)}>
              <Icon d="M12 5v10M8 9l4-4 4 4M6 19h12" size={16}/>
             </button>
            </div>
           )}
          </article>
         );
        })}
        {jobId&&<JobCard jobId={jobId} onUpdate={job=>{if(job.jobId)setJobId(job.jobId);}}/>}
        {busy&&<p className="asm-gpt-status">Thinking…</p>}
        <div ref={bottomRef}/>
       </div>
       {composer}
      </>
     )}
    </div>
   </section>
  </div>
 );
}
