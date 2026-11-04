import {readSession,writeSession} from './auth-session';
import {authReturnPath} from '../shared/auth-return.mjs';
const KEY='fmi-google-flow-v1';
type GoogleFlow={id:string;verifier:string;returnTo:string;createdAt:number};
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
async function api(action:string,body:unknown){
 const response=await fetch('/api/auth?action='+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
 const value=await response.json().catch(()=>{throw Error('Could not reach FindMyInvite. Please try again.');});
 if(!response.ok)throw Error(value.error||'Could not sign in with Google.');return value;
}
function flow():GoogleFlow|null{try{return JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{return null;}}
export function googleReturnPath(){return authReturnPath(flow()?.returnTo);}
export async function startGoogleSignIn(returnTo?:string){
 const verifier=random(),id=random();
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
 const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 const path=authReturnPath(returnTo||sessionStorage.getItem('fmi-after-auth')||location.pathname+location.search);
 // Fail before leaving the editor if this browser cannot retain the PKCE verifier.
 sessionStorage.setItem(KEY,JSON.stringify({id,verifier,returnTo:path,createdAt:Date.now()}));
 const {url}=await api('google-start',{origin:location.origin,challenge,flow:id});
 sessionStorage.removeItem('fmi-after-auth');
 location.assign(url);
}
let completion:Promise<string>|null=null;
export function completeGoogleSignIn(){
 // React StrictMode remounts effects. An authorization code must be exchanged once.
 return completion??=(async()=>{
  const saved=flow(),params=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.slice(1));
  const code=params.get('code');
  history.replaceState(null,'','/auth/callback');
  if(!saved||params.get('flow')!==saved.id||!Number.isFinite(saved.createdAt)||saved.createdAt>Date.now()||Date.now()-saved.createdAt>15*60000)throw Error('This sign-in attempt expired or belongs to another tab. Return to your invitation and try again.');
  if(params.has('error')||fragment.has('error'))throw Error('Google sign-in was cancelled or declined. Your invitation is still saved.');
  if(!code)throw Error('Google did not complete sign-in. Your invitation is still saved.');
  const result=await api('google-exchange',{code,verifier:saved.verifier});
  writeSession({access_token:result.access_token,refresh_token:result.refresh_token,expires_at:Date.now()+result.expires_in*1000,user:result.user});
  if(readSession()?.access_token!==result.access_token)throw Error('Your browser could not save your login. Allow browser storage and try again.');
  sessionStorage.removeItem(KEY);
  return authReturnPath(saved.returnTo);
 })();
}
