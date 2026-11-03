import {useEffect,useRef,useState} from 'react';
import {previewHref} from './preview-language';
import {LANGUAGE_LABELS} from '../../shared/invitation-languages.mjs';

export default function CatalogThumbnail({version,language,name}:{version:string;language:string;name:string}){
 const ref=useRef<HTMLDivElement>(null),[width,setWidth]=useState(400);
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(el);return()=>observer.disconnect();},[]);
 return <div ref={ref} className="di-live-thumbnail"><iframe key={language} title={name+' · '+LANGUAGE_LABELS[language]} src={previewHref(version,language,true)} loading="lazy" tabIndex={-1} aria-hidden="true" style={{transform:`scale(${width/400})`}}/></div>;
}
