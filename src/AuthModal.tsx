import {useEffect,useRef,useState,type FormEvent} from 'react';
import {hostAuth} from './auth-session';
import './auth.css';

export default function AuthModal({mode='signin',onClose}:{mode?:'signin'|'signup';onClose:()=>void}){
 const [tab,setTab]=useState<'signin'|'signup'>(mode);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLInputElement>('input')?.focus();return()=>previous?.focus();},[]);
 useEffect(()=>setTab(mode),[mode]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();if(event.key==='Tab'){const fields=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')||[]);if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===fields.at(-1)){event.preventDefault();fields[0]?.focus();}}};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[onClose]);
 async function submit(e:FormEvent){
  e.preventDefault();setError('');setLoading(true);
  try{await hostAuth(tab,email,password);onClose();}
  catch(err){setError(err instanceof Error?err.message:'Could not sign in. Please try again.');}
  finally{setLoading(false);}
 }
 return <div className="auth-overlay" role="presentation" onClick={onClose}>
  <div ref={dialog} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={e=>e.stopPropagation()}>
   <div className="auth-tabs">
    <button type="button" className={tab==='signin'?'selected':''} onClick={()=>setTab('signin')}>Sign in</button>
    <button type="button" className={tab==='signup'?'selected':''} onClick={()=>setTab('signup')}>Create account</button>
   </div>
   <h2 id="auth-title">{tab==='signup'?'Create your FindMyInvite account':'Sign in to FindMyInvite'}</h2>
   <p>Email and password. Required to save a draft or publish. Password reset is not available yet.</p>
   <form className="fmi-form" onSubmit={submit}>
    <label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label>Password<input type="password" autoComplete={tab==='signup'?'new-password':'current-password'} minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    {error&&<p className="editor-error" role="alert">{error}</p>}
    <div className="editor-actions">
     <button className="fmi-button" type="submit" disabled={loading}>{loading?'Please wait…':tab==='signup'?'Create account':'Sign in'}</button>
     <button className="fmi-button outline" type="button" onClick={onClose}>Cancel</button>
    </div>
   </form>
  </div>
 </div>;
}
