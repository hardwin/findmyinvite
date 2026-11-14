import InvitationLoading from './InvitationLoading';
import {appendInvitationScript} from '../../shared/invitation-document.mjs';
import {localisationConfig,localiseInvitationDocument} from './invitation-localisation';
import {useEffect,useState} from 'react';
import hindu from './reference-releases/hindu.json';
import muslim from './reference-releases/muslim.json';
import {bindReference} from './reference-adapter';
import {privateMedia} from './DynamicFields';
import type {Content,TemplateVersion} from './api';

// These documents are audited application releases, never HTML supplied by a customer or CMS.
// Keeping their scroll viewport and CSS isolated prevents storefront styles changing the design.
export default function ReferenceInvitation({version,content,preview=false,reduceMotion=false}:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){
 const [doc,setDoc]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const ctrl=new AbortController(),urls:string[]=[];setDoc('');setError('');
  async function resolve(value:any):Promise<any>{if(typeof value==='string'&&value.startsWith('/api/')&&preview){const url=URL.createObjectURL(await privateMedia(value,ctrl.signal));urls.push(url);return url;}if(Array.isArray(value))return Promise.all(value.map(resolve));if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await resolve(v)])));return value;}
  (async()=>{const data=await resolve(content);if(ctrl.signal.aborted)return;const theme=version.renderer==='kerala-kasavu-v2'?'hindu':'muslim',release=theme==='hindu'?hindu:muslim;
   const search=new URLSearchParams(location.search);
   const config=JSON.stringify({content:data,theme,preview,reduceMotion,localisation:localisationConfig(data),search:search.toString(),url:location.href}).replaceAll('<','\\u003c');
   const hidePreviewGuest=preview&&!search.get('to')?'document.querySelectorAll("#dear,#g-dear").forEach(el=>{el.style.visibility="hidden";el.setAttribute("aria-hidden","true");});':'';
   const code='const FMI='+config+';'+hidePreviewGuest+'('+bindReference.toString()+')(FMI);\n'+release.script+';('+localiseInvitationDocument.toString()+')(FMI.localisation);';
   setDoc(appendInvitationScript(release.html.replace('</head>','<link rel="stylesheet" href="/assets/flagship/invitation-languages.css"><style>.parents b,.where{white-space:pre-line}img,video{max-width:100%}html[lang=ml] .names,html[lang=ml] .pair,html[lang=ml] h1,html[lang=ml] h2{font-family:"Noto Serif Malayalam",serif;line-height:1.6;overflow-wrap:anywhere}</style></head>'),code));
  })().catch(err=>{if(!ctrl.signal.aborted)setError(err.message||'Unable to load invitation media.');});return()=>{ctrl.abort();urls.forEach(URL.revokeObjectURL);};
 },[version.id,version.renderer,content,preview,reduceMotion]);
 if(error)return <p role="alert">{error}</p>;if(!doc)return <InvitationLoading/>;
 return <iframe title={content.groom+' & '+content.bride+' invitation'} data-template-version={version.id} srcDoc={doc} sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" style={{display:'block',width:'100%',height:'100svh',border:0}}/>;
}
