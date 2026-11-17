import {useRef,useState} from 'react';
import {Copy,Instagram,MessageCircle,Share2,X} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {templateShareUrl,whatsappTemplateUrl} from '../shared/template-sharing.mjs';
import './template-share.css';

export default function TemplateShare({name,detailsHref}:{name:string;detailsHref:string}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[instagramFallback,setInstagramFallback]=useState(false);
 const input=useRef<HTMLInputElement>(null),url=templateShareUrl(detailsHref);
 async function copy(forInstagram=false){
  try{await navigator.clipboard.writeText(url);setMessage(forInstagram?'Link copied. Paste it into an Instagram message or story link.':'Link copied.');}
  catch{input.current?.focus();input.current?.select();setMessage('Select and copy the link below.');}
 }
 async function instagram(){
  // Instagram has no supported web endpoint for posting a URL. Let the device
  // offer installed sharing targets, with an explicit copy/open fallback.
  if(navigator.share){
   try{await navigator.share({title:name+' · FindMyInvite',url});return;}
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
   <div className="di-share-options">
    <button type="button" onClick={()=>void copy()}><Copy size={21}/><span>Copy link</span></button>
    <button type="button" onClick={()=>void instagram()}><Instagram size={21}/><span>Instagram</span></button>
    <a href={whatsappTemplateUrl(name,url)} target="_blank" rel="noopener noreferrer"><MessageCircle size={21}/><span>WhatsApp</span></a>
   </div>
   <p className="di-share-hint">For Instagram, choose it in your device’s share options, or copy the link and paste it into Instagram.</p>
   <label className="di-share-link">Template link<input ref={input} value={url} readOnly onFocus={event=>event.currentTarget.select()}/></label>
   <p role="status" className="di-share-status">{message}</p>
   {instagramFallback&&<a className="di-share-instagram" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open Instagram ↗</a>}
  </Dialog.Content></Dialog.Portal>
 </Dialog.Root>;
}
