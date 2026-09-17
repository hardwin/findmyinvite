import {useEffect,useRef} from 'react';
import type {InviteData} from './Invitation';
export default function StudioPreview({html,data,section,onSection,phone}:{html:string;data:InviteData;section:string;onSection:(id:string)=>void;phone:boolean}){
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  const node=frame.current;
  if(!node)return;
  const doc=node.contentDocument;
  if(!doc)return;
  doc.open();
  doc.write(html||'');
  doc.close();
  const apply=()=>{
   try{
    const win=node.contentWindow as Window&{fmiData?:InviteData};
    if(!win)return;
    win.fmiData=data;
    win.document.querySelectorAll('[data-field]').forEach(el=>{
     const key=el.getAttribute('data-field') as keyof InviteData;
     if(typeof data[key]==='string')el.textContent=data[key];
    });
    win.document.querySelectorAll('[data-photo]').forEach(el=>{
     const index=Number(el.getAttribute('data-photo'));
     const src=data.photos?.[index];
     if(src){el.setAttribute('src',src);el.removeAttribute('hidden');}
     else el.setAttribute('hidden','');
    });
    win.document.dispatchEvent(new Event('fmi:updated'));
    const target=win.document.querySelector('[data-section="'+section+'"]');
    target?.scrollIntoView({behavior:'smooth',block:'start'});
   }catch{}
  };
  apply();
  const onClick=(event:Event)=>{
   const target=(event.target as HTMLElement|null)?.closest?.('[data-section]');
   const id=target?.getAttribute('data-section');
   if(id)onSection(id);
  };
  node.contentDocument?.addEventListener('click',onClick);
  return()=>node.contentDocument?.removeEventListener('click',onClick);
 },[html,data,section,onSection]);
 return <iframe ref={frame} className={'studio-preview-frame'+(phone?' is-phone':'')} title="Invitation preview" sandbox="allow-scripts allow-downloads allow-same-origin"/>;
}
