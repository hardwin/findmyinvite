import {useEffect,useState,type FormEvent} from 'react';
import {
 clearSession,
 hostAuth,
 hostRecover,
 readSession
} from './auth-session';
import './manager-login.css';

type Tab='signin'|'signup'|'recover';

export default function ManagerLogin(){
 const [tab,setTab]=useState<Tab>('signin');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [remember,setRemember]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  document.title='Photographer Co-Pilot · FindMyInvite';
  if(readSession()?.access_token)location.replace('/manager');
 },[]);

 async function onSubmit(e:FormEvent){
  e.preventDefault();
  setError('');
  setNotice('');
  setBusy(true);
  try{
   if(tab==='recover'){
    await hostRecover(email);
    setNotice('If that email is registered, we sent a reset link. Check your inbox (and spam).');
    return;
   }
   await hostAuth(tab,email,password,{remember});
   location.replace('/manager');
  }catch(err){
   setError(err instanceof Error?err.message:'Could not continue. Please try again.');
  }finally{
   setBusy(false);
  }
 }

 return (
  <main className="mgr-login">
   <div className="mgr-login-bg" style={{backgroundImage:'url(/assets/manager-login-bg.jpg)'}} aria-hidden="true"/>
   <div className="mgr-login-shell">
    <div className="mgr-login-copy">
     <span className="mgr-kicker">FindMyInvite · for creatives</span>
     <h1>Modern Photographer Co-Pilot</h1>
     <p>
      Talk to the generation engine. Lock one hero image. Ship an invitation website with
      cinematic video, stills, and interactivity — powered by FindMyInvite templates.
     </p>
    </div>
    <section className="mgr-login-card" aria-label="Manager sign in">
     <h2>{tab==='signup'?'Create your desk':tab==='recover'?'Reset password':'Welcome back'}</h2>
     <p className="mgr-lead">
      {tab==='signup'
       ?'Event planners & photographers — email and password. We email a confirm link when Supabase SMTP is connected.'
       :tab==='recover'
        ?'We email a secure reset link when custom SMTP (Hostinger or Resend) is set in Supabase Auth.'
        :'Sign in to open your private Co-Pilot chat and template desk.'}
     </p>
     {tab!=='recover'&&(
      <div className="mgr-tabs" role="tablist">
       <button type="button" className={tab==='signin'?'is-on':''} onClick={()=>{setTab('signin');setError('');setNotice('');}}>Sign in</button>
       <button type="button" className={tab==='signup'?'is-on':''} onClick={()=>{setTab('signup');setError('');setNotice('');}}>Create account</button>
      </div>
     )}
     <form onSubmit={onSubmit}>
      <label>Email
       <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@studio.com"/>
      </label>
      {tab!=='recover'&&(
       <label>Password
        <input type="password" autoComplete={tab==='signup'?'new-password':'current-password'} minLength={8} maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="8–72 characters"/>
       </label>
      )}
      {tab==='signin'&&(
       <div className="mgr-row">
        <label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Remember me</label>
        <button type="button" className="mgr-linkish" onClick={()=>{setTab('recover');setError('');setNotice('');}}>Forgot password?</button>
       </div>
      )}
      {error&&<p className="mgr-alert" role="alert">{error}</p>}
      {notice&&<p className="mgr-ok" role="status">{notice}</p>}
      <button className="mgr-submit" type="submit" disabled={busy}>
       {busy?'Please wait…':tab==='signup'?'Create account':tab==='recover'?'Send reset link':'Enter Co-Pilot'}
      </button>
     </form>
     {tab==='recover'&&(
      <p className="mgr-foot"><button type="button" className="mgr-linkish" onClick={()=>setTab('signin')}>Back to sign in</button></p>
     )}
     <div className="mgr-credits">
      <strong>₹999</strong> generation credit per invite website build (FindMyInvite platform fee).
      Photographers keep private templates and set their own client pricing — we are the Higgsfield of AI invitation websites.
     </div>
     <p className="mgr-foot">
      <a href="/">← FindMyInvite home</a>
      {' · '}
      <button type="button" className="mgr-linkish" onClick={()=>{clearSession();setNotice('Signed out on this device.');}}>Clear saved session</button>
     </p>
    </section>
   </div>
  </main>
 );
}
