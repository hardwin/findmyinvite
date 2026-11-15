import InvitationLoading from './InvitationLoading';
import {Play,RotateCcw} from 'lucide-react';
import PreviewSoundButton from '../PreviewSoundButton';
import posters from '../catalog-posters.json';
import {useEffect,useRef,useState} from 'react';
import {previewHref} from './preview-language';
let stopCurrent:(()=>void)|undefined;
export default function CatalogThumbnail({version,language,name,poster,autoPlay=false}:{version:string;language:string;name:string;poster:string;autoPlay?:boolean}){
 const ref=useRef<HTMLDivElement>(null),frame=useRef<HTMLIFrameElement>(null),[active,setActive]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[width,setWidth]=useState(400);
 const [muted,setMuted]=useState(false);
 useEffect(()=>{const el=ref.current!;const size=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));size.observe(el);const visible=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)setActive(false);});visible.observe(el);const hidden=()=>{if(document.hidden)setActive(false);};document.addEventListener('visibilitychange',hidden);window.addEventListener('catalog-stop-all',hiddenStop);function hiddenStop(){setActive(false);}return()=>{size.disconnect();visible.disconnect();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('catalog-stop-all',hiddenStop);};},[]);
 useEffect(()=>setActive(autoPlay),[language,version,autoPlay]);
 useEffect(()=>{if(!active)return;setReady(false);setFailed(false);const stop=()=>setActive(false);stopCurrent=stop;const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===frame.current?.contentWindow&&event.data?.type==='fmi-preview-ready'&&event.data.version===version){setReady(true);clearTimeout(timer);}};const timer=setTimeout(()=>{setFailed(true);setActive(false);},15000);window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive);if(stopCurrent===stop)stopCurrent=undefined;};},[active,version]);
 const variants=(posters as Record<string,Record<string,string>>)[poster];
 function toggleMusic(){
  const player=frame.current?.contentDocument?.querySelector<HTMLAudioElement>('audio[data-invitation-music]');
  const next=!muted;
  if(player){player.muted=next;if(!next)void player.play().catch(()=>{});}
  setMuted(next);
 }
 return <div ref={ref} className="di-preview-card">
  <div className="di-live-thumbnail" style={{pointerEvents:'auto'}}>
   <img src={poster} srcSet={variants?Object.entries(variants).map(([w,url])=>url+' '+w+'w').join(','):undefined} sizes="(max-width:600px) 46vw, (max-width:1000px) 30vw, 400px" onError={event=>{event.currentTarget.removeAttribute('srcset');event.currentTarget.src=poster;}} alt={name} loading="lazy" decoding="async" width={400} height={560} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
   {active&&<iframe allow="autoplay" ref={frame} title={name+' preview'} src={previewHref(version,language)+'&embedded=1&previewVersion='+encodeURIComponent(version)} style={{transform:`scale(${width/400})`,pointerEvents:ready?'auto':'none',opacity:ready?1:0}}/>}
   {active&&!ready&&<InvitationLoading contained/>}
   {!active&&<button className="di-thumbnail-preview" type="button" aria-label={(failed?'Retry preview for ':'Preview ')+name} onClick={()=>{stopCurrent?.();window.dispatchEvent(new Event('catalog-stop-all'));setMuted(false);setActive(true);}}>
    {failed?<RotateCcw size={16}/>:<Play size={16} fill="currentColor"/>}<span>{failed?'Retry':'Preview'}</span>
   </button>}
   {active&&ready&&<PreviewSoundButton name={name} muted={muted} onClick={toggleMusic}/>}
  </div>
  {failed&&<small role="status">Preview took too long. Try Preview again, or use this template.</small>}
 </div>;
}
