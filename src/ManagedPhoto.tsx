import {useEffect,useState} from 'react';
import {guestKeys} from './guest-api';
export default function ManagedPhoto({src,alt}:{src:string;alt:string}){
 const [preview,setPreview]=useState(src.startsWith('/api/media?')?'':src);
 useEffect(()=>{if(!src.startsWith('/api/media?')){setPreview(src);return;}
  const slug=new URL(src,location.origin).searchParams.get('slug');const key=guestKeys().find(x=>x.slug===slug);const controller=new AbortController();let objectUrl='';
  fetch(src,{headers:key?{Authorization:`Bearer ${key.token}`}:{},signal:controller.signal}).then(r=>{if(!r.ok)throw new Error();return r.blob()}).then(blob=>{objectUrl=URL.createObjectURL(blob);setPreview(objectUrl)}).catch(()=>setPreview(''));
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[src]);return preview?<img src={preview} alt={alt}/>:<span>{alt} · preview unavailable</span>;
}
