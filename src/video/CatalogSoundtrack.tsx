import {useEffect,useRef,type RefObject} from 'react';
import {claimMusic,watchMusic} from '../templates/music-focus';
import {previewMuted,setPreviewMuted,usePreviewMuted} from '../preview-sound';
import {createPreviewAudio} from '../../shared/preview-audio.mjs';
import type {VideoEntry} from './catalog';

export default function CatalogSoundtrack({entry,videoRef,audioRef}:{entry:VideoEntry;videoRef:RefObject<HTMLVideoElement|null>;audioRef:RefObject<HTMLAudioElement|null>}){
 const muted=usePreviewMuted(),controller=useRef<ReturnType<typeof createPreviewAudio>|null>(null);
 useEffect(()=>{const audio=audioRef.current,video=videoRef.current;if(!audio||!video)return;
  const player=createPreviewAudio(audio,{clock:()=>({time:video.currentTime,running:!video.paused&&!previewMuted(),buffering:video.seeking||video.readyState<3}),duration:entry.duration,volume:(time:number)=>video.volume*Math.min(1,time,Math.max(0,(entry.duration-time)/3)),onError:()=>setPreviewMuted(true)});
  controller.current=player;
  const start=()=>{if(!previewMuted())player.start();},stop=()=>player.stop(),unwatch=watchMusic(audio,()=>video.pause());
  audio.addEventListener('fmi-audio-start',start);video.addEventListener('playing',start);video.addEventListener('pause',stop);
  return()=>{unwatch();player.dispose();controller.current=null;audio.removeEventListener('fmi-audio-start',start);video.removeEventListener('playing',start);video.removeEventListener('pause',stop);audio.removeAttribute('src');audio.load();};
 },[videoRef,audioRef,entry.duration,entry.music?.url]);
 useEffect(()=>{if(muted||videoRef.current?.paused)controller.current?.stop();else controller.current?.start();},[muted,videoRef]);
 return <audio ref={audioRef} src={entry.music?.url} preload="none" loop onPlay={e=>claimMusic(e.currentTarget)} onError={()=>setPreviewMuted(true)}/>;
}
