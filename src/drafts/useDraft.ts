import {useCallback,useEffect,useRef,useState} from 'react';
import {assistedOrder} from '../video/assist';
import {interrupted} from '../video/request';
import {readSession} from '../auth-session';
import {templateApi} from '../templates/api';
import {readDraft,writeDraft,removeDraft,importLegacyDrafts,localDrafts,draftHref,type DraftRecord,type DraftKind} from './storage';
const samePayload=(a:unknown,b:unknown)=>{
 const sorted=(_key:string,value:any)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]])):value;
 return JSON.stringify(a,sorted)===JSON.stringify(b,sorted);
};
const editorOwner=()=>assistedOrder()?'assist:'+assistedOrder():readSession()?.user.id||'guest';
const persist=(draft:DraftRecord)=>{if(!assistedOrder())writeDraft(draft);};
export function useDraft(kind:DraftKind,templateId:string){
 const [owner,setOwner]=useState(editorOwner),[record,setRecord]=useState<DraftRecord|null>(null),[ready,setReady]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 const current=useRef<DraftRecord|null>(null),initial=useRef<any>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),flight=useRef<Promise<void>|null>(null),epoch=useRef(0);
 const sync=useCallback(async():Promise<void>=>{
  if(flight.current){await flight.current;return;}
  const d=current.current;if(!d?.dirty||d.conflict||owner==='guest'||editorOwner()!==owner)return;
  const e=epoch.current;setStatus('Saving…');
  flight.current=(async()=>{try{
   let draft:DraftRecord;
   try{({draft}=await templateApi<{draft:DraftRecord}>('/api/drafts?action=save',{id:d.id,kind:d.kind,templateId:d.templateId,payload:d.payload,revision:d.revision},kind==='video'?AbortSignal.timeout(90000):undefined));}
   catch(cause){
    if(!interrupted(cause)&&(cause as {status?:number}).status!==409)throw cause;
    const {draft:remote}=await templateApi<{draft:DraftRecord}>('/api/drafts?action=get&id='+d.id,undefined,AbortSignal.timeout(25000)).catch(()=>{throw cause;});
    if(!remote||remote.revision<=d.revision||!samePayload(remote.payload,d.payload))throw cause;
    draft=remote;
   }
   if(e!==epoch.current)return;
   const latest=current.current!;const next={...latest,owner,revision:draft.revision,updatedAt:draft.updatedAt,dirty:JSON.stringify(latest.payload)!==JSON.stringify(d.payload)};current.current=next;persist(next);setRecord(next);setStatus(next.dirty?'Saving…':'Saved to your account');setError('');
  }catch(error){if(epoch.current!==e)return;const message=(error as Error).message;const conflict=/another device|draft is unavailable/.test(message);if(current.current){current.current={...current.current,conflict};setRecord(current.current);try{persist(current.current);}catch{}}setStatus(conflict?'Changes need review':'Saved on this device—waiting to sync');setError(interrupted(error)?'Your invitation will sync when the connection returns.':message);}
  })().finally(()=>{flight.current=null;});await flight.current;
  const latest=current.current;
  if(e===epoch.current&&latest?.dirty&&!latest.conflict&&latest.revision>d.revision)await sync();
 },[owner,kind]);
 useEffect(()=>{if(!record?.dirty||record.conflict||owner==='guest'||error!=='Your invitation will sync when the connection returns.')return;const t=setTimeout(()=>void sync(),12000);return()=>clearTimeout(t);},[record,error,owner,sync]);
 useEffect(()=>{const changed=()=>setOwner(editorOwner());window.addEventListener('fmi-auth-changed',changed);return()=>window.removeEventListener('fmi-auth-changed',changed);},[]);
 useEffect(()=>{let active=true;epoch.current++;setReady(false);setError('');setStatus('');current.current=null;initial.current=null;
  if(!templateId)return;
  (async()=>{if(!assistedOrder())importLegacyDrafts(owner);const params=new URLSearchParams(location.search);let requested=params.get('draft');let d=requested&&!assistedOrder()?readDraft(requested):null;
   if(d&&d.owner!==owner&&d.owner!=='guest')d=null;
   // A legacy template draft is offered through its own stable URL; never overwrite it with a new one.
   if(!requested&&!assistedOrder()&&!params.has('new')){
    const saved=localDrafts(owner).filter(x=>x.kind===kind&&x.templateId===templateId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const inPhotos=saved.filter(x=>x.owner===owner&&kind==='video'&&x.payload?.photoWorkflow==='scene-uploads'&&x.payload?.formStepId==='characters'&&x.payload?.sceneUploadSlot&&(Object.keys(x.payload.sceneChecks||{}).length||Object.keys(x.payload.pending||{}).length));
    d=params.get('resume')==='1'?saved[0]||null:inPhotos.length===1?inPhotos[0]:null;
    if(d){requested=d.id;history.replaceState(history.state,'',draftHref(d));}
   }
   if(requested&&owner!=='guest')try{const response=await templateApi<{draft:DraftRecord}>('/api/drafts?action=get&id='+requested);const remote=response.draft;if(d?.dirty&&d.revision!==remote.revision){if(!samePayload(d.payload,remote.payload)){d={...d,conflict:true};setError('This invitation changed on another device. Your local edits are safe. Reload the saved version before continuing.');}else d={...d,revision:remote.revision,dirty:false};}else if(!d?.dirty)d={...remote,owner,dirty:false};}catch(e){if((e as Error).message==='This invitation has been deleted.'){await removeDraft(requested);throw e;}if(!d)throw e;}
   if(requested&&!d)throw Error('This draft is not available on this device. Sign in to its account to continue.');
   if(d&&(d.kind!==kind||d.templateId!==templateId))throw Error('This draft belongs to a different design. Open it from My Invitations.');
   if(!d)d={id:crypto.randomUUID(),owner,kind,templateId,payload:null,revision:0,dirty:false,updatedAt:new Date().toISOString()};
   if(d.owner==='guest'&&owner!=='guest'){d={...d,owner,dirty:true};writeDraft(d);}
   if(active){current.current=d;initial.current=d.payload;setRecord(d);setStatus(d.conflict?'Changes need review':d.payload?(d.dirty?'Saved on this device—waiting to sync':owner==='guest'?'Saved on this device':'Saved to your account'):'');setReady(true);}
  })().catch(e=>{if(active){setError(e.message);setReady(true);}});
  return()=>{active=false;if(timer.current)clearTimeout(timer.current);};
 },[owner,kind,templateId]);
 const update=useCallback((payload:any,touched=true)=>{
  const d=current.current;if(!ready||!d||!touched)return;
  if(JSON.stringify(d.payload)===JSON.stringify(payload))return;
  const next={...d,payload,dirty:true,updatedAt:new Date().toISOString()};current.current=next;setRecord(next);
  try{persist(next);if(!assistedOrder())history.replaceState(history.state,'',draftHref(next));setStatus(owner==='guest'?'Saved on this device':'Saving…');}catch{setStatus('Browser storage unavailable');setError('Keep this page open until your account save completes.');}
  if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void sync(),1000);
 },[ready,owner,sync]);
 useEffect(()=>{const online=()=>void sync(),leave=()=>{if(document.visibilityState==='hidden')void sync();};window.addEventListener('online',online);window.addEventListener('pagehide',online);document.addEventListener('visibilitychange',leave);return()=>{window.removeEventListener('online',online);window.removeEventListener('pagehide',online);document.removeEventListener('visibilitychange',leave);};},[sync]);
 useEffect(()=>{if(ready&&record?.dirty&&!record.conflict)void sync();},[ready,owner]);
 async function reload(){const d=current.current;if(!d||owner==='guest')return;const {draft}=await templateApi<{draft:DraftRecord}>('/api/drafts?action=get&id='+d.id);persist({...draft,owner,dirty:false});location.reload();}
 async function flush(){await sync();if(current.current?.dirty&&!current.current.conflict&&owner!=='guest'&&!error)await sync();if(current.current?.dirty&&owner!=='guest')throw Error(current.current.conflict?'Reload the saved version before continuing.':'Your draft has not reached your account yet. Check your connection and retry.');}
 function adopt(saved:DraftRecord){const d={...saved,owner,dirty:false};current.current=d;persist(d);setRecord(d);setStatus('Saved to your account');setError('');}
 return {id:record?.id||'',ready,initial:initial.current,record,status,error,update,flush,reload,owner,adopt,getRecord:()=>current.current};
}
