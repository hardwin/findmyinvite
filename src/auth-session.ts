export type HostSession={access_token:string;refresh_token:string;expires_at:number;user:{id:string;email:string};remember?:boolean};
const KEY_LONG='findmyinvite-auth-v1';
const KEY_SHORT='findmyinvite-auth-session-v1';

function storeGet():string|null{
 try{return localStorage.getItem(KEY_LONG)||sessionStorage.getItem(KEY_SHORT);}catch{return null;}
}
function storeClear(){
 try{localStorage.removeItem(KEY_LONG);sessionStorage.removeItem(KEY_SHORT);}catch{/* private mode */}
}

export function readSession():HostSession|null{
 try{
  const value=JSON.parse(storeGet()||'null');
  if(!value||typeof value.access_token!=='string'||!value.user||typeof value.user.id!=='string')return null;
  return value;
 }catch{return null}
}
export function writeSession(value:HostSession,remember=true){
 storeClear();
 const payload=JSON.stringify({...value,remember:Boolean(remember)});
 try{
  if(remember)localStorage.setItem(KEY_LONG,payload);
  else sessionStorage.setItem(KEY_SHORT,payload);
 }catch{/* private mode */}
 window.dispatchEvent(new Event('fmi-auth-changed'));
}
export function clearSession(){
 storeClear();
 window.dispatchEvent(new Event('fmi-auth-changed'));
}
export function accessToken(){return readSession()?.access_token||'';}
export function requestSignIn(mode:'signin'|'signup'='signup'){
 window.dispatchEvent(new CustomEvent('fmi-auth-open',{detail:{mode}}));
}
export function afterAuthPath(path?:string){
 if(path)sessionStorage.setItem('fmi-after-auth',path);
 else sessionStorage.removeItem('fmi-after-auth');
}
export function takeAfterAuth(){
 const path=sessionStorage.getItem('fmi-after-auth')||'';
 sessionStorage.removeItem('fmi-after-auth');
 return path;
}
export async function hostAuth(action:'signup'|'signin',email:string,password:string,opts:{remember?:boolean}={}){
 const response=await fetch('/api/auth?action='+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store'});
 let value;try{value=await response.json()}catch{throw new Error('Could not reach FindMyInvite. Please try again.');}
 if(!response.ok)throw new Error(value.error||'Could not sign in. Please try again.');
 if(action==='signup'&&value.needs_confirmation&&!value.access_token){
  throw new Error(value.message||'Check your email to confirm the account, then sign in.');
 }
 writeSession({
  access_token:value.access_token,
  refresh_token:value.refresh_token||'',
  expires_at:Date.now()+(Number(value.expires_in)||3600)*1000,
  user:value.user||{id:'',email}
 },opts.remember!==false);
 return value;
}
export async function hostRecover(email:string){
 const response=await fetch('/api/auth?action=recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),cache:'no-store'});
 let value;try{value=await response.json()}catch{throw new Error('Could not reach FindMyInvite. Please try again.');}
 if(!response.ok)throw new Error(value.error||'Could not send reset email.');
 return value;
}
export async function hostRefresh(){
 const session=readSession();
 if(!session?.refresh_token)return null;
 const response=await fetch('/api/auth?action=refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),cache:'no-store'});
 if(!response.ok){clearSession();return null;}
 const value=await response.json();
 writeSession({
  access_token:value.access_token,
  refresh_token:value.refresh_token||session.refresh_token,
  expires_at:Date.now()+(Number(value.expires_in)||3600)*1000,
  user:value.user||session.user
 },session.remember!==false);
 return value;
}
export async function hostSignOut(){clearSession();}
