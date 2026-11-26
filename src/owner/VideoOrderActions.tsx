import {useEffect,useState} from 'react';
import {VideoDelivery} from '../video/VideoDelivery';
type Status={templateId:string;step:string;job:{id:string;status:string;progress?:number}|null};
export default function VideoOrderActions({id}:{id:string}){
 const [state,setState]=useState<Status|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setState(null);setError('');
  async function load(){try{const r=await fetch('/api/video-personalise?action=assist-status',{headers:{'X-FMI-Assist':id},cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load order.');if(active)setState(d);}
   catch(e){if(active)setError((e as Error).message);}}
  void load();return()=>{active=false;};
 },[id,attempt]);
 return <section><h3>Customer video</h3>{error?<p role="alert">{error} <button onClick={()=>setAttempt(n=>n+1)}>Retry</button></p>:state?<><p>{state.job?'Render · '+state.job.status:'Progress · '+state.step}</p>{state.job?.status==='ready'&&<VideoDelivery jobId={state.job.id} orderId={id}/>}<a className="oc-button" href={'/video-personalise?assist=1&template='+encodeURIComponent(state.templateId)+'&draft='+encodeURIComponent(id)}>Complete for customer</a></>:<p role="status">Loading customer video…</p>}</section>;
}
