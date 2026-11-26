import {useEditorIssue,type EditorAction} from './editor-ui';
import {useEffect,useRef,useState} from 'react';
import {ImagePlus,RefreshCw,Trash2,Eye,Check} from 'lucide-react';
import {assistHeaders} from './assist';
import {templateToken} from '../templates/api';
import {videoRequest as request} from './request';
import {stageMedia,localMediaFile,localMediaUrl} from '../templates/local-media';
import {optimise,PHOTO_ACCEPT} from '../../shared/template-image.mjs';
import {privateVideoFile} from './private-file';
import {upload} from '@vercel/blob/client';

type Slot='groom'|'bride'|'couple';
type Reference={id:string;localId?:string;identity:'single'|'left'|'right'|'unselected'|'auto';useDefault?:boolean};
export type CharacterReferences=Partial<Record<Slot,Reference>>;
type Job={id:string;slot:string;kind:string;status:string;approved:boolean;mediaId?:string;error?:string};
type State={jobs:Job[];allowances:Record<string,{initialUsed:boolean;redoUsed:boolean}>;coupleNeedsUpdate:boolean};
export type CharacterStatus={ready:boolean;busy:boolean;message?:string};
type Props={onAction:(action:EditorAction|null)=>void;onStatus:(status:CharacterStatus)=>void;onUnlock:()=>Promise<void>;paymentBusy:boolean;invitationId:string;draftSaved:boolean;references:CharacterReferences;unlocked:boolean;amount:number;localUploads:boolean;save:()=>Promise<void>;saveReferences:(r:CharacterReferences)=>Promise<void>;approve:(job:Job)=>Promise<void>;preview:(slot:string,id:string)=>Promise<void>};
const API='/api/video-characters',active=['queued','submitting','processing','preparing'],slots:Slot[]=['groom','bride','couple'];
const labels={groom:'Groom',bride:'Bride',couple:'Couple'};
function Photo({id,localId,alt}:{id?:string;localId?:string;alt:string}){
 const [url,setUrl]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let live=true,created='';setError(false);setUrl('');(id?privateVideoFile('/api/video-personalise?action=media&id='+id):localId?localMediaUrl(localId):Promise.resolve('')).then(b=>{if(!live)return;created=typeof b==='string'?b:URL.createObjectURL(b);setUrl(created);}).catch(()=>{if(live)setError(true);});return()=>{live=false;if(created&&id)URL.revokeObjectURL(created);};},[id,localId]);
 useEditorIssue('photo-'+(id||localId||alt),error?'This photo is unavailable. Please select it again.':'');
 return url?<img src={url} alt={alt}/>:<ImagePlus aria-label={error?'Select photo again':'Loading photo'} size={24}/>;
}
export function CharacterPanel({onAction,onStatus,onUnlock,paymentBusy,invitationId,draftSaved,references,unlocked,amount,localUploads,save,saveReferences,approve,preview}:Props){
 const [state,setState]=useState<State>({jobs:[],allowances:{},coupleNeedsUpdate:false}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[loadError,setLoadError]=useState(''),[attempt,setAttempt]=useState(0);
 const lock=useRef(false),live=useRef(true),inputs=useRef<Partial<Record<Slot,HTMLInputElement|null>>>({});
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const latest=(slot:Slot)=>state.jobs.filter(j=>j.slot===slot).at(-1);
 const running=state.jobs.some(j=>active.includes(j.status));
 const individualsReady=['groom','bride'].every(slot=>state.jobs.some(j=>j.slot===slot&&j.approved));
 const defaultSlot=(slot:Slot)=>!!references[slot]?.useDefault;
 const complete=loaded&&!loadError&&slots.every(slot=>defaultSlot(slot)||latest(slot)?.approved===true)&&(!state.coupleNeedsUpdate||defaultSlot('couple'));
 const referencesReady=['groom','bride'].every(slot=>defaultSlot(slot as Slot)||references[slot as Slot]?.id||references.couple?.id);
 async function refresh(){const next=await request<State>(API+'?invitationId='+invitationId);if(live.current){setState(next);setLoaded(true);setLoadError('');}return next;}
 useEffect(()=>{if(!invitationId||!draftSaved||busy)return;let stopped=false,pending=false;const load=async()=>{if(pending||lock.current)return;pending=true;try{const next=await request<State>(API+'?invitationId='+invitationId);if(!stopped){setState(next);setLoaded(true);setLoadError('');}}catch(e){if(!stopped)setLoadError((e as Error).message);}finally{pending=false;}};void load();const timer=running?setInterval(load,4000):undefined;return()=>{stopped=true;clearInterval(timer);};},[invitationId,draftSaved,running,attempt,busy]);
 async function run(fn:()=>Promise<unknown>,label='Saving your photos…'){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage(label);setError('');
  try{await fn();}catch(e){if(live.current)setError((e as Error).message);}finally{lock.current=false;if(live.current){setBusy(false);setMessage('');}}
 }
 async function transfer(slot:Slot,ref:Reference,next:CharacterReferences){
  if(!ref.localId)throw Error('Select this photo again.');const file=await localMediaFile(ref.localId);await save();
  const reserved=await request<{id:string;pathname:string}>('/api/video-personalise?action=reserve',{kind:'image',templateId:'temple-v1',invitationId}),token=await templateToken();
  if(localUploads){const response=await fetch('/api/video-personalise?action=local-upload&id='+reserved.id,{method:'POST',headers:{...assistHeaders(),Authorization:'Bearer '+token,'Content-Type':file.type},body:file,signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Photo upload failed. Tap retry to try again.');}
  else{await upload(reserved.pathname,file,{access:'private',handleUploadUrl:'/api/video-personalise?action=upload',headers:{...assistHeaders(),Authorization:'Bearer '+token},abortSignal:AbortSignal.timeout(60000)});await request('/api/video-personalise?action=complete&id='+reserved.id,{});}
  await saveReferences({...next,[slot]:{...ref,id:reserved.id}});
 }
 async function add(file:File,slot:Slot){const processed=await optimise(file,'image'),localId=await stageMedia(processed,'image'),ref:Reference={id:'',localId,identity:slot==='couple'?'auto':'single'},next={...references,[slot]:ref};await saveReferences(next);await transfer(slot,ref,next);}
 function identity(slot:'groom'|'bride'){
  const own=references[slot];if(own?.id)return {...own,identity:'single'};
  const couple=references.couple;if(!couple?.id)throw Error('Add a groom and bride photo, or a couple photo.');
  // Honour old explicit selections; new couple references identify roles from the photo.
  return {id:couple.id,identity:['left','right'].includes(couple.identity)?slot==='groom'?couple.identity:couple.identity==='left'?'right':'left':'auto'};
 }
 async function submit(slot:Slot,redo=false){await save();await request(API+'?action=submit',{invitationId,slot,redo,...(slot==='couple'?{reference:references.couple?.id?references.couple:undefined}:{reference:identity(slot)})});await refresh();}
 // Each completed illustration waits for the customer's explicit approval.
 const result=slots.map(latest).find(j=>j?.status==='review'&&!j.approved&&(j.slot!=='couple'||!state.coupleNeedsUpdate));
 const needsCouple=individualsReady&&!running&&(!latest('couple')||state.coupleNeedsUpdate)&&!defaultSlot('couple');

 const progress=busy?message:loadError?'':!loaded&&draftSaved?'Loading photos…':'';
 useEffect(()=>{onStatus({ready:complete,busy,message:progress});},[complete,busy,progress,onStatus]);
 useEffect(()=>()=>onStatus({ready:false,busy:false}),[onStatus]);
 const focusPhotos=()=>{const slot:Slot=references.groom?.id?'bride':'groom';const button=document.getElementById('choose-'+slot);button?.scrollIntoView({block:'center'});button?.focus({preventScroll:true});};
 const failed=state.jobs.find(j=>j.status==='failed'&&!defaultSlot(j.slot as Slot)&&latest(j.slot as Slot)?.id===j.id);
 const needed=(['groom','bride'] as Slot[]).filter(slot=>!defaultSlot(slot)&&!latest(slot));
 let action:EditorAction|null=null;
 if(busy||paymentBusy)action={label:'Continue',reason:progress||'Checking invitation access…',disabled:true,run:()=>{}};
 else if(error)action={label:'Try again',reason:error,run:()=>{setError('');setAttempt(n=>n+1);}};
 else if(loadError)action={label:'Try again',reason:'Your photos could not load.',run:()=>{setLoadError('');setAttempt(n=>n+1);}};
 else if(running)action={label:'Creating characters…',reason:'Your photos are saved.',disabled:true,run:()=>{}};
 else if(result)action={label:'Approve '+result.slot+' illustration',reason:'Check your illustration before continuing.',run:()=>run(async()=>{await approve(result);await refresh();},'Saving your approval…')};
 else if(needsCouple)action={label:'Create couple illustration',reason:'Use the approved individual illustrations.',run:()=>run(()=>submit('couple'),'Creating your couple…')};
 else if(!complete&&!referencesReady)action={label:'Add photos',reason:'Add separate photos or one couple photo.',run:focusPhotos};
 else if(!unlocked)action={label:amount===0?'Continue for free':`Pay ₹${amount/100}`,reason:'',run:onUnlock};
 else if(!loaded)action={label:'Continue',reason:'Loading your photos…',disabled:draftSaved,run:()=>run(save)};
 else if(failed)action={label:'Retry characters',reason:'The last attempt did not finish.',run:()=>run(async()=>{await request(API+'?action=retry',{id:failed.id});await refresh();},'Retrying your characters…')};
 else if(needed.length)action={label:'Create my characters',reason:'',run:()=>run(async()=>{for(const slot of needed)await submit(slot);},'Starting your characters…')};
 else if(!complete)action={label:'Continue',reason:'Adding your characters…',disabled:true,run:()=>{}};
 const actionRef=useRef(action);actionRef.current=action;
 const signature=action?JSON.stringify([action.label,action.reason,!!action.disabled]):'';
 useEffect(()=>{onAction(action?{...action,run:()=>actionRef.current?.run()}:null);},[signature,onAction]);
 useEffect(()=>()=>onAction(null),[onAction]);
 useEditorIssue('characters',error||loadError||(failed?.error||''));
 async function remove(slot:Slot){const next={...references,[slot]:{id:'',identity:'single' as const,useDefault:true}};if(slot!=='couple')next.couple={...references.couple,id:references.couple?.id||'',identity:references.couple?.identity||'auto',useDefault:true};await saveReferences(next);}
 return <section className="vp-characters" aria-label="Personal photos">
  {running&&!loadError&&<p className="vp-photo-hint" role="status">Creating your characters. You can leave this page and return to the same invitation. Your photos and payment are saved.</p>}
  {!complete&&<p className="vp-photo-hint">Add separate photos or one couple photo.</p>}
  <div className="vp-photo-list">{slots.map(slot=>{
   const ref=references[slot],job=latest(slot),ready=job?.approved&&!defaultSlot(slot),source=!!(ref?.id||ref?.localId),pending=source&&!ref?.id;
   const label=labels[slot]+' photo',waiting=!!job&&active.includes(job.status),disabled=busy||waiting;
   return <article key={slot} data-character-ready={ready||undefined} className="vp-photo-row" aria-label={label}>
    <input hidden ref={node=>{inputs.current[slot]=node;}} type="file" aria-label={'Upload '+slot+' photo'} accept={PHOTO_ACCEPT} disabled={disabled} onChange={e=>{const f=e.target.files?.[0];if(f)void run(()=>add(f,slot));e.target.value='';}}/>
    <button type="button" id={'choose-'+slot} className="vp-photo-thumbnail" aria-label={source?'Replace '+slot+' photo':'Add '+slot+' photo'} disabled={disabled} onClick={()=>inputs.current[slot]?.click()}>{(ready||job?.status==='review')?<Photo id={job!.mediaId} alt={labels[slot]+' character'}/>:source?<Photo id={ref?.id} localId={ref?.localId} alt={label}/>:<ImagePlus size={24}/>}</button>
    <div className="vp-photo-label"><strong>{label}</strong><small>{defaultSlot(slot)?slot==='couple'?'Using individual characters':'Original character':ready?'Ready':pending?'Upload incomplete':source?'Photo added':slot==='couple'?'Optional with separate photos':'Add photo'}</small>{ready&&<span className="vp-photo-check"><Check size={14}/>Ready</span>}</div>
    <div className="vp-photo-icons">
     {ready&&<button type="button" aria-label={'Preview '+slot+' character'} title="Preview character" onClick={()=>void run(()=>preview(slot,job.mediaId!),'Loading preview…')}><Eye size={18}/></button>}
     {pending&&<button type="button" aria-label={'Retry '+slot+' upload'} title="Retry upload" disabled={busy} onClick={()=>void run(()=>transfer(slot,ref!,references))}><RefreshCw size={18}/></button>}
     {ready&&!state.allowances[slot]?.redoUsed&&<button type="button" aria-label={'Redo '+slot+' character'} title="Create another version (one included)" disabled={busy||running||!referencesReady} onClick={()=>void run(()=>submit(slot,true),'Starting another version…')}><RefreshCw size={18}/></button>}
     {(source||ready)&&<button type="button" aria-label={'Remove '+slot+' photo and use originals'} title="Remove photo" disabled={disabled} onClick={()=>void run(()=>remove(slot))}><Trash2 size={18}/></button>}
    </div>
   </article>;
  })}</div>
 </section>;
}
