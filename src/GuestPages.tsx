import {useEffect,useState} from 'react';
import Invitation from './Invitation';
import {PublishedStudio} from './studio/StudioPreview';
import type {InviteData} from './Invitation';
import {Header,Footer,Button} from './components';
import {api,guestKeys,rememberGuest,forgetGuest,recoveryURL,uploadPhotos,isRecoveryToken} from './guest-api';
import type {CloudInvite,GuestKey} from './guest-api';
import {invitationShareText,slugShareText,whatsappHref} from './share';
import {readSession,requestSignIn,accessToken} from './auth-session';

export function PublicInvitation({slug}:{slug:string}){
 const [result,setResult]=useState<CloudInvite|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api<CloudInvite>('read',slug).then(x=>{if(active)setResult(x)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[slug]);
 if(error)return <main className="editor-shell"><h1>Invitation unavailable</h1><p>{error}</p><Button href="/">FindMyInvite</Button></main>;
 if(!result)return <main className="editor-shell" role="status">Loading invitation…</main>;
 if((result.invitation as InviteData & {studioId?:string}).studioId)return <PublishedStudio slug={slug}/>;
 return <Invitation cloudData={result.invitation} onRsvp={async fields=>{await api('rsvp',slug,'',fields)}}/>;
}
type ResponseItem={name:string;attendance:string;email?:string;guests?:number|string;message?:string};
export function GuestManagement({slug,Editor}:{slug:string;Editor:React.ComponentType<{initialData?:InviteData;onCloudSave?:(data:InviteData)=>Promise<void>}>}){
 const [credentials,setCredentials]=useState<GuestKey|null>(null),[invite,setInvite]=useState<CloudInvite|null>(null),[responses,setResponses]=useState<ResponseItem[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[hasMore,setHasMore]=useState(false);
 useEffect(()=>{
  const load=()=>{
   const fragment=location.hash.slice(1);let item=guestKeys().find(x=>x.slug===slug);
   if(/^[a-f0-9]{64}$/.test(fragment)){item={slug,token:fragment};try{rememberGuest(item)}catch{setError('Browser storage is unavailable. Keep your original recovery link.');}history.replaceState(null,'',location.pathname);}
   const token=accessToken()||item?.token||'';
   if(!token){setError('Sign in or open your private recovery link to manage this invitation.');setCredentials(null);setInvite(null);return;}
   const credentials={slug,token};setCredentials(credentials);setError('');
   api<CloudInvite>('manage',slug,token).then(setInvite).catch(e=>{
    if(accessToken()&&item){setCredentials(item);api<CloudInvite>('manage',slug,item.token).then(setInvite).catch(err=>setError(err.message));api<{responses:ResponseItem[];hasMore?:boolean}>('responses',slug,item.token).then(x=>{setResponses(x.responses);setHasMore(Boolean(x.hasMore))}).catch(err=>setError(err.message));return;}
    setError(e.message);
   });
   api<{responses:ResponseItem[];hasMore?:boolean}>('responses',slug,token).then(x=>{setResponses(x.responses);setHasMore(Boolean(x.hasMore))}).catch(e=>setError(e.message));
  };
  load();
  window.addEventListener('fmi-auth-changed',load);
  return()=>window.removeEventListener('fmi-auth-changed',load);
 },[slug]);
 if(!invite||!credentials)return <><Header/><main className="editor-shell"><h1>Manage invitation</h1><p role={error?'alert':'status'}>{error||'Loading your invitation…'}</p>{!readSession()&&<button className="fmi-button" type="button" onClick={()=>requestSignIn('signin')}>Sign in</button>}<Button href="/dashboard">My Templates</Button></main></>;
 return <><section className="editor-shell guest-management"><h1>Your invitation is {invite.published===false?'unpublished':'published'}</h1><p>Public guest link: <a href={'/'+slug}>{location.origin}/{slug}</a></p><p>{isRecoveryToken(credentials.token)?'Keep your private recovery link safe. Only share the public guest link.':'This invitation is saved to your signed-in account. Password reset is not available yet.'}</p><div className="editor-actions">{isRecoveryToken(credentials.token)&&<button className="fmi-button outline" onClick={()=>{
  const url=URL.createObjectURL(new Blob([`FindMyInvite private recovery link\n\n${recoveryURL(credentials)}\n\nKeep this private. Share only ${location.origin}/${slug} with guests.\n`],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`${slug}-private-recovery.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }}>Download recovery link</button>}{invite.published!==false&&<a className="fmi-button outline" href={whatsappHref(invitationShareText(invite.invitation.groom,invite.invitation.bride,`${location.origin}/${slug}`))} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>}<button className="fmi-button outline" onClick={async()=>{try{await navigator.clipboard.writeText(`${location.origin}/${slug}`);setNotice('Public guest link copied.')}catch{setNotice('Copy the public guest link shown above.')}}}>Copy guest link</button><button className="fmi-button outline" onClick={async()=>{try{const updated=await api<CloudInvite>('update',slug,credentials.token,{...((invite.invitation as InviteData & {studioId?:string}).studioId?{}:{data:invite.invitation}),published:invite.published===false});setInvite(updated);setNotice(updated.published===false?'Invitation unpublished.':'Invitation published.')}catch(e){setError((e as Error).message)}}}>{invite.published===false?'Publish':'Unpublish'}</button></div>
 {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 <h2>Guest responses ({responses.length})</h2>{hasMore&&<p>Showing the latest 1,000 responses. Earlier responses are retained; contact support for an export.</p>}<button className="editor-text-button" onClick={async()=>{try{const value=await api<{responses:ResponseItem[];hasMore?:boolean}>('responses',slug,credentials.token);setResponses(value.responses);setHasMore(Boolean(value.hasMore))}catch(e){setError((e as Error).message)}}}>Refresh responses</button>
 {responses.map((r,i)=><article className="guest-response" key={i}><strong>{r.name}</strong><p>{r.attendance==='yes'?`Attending · ${r.guests||1} guest(s)`:'Not attending'}</p><p>{r.email}</p><p>{r.message}</p></article>)}
 <details><summary>Delete invitation</summary><p>This permanently deletes the invitation and guest responses. Download anything you need first.</p><button className="editor-text-button" onClick={async()=>{if(!window.confirm('Permanently delete this invitation, uploaded photos and guest responses?'))return;try{await api('delete',slug,credentials.token,undefined,'DELETE');forgetGuest(slug);location.assign('/dashboard')}catch(e){setError((e as Error).message)}}}>Permanently delete</button></details></section>{(invite.invitation as InviteData & {studioId?:string}).studioId?<section className="editor-shell"><h2>Continue personalizing</h2><p>Open your saved draft in Form or Editor. Changes go live when you publish again. Use the browser where you created this invitation.</p><Button href={"/form?draft="+(invite.invitation as InviteData & {studioId:string}).studioId}>Open Form</Button> <Button href={"/editor?draft="+(invite.invitation as InviteData & {studioId:string}).studioId}>Open Editor</Button></section>:<Editor initialData={invite.invitation} onCloudSave={async data=>{const uploaded=await uploadPhotos(data,credentials);const updated=await api<CloudInvite>('update',slug,credentials.token,{data:uploaded,published:invite.published!==false});setInvite(updated);setNotice('Changes saved online.')}}/>}</>;
}
export function GuestDashboard(){const [keys,setKeys]=useState(guestKeys),[link,setLink]=useState(''),[error,setError]=useState('');return <section className="guest-dashboard"><h2>Recovery keys on this device</h2><p>Older invitations may still use a private recovery link. New saves are tied to your signed-in account.</p>{keys.map(item=><article className="dashboard-card" key={item.slug}><h3>{item.slug}</h3><div className="editor-actions"><Button href={'/manage/'+item.slug}>Manage & responses</Button><Button href={'/'+item.slug} outline>Guest view</Button><a className="fmi-button outline" href={whatsappHref(slugShareText(`${location.origin}/${item.slug}`))} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a><button className="editor-text-button" onClick={()=>{forgetGuest(item.slug);setKeys(guestKeys())}}>Forget on this device</button></div><p className="muted">Forgetting does not delete the invitation.</p></article>)}<form className="fmi-form" onSubmit={e=>{e.preventDefault();try{const url=new URL(link);if(url.origin!==location.origin||!/^\/manage\/[a-z0-9-]+$/.test(url.pathname)||!/^#[a-f0-9]{64}$/.test(url.hash))throw new Error();location.assign(url.href)}catch{setError('Enter a private recovery link from this FindMyInvite website.')}}}><label>Restore with your private recovery link<input type="password" autoComplete="off" value={link} onChange={e=>setLink(e.target.value)} required/></label><button className="fmi-button outline">Restore invitation</button>{error&&<p role="alert">{error}</p>}</form></section>}
