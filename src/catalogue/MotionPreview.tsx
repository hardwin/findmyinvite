import {useEffect,useRef,useState} from 'react';
import type {CataloguePlayback,PreviewMedia} from './playback';
export default function MotionPreview({media,poster,name,controller}:{media?:PreviewMedia;poster:string;name:string;controller:CataloguePlayback|null}){
 const node=useRef<HTMLDivElement>(null),retry=useRef<()=>void>(()=>{});
 const [state,setState]=useState<'poster'|'playing'|'error'>('poster');
 useEffect(()=>{if(!media||!controller||!node.current)return;const entry=controller.register(node.current,media,setState);retry.current=entry.retry;return entry.dispose;},[media,controller]);
 return <div ref={node} className={'catalogue-media '+(state==='playing'?'is-playing':'')} data-preview-state={state}>
  {poster&&<img src={poster} loading="lazy" decoding="async" alt="" className="catalogue-poster"/>}
  {state==='error'&&<button className="catalogue-retry" aria-label={'Play preview of '+name} onClick={e=>{e.preventDefault();e.stopPropagation();retry.current();}}>▶ Play preview</button>}
 </div>;
}
