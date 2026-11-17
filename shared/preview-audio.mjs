// One play request at a time. Follow a stalled film by pausing, not by repeatedly
// seeking the soundtrack back to the same frame (which produces audible chatter).
export function createPreviewAudio(audio,{clock,duration,repeat=true,volume=(_time,_duration)=>1,onError=(_error)=>{},now=()=>performance.now()}){
 let enabled=false,pending=null,disposed=false,align=true,lastSeek=-Infinity,lastTime=null,lastAdvance=now();
 function play(){
  if(disposed||pending||!audio.paused)return;
  const request=audio.play();
  pending=Promise.resolve(request).catch(error=>{if(enabled&&error.name!=='AbortError')onError(error);}).finally(()=>{pending=null;if(disposed||!enabled)audio.pause();});
 }
 function sync(){
  if(disposed)return;
  const state=clock(),time=Math.max(0,state.time),stamp=now(),known=Number.isFinite(audio.duration)&&audio.duration>0;
  audio.loop=repeat;audio.volume=Math.max(0,Math.min(1,volume(time,duration)));
  if(lastTime===null||Math.abs(time-lastTime)>.005){lastAdvance=stamp;lastTime=time;}
  const target=known&&repeat?time%audio.duration:time;
  if(!enabled){audio.pause();audio.playbackRate=1;align=true;return;}
  if(!state.running||state.buffering||stamp-lastAdvance>300){audio.pause();audio.playbackRate=1;align=true;return;}
  if(!known||audio.readyState<2||audio.seeking)return;
  if(!repeat&&target>=audio.duration){audio.pause();return;}
  const delta=target-audio.currentTime;
  if(align||Math.abs(delta)>.8&&stamp-lastSeek>1000){
   align=false;lastSeek=stamp;
   if(Math.abs(delta)>.08){audio.currentTime=target;return;}
  }
  // Tiny clock differences use a pitch-preserving rate correction, never a seek.
  audio.playbackRate=Math.abs(delta)<.06?1:Math.max(.98,Math.min(1.02,1+delta*.05));
  play();
 }
 function start(){
  if(disposed)return;enabled=true;align=true;lastAdvance=now();lastTime=null;
  // Call within the user's gesture to unlock audio on mobile; metadata/canplay
  // completes initial alignment before subsequent clock-driven playback.
  play();sync();
 }
 function stop(){enabled=false;align=true;audio.pause();audio.playbackRate=1;}
 for(const event of ['loadedmetadata','canplay','seeked'])audio.addEventListener(event,sync);
 const timer=setInterval(sync,100);
 return {start,stop,sync,dispose(){disposed=true;stop();clearInterval(timer);for(const event of ['loadedmetadata','canplay','seeked'])audio.removeEventListener(event,sync);}};
}
