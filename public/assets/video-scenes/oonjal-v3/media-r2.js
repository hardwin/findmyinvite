// Readiness is a media state, not one event: iOS may preload metadata without
// emitting loadeddata until the requested frame is explicitly sought.
function waitForMedia(video,ready,{signal,timeoutMs=20000}={}){
  return new Promise((resolve,reject)=>{
    const events=['loadedmetadata','loadeddata','canplay','seeked','timeupdate','progress'];
    let timer,poll;
    const clear=()=>{clearTimeout(timer);clearInterval(poll);for(const e of events)video.removeEventListener(e,check);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);};
    const finish=error=>{clear();error?reject(error):resolve();};
    const check=()=>{if(video.error)fail();else if(ready())finish();};
    const fail=()=>finish(Error('The invitation video could not load. Tap Retry preview.'));
    const abort=()=>finish(new DOMException('Preview closed','AbortError'));
    if(signal?.aborted){abort();return;}
    for(const e of events)video.addEventListener(e,check);
    video.addEventListener('error',fail);signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(Error('The preview is taking too long to load. Tap Retry preview, or continue to create your video.')),timeoutMs);
    // A cached decode/seek can advance readyState without delivering an event.
    poll=setInterval(check,100);check();
  });
}
export async function loadPlate(video,source,options){
  video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';
  video.src=source;video.load();
  await waitForMedia(video,()=>video.readyState>=1,options);
}
export async function seekPlate(video,frame,options){
  if(!video.seeking&&Math.floor(video.currentTime*24)===frame&&video.readyState>=2)return;
  const target=(frame+.25)/24;
  video.currentTime=target;
  await waitForMedia(video,()=>!video.seeking&&video.readyState>=2&&Math.abs(video.currentTime-target)<1/24,options);
}
