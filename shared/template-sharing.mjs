// Public design pages only: never share a customer's draft or editor URL.
export function templateDetailsPath(id,kind='website',language){
 const params=new URLSearchParams({product:id});
 if(kind==='video')params.set('kind','video');
 if(language)params.set('lang',language);
 return '/templates?'+params;
}
export function templateShareUrl(detailsHref){
 const details=new URL(detailsHref,'https://findmyinvite.com');
 if(details.pathname!=='/templates'||!details.searchParams.get('product'))throw Error('A template details link is required.');
 return 'https://findmyinvite.com'+templateDetailsPath(details.searchParams.get('product'),details.searchParams.get('kind')||'website',details.searchParams.get('lang')||undefined)+'&share=card-v1';
}
export function templateShareImagePath(detailsHref,revision='card-v1'){
 const details=new URL(templateShareUrl(detailsHref));
 return '/template-share-images/'+(details.searchParams.get('kind')||'website')+'/'+encodeURIComponent(details.searchParams.get('product'))+'/'+encodeURIComponent(revision)+'.jpg';
}
export function whatsappTemplateUrl(name,url){return 'https://wa.me/?text='+encodeURIComponent(name+' · FindMyInvite\n'+url);}
