import {useChat} from '@ai-sdk/react';
import {upload as uploadBlob} from '@vercel/blob/client';
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

const IMAGE_TOOLS=new Set(['mix_image','regen_opening_still']);
const IMAGE_TIMEOUT_MS=120_000;

function formatElapsed(ms:number){
 const total=Math.max(0,Math.floor(ms/1000));
 const m=Math.floor(total/60);
 const s=total%60;
 if(m<=0)return s+'s';
 return m+':'+String(s).padStart(2,'0');
}

function toolPartPending(part:Record<string,unknown>){
 const state=String(part.state||'');
 return !(
  state==='output-available'||
  state==='result'||
  state==='output-error'||
  state==='error'
 );
}

function findPendingImageTool(messages:UIMessage[]){
 for(let mi=messages.length-1;mi>=0;mi--){
  const message=messages[mi];
  if(message.role!=='assistant')continue;
  const parts=message.parts||[];
  for(let pi=parts.length-1;pi>=0;pi--){
   const part=parts[pi] as Record<string,unknown> & {type:string};
   if(!isToolUIPart(part as never))continue;
   const name=getToolName(part as never);
   if(!IMAGE_TOOLS.has(name))continue;
   if(!toolPartPending(part))continue;
   return {name,state:String(part.state||'running')};
  }
 }
 return null;
}

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
function canRetryJob(job:Pick<JobStatus,'status'|'error'>){
 const status=String(job.status||'');
 if(status==='preview'||status==='review')return false;
 if(status==='failed'||status==='cancelled'||status==='running'||status==='queued')return true;
 return false;
}
function canDiscardJob(job:Pick<JobStatus,'status'|'percent'>){
 const status=String(job.status||'');
 if(status==='failed'||status==='cancelled'||status==='queued')return true;
 // Stuck mid-run (any %) — operator may discard without waiting for a hard fail.
 if(status==='running')return true;
 return false;
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

function isVideoUrl(url:string){
 return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)||/(^|\/)video([\/?]|$)/i.test(url);
}

function MediaPreview({url,label}:{url:string;label:string}){
 if(isVideoUrl(url)){
  return (
   <video
    src={url}
    controls
    playsInline
    preload="metadata"
    aria-label={label}
   />
  );
 }
 return <img src={url} alt={label} loading="lazy"/>;
}

function Stills({urls,label}:{urls:string[];label?:string}){
 if(!urls.length)return null;
 // Every preview (image or video) is 80% of iPhone 17 logical screen — see assembly-chat.css.
 return (
  <div className="asm-gpt-images" role="group" aria-label={label||'Preview'}>
   {urls.map((url,i)=>(
    <figure className="asm-gpt-still" key={url+'-'+i}>
     <MediaPreview url={url} label={(label||'Preview')+(urls.length>1?' '+(i+1):'')}/>
     <figcaption>
      <span>{label||(isVideoUrl(url)?'Video':'Image')}{urls.length>1?' '+(i+1):''}</span>
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
     <MediaPreview url={first} label="Door-First"/>
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
     <MediaPreview url={last} label="Last still"/>
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

function JobCard({jobId,onUpdate,onDismiss}:{jobId:string;onUpdate?:(job:JobStatus)=>void;onDismiss?:()=>void}){
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

 async function retry(){
  if(!job||busy)return;
  setBusy(true);
  setErr('');
  try{
   const res=await fetch('/api/assembly?action=template1-retry',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:job.jobId||jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Retry failed.');
   setJob(body);
   onUpdate?.(body);
  }catch(error){
   setErr(error instanceof Error?error.message:'Retry failed.');
  }finally{
   setBusy(false);
  }
 }

 async function discard(){
  if(!job||busy)return;
  if(!window.confirm('Discard this job?'))return;
  setBusy(true);
  setErr('');
  try{
   const res=await fetch('/api/assembly?action=template1-discard',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:job.jobId||jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Discard failed.');
   writeSession(JOB_KEY,'');
   onDismiss?.();
  }catch(error){
   setErr(error instanceof Error?error.message:'Discard failed.');
  }finally{
   setBusy(false);
  }
 }

 const percent=Math.max(4,Math.min(100,Number(job?.percent)||4));
 const vibe=String(job?.displayName||'').trim();
 const reviewing=Boolean(job&&needsApproval(job));
 const showOps=Boolean(job&&(canRetryJob(job)||canDiscardJob(job)||onDismiss));

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
    <ChoicePrompt
     title="Review opening stills"
     disabled={busy||Boolean(job.regenRole)}
     options={[
      {id:'approve',label:'Approve — continue to video + site',submit:'__approve__'},
      {id:'first',label:'Retry Door-First still',submit:'__iterate_first__'},
      {id:'last',label:'Retry last still',submit:'__iterate_last__'}
     ]}
     onSubmit={option=>{
      if(option.id==='approve')void approve();
      else if(option.id==='first')void iterate('first');
      else if(option.id==='last')void iterate('last');
     }}
    />
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
   {showOps&&(
    <div className="asm-gpt-chips asm-gpt-job-ops">
     {job&&canRetryJob(job)&&(
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>void retry()}>
       {busy?'Retrying…':'Retry'}
      </button>
     )}
     {job&&canDiscardJob(job)&&(
      <button type="button" className="asm-gpt-chip asm-gpt-chip-danger" disabled={busy} onClick={()=>void discard()}>
       Discard
      </button>
     )}
     {onDismiss&&(
      <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>{writeSession(JOB_KEY,'');onDismiss();}}>
       Close
      </button>
     )}
    </div>
   )}
  </div>
 );
}



type ChoiceOption={id:string;label:string;submit:string};


/** Upload face photo straight to Vercel Blob (browser → Blob). Returns the public https URL. */
async function uploadFacePhoto(file:File){
 if(!file.type.startsWith('image/'))throw new Error('Use a JPEG, PNG, or WebP photo.');
 if(file.size>12*1024*1024)throw new Error('Each face photo must be under 12 MB.');
 const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
 const pathname='face-swap/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
 // Store is private — public access returns 400 without CORS (browser shows it as a CORS error).
 const blob=await uploadBlob(pathname,file,{
  access:'private',
  handleUploadUrl:'/api/face-swap?action=blob',
  contentType:file.type||'image/jpeg'
 });
 if(!blob?.url)throw new Error('Face upload returned no URL.');
 return blob.url;
}

function FaceUploadSlot({
 label,
 preview,
 busy,
 disabled,
 onPick
}:{
 label:string;
 preview:string;
 busy:boolean;
 disabled:boolean;
 onPick:(file:File)=>void;
}){
 const inputId=useMemo(()=>'face-'+label.toLowerCase().replace(/\s+/g,'-')+'-'+Math.random().toString(36).slice(2,7),[label]);
 return (
  <div className={'asm-gpt-face-slot'+(preview?' has-preview':'')+(busy?' is-busy':'')}>
   <p className="asm-gpt-face-slot-label">{label}</p>
   <label className="asm-gpt-face-slot-card" htmlFor={inputId}>
    {preview
     ?<img src={preview} alt={label+' preview'}/>
     :<span className="asm-gpt-face-slot-empty"><strong>Add photo</strong><em>Front-facing · well lit</em></span>}
    {busy&&<span className="asm-gpt-face-slot-busy" aria-live="polite">Uploading…</span>}
   </label>
   <input
    id={inputId}
    className="asm-gpt-face-slot-input"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    disabled={disabled||busy}
    onChange={e=>{
     const f=e.currentTarget.files?.[0];
     e.currentTarget.value='';
     if(f)onPick(f);
    }}
   />
   {preview&&!busy&&<p className="asm-gpt-face-slot-file">Uploaded</p>}
  </div>
 );
}

/** Face Swap add-on before Lock — upload faces to Blob URLs, swap, then Lock → video. */
function FaceSwapBeforeLock({
 heroUrl,
 busy,
 onChip
}:{
 heroUrl:string;
 busy:boolean;
 onChip:(text:string)=>void;
}){
 const [step,setStep]=useState<'offer'|'confirm'|'upload'|'running'|'ready'>('offer');
 const [cfg,setCfg]=useState<{stub:boolean;priceInr:number}|null>(null);
 const [brideUrl,setBrideUrl]=useState('');
 const [groomUrl,setGroomUrl]=useState('');
 const [bridePreview,setBridePreview]=useState('');
 const [groomPreview,setGroomPreview]=useState('');
 const [uploading,setUploading]=useState<'bride'|'groom'|null>(null);
 const [progress,setProgress]=useState('');
 const [error,setError]=useState('');
 const [swappedUrl,setSwappedUrl]=useState('');
 const [brideSolo,setBrideSolo]=useState('');
 const [groomSolo,setGroomSolo]=useState('');

 useEffect(()=>{
  void fetch('/api/face-swap?action=config')
   .then(r=>r.json())
   .then(j=>{if(j)setCfg({stub:Boolean(j.stub),priceInr:Number(j.priceInr)||300});})
   .catch(()=>setCfg({stub:false,priceInr:300}));
 },[]);

 async function pickFace(role:'bride'|'groom',file:File){
  setError('');
  setUploading(role);
  const local=URL.createObjectURL(file);
  if(role==='bride'){setBridePreview(local);setBrideUrl('');}
  else{setGroomPreview(local);setGroomUrl('');}
  try{
   const url=await uploadFacePhoto(file);
   if(role==='bride'){setBrideUrl(url);setBridePreview(url);}
   else{setGroomUrl(url);setGroomPreview(url);}
  }catch(e){
   setError((e as Error).message||'Face upload failed.');
   if(role==='bride'){setBridePreview('');setBrideUrl('');}
   else{setGroomPreview('');setGroomUrl('');}
  }finally{
   setUploading(null);
   URL.revokeObjectURL(local);
  }
 }

 async function runSwap(){
  if(!brideUrl||!groomUrl){setError('Upload both bride and groom face photos first.');return;}
  setStep('running');setError('');setProgress('Starting Face Swap…');
  try{
   // wait:true keeps the job on one Vercel function (in-memory Map cannot poll across instances).
   setProgress('Swapping faces on the couple still… (1–3 min)');
   const startRes=await fetch('/api/face-swap?action=start',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     pinUrl:heroUrl,
     brideFaceUrl:brideUrl,
     groomFaceUrl:groomUrl,
     entitled:Boolean(cfg?.stub),
     wait:true
    })
   });
   const raw=await startRes.text();
   let job:any=null;
   try{job=JSON.parse(raw);}catch{/* non-JSON platform errors */}
   if(!startRes.ok)throw new Error((job&&job.error)||'Face Swap failed to start.');
   if(!job)throw new Error('Face Swap returned an empty response.');
   if(job.status!=='done')throw new Error(job.error||'Face Swap failed.');
   const couple=job.result?.coupleUrl||'';
   if(!couple)throw new Error('Face Swap returned no couple still.');
   setSwappedUrl(couple);
   setBrideSolo(job.result?.brideUrl||'');
   setGroomSolo(job.result?.groomUrl||'');
   setProgress('Face Swap ready — lock this still to start the video.');
   setStep('ready');
  }catch(e){
   setError((e as Error).message);
   setProgress('');
   setStep('upload');
  }
 }

 if(step==='offer'){
  return (
   <ChoicePrompt
    title="Ready to lock this hero?"
    disabled={busy}
    options={[
     {id:'swap',label:'Add Face Swap (Rs. '+(cfg?.priceInr||300)+') — put your faces on this still'+(cfg?.stub?' · stub, no charge':''),submit:'__face_swap__'},
     {id:'lock',label:'Lock as-is — start video without Face Swap',submit:'Lock this final image: '+heroUrl},
     {id:'remix',label:'Remix with a stronger style twist',submit:'Remix with a stronger style twist.'},
     {id:'retry',label:'Retry the same mix again',submit:'Retry the image mix with Replicate.'}
    ]}
    onSubmit={option=>{
     if(option.id==='swap')setStep('confirm');
     else onChip(option.submit);
    }}
   />
  );
 }

 if(step==='confirm'){
  return (
   <div className="asm-gpt-face-swap" role="group" aria-label="Confirm Face Swap">
    <p className="asm-gpt-choice-title">Confirm Face Swap add-on</p>
    <p className="asm-gpt-face-swap-copy">
     We’ll replace the couple faces on this refined still with your bride &amp; groom photos
     (Rs. {cfg?.priceInr||300}{cfg?.stub?' · stub — no charge':''}).
     You review the swapped still, then Lock — only then does the opening video start.
    </p>
    <div className="asm-gpt-face-swap-actions">
     <button type="button" className="asm-gpt-choice-submit" disabled={busy} onClick={()=>setStep('upload')}>
      Yes — add Face Swap
     </button>
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>setStep('offer')}>Back</button>
    </div>
   </div>
  );
 }

 if(step==='upload'||step==='running'){
  const blocked=busy||step==='running'||uploading!==null;
  return (
   <div className="asm-gpt-face-swap" role="group" aria-label="Upload faces for Face Swap">
    <p className="asm-gpt-choice-title">Upload bride &amp; groom faces</p>
    <p className="asm-gpt-face-swap-copy">Clear face photos work best — front-facing, well lit, one person each. Photos upload first, then we swap.</p>
    <div className="asm-gpt-face-uploads">
     <FaceUploadSlot
      label="Bride face"
      preview={bridePreview}
      busy={uploading==='bride'}
      disabled={blocked&&uploading!=='bride'}
      onPick={file=>void pickFace('bride',file)}
     />
     <FaceUploadSlot
      label="Groom face"
      preview={groomPreview}
      busy={uploading==='groom'}
      disabled={blocked&&uploading!=='groom'}
      onPick={file=>void pickFace('groom',file)}
     />
    </div>
    {error&&<p className="asm-gpt-alert" role="alert">{error}</p>}
    {progress&&<p role="status">{progress}</p>}
    <div className="asm-gpt-face-swap-actions">
     <button type="button" className="asm-gpt-choice-submit" disabled={blocked||!brideUrl||!groomUrl} onClick={()=>void runSwap()}>
      {step==='running'?'Swapping faces…':uploading?'Uploading…':'Run Face Swap'}
     </button>
     <button type="button" className="asm-gpt-chip" disabled={blocked} onClick={()=>setStep('offer')}>Cancel</button>
    </div>
   </div>
  );
 }

 // ready
 return (
  <div className="asm-gpt-face-swap is-ready" role="group" aria-label="Face Swap result">
   <p className="asm-gpt-choice-title">Face Swap ready</p>
   <p className="asm-gpt-face-swap-copy">Lock the swapped still to start the opening video. Bride / Groom solos are saved for chapters.</p>
   <Stills urls={[swappedUrl,brideSolo,groomSolo].filter(Boolean)} label="Face Swap"/>
   {progress&&<p role="status">{progress}</p>}
   <ChoicePrompt
    title="Lock Face-Swapped hero?"
    disabled={busy}
    options={[
     {id:'lock-swapped',label:'Lock Face-Swapped still — start video',submit:'Lock this final image: '+swappedUrl},
     {id:'lock-original',label:'Lock original still instead',submit:'Lock this final image: '+heroUrl},
     {id:'retry-swap',label:'Retry Face Swap with different faces',submit:'__retry_face_swap__'}
    ]}
    onSubmit={option=>{
     if(option.id==='retry-swap'){setStep('upload');setProgress('');setError('');return;}
     onChip(option.submit);
    }}
   />
  </div>
 );
}


function ChoicePrompt({
 title,
 options,
 submitLabel='Submit',
 disabled=false,
 tone='default',
 onSubmit
}:{
 title:string;
 options:ChoiceOption[];
 submitLabel?:string;
 disabled?:boolean;
 tone?:'default'|'alert';
 onSubmit:(option:ChoiceOption)=>void;
}){
 const [selected,setSelected]=useState(options[0]?.id||'');
 const name=useMemo(()=>'choice-'+Math.random().toString(36).slice(2,8),[]);
 return (
  <form
   className={'asm-gpt-choice'+(tone==='alert'?' is-alert':'')}
   role="group"
   aria-label={title}
   onSubmit={event=>{
    event.preventDefault();
    const option=options.find(item=>item.id===selected);
    if(option)onSubmit(option);
   }}
  >
   <p className="asm-gpt-choice-title">{title}</p>
   <div className="asm-gpt-choice-list" role="radiogroup" aria-label={title}>
    {options.map(option=>(
     <label key={option.id} className={'asm-gpt-choice-opt'+(selected===option.id?' is-on':'')}>
      <input
       type="radio"
       name={name}
       value={option.id}
       checked={selected===option.id}
       disabled={disabled}
       onChange={()=>setSelected(option.id)}
      />
      <span>{option.label}</span>
     </label>
    ))}
   </div>
   <button type="submit" className="asm-gpt-choice-submit" disabled={disabled||!selected}>
    {submitLabel}
   </button>
  </form>
 );
}

function toolStatusLabel(name:string,state:string,{pending,isImage,busy,elapsedMs}:{pending:boolean;isImage:boolean;busy:boolean;elapsedMs:number}){
 const elapsed=busy&&elapsedMs?(' '+formatElapsed(elapsedMs)):'';
 if(name==='mix_image'){
  if(state==='input-available'||state==='input-streaming'||state==='partial-call'||state==='call'){
   return 'Editing Image - Using Reference Image';
  }
  if(pending)return 'Editing Image - Generating'+elapsed;
  return 'Editing Image - Done';
 }
 if(name==='resolve_pin'){
  if(pending)return 'Importing from Pinterest'+elapsed;
  return 'Importing from Pinterest - Done';
 }
 if(pending){
  if(isImage)return name.replace(/_/g,' ')+' — generating'+elapsed;
  return name.replace(/_/g,' ')+' — running'+elapsed;
 }
 if(state==='output-available'||state==='result')return name.replace(/_/g,' ')+' — done';
 return name.replace(/_/g,' ')+' — '+(state.replace(/-/g,' ')||'done');
}

function MessageView({
 message,
 onChip,
 busy,
 elapsedMs=0
}:{
 message:UIMessage;
 onChip:(text:string)=>void;
 busy:boolean;
 elapsedMs?:number;
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
   const pending=toolPartPending(part);
   const output=toolPayload(part);
   const urls=[...new Set(collectUrls(output))];
   const foundJob=typeof output?.jobId==='string'?output.jobId:'';
   const isImage=IMAGE_TOOLS.has(name);
   nodes.push(
    <div className={'asm-gpt-tool'+(pending&&isImage?' is-image':'')} key={message.id+'-tool-'+i}>
     {toolStatusLabel(name,state,{pending,isImage,busy,elapsedMs})}
    </div>
   );
   if(urls.length){
    const pinUrls=name==='resolve_pin'
     ?([typeof output?.previewUrl==='string'?output.previewUrl:'',typeof output?.imageUrl==='string'?output.imageUrl:''].filter(Boolean) as string[])
     :urls;
    const show=pinUrls.length?pinUrls:urls;
    nodes.push(<Stills key={message.id+'-img-'+i} urls={show} label={name}/>);
   }
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
     <FaceSwapBeforeLock
      key={message.id+'-mix-'+i}
      heroUrl={urls[0]}
      busy={busy}
      onChip={onChip}
     />
    );
   }
   if(name==='mix_image'&&output&&output.ok===false&&(output.timedOut||output.canFallbackXai)){
    nodes.push(
     <ChoicePrompt
      key={message.id+'-mix-fallback-'+i}
      tone="alert"
      title="Replicate timed out. How should we continue?"
      disabled={busy}
      options={[
       {id:'xai',label:'Fall back to xAI image API',submit:'Approved — fall back to xAI. Call mix_image again with provider "xai" using the same pin and style.'},
       {id:'retry',label:'Retry with Replicate',submit:'Retry the image mix with Replicate (provider replicate).'},
       {id:'wait',label:'Wait — I will try again later',submit:'Hold off on image generation for now. I will ask again later.'}
      ]}
      onSubmit={option=>onChip(option.submit)}
     />
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
 const scrollRef=useRef<HTMLDivElement|null>(null);
 const fieldRef=useRef<HTMLTextAreaElement|null>(null);
 const shellRef=useRef<HTMLDivElement|null>(null);
 const stickToBottomRef=useRef(true);
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
 const pendingImage=useMemo(()=>findPendingImageTool(messages),[messages]);
 const [elapsedMs,setElapsedMs]=useState(0);
 const [imageTimeout,setImageTimeout]=useState(false);
 const inferStartedAt=useRef<number|null>(null);
 const imageTimedOutRef=useRef(false);

 useEffect(()=>{
  if(busy){
   if(!inferStartedAt.current)inferStartedAt.current=Date.now();
   imageTimedOutRef.current=false;
   setImageTimeout(false);
   const tick=()=>setElapsedMs(Date.now()-(inferStartedAt.current||Date.now()));
   tick();
   const id=window.setInterval(tick,250);
   return ()=>window.clearInterval(id);
  }
  inferStartedAt.current=null;
  setElapsedMs(0);
 },[busy]);

 useEffect(()=>{
  if(!busy||!pendingImage||imageTimedOutRef.current)return;
  if(elapsedMs<IMAGE_TIMEOUT_MS)return;
  imageTimedOutRef.current=true;
  setImageTimeout(true);
  try{stop();}catch{/* */}
 },[busy,pendingImage,elapsedMs,stop]);

 function isNearBottom(scroller:HTMLElement,slack=120){
  return scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<=slack;
 }

 function scrollThreadToEnd(smooth=true,{force=false}:{force?:boolean}={}){
  const scroller=scrollRef.current;
  if(!scroller)return;
  if(!force&&!stickToBottomRef.current)return;
  scroller.scrollTo({top:scroller.scrollHeight,behavior:smooth?'smooth':'auto'});
 }

 function resizeComposerField(){
  const el=fieldRef.current;
  if(!el)return;
  el.style.height='auto';
  const max=Math.round(16*1.4*8); // 8 lines @ 16px/1.4
  el.style.height=Math.min(el.scrollHeight,max)+'px';
 }

 useEffect(()=>{
  const scroller=scrollRef.current;
  if(!scroller)return;
  const onScroll=()=>{
   // User scrolled up to read history → stop yanking them to the bottom while Grok thinks.
   stickToBottomRef.current=isNearBottom(scroller);
  };
  scroller.addEventListener('scroll',onScroll,{passive:true});
  stickToBottomRef.current=isNearBottom(scroller);
  return ()=>scroller.removeEventListener('scroll',onScroll);
 },[chatId,hasThread]);

 useEffect(()=>{
  // Follow new tokens only if the reader is already parked near the bottom.
  // Never depend on elapsedMs — that fired every 250ms and fought manual scroll-up.
  scrollThreadToEnd(status==='streaming'?false:true);
 },[messages,status,attachments.length]);

 useEffect(()=>{
  resizeComposerField();
 },[input]);

 useEffect(()=>{
  const shell=shellRef.current;
  const vv=window.visualViewport;
  if(!shell)return;
  const sync=()=>{
   if(!vv){
    shell.style.setProperty('--kb-inset','0px');
    shell.style.setProperty('--vv-height',window.innerHeight+'px');
    return;
   }
   // iOS/Android: layout viewport stays tall; visual viewport shrinks under the keyboard.
   const inset=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
   shell.style.setProperty('--kb-inset',inset+'px');
   shell.style.setProperty('--vv-height',Math.round(vv.height)+'px');
  };
  sync();
  vv?.addEventListener('resize',sync);
  vv?.addEventListener('scroll',sync);
  window.addEventListener('focusin',sync);
  window.addEventListener('focusout',sync);
  return ()=>{
   vv?.removeEventListener('resize',sync);
   vv?.removeEventListener('scroll',sync);
   window.removeEventListener('focusin',sync);
   window.removeEventListener('focusout',sync);
  };
 },[]);

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
  stickToBottomRef.current=true;
  void sendMessage({text:text.trim()});
  requestAnimationFrame(()=>scrollThreadToEnd(false,{force:true}));
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
  stickToBottomRef.current=true;
  requestAnimationFrame(()=>{
   if(fieldRef.current)fieldRef.current.style.height='auto';
   scrollThreadToEnd(false,{force:true});
  });
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
  setImageTimeout(false);
  imageTimedOutRef.current=false;
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
  setImageTimeout(false);
  imageTimedOutRef.current=false;
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
      ref={fieldRef}
      className="asm-gpt-field"
      rows={1}
      placeholder={hasThread?'Ask Assembly':'Ask Assembly…'}
      value={input}
      disabled={busy}
      enterKeyHint="send"
      inputMode="text"
      autoComplete="off"
      autoCorrect="on"
      autoCapitalize="sentences"
      spellCheck
      onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>{
       setInput(event.target.value);
       // Grow immediately on the same tick (before React paint) for less friction.
       const el=event.currentTarget;
       el.style.height='auto';
       el.style.height=Math.min(el.scrollHeight,Math.round(16*1.4*8))+'px';
      }}
      onKeyDown={onKeyDown}
      onFocus={()=>{
       // Keyboard inset is handled by visualViewport. Only nudge the thread if
       // the reader was already following the bottom — never yank them out of history.
       if(!stickToBottomRef.current)return;
       window.setTimeout(()=>scrollThreadToEnd(false),50);
       window.setTimeout(()=>scrollThreadToEnd(false),300);
      }}
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
  <div ref={shellRef} className={'asm-gpt'+(navOpen?' is-open':'')} data-testid="asm-chat">
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

        <div className="asm-gpt-scroll" ref={scrollRef} role="log" aria-live="polite">
     {!hasThread?(
      <div className="asm-gpt-home">
       <h1>What&apos;s on your mind today?</h1>
       <div className="asm-gpt-home-col">
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
      <div className="asm-gpt-thread">

        {messages.map(message=>{
         const text=messageText(message);
         return (
          <article className="asm-gpt-msg" data-role={message.role} key={message.id}>
           <MessageView message={message} onChip={sendChip} busy={busy} elapsedMs={elapsedMs}/>
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
        {jobId&&<JobCard jobId={jobId} onUpdate={job=>{if(job.jobId)setJobId(job.jobId);}} onDismiss={()=>setJobId('')}/>}
        {imageTimeout?(
         <ChoicePrompt
          tone="alert"
          title="Sorry, I am currently facing problem generating the images. Replicate may have timed out — how should we continue?"
          disabled={busy}
          options={[
           {id:'xai',label:'Fall back to xAI image API',submit:'Approved — fall back to xAI. Call mix_image again with provider "xai" using the same pin and style.'},
           {id:'retry',label:'Retry with Replicate',submit:'Try Now — retry the image mix with Replicate (provider replicate).'},
           {id:'wait',label:'Wait — try again later',submit:'Hold off on image generation for now. I will ask again later.'}
          ]}
          onSubmit={option=>{
           setImageTimeout(false);
           imageTimedOutRef.current=false;
           if(option.id!=='wait')sendChip(option.submit);
          }}
         />
        ):busy?(
         <p className="asm-gpt-status" aria-live="polite">
          {pendingImage?'Generating image…':'Thinking…'}
          {' '}
          <span className="asm-gpt-elapsed">{formatElapsed(elapsedMs)}</span>
          {pendingImage&&elapsedMs>=90_000&&elapsedMs<IMAGE_TIMEOUT_MS?(
           <span className="asm-gpt-elapsed-warn"> · almost at the 2 min limit</span>
          ):null}
         </p>
        ):null}
        <div ref={bottomRef}/>
      </div>
     )}
    </div>
    {composer}
   </section>
  </div>
 );
}
