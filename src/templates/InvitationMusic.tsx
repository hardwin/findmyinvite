import {useEffect,useRef,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {privateMedia} from './DynamicFields';
import {isLocalMedia,localMediaUrl} from './local-media';
import './invitation-music.css';

export default function InvitationMusic({src,preview=false}:{src:string;preview?:boolean}){
 const audio=useRef<HTMLAudioElement>(null),wanted=useRef(!preview);
 const [url,setUrl]=useState(preview||isLocalMedia(src)?'':src),[playing,setPlaying]=useState(false);
 useEffect(()=>{const controller=new AbortController();let active=true,objectUrl='';
  if(isLocalMedia(src))localMediaUrl(src).then(value=>{if(active)setUrl(value);}).catch(()=>{});
  else if(preview&&src.startsWith('/api/'))privateMedia(src,controller.signal).then(blob=>{objectUrl=URL.createObjectURL(blob);if(active)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);}).catch(()=>{});
  else setUrl(src);
  return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[src,preview]);
 useEffect(()=>{const player=audio.current;if(!player||!url)return;wanted.current=!preview;
  const start=()=>{if(wanted.current&&player.paused)void player.play().catch(()=>{});};
  const gesture=(event:Event)=>{if((event.target as Element)?.closest?.('.invitation-sound'))return;start();};
  player.addEventListener('canplay',start);document.addEventListener('pointerdown',gesture);document.addEventListener('touchend',gesture);document.addEventListener('keydown',gesture);start();
  return()=>{player.pause();player.removeEventListener('canplay',start);document.removeEventListener('pointerdown',gesture);document.removeEventListener('touchend',gesture);document.removeEventListener('keydown',gesture);};
 },[url,preview]);
 function toggle(){const player=audio.current;if(!player)return;if(!player.paused){wanted.current=false;player.pause();}else{wanted.current=true;void player.play().catch(()=>setPlaying(false));}}
 return <><audio ref={audio} src={url||undefined} loop autoPlay={!preview} preload="auto" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setPlaying(false)}/><button type="button" className="invitation-sound" aria-label={playing?'Mute music':'Unmute music'} aria-pressed={playing} onClick={toggle}>{playing?<Volume2 size={20} aria-hidden="true"/>:<VolumeX size={20} aria-hidden="true"/>}</button></>;
}
