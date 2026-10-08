import {useEffect,useMemo,useState,type FormEvent} from 'react';
import './client-proof.css';
import {managerFetch} from './manager-api';
import {readSession} from './auth-session';

type Job={id:string;couple:string;clientName:string;clientPhone:string;template:string;notes:string;status:string;round:number;finalUrl:string;
 sentAt:string|null;approvedAt:string|null;dispatchedAt:string|null;createdAt:string;updatedAt:string;proofUrl:string;stillCount?:number;approvedCount?:number;changeCount?:number};
type Still={scene:number;title:string;caption:string;version:number;decision:string;comment:string;decidedAt:string|null;image:string};
type LogRow={kind:string;actor:string;scene:number|null;round:number;detail:string;created_at:string};
type Insights={total:number;byStatus:Record<string,number>;awaitingClient:number;needsWork:number;readyForVideo:number;avgRoundsToApproval:number|null;
 firstPassApprovalRate:number|null;avgHoursToApproval:number|null;avgHoursApprovalToDispatch:number|null;topChangedScenes:{title:string;count:number}[]};

const STEPS:[string,string][]=[['registered','Registered'],['stills_review','With client'],['changes_requested','Changes'],['approved','Approved'],['video','Video'],['dispatched','Dispatched']];
const LABEL:Record<string,string>={...Object.fromEntries(STEPS),cancelled:'Cancelled'};
const TEMPLATES:Record<string,string[]>={
 'kerala-christian-v1':['Aerial church','Blessing','Invitation','Groom','Bride','Families','Holy Matrimony','Venue','Reception','Hosts','Save the Date'],
 'islam-christian-v1':[]
};
const KIND:Record<string,string>={registered:'Client registered',still_uploaded:'Still uploaded',sent:'Sent for approval',approved:'Approved',change:'Change requested',
 client_submit:'Client sent review',video:'Video started',dispatched:'Dispatched',cancelled:'Cancelled',link_rotated:'New link created'};
const pad=(n:number)=>String(n).padStart(2,'0');
const when=(iso:string|null)=>iso?new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'';

async function api(path:string,init:RequestInit={}){
 const res=await managerFetch('/api/client-proof?'+path,{...init,headers:{'Content-Type':'application/json',...(init.headers||{})}});
 const body=await res.json().catch(()=>({}));
 if(!res.ok){const e=new Error(body.error||'Request failed.') as Error&{status?:number};e.status=res.status;throw e;}
 return body;
}

async function shrink(file:File):Promise<string>{
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,1080/bitmap.width);
 const canvas=document.createElement('canvas');
 canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/jpeg',0.88);
}
const sceneFromName=(name:string)=>{const m=/(?:image|scene|still|s)[-_ ]?(\d{1,2})(?!\d)/i.exec(name)||/(\d{1,2})(?!\d)/.exec(name);return m?Number(m[1]):0;};

function shareText(job:Job){
 const first=job.round<=1;
 return `${first?'Hello':'Hello again'}${job.clientName?' '+job.clientName:''}! ${first?'The stills':'The updated stills'} for ${job.couple} are ready. Please check every scene and tap Approve or Change:\n${job.proofUrl}`;
}

export default function ClientDesk(){
 const [authed,setAuthed]=useState<boolean|null>(null);
 const [code,setCode]=useState('');
 const [jobs,setJobs]=useState<Job[]>([]);
 const [insights,setInsights]=useState<Insights|null>(null);
 const [filter,setFilter]=useState('active');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [creating,setCreating]=useState(false);
 const [jobId,setJobId]=useState(()=>new URLSearchParams(location.search).get('id')||'');

 async function loadList(){
  setBusy(true);setError('');
  try{const b=await api('action=list');setJobs(b.jobs);setInsights(b.insights);setAuthed(true);}
  catch(err){const e=err as Error&{status?:number};if(e.status===401)setAuthed(false);else{setAuthed(true);setError(e.message);}}
  finally{setBusy(false);}
 }
 useEffect(()=>{document.title='Clients | FindMyInvite Manager';void loadList();},[]);
 useEffect(()=>{const onPop=()=>setJobId(new URLSearchParams(location.search).get('id')||'');addEventListener('popstate',onPop);return ()=>removeEventListener('popstate',onPop);},[]);
 const openJob=(id:string)=>{history.pushState(null,'',id?'/manager/clients?id='+id:'/manager/clients');setJobId(id);if(!id)void loadList();window.scrollTo({top:0});};

 async function onGate(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const res=await fetch('/api/analytics?action=gate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gate:code})});
   if(!res.ok)throw new Error((await res.json().catch(()=>({}))).error||'That access code is not accepted.');
   await loadList();
  }catch(err){setError(err instanceof Error?err.message:'Could not open.');}
  finally{setBusy(false);}
 }

 const shown=useMemo(()=>jobs.filter(j=>filter==='all'?true:filter==='active'?!['dispatched','cancelled'].includes(j.status):j.status===filter),[jobs,filter]);

 if(authed===false)return <main className="cd-shell cd-gate">
  <form onSubmit={onGate} className="cd-card">
   <p className="cd-brand">FindMyInvite</p>
   <h1 className="cd-h1">Client approvals</h1>
   <p className="cd-muted">Photographers: <a href="/manager/login">sign in</a>. Operators may use the access code.</p>
   {!readSession()?.access_token&&<input type="password" inputMode="numeric" autoComplete="off" placeholder="Operator access code" value={code} onChange={e=>setCode(e.target.value)} aria-label="Access code"/>}
   {error&&<p className="cd-error" role="alert">{error}</p>}
   <button className="cd-btn cd-primary" disabled={busy||(!code.trim()&&!readSession()?.access_token)}>{busy?'Opening…':'Open'}</button>
  </form>
 </main>;
 if(authed===null)return <main className="cd-shell" aria-busy="true"><p className="cd-muted cd-pad">Opening client desk…</p></main>;
 if(jobId)return <JobView id={jobId} onBack={()=>openJob('')}/>;

 return <main className="cd-shell">
  <header className="cd-top">
   <div><p className="cd-brand">FindMyInvite</p><h1 className="cd-h1">Client approvals</h1></div>
   <nav className="cd-nav"><a className="cd-btn cd-ghost" href="/manager/pipeline">Pipeline</a><button className="cd-btn cd-primary" onClick={()=>setCreating(true)}>+ New client</button></nav>
  </header>
  {error&&<p className="cd-error cd-pad" role="alert">{error}</p>}
  {insights&&<section className="cd-insights" aria-label="Insights">
   <Stat label="With client" value={insights.awaitingClient}/>
   <Stat label="Changes to make" value={insights.needsWork} warn={insights.needsWork>0}/>
   <Stat label="Ready for video" value={insights.readyForVideo} good={insights.readyForVideo>0}/>
   <Stat label="In video" value={insights.byStatus.video||0}/>
   <Stat label="Dispatched" value={insights.byStatus.dispatched||0}/>
   <Stat label="First-pass approval" value={insights.firstPassApprovalRate==null?'—':insights.firstPassApprovalRate+'%'}/>
   <Stat label="Avg rounds" value={insights.avgRoundsToApproval??'—'}/>
   <Stat label="Hours to approval" value={insights.avgHoursToApproval??'—'}/>
   <Stat label="Hours approval → dispatch" value={insights.avgHoursApprovalToDispatch??'—'}/>
  </section>}
  {!!insights?.topChangedScenes.length&&<p className="cd-muted cd-pad">Most changed: {insights.topChangedScenes.map(s=>`${s.title} (${s.count})`).join(' · ')}</p>}
  <div className="cd-chips" role="tablist" aria-label="Filter">
   {[['active','Active'],...STEPS,['cancelled','Cancelled'],['all','All']].map(([k,l])=><button key={k} role="tab" aria-selected={filter===k} className={'cd-chip'+(filter===k?' on':'')} onClick={()=>setFilter(k)}>{l}{k!=='active'&&k!=='all'&&insights?.byStatus[k]?` ${insights.byStatus[k]}`:''}</button>)}
  </div>
  <ul className="cd-list">
   {shown.length===0&&<li className="cd-muted cd-pad">{busy?'Loading…':'No clients here yet.'}</li>}
   {shown.map(j=><li key={j.id}><button className="cd-row" onClick={()=>openJob(j.id)}>
    <span className="cd-row-main"><strong>{j.couple}</strong><span className="cd-muted">{[j.clientName,j.template].filter(Boolean).join(' · ')||'—'}</span></span>
    <span className="cd-row-side"><span className={'cd-pill s-'+j.status}>{LABEL[j.status]}</span><span className="cd-muted">{j.stillCount?`${j.approvedCount}/${j.stillCount} ✓`:'no stills'}{j.changeCount?` · ${j.changeCount} ✎`:''}{j.round?` · R${j.round}`:''}</span></span>
   </button></li>)}
  </ul>
  {creating&&<NewClient onClose={()=>setCreating(false)} onCreated={j=>{setCreating(false);openJob(j.id);}}/>}
 </main>;
}

function Stat({label,value,warn,good}:{label:string;value:number|string;warn?:boolean;good?:boolean}){
 return <div className={'cd-stat'+(warn?' warn':'')+(good?' good':'')}><strong>{value}</strong><span>{label}</span></div>;
}

function NewClient({onClose,onCreated}:{onClose:()=>void;onCreated:(j:Job)=>void}){
 const [f,setF]=useState({couple:'',clientName:'',clientPhone:'',template:'kerala-christian-v1',notes:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{onCreated((await api('action=create',{method:'POST',body:JSON.stringify(f)})).job);}
  catch(err){setError(err instanceof Error?err.message:'Could not register client.');}
  finally{setBusy(false);}
 }
 const set=(k:keyof typeof f)=>(e:{target:{value:string}})=>setF(x=>({...x,[k]:e.target.value}));
 return <div className="cd-sheet" role="dialog" aria-modal="true" aria-label="New client">
  <form className="cd-sheet-body" onSubmit={submit}>
   <h2 className="cd-h2">Register a new client</h2>
   <label>Couple (shown to client)<input required maxLength={120} value={f.couple} onChange={set('couple')} placeholder="Blessing & Stephy"/></label>
   <label>Client name<input maxLength={120} value={f.clientName} onChange={set('clientName')} placeholder="Who approves (optional)"/></label>
   <label>WhatsApp number<input type="tel" inputMode="tel" maxLength={32} value={f.clientPhone} onChange={set('clientPhone')} placeholder="+91 98765 43210"/></label>
   <label>Template<input list="cd-templates" maxLength={80} value={f.template} onChange={set('template')}/></label>
   <datalist id="cd-templates">{Object.keys(TEMPLATES).map(t=><option key={t} value={t}/>)}</datalist>
   <label>Notes<textarea rows={3} maxLength={2000} value={f.notes} onChange={set('notes')} placeholder="Brief, event dates, anything to remember"/></label>
   {error&&<p className="cd-error" role="alert">{error}</p>}
   <div className="cd-sheet-actions"><button type="button" className="cd-btn" onClick={onClose}>Cancel</button><button className="cd-btn cd-primary" disabled={busy||!f.couple.trim()}>{busy?'Saving…':'Register client'}</button></div>
  </form>
 </div>;
}

function JobView({id,onBack}:{id:string;onBack:()=>void}){
 const [job,setJob]=useState<Job|null>(null);
 const [stills,setStills]=useState<Still[]>([]);
 const [log,setLog]=useState<LogRow[]>([]);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState('');
 const [finalUrl,setFinalUrl]=useState('');
 const [copied,setCopied]=useState(false);

 async function load(){
  setError('');
  try{const b=await api('action=job&id='+id);setJob(b.job);setStills(b.stills);setLog(b.log);setFinalUrl(b.job.finalUrl||'');}
  catch(err){setError(err instanceof Error?err.message:'Could not open client.');}
 }
 useEffect(()=>{void load();},[id]);

 async function act(label:string,fn:()=>Promise<unknown>){
  setBusy(label);setError('');
  try{await fn();await load();}catch(err){setError(err instanceof Error?err.message:'Action failed.');}finally{setBusy('');}
 }
 async function upload(files:FileList|null,forScene?:number){
  if(!files?.length||!job)return;
  const titles=TEMPLATES[job.template]||[];
  const list=[...files].map((file,i)=>({file,scene:forScene||sceneFromName(file.name)||(stills.length+i+1)})).sort((a,b)=>a.scene-b.scene);
  await act('upload',async()=>{
   for(const [i,{file,scene}] of list.entries()){
    setBusy(`upload ${i+1}/${list.length}`);
    const existing=stills.find(s=>s.scene===scene);
    await api(`action=still&id=${id}&scene=${scene}`,{method:'POST',body:JSON.stringify({dataUrl:await shrink(file),title:existing?.title||titles[scene-1]||''})});
   }
  });
 }
 async function copy(){if(!job)return;await navigator.clipboard?.writeText(job.proofUrl).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),1600);}

 if(!job)return <main className="cd-shell"><header className="cd-top"><button className="cd-btn cd-ghost" onClick={onBack}>← Clients</button></header>{error?<p className="cd-error cd-pad" role="alert">{error}</p>:<p className="cd-muted cd-pad">Loading…</p>}</main>;
 const closed=['dispatched','cancelled'].includes(job.status);
 const reviewable=!['approved','video','dispatched','cancelled'].includes(job.status);
 const phone=job.clientPhone.replace(/[^\d]/g,'');
 const stepIdx=STEPS.findIndex(([k])=>k===job.status);
 return <main className="cd-shell">
  <header className="cd-top">
   <button className="cd-btn cd-ghost" onClick={onBack}>← Clients</button>
   <span className={'cd-pill s-'+job.status}>{LABEL[job.status]}{job.round?` · R${job.round}`:''}</span>
  </header>
  <section className="cd-pad">
   <h1 className="cd-h1">{job.couple}</h1>
   <p className="cd-muted">{[job.clientName,job.clientPhone,job.template].filter(Boolean).join(' · ')}</p>
   {job.notes&&<p className="cd-notes">{job.notes}</p>}
   <ol className="cd-steps" aria-label="Progress">{STEPS.map(([k,l],i)=><li key={k} className={i<stepIdx?'done':i===stepIdx?'now':''}>{l}</li>)}</ol>
  </section>
  {error&&<p className="cd-error cd-pad" role="alert">{error}</p>}

  <section className="cd-panel">
   <h2 className="cd-h2">Client link</h2>
   <div className="cd-link"><input readOnly value={job.proofUrl} aria-label="Client approval link" onFocus={e=>e.target.select()}/><button className="cd-btn" onClick={()=>void copy()}>{copied?'Copied':'Copy'}</button></div>
   <div className="cd-share">
    <a className="cd-btn cd-wa" href={`https://wa.me/${phone}?text=${encodeURIComponent(shareText(job))}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a className="cd-btn" href={`https://t.me/share/url?url=${encodeURIComponent(job.proofUrl)}&text=${encodeURIComponent(shareText(job).replace('\n'+job.proofUrl,''))}`} target="_blank" rel="noopener noreferrer">Telegram</a>
    <a className="cd-btn" href={job.proofUrl} target="_blank" rel="noopener noreferrer">Preview</a>
   </div>
   {job.status==='registered'&&<p className="cd-muted">The link opens for the client after you press “Send for approval”.</p>}
  </section>

  <section className="cd-panel">
   <div className="cd-panel-h">
    <h2 className="cd-h2">Stills <span className="cd-muted">{stills.filter(s=>s.decision==='approved').length}/{stills.length} approved</span></h2>
    {!closed&&<label className="cd-btn cd-upload">{busy.startsWith('upload')?busy.replace('upload','Uploading'):'+ Add stills'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={!!busy} onChange={e=>{void upload(e.target.files);e.target.value='';}}/></label>}
   </div>
   {reviewable&&stills.length>0&&<button className="cd-btn cd-primary cd-wide" disabled={!!busy||job.status==='stills_review'} onClick={()=>void act('send',()=>api('action=send&id='+id,{method:'POST'}))}>
    {busy==='send'?'Sending…':job.status==='stills_review'?'Waiting for client':job.round?`Send round ${job.round+1} for approval`:'Send for approval'}
   </button>}
   {stills.length===0&&<p className="cd-muted">Add the generated stills (file names like image-7.jpg go to scene 7).</p>}
   <ul className="cd-stills">
    {stills.map(s=><li key={s.scene} className={'d-'+s.decision}>
     <a href={s.image} target="_blank" rel="noopener noreferrer"><img src={s.image} alt={`Scene ${pad(s.scene)}`} loading="lazy" width={720} height={1280}/></a>
     <div>
      <strong>{pad(s.scene)} {s.title}</strong>
      <span className={'cd-dec d-'+s.decision}>{s.decision==='approved'?'✓ Approved':s.decision==='change'?'✎ Change':'Pending'}{s.version>1?` · v${s.version}`:''}</span>
      {s.comment&&<p className="cd-comment">“{s.comment}”</p>}
      {!closed&&<label className="cd-link-btn">Replace<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={!!busy} onChange={e=>{void upload(e.target.files,s.scene);e.target.value='';}}/></label>}
     </div>
    </li>)}
   </ul>
  </section>

  <section className="cd-panel">
   <h2 className="cd-h2">Video & dispatch</h2>
   {job.status==='changes_requested'&&<p className="cd-muted">Replace the stills marked ✎, then send the next round.</p>}
   <div className="cd-share">
    {reviewable&&<button className="cd-btn" disabled={!!busy} onClick={()=>{if(confirm('Mark all stills approved on the client’s behalf?'))void act('status',()=>api('action=status&id='+id,{method:'POST',body:JSON.stringify({status:'approved',note:'approved by operator'})}));}}>Mark approved</button>}
    {job.status==='approved'&&<button className="cd-btn cd-primary" disabled={!!busy} onClick={()=>void act('status',()=>api('action=status&id='+id,{method:'POST',body:JSON.stringify({status:'video'})}))}>Start video</button>}
   </div>
   {['approved','video','dispatched'].includes(job.status)&&<form className="cd-dispatch" onSubmit={e=>{e.preventDefault();void act('status',()=>api('action=status&id='+id,{method:'POST',body:JSON.stringify({status:'dispatched',finalUrl})}));}}>
    <label>Final video link (shown to client)<input type="url" inputMode="url" placeholder="https://…" value={finalUrl} onChange={e=>setFinalUrl(e.target.value)}/></label>
    <button className="cd-btn cd-primary" disabled={!!busy}>{job.status==='dispatched'?'Update dispatch':'Dispatch to client'}</button>
   </form>}
   {job.dispatchedAt&&<p className="cd-muted">Dispatched {when(job.dispatchedAt)}</p>}
   <div className="cd-share cd-danger">
    <button className="cd-btn cd-ghost" disabled={!!busy} onClick={()=>{if(confirm('Create a new client link? The old link stops working.'))void act('rotate',()=>api('action=rotate&id='+id,{method:'POST'}));}}>New link</button>
    {!closed&&<button className="cd-btn cd-ghost" disabled={!!busy} onClick={()=>{if(confirm('Cancel this client job?'))void act('status',()=>api('action=status&id='+id,{method:'POST',body:JSON.stringify({status:'cancelled'})}));}}>Cancel job</button>}
   </div>
  </section>

  <section className="cd-panel">
   <h2 className="cd-h2">Timeline</h2>
   <ol className="cd-log">{[...log].reverse().map((e,i)=><li key={i}><span className={'cd-actor a-'+e.actor}>{e.actor==='client'?'Client':'You'}</span><span>{KIND[e.kind]||e.kind}{e.scene?` · scene ${pad(e.scene)}`:''}{e.detail?` — ${e.detail}`:''}</span><time>{when(e.created_at)}</time></li>)}</ol>
  </section>
 </main>;
}
