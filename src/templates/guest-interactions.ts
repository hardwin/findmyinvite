// Serialized into the invitation document; no module dependencies.
export function createGuestInteractions(config:any){
 const preview=config.preview||config.content._catalogPreview||!/^[a-z0-9-]{3,48}$/.test(new URL(config.url).pathname.slice(1));
 const endpoint='/api/invitations?action=guest-interactions&slug='+encodeURIComponent(new URL(config.url).pathname.slice(1));
 const listeners:Array<(data:any)=>void>=[];
 let state:any={girl:0,boy:0,total:0,wishes:[],kolams:[]},busy=false,revision=0,readSequence=0,statusTimer:any;
 let visitor='';try{visitor=localStorage.getItem('fmi-guest-visitor')||'';}catch{}
 if(!visitor){visitor=crypto.randomUUID();try{localStorage.setItem('fmi-guest-visitor',visitor);}catch{}}
 const requests=new Map<string,string>();
 const status=(message:string)=>{clearTimeout(statusTimer);let el=document.getElementById('fmi-guest-status');if(!el){el=document.createElement('p');el.id='fmi-guest-status';el.setAttribute('role','status');el.style.cssText='position:fixed;bottom:24px;left:5%;width:90%;z-index:99999;padding:16px;border-radius:12px;background:#fff;color:#171717;font:16px system-ui;text-align:center;box-shadow:0 4px 30px #0003';document.body.append(el);}el.textContent=config.translations?.[message.trim().replace(/[’‘]/g,"'").toLowerCase()]||message;el.hidden=false;};
 const publish=(next:any)=>{state=next;listeners.forEach(fn=>fn(state));};
 // A GET started before a submission must never replace the confirmed POST result.
 async function read(){if(preview||document.hidden||busy)return;const version=revision,sequence=++readSequence;try{const r=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const next=await r.json();if(version===revision&&sequence===readSequence&&!busy)publish(next);}catch{if(version===revision&&!busy)status('Unable to load guest responses. Reconnecting…');}}
 async function save(kind:string,value:any){
  if(busy)return false;busy=true;revision++;
  const key=JSON.stringify({kind,...value});if(!requests.has(key))requests.set(key,crypto.randomUUID());
  status('Saving…');
  try{
   if(preview){
    if(kind==='poll'){state={...state,girl:value.vote==='girl'?1:0,boy:value.vote==='boy'?1:0};}
    if(kind==='wish')state={...state,wishes:[{id:requests.get(key),...value},...state.wishes]};
    if(kind==='kolam')state={...state,kolams:[{id:requests.get(key),...value},...state.kolams]};
    if(kind==='glitter')state={...state,total:state.total+value.add};
    publish(state);status('Preview only. Responses are shared after publishing.');
   }else{
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,...value,visitor,requestId:requests.get(key)}),cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error();publish(await r.json());status('Saved. All guests can now see your response.');
   }
   requests.delete(key);statusTimer=setTimeout(()=>{const el=document.getElementById('fmi-guest-status');if(el)el.hidden=true;},5000);return true;
  }catch{status('Not saved. Please check your connection and try again.');return false;}finally{busy=false;}
 }
 function subscribe(fn:(data:any)=>void){listeners.push(fn);fn(state);if(listeners.length===1){void read();setInterval(read,20000);document.addEventListener('visibilitychange',read);addEventListener('online',read);}}
 return {save,subscribe,read,get state(){return state;},preview,status};
}
