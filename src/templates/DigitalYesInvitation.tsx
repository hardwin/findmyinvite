import {useEffect,useState} from 'react';
import {privateMedia} from './DynamicFields';
import {startDigitalYes} from './digital-yes-runtime';
import {startDigitalYesForms} from './digital-yes-forms';
import {resolveDigitalYesEvents} from '../../shared/digital-yes-events.mjs';
import type {Content,TemplateVersion} from './api';
export const DIGITAL_YES_RENDERERS=['embroidered-garden-v1','mother-of-pearl-v1','fresco-v1','stained-glass-v1','royal-v1'];
export default function DigitalYesInvitation({version,content,preview=false,reduceMotion=false}:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){
 const [doc,setDoc]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const ctrl=new AbortController(),urls:string[]=[];setDoc('');setError('');
  const slug=DIGITAL_YES_RENDERERS.includes(version.renderer)?version.renderer.replace(/-v1$/,''):null;
  async function resolve(v:any):Promise<any>{if(typeof v==='string'&&v.startsWith('/api/')&&preview){const url=URL.createObjectURL(await privateMedia(v,ctrl.signal));urls.push(url);return url;}if(Array.isArray(v))return Promise.all(v.map(resolve));if(v&&typeof v==='object')return Object.fromEntries(await Promise.all(Object.entries(v).map(async([k,x])=>[k,await resolve(x)])));return v;}
  (async()=>{if(!slug)throw Error('Unknown invitation renderer.');const response=await fetch('/assets/flagship/'+slug+'/document.json',{signal:ctrl.signal});if(!response.ok)throw Error('Unable to load invitation design.');const release=await response.json();const data=await resolve(content);if(ctrl.signal.aborted)return;const config=JSON.stringify({release,content:data,preview,reduceMotion}).replaceAll('<','\\u003c');
   const script='('+startDigitalYes.toString()+')('+config+','+resolveDigitalYesEvents.toString()+','+startDigitalYesForms.toString()+');';
   setDoc('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/flagship/'+slug+'/design.css"><link rel="stylesheet" href="/assets/flagship/digital-yes-runtime.css"></head><body><div id="fmi-page">'+release.html+'</div><script>'+script.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
  })().catch(e=>{if(!ctrl.signal.aborted)setError(e.message);});return()=>{ctrl.abort();urls.forEach(URL.revokeObjectURL);};
 },[version.id,version.renderer,content,preview,reduceMotion]);
 if(error)return <p role="alert">{error}</p>;if(!doc)return <p role="status">Preparing your invitation…</p>;
 return <iframe title={content.bride+' & '+content.groom+' invitation'} data-template-version={version.id} srcDoc={doc} sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" style={{display:'block',width:'100%',height:'100svh',border:0}}/>;
}
