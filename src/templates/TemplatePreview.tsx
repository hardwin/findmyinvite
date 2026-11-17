import InvitationLoading from './InvitationLoading';
import {trackProduct} from '../product-analytics';
import {useState,useEffect,useMemo} from 'react';
import {previewLanguage} from './preview-language';
import {previewContent} from '../../shared/preview-profiles.mjs';
import {previewDictionary} from '../../shared/preview-translations.mjs';
import type {TemplateVersion} from './api';
import {requestPreviewVersion} from './preview-request.mjs';
import {previewReadiness} from './preview-readiness.mjs';
import FlagshipRenderer from './FlagshipRenderer';
import {CINOREV_RENDERERS} from '../../shared/cinorev-renderers.mjs';
const DIGITAL_YES_RENDERERS=['embroidered-garden-v1','mother-of-pearl-v1','fresco-v1','stained-glass-v1','royal-v1',...CINOREV_RENDERERS];
export function TemplatePreview(){
 const [version,setVersion]=useState<TemplateVersion|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);requestPreviewVersion(new URLSearchParams(location.search).get('version')||'',{signal:controller.signal}).then(v=>{if(active){setVersion(v);if(new URLSearchParams(location.search).get('thumbnail')!=='1')trackProduct('preview',v.template_id,previewLanguage());}}).catch(()=>{if(active)setError('The preview could not load. Please try again.');}).finally(()=>clearTimeout(timer));return()=>{active=false;clearTimeout(timer);controller.abort();};},[]);
 const language=previewLanguage(),thumbnail=new URLSearchParams(location.search).get('thumbnail')==='1',embedded=new URLSearchParams(location.search).get('embedded')==='1';
 const content=useMemo(()=>version?{...previewContent(version,language),_catalogThumbnail:thumbnail}:{},[version,language,thumbnail]);
 const copy=previewDictionary(language),back='/templates?lang='+language;
 useEffect(()=>{
  if(!embedded)return;
  const id=new URLSearchParams(location.search).get('previewVersion')||version?.id;
  const notify=()=>{
   const state=error?'error':version?previewReadiness(document.querySelector('[data-preview-slot]'),version.renderer):'loading';
   if(state==='loading')return;
   window.parent.postMessage({type:state==='ready'?'fmi-preview-ready':'fmi-preview-error',version:id},location.origin);
   clearInterval(timer);
  };
  const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='fmi-preview-status')notify();};
  const timer=setInterval(notify,100);window.addEventListener('message',receive);notify();
  return()=>{clearInterval(timer);window.removeEventListener('message',receive);};
 },[version,error,embedded]);
 if(!version)return error?<main className="tc-shell" role="alert"><h1>Preview unavailable</h1><p>{error}</p><a href={back}>Return to library</a></main>:<InvitationLoading/>;
 if(thumbnail)return <><style>{'html,body{overflow:hidden!important;scrollbar-width:none}'}</style><div data-preview-slot><FlagshipRenderer version={version} content={content} musicControls={!embedded} preview reduceMotion/></div></>;
 if(['thiruvarul-v1','kalyana-payanam-v1','theeram-v1','kerala-kasavu-v2','nikah-arches-v2',...DIGITAL_YES_RENDERERS].includes(version.renderer))return <><div data-preview-slot><FlagshipRenderer version={version} content={content} musicControls={!embedded} preview/></div><a href={back} style={{position:'fixed',right:16,...(['theeram-v1','thiruvarul-v1','kalyana-payanam-v1'].includes(version.renderer)?{top:4,padding:'6px 10px',font:'11px system-ui'}:{bottom:74,padding:'10px 16px',font:'13px system-ui'}),zIndex:110,background:'#fff',borderRadius:24,color:'#282529'}}>{!embedded&&version.templateCode&&<>{version.templateCode} · </>}{copy['return to library']||'Return to library'}</a></>;
 const note=<div className="tc-preview-note"><span>{copy['template preview']||'Template preview'}{!embedded&&version.templateCode&&<> · {version.templateCode}</>}</span> <a href={back}>{copy['return to library']||'Return to library'}</a></div>;
 const immersive=['christian-editorial-v2','christian-editorial-v3','ivory-lace-v1'].includes(version.renderer);
 return <>{!immersive&&note}<div data-preview-slot><FlagshipRenderer version={version} content={content} musicControls={!embedded} preview/></div>{immersive&&note}</>;
}
