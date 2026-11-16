import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {flushSync} from 'react-dom';
import {ArrowRight,LoaderCircle,Play,RotateCcw,Video} from 'lucide-react';
import PreviewSoundButton from '../PreviewSoundButton';
import CatalogSoundtrack from './CatalogSoundtrack';
import TemplateCardDetails from '../TemplateCardDetails';
import TemplatePreviewDialog from '../TemplatePreviewDialog';
import {useVideoCatalog,type VideoEntry} from './catalog';
import {filterVideoCatalog} from '../../shared/discovery-taxonomy.mjs';
import {previewMuted,setPreviewMuted,usePreviewMuted} from '../preview-sound';
function VideoCard({entry}:{entry:VideoEntry}){
 const videoRef=useRef<HTMLVideoElement>(null),box=useRef<HTMLElement>(null),[active,setActive]=useState(false),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 const muted=usePreviewMuted(),audioRef=useRef<HTMLAudioElement>(null);
 const deadline=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const loadingProgress=useCallback(()=>{clearTimeout(deadline.current);deadline.current=setTimeout(()=>{setActive(false);setFailed(true);},45000);},[]);
 const attachVideo=useCallback((node:HTMLVideoElement|null)=>{const old=videoRef.current;if(old&&old!==node){old.pause();old.removeAttribute('src');old.load();}videoRef.current=node;if(node&&node.getAttribute('src')!==entry.preview)node.src=entry.preview;},[entry.preview]);
 useEffect(()=>{if(!active||ready)return;loadingProgress();return()=>clearTimeout(deadline.current);},[active,ready,loadingProgress]);
 useEffect(()=>{const stop=()=>setActive(false),hidden=()=>{if(document.hidden)stop();};const observer=new IntersectionObserver(([e])=>{const el=box.current;if(!e.isIntersecting&&el&&!el.closest('dialog[open]')){const r=el.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)stop();}});observer.observe(box.current!);window.addEventListener('catalog-stop-all',stop);document.addEventListener('visibilitychange',hidden);return()=>{observer.disconnect();window.removeEventListener('catalog-stop-all',stop);document.removeEventListener('visibilitychange',hidden);};},[]);
 useEffect(()=>{if(!muted&&videoRef.current?.volume===0)videoRef.current.volume=1;},[muted]);
 const seconds=Math.max(0,Math.round(entry.duration));
 const duration=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 const useHref='/video-personalise?template='+encodeURIComponent(entry.id);
 function startPreview(){
  if(active)return;
  window.dispatchEvent(new Event('catalog-stop-all'));setFailed(false);setReady(false);flushSync(()=>setActive(true));
  const video=videoRef.current;
  if(video){video.muted=previewMuted();void video.play().catch(()=>{if(video.isConnected){setActive(false);setFailed(true);}});}
  const audio=audioRef.current;if(audio&&!previewMuted())void audio.play().catch(e=>{if(audio.isConnected&&e.name!=='AbortError')setPreviewMuted(true);});
 }
 function toggleMusic(){
  const video=videoRef.current;if(!video)return;
  const next=!muted;video.muted=next;if(!next&&video.volume===0)video.volume=1;setPreviewMuted(next);
  const audio=audioRef.current;if(audio){if(next)audio.pause();else if(!video.paused){if(audio.error)audio.load();void audio.play().catch(e=>{if(audio.isConnected&&e.name!=='AbortError')setPreviewMuted(true);});}}
 }
 return <TemplatePreviewDialog name={entry.name} onExpand={startPreview}>{(expanded,expandControl)=><article className={'di-video-card'+(expanded?' di-expanded-card':'')} ref={box} style={{'--di-card-art':`url(${JSON.stringify(entry.poster)})`} as CSSProperties}>
  <div className="di-video-demo">
   <a href={useHref} aria-label={'Use Template: '+entry.name}><img src={entry.poster} srcSet={entry.posters?Object.entries(entry.posters).map(([width,url])=>url+' '+width+'w').join(','):undefined} sizes="(max-width:640px) 78vw, 25vw" width={720} height={1280} loading="lazy" decoding="async" onError={e=>{e.currentTarget.removeAttribute('srcset');if(e.currentTarget.getAttribute('src')!==entry.poster)e.currentTarget.src=entry.poster;}} alt={entry.name}/></a>
   {active&&<video ref={attachVideo} onProgress={()=>{if(!ready)loadingProgress();}} src={entry.preview} poster={entry.poster} style={{opacity:ready?1:0}} onPlaying={()=>setReady(true)} autoPlay controls={expanded} muted={muted} onVolumeChange={e=>{const next=e.currentTarget.muted||e.currentTarget.volume===0;if(next!==previewMuted())setPreviewMuted(next);}} loop playsInline preload="auto" aria-label={entry.name+' preview'} onError={()=>{setActive(false);setFailed(true);}}/>}
   {active&&entry.music&&<CatalogSoundtrack entry={entry} videoRef={videoRef} audioRef={audioRef}/>}
   <span className="di-pin-kind"><Video size={14} aria-hidden="true"/>Video</span>
   <span className="di-video-duration" aria-label={'Duration '+duration}>{duration}</span>
   {expandControl}
   {!active&&<button className="di-thumbnail-preview di-video-play" type="button" aria-label={(failed?'Retry preview for ':'Play preview for ')+entry.name} onClick={startPreview}>
    {failed?<RotateCcw size={24}/>:<Play size={24} fill="currentColor"/>}
   </button>}
   {active&&!ready&&<span className="di-thumbnail-preview di-video-play di-preview-loading" role="status" aria-label={'Loading preview for '+entry.name}><LoaderCircle size={24} className="di-preview-spinner"/></span>}
   {active&&ready&&<PreviewSoundButton name={entry.name} muted={muted} onClick={toggleMusic}/>}
  </div>
  <TemplateCardDetails name={entry.name} kind="video" useHref={useHref} templateCode={entry.templateCode} microDescription={entry.microDescription} amountPaise={entry.quote?.basePaise}/>
  {failed&&<small className="di-card-status" role="status">Preview could not load. Try again or use this template.</small>}
 </article>}</TemplatePreviewDialog>;
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
