import {useEffect,useState} from 'react';
import {managerFetch} from './manager-api';

/** Authenticated media fetch: the manager token never appears in a video URL. */
export function OpeningVideoReview({url}:{url:string}){
 const [src,setSrc]=useState('');
 const [error,setError]=useState('');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let alive=true;
  let objectUrl='';
  setSrc('');setError('');
  void (async()=>{
   try{
    const response=await managerFetch(url);
    if(!response.ok)throw new Error('Could not load the opening video.');
    const blob=await response.blob();
    if(!alive)return;
    objectUrl=URL.createObjectURL(blob);
    setSrc(objectUrl);
   }catch(err){if(alive)setError(err instanceof Error?err.message:'Could not load video.');}
  })();
  return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[url,attempt]);
 return <div className="asm-opening-review">
  <h4>Review your opening video</h4>
  {src?<video src={src} controls playsInline preload="metadata" aria-label="Opening video for approval" style={{width:'100%',maxWidth:360,maxHeight:'65vh'}}/>:<p>{error||'Loading opening video…'}</p>}
  {error&&<button type="button" onClick={()=>setAttempt(n=>n+1)}>Reload video</button>}
  <p>The remaining video and website wait for your approval. If this needs changes, discard this job and revise the storyboard.</p>
 </div>;
}
