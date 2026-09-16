export type HostSession={access_token:string;refresh_token:string;expires_at:number;user:{id:string;email:string}};
const key='findmyinvite-auth-v1';
export function readSession():HostSession|null{
 try{
  const value=JSON.parse(localStorage.getItem(key)||'null');
  if(!value||typeof value.access_token!=='string'||!value.user||typeof value.user.id!=='string')return null;
  return value;
 }catch{return null}
}
export function writeSession(value:HostSession){
 localStorage.setItem(key,JSON.stringify(value));
 window.dispatchEvent(new Event('fmi-auth-changed'));
}
export function clearSession(){
 localStorage.removeItem(key);
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
export async function hostAuth(action:'signup'|'signin',email:string,password:string){
 const response=await fetch('/api/auth?action='+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store'});
 let value;try{value=await response.json()}catch{throw new Error('Could not reach FindMyInvite. Please try again.');}
 if(!response.ok)throw new Error(value.error||'Could not sign in. Please try again.');
 writeSession({access_token:value.access_token,refresh_token:value.refresh_token||'',expires_at:Date.now()+(Number(value.expires_in)||3600)*1000,user:value.user||{id:'',email}});
 return value;
}
export async function hostSignOut(){clearSession();}
