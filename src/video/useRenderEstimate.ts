import {useEffect,useRef,useState} from 'react';
/** Estimate from measured frame progress, without inventing a duration during setup. */
export function useRenderEstimate(job:{id:string;status:string;progress:number}|null){
 const sample=useRef<{id:string;progress:number;at:number}|null>(null),[remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{if(!job||!['queued','running'].includes(job.status)){sample.current=null;setRemaining(null);return;}
  if(job.progress<12)return;const previous=sample.current;
  if(!previous||previous.id!==job.id){sample.current={id:job.id,progress:job.progress,at:Date.now()};setRemaining(null);return;}
  const delta=job.progress-previous.progress,elapsed=(Date.now()-previous.at)/1000;
  if(delta>0&&elapsed>1)setRemaining(Math.ceil((100-job.progress)*elapsed/delta));
 },[job?.id,job?.status,job?.progress]);return remaining;
}
