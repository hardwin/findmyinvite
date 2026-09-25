import {useCallback,useEffect,useState} from 'react';
import './akay.css';
import './assembly-wizard.css';
import AssemblyChat from './AssemblyChat';
import {clearSession,readSession} from './auth-session';
import {managerFetch} from './manager-api';

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
 const [authed,setAuthed]=useState(false);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(true);
 const [writable,setWritable]=useState(false);
 const [cloud,setCloud]=useState(false);
 const [parentId,setParentId]=useState(()=>readStore(PARENT_KEY));
 const [email,setEmail]=useState('');

 useEffect(()=>{
  document.title='Photographer Co-Pilot · FindMyInvite';
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
   const session=readSession();
   if(!session?.access_token){
    location.replace('/manager/login');
    return;
   }
   setEmail(session.user?.email||'');
   const statusRes=await managerFetch('/api/assembly?action=status');
   if(statusRes.status===401){
    clearSession();
    location.replace('/manager/login');
    return;
   }
   const status=await statusRes.json().catch(()=>({}));
   if(!statusRes.ok)throw new Error(status.error||'Could not open Co-Pilot.');
   setAuthed(true);
   setWritable(Boolean(status.writable));
   setCloud(Boolean(status.cloud));
   const parentsRes=await managerFetch('/api/assembly?action=parents');
   const parentsBody=await parentsRes.json().catch(()=>({}));
   const list=parentsBody.parents||[];
   const next=readStore(PARENT_KEY)||(list[list.length-1]||list[0])?.id||'';
   setParentId(next);
   writeStore(PARENT_KEY,next);
  }catch(err){
   setError(err instanceof Error?err.message:'Could not open Co-Pilot.');
  }finally{
   setBusy(false);
  }
 },[]);

 useEffect(()=>{void bootstrap();},[bootstrap]);

 if(busy&&!authed){
  return (
   <main className="asm-shell">
    <div className="asm-phone">
     <p className="asm-brand">FindMyInvite</p>
     <div className="asm-stage">
      <h1>Photographer Co-Pilot</h1>
      <p className="lead">Opening your generation desk…</p>
     </div>
    </div>
   </main>
  );
 }

 if(!authed){
  return (
   <main className="asm-shell">
    <div className="asm-phone">
     <p className="asm-brand">FindMyInvite</p>
     <div className="asm-stage">
      <h1>Photographer Co-Pilot</h1>
      <p className="lead">Event planners & photographers — Chat → Single Image → Website.</p>
      {error&&<p className="asm-alert" role="alert">{error}</p>}
      <a className="asm-pill" href="/manager/login">Sign in</a>
     </div>
    </div>
   </main>
  );
 }

 return (
  <>
   <div style={{position:'fixed',top:8,right:12,zIndex:40,display:'flex',gap:8,alignItems:'center',fontSize:12,color:'#445'}}>
    <span title="Signed in">{email||'Manager'}</span>
    <span style={{opacity:.7}}>₹999 / build</span>
    <button type="button" style={{border:'1px solid #ccd',background:'#fff',borderRadius:8,padding:'4px 8px',cursor:'pointer'}} onClick={()=>{clearSession();location.href='/manager/login';}}>Sign out</button>
   </div>
   <AssemblyChat
    parentId={parentId}
    cloud={cloud}
    writable={writable}
    onUnauth={()=>{clearSession();location.replace('/manager/login');}}
   />
  </>
 );
}
