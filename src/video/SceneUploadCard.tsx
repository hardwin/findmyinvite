import './scene-uploads.css';
import {Check,Upload,UserRound,UsersRound} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import {PHOTO_ACCEPT} from '../../shared/template-image.mjs';
import {videoCustomerMessage} from '../../shared/video-customer-message.mjs';
import {privateVideoFile} from './private-file';
import {videoRequest} from './request';

type Props={
 slot:string; label:string; index:number; count:number; reference?:string; prompt:string;
 selected?:{id:string;mode:string}; selectedURL?:string; subject:string; checkedId?:string;
 pending?:{id:string;url:string;localId?:string}; busy:boolean;
 onUpload:(file:File)=>Promise<void>; onRetryUpload:()=>Promise<void>;
 onPick:(personal:boolean)=>void; onBack:()=>void; onNext:(choice?:'studio'|{id:string;mode:'cutout'|'prepared'})=>Promise<void>;
};
type CutoutState={ready:boolean;failed?:boolean;started?:boolean};
const endpoint='/api/video-personalise?action=';
export function SceneUploadCard(p:Props){
 const [message,setMessage]=useState(''),[manual,setManual]=useState(false),[copied,setCopied]=useState(false);
 const [image,setImage]=useState(''),[working,setWorking]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const [sampleHelp,setSampleHelp]=useState(false),[sampleCopied,setSampleCopied]=useState(false);
 const sampleField=useRef<HTMLInputElement>(null);
 const promptBox=useRef<HTMLTextAreaElement>(null),lock=useRef(false);
 const [personal,setPersonal]=useState(p.checkedId==='choosing-studio'?false:!!p.pending||!!p.selected||p.checkedId==='choosing-upload');
 const uploadId=personal?p.pending?.id:undefined;
 const [roleChecked,setRoleChecked]=useState(!!p.selected&&!p.pending&&p.checkedId===p.selected.id);
 useEffect(()=>{
  let live=true,timer:ReturnType<typeof setTimeout>,objectURL='';
  const stop=()=>{live=false;clearTimeout(timer);if(objectURL)URL.revokeObjectURL(objectURL);};
  setImage('');setMessage('');setFailed(false);setWorking(false);
  async function show(id:string,suffix:string){
   const blob=await privateVideoFile(endpoint+'media&id='+encodeURIComponent(id)+suffix);
   if(live){objectURL=URL.createObjectURL(blob);setImage(objectURL);}
  }
  if(!uploadId)return stop;
  setWorking(true);
  const url=endpoint+'cutout&id='+encodeURIComponent(uploadId);
  const check=async(first:boolean)=>{
   try{
    let status=await videoRequest<CutoutState>(url);
    if(!live)return;
    if(first&&!status.ready&&(status.started===false||retry>0&&status.failed))status=await videoRequest<CutoutState>(url,{});
    if(!live)return;
    if(status.failed)throw Error('The background could not be removed. Retry or upload another image.');
    if(status.ready){await show(uploadId,'&cutout=1');if(live)setWorking(false);}
    else timer=setTimeout(()=>void check(false),2500);
   }catch(e){if(live){setFailed(true);setWorking(false);setMessage(videoCustomerMessage((e as Error).message,'Your upload is saved. Retry to check this image.'));}}
  };
  void check(true);return stop;
 },[uploadId,retry]);
 async function copy(){
  try{await navigator.clipboard.writeText(p.prompt);setCopied(true);}
  catch{setManual(true);requestAnimationFrame(()=>{promptBox.current?.focus();promptBox.current?.select();});}
 }
 async function copySample(){
  if(!p.reference)return;
  try{await navigator.clipboard.writeText(new URL(p.reference,location.origin).href);setSampleCopied(true);}
  catch{sampleField.current?.focus();sampleField.current?.select();}
 }
 const choice=uploadId&&image?{id:uploadId,mode:'cutout' as const}:undefined;
 const ready=!personal||roleChecked&&(p.pending?!!choice:!!p.selected&&!!p.selectedURL);
 async function next(){
  if(!ready||lock.current)return;lock.current=true;
  try{await p.onNext(personal?choice:'studio');}catch{setMessage('Your image selection could not be saved. Tap Next to try again.');}finally{lock.current=false;}
 }
 const displayed=image||p.pending?.url||p.selectedURL;
 const Icon=p.subject.includes(' and ')?UsersRound:UserRound;
 function pick(next:boolean){
  if(next===personal)return;
  setPersonal(next);setRoleChecked(false);setMessage('');p.onPick(next);
 }
 return <article className="vp-scene-upload" aria-label={p.label}>
  <p className="vp-eyebrow">Scene {p.index+1} of {p.count}</p><h3>{p.label}</h3>
  <div className="vp-image-choices" role="group" aria-label={'Choose artwork for '+p.label}>
   <button type="button" aria-pressed={!personal} disabled={p.busy} onClick={()=>pick(false)}>
    <span className="vp-choice-art">{p.reference?<img src={p.reference} alt={p.label+' template artwork'}/>:<Icon aria-hidden="true"/>}</span>
    <span>Our drawing</span>{!personal&&<Check className="vp-pick-check" aria-hidden="true"/>}
   </button>
   <button type="button" aria-pressed={personal} disabled={p.busy} onClick={()=>pick(true)}>
    <span className="vp-choice-art">{displayed?<img src={displayed} alt={p.label+' personal image'}/>:<Icon aria-hidden="true"/>}</span>
    <span>My photo</span>{personal&&<Check className="vp-pick-check" aria-hidden="true"/>}
   </button>
  </div>
  {personal&&<ol className="vp-image-instructions">
   {p.reference&&<li>Download the drawing for this scene.<div><a className="vp-sample-link" href={p.reference} download onClick={e=>{if(/Instagram/i.test(navigator.userAgent)){e.preventDefault();setSampleHelp(true);}}}>Download style sample</a></div>{sampleHelp&&<div className="vp-sample-help"><p>Copy this sample link and open it in Safari or Chrome to save the drawing.</p><input aria-label="Style sample link" ref={sampleField} readOnly value={new URL(p.reference,location.origin).href} onFocus={e=>e.target.select()}/><button type="button" onClick={copySample}>{sampleCopied?'Link copied':'Copy sample link'}</button></div>}</li>}
   <li>In <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT</a>, attach a photo of the <strong>{p.subject}</strong> first{p.reference?', then the style sample':''}. Paste the prompt and send it.
    <div><button type="button" onClick={copy}>{copied?'Prompt copied':'Copy ChatGPT prompt'}</button></div>
    <details open={manual||undefined}><summary>Show prompt</summary><textarea aria-label="Scene prompt" ref={promptBox} readOnly value={p.prompt} rows={5}/></details>
   </li>
   <li>Save the picture from ChatGPT and add it here. We’ll remove its background.
    <label className="vp-upload-button"><Upload size={16} aria-hidden="true"/>{displayed?'Replace picture':'Add picture from ChatGPT'}<input aria-label={'Upload '+p.label} type="file" accept={PHOTO_ACCEPT} disabled={p.busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void p.onUpload(file);}}/></label>
   </li>
  </ol>}
  {personal&&working&&<p role="status">Removing the background…</p>}
  {personal&&(choice||p.selectedURL&&!p.pending)&&<label className="vp-choice"><input type="checkbox" checked={roleChecked} onChange={e=>setRoleChecked(e.target.checked)}/>I confirm this picture shows the {p.subject}.</label>}
  <p role="status">{message}</p>
  <div className="vp-scene-tools">{p.index>0&&<button type="button" disabled={p.busy} onClick={p.onBack}>Previous scene</button>}
   {personal&&(failed||p.pending&&!uploadId&&!p.busy)&&<button type="button" disabled={p.busy} onClick={()=>uploadId?setRetry(n=>n+1):void p.onRetryUpload()}>Retry</button>}
   <button type="button" className="vp-primary" disabled={!ready||personal&&working||p.busy} onClick={()=>void next()}>Next</button></div>
 </article>;
}
