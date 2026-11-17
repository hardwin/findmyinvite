import {useCatalog} from '../catalog';
import {useVideoCatalog} from '../video/catalog';
import {useEffect,useState} from 'react';
import {templateApi} from '../templates/api';
import {readSession,requestSignIn} from '../auth-session';
import {draftHref,localDrafts,importLegacyDrafts,removeDraft,writeDraft,type DraftRecord} from './storage';
import {privateVideoFile,type DownloadProgress} from '../video/private-file';
import {Download,Pencil,Trash2} from 'lucide-react';
import {TransferProgress} from '../video/TransferProgress';
import {relativeEdit,editedTime,invitationNames} from '../../shared/draft-display.mjs';
import {videoDefinition} from '../../shared/video-personalization.mjs';
import {mergeDraftForList} from '../../shared/draft-reconcile.mjs';
import './my-invitations.css';
export default function MyInvitations(){
 const websites=useCatalog(),videos=useVideoCatalog();
 const [transfers,setTransfers]=useState<Record<string,DownloadProgress>>({}),[cardError,setCardError]=useState<{id:string;message:string}|null>(null),[downloaded,setDownloaded]=useState(''),[now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[]);
 const [owner,setOwner]=useState(readSession()?.user.id||'guest'),[items,setItems]=useState<DraftRecord[]>([]),[filter,setFilter]=useState('all'),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 async function load(){const active=()=>owner===(readSession()?.user.id||'guest');setLoading(true);setError('');try{importLegacyDrafts(owner);const local=localDrafts(owner);setItems(local);if(owner!=='guest'){
  for(const d of local.filter(d=>d.dirty&&!d.conflict)){try{if(!active())return;const r=await templateApi<{draft:DraftRecord}>('/api/drafts?action=save',{id:d.id,kind:d.kind,templateId:d.templateId,payload:d.payload,revision:d.revision});if(!active())return;writeDraft({...r.draft,owner,dirty:false});}catch(e){if(active()){if((e as Error).message==='This invitation has been deleted.')await removeDraft(d.id);else setError((e as Error).message);}}}
  const listing=await templateApi<{drafts:DraftRecord[];deleted?:string[]}>('/api/drafts');if(!active())return;for(const id of listing.deleted||[])await removeDraft(id);const remote=listing.drafts.map(d=>({...d,owner,dirty:false}));const merged=new Map(remote.map(d=>[d.id,d]));for(const d of localDrafts(owner)){const r=merged.get(d.id);if(!r||d.dirty)merged.set(d.id,mergeDraftForList(r,d));}if(active())setItems([...merged.values()]);
 }}catch(e){setError((e as Error).message);}finally{if(active())setLoading(false);}}
 useEffect(()=>{const auth=()=>{setItems([]);setOwner(readSession()?.user.id||'guest');};window.addEventListener('fmi-auth-changed',auth);return()=>window.removeEventListener('fmi-auth-changed',auth);},[]);
 useEffect(()=>{void load();},[owner]);
 const activeJobs=items.filter(d=>['queued','running'].includes(d.job?.status)).map(d=>[d.id,d.job.id]);
 useEffect(()=>{if(!activeJobs.length||owner==='guest')return;let stopped=false;
  const refresh=async()=>{if(document.visibilityState==='hidden')return;await Promise.all(activeJobs.map(async([id,jobId])=>{try{const job=await templateApi('/api/video-personalise?action=status&id='+jobId,undefined,AbortSignal.timeout(15000));if(!stopped)setItems(v=>v.map(d=>d.id===id?{...d,job}:d));}catch{/* A transient poll failure leaves the existing progress action available. */}}));};
  const timer=setInterval(()=>void refresh(),5000);return()=>{stopped=true;clearInterval(timer);};
 },[owner,JSON.stringify(activeJobs)]);
 async function remove(d:DraftRecord){if(!confirm('Delete this invitation and its saved photos? This cannot be undone.'))return;setBusy(d.id);try{if(owner!=='guest'&&d.owner!=='guest')await templateApi('/api/drafts?action=delete',{id:d.id});await removeDraft(d.id);setItems(v=>v.filter(x=>x.id!==d.id));}catch(e){setError((e as Error).message);}finally{setBusy('');}}
 async function download(d:DraftRecord){setCardError(null);setDownloaded('');const report=(p:DownloadProgress)=>setTransfers(v=>({...v,[d.id]:p}));report({loaded:0,total:0,percent:null,secondsRemaining:null});try{const file=await privateVideoFile(d.job.download,report),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=videoDefinition(d.templateId).filename;a.click();setDownloaded(d.id);setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){setCardError({id:d.id,message:(e as Error).message});}finally{setTransfers(v=>{const next={...v};delete next[d.id];return next;});}}
 return <section className="my-invitations">{owner==='guest'&&<p><button onClick={()=>requestSignIn('signin')}>Sign in</button> to see invitations from your account.</p>}<nav aria-label="Invitation types">{['all','website','video'].map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{k==='all'?'All':k==='website'?'Websites':'Videos'}</button>)}</nav>{error&&<p role="alert">{error} <button onClick={()=>void load()}>Retry</button></p>}{loading&&<p role="status">Loading invitations…</p>}{!loading&&!items.length&&<p>No invitations yet. Choose a design to start.</p>}<div className="my-invitation-grid">{items.filter(d=>filter==='all'||d.kind===filter).sort((a,b)=>editedTime(b.updatedAt)-editedTime(a.updatedAt)).map(d=>{
  const names=invitationNames(d.payload?.content)||d.payload?.slug||'Untitled invitation';
  let videoName='Video invitation';try{if(d.kind==='video')videoName=videoDefinition(d.templateId).name;}catch{}
  const catalog=d.kind==='video'?videos.entries.find(t=>t.id===d.templateId):websites.items.find(t=>t.id===d.templateId||t.templateVersionId===d.templateId);const templateCode=d.templateCode||catalog?.templateCode;
  const rendering=['queued','running'].includes(d.job?.status),ready=d.job?.status==='ready'&&d.job?.download,transfer=transfers[d.id],working=busy===d.id||!!transfer;
  return <article className="my-invitation-card" key={d.id} data-invitation-id={d.id}>
   {(d.thumbnail||d.kind==='video')&&<img src={d.thumbnail||'/assets/video-masters/'+encodeURIComponent(d.templateId)+'/poster.jpg'} alt="" loading="lazy" width={76} height={116}/>}
   <div className="my-invitation-info"><h2>{names}</h2><p>{d.templateName||(d.kind==='video'?videoName:'Wedding website')}</p>{templateCode&&<small className="di-template-code">{templateCode}</small>}<time dateTime={d.updatedAt} title={new Date(d.updatedAt).toLocaleString('en-IN')}>{relativeEdit(d.updatedAt,now)}</time>
    {(d.owner==='guest'||d.dirty)&&<small>On this device{d.dirty&&d.owner!=='guest'?' · waiting to sync':''}</small>}
    {d.payload?.missingDetails&&<p>Open on the original device to recover your details.</p>}
    <div className="my-invitation-actions">{ready?<><button className="my-invitation-primary" disabled={working} onClick={()=>void download(d)}><Download size={16}/>Download MP4</button><a className="my-invitation-icon" href={draftHref(d)} aria-label={'Edit '+names} title="Edit invitation"><Pencil size={17}/></a></>:<a className="my-invitation-primary" href={draftHref(d)}>{rendering?'View progress':d.job?.status==='expired'?'Create MP4 again':d.job?.status==='failed'?'Retry video':'Continue editing'}</a>}</div>
    {working&&transfer&&<TransferProgress label="Downloading MP4…" {...transfer}/>}
    {cardError?.id===d.id&&<p className="my-invitation-error" role="alert">{cardError.message}</p>}
    {downloaded===d.id&&<small role="status">Download ready. Check your browser downloads.</small>}
   </div>{!d.published&&<button className="my-invitation-delete my-invitation-icon" aria-label={'Delete '+names} title={rendering?'Wait for the video to finish':'Delete invitation'} disabled={working||rendering} onClick={()=>void remove(d)}><Trash2 size={17}/></button>}
  </article>;
 })}</div></section>;
}
