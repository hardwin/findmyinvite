import {useEffect,useState} from 'react';
import {readSession,writeSession,hostRefresh} from './auth-session';
import {rememberPreviewLanguage,savePreviewLanguage} from './templates/preview-language';
import {normalizeInvitationPreferences} from '../shared/invitation-preferences.mjs';

export type InvitationPreferences={language:string;tradition:string};
type Stored={preferences:InvitationPreferences;pending:boolean};
const PREFIX='fmi-invitation-preferences-v1:',EVENT='fmi-invitation-preferences-changed',DISMISSED='fmi-invitation-preferences-dismissed-v1';
const memory=new Map<string,Stored>(),inFlight=new Map<string,Promise<void>>();
let dismissed=false;
function read(owner='guest'):Stored|null{
 try{const stored=JSON.parse(sessionStorage.getItem(PREFIX+owner)||localStorage.getItem(PREFIX+owner)||'null');const preferences=normalizeInvitationPreferences(stored?.preferences);if(preferences)return {preferences,pending:stored.pending===true};}catch{}
 return memory.get(owner)||null;
}
function store(owner:string,value:Stored){memory.set(owner,value);try{localStorage.setItem(PREFIX+owner,JSON.stringify(value));sessionStorage.removeItem(PREFIX+owner);}catch{try{sessionStorage.setItem(PREFIX+owner,JSON.stringify(value));}catch{}}}
function notify(){window.dispatchEvent(new Event(EVENT));}
export function preferencesDismissed(){try{return dismissed||sessionStorage.getItem(DISMISSED)==='1';}catch{return dismissed;}}
export function dismissInvitationPreferences(){dismissed=true;try{sessionStorage.setItem(DISMISSED,'1');}catch{}}
export function readInvitationPreferences():InvitationPreferences|null{
 const session=readSession();if(!session)return read()?.preferences||null;
 const local=read(session.user.id);
 return local?.pending?local.preferences:normalizeInvitationPreferences(session.user.invitationPreferences)||local?.preferences||read()?.preferences||null;
}
export function useInvitationPreferences(){
 const [preferences,setPreferences]=useState(readInvitationPreferences);
 useEffect(()=>{const update=()=>setPreferences(readInvitationPreferences());window.addEventListener(EVENT,update);window.addEventListener('fmi-auth-changed',update);window.addEventListener('storage',update);return()=>{window.removeEventListener(EVENT,update);window.removeEventListener('fmi-auth-changed',update);window.removeEventListener('storage',update);};},[]);
 return preferences;
}
export async function saveInvitationPreferences(value:InvitationPreferences){
 const preferences=normalizeInvitationPreferences(value);if(!preferences)throw Error('Choose an invitation language and tradition.');
 const session=readSession();store(session?.user.id||'guest',{preferences,pending:true});
 savePreviewLanguage(preferences.language);dismissInvitationPreferences();notify();
 if(session){await syncInvitationPreferences();if(read(session.user.id)?.pending)await syncInvitationPreferences();}
}
export function syncInvitationPreferences():Promise<void>{
 const session=readSession();if(!session)return Promise.resolve();
 const owner=session.user.id;
 if(inFlight.has(owner))return inFlight.get(owner)!;
 const task=Promise.resolve().then(async()=>{
  if(readSession()?.user.id!==owner)return;
  const guest=read();
  // Claim guest choices once. A different account on this browser must not inherit them.
  if(guest){store(owner,{...guest,pending:true});memory.delete('guest');try{localStorage.removeItem(PREFIX+'guest');sessionStorage.removeItem(PREFIX+'guest');}catch{}}
  const local=read(owner);
  let preferences=normalizeInvitationPreferences(session.user.invitationPreferences);
  if(local?.pending||session.user.invitationPreferences===undefined){
   let current=readSession();if(current?.user.id!==owner)return;
   if(current.expires_at<=Date.now()+30000){await hostRefresh();current=readSession();}
   if(current?.user.id!==owner)throw Error('Sign in again to save your preferences.');
   const request=()=>fetch('/api/auth?action=invitation-preferences',{method:local?.pending?'PUT':'GET',headers:{Authorization:'Bearer '+current!.access_token,...(local?.pending?{'Content-Type':'application/json'}:{})},...(local?.pending?{body:JSON.stringify(local.preferences)}:{}),cache:'no-store',signal:AbortSignal.timeout(12000)});
   let response=await request();
   if(response.status===401&&current.refresh_token){await hostRefresh();current=readSession();if(current?.user.id!==owner)throw Error('Sign in again to save your preferences.');response=await request();}
   const result=await response.json().catch(()=>null);
   if(!response.ok||result?.userId!==owner)throw Error('Your choices are saved on this browser. We couldn’t save them to your account. Please try again.');
   preferences=normalizeInvitationPreferences(result.preferences);
   if(local?.pending&&!preferences)throw Error('Your account preferences could not be saved. Please try again.');
  }
  const current=readSession();if(current?.user.id!==owner)return;
  // A newer choice made during the request stays pending for the next save.
  if(local?.pending&&JSON.stringify(read(owner)?.preferences)!==JSON.stringify(local.preferences))return;
  if(preferences){store(owner,{preferences,pending:false});rememberPreviewLanguage(preferences.language);dismissInvitationPreferences();}
  if(JSON.stringify(current.user.invitationPreferences)!==JSON.stringify(preferences))writeSession({...current,user:{...current.user,invitationPreferences:preferences}},current.remember!==false);
  notify();
 }).finally(()=>inFlight.delete(owner));
 inFlight.set(owner,task);return task;
}
