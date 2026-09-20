import {useEffect,useState,type FormEvent} from 'react';
import './assembly.css';

type Parent={
 id:string;
 name:string;
 description:string;
 introUrl:string;
 posterUrl:string;
};
type InboxFile={name:string;bytes:number;mtime:string};
type ClonePlan={id:string;name:string;image:string;video:string;n:number};
type AssembleResult={
 dryRun:boolean;
 clones:ClonePlan[];
 demos:{id:string;name:string;demo:string}[];
};

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
 const [selected,setSelected]=useState<string[]>([]);
 const [plan,setPlan]=useState<ClonePlan[]>([]);
 const [result,setResult]=useState<AssembleResult|null>(null);

 useEffect(()=>{
  document.title='Assembly · FindMyInvite';
  const meta=document.createElement('meta');
  meta.name='robots';
  meta.content='noindex,nofollow';
  document.head.appendChild(meta);
  return()=>{meta.remove();};
 },[]);

 async function loadInbox(){
  const res=await fetch('/api/assembly?action=inbox',{credentials:'same-origin'});
  const body=await res.json().catch(()=>({}));
  if(res.status===401){setAuthed(false);return;}
  if(!res.ok)throw new Error(body.error||'Could not list inbox.');
  setInbox(body.inbox||[]);
  if(body.path)setInboxPath(String(body.path));
 }

 async function loadPlan(id:string,count:number,names:string[]=[]){
  if(!id)return;
  const res=await fetch('/api/assembly?action=plan',{
   method:'POST',
   credentials:'same-origin',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({parentId:id,count:Math.max(1,count),names})
  });
  const body=await res.json().catch(()=>({}));
  if(res.status===401){setAuthed(false);return;}
  if(!res.ok)throw new Error(body.error||'Could not plan clones.');
  const clones:ClonePlan[]=body.clones||[];
  setPlan(current=>{
   if(current.length===clones.length&&current.every((item,index)=>item.id===clones[index].id)){
    return clones.map((clone,index)=>({...clone,name:current[index]?.name||clone.name}));
   }
   return clones;
  });
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

   const parentRes=await fetch('/api/assembly?action=parents',{credentials:'same-origin'});
   const parentBody=await parentRes.json().catch(()=>({}));
   if(!parentRes.ok)throw new Error(parentBody.error||'Could not load Premium parents.');
   const list:Parent[]=parentBody.parents||[];
   setParents(list);
   setParentId(current=>current||list[0]?.id||'');
   if(status.writable)await loadInbox();
  }catch(err){
   setError(err instanceof Error?err.message:'Could not open Assembly.');
  }finally{
   setBusy(false);
  }
 }

 useEffect(()=>{void bootstrap();},[]);

 useEffect(()=>{
  if(!authed||!parentId)return;
  void loadPlan(parentId,Math.max(1,selected.length||1)).catch(err=>{
   setError(err instanceof Error?err.message:'Plan failed.');
  });
 },[authed,parentId,selected.length]);

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

 function onToggle(name:string){
  setSelected(current=>current.includes(name)?current.filter(item=>item!==name):[...current,name]);
 }

 function onRename(id:string,name:string){
  setPlan(current=>current.map(item=>item.id===id?{...item,name}:item));
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

 async function onAssemble(dryRun:boolean){
  if(!parentId){setError('Pick a Premium parent.');return;}
  if(!selected.length){setError('Select one or more inbox videos.');return;}
  setBusy(true);
  setError('');
  setResult(null);
  try{
   const res=await fetch('/api/assembly?action=assemble',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     parentId,
     videos:selected,
     names:plan.slice(0,selected.length).map(item=>item.name),
     dryRun
    })
   });
   const body=await res.json().catch(()=>({}));
   if(res.status===401){setAuthed(false);return;}
   if(!res.ok)throw new Error(body.error||'Assemble failed.');
   setResult(body);
   if(!dryRun)await loadPlan(parentId,1);
  }catch(err){
   setError(err instanceof Error?err.message:'Assemble failed.');
  }finally{
   setBusy(false);
  }
 }

 const parent=parents.find(item=>item.id===parentId);

 if(!authed){
  return (
   <main className="assembly-shell">
    <form className="assembly-gate" onSubmit={onGate}>
     <p className="assembly-kicker">Operator</p>
     <h1>Assembly</h1>
     <p>Clone a Premium cinematic intro into new repo templates. Same gate as /akay.</p>
     <label>Access code<input type="password" value={code} onChange={e=>setCode(e.target.value)} autoFocus/></label>
     {error&&<p className="assembly-error" role="alert">{error}</p>}
     <button type="submit" disabled={busy}>{busy?'Checking…':'Enter'}</button>
    </form>
   </main>
  );
 }

 return (
  <main className="assembly-shell">
   <header className="assembly-header">
    <div>
     <p className="assembly-kicker">Operator · Repo filesystem</p>
     <h1>Assembly</h1>
     <p>Pick a Premium parent, drop alternate intros, set names, then assemble locally.</p>
    </div>
    <a href="/akay">Back to Akay</a>
   </header>

   {!writable&&<p className="assembly-banner" role="status">This host cannot write the git tree. Open /assembly on your local Cursor machine to assemble.</p>}
   {error&&<p className="assembly-error" role="alert">{error}</p>}

   <section className="assembly-grid">
    <div className="assembly-panel">
     <h2>1. Premium parent</h2>
     <label>Template
      <select value={parentId} onChange={e=>setParentId(e.target.value)}>
       {parents.map(item=><option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}
      </select>
     </label>
     {parent&&(
      <div className="assembly-parent">
       <video key={parent.id} src={parent.introUrl} poster={parent.posterUrl} controls playsInline preload="metadata"/>
       <p>{parent.description}</p>
       <p><a href={parent.introUrl} download>Download current intro</a></p>
      </div>
     )}
    </div>

    <div className="assembly-panel">
     <h2>2. Alternate intros</h2>
     <p className="assembly-help">Upload here or copy files into <code>{inboxPath}</code>.</p>
     <label className="assembly-upload">Upload videos
      <input type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.mkv" multiple disabled={!writable||busy} onChange={e=>void onUpload(e.currentTarget.files)}/>
     </label>
     <button type="button" className="assembly-secondary" disabled={!writable||busy} onClick={()=>void loadInbox().catch(err=>setError(err instanceof Error?err.message:'Inbox refresh failed.'))}>Refresh inbox</button>
     <ul className="assembly-inbox">
      {inbox.map(file=>(
       <li key={file.name}>
        <label>
         <input type="checkbox" checked={selected.includes(file.name)} onChange={()=>onToggle(file.name)}/>
         <span>{file.name}</span>
         <small>{Math.round(file.bytes/1024)} KB</small>
        </label>
       </li>
      ))}
      {!inbox.length&&<li className="assembly-empty">No videos in inbox yet.</li>}
     </ul>
    </div>

    <div className="assembly-panel">
     <h2>3. Names & assemble</h2>
     <ol className="assembly-plan">
      {plan.map(item=>(
       <li key={item.id}>
        <label className="assembly-name">
         <span>{item.id}</span>
         <input type="text" maxLength={80} value={item.name} onChange={e=>onRename(item.id,e.target.value)} aria-label={'Display name for '+item.id}/>
        </label>
       </li>
      ))}
      {!plan.length&&<li className="assembly-empty">Select videos to preview and rename clones.</li>}
     </ol>
     <div className="assembly-actions">
      <button type="button" className="assembly-secondary" disabled={!writable||busy||!selected.length} onClick={()=>void onAssemble(true)}>Dry run</button>
      <button type="button" disabled={!writable||busy||!selected.length} onClick={()=>void onAssemble(false)}>{busy?'Working…':'Assemble into repo'}</button>
     </div>
    </div>
   </section>

   {result&&(
    <section className="assembly-result">
     <h2>{result.dryRun?'Dry run ready':'Assembled — preview'}</h2>
     <p className="assembly-help">{result.dryRun?'Names and ids look good. Assemble when ready.':'Open the preview. When it looks right, tell Akay: Publish.'}</p>
     <ul className="assembly-previews">
      {result.demos.map(demo=>(
       <li key={demo.id}>
        <a href={demo.demo}>{demo.name}</a>
       </li>
      ))}
     </ul>
    </section>
   )}
  </main>
 );
}
