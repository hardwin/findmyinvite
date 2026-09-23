import {useEffect,useMemo,useState,type FormEvent} from 'react';
import './assembly-pipeline.css';

type Job={
 jobId:string;
 status:string;
 phase:string;
 percent:number;
 label:string;
 detail?:string;
 displayName?:string;
 pinUrl?:string;
 cloneId?:string|null;
 branch?:string|null;
 githubUrl?:string|null;
 previewUrl?:string|null;
 demo?:string|null;
 spend?:{budget?:number;used?:number;remaining?:number};
 prompts?:Record<string,string>|null;
 written?:string[];
 error?:string|null;
 publishRequested?:boolean;
 catalogPublished?:boolean;
 mergeUrl?:string|null;
 sandboxId?:string|null;
 updatedAt?:number;
};

type ColumnId='queued'|'pin'|'gen'|'craft'|'assemble'|'preview'|'failed';

const COLUMNS:Array<{id:ColumnId;title:string}>=[
 {id:'queued',title:'Queued / Boot'},
 {id:'pin',title:'Pin + prompts'},
 {id:'gen',title:'Gen'},
 {id:'craft',title:'Craft'},
 {id:'assemble',title:'Assemble'},
 {id:'preview',title:'Preview'},
 {id:'failed',title:'Failed'}
];

function columnFor(job:Job):ColumnId{
 if(job.status==='failed')return 'failed';
 if(job.status==='preview')return 'preview';
 const phase=String(job.phase||'queued');
 if(phase==='pin')return 'pin';
 if(phase==='gen'||phase==='review')return 'gen';
 if(phase==='craft')return 'craft';
 if(phase==='assemble')return 'assemble';
 if(phase==='preview')return 'preview';
 if(phase==='failed')return 'failed';
 return 'queued';
}

function githubRaw(cloneId:string,path:string){
 const branch='assembly/'+cloneId;
 return 'https://raw.githubusercontent.com/hardwin/findmyinvite/'+encodeURIComponent(branch).replace(/%2F/g,'/')+'/'+path.split('/').map(encodeURIComponent).join('/');
}

function downloadText(filename:string,text:string){
 const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;a.download=filename;a.click();
 URL.revokeObjectURL(url);
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
  const res=await fetch('/api/assembly?action=template1-status',{credentials:'same-origin'});
  if(res.status===401){setAuthed(false);return;}
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(body.error||'Could not load pipelines.');
  setAuthed(true);
  setJobs(Array.isArray(body.jobs)?body.jobs:[]);
 }

 async function bootstrap(){
  setBusy(true);
  setError('');
  try{await loadJobs();}
  catch(err){setError(err instanceof Error?err.message:'Could not open Pipeline.');}
  finally{setBusy(false);}
 }

 useEffect(()=>{void bootstrap();},[]);

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
    credentials:'same-origin',
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
  return map;
 },[jobs]);

 async function resumePush(jobId:string){
  setActionBusy(true);
  setError('');
  try{
   const res=await fetch('/api/assembly?action=template1-resume-push',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
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
   const res=await fetch('/api/assembly?action=template1-add-catalog',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
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
     <h1 className="pipe-title">Pipeline</h1>
     <p className="lead" style={{margin:0,color:'#8C4D90'}}>Operator desk — same access code as /akay.</p>
     <input type="password" inputMode="numeric" autoComplete="off" placeholder="Access code" value={code} onChange={e=>setCode(e.target.value)} aria-label="Access code"/>
     {error&&<p className="pipe-alert" role="alert">{error}</p>}
     <button type="submit" disabled={busy||!code.trim()}>{busy?'Opening…':'Open pipeline'}</button>
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
     <a className="pipe-ghost" href="/assembly">New invite</a>
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
        {list.length===0&&<p className="pipe-empty">Empty</p>}
        {list.map(job=>(
         <button
          type="button"
          key={job.jobId}
          className={'pipe-card'+(selectedId===job.jobId?' is-on':'')}
          onClick={()=>setSelectedId(job.jobId)}
         >
          <h3>
           {job.displayName||job.cloneId||job.jobId.slice(0,8)}
           {job.publishRequested&&!job.catalogPublished&&<span className="pipe-badge">Publish queued</span>}
          {job.catalogPublished&&<span className="pipe-badge">In catalogue</span>}
          </h3>
          <p>{job.label}</p>
          <p>{job.detail}</p>
          <div className="pipe-meta">
           <span>{job.percent||0}%</span>
           <span>{job.spend?.used!=null?'$'+Number(job.spend.used).toFixed(2):''}</span>
          </div>
          <div className="pipe-bar" aria-hidden="true"><i style={{width:Math.max(4,job.percent||0)+'%'}}/></div>
         </button>
        ))}
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
      {selected.error&&<p className="pipe-alert" role="alert">{selected.error}</p>}
      <div className="pipe-links">
       {selected.previewUrl&&<a href={selected.previewUrl} target="_blank" rel="noreferrer">Preview (Vercel branch)</a>}
       {selected.githubUrl&&<a href={selected.githubUrl} target="_blank" rel="noreferrer">{selected.branch||'GitHub compare'}</a>}
       {selected.pinUrl&&<a href={selected.pinUrl} target="_blank" rel="noreferrer">Pinterest pin</a>}
       <span style={{fontSize:12,color:'#A16948'}}>
        findmyinvite.com gets this clone only after Publish (merge to main + catalogue SQL).
       </span>
      </div>

      <div className="pipe-section">
       <h3>Assets</h3>
       {(selected.written||[]).length===0&&<p className="lead">No written paths yet.</p>}
       <ul className="pipe-assets">
        {(selected.written||[]).map(path=>{
         const isMedia=/\.(mp4|jpg|jpeg|webp|png)$/i.test(path);
         const href=selected.cloneId&&isMedia?githubRaw(selected.cloneId,path):selected.githubUrl||undefined;
         return (
          <li key={path}>
           {href?<a href={href} target="_blank" rel="noreferrer">{path}</a>:<span>{path}</span>}
           {href&&isMedia&&<> · <a href={href} download>download</a></>}
          </li>
         );
        })}
       </ul>
      </div>

      <div className="pipe-section">
       <h3>Prompts</h3>
       {!selected.prompts&&<p className="lead">No prompts stored on this job yet (new runs keep them). Slice 2 can recover from Sandbox when still alive.</p>}
       {selected.prompts&&(
        <div className="pipe-prompts">
         {Object.entries(selected.prompts).filter(([,v])=>typeof v==='string'&&v).map(([role,text])=>(
          <button
           key={role}
           type="button"
           onClick={()=>downloadText((selected.cloneId||selected.jobId)+'-'+role+'.txt',String(text))}
          >
           Download {role}
          </button>
         ))}
         <button
          type="button"
          onClick={()=>downloadText((selected.cloneId||selected.jobId)+'-prompts.json',JSON.stringify(selected.prompts,null,2))}
         >
          Download all JSON
         </button>
        </div>
       )}
      </div>

      <div className="pipe-actions">
       {selected.status==='failed'&&selected.cloneId&&selected.sandboxId&&(
        <button type="button" disabled={actionBusy} onClick={()=>void resumePush(selected.jobId)}>
         {actionBusy?'Pushing…':'Resume GitHub push'}
        </button>
       )}
       {(selected.status==='preview'||selected.cloneId)&&(
        <>
         <a
          className="pipe-pill-link"
          href={selected.mergeUrl||(selected.cloneId==='royal-prestige-5'?'https://github.com/hardwin/findmyinvite/pull/29':'https://github.com/hardwin/findmyinvite/pulls')}
          target="_blank"
          rel="noreferrer"
         >
          Merge to main (PR)
         </a>
         <button type="button" disabled={actionBusy||selected.catalogPublished} onClick={()=>void addToCatalog(selected.jobId)}>
          {selected.catalogPublished?'Already in catalogue':'Add to Catalog'}
         </button>
         <p className="lead" style={{margin:0,fontSize:12}}>
          1) Merge the PR so assets land on findmyinvite.com · 2) Add to Catalog writes `template_catalog` via API (no SQL paste).
         </p>
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
