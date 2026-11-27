import './scene-uploads.css';
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
 onBack:()=>void; onNext:(choice?:{id:string;mode:'cutout'|'prepared'})=>Promise<void>;
};
type CutoutState={ready:boolean;failed?:boolean;started?:boolean};
const endpoint='/api/video-personalise?action=';
export function SceneUploadCard(p:Props){
 const [message,setMessage]=useState(''),[manual,setManual]=useState(false),[copied,setCopied]=useState(false);
 const [image,setImage]=useState(''),[working,setWorking]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const promptBox=useRef<HTMLTextAreaElement>(null),lock=useRef(false);
 const uploadId=p.pending?.id;
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
 const choice=uploadId&&image?{id:uploadId,mode:'cutout' as const}:undefined;
 const ready=roleChecked&&(p.pending?!!choice:!!p.selected&&!!p.selectedURL);
 async function next(){
  if(!ready||lock.current)return;lock.current=true;
  try{await p.onNext(choice);}catch{setMessage('Your image selection could not be saved. Tap Next to try again.');}finally{lock.current=false;}
 }
 const displayed=image||p.pending?.url||p.selectedURL;
 return <article className="vp-scene-upload" aria-label={p.label}>
  <p className="vp-eyebrow">Scene {p.index+1} of {p.count}</p><h3>{p.label}</h3>
  {p.reference&&<div className="vp-scene-reference"><img src={p.reference} alt={p.label+' template reference'}/><a href={p.reference} download>Save scene reference</a></div>}
  <ol><li>Open ChatGPT and attach {p.reference?'the scene reference, then a personal photo for the ':'a personal photo for the '}{p.subject}.</li><li>Paste this prompt and save the image ChatGPT makes.</li><li>Upload that image here. We’ll remove its background.</li></ol>
  <div className="vp-scene-tools"><button type="button" onClick={copy}>{copied?'Prompt copied':'Copy prompt'}</button><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a></div>
  {manual&&<label>Copy this prompt<textarea ref={promptBox} value={p.prompt} readOnly rows={5}/></label>}
  {displayed&&<figure><img src={displayed} alt={p.label+' personal image'}/><figcaption>{working?'Removing background…':p.pending&&!image?'Uploaded image':'Your scene image'}</figcaption></figure>}
  <label>{displayed?'Replace image':'Upload scene image'}<input aria-label={'Upload '+p.label} type="file" accept={PHOTO_ACCEPT} disabled={p.busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void p.onUpload(file);}}/></label>
  {(choice||p.selectedURL&&!p.pending)&&<label className="vp-choice"><input type="checkbox" checked={roleChecked} onChange={e=>setRoleChecked(e.target.checked)}/>I confirm this image shows the {p.subject} for this scene.</label>}
  <p role="status">{message||(working?'Preparing your image…':'')}</p>
  <div className="vp-scene-tools">{p.index>0&&<button type="button" disabled={p.busy} onClick={p.onBack}>Previous scene</button>}
   {(failed||p.pending&&!uploadId&&!p.busy)&&<button type="button" disabled={p.busy} onClick={()=>uploadId?setRetry(n=>n+1):void p.onRetryUpload()}>Retry</button>}
   <button type="button" className="vp-primary" disabled={!ready||working||p.busy} onClick={()=>void next()}>Next</button></div>
 </article>;
}
