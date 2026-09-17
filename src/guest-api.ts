import type {InviteData} from './Invitation';
import {accessToken,readSession} from './auth-session';

export type GuestKey={slug:string;token:string};
export type CloudInvite={invitation:InviteData;slug:string;expiresAt:string;published?:boolean};
const key='findmyinvite-guest-keys-v1';
export function guestKeys():GuestKey[]{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(x=>typeof x?.slug==='string'&&/^[a-f0-9]{64}$/.test(x?.token)):[]}catch{return []}}
export function rememberGuest(item:GuestKey){localStorage.setItem(key,JSON.stringify([...guestKeys().filter(x=>x.slug!==item.slug),item]));}
export function forgetGuest(slug:string){localStorage.setItem(key,JSON.stringify(guestKeys().filter(x=>x.slug!==slug)));}
export function recoveryURL(item:GuestKey){return `${location.origin}/manage/${encodeURIComponent(item.slug)}#${item.token}`;}
export function isRecoveryToken(token:string){return /^[a-f0-9]{64}$/.test(token);}
export function newGuestKey(slug:string):GuestKey{return {slug,token:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};}
export async function api<T>(action:string,slug='',token='',body?:unknown,method?:string):Promise<T>{
 const secret=token||accessToken();
 const response=await fetch(`/api/invitations?action=${encodeURIComponent(action)}&slug=${encodeURIComponent(slug)}`,{method:method||(body?'POST':'GET'),headers:{...(body?{'Content-Type':'application/json'}:{}),...(secret?{Authorization:`Bearer ${secret}`}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 let value;try{value=await response.json()}catch{throw new Error('Publishing is not configured on this preview. Your local draft is safe.');}
 if(!response.ok)throw new Error(value.error||'The request could not be completed. Please try again.');return value;
}
export function suggestedSlug(data:InviteData){
 const base=(data.groom+' '+data.bride).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
 if(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(base))return base;
 return 'invite-'+Date.now().toString(36);
}
export async function uploadPhotos(data:InviteData,credentials:GuestKey):Promise<InviteData>{
 const photos=[];
 for(const [slot,url] of data.photos.entries()){
  if(!url.startsWith('data:')){photos.push(url);continue;}
  const response=await fetch(`/api/media?slug=${encodeURIComponent(credentials.slug)}&slot=${slot}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${credentials.token}`},body:JSON.stringify({dataUrl:url})});
  const value=await response.json();if(!response.ok)throw new Error(value.error||'Photo upload failed. Your draft is preserved.');photos.push(value.url);
 }
 return {...data,photos};
}
export async function saveCloud(data:InviteData,slug:string,published:boolean):Promise<GuestKey>{
 const session=readSession();
 if(!session?.access_token)throw new Error('Sign in to save or publish.');
 const existing=guestKeys().find(x=>x.slug===slug);
 const credentials=existing||newGuestKey(slug);
 rememberGuest(credentials);
 await api<CloudInvite>('create','',session.access_token,{slug,data:{...data,photos:data.photos.filter(x=>!x.startsWith('data:'))},managementToken:credentials.token});
 const uploaded=await uploadPhotos(data,{slug,token:session.access_token});
 await api('update',slug,session.access_token,{data:uploaded,published});
 return credentials;
}
export async function publishDraft(data:InviteData,slug:string):Promise<GuestKey>{
 return saveCloud(data,slug,true);
}
