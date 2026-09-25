import {useEffect,useMemo,useState,type FormEvent,type MouseEvent} from 'react';
import './assembly-pipeline.css';
import {managerFetch} from './manager-api';
import {readSession} from './auth-session';

type Job={
 jobId:string;
 status:string;
 phase:string;
 percent:number;
 label:string;
 detail?:string;
 displayName?:string;
 cloneId?:string|null;
 branch?:string|null;
 githubUrl?:string|null;
 previewUrl?:string|null;
 pinUrl?:string;
 spend?:{budget?:number;used?:number;remaining?:number};
 stills?:{first?:string|null;last?:string|null};
 regenRole?:string|null;
 error?:string|null;
 cancelRequested?:boolean;
 catalogPublished?:boolean;
 mergeUrl?:string|null;
 sandboxId?:string|null;
 createdAt?:number;
 updatedAt?:number;
};

type ColumnId='queued'|'pin'|'gen'|'craft'|'assemble'|'preview'|'failed';

const COLUMNS:Array<{id:ColumnId;title:string}>=[
 {id:'queued',title:'Queued'},
 {id:'pin',title:'Pin'},
 {id:'gen',title:'Gen'},
 {id:'craft',title:'Craft'},
 {id:'assemble',title:'Assemble'},
 {id:'preview',title:'Preview'},
 {id:'failed',title:'Failed'}
];

function columnFor(job:Job):ColumnId{
 if(job.status==='failed'||job.status==='cancelled')return 'failed';
 if(job.status==='preview')return 'preview';
 const phase=String(job.phase||'queued');
 if(phase==='pin')return 'pin';
 if(phase==='gen'||phase==='review')return 'gen';
 if(phase==='craft')return 'craft';
 if(phase==='assemble')return 'assemble';
 if(phase==='preview')return 'preview';
 if(phase==='failed'||phase==='cancelled')return 'failed';
 return 'queued';
}

function jobTime(job:Job){
 return Number(job.updatedAt||job.createdAt||0)||0;
}

function formatJobDate(ms:number){
 if(!ms)return '—';
 const d=new Date(ms);
 if(Number.isNaN(d.getTime()))return '—';
 const day=d.getDate();
 const ord=day%10===1&&day%100!==11?'st':day%10===2&&day%100!==12?'nd':day%10===3&&day%100!==13?'rd':'th';
 return day+ord+' '+d.toLocaleString('en-GB',{month:'short'})+' '+d.getFullYear();
}

function canDiscard(job:Job){
 const status=String(job.status||'');
 if(status==='failed'||status==='cancelled'||status==='queued')return true;
 // Stuck running — allow discard without waiting for a hard fail.
 if(status==='running')return true;
 return false;
}

function canRetry(job:Job){
 const status=String(job.status||'');
 // Preview/review use Approve / Resume push — not a full re-run.
 if(status==='preview'||status==='review')return false;
 // Failed always. Running/queued too — cloud sandboxes can hang mid-pin with no error field.
 if(status==='failed'||status==='cancelled'||status==='running'||status==='queued')return true;
 return false;
}

function needsApproval(job:Pick<Job,'status'|'phase'>&{stills?:{first?:string|null;last?:string|null}}){
 const status=String(job.status||'');
 const phase=String(job.phase||'');
 if(status==='review'||phase==='review')return true;
 const hasStills=Boolean(job.stills?.first&&job.stills?.last);
 if((status==='failed'||status==='cancelled')&&hasStills)return true;
 return false;
}

function spendLabel(job:Job){
 const used=job.spend?.used;
 if(used==null||Number.isNaN(Number(used)))return '$0.00';
 return '$'+Number(used).toFixed(2);
}

export default function AssemblyPipeline(){
 const [code,setCode]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [actionBusy,setActionBusy]=useState(false);

 useEffect(()=>{
  document.title='Assembly Pipeline · FindMyInvite';
  const meta=document.createElement('meta');
  meta.name='robots';
  meta.content='noindex,nofollow';
  document.head.appendChild(meta);
  return()=>{meta.remove();};
 },[]);

 async function loadJobs(){
  const res=await managerFetch('/api/assembly?action=template1-status');
  if(res.status===401){setAuthed(false);return;}
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(body.error||'Could not load pipelines.');
  setAuthed(true);
  setJobs(Array.isArray(body.jobs)?body.jobs:[]);
 }

 useEffect(()=>{
  void (async()=>{
   setBusy(true);
   setError('');
   try{await loadJobs();}
   catch(err){setError(err instanceof Error?err.message:'Could not open Pipeline.');}
   finally{setBusy(false);}
  })();
 },[]);

 useEffect(()=>{
  if(!authed)return;
  const timer=setInterval(()=>{void loadJobs().catch(()=>{});},4000);
  return()=>clearInterval(timer);
 },[authed]);

 async function onGate(e:FormEvent){
  e.preventDefault();
  setBusy(true);
  setError('');
  try{
   const res=await fetch('/api/analytics?action=gate',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gate:code})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Access denied.');
   setCode('');
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Could not unlock.');
  }finally{
   setBusy(false);
  }
 }

 const selected=useMemo(()=>jobs.find(j=>j.jobId===selectedId)||null,[jobs,selectedId]);
 const grouped=useMemo(()=>{
  const map:Record<ColumnId,Job[]>={queued:[],pin:[],gen:[],craft:[],assemble:[],preview:[],failed:[]};
  for(const job of jobs)map[columnFor(job)].push(job);
  for(const id of Object.keys(map) as ColumnId[])map[id].sort((a,b)=>jobTime(b)-jobTime(a));
  return map;
 },[jobs]);

 async function discardJob(jobId:string,event?:MouseEvent){
  event?.stopPropagation();
  event?.preventDefault();
  if(!window.confirm('Discard this job from the board?'))return;
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-discard',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Discard failed.');
   if(selectedId===jobId)setSelectedId(null);
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Discard failed.');
  }finally{
   setActionBusy(false);
  }
 }

 async function retryJob(jobId:string,event?:MouseEvent){
  event?.stopPropagation();
  event?.preventDefault();
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-retry',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Retry failed.');
   setSelectedId(body.jobId||jobId);
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Retry failed.');
  }finally{
   setActionBusy(false);
  }
 }

 async function approveJob(jobId:string,event?:MouseEvent){
  event?.stopPropagation();
  event?.preventDefault();
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-proceed',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Approve failed.');
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Approve failed.');
  }finally{
   setActionBusy(false);
  }
 }

 async function iterateStill(jobId:string,role:'first'|'last'){
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-regen-still',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId,role})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Iterate failed.');
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Iterate failed.');
  }finally{
   setActionBusy(false);
  }
 }

 async function resumePush(jobId:string){
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-resume-push',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Resume push failed.');
   await loadJobs();
   setSelectedId(body.jobId||jobId);
  }catch(err){
   setError(err instanceof Error?err.message:'Resume push failed.');
  }finally{
   setActionBusy(false);
  }
 }

 async function addToCatalog(jobId:string){
  setActionBusy(true);
  setError('');
  try{
   const res=await managerFetch('/api/assembly?action=template1-add-catalog',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jobId})
   });
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Could not add to catalogue.');
   await loadJobs();
  }catch(err){
   setError(err instanceof Error?err.message:'Could not add to catalogue.');
  }finally{
   setActionBusy(false);
  }
 }

 if(!authed){
  return (
   <main className="pipe-shell pipe-gate">
    <form onSubmit={onGate}>
     <p className="pipe-brand">FindMyInvite</p>
     <h1 className="pipe-title">Manager Pipeline</h1>
     <p className="lead">Event planners & photographers: <a href="/manager/login">sign in</a>. Operators may still use the /akay access code.</p>
     {!readSession()?.access_token&&(
      <>
       <input type="password" inputMode="numeric" autoComplete="off" placeholder="Operator access code" value={code} onChange={e=>setCode(e.target.value)} aria-label="Access code"/>
       {error&&<p className="pipe-alert" role="alert">{error}</p>}
       <button type="submit" disabled={busy||!code.trim()}>{busy?'Opening…':'Open with code'}</button>
      </>
     )}
     {readSession()?.access_token&&(
      <>
       {error&&<p className="pipe-alert" role="alert">{error}</p>}
       <button type="button" disabled={busy} onClick={()=>{void loadJobs();}}>{busy?'Opening…':'Retry session'}</button>
      </>
     )}
    </form>
   </main>
  );
 }

 return (
  <main className="pipe-shell">
   <header className="pipe-top">
    <div>
     <p className="pipe-brand">FindMyInvite</p>
     <h1 className="pipe-title">Assembly pipeline</h1>
    </div>
    <nav className="pipe-nav">
     <a className="pipe-ghost" href="/manager">New invite</a>
     <button type="button" className="pipe-ghost" disabled={busy} onClick={()=>void loadJobs()}>{busy?'Refreshing…':'Refresh'}</button>
    </nav>
   </header>
   {error&&<p className="pipe-alert" role="alert">{error}</p>}

   <div className="pipe-board" role="list">
    {COLUMNS.map(col=>{
     const list=grouped[col.id];
     return (
      <section className="pipe-col" key={col.id} aria-label={col.title}>
       <div className="pipe-col-h">
        <strong>{col.title}</strong>
        <span>{list.length}</span>
       </div>
       <div className="pipe-col-body">
        {list.length===0&&<p className="pipe-empty">—</p>}
        {list.map(job=>{
         const name=job.displayName||job.cloneId||job.jobId.slice(0,8);
         return (
          <div
           key={job.jobId}
           className={'pipe-card'+(selectedId===job.jobId?' is-on':'')}
           role="button"
           tabIndex={0}
           onClick={()=>setSelectedId(job.jobId)}
           onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedId(job.jobId);}}}
          >
           <div className="pipe-card-row">
            <strong className="pipe-name" title={name}>{name}</strong>
            <span className="pipe-card-actions">
             {needsApproval(job)&&(
              <button
               type="button"
               className="pipe-approve"
               disabled={actionBusy}
               aria-label={'Approve '+name}
               onClick={e=>void approveJob(job.jobId,e)}
              >
               Approve
              </button>
             )}
             {canRetry(job)&&(
              <button
               type="button"
               className="pipe-retry"
               disabled={actionBusy}
               aria-label={'Retry '+name}
               onClick={e=>void retryJob(job.jobId,e)}
              >
               Retry
              </button>
             )}
             {canDiscard(job)&&(
              <button
               type="button"
               className="pipe-discard"
               disabled={actionBusy}
               aria-label={'Discard '+name}
               onClick={e=>void discardJob(job.jobId,e)}
              >
               Discard
              </button>
             )}
            </span>
           </div>
           <div className="pipe-card-meta">
            <span>{job.percent||0}%</span>
            <span>{spendLabel(job)}</span>
            <span>{formatJobDate(jobTime(job))}</span>
           </div>
          </div>
         );
        })}
       </div>
      </section>
     );
    })}
   </div>

   {selected&&(
    <div className="pipe-drawer" role="dialog" aria-modal="true" onClick={()=>setSelectedId(null)}>
     <div className="pipe-drawer-panel" onClick={e=>e.stopPropagation()}>
      <p className="pipe-brand">Job {selected.jobId}</p>
      <h2>{selected.displayName||selected.cloneId||'Pipeline job'}</h2>
      <p className="lead">{selected.label} — {selected.detail}</p>
      <p className="pipe-card-meta" style={{marginBottom:12}}>
       <span>{selected.percent||0}%</span>
       <span>{spendLabel(selected)}</span>
       <span>{formatJobDate(jobTime(selected))}</span>
      </p>
      {selected.error&&(
       <div className="pipe-section">
        <h3>Error log</h3>
        <pre className="pipe-error-log" role="alert">{selected.error}</pre>
       </div>
      )}
      {(selected.stills?.first||selected.stills?.last)&&(
       <div className="pipe-stills" role="group" aria-label="Opening stills">
        {selected.stills?.first&&(
         <figure className="pipe-still">
          <img src={selected.stills.first} alt="Door-First" loading="lazy"/>
          <figcaption>Door-First</figcaption>
          {needsApproval(selected)&&(
           <button
            type="button"
            className="pipe-iterate"
            disabled={actionBusy||Boolean(selected.regenRole)}
            onClick={()=>void iterateStill(selected.jobId,'first')}
           >
            {selected.regenRole==='opening-first'?'Iterating…':'Iterate'}
           </button>
          )}
         </figure>
        )}
        {selected.stills?.last&&(
         <figure className="pipe-still">
          <img src={selected.stills.last} alt="Last still" loading="lazy"/>
          <figcaption>Last</figcaption>
          {needsApproval(selected)&&(
           <button
            type="button"
            className="pipe-iterate"
            disabled={actionBusy||Boolean(selected.regenRole)}
            onClick={()=>void iterateStill(selected.jobId,'last')}
           >
            {selected.regenRole==='opening-last'?'Iterating…':'Iterate'}
           </button>
          )}
         </figure>
        )}
       </div>
      )}
      <div className="pipe-links">
       {selected.previewUrl&&<a href={selected.previewUrl} target="_blank" rel="noreferrer">Preview</a>}
       {selected.githubUrl&&<a href={selected.githubUrl} target="_blank" rel="noreferrer">{selected.branch||'GitHub'}</a>}
       {selected.pinUrl&&<a href={selected.pinUrl} target="_blank" rel="noreferrer">Pin</a>}
      </div>
      <div className="pipe-actions">
       {needsApproval(selected)&&(
        <button type="button" disabled={actionBusy||Boolean(selected.regenRole)} onClick={()=>void approveJob(selected.jobId)}>
         {actionBusy&&!selected.regenRole?'Approving…':'Approve'}
        </button>
       )}
       {canRetry(selected)&&(
        <button type="button" disabled={actionBusy} onClick={()=>void retryJob(selected.jobId)}>
         {actionBusy?'Retrying…':'Retry job'}
        </button>
       )}
       {canDiscard(selected)&&(
        <button type="button" className="pipe-danger" disabled={actionBusy} onClick={()=>void discardJob(selected.jobId)}>
         Discard job
        </button>
       )}
       {selected.status==='failed'&&selected.cloneId&&selected.sandboxId&&(
        <button type="button" disabled={actionBusy} onClick={()=>void resumePush(selected.jobId)}>
         {actionBusy?'Pushing…':'Resume GitHub push'}
        </button>
       )}
       {(selected.status==='preview'||selected.cloneId)&&(
        <>
         <a className="pipe-pill-link" href={selected.mergeUrl||'https://github.com/hardwin/findmyinvite/pulls'} target="_blank" rel="noreferrer">
          Merge to main (PR)
         </a>
         <button type="button" disabled={actionBusy||selected.catalogPublished} onClick={()=>void addToCatalog(selected.jobId)}>
          {selected.catalogPublished?'Already in catalogue':'Add to Catalog'}
         </button>
        </>
       )}
       <button type="button" className="pipe-ghost" onClick={()=>setSelectedId(null)}>Close</button>
      </div>
     </div>
    </div>
   )}
  </main>
 );
}
