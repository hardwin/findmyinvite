import {useSyncExternalStore} from 'react';

const key='findmyinvite-preview-muted-v1',eventName='fmi-preview-sound';
type SoundWindow=Window&{fmiPreviewMuted?:boolean};
function scope():SoundWindow{
 try{if(window.top?.location.origin===location.origin)return window.top;}catch{}
 return window;
}
export function previewMuted(){
 if(typeof window==='undefined')return false;
 const target=scope();
 if(target.fmiPreviewMuted!==undefined)return target.fmiPreviewMuted;
 try{return target.localStorage.getItem(key)==='1';}catch{return false;}
}
export function setPreviewMuted(muted:boolean){
 const target=scope();target.fmiPreviewMuted=muted;
 try{target.localStorage.setItem(key,muted?'1':'0');}catch{}
 target.dispatchEvent(new Event(eventName));
}
function subscribe(listener:()=>void){
 const target=scope();
 const storage=(event:StorageEvent)=>{if(event.key===key||event.key===null){delete target.fmiPreviewMuted;listener();}};
 const cleanup=()=>{target.removeEventListener(eventName,listener);target.removeEventListener('storage',storage);window.removeEventListener('pagehide',hide);};
 const hide=(event:PageTransitionEvent)=>{if(!event.persisted)cleanup();};
 target.addEventListener(eventName,listener);target.addEventListener('storage',storage);
 window.addEventListener('pagehide',hide);
 return cleanup;
}
// Share the choice with invitation frames and retain it across navigation/reloads.
export const usePreviewMuted=()=>useSyncExternalStore(subscribe,previewMuted,()=>false);
