import {useEffect,useRef} from 'react';
import Invitation from '../Invitation';
import type {InviteData} from '../Invitation';
type Selection={key:string;value:string;section?:string};
export default function NativePreview({data,section,editable,onEdit}:{data:InviteData;section:string;editable:boolean;onEdit:(s:Selection)=>void}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{root.current?.querySelectorAll<HTMLElement>('[data-field],[data-editor-text],[data-edit-event]').forEach(el=>{el.classList.toggle('ne-editable',editable);if(editable){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Edit '+(el.dataset.field||el.textContent?.slice(0,60)))}else{el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label')}})},[data,editable]);
 useEffect(()=>{if(section==='hero'){root.current?.scrollTo({top:0,behavior:'smooth'});return;}root.current?.querySelector('[data-section="'+section+'"]')?.scrollIntoView({block:'start',behavior:'smooth'})},[section]);
 function select(target:EventTarget|null){if(!editable||!(target instanceof Element))return false;const el=target.closest<HTMLElement>('[data-field],[data-editor-text],[data-edit-event]');if(!el)return false;onEdit({key:el.dataset.field?'field:'+el.dataset.field:el.dataset.editEvent?'event:'+el.dataset.editEvent:el.dataset.editorText!,value:el.textContent||'',section:el.closest<HTMLElement>('[data-section]')?.dataset.section});return true;}
 return <div className="te-native" ref={root} onClickCapture={e=>{if(select(e.target)){e.preventDefault();e.stopPropagation()}}} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&select(e.target)){e.preventDefault();e.stopPropagation()}}}>{editable&&<div className="te-native-date"><button onClick={()=>onEdit({key:'field:date',value:data.date})}>Wedding date · {data.date}</button><button onClick={()=>onEdit({key:'field:time',value:data.time})}>Time · {data.time}</button></div>}<Invitation cloudData={data} editing onRsvp={async()=>{throw Error('Preview only. Publish your invitation to collect responses.')}}/></div>;
}
