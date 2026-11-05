import {useState,useEffect,useMemo,Suspense} from 'react';
import {previewLanguage} from './preview-language';
import {previewContent} from '../../shared/preview-profiles.mjs';
import {previewDictionary} from '../../shared/preview-translations.mjs';
import {loadTemplateVersion,type TemplateVersion} from './api';
import FlagshipRenderer from './FlagshipRenderer';
const DIGITAL_YES_RENDERERS=['embroidered-garden-v1','mother-of-pearl-v1','fresco-v1','stained-glass-v1','royal-v1'];
export function TemplatePreview(){
 const [version,setVersion]=useState<TemplateVersion|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;loadTemplateVersion(new URLSearchParams(location.search).get('version')||'').then(v=>{if(active)setVersion(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 const language=previewLanguage(),thumbnail=new URLSearchParams(location.search).get('thumbnail')==='1';
 const content=useMemo(()=>version?{...previewContent(version,language),_catalogThumbnail:thumbnail}:{},[version,language,thumbnail]);
 const copy=previewDictionary(language),back='/templates?lang='+language;
 useEffect(()=>{if(!version||new URLSearchParams(location.search).get('embedded')!=='1')return;const timer=setInterval(()=>{const slot=document.querySelector('[data-preview-slot]');if(!slot)return;const iframe=slot.querySelector('iframe');const doc=iframe?.contentDocument;if(iframe&&(!doc||doc.readyState!=='complete'))return;const root=doc||slot;const doors=root.querySelector('#doors');if(doors&&!doors.classList.contains('ready'))return;if(!root.querySelector('button,img,canvas,video'))return;window.parent.postMessage({type:'fmi-preview-ready',version:new URLSearchParams(location.search).get('previewVersion')||version.id},location.origin);clearInterval(timer);},200);return()=>clearInterval(timer);},[version]);
 if(!version)return <p role="status">{error||'Loading preview…'}</p>;
 if(thumbnail)return <><style>{'html,body{overflow:hidden!important;scrollbar-width:none}'}</style><FlagshipRenderer version={version} content={content} preview reduceMotion/></>;
 if(['thiruvarul-v1','kalyana-payanam-v1','theeram-v1','kerala-kasavu-v2','nikah-arches-v2',...DIGITAL_YES_RENDERERS].includes(version.renderer))return <><div data-preview-slot><FlagshipRenderer version={version} content={content} preview/></div><a href={back} style={{position:'fixed',right:16,...(['theeram-v1','thiruvarul-v1','kalyana-payanam-v1'].includes(version.renderer)?{top:4,padding:'6px 10px',font:'11px system-ui'}:{bottom:16,padding:'10px 16px',font:'13px system-ui'}),zIndex:110,background:'#fff',borderRadius:24,color:'#282529'}}>{copy['return to library']||'Return to library'}</a></>;
 const note=<div className="tc-preview-note">{copy['template preview']||'Template preview'} <a href={back}>{copy['return to library']||'Return to library'}</a></div>;
 const immersive=['christian-editorial-v2','ivory-lace-v1'].includes(version.renderer);
 return <>{!immersive&&note}<div data-preview-slot><FlagshipRenderer version={version} content={content} preview/></div>{immersive&&note}</>;
}
