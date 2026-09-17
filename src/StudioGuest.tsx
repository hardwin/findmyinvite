import {useEffect,useRef,useState} from 'react';
import './studio.css';
export default function StudioGuest({slug}:{slug:string}){
 const [html,setHtml]=useState('');
 const [error,setError]=useState('');
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  let active=true;
  fetch('/api/studio?action=public&slug='+encodeURIComponent(slug),{cache:'no-store'}).then(async res=>{
   const body=await res.json();
   if(!res.ok)throw new Error(body.error||'Invitation not found.');
   if(active)setHtml(body.html||'');
  }).catch(err=>{if(active)setError(err instanceof Error?err.message:'Invitation not found.');});
  return()=>{active=false};
 },[slug]);
 useEffect(()=>{
  const node=frame.current;
  if(!node||!html)return;
  const doc=node.contentDocument;
  if(!doc)return;
  doc.open();
  doc.write(html);
  doc.close();
 },[html]);
 if(error)return <main className="editor-shell"><h1>Invitation unavailable</h1><p>{error}</p></main>;
 if(!html)return <main className="editor-shell" role="status">Loading invitation…</main>;
 return <iframe ref={frame} className="studio-guest-frame" title="Invitation" sandbox="allow-scripts allow-downloads allow-forms allow-popups allow-same-origin"/>;
}
