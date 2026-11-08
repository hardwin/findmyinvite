import {useEffect,useRef,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {privateMedia} from './DynamicFields';
import {isLocalMedia,localMediaUrl} from './local-media';
import './invitation-music.css';
import {claimMusic,watchMusic} from './music-focus';

export default function InvitationMusic({src,preview=false}:{src:string;preview?:boolean}){
 const audio=useRef<HTMLAudioElement>(null),wanted=useRef(true);
 const [url,setUrl]=useState(preview||isLocalMedia(src)?'':src),[playing,setPlaying]=useState(false);
 const [credit,setCredit]=useState<{title:string;credit:string;licenseUrl:string;sourceUrl:string}|null>(null);
 useEffect(()=>{setCredit(null);if(!src.startsWith('/api/music?'))return;const ctrl=new AbortController();fetch(src+'&info=1',{signal:ctrl.signal}).then(r=>r.ok?r.json():null).then(r=>setCredit(r?.track||null)).catch(()=>{});return()=>ctrl.abort()},[src]);
 useEffect(()=>{const controller=new AbortController();let active=true,objectUrl='';
  if(isLocalMedia(src))localMediaUrl(src).then(value=>{if(active)setUrl(value);}).catch(()=>{});
  else if(preview&&src.startsWith('/api/')&&!src.startsWith('/api/music?'))privateMedia(src,controller.signal).then(blob=>{objectUrl=URL.createObjectURL(blob);if(active)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);}).catch(()=>{});
  else setUrl(src);
  return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[src,preview]);
 useEffect(()=>{const player=audio.current;if(!player||!url)return;wanted.current=true;
  const stopWatching=watchMusic(player,()=>{wanted.current=false;});
  const start=()=>{if(wanted.current&&player.paused)void player.play().catch(()=>{});};
  const gesture=(event:Event)=>{if((event.target as Element)?.closest?.('.invitation-sound'))return;start();};
  player.addEventListener('canplay',start);document.addEventListener('pointerdown',gesture);document.addEventListener('touchend',gesture);document.addEventListener('keydown',gesture);start();
  // The isolated invitation documents share our origin; taps in them also unlock audio.
  const cleanups:(()=>void)[]=[],frames=new WeakSet<HTMLIFrameElement>();
  const observeFrames=()=>{document.querySelectorAll<HTMLIFrameElement>('iframe[data-template-version]').forEach(frame=>{if(frames.has(frame))return;frames.add(frame);const attach=()=>{try{const doc=frame.contentDocument;if(!doc)return;for(const event of ['pointerdown','touchend','keydown'])doc.addEventListener(event,gesture);cleanups.push(()=>{for(const event of ['pointerdown','touchend','keydown'])doc.removeEventListener(event,gesture)})}catch{}};frame.addEventListener('load',attach);cleanups.push(()=>frame.removeEventListener('load',attach));attach()})};
  const observer=new MutationObserver(observeFrames);observer.observe(document.body,{childList:true,subtree:true});observeFrames();
  const visibility=()=>{if(document.hidden)player.pause();else start()};document.addEventListener('visibilitychange',visibility);
  return()=>{stopWatching();observer.disconnect();cleanups.forEach(fn=>fn());document.removeEventListener('visibilitychange',visibility);player.pause();player.removeEventListener('canplay',start);document.removeEventListener('pointerdown',gesture);document.removeEventListener('touchend',gesture);document.removeEventListener('keydown',gesture);};
 },[url,preview]);
 function toggle(){const player=audio.current;if(!player)return;if(!player.paused){wanted.current=false;player.pause();}else{wanted.current=true;void player.play().catch(()=>setPlaying(false));}}
 return <><audio ref={audio} src={url||undefined} loop autoPlay preload="auto" onPlay={e=>{claimMusic(e.currentTarget);setPlaying(true)}} onPause={()=>setPlaying(false)} onError={()=>setPlaying(false)}/><button type="button" className="invitation-sound" aria-label={playing?'Mute music':'Unmute music'} aria-pressed={playing} onClick={toggle}>{playing?<Volume2 size={20} aria-hidden="true"/>:<VolumeX size={20} aria-hidden="true"/>}</button>{credit?.credit&&<details className="invitation-music-credit"><summary aria-label="Music credits">♪</summary><p>{credit.credit} {credit.sourceUrl&&<a href={credit.sourceUrl} target="_blank" rel="noreferrer">Source</a>} {credit.licenseUrl&&<a href={credit.licenseUrl} target="_blank" rel="noreferrer">Licence</a>}</p></details>}</>;
}
