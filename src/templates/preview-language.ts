import {INVITATION_LANGUAGES} from '../../shared/invitation-languages.mjs';
import {useSyncExternalStore} from 'react';
const LANGUAGE_EVENT='fmi-preview-language-changed';
function subscribe(listener:()=>void){window.addEventListener(LANGUAGE_EVENT,listener);window.addEventListener('storage',listener);window.addEventListener('popstate',listener);return()=>{window.removeEventListener(LANGUAGE_EVENT,listener);window.removeEventListener('storage',listener);window.removeEventListener('popstate',listener);};}
export const usePreviewLanguage=()=>useSyncExternalStore(subscribe,previewLanguage,()=> 'en');
export function selectedPreviewLanguage(){
 const query=new URLSearchParams(location.search).get('lang');
 if(query&&INVITATION_LANGUAGES.includes(query))return query;
 try{const saved=localStorage.getItem('fmi-preview-language');if(saved&&INVITATION_LANGUAGES.includes(saved))return saved;}catch{}
 return null;
}
export function previewLanguage(){return selectedPreviewLanguage()||'en';}
export function rememberPreviewLanguage(language:string){
 if(!INVITATION_LANGUAGES.includes(language))return;
 try{localStorage.setItem('fmi-preview-language',language);}catch{}
 window.dispatchEvent(new Event(LANGUAGE_EVENT));
}
export function savePreviewLanguage(language:string){
 if(!INVITATION_LANGUAGES.includes(language))return;
 const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
 rememberPreviewLanguage(language);
}
export const previewHref=(version:string,language:string,thumbnail=false)=>'/template-preview?'+new URLSearchParams({version,lang:language,...(thumbnail?{thumbnail:'1'}:{})});
