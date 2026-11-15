import {useEffect,type RefObject} from 'react';
import {claimMusic,watchMusic} from '../templates/music-focus';
import {previewMuted,setPreviewMuted,usePreviewMuted} from '../preview-sound';
import type {VideoEntry} from './catalog';

// Shares the existing card/native-video sound control and remembers its preference.
// The parent starts both media elements in the explicit Play gesture. No media is
// mounted before Play, and preload=none keeps muted recordings off the network.
export default function CatalogSoundtrack({entry,videoRef,audioRef}:{entry:VideoEntry;videoRef:RefObject<HTMLVideoElement|null>;audioRef:RefObject<HTMLAudioElement|null>}){
 const muted=usePreviewMuted(),repeat=true;
 function sync(){
  const audio=audioRef.current,video=videoRef.current;if(!audio||!video)return;
  const time=video.currentTime,known=Number.isFinite(audio.duration)&&audio.duration>0,target=repeat&&known?time%audio.duration:time;
  if(known&&target<audio.duration&&Math.abs(audio.currentTime-target)>.25)audio.currentTime=target;
  audio.volume=video.volume*Math.min(1,time,Math.max(0,(entry.duration-time)/3));
 }
 useEffect(()=>{const audio=audioRef.current,video=videoRef.current;if(!audio||!video)return;
  if(entry.music&&audio.getAttribute('src')!==entry.music.url)audio.src=entry.music.url;
  const pause=()=>audio.pause();
  const play=()=>{sync();if(!previewMuted()&&(repeat||!Number.isFinite(audio.duration)||video.currentTime<audio.duration))void audio.play().catch(e=>{if(audio.isConnected&&e.name!=='AbortError')setPreviewMuted(true);});};
  const unwatch=watchMusic(audio,()=>video.pause()),timer=setInterval(sync,200);
  video.addEventListener('playing',play);video.addEventListener('pause',pause);video.addEventListener('waiting',pause);video.addEventListener('seeking',sync);
  return()=>{clearInterval(timer);unwatch();video.removeEventListener('playing',play);video.removeEventListener('pause',pause);video.removeEventListener('waiting',pause);video.removeEventListener('seeking',sync);audio.pause();audio.removeAttribute('src');audio.load();};
 },[videoRef,audioRef,repeat,entry.duration,entry.music?.url]);
 useEffect(()=>{const audio=audioRef.current,video=videoRef.current;if(!audio||!video)return;if(muted||video.paused)audio.pause();else void audio.play().catch(e=>{if(audio.isConnected&&e.name!=='AbortError')setPreviewMuted(true);});},[muted,audioRef,videoRef]);
 return <audio ref={audioRef} src={entry.music?.url} preload="none" loop={repeat} onLoadedMetadata={sync} onPlay={e=>claimMusic(e.currentTarget)} onError={()=>setPreviewMuted(true)}/>;
}
