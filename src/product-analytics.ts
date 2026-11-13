type EventType='template_selected'|'preview'|'form_start'|'form_progress'|'checkout'|'error';
function attribution(){
 try{
  if(localStorage.getItem('fmi-analytics-consent')!=='yes')return undefined;
  const q=new URLSearchParams(location.search),sanitize=(v:string)=>v.replace(/[^a-zA-Z0-9 _.-]/g,'').slice(0,100);let source=q.get('utm_source')||'';
  if(!source&&document.referrer){const url=new URL(document.referrer);if(url.origin!==location.origin)source=url.hostname;}
  if(source){const value={source:sanitize(source),medium:sanitize(q.get('utm_medium')||'referral'),campaign:sanitize(q.get('utm_campaign')||''),at:new Date().toISOString()};localStorage.setItem('fmi-attribution',JSON.stringify(value));return value;}
  const stored=JSON.parse(localStorage.getItem('fmi-attribution')||'null');return stored&&Date.parse(stored.at)>Date.now()-30*86400000?stored:undefined;
 }catch{return undefined;}
}
export function analyticsContext(){try{let session=sessionStorage.getItem('fmi-sid');if(!session){session=crypto.randomUUID();sessionStorage.setItem('fmi-sid',session);}return {id:crypto.randomUUID(),session,language:'en',device:innerWidth<600?'mobile':innerWidth<1000?'tablet':'desktop',attribution:attribution()};}catch{return undefined;}}
export function trackProduct(type:EventType,templateId:string,language='en',step?:number){if(location.pathname.startsWith('/akay')||sessionStorage.getItem('fmi-owner-csrf'))return;const context=analyticsContext();if(!context)return;void fetch('/api/owner?action=collect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...context,type,templateId,language,step}),keepalive:true}).catch(()=>{});}
export function startProductTracking(){document.addEventListener('click',e=>{const link=(e.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(!link)return;const url=new URL(link.href,location.origin);if(url.origin!==location.origin)return;const version=url.searchParams.get('version'),product=url.searchParams.get('product');if(product)trackProduct('template_selected',product,url.searchParams.get('lang')||'en');if(version&&url.pathname==='/template-preview')trackProduct('template_selected',version,url.searchParams.get('lang')||'en');});}
