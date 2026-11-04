import {useEffect,useState} from 'react';
import FlagshipRenderer from './FlagshipRenderer';
import {mapLocalMedia,localMediaUrl} from './local-media';
import type {Content,TemplateVersion} from './api';
export default function LocalPreview({version,content}:{version:TemplateVersion;content:Content}){
 const [resolved,setResolved]=useState<Content|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;mapLocalMedia(content,localMediaUrl).then(c=>{if(active)setResolved(c);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[content]);
 return error?<p role="alert">{error}</p>:resolved?<FlagshipRenderer version={version} content={resolved} preview/>:<p role="status">Preparing your photos…</p>;
}
