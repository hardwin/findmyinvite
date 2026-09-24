import {useCallback,useEffect,useState,type FormEvent} from 'react';
import './akay.css';
import './assembly-wizard.css';
import AssemblyChat from './AssemblyChat';

const PARENT_KEY='fmi.assembly.parentId';

function readStore(key:string){
 try{return sessionStorage.getItem(key)||'';}catch{return '';}
}
function writeStore(key:string,value:string){
 try{
  if(value)sessionStorage.setItem(key,value);
  else sessionStorage.removeItem(key);
 }catch{/* private mode */}
}

export default function Assembly(){
 const [code,setCode]=useState('');
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [writable,setWritable]=useState(false);
 const [cloud,setCloud]=useState(false);
 const [parentId,setParentId]=useState(()=>readStore(PARENT_KEY));

 useEffect(()=>{
  document.title='Assembly · FindMyInvite';
  const meta=document.createElement('meta');
  meta.name='robots';
  meta.content='noindex,nofollow';
  document.head.appendChild(meta);
  return()=>{meta.remove();};
 },[]);

 const bootstrap=useCallback(async()=>{
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
   const next=readStore(PARENT_KEY)||(list[list.length-1]||list[0])?.id||'';
   setParentId(next);
   writeStore(PARENT_KEY,next);
  }catch(err){
   setError(err instanceof Error?err.message:'Could not open Assembly.');
  }finally{
   setBusy(false);
  }
 },[]);

 useEffect(()=>{void bootstrap();},[bootstrap]);

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

 if(!authed){
  return (
   <main className="asm-shell">
    <div className="asm-phone">
     <p className="asm-brand">FindMyInvite</p>
     <div className="asm-stage">
      <h1>Assembly</h1>
      <p className="lead">Same code as /akay. Chat desk for pin → mix → Template 1.</p>
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

 return (
  <AssemblyChat
   parentId={parentId}
   cloud={cloud}
   writable={writable}
   onUnauth={()=>setAuthed(false)}
  />
 );
}
