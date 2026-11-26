import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {flushSync} from 'react-dom';
import {ArrowRight,LoaderCircle,Play,RotateCcw,Video} from 'lucide-react';
import PreviewSoundButton from '../PreviewSoundButton';
import CatalogSoundtrack from './CatalogSoundtrack';
import TemplateCardDetails from '../TemplateCardDetails';
import {templateDetailsPath} from '../../shared/template-sharing.mjs';
import TemplatePreviewDialog from '../TemplatePreviewDialog';
import VideoLibraryGrid from './VideoLibraryGrid';
import HorizontalStrip from '../HorizontalStrip';
import {useVideoCatalog,type VideoEntry} from './catalog';
import {useInvitationPreferences} from '../invitation-preferences';
import {recommendInvitations} from '../../shared/invitation-preferences.mjs';
import {filterVideoCatalog} from '../../shared/discovery-taxonomy.mjs';
import {previewMuted,setPreviewMuted,usePreviewMuted} from '../preview-sound';
import {trackProduct} from '../product-analytics';
type PlaybackFeedback='none'|'buffering'|'retry'|'paused';
const mobileViewport='(max-width: 640px), (max-height: 640px) and (pointer: coarse)';

export function VideoCard({entry,showDetails=true,preview=entry.preview}:{entry:VideoEntry;showDetails?:boolean;preview?:string}){
 const videoRef=useRef<HTMLVideoElement>(null),box=useRef<HTMLElement>(null);
 const [activeSrc,setActiveSrc]=useState<string|null>(null),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 const [feedback,setFeedback]=useState<PlaybackFeedback>('none');
 const progress=useRef({position:0,at:0}),playAttempt=useRef(0);
 const startupHold=useRef(false);
 const muted=usePreviewMuted(),audioRef=useRef<HTMLAudioElement>(null);
 const reportedPlayback=useRef(false);
 const attachVideo=useCallback((node:HTMLVideoElement|null)=>{
  const old=videoRef.current;videoRef.current=node;
  if(old&&old!==node){old.pause();old.removeAttribute('src');old.load();}
  if(node&&activeSrc&&node.getAttribute('src')!==activeSrc)node.src=activeSrc;
 },[activeSrc]);
 useEffect(()=>{
  const video=videoRef.current;
  if(!activeSrc||!video)return;
  // Some mobile decoders freeze without emitting waiting, or emit playing before a frame advances.
  function checkProgress(){
   if(!video||videoRef.current!==video)return;
   const now=performance.now(),position=video.currentTime;
   if(startupHold.current){
    const ahead=video.buffered.length?video.buffered.end(0)-position:0;
    if(ahead>=2.5||now-progress.current.at>=4500||(!video.buffered.length&&video.readyState===4)){
     video.playbackRate=1;startupHold.current=false;
    }
   }
   if(position!==progress.current.position)progress.current={position,at:now};
   const elapsed=now-progress.current.at;
   if(video.error)setFeedback('retry');
   else if(video.paused)setFeedback('paused');
   else if(elapsed>=8000)setFeedback('retry');
   else if(elapsed>=1000)setFeedback('buffering');
   else setFeedback('none');
  }
  const timer=window.setInterval(checkProgress,200);
  return ()=>window.clearInterval(timer);
 },[activeSrc]);
 useEffect(()=>{const stop=()=>setActiveSrc(null),hidden=()=>{if(document.hidden)stop();};const observer=new IntersectionObserver(([e])=>{const el=box.current;if(!e.isIntersecting&&el&&!el.closest('dialog[open]')){const r=el.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)stop();}});observer.observe(box.current!);window.addEventListener('catalog-stop-all',stop);document.addEventListener('visibilitychange',hidden);return()=>{observer.disconnect();window.removeEventListener('catalog-stop-all',stop);document.removeEventListener('visibilitychange',hidden);};},[]);
 useEffect(()=>{if(!muted&&videoRef.current?.volume===0)videoRef.current.volume=1;},[muted]);
 const seconds=Math.max(0,Math.round(entry.duration));
 const duration=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const useHref='/video-personalise?template='+encodeURIComponent(entry.id);
 function playbackError(){
  if(ready){setFeedback('retry');return;}
  setActiveSrc(null);setFailed(true);
 }
 function playVideo(reload=false,holdForOpening=false){
  const video=videoRef.current;if(!video)return;
  const attempt=++playAttempt.current,position=video.currentTime;
  if(reload){
   video.load();
   // Before metadata arrives, currentTime sets the default starting position for the reload.
   if(position>0)video.currentTime=position;
  }
  progress.current={position,at:performance.now()};setFeedback('none');
  startupHold.current=false;
  if(holdForOpening){
   // Unlock sound in the tap handler, but give the first few frames a buffer before the clock runs.
   try{video.playbackRate=0;startupHold.current=true;}catch{/* Devices without zero-rate playback start normally. */}
  }else if(video.playbackRate===0)video.playbackRate=1;
  video.muted=previewMuted();
  void video.play().catch((error:DOMException)=>{
   if(videoRef.current!==video||attempt!==playAttempt.current||error.name==='AbortError')return;
   if(error.name==='NotAllowedError'){setFeedback('paused');return;}
   playbackError();
  });
  audioRef.current?.dispatchEvent(new Event('fmi-audio-start'));
 }
 function startPreview(){
  if(activeSrc)return;
  // Choosing an inline catalogue preview is a selection. A shared detail page can be a direct entry.
  if(showDetails)trackProduct('template_selected',entry.id);
  reportedPlayback.current=false;
  window.dispatchEvent(new Event('catalog-stop-all'));setFailed(false);setReady(false);setFeedback('none');
  flushSync(()=>setActiveSrc(preview));
  playVideo(false,preview===entry.mobilePreview);
 }
 function playing(){
  setReady(true);
  if(!reportedPlayback.current){reportedPlayback.current=true;trackProduct('preview',entry.id);}
 }
 function toggleMusic(){
  const video=videoRef.current;if(!video)return;
  const next=!muted;video.muted=next;if(!next&&video.volume===0)video.volume=1;setPreviewMuted(next);
  const audio=audioRef.current;if(audio){if(next)audio.pause();else if(!video.paused){if(audio.error)audio.load();audio.dispatchEvent(new Event('fmi-audio-start'));}}
 }
 return <TemplatePreviewDialog name={entry.name} onExpand={startPreview}>{(expanded,expandControl)=><article className={'di-video-card'+(expanded?' di-expanded-card':'')} ref={box} style={{'--di-card-art':`url(${JSON.stringify(entry.poster)})`} as CSSProperties}>
  <div className="di-video-demo">
   <a href={templateDetailsPath(entry.id,'video')} aria-label={'Details: '+entry.name}><img src={entry.poster} srcSet={entry.posters?Object.entries(entry.posters).map(([width,url])=>url+' '+width+'w').join(','):undefined} sizes="(max-width:640px) 78vw, 25vw" width={720} height={1280} loading="lazy" decoding="async" onError={e=>{e.currentTarget.removeAttribute('srcset');if(e.currentTarget.getAttribute('src')!==entry.poster)e.currentTarget.src=entry.poster;}} alt={entry.name}/></a>
   {activeSrc&&<video ref={attachVideo} src={activeSrc} poster={entry.poster} style={{opacity:ready?1:0}} onPlaying={playing} controls={expanded} muted={muted} onVolumeChange={e=>{const next=e.currentTarget.muted||e.currentTarget.volume===0;if(next!==previewMuted())setPreviewMuted(next);}} loop playsInline preload="auto" aria-label={entry.name+' preview'} onError={e=>{if(videoRef.current===e.currentTarget)playbackError();}}/>}
   {activeSrc&&entry.music&&!entry.embeddedMusic&&<CatalogSoundtrack entry={entry} videoRef={videoRef} audioRef={audioRef}/>}
   <span className="di-pin-kind"><Video size={14} aria-hidden="true"/>Video</span>
   <span className="di-video-duration" aria-label={'Duration '+duration}>{duration}</span>
   {expandControl}
   {!activeSrc&&<button className="di-thumbnail-preview di-video-play" type="button" aria-label={(failed?'Retry preview for ':'Play preview for ')+entry.name} onClick={startPreview}>
    {failed?<RotateCcw size={24}/>:<Play size={24} fill="currentColor"/>}
   </button>}
   {activeSrc&&feedback==='buffering'&&<span className="di-thumbnail-preview di-video-play di-preview-loading" role="status" aria-label={(ready?'Buffering preview for ':'Loading preview for ')+entry.name}><LoaderCircle size={24} className="di-preview-spinner"/></span>}
   {activeSrc&&(feedback==='retry'||(feedback==='paused'&&!expanded))&&<button className="di-thumbnail-preview" type="button" onClick={()=>playVideo(feedback==='retry')} aria-label={(feedback==='retry'?'Retry preview for ':'Resume preview for ')+entry.name}>
    {feedback==='retry'?<><RotateCcw size={18}/> Retry</>:<><Play size={18}/> Resume</>}
   </button>}
   {activeSrc&&ready&&<PreviewSoundButton name={entry.name} muted={muted} onClick={toggleMusic}/>}
  </div>
  {showDetails&&<TemplateCardDetails name={entry.name} kind="video" useHref={useHref} templateCode={entry.templateCode} microDescription={entry.microDescription} detailsHref={templateDetailsPath(entry.id,'video')} amountPaise={entry.quote?.basePaise} originalPaise={entry.originalPaise} offerLabel={entry.offerLabel}/>}
  {failed&&<small className="di-card-status" role="status">Preview could not load. Try again or use this template.</small>}
 </article>}</TemplatePreviewDialog>;
}
export default function VideoCollection({limit,library=false,query='',tradition='all',setting='all',collection='all',sort='default',onClearQuery}:{limit?:number;library?:boolean;query?:string;tradition?:string;setting?:string;collection?:string;sort?:string;onClearQuery?:()=>void}){
 const {entries,loading,error,retry}=useVideoCatalog();
 const [mobileHomepage,setMobileHomepage]=useState(()=>Boolean(limit)&&window.matchMedia(mobileViewport).matches);
 useEffect(()=>{
  if(!limit)return;
  const query=window.matchMedia(mobileViewport),update=()=>setMobileHomepage(query.matches);
  update();query.addEventListener('change',update);
  return ()=>query.removeEventListener('change',update);
 },[limit]);
 const preferences=useInvitationPreferences();
 useEffect(()=>{window.dispatchEvent(new Event('catalog-stop-all'));},[query]);
 const filtered:VideoEntry[]=filterVideoCatalog(entries,{query,tradition,setting,collection,sort});
 const visible=sort==='default'?recommendInvitations(filtered,preferences):filtered;
 if(limit&&!loading&&!error&&!visible.length)return null;
 const allVideosHref='/templates?'+new URLSearchParams({kind:'video',...(query?{q:query}:{})});
 return <section className="di-video-collection" aria-label="Invitation Videos">
  {!library&&<header><h2 className="di-collection-title">Invitation Videos</h2></header>}
  {loading?<p role="status">Loading invitation videos…</p>:error?<p role="alert">The video collection could not load. <button type="button" className="di-button" onClick={()=>{void retry();}}>Retry</button></p>:<>
   {query&&onClearQuery&&<p>Results for “{query}” <button type="button" onClick={onClearQuery}>Clear search</button></p>}
   {visible.length?library?<VideoLibraryGrid key={[query,tradition,setting,collection,sort,preferences?.tradition].join('|')} entries={visible} renderCard={entry=><VideoCard key={entry.id} entry={entry}/>}/>:<>
    <HorizontalStrip className={'di-video-cards'+(limit?' di-video-featured':'')} role="region" aria-label="Invitation video templates" tabIndex={0}>
     {visible.slice(0,limit).map(e=><VideoCard key={e.id} entry={e} preview={limit&&mobileHomepage?e.mobilePreview??e.preview:e.preview}/>)}
     {limit&&<a className="di-video-view-all" href={allVideosHref}><ArrowRight size={28}/><span>View all videos</span></a>}
    </HorizontalStrip>
    {limit&&<div className="di-collection-more"><a className="di-button di-secondary" href={allVideosHref}>View More <ArrowRight size={16}/></a></div>}
   </>:<p role="status">No videos match these choices. Try another style or collection.</p>}
  </>}
 </section>;
}
