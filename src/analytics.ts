const skip=/^\/akay\/?$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function remember(key:string,store:Storage){
 try{
  const current=store.getItem(key);
  if(current&&uuid.test(current))return current;
  const created=crypto.randomUUID();
  store.setItem(key,created);
  return created;
 }catch{return crypto.randomUUID()}
}
function referrerValue(){
 const raw=document.referrer;
 if(!raw)return '';
 try{const url=new URL(raw);return url.origin+url.pathname}catch{return ''}
}
function collect(type:'pageview'|'heartbeat'|'leave',dwell=0){
 if(skip.test(location.pathname)||typeof navigator==='undefined')return;
 const body=JSON.stringify({
  type,path:location.pathname,dwell,
  referrer:referrerValue(),
  viewport:`${window.innerWidth}x${window.innerHeight}`,
  session:remember('fmi-sid',sessionStorage),
  visitor:remember('fmi-vid',localStorage)
 });
 fetch('/api/analytics?action=collect',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}
export function startAnalytics(){
 if(skip.test(location.pathname))return;
 let mark=Date.now();
 collect('pageview');
 const flush=(type:'heartbeat'|'leave')=>{const dwell=Math.max(0,Date.now()-mark);mark=Date.now();collect(type,dwell)};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush('leave');else mark=Date.now()});
 addEventListener('pagehide',()=>flush('leave'));
 setInterval(()=>{if(document.visibilityState==='visible')flush('heartbeat')},20000);
}
