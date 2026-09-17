export function httpUrl(value){
 if(typeof value!=='string')return '';
 const text=value.trim();
 return /^https?:\/\//i.test(text)?text:'';
}
export function pagePreview(url){
 const href=httpUrl(url);
 if(!href)return '';
 return 'https://s.wordpress.com/mshots/v1/'+encodeURIComponent(href)+'?w=720&vpw=390&vph=844';
}
