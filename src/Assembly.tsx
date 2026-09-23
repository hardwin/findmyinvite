import {useEffect,useRef,useState,type FormEvent} from 'react';
import './akay.css';
import './assembly-wizard.css';

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
 branch?:string|null;
 githubUrl?:string|null;
 previewUrl?:string|null;
 spend?:{budget:number;used:number;remaining:number};
 stills?:{first:string|null;last:string|null};
 error?:string|null;
};

const T1_JOB_STORAGE_KEY='fmi.assembly.t1JobId';
const PARENT_STORAGE_KEY='fmi.assembly.parentId';

function readStored(key:string){
 try{return sessionStorage.getItem(key)||'';}catch{return '';}
}
function writeStored(key:string,id:string){
 try{
  if(id)sessionStorage.setItem(key,id);
  else sessionStorage.removeItem(key);
 }catch{/* private mode */}
}

const GENERATE_PRICE='Proceed to generate (Rs. 499)';

type Wizard='pin'|'song'|'work'|'review'|'preview';

function wizardFromJob(job:Template1Status|null,cloud=false):Wizard{
 if(!job)return 'pin';
 if(job.status==='preview')return 'preview';
 // Cloud auto-continues past stills — keep the progress screen.
 if(cloud&&(job.status==='review'||job.status==='running'||job.status==='queued'))return 'work';
 if(job.status==='review')return 'review';
 if(job.status==='running'||job.status==='failed')return 'work';
 return 'pin';
}

export default function Assembly(){
 const [code,setCode]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [writable,setWritable]=useState(false);
 const [cloud,setCloud]=useState(false);
 const [tracks,setTracks]=useState<MusicTrack[]>([]);
 const [parentId,setParentId]=useState(()=>readStored(PARENT_STORAGE_KEY));
 const [t1Pin,setT1Pin]=useState('');
 const [t1Name,setT1Name]=useState('');
 const [t1Music,setT1Music]=useState('');
 const [t1Job,setT1Job]=useState<Template1Status|null>(null);
 const [step,setStep]=useState<Wizard>('pin');
 const audio=useRef<HTMLAudioElement|null>(null);
 const alerted=useRef('');

 useEffect(()=>{
  document.title='Assembly · FindMyInvite';
  const meta=document.createElement('meta');
  meta.name='robots';
  meta.content='noindex,nofollow';
  document.head.appendChild(meta);
  return()=>{meta.remove();};
 },[]);

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
   setCloud(Boolean(status.cloud));
   const parentsRes=await fetch('/api/assembly?action=parents',{credentials:'same-origin'});
   const parentsBody=await parentsRes.json().catch(()=>({}));
   const list=parentsBody.parents||[];
   const next=(list[list.length-1]||list[0])?.id||'';
   setParentId(next);
   writeStored(PARENT_STORAGE_KEY,next);
   const musicRes=await fetch('/api/assembly?action=music-library',{credentials:'same-origin'});
   const musicBody=await musicRes.json().catch(()=>({}));
   const listTracks:MusicTrack[]=musicBody.tracks||[];
   setTracks(listTracks);
   setT1Music(current=>current&&listTracks.some(t=>t.id===current)?current:(listTracks[0]?.id||''));
   const wanted=readStored(T1_JOB_STORAGE_KEY);
   if(wanted){
    const res=await fetch('/api/assembly?action=template1-status&jobId='+encodeURIComponent(wanted),{credentials:'same-origin'});
    if(res.ok){
     const body=await res.json();
     setT1Job(body);
     setStep(wizardFromJob(body,Boolean(status.cloud)));
     if(body.status==='failed'&&body.error)setError(body.error);
    }
   }
  }catch(err){
   setError(err instanceof Error?err.message:'Could not open Assembly.');
  }finally{
   setBusy(false);
  }
 }

 useEffect(()=>{void bootstrap();},[]);

 useEffect(()=>{
  if(!t1Job||(t1Job.status!=='running'&&!(cloud&&(t1Job.status==='queued'||t1Job.status==='review'))))return;
  const timer=setInterval(()=>{
   void (async()=>{
    try{
     const res=await fetch('/api/assembly?action=template1-status&jobId='+encodeURIComponent(t1Job.jobId),{credentials:'same-origin'});
     const body=await res.json().catch(()=>({}));
     if(!res.ok)throw new Error(body.error||'Status failed.');
     writeStored(T1_JOB_STORAGE_KEY,body.jobId||t1Job.jobId);
     setT1Job(body);
     setStep(wizardFromJob(body,cloud));
     if(body.status==='failed'){
      const msg=body.error||'Template 1 failed.';
      setError(msg);
      const key=(body.jobId||t1Job.jobId)+'|'+msg;
      if(alerted.current!==key){alerted.current=key;window.alert(msg);}
     }
    }catch(err){
     setError(err instanceof Error?err.message:'Status failed.');
    }
   })();
  },2000);
  return()=>clearInterval(timer);
 },[t1Job?.jobId,t1Job?.status,cloud]);

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

 async function onGenerate(){
  if(!t1Pin.trim()){setError('Paste a Pinterest URL.');return;}
  if(!t1Name.trim()){setError('Name this invite.');return;}
  if(!t1Music){setError('Pick a song.');return;}
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/assembly?action=template1-start',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     pinUrl:t1Pin.trim(),
     displayName:t1Name.trim(),
     parentId,
     musicId:t1Music,
     budgetUsd:4
    })
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){setAuthed(false);return;}
   if(!res.ok)throw new Error(body.error||'Could not start.');
   writeStored(T1_JOB_STORAGE_KEY,body.jobId);
   setT1Job({jobId:body.jobId,status:'running',phase:'queued',percent:0,label:'Queued…',spend:body.spend});
   setStep('work');
  }catch(err){
   setError(err instanceof Error?err.message:'Could not start.');
  }finally{
   setBusy(false);
  }
 }

 async function onProceed(){
  if(!t1Job)return;
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/assembly?action=template1-proceed',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId:t1Job.jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Could not continue.');
   setT1Job(body);
   setStep('work');
  }catch(err){
   setError(err instanceof Error?err.message:'Could not continue.');
  }finally{
   setBusy(false);
  }
 }

 function playTrack(track:MusicTrack){
  if(!audio.current)audio.current=new Audio();
  const el=audio.current;
  if(el.src.endsWith(track.url)&&!el.paused){el.pause();return;}
  el.src=track.url;
  void el.play().catch(()=>{});
 }

 if(!authed){
  return (
   <main className="asm-shell">
    <div className="asm-phone">
     <p className="asm-brand">FindMyInvite</p>
     <div className="asm-stage">
      <h1>Assembly</h1>
      <p className="lead">Same code as /akay.</p>
      <form className="asm-gate" onSubmit={onGate} autoComplete="off">
       <input className="asm-field" type="password" placeholder="Access code" value={code} onChange={e=>setCode(e.target.value)} autoFocus required/>
       {error&&<p className="asm-alert" role="alert">{error}</p>}
       <button className="asm-pill" type="submit" disabled={busy}>{busy?'…':'Enter'}</button>
      </form>
     </div>
    </div>
   </main>
  );
 }

 const index=step==='pin'?1:step==='song'?2:step==='review'?3:step==='preview'?4:3;

 return (
  <main className="asm-shell">
   <div className="asm-phone">
    <div className="asm-top">
     <p className="asm-brand">FindMyInvite</p>
     <p className="asm-step">{index}/4</p>
    </div>

    {step==='pin'&&(
     <section className="asm-stage" data-testid="asm-pin">
      <h1>Paste your Pinterest link</h1>
      <p className="lead">We’ll paint the first and last frames of your opening next.</p>
      <input className="asm-field" type="url" placeholder="https://pin.it/… or Pinterest URL" value={t1Pin} onChange={e=>setT1Pin(e.target.value)} aria-label="Pinterest URL"/>
      <input className="asm-field" maxLength={80} placeholder="Name this invite" value={t1Name} onChange={e=>setT1Name(e.target.value)} aria-label="Invite name"/>
      {error&&<p className="asm-alert" role="alert">{error}</p>}
      {!writable&&!cloud&&<p className="asm-alert">Run this on your local machine.</p>}
      {cloud&&<p className="lead">Cloud Assembly is on — no ThinkPad required.</p>}
      <button className="asm-pill" type="button" disabled={!t1Pin.trim()||!t1Name.trim()} onClick={()=>setStep('song')}>Next</button>
     </section>
    )}

    {step==='song'&&(
     <section className="asm-stage" data-testid="asm-song">
      <h1>Choose your audio</h1>
      <p className="lead">Tap a track to preview. Same library as the invite tap-to-play.</p>
      <div className="asm-tracks">
       {tracks.map(track=>(
        <button
         key={track.id}
         type="button"
         className={'asm-track'+(t1Music===track.id?' is-on':'')}
         onClick={()=>{setT1Music(track.id);playTrack(track);}}
        >
         <span>
          {track.displayName}
          <small>{track.durationS?Math.round(track.durationS)+'s':'library'}</small>
         </span>
         <em>{t1Music===track.id?'Selected':'Select'}</em>
        </button>
       ))}
      </div>
      {error&&<p className="asm-alert" role="alert">{error}</p>}
      <button className="asm-pill" type="button" disabled={!writable||busy||!t1Music} onClick={()=>void onGenerate()}>{busy?'Painting…':(cloud?'Generate invite':'Show opening stills')}</button>
      <button className="asm-ghost" type="button" onClick={()=>setStep('pin')}>Back</button>
     </section>
    )}

    {step==='work'&&(
     <section className="asm-stage" data-testid="asm-work">
      <h1>{t1Job?.status==='failed'?'Stopped':(t1Job?.phase==='gen'||t1Job?.phase==='craft'||t1Job?.phase==='assemble'?'Creating your invite':'Painting your opening')}</h1>
      <p className="lead">{t1Job?.label||'Working…'}</p>
      <div className="asm-progress" aria-hidden="true"><i style={{width:(t1Job?.percent||8)+'%'}}/></div>
      {t1Job?.detail&&<p className="lead">{t1Job.detail}</p>}
      {(error||t1Job?.error)&&<p className="asm-alert" role="alert">{error||t1Job?.error}</p>}
      {t1Job?.status==='failed'&&t1Job?.stills?.first&&t1Job?.stills?.last&&(
       <button className="asm-pill" type="button" disabled={busy} onClick={()=>void onProceed()}>{busy?'Retrying…':'Retry generate'}</button>
      )}
      {t1Job?.status==='failed'&&(
       <button className="asm-ghost" type="button" onClick={()=>{setT1Job(null);setStep('pin');setError('');}}>Start over</button>
      )}
     </section>
    )}

    {step==='review'&&(
     <section className="asm-stage" data-testid="asm-review">
      <h1>Your opening</h1>
      <p className="lead">First and last frame. Like these? Generate the invite.</p>
      <div className="asm-pair">
       <figure className="asm-still">
        {t1Job?.stills?.first?<img src={t1Job.stills.first} alt="First frame"/>:<div/>}
        <figcaption>First</figcaption>
       </figure>
       <figure className="asm-still">
        {t1Job?.stills?.last?<img src={t1Job.stills.last} alt="Last frame"/>:<div/>}
        <figcaption>Last</figcaption>
       </figure>
      </div>
      {error&&<p className="asm-alert" role="alert">{error}</p>}
      <button className="asm-pill" type="button" disabled={busy||!t1Job?.stills?.first||!t1Job?.stills?.last} onClick={()=>void onProceed()}>
       {busy?'Starting…':GENERATE_PRICE}
      </button>
     </section>
    )}

    {step==='preview'&&(
     <section className="asm-stage" data-testid="asm-preview">
      <h1>Your invite is ready</h1>
      <p className="lead">{t1Job?.displayName||t1Job?.cloneId}</p>
      <div className="asm-pair">
       {t1Job?.cloneId&&!t1Job?.previewUrl&&(
        <>
         <figure className="asm-still">
          <video src={'/assets/'+t1Job.cloneId+'.mp4'} poster={'/assets/'+t1Job.cloneId+'.jpg'} controls playsInline preload="metadata"/>
         </figure>
         <figure className="asm-still">
          <video src={'/assets/'+t1Job.cloneId+'-hero.mp4'} controls playsInline preload="metadata" muted loop/>
         </figure>
        </>
       )}
      </div>
      {(t1Job?.previewUrl||t1Job?.demo)&&(
       <a className="asm-link" href={t1Job.previewUrl||t1Job.demo||'#'} target="_blank" rel="noreferrer">
        {t1Job.previewUrl||((typeof window!=='undefined'?window.location.origin:'')+(t1Job.demo||''))}
       </a>
      )}
      {t1Job?.githubUrl&&(
       <a className="asm-link" href={t1Job.githubUrl} target="_blank" rel="noreferrer">
        {t1Job.branch||'GitHub branch'}
       </a>
      )}
      <button className="asm-pill" type="button" onClick={()=>{setT1Job(null);writeStored(T1_JOB_STORAGE_KEY,'');setStep('pin');}}>New pin</button>
     </section>
    )}
   </div>
  </main>
 );
}
