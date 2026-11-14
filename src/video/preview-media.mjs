// A preview must either become usable or offer a retry; media events can be
// deferred indefinitely by iOS preload/low-power policies.
export function waitForMedia(video,events,ready,{timeout=15000,signal}={}){
 if(signal?.aborted)return Promise.reject(new DOMException('Preview cancelled','AbortError'));
 if(ready())return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const clean=()=>{clearTimeout(timer);for(const event of events)video.removeEventListener(event,check);video.removeEventListener('error',error);signal?.removeEventListener('abort',abort);};
  const check=()=>{if(ready()){clean();resolve();}};
  const error=()=>{clean();reject(Error('This video could not be loaded. Check your connection and tap Retry preview.'));};
  const abort=()=>{clean();reject(new DOMException('Preview cancelled','AbortError'));};
  const timer=setTimeout(()=>{clean();const e=Error('Tap Load preview to start the video on this device.');e.code='MEDIA_ACTIVATION';reject(e);},timeout);
  for(const event of events)video.addEventListener(event,check);video.addEventListener('error',error,{once:true});signal?.addEventListener('abort',abort,{once:true});check();
 });
}
export function createPreviewVideo(src,signal,[width,height]=[720,1280]){
 const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('aria-hidden','true');v.tabIndex=-1;
 // Keep the media element attached: WebKit may suspend detached video decoding.
 // Some WebKit ports expose a decoded surface at the element's rendered size.
 // A 1px element can therefore produce a 1px canvas source, despite readyState=4.
 v.width=width;v.height=height;Object.assign(v.style,{position:'fixed',width:width+'px',height:height+'px',left:'-10000px',top:'0',pointerEvents:'none'});document.body.append(v);
 const ready=waitForMedia(v,['loadedmetadata','durationchange'],()=>v.readyState>=1,{signal,timeout:20000});v.src=src;v.load();return {element:v,ready};
}
export async function seekPreviewVideo(v,frame,signal){
 const time=(frame+.1)/24;if(v.readyState>=2&&!v.seeking&&Math.abs(v.currentTime-time)<.025)return;
 const ready=waitForMedia(v,['seeked','loadeddata','canplay','timeupdate'],()=>v.readyState>=2&&!v.seeking&&Math.abs(v.currentTime-time)<.15,{signal,timeout:12000});
 if(Math.abs(v.currentTime-time)>=.001)v.currentTime=time;await ready;
}
export function releasePreviewVideo(v){if(!v)return;v.pause();v.removeAttribute('src');v.load();v.remove();}
