import {useEffect,useRef,useState} from 'react';
import {Copy,Download,Instagram,MessageCircle,Share2,X} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {templateShareUrl,templateShareImagePath,whatsappTemplateUrl} from '../shared/template-sharing.mjs';
import './template-share.css';

export default function TemplateShare({name,detailsHref}:{name:string;detailsHref:string}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[instagramFallback,setInstagramFallback]=useState(false);
 const input=useRef<HTMLInputElement>(null),url=templateShareUrl(detailsHref);
 const imagePath=templateShareImagePath(detailsHref),[preview,setPreview]=useState<{file:File;url:string}|null>(null),[imageFailed,setImageFailed]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();let objectUrl='';setPreview(null);setImageFailed(false);
  void fetch(imagePath,{signal:controller.signal}).then(async response=>{
   if(!response.ok||!response.headers.get('content-type')?.startsWith('image/jpeg'))throw Error('Preview unavailable');
   const blob=await response.blob();if(controller.signal.aborted)return;
   const id=new URL(url).searchParams.get('product');
   const file=new File([blob],`${id}-findmyinvite.jpg`,{type:'image/jpeg'});objectUrl=URL.createObjectURL(file);setPreview({file,url:objectUrl});
  }).catch(()=>{if(!controller.signal.aborted)setImageFailed(true);});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[open,imagePath,url]);
 async function copy(forInstagram=false){
  try{await navigator.clipboard.writeText(url);setMessage(forInstagram?'Link copied. Paste it into an Instagram message or story link.':'Link copied.');}
  catch{input.current?.focus();input.current?.select();setMessage('Select and copy the link below.');}
 }
 async function instagram(){
  // Share actual image bytes on compatible devices, within the click's user
  // activation. Loading happens when the dialog opens, not after the click.
  const data=preview?{title:name+' · FindMyInvite',text:name+' · '+url,url,files:[preview.file]}:null;
  if(data&&navigator.share&&navigator.canShare?.({files:data.files})){
   try{await navigator.share(data);return;}
   catch(error){if((error as Error).name==='AbortError')return;}
  }
  setInstagramFallback(true);await copy(true);
 }
 return <Dialog.Root open={open} onOpenChange={value=>{setOpen(value);if(value){setMessage('');setInstagramFallback(false);}}}>
  <Dialog.Trigger asChild><button type="button" className="di-template-share" aria-label={'Share '+name}><Share2 size={16}/><span>Share</span></button></Dialog.Trigger>
  <Dialog.Portal><Dialog.Overlay className="di-share-overlay"/><Dialog.Content className="di-share-dialog">
   <Dialog.Title>Share {name}</Dialog.Title>
   <Dialog.Description>Send this template’s details, preview and price.</Dialog.Description>
   <Dialog.Close asChild><button className="di-share-close" aria-label="Close share options"><X size={20}/></button></Dialog.Close>
   <div className="di-share-preview" aria-busy={!preview&&!imageFailed}>{preview?<img src={preview.url} width={1200} height={630} alt={name+' share preview'}/>:<p>{imageFailed?'Image unavailable right now. You can still share the template link.':'Preparing your preview…'}</p>}</div>
   <div className="di-share-options">
    <button type="button" onClick={()=>void copy()}><Copy size={21}/><span>Copy link</span></button>
    <button type="button" onClick={()=>void instagram()}><Instagram size={21}/><span>Instagram</span></button>
    <a href={whatsappTemplateUrl(name,url)} target="_blank" rel="noopener noreferrer"><MessageCircle size={21}/><span>WhatsApp</span></a>
   </div>
   {preview&&<a className="di-share-save" href={preview.url} download={preview.file.name}><Download size={17}/><span>Save preview image</span></a>}
   <p className="di-share-hint">Share the template link on WhatsApp. For Instagram, share or save the image, then add the template link to your message or story.</p>
   <label className="di-share-link">Template link<input ref={input} value={url} readOnly onFocus={event=>event.currentTarget.select()}/></label>
   <p role="status" className="di-share-status">{message}</p>
   {instagramFallback&&<a className="di-share-instagram" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open Instagram ↗</a>}
  </Dialog.Content></Dialog.Portal>
 </Dialog.Root>;
}
