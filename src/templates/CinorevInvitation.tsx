import {useEffect,useState} from 'react';
import {privateMedia} from './private-media';
import {isLocalMedia,localMediaUrl} from './local-media';
import {localisationConfig,localiseInvitationDocument} from './invitation-localisation';
import {resolveCinorevEvents} from '../../shared/cinorev-events.mjs';
import {startCinorev} from './cinorev-runtime';
import {previewDictionary} from '../../shared/preview-translations.mjs';
import type {Content,TemplateVersion} from './api';

export default function CinorevInvitation({version,content,preview=false,reduceMotion=false}:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){
 const [doc,setDoc]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  const ctrl=new AbortController(),urls:string[]=[];setDoc('');setError('');
  async function resolve(v:any):Promise<any>{
   if(typeof v==='string'&&isLocalMedia(v))return localMediaUrl(v);
   if(typeof v==='string'&&v.startsWith('/api/')&&preview){const url=URL.createObjectURL(await privateMedia(v,ctrl.signal));urls.push(url);return url;}
   if(Array.isArray(v))return Promise.all(v.map(resolve));
   if(v&&typeof v==='object')return Object.fromEntries(await Promise.all(Object.entries(v).map(async([k,x])=>[k,await resolve(x)])));
   return v;
  }
  (async()=>{
   const slug=version.renderer.replace(/-v1$/,'');if(!/^[a-z-]+$/.test(slug))throw Error('Invalid invitation design.');
   const response=await fetch('/assets/cinorev/'+slug+'/document.json',{signal:ctrl.signal});if(!response.ok)throw Error('Unable to load this invitation. Please try again.');
   const release=await response.json(),data=await resolve(content);if(ctrl.signal.aborted)return;
   const safe=(value:any)=>JSON.stringify(value).replaceAll('<','\\u003c');
   const config=safe({content:data,design:release.design,release:{baseline:release.baseline},preview,reduceMotion,instanceKey:'fmi:'+version.id+':'+location.pathname,guest:new URLSearchParams(location.search).get('to')||'',url:location.href});
   const language=['en','ml','ta','te','kn','hi'].includes(data.language)?data.language:'en';
   const localisation=localisationConfig(data);
   const script='const FMI=('+startCinorev.toString()+')('+config+','+resolveCinorevEvents.toString()+');\n'+release.program+'\n('+localiseInvitationDocument.toString()+')('+safe({...localisation,malayalam:true,translations:{...previewDictionary(language),...localisation.translations}})+');';
   const fonts=(release.fontStylesheets||[]).filter((href:string)=>href.startsWith('https://fonts.googleapis.com/')).map((href:string)=>'<link rel="stylesheet" href="'+href.replaceAll('&','&amp;').replaceAll('"','&quot;')+'">').join('');
   setDoc('<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/cinorev/fonts.css">'+fonts+'<link rel="stylesheet" href="/assets/cinorev/'+slug+'/design.css"><link rel="stylesheet" href="/assets/flagship/invitation-languages.css"></head><body class="locked">'+release.html+'<script>'+script.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
  })().catch(e=>{if(!ctrl.signal.aborted)setError(e.message);});
  return()=>{ctrl.abort();urls.forEach(URL.revokeObjectURL);};
 },[version.id,version.renderer,content,preview,reduceMotion]);
 if(error)return <p role="alert">{error}</p>;
 if(!doc)return <p role="status">Preparing your invitation…</p>;
 return <iframe title="Personalised invitation" data-template-version={version.id} srcDoc={doc} sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" style={{display:'block',width:'100%',height:'100svh',border:0}}/>;
}
