import {useEffect,useRef,useState} from 'react';
import {startGoogleSignIn} from './google-auth';
import './auth.css';

export default function AuthModal({onClose,onBeforeRedirect,returnTo}:{mode?:'signin'|'signup';onClose:()=>void;onBeforeRedirect?:()=>void|Promise<void>;returnTo?:string}){
 const [error,setError]=useState(''),[loading,setLoading]=useState(false);
 const dialog=useRef<HTMLDivElement>(null),working=useRef(false);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>previous?.focus();},[]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!working.current)onClose();if(event.key==='Tab'){const fields=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[]);if(!fields.length){event.preventDefault();return;}if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===fields.at(-1)){event.preventDefault();fields[0]?.focus();}}};
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 },[onClose]);
 function close(){if(!working.current)onClose();}
 async function signIn(){
  if(working.current)return;working.current=true;setLoading(true);setError('');
  try{await onBeforeRedirect?.();await startGoogleSignIn(returnTo);}
  catch(err){setError(err instanceof Error?err.message:'Could not sign in. Please try again.');working.current=false;setLoading(false);}
 }
 return <div className="auth-overlay" role="presentation" onClick={close}>
  <div ref={dialog} className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={e=>e.stopPropagation()}>
   <h2 id="auth-title">Sign in to FindMyInvite</h2>
   <p>Continue with Google to save your invitation to your account and access it anytime. Your details and photos will be waiting when you return.</p>
   {error&&<p className="editor-error" role="alert">{error}</p>}
   <button className="auth-google" type="button" disabled={loading} onClick={()=>void signIn()}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>{loading?'Connecting to Google…':'Continue with Google'}</button>
   <button className="auth-cancel" type="button" onClick={close} disabled={loading}>Cancel</button>
  </div>
 </div>;
}
