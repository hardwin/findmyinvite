import {useEffect,useRef,useState} from 'react';
import {videoRequest} from './request';
import './video-delivery.css';

const api='/api/video-personalise?action=';
const inInstagram=()=>/Instagram/i.test(navigator.userAgent);
export function CopyVideoLink({url}:{url:string}){
 const field=useRef<HTMLInputElement>(null),[message,setMessage]=useState('');
 async function copy(){
  try{await navigator.clipboard.writeText(url);setMessage('Link copied');}
  catch{field.current?.focus();field.current?.select();field.current?.setSelectionRange(0,url.length);setMessage('Press and hold the selected link to copy it.');}
 }
 return <div className="vd-copy"><label>Download link<input ref={field} readOnly value={url} onFocus={e=>e.target.select()}/></label><button type="button" onClick={copy}>Copy download link</button><small role="status">{message}</small></div>;
}
function FileButton({token}:{token:string}){
 return <form method="post" action={api+'delivery-file'}><input type="hidden" name="token" value={token}/><button className="vd-primary" type="submit">Download HD MP4</button></form>;
}
function DownloadOptions({url}:{url:string}){
 const instagram=inInstagram();
 return <div className="vd-options">{instagram?<><strong>Open your video in Safari or Chrome</strong><p>Your video is ready. Instagram’s browser can’t save this MP4 here. Copy the link below, paste it into Safari or Chrome, then tap <b>Download HD MP4</b> to save it in full quality.</p></>:<FileButton token={new URL(url).hash.slice(1)}/>}<CopyVideoLink url={url}/></div>;
}
export function VideoDelivery({jobId,orderId}:{jobId:string;orderId?:string}){
 const [href,setHref]=useState(''),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setHref('');setError('');
  const request=orderId?fetch(api+'delivery-link&id='+encodeURIComponent(jobId),{headers:{'X-FMI-Assist':orderId},cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Could not get your link.');return d;}):videoRequest<{path:string}>(api+'delivery-link&id='+encodeURIComponent(jobId));
  request.then(d=>{if(active)setHref(new URL(d.path,location.origin).href);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};
 },[jobId,orderId,retry]);
 if(error)return <div role="alert">{error} <button type="button" onClick={()=>setRetry(n=>n+1)}>Retry download link</button></div>;
 return href?<DownloadOptions url={href}/>:<span role="status">Preparing download link…</span>;
}
export default function VideoDownloadPage(){
 const [state,setState]=useState('loading'),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setState('loading');document.title='Download your invitation | FindMyInvite';
  const check=async()=>{const token=location.hash.slice(1);if(!token)return 'gone';const r=await fetch(api+'delivery-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token}),cache:'no-store'});return r.ok?'ready':r.status===410?'gone':'error';};
  check().then(s=>{if(active)setState(s);}).catch(()=>{if(active)setState('error');});return()=>{active=false;};
 },[retry]);
 return <main className="vd-page"><section><h1>{state==='gone'?'This video is no longer available':'Download your invitation'}</h1>{state==='ready'?<DownloadOptions url={location.href}/>:state==='gone'?<p>Open <a href="/dashboard">My Invitations</a> to create your video again.</p>:state==='error'?<p>We couldn’t check your video. <button onClick={()=>setRetry(n=>n+1)}>Try again</button></p>:<p role="status">Checking your video…</p>}</section></main>;
}
