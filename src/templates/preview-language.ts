import {INVITATION_LANGUAGES} from '../../shared/invitation-languages.mjs';
export function previewLanguage(){
 const query=new URLSearchParams(location.search).get('lang');
 if(query&&INVITATION_LANGUAGES.includes(query))return query;
 try{const saved=localStorage.getItem('fmi-preview-language');if(saved&&INVITATION_LANGUAGES.includes(saved))return saved;}catch{}
 return 'en';
}
export function savePreviewLanguage(language:string){
 if(!INVITATION_LANGUAGES.includes(language))return;
 try{localStorage.setItem('fmi-preview-language',language);}catch{}
 const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);
}
export const previewHref=(version:string,language:string,thumbnail=false)=>'/template-preview?'+new URLSearchParams({version,lang:language,...(thumbnail?{thumbnail:'1'}:{})});
