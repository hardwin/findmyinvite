import InvitationLoading from './InvitationLoading';
import {Play,RotateCcw} from 'lucide-react';
import PreviewSoundButton from '../PreviewSoundButton';
import posters from '../catalog-posters.json';
import {useEffect,useImperativeHandle,useRef,useState,type Ref} from 'react';
import {previewHref} from './preview-language';
import {setPreviewMuted,usePreviewMuted} from '../preview-sound';
export type CatalogPreviewHandle={start:()=>void};
export default function CatalogThumbnail({version,language,name,poster,controller}:{version:string;language:string;name:string;poster:string;controller?:Ref<CatalogPreviewHandle>}){
 const ref=useRef<HTMLDivElement>(null),frame=useRef<HTMLIFrameElement>(null),started=useRef(0),[active,setActive]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[width,setWidth]=useState(400);
 const muted=usePreviewMuted();
 useImperativeHandle(controller,()=>({start}));
 useEffect(()=>{const el=ref.current!;const size=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));size.observe(el);const visible=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting&&!el.closest('dialog[open]')){const r=el.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)setActive(false);}});visible.observe(el);const hidden=()=>{if(document.hidden)setActive(false);};document.addEventListener('visibilitychange',hidden);window.addEventListener('catalog-stop-all',hiddenStop);function hiddenStop(){setActive(false);}return()=>{size.disconnect();visible.disconnect();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('catalog-stop-all',hiddenStop);};},[]);
 useEffect(()=>setActive(false),[language,version]);
 // Retry is still bounded for genuinely unavailable designs; API errors arrive
 // immediately and a ready document can repeat its handshake after iframe load.
 useEffect(()=>{if(!active)return;setReady(false);setFailed(false);let settled=false;const receive=(event:MessageEvent)=>{
  if(settled||event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.version!==version)return;
  if(event.data.type==='fmi-preview-ready'){settled=true;if(ref.current)ref.current.dataset.previewStartupMs=String(Math.round(performance.now()-started.current));setReady(true);clearTimeout(timer);}
  else if(event.data.type==='fmi-preview-error'){settled=true;clearTimeout(timer);setFailed(true);setActive(false);}
 };const timer=setTimeout(()=>{setFailed(true);setActive(false);},45000);window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive);};},[active,version]);
 const variants=(posters as Record<string,Record<string,string>>)[poster];
 function start(){if(active)return;started.current=performance.now();if(ref.current)delete ref.current.dataset.previewStartupMs;window.dispatchEvent(new Event('catalog-stop-all'));setReady(false);setFailed(false);setActive(true);}
 function toggleMusic(){
  const player=frame.current?.contentDocument?.querySelector<HTMLAudioElement>('audio[data-invitation-music]');
  const next=!muted;
  if(player){player.muted=next;if(!next)void player.play().catch(()=>{});}
  setPreviewMuted(next);
 }
 return <div ref={ref} className="di-preview-card">
  <div className="di-live-thumbnail" style={{pointerEvents:'auto'}}>
   <img src={poster} srcSet={variants?Object.entries(variants).map(([w,url])=>url+' '+w+'w').join(','):undefined} sizes="(max-width:600px) 46vw, (max-width:1000px) 30vw, 400px" onError={event=>{event.currentTarget.removeAttribute('srcset');event.currentTarget.src=poster;}} alt={name} loading="lazy" decoding="async" width={400} height={560} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
   {active&&<iframe allow="autoplay" ref={frame} title={name+' preview'} onLoad={()=>frame.current?.contentWindow?.postMessage({type:'fmi-preview-status'},location.origin)} src={previewHref(version,language)+'&embedded=1&previewVersion='+encodeURIComponent(version)} style={{transform:`scale(${width/400})`,pointerEvents:ready?'auto':'none',opacity:ready?1:0}}/>}
   {active&&!ready&&<InvitationLoading contained/>}
   {!active&&<button className="di-thumbnail-preview" type="button" aria-label={(failed?'Retry preview for ':'Preview ')+name} onClick={start}>
    {failed?<RotateCcw size={16}/>:<Play size={16} fill="currentColor"/>}<span>{failed?'Retry':'Preview'}</span>
   </button>}
   {active&&ready&&<PreviewSoundButton name={name} muted={muted} onClick={toggleMusic}/>}
  </div>
  {failed&&<small role="status">The preview could not load. Please try Preview again.</small>}
 </div>;
}
