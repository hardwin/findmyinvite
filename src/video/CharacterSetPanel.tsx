import {useEffect,useRef,useState} from 'react';
import {ImagePlus,RefreshCw,Check} from 'lucide-react';
import {upload} from '@vercel/blob/client';
import {templateToken} from '../templates/api';
import {videoRequest as request} from './request';
import {privateVideoFile} from './private-file';
import {stageMedia,localMediaFile,localMediaUrl} from '../templates/local-media';
import {optimise,PHOTO_ACCEPT} from '../../shared/template-image.mjs';
import {useEditorIssue,type EditorAction} from './editor-ui';
import type {CharacterReferences,CharacterStatus} from './CharacterPanel';
import type {CharacterProfile} from './types';
import './character-sets.css';

type Person='bride'|'groom';
type Asset={id:string;asset:string;status:string;mediaId?:string;error?:string;reused?:boolean};
type SetView={id:string;status:string;approved:boolean;photos:Record<Person,string>;assets:Asset[]};
type State={sets:SetView[];current:string|null;approved:string|null;allowances:Record<string,{initialUsed:boolean;redoUsed:boolean}>};
type Props={profile:CharacterProfile;templateId:string;invitationId:string;draftSaved:boolean;references:CharacterReferences;unlocked:boolean;amount:number;localUploads:boolean;paymentBusy:boolean;save:()=>Promise<void>;saveReferences:(r:CharacterReferences)=>Promise<void>;approve:(id:string)=>Promise<void>;onUnlock:()=>Promise<void>;onStatus:(s:CharacterStatus)=>void;onAction:(a:EditorAction|null)=>void};
const API='/api/video-characters',active=['queued','submitting','processing','preparing'],people:Person[]=['bride','groom'];
function Photo({id,localId,alt}:{id?:string;localId?:string;alt:string}){
 const [url,setUrl]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true,owned='';setUrl('');setFailed(false);void(id?privateVideoFile('/api/video-personalise?action=media&id='+id+'&preview=1'):localId?localMediaUrl(localId):Promise.resolve('')).then(b=>{if(!live)return;owned=typeof b==='string'?b:URL.createObjectURL(b);setUrl(owned);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;if(id&&owned)URL.revokeObjectURL(owned);};},[id,localId]);
 return url?<img src={url} alt={alt}/>:<span role="status">{failed?'Photo unavailable':<ImagePlus aria-label="Loading photo"/>}</span>;
}
export function CharacterSetPanel(p:Props){
 const [state,setState]=useState<State>({sets:[],current:null,approved:null,allowances:{}}),[loaded,setLoaded]=useState(false),[enabled,setEnabled]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const lock=useRef(false),live=useRef(true),inputs=useRef<Partial<Record<Person,HTMLInputElement|null>>>({}),latest=useRef(p);latest.current=p;
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const selected=state.sets.find(s=>s.id===state.current)||state.sets.find(s=>s.id===state.approved);
 const matches=!!selected&&people.every(person=>selected.photos[person]===p.references[person]?.id);
 const running=!!selected?.assets.some(a=>active.includes(a.status));
 const complete=loaded&&matches&&selected?.approved===true;
 const photosReady=people.every(person=>!!p.references[person]?.id);
 const failed=selected?.assets.filter(a=>a.status==='failed')||[];
 const refsKey=people.map(person=>p.references[person]?.id||'').join(':');
 async function refresh(){const next=await request<State>(API+'?action=sets&invitationId='+p.invitationId);if(live.current){setState(next);setLoaded(true);}return next;}
 useEffect(()=>{let stopped=false,inFlight=false;const load=async()=>{if(inFlight||lock.current)return;inFlight=true;try{const c=await request<{enabled:boolean}>(API+'?action=set-capabilities');if(stopped)return;setEnabled(c.enabled);if(!c.enabled)throw Error('Matching characters are temporarily unavailable. Your photos are saved.');if(latest.current.draftSaved){const next=await request<State>(API+'?action=sets&invitationId='+p.invitationId);if(!stopped){setState(next);setLoaded(true);setError('');}}}catch(e){if(!stopped)setError((e as Error).message);}finally{inFlight=false;}};void load();const timer=running?setInterval(()=>{if(document.visibilityState==='visible')void load();},4500):undefined;const resume=()=>void load();window.addEventListener('focus',resume);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',resume);};},[p.invitationId,p.draftSaved,running,attempt,refsKey]);
 async function run(fn:()=>Promise<unknown>,label='Saving your photos…'){if(lock.current)return;lock.current=true;setBusy(true);setMessage(label);setError('');try{await fn();}catch(e){if(live.current)setError((e as Error).message);}finally{lock.current=false;if(live.current){setBusy(false);setMessage('');}}}
 async function transfer(person:Person,refs:CharacterReferences){const ref=refs[person];if(!ref?.localId)throw Error('Select this photo again.');const file=await localMediaFile(ref.localId);await latest.current.save();const reserved=await request<{id:string;pathname:string}>('/api/video-personalise?action=reserve',{kind:'image',templateId:p.templateId,invitationId:p.invitationId}),token=await templateToken();
  if(p.localUploads){const r=await fetch('/api/video-personalise?action=local-upload&id='+reserved.id,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':file.type},body:file,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Photo upload failed. Please retry.');}
  else{await upload(reserved.pathname,file,{access:'private',handleUploadUrl:'/api/video-personalise?action=upload',headers:{Authorization:'Bearer '+token},abortSignal:AbortSignal.timeout(60000)});await request('/api/video-personalise?action=complete&id='+reserved.id,{});}
  await latest.current.saveReferences({...refs,[person]:{...ref,id:reserved.id}});
 }
 async function add(file:File,person:Person){const processed=await optimise(file,'image'),localId=await stageMedia(processed,'image'),next={...latest.current.references,[person]:{id:'',localId,identity:'single' as const}};await latest.current.saveReferences(next);await transfer(person,next);}
 async function submit(redo=false,regenerate?:Person[]){await latest.current.save();await request(API+'?action=set-submit',{invitationId:p.invitationId,photos:Object.fromEntries(people.map(person=>[person,latest.current.references[person]?.id])),redo,...(regenerate?{regenerate}:{})});await refresh();}
 const readyAssets=selected?.assets.filter(a=>a.status==='ready')||[];
 const progress=busy?message:running?`Preparing your illustrations · ${readyAssets.length} of ${selected?.status==='identities'?2:11} ready`:'';
 useEffect(()=>{p.onStatus({ready:complete,busy:busy||running,message:progress});},[complete,busy,running,progress,p.onStatus]);
 useEffect(()=>()=>p.onStatus({ready:false,busy:false}),[p.onStatus]);
 const focusPhotos=()=>inputs.current[people.find(person=>!p.references[person]?.id)||'bride']?.click();
 let action:EditorAction|null=null;
 if(busy||p.paymentBusy)action={label:'Please wait…',reason:progress||'Checking invitation access…',disabled:true,run:()=>{}};
 else if(error||enabled===false)action={label:'Retry photo options',reason:error,run:()=>{setError('');setAttempt(n=>n+1);}};
 else if(!photosReady)action={label:'Add two photos',reason:'Choose one clear photo of the bride and one of the groom.',run:focusPhotos};
 else if(!p.unlocked)action={label:`Pay ₹${(p.amount/100).toFixed(2)}`,reason:'Includes matching illustrations and your invitation video.',run:p.onUnlock};
 else if(!p.draftSaved||!loaded)action={label:'Continue',reason:'Save your photos to continue.',run:()=>run(async()=>{await latest.current.save();await refresh();})};
 else if(running)action={label:'Preparing characters…',reason:'You can return to this saved invitation later.',disabled:true,run:()=>{}};
 else if(failed.length)action={label:'Retry unfinished characters',reason:failed[0].error||'Some illustrations need another attempt.',run:()=>run(async()=>{await request(API+'?action=set-retry',{id:selected!.id});await refresh();},'Resuming saved work…')};
 else if(!matches)action={label:people.some(person=>state.allowances[person]?.initialUsed)?'Create updated characters':'Create my characters',reason:'We’ll show your illustrated faces first.',run:()=>run(()=>submit(people.some(person=>state.allowances[person]?.initialUsed)),'Starting your characters…')};
 else if(selected?.status==='identity_review')action={label:'Approve faces & create scenes',reason:'Check that both illustrations look like you.',run:()=>run(async()=>{await request(API+'?action=set-confirm',{id:selected.id});await refresh();},'Preparing your scene illustrations…')};
 else if(selected?.status==='review')action={label:'Approve all illustrations',reason:'Review the nine scene poses below.',run:()=>run(async()=>{await p.approve(selected.id);await refresh();},'Saving your approved characters…')};
 else if(!complete)action={label:'Continue',reason:'Checking your saved characters…',run:()=>run(refresh)};
 const actionRef=useRef(action);actionRef.current=action;const signature=action?JSON.stringify([action.label,action.reason,!!action.disabled]):'';
 useEffect(()=>{p.onAction(action?{...action,run:()=>actionRef.current?.run()}:null);},[signature,p.onAction]);useEffect(()=>()=>p.onAction(null),[p.onAction]);
 useEditorIssue('character-set',error||failed[0]?.error||'');
 return <section className="vp-characters vp-character-set" aria-label="Matching illustrated characters">
  <p className="vp-photo-hint">Add a clear photo of each of you. We’ll create matching illustrations in this film’s style. Names and event details can be changed later without recreating your characters.</p>
  <div className="vp-photo-list">{people.map(person=>{const ref=p.references[person],label=person==='bride'?'Bride':'Groom',pending=!!ref?.localId&&!ref.id;return <article className="vp-photo-row" key={person}>
   <input hidden ref={el=>{inputs.current[person]=el;}} type="file" accept={PHOTO_ACCEPT} aria-label={'Upload '+person+' photo'} disabled={busy||running} onChange={e=>{const f=e.target.files?.[0];if(f)void run(()=>add(f,person),'Preparing your photo…');e.target.value='';}}/>
   <button type="button" className="vp-photo-thumbnail" aria-label={'Choose '+person+' photo'} disabled={busy||running} onClick={()=>inputs.current[person]?.click()}>{ref?.id||ref?.localId?<Photo id={ref.id} localId={ref.localId} alt={label+' reference photo'}/>:<ImagePlus/>}</button>
   <div className="vp-photo-label"><strong>{label} photo</strong><small>{pending?'Upload incomplete':ref?.id?'Photo saved':'JPG, PNG, WebP or iPhone HEIC'}</small></div>
   {pending&&<button type="button" aria-label={'Retry '+person+' upload'} disabled={busy} onClick={()=>void run(()=>transfer(person,p.references))}><RefreshCw size={18}/></button>}
  </article>;})}</div>
  {progress&&<p role="status">{progress}. Your photos and progress are saved.</p>}
  {matches&&selected&&<>
   <div className="vp-character-identities">{people.map(person=>{const a=selected.assets.find(a=>a.asset==='identity:'+person);return a?.status==='ready'?<figure key={person}><Photo id={a.mediaId} alt={person==='bride'?'Illustrated bride':'Illustrated groom'}/><figcaption>{person==='bride'?'Bride':'Groom'}{!state.allowances[person]?.redoUsed&&!running&&<button type="button" disabled={busy} onClick={()=>void run(()=>submit(true,[person]),'Creating another illustrated face…')}>Try another · one included</button>}</figcaption></figure>:null;})}</div>
   {(selected.status==='review'||selected.approved)&&<div className="vp-character-poses">{p.profile.poses.map(pose=>{const a=selected.assets.find(a=>a.asset==='pose:'+pose.slot);return <figure key={pose.slot}><Photo id={a?.mediaId} alt={pose.label}/><figcaption>{pose.label}</figcaption></figure>;})}</div>}
  </>}
  {complete&&<p className="vp-photo-check"><Check size={18}/>Your matching illustrations are approved.</p>}
 </section>;
}
