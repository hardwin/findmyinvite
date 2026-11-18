import {useCallback,useEffect,useRef,useState} from 'react';
import {ownerApi,when,type Snapshot} from './api';

type ReadState<T>={key:string;data:T|null;error:string;busy:boolean;lastSuccess:string|null};
export function useOwnerRead<T>(action:string|null,poll=0){
 const [state,setState]=useState<ReadState<T>|null>(null);
 const active=useRef<AbortController|null>(null);
 const load=useCallback(async(force=true)=>{
  if(!action)return;
  active.current?.abort();
  const request=new AbortController();active.current=request;
  setState(old=>({key:action,data:old?.key===action?old.data:null,error:'',busy:true,lastSuccess:old?.key===action?old.lastSuccess:null}));
  try{
   const data=await ownerApi(action+(force?'&refresh=1':''),undefined,request.signal);
   if(request.signal.aborted)return;
   const sources=Object.values((data as Snapshot).sources||{});
   const complete=sources.every(source=>source.status==='Connected');
   const time=sources.map(s=>s.updatedAt).filter((at):at is string=>!!at).sort()[0]||new Date().toISOString();
   setState(old=>({key:action,data,error:'',busy:false,lastSuccess:complete?time:old?.key===action?old.lastSuccess:null}));
  }catch(e){
   if(request.signal.aborted)return;
   const error=e as Error&{status?:number};
   if(error.status===401)window.dispatchEvent(new Event('owner-session-expired'));
   setState(old=>({key:action,data:old?.key===action?old.data:null,error:error.message,busy:false,lastSuccess:old?.key===action?old.lastSuccess:null}));
  }
 },[action]);
 useEffect(()=>{
  if(!action){setState(null);return;}
  void load(false);
  const timer=poll?window.setInterval(()=>{if(document.visibilityState==='visible')void load(false)},poll):undefined;
  return ()=>{clearInterval(timer);active.current?.abort();};
 },[action,load,poll]);
 const current=state?.key===action?state:null;
 return {data:current?.data??null,error:current?.error||'',busy:current?.busy??!!action,lastSuccess:current?.lastSuccess??null,load};
}

const names:Record<string,string>={orderNumbers:'Order display numbers',orders:'Website orders',legacyPayments:'Legacy payments',videoOrders:'Video orders',videoCatalog:'Video catalogue',identities:'Template numbers',traffic:'Site traffic',legacyCosts:'Historical costs'};
const label=(key:string)=>names[key]||key.replace('records.','').replaceAll('-',' ').replace(/^./,v=>v.toUpperCase());
export function SourceStatus({data,error,busy,lastSuccess,retry}:{data:Snapshot|null;error:string;busy:boolean;lastSuccess:string|null;retry:()=>void}){
 const sources=Object.entries(data?.sources||{});
 const problems=sources.filter(([,s])=>s.status!=='Connected');
 const cached=sources.filter(([,s])=>s.cached);
 return <>
  {error&&<p role="alert" className="oc-error">{error} <button onClick={retry}>Retry</button></p>}
  {!!problems.length&&<div role="alert" className="oc-error"><strong>Some sources need attention.</strong><ul>{problems.map(([key,s])=><li key={key}>{label(key)} · {s.error||s.status}{s.cached&&s.updatedAt?' · Cached from '+when(s.updatedAt)+' IST':''}</li>)}</ul><button onClick={retry}>Retry sources</button></div>}
  {data&&<div className="oc-freshness" role="status">{busy?'Refreshing. Showing the last available data. ':error?'Showing the last available data. ':''}{lastSuccess?'Last successful refresh '+when(lastSuccess)+' IST.':'Awaiting a complete refresh.'}{cached.length>0&&<details><summary>Cached sources ({cached.length})</summary><ul>{cached.map(([key,s])=><li key={key}>{label(key)} · {s.updatedAt?when(s.updatedAt)+' IST':'Unknown update time'}</li>)}</ul></details>}</div>}
 </>;
}
