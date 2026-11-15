import {useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {ArrowRight,LoaderCircle,Play,RotateCcw,Video} from 'lucide-react';
import PreviewSoundButton from '../PreviewSoundButton';
import TemplateCardDetails from '../TemplateCardDetails';
import TemplatePreviewDialog from '../TemplatePreviewDialog';
import {useVideoCatalog,type VideoEntry} from './catalog';
import {filterVideoCatalog} from '../../shared/discovery-taxonomy.mjs';
function VideoCard({entry,expanded=false}:{entry:VideoEntry;expanded?:boolean}){
 const videoRef=useRef<HTMLVideoElement>(null),box=useRef<HTMLElement>(null),[active,setActive]=useState(false),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 const [muted,setMuted]=useState(true);
 const deadline=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{if(expanded)setActive(true);},[expanded]);
 const loadingProgress=useCallback(()=>{clearTimeout(deadline.current);deadline.current=setTimeout(()=>{setActive(false);setFailed(true);},45000);},[]);
 const attachVideo=useCallback((node:HTMLVideoElement|null)=>{const old=videoRef.current;if(old&&old!==node){old.pause();old.removeAttribute('src');old.load();}videoRef.current=node;if(node&&node.getAttribute('src')!==entry.preview)node.src=entry.preview;},[entry.preview]);
 useEffect(()=>{if(!active||ready)return;loadingProgress();return()=>clearTimeout(deadline.current);},[active,ready,loadingProgress]);
 useEffect(()=>{const stop=()=>setActive(false),hidden=()=>{if(document.hidden)stop();};const observer=new IntersectionObserver(([e])=>{if(!e.isIntersecting)stop();});observer.observe(box.current!);window.addEventListener('catalog-stop-all',stop);document.addEventListener('visibilitychange',hidden);return()=>{observer.disconnect();window.removeEventListener('catalog-stop-all',stop);document.removeEventListener('visibilitychange',hidden);};},[]);
 const seconds=Math.max(0,Math.round(entry.duration));
 const duration=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const useHref='/video-personalise?template='+encodeURIComponent(entry.id);
 function startPreview(){
  window.dispatchEvent(new Event('catalog-stop-all'));setFailed(false);setReady(false);setMuted(true);flushSync(()=>setActive(true));
  const video=videoRef.current;
  if(video){video.muted=true;void video.play().catch(()=>{if(video.isConnected){setActive(false);setFailed(true);}});}
 }
 function toggleMusic(){
  const video=videoRef.current;if(!video)return;
  const next=!muted;video.muted=next;if(!next&&video.volume===0)video.volume=1;setMuted(next);
 }
 return <article className={'di-video-card'+(expanded?' di-expanded-card':'')} ref={box}>
  <div className="di-video-demo">
   <a href={useHref} aria-label={'Use Template: '+entry.name}><img src={entry.poster} srcSet={entry.posters?Object.entries(entry.posters).map(([width,url])=>url+' '+width+'w').join(','):undefined} sizes="(max-width:640px) 78vw, 25vw" width={720} height={1280} loading="lazy" decoding="async" onError={e=>{e.currentTarget.removeAttribute('srcset');if(e.currentTarget.getAttribute('src')!==entry.poster)e.currentTarget.src=entry.poster;}} alt={entry.name}/></a>
   {active&&<video ref={attachVideo} onProgress={()=>{if(!ready)loadingProgress();}} src={entry.preview} poster={entry.poster} style={{opacity:ready?1:0}} onPlaying={()=>setReady(true)} autoPlay={expanded} controls={expanded} muted={muted} onVolumeChange={e=>setMuted(e.currentTarget.muted||e.currentTarget.volume===0)} loop playsInline preload="auto" aria-label={entry.name+' preview'} onError={()=>{setActive(false);setFailed(true);}}/>}
   <span className="di-pin-kind"><Video size={14} aria-hidden="true"/>Video</span>
   <span className="di-video-duration" aria-label={'Duration '+duration}>{duration}</span>
   {!expanded&&<TemplatePreviewDialog name={entry.name}><VideoCard entry={entry} expanded/></TemplatePreviewDialog>}
   {!active&&<button className="di-thumbnail-preview di-video-play" type="button" aria-label={(failed?'Retry preview for ':'Play preview for ')+entry.name} onClick={startPreview}>
    {failed?<RotateCcw size={24}/>:<Play size={24} fill="currentColor"/>}
   </button>}
   {active&&!ready&&<span className="di-thumbnail-preview di-video-play di-preview-loading" role="status" aria-label={'Loading preview for '+entry.name}><LoaderCircle size={24} className="di-preview-spinner"/></span>}
   {active&&ready&&<PreviewSoundButton name={entry.name} muted={muted} onClick={toggleMusic}/>}
  </div>
  <TemplateCardDetails name={entry.name} kind="video" useHref={useHref}/>
  {failed&&<small className="di-card-status" role="status">Preview could not load. Try again or use this template.</small>}
 </article>;
}
export default function VideoCollection({limit,query='',tradition='all',setting='all',collection='all',sort='default',onClearQuery}:{limit?:number;query?:string;tradition?:string;setting?:string;collection?:string;sort?:string;onClearQuery?:()=>void}){
 const {entries,loading,error,retry}=useVideoCatalog();
 useEffect(()=>{window.dispatchEvent(new Event('catalog-stop-all'));},[query]);
 const visible:VideoEntry[]=filterVideoCatalog(entries,{query,tradition,setting,collection,sort});
 if(limit&&!loading&&!error&&!visible.length)return null;
 const allVideosHref='/templates?'+new URLSearchParams({kind:'video',...(query?{q:query}:{})});
 return <section className="di-video-collection" aria-label="Invitation Videos">
  <header><h2 className="di-collection-title">Invitation Videos</h2>{!limit&&<a href="/templates?kind=website">Browse websites →</a>}</header>
  {loading?<p role="status">Loading invitation videos…</p>:error?<p role="alert">The video collection could not load. <button type="button" className="di-button" onClick={()=>{void retry();}}>Retry</button></p>:<>
   {!limit&&<p className="df-count" role="status">{visible.length} video {visible.length===1?'design':'designs'}</p>}
   {query&&onClearQuery&&<p>Results for “{query}” <button type="button" onClick={onClearQuery}>Clear search</button></p>}
   {visible.length?<>
    <div className={'di-video-cards'+(limit?' di-video-featured':'')} role="region" aria-label="Invitation video templates" tabIndex={0}>
     {visible.slice(0,limit).map(e=><VideoCard key={e.id} entry={e}/>)}
     {limit&&<a className="di-video-view-all" href={allVideosHref}><ArrowRight size={28}/><span>View all videos</span></a>}
    </div>
    {limit&&<div className="di-collection-more"><a className="di-button di-secondary" href={allVideosHref}>View More <ArrowRight size={16}/></a></div>}
   </>:<p role="status">No videos match this search. Try another design name.</p>}
  </>}
 </section>;
}
