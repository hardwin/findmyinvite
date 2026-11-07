import InvitationLoading from './InvitationLoading';
import {useEffect,useState} from 'react';
import documentHtml from './theeram/document.html?raw';
import {theeramData} from '../../shared/theeram-template.mjs';
import {privateMedia} from './DynamicFields';
import type {Content,TemplateVersion} from './api';

export default function TheeramInvitation({version,content,preview=false,reduceMotion=false}:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){
 const [doc,setDoc]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const ctrl=new AbortController(),urls:string[]=[];setDoc('');setError('');
  (async()=>{const c={...content};if(preview&&c.music?.startsWith('/api/')){const media=await privateMedia(c.music,ctrl.signal);if(ctrl.signal.aborted)return;c.music=URL.createObjectURL(media);urls.push(c.music);}if(ctrl.signal.aborted)return;
   const data=theeramData(c,{preview,url:location.href,guest:new URLSearchParams(location.search).get('to')||''});
   const json=(x:unknown)=>JSON.stringify(x).replaceAll('<','\\u003c');
   const boot=`window.TH_INVITE=${json(data)};window.FMI_REDUCE_MOTION=${json(reduceMotion)};window.FMI_THUMBNAIL=${json(!!c._catalogThumbnail)};window.FMI_PREVIEW=${json(preview)};window.FMI_SEARCH=${json('lang='+encodeURIComponent(c.language||'en'))};`;
   setDoc(documentHtml.replace('</head>','<link rel="stylesheet" href="/assets/theeram/fonts.css"></head>').replace('</body>',()=>`<script>${boot}</script><script type="module">import('/assets/theeram/app.js').catch(e=>{console.error('Theeram startup',e);document.querySelector('#tapl').textContent='Unable to load the journey. Please reload.';});</script></body>`));
  })().catch(e=>{if(!ctrl.signal.aborted)setError(e.message);});return()=>{ctrl.abort();urls.forEach(URL.revokeObjectURL);};
 },[content,version.id,preview,reduceMotion]);
 if(error)return <p role="alert">{error}</p>;if(!doc)return <InvitationLoading/>;
 return <iframe title="Theeram backwater invitation" data-template-version={version.id} srcDoc={doc} sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads" style={{display:'block',width:'100%',height:'100svh',border:0}}/>;
}
