import './scene-uploads.css';
import {Check,Upload,UserRound,UsersRound} from 'lucide-react';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {PHOTO_ACCEPT} from '../../shared/template-image.mjs';
import {videoCustomerMessage} from '../../shared/video-customer-message.mjs';
import {privateVideoFile} from './private-file';
import {videoRequest} from './request';
import {TransferProgress} from './TransferProgress';

type Props={
 slot:string; label:string; index:number; count:number; reference?:string; prompt:string;
 selected?:{id:string;mode:string}; selectedURL?:string; subject:string; checkedId?:string;
 pending?:{id:string;url:string;localId?:string}; busy:boolean; uploadError?:string; onClearError:()=>void;
 savedPhotoError:boolean; onReloadPhoto:()=>void;
 onUpload:(file:File)=>Promise<void>; onRetryUpload:()=>Promise<void>;
 onPick:(personal:boolean)=>void; onBack:()=>void; onNext:(choice?:'studio'|{id:string;mode:'cutout'|'prepared'})=>Promise<void>;
};
type CutoutState={ready:boolean;failed?:boolean;started?:boolean};
const endpoint='/api/video-personalise?action=';
export function SceneUploadCard(p:Props){
 const [message,setMessage]=useState(''),[manual,setManual]=useState(false),[copied,setCopied]=useState(false);
 const [image,setImage]=useState(''),[cutoutError,setCutoutError]=useState(''),[retry,setRetry]=useState(0);
 const [loadedURL,setLoadedURL]=useState(''),[brokenURL,setBrokenURL]=useState('');
 const [sampleHelp,setSampleHelp]=useState(false),[sampleCopied,setSampleCopied]=useState(false);
 const sampleField=useRef<HTMLInputElement>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 const promptBox=useRef<HTMLTextAreaElement>(null),lock=useRef(false);
 const [saving,setSaving]=useState(false);
 const [personal,setPersonal]=useState(p.checkedId==='choosing-studio'?false:!!p.pending||!!p.selected||p.checkedId==='choosing-upload');
 const uploadId=personal?p.pending?.id:undefined;
 const resultPanel=useRef<HTMLElement>(null);
 useEffect(()=>{
  let live=true,timer:ReturnType<typeof setTimeout>,objectURL='';
  const stop=()=>{live=false;clearTimeout(timer);if(objectURL)URL.revokeObjectURL(objectURL);};
  setImage('');setCutoutError('');
  async function show(id:string,suffix:string){
   const blob=await privateVideoFile(endpoint+'media&id='+encodeURIComponent(id)+suffix);
   if(live){objectURL=URL.createObjectURL(blob);setImage(objectURL);}
  }
  if(!uploadId)return stop;
  const url=endpoint+'cutout&id='+encodeURIComponent(uploadId);
  const check=async(first:boolean)=>{
   try{
    let status=await videoRequest<CutoutState>(url);
    if(!live)return;
    if(first&&!status.ready&&(status.started===false||retry>0&&status.failed))status=await videoRequest<CutoutState>(url,{});
    if(!live)return;
    if(status.failed)throw Error('The background could not be removed. Retry or upload another image.');
    if(status.ready)await show(uploadId,'&cutout=1');
    else timer=setTimeout(()=>void check(false),2500);
   }catch(e){if(live)setCutoutError(videoCustomerMessage((e as Error).message,'Your upload is saved. Retry to check this image.'));}
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
 const resultURL=p.pending?image:p.selectedURL;
 const uploadFailed=!!p.uploadError||!!p.pending&&!uploadId&&!p.busy;
 const loadFailed=!!resultURL&&brokenURL===resultURL||!!p.selected&&!p.pending&&!p.selectedURL&&p.savedPhotoError;
 const hasUpload=personal&&!!(p.pending||p.selected||p.busy||p.uploadError);
 const stage=!hasUpload?'choose':p.busy?'uploading':uploadFailed||cutoutError||loadFailed?'error':
  resultURL&&loadedURL===resultURL?'review':uploadId&&!image?'removing':'loading';
 const progressLabel=stage==='uploading'?'Uploading your picture…':stage==='removing'?'Removing the background…':'Loading your scene image…';
 const processing=stage==='uploading'||stage==='removing'||stage==='loading';
 useLayoutEffect(()=>{
  const panel=resultPanel.current;
  if(!panel)return;
  panel.focus({preventScroll:true});
  panel.scrollIntoView({block:'nearest',behavior:'instant'});
 },[stage]);
 async function next(){
  if(p.busy||personal&&stage!=='review'||lock.current)return;
  lock.current=true;setSaving(true);setMessage('');
  try{await p.onNext(personal?choice:'studio');}catch{setMessage('Couldn’t save this scene. Please try again.');}finally{lock.current=false;setSaving(false);}
 }
 const displayed=personal?resultURL:p.pending?.url||p.selectedURL;
 const Icon=p.subject.includes(' and ')?UsersRound:UserRound;
 function pick(next:boolean){
  if(next===personal||saving)return;
  setPersonal(next);setMessage('');p.onClearError();p.onPick(next);
 }
 function retryImage(){
  if(uploadFailed){
   if(!uploadId&&p.pending?.localId)void p.onRetryUpload();
   else p.onClearError();
  }else if(uploadId){
   setCutoutError('');setImage('');setRetry(n=>n+1);
  }else{
   setBrokenURL('');p.onReloadPhoto();
  }
 }
 const artwork=<div className="vp-image-choices" role="group" aria-label={'Choose artwork for '+p.label}>
   <button type="button" aria-pressed={!personal} disabled={p.busy} onClick={()=>pick(false)}>
    <span className="vp-choice-art">{p.reference?<img src={p.reference} alt={p.label+' template artwork'}/>:<Icon aria-hidden="true"/>}</span>
    <span>Our drawing</span>{!personal&&<Check className="vp-pick-check" aria-hidden="true"/>}
   </button>
   <button type="button" aria-pressed={personal} disabled={p.busy} onClick={()=>pick(true)}>
    <span className="vp-choice-art vp-personal-art">{displayed?<img src={displayed} alt={p.label+' personal image'} onLoad={()=>setLoadedURL(displayed)} onError={()=>setBrokenURL(displayed)}/>:<Icon aria-hidden="true"/>}</span>
    <span>My photo</span>{personal&&<Check className="vp-pick-check" aria-hidden="true"/>}
   </button>
  </div>;
 const instructions=<ol className="vp-image-instructions">
   {p.reference&&<li>Download the drawing for this scene.<div><a className="vp-sample-link" href={p.reference} download onClick={e=>{if(/Instagram/i.test(navigator.userAgent)){e.preventDefault();setSampleHelp(true);}}}>Download style sample</a></div>{sampleHelp&&<div className="vp-sample-help"><p>Copy this sample link and open it in Safari or Chrome to save the drawing.</p><input aria-label="Style sample link" ref={sampleField} readOnly value={new URL(p.reference,location.origin).href} onFocus={e=>e.target.select()}/><button type="button" onClick={copySample}>{sampleCopied?'Link copied':'Copy sample link'}</button></div>}</li>}
   <li>In <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT</a>, attach a photo of the <strong>{p.subject}</strong> first{p.reference?', then the style sample':''}. Paste the prompt and send it.
    <div><button type="button" onClick={copy}>{copied?'Prompt copied':'Copy ChatGPT prompt'}</button></div>
    <details open={manual||undefined}><summary>Show prompt</summary><textarea aria-label="Scene prompt" ref={promptBox} readOnly value={p.prompt} rows={5}/></details>
   </li>
   <li>Save the picture from ChatGPT, then upload it here.</li>
  </ol>;
 const uploadButton=<button type="button" className={'vp-upload-button'+(hasUpload?' vp-replace-picture':'')} disabled={p.busy||saving} onClick={()=>fileInput.current?.click()}>
  <Upload size={16} aria-hidden="true"/>{hasUpload?'Replace picture':'Add picture from ChatGPT'}
 </button>;
 return <article className="vp-scene-upload" aria-label={p.label} aria-busy={saving} inert={saving}>
  <input ref={fileInput} className="vp-picker-input" hidden aria-label={'Upload '+p.label} type="file" accept={PHOTO_ACCEPT} disabled={p.busy||saving} onChange={async e=>{
   const input=e.currentTarget,file=input.files?.[0];
   if(file){setMessage('');try{await p.onUpload(file);}finally{input.value='';}}
  }}/>
  <p className="vp-eyebrow">Scene {p.index+1} of {p.count}</p><h3>{p.label}</h3>
  {hasUpload?<section ref={resultPanel} tabIndex={-1} className="vp-scene-result" aria-label={'Image review for '+p.label}>
   {processing&&<div className="vp-scene-progress" role="progressbar" aria-label={progressLabel}><TransferProgress label={progressLabel}/></div>}
   {stage==='error'&&<>
    <p role="alert">{videoCustomerMessage(p.uploadError||cutoutError,uploadFailed?'Your upload didn’t finish. Try again or choose a picture.':'Your scene image couldn’t load.')}</p>
    <div className="vp-result-actions">
     {(!uploadFailed||p.pending?.localId&&!uploadId)&&<button type="button" onClick={retryImage}>Retry</button>}
     {uploadFailed&&p.uploadError&&(uploadId||!p.pending&&p.selected)&&<button type="button" onClick={p.onClearError}>Use previous picture</button>}
     {uploadButton}
    </div>
   </>}
   {stage==='review'&&<p className="vp-review-status" role="status"><Check size={18} aria-hidden="true"/>{choice||p.selected?.mode==='cutout'?'Background removed':'Ready to review'}</p>}
   {resultURL&&<div hidden={stage!=='review'}>{artwork}</div>}
   {stage==='review'&&<>
    <button type="button" className="vp-primary vp-confirm-scene" onClick={()=>void next()}>{saving?'Saving…':'I confirm that the image is correct for this scene, Proceed to next scene image'}</button>
    {message&&<p role="alert">{message}</p>}
   </>}
  </section>:artwork}
  {personal&&(hasUpload?<details className="vp-upload-guide"><summary>Upload instructions</summary>{instructions}</details>:instructions)}
  <div className="vp-scene-tools">
   {personal&&(!hasUpload||stage==='review')&&uploadButton}
   {hasUpload&&stage!=='review'&&<button type="button" disabled={p.busy} onClick={()=>pick(false)}>Use our drawing</button>}
   {p.index>0&&<button type="button" disabled={p.busy} onClick={p.onBack}>Previous scene</button>}
   {!personal&&<button type="button" className="vp-primary" disabled={p.busy} onClick={()=>void next()}>{saving?'Saving…':'Next'}</button>}
  </div>
  {!personal&&message&&<p role="alert">{message}</p>}
 </article>;
}
