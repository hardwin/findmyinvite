import {useEffect,useRef,useState} from 'react';
import {shareDetails,sharePhoto,shareCardHtml,shareFont} from '../../shared/share-preview.mjs';
import {privateMedia} from './DynamicFields';
import {localMediaUrl} from './local-media';
import './share-preview.css';

export default function SharePreview({content,templateId,onArtworkChange,publishedSlug}:{content:Record<string,any>;templateId:string;onArtworkChange?:(value:boolean)=>void;publishedSlug?:string}){
 const info=shareDetails(content,templateId),ref=sharePhoto(content),frame=useRef<HTMLDivElement>(null);
 const [photo,setPhoto]=useState(''),[width,setWidth]=useState(600),[photoError,setPhotoError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));if(frame.current)observer.observe(frame.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{const controller=new AbortController();let objectUrl='',active=true;setPhoto('');setPhotoError(false);
  if(ref)(ref.startsWith('fmi-local:')?localMediaUrl(ref):privateMedia(ref,controller.signal).then(blob=>{objectUrl=URL.createObjectURL(blob);return objectUrl;})).then(url=>{if(active)setPhoto(url);}).catch(()=>{if(active)setPhotoError(true);});
  return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[ref,retry]);
 const html=shareCardHtml(info,{photo,font:new URL(shareFont(info.language),location.origin).href,art:info.style.art?new URL(info.style.art,location.origin).href:''});
 return <section className="invitation-share-preview" aria-label="Invitation share preview">
  <h4>How your invitation looks when shared</h4>
  <div className="invitation-share-card">
   <div className="invitation-share-image" ref={frame}>
    <iframe title="Your personalised invitation thumbnail" sandbox="allow-same-origin" srcDoc={html} tabIndex={-1} style={{transform:`scale(${width/1200})`}}/>
   </div>
   <div className="invitation-share-caption"><small>{info.names}</small><strong>{info.title}</strong><p>{info.description}</p></div>
  </div>
  {photoError&&<p role="status">Your photo could not load. Artwork is shown for now. <button type="button" onClick={()=>setRetry(n=>n+1)}>Retry photo</button></p>}
  {onArtworkChange&&<label className="invitation-share-choice"><input type="checkbox" checked={content._form?.shareArtwork===true} onChange={e=>onArtworkChange(e.target.checked)}/> Use artwork instead of our photograph</label>}
  <p className="invitation-share-help">This thumbnail is visible to anyone receiving your shared link. Each app controls its card layout.{publishedSlug?' Already-sent messages may keep their previous preview.':''}</p>
 </section>;
}
