import renderers from '../public/studio/renderers.json';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import Home from './Home';
import Gallery from './Gallery';
import Invitation,{defaultInvite,readInvites} from './Invitation';
import type {InviteData} from './Invitation';
import {Header,Footer,Button} from './components';
import {templates, catalogMusicUrl, catalogMusicName, isPublicGalleryTemplate} from './data';
import './editor.css';
import {saveCloud,suggestedSlug,api} from './guest-api';
import type {CloudInvite} from './guest-api';
import {readSession,requestSignIn} from './auth-session';
import {PublicInvitation,GuestManagement,GuestDashboard} from './GuestPages';
import ContentPages from './ContentPages';
import OccasionLanding from './OccasionLanding';
import ManagedPhoto from './ManagedPhoto';
const GrandLaunch=lazy(()=>import('./GrandLaunch'));
const TempleDemo=lazy(()=>import('./studio/TempleDemo'));
const TextEditor=lazy(()=>import('./studio/TextEditor'));
const Workspace=lazy(()=>import('./workspace/Workspace'));
const Studio=lazy(()=>import('./studio/Studio'));
const AkayAdmin=lazy(()=>import('./AkayAdmin'));
const Assembly=lazy(()=>import('./Assembly'));
const AssemblyPipeline=lazy(()=>import('./AssemblyPipeline'));
const ManagerLogin=lazy(()=>import('./ManagerLogin'));
const labelFor=(key:string)=>key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
function readPhoto(file:File){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>typeof r.result==='string'?resolve(r.result):reject(new Error('Photo could not be read.'));r.onerror=()=>reject(new Error('Photo could not be read. Please choose it again.'));r.onabort=()=>reject(new Error('Photo reading was interrupted.'));r.readAsDataURL(file);});}
export function Editor({initialData,onCloudSave}:{initialData?:InviteData;onCloudSave?:(data:InviteData)=>Promise<void>}){
const q=new URLSearchParams(location.search);const [data,setData]=useState<InviteData>(()=>{const saved=initialData||readInvites().find(i=>i.id===q.get('id'));return saved?{...defaultInvite,...saved,sections:{...defaultInvite.sections,...saved.sections}}:{...structuredClone(defaultInvite),id:crypto.randomUUID(),template:templates.some(t=>t.id===q.get('template'))?q.get('template')!:defaultInvite.template,type:q.get('type')||'wedding',music:(()=>{const id=q.get('template')||'';const row=templates.find(t=>t.id===id);if(row)return catalogMusicUrl(row);return ['rose-gold-blush','emerald-noir','luxury-pink'].includes(id)?'/assets/track1.mp3':'/assets/track3.mp3'})()}});
const [error,setError]=useState(''),[reading,setReading]=useState(false),[saving,setSaving]=useState(false),[slug,setSlug]=useState(''),[notice,setNotice]=useState('');const pending=useRef<string|null>(null);const set=<K extends keyof InviteData>(key:K,value:InviteData[K])=>setData(d=>({...d,[key]:value}));
const update=(key:'timeline'|'preEvents',index:number,field:'title'|'time'|'description',value:string)=>setData(d=>({...d,[key]:d[key].map((event,n)=>n===index?{...event,[field]:value}:event)}));
useEffect(()=>{
 const resume=()=>{
  if(!pending.current||!readSession()||onCloudSave)return;
  const action=pending.current;pending.current=null;
  setSaving(true);setError('');
  const address=slug||suggestedSlug(data);
  if(!/^[a-z0-9][a-z0-9-]{2,47}$/.test(address)){setError('Choose a link with 3–48 lowercase letters, numbers or hyphens.');setSaving(false);return;}
  saveCloud(data,address,action==='publish').then(access=>{location.href='/manage/'+access.slug}).catch(err=>setError(err instanceof Error?err.message:'Could not save. Your changes are still here.')).finally(()=>setSaving(false));
 };
 window.addEventListener('fmi-auth-changed',resume);
 return()=>window.removeEventListener('fmi-auth-changed',resume);
},[data,slug,onCloudSave]);
return <><Header/><main className="editor-shell"><h1>{q.get('id')?'Edit Your Invitation':'Create Your Invitation'}</h1><p className="muted">Sign in with email and password to save a draft or publish. Guests still open your public link without an account.</p><form className="fmi-form" onSubmit={async e=>{e.preventDefault();setError('');setNotice('');const action=(e.nativeEvent as SubmitEvent).submitter?.getAttribute('value');try{if(onCloudSave){setSaving(true);await onCloudSave(data);setNotice('Your online invitation has been updated.');return;}if(!readSession()){pending.current=action||'draft';requestSignIn('signup');return;}setSaving(true);const address=slug||suggestedSlug(data);if(!/^[a-z0-9][a-z0-9-]{2,47}$/.test(address)){throw new Error('Choose a link with 3–48 lowercase letters, numbers or hyphens.');}const access=await saveCloud(data,address,action==='publish');location.href='/manage/'+access.slug;}catch(err){setError(err instanceof Error?err.message:'Could not save. Your changes are still here.')}finally{setSaving(false)}}}>
<label>Design<select value={data.template} onChange={e=>set('template',e.target.value)}>{templates.filter(t=>isPublicGalleryTemplate(t.id)||t.id===data.template).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Background music<select value={data.music} onChange={e=>set('music',e.target.value)}><option value="">No music</option><option value="/assets/track1.mp3">Beautiful Dream</option><option value="/assets/track3.mp3">Chill</option>{(data.template==='royal-heritage-8'||data.music==='/assets/royal-heritage-8-music.mp3')&&<option value="/assets/royal-heritage-8-music.mp3">Sita Kalyanam</option>}{(data.template==='royal-heritage-9'||data.music==='/assets/royal-heritage-9-music.mp3')&&<option value="/assets/royal-heritage-9-music.mp3">Velicha Poove</option>}{(data.template==='royal-prestige-9'||data.template==='royal-prestige-8'||data.template==='royal-prestige-7'||data.template==='royal-prestige-6'||data.template==='royal-prestige-5'||data.template==='royal-prestige-4'||data.template==='royal-prestige-3'||data.template==='royal-prestige-2'||data.music==='/assets/vazhithunaiye.mp3')&&<option value="/assets/vazhithunaiye.mp3">{catalogMusicName((templates.find(t=>t.id==='royal-prestige-2')||{musicName:'Vazhithunaiye'}) as {musicName?:string})||'Vazhithunaiye'}</option>}{data.music&&!['/assets/track1.mp3','/assets/track3.mp3','/assets/royal-heritage-8-music.mp3','/assets/royal-heritage-9-music.mp3','/assets/vazhithunaiye.mp3'].includes(data.music)&&<option value={data.music}>Saved music</option>}</select></label><div className="editor-grid">{(['groom','bride','date','time','venue','address'] as const).map(key=><label key={key}>{labelFor(key)}<input required type={key==='date'?'date':key==='time'?'time':'text'} value={data[key]} onChange={e=>set(key,e.target.value)}/></label>)}</div>
{(['welcome','groomDetails','brideDetails','dressWomen','dressMen','transport','accommodation','gifts'] as const).map(key=><label key={key}>{labelFor(key)}<textarea rows={3} value={data[key]} onChange={e=>set(key,e.target.value)}/></label>)}
{(['timeline','preEvents'] as const).map(key=><fieldset className="event-editor" key={key}><legend>{key==='timeline'?'Program Timeline':'Pre-event Celebrations'}</legend><p className="muted">Events appear in the order shown. Dates and times use India Standard Time (IST).</p>{data[key].map((event,index)=><div className="event-editor-row" key={index}><div className="event-editor-heading"><h3>{key==='timeline'?'Program event':'Celebration'} {index+1}</h3><button type="button" className="editor-text-button" aria-label={`Remove ${key==='timeline'?'program event':'celebration'} ${index+1}`} onClick={()=>set(key,data[key].filter((_,n)=>n!==index))}>Remove</button></div><div className="editor-grid"><label>Title<input required value={event.title} onChange={e=>update(key,index,'title',e.target.value)}/></label><label>Date and time<input required type="datetime-local" value={event.time} onChange={e=>update(key,index,'time',e.target.value)}/></label></div><label>Description<textarea rows={2} value={event.description} onChange={e=>update(key,index,'description',e.target.value)}/></label></div>)}<button className="fmi-button outline" type="button" onClick={()=>set(key,[...data[key],{title:'',time:data.date+'T'+data.time,description:''}])}>+ Add {key==='timeline'?'program event':'celebration'}</button></fieldset>)}
<fieldset><legend>Visible sections</legend><div className="section-toggles">{Object.entries(data.sections).map(([key,on])=><label key={key}><input type="checkbox" checked={on} onChange={e=>set('sections',{...data.sections,[key]:e.target.checked})}/>{labelFor(key)}</label>)}</div></fieldset>
<label>Personal photos (up to 8, max 1 MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={reading} onChange={async e=>{const input=e.currentTarget,files=Array.from(input.files||[]);if(!files.length)return;setError('');if(files.length>8||files.some(f=>f.size>1000000||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('Choose up to 8 image files, each smaller than 1 MB.');input.value='';return;}setReading(true);try{set('photos',await Promise.all(files.map(readPhoto)))}catch(err){setError(err instanceof Error?err.message:'Could not read the selected photos.')}finally{setReading(false);input.value='';}}}/></label><div className="editor-photos">{data.photos.map((src,index)=><figure key={index}><ManagedPhoto src={src} alt={`Invitation photo ${index+1}`}/><button type="button" onClick={()=>set('photos',data.photos.filter((_,n)=>n!==index))} aria-label={`Remove photo ${index+1}`}>Remove</button></figure>)}</div>
{!onCloudSave&&<label>Your public invitation link<span className="muted">findmyinvite.com/</span><input placeholder="ashoksupriya" maxLength={48} value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/><small>Required to publish. If you save a draft without a link, we create one from the names.</small></label>}{notice&&<p role="status">{notice}</p>}{reading&&<p role="status">Reading photos…</p>}{error&&<p className="editor-error" role="alert">{error}</p>}<div className="editor-actions"><button className="fmi-button" type="submit" disabled={reading||saving}>{saving?'Saving…':reading?'Reading photos…':onCloudSave?'Save Online Changes':'Save draft'}</button>{!onCloudSave&&<button className="fmi-button" type="submit" value="publish" disabled={reading||saving}>{saving?'Publishing…':'Publish invitation'}</button>}<Button href="/dashboard" outline>My Templates</Button></div></form></main><Footer/></>;
}

function Dashboard(){
 const [session,setSession]=useState(readSession);
 const [cloud,setCloud]=useState<CloudInvite[]>([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(Boolean(readSession()));
 useEffect(()=>{
  const sync=()=>setSession(readSession());
  window.addEventListener('fmi-auth-changed',sync);
  return()=>window.removeEventListener('fmi-auth-changed',sync);
 },[]);
 useEffect(()=>{
  if(!session?.access_token){setCloud([]);setLoading(false);return;}
  setLoading(true);
  api<{invitations:CloudInvite[]}>('mine','',session.access_token).then(value=>setCloud(value.invitations||[])).catch(err=>setError(err instanceof Error?err.message:'Could not load your templates.')).finally(()=>setLoading(false));
 },[session]);
 if(!session)return <><Header/><main className="editor-shell"><h1>My Templates</h1><p className="muted">Sign in to see invitations saved to your account.</p><button className="fmi-button" type="button" onClick={()=>requestSignIn('signin')}>Sign in</button></main><Footer/></>;
 return <><Header/><main className="editor-shell"><h1>My Templates</h1><p className="muted">Signed in as {session.user.email}. Drafts stay private until you publish.</p><Button href="/templates">Create Invitation</Button>{error&&<p className="editor-error" role="alert">{error}</p>}{loading&&<p role="status">Loading your templates…</p>}{!loading&&cloud.length===0&&<p className="py-12">No saved templates yet. Create an invitation and save a draft.</p>}{cloud.map(item=><article className="dashboard-card" key={item.slug}><h2>{item.invitation.groom} & {item.invitation.bride}</h2><p>{item.published===false?'Draft':'Published'} · {item.invitation.date} · {item.slug}</p><div className="editor-actions dashboard-actions"><Button href={'/manage/'+item.slug}>Manage</Button>{item.published!==false&&<Button href={'/'+item.slug} outline>Guest view</Button>}</div></article>)}<GuestDashboard/></main><Footer/></>;
}
function Other(){return <><Header/><main className="editor-shell"><h1>Page not found</h1><Button href="/">Return home</Button></main><Footer/></>}
export default function App(){const path=location.pathname;useEffect(()=>{if(path.startsWith('/invite/')||path.startsWith('/grand-launch')||path.startsWith('/akay')||path.startsWith('/assembly')||path.startsWith('/manager')||path.startsWith('/invitations'))return;const titles:Record<string,string>={'/':'Create Invitation Webpage Online for All Events','/templates':'Invitation Templates','/create':'Personalize Your Invitation','/dashboard':'My Templates'};document.title=(titles[path]||path.slice(1).replaceAll('-',' '))+' | FindMyInvite';},[path]);
 if(path==='/assembly'||path==='/assembly/'||path==='/assembly/pipeline'||path==='/assembly/pipeline/'){
  location.replace(path.includes('pipeline')?'/manager/pipeline':'/manager');
  return null;
 }
 return path==='/workspace'||path==='/workspace/'?<Suspense fallback={<p>Opening Workspace…</p>}><Workspace/></Suspense>:path==='/editor'||path==='/editor/'||path==='/form'||path==='/form/'?<Suspense fallback={<div style={{padding:40}}>Opening your editor…</div>}><TextEditor/></Suspense>:path==='/studio'||path==='/studio/'?<Suspense fallback={<div style={{minHeight:'100svh',background:'#f6f4f9'}}/>}><Studio/></Suspense>:path==='/manager/pipeline'||path==='/manager/pipeline/'?<Suspense fallback={<div className="pipe-shell"/>}><AssemblyPipeline/></Suspense>:path==='/manager/login'||path==='/manager/login/'?<Suspense fallback={<div className="mgr-login"/>}><ManagerLogin/></Suspense>:path==='/manager'||path==='/manager/'?<Suspense fallback={<div className="assembly-shell"/>}><Assembly/></Suspense>:path.startsWith('/akay')?<Suspense fallback={<div className="akay-gate"/>}><AkayAdmin/></Suspense>:(path==='/grand-launch'||path==='/grand-launch/')?<Suspense fallback={<div style={{minHeight:'100svh',background:'#031c17'}}/>}><GrandLaunch/></Suspense>:path==='/'?<Home/>:path==='/templates'?<Gallery/>:path.startsWith('/invite/')&&(renderers.htmlTemplates.includes(new URLSearchParams(location.search).get('template')||'')||(new URLSearchParams(location.search).get('template')||'').startsWith('sku-'))?<Suspense fallback={<p>Opening your invitation…</p>}><TempleDemo/></Suspense>:path.startsWith('/invite/')?<Invitation/>:path==='/create'?<Editor/>:['/dashboard','/login','/signup','/forgot-password'].includes(path)?<Dashboard/>:path.startsWith('/manage/')?<GuestManagement slug={path.split('/')[2]} Editor={Editor}/>:['/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy','/blog'].includes(path)||path.startsWith('/blog/')?<ContentPages/>:path.startsWith('/invitations')?<OccasionLanding/>:/^\/[a-z0-9][a-z0-9-]{2,47}$/.test(path)?<PublicInvitation slug={path.slice(1)}/>:<Other/>}



