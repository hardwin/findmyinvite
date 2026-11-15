import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {flushSync} from 'react-dom';
import {Expand,X} from 'lucide-react';

type Props={name:string;onExpand:()=>void;children:(expanded:boolean,expandControl:ReactNode)=>ReactNode};
export default function TemplatePreviewDialog({name,onExpand,children}:Props){
 const [open,setOpen]=useState(false),titleId=useId();
 const anchor=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const opened=useRef(false),position=useRef({x:0,y:0,height:0});
 const bodyStyle=useRef<{overflow:string;paddingRight:string}|null>(null);
 function restoreBody(){const saved=bodyStyle.current;if(saved){Object.assign(document.body.style,saved);bodyStyle.current=null;}}
 useEffect(()=>()=>restoreBody(),[]);
 function expand(){
  if(opened.current)return;
  position.current={x:scrollX,y:scrollY,height:anchor.current!.getBoundingClientRect().height};
  bodyStyle.current={overflow:document.body.style.overflow,paddingRight:document.body.style.paddingRight};
  const scrollbar=innerWidth-document.documentElement.clientWidth;
  document.body.style.paddingRight=(parseFloat(getComputedStyle(document.body).paddingRight)+scrollbar)+'px';
  document.body.style.overflow='hidden';
  opened.current=true;
  flushSync(()=>setOpen(true));
  // Native top-layer promotion keeps the iframe/video in its original DOM location.
  dialog.current!.showModal();
  closeButton.current?.focus({preventScroll:true});
  onExpand();
 }
 function finishClose(){
  if(!opened.current)return;
  opened.current=false;
  flushSync(()=>setOpen(false));
  restoreBody();
  const {x,y}=position.current;
  window.scrollTo({left:x,top:y,behavior:'instant'});
  requestAnimationFrame(()=>{trigger.current?.focus({preventScroll:true});window.scrollTo({left:x,top:y,behavior:'instant'});});
 }
 function close(){dialog.current?.close();finishClose();}
 useEffect(()=>{
  if(!open)return;
  const cleanups:(()=>void)[]=[],documents=new WeakSet<Document>(),frames=new WeakSet<HTMLIFrameElement>();
  function watchFrame(frame:HTMLIFrameElement){
   if(!frames.has(frame)){frames.add(frame);const loaded=()=>watchFrame(frame);frame.addEventListener('load',loaded);cleanups.push(()=>frame.removeEventListener('load',loaded));}
   try{const doc=frame.contentDocument;if(!doc||documents.has(doc))return;documents.add(doc);
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!doc.querySelector('dialog[open],[role="dialog"][aria-modal="true"]')){event.preventDefault();close();}};
    doc.addEventListener('keydown',escape);cleanups.push(()=>doc.removeEventListener('keydown',escape));
    const scan=()=>doc.querySelectorAll('iframe').forEach(watchFrame),observer=new MutationObserver(scan);observer.observe(doc,{childList:true,subtree:true});cleanups.push(()=>observer.disconnect());scan();
   }catch{/* External embeds cannot expose their keyboard events. */}
  }
  const scan=()=>dialog.current?.querySelectorAll('iframe').forEach(watchFrame),observer=new MutationObserver(scan);
  observer.observe(dialog.current!,{childList:true,subtree:true});scan();
  return()=>{observer.disconnect();cleanups.forEach(cleanup=>cleanup());};
 },[open]);
 const expandControl=<button ref={trigger} hidden={open} type="button" className="di-card-expand" aria-label={'Expand '+name} title="Expand preview" onClick={expand}><Expand size={18}/></button>;
 return <div ref={anchor} className="di-preview-anchor" style={open?{height:position.current.height}:undefined}>
  <dialog ref={dialog} className={'di-preview-dialog di-app'+(open?' di-fullscreen':'')} role={open?'dialog':'presentation'} aria-modal={open||undefined} aria-labelledby={open?titleId:undefined} onCancel={event=>{event.preventDefault();close();}} onClose={finishClose}>
   <h2 id={titleId} className="di-sr-only" hidden={!open}>{name} fullscreen preview</h2>
   <button ref={closeButton} hidden={!open} type="button" className="di-fullscreen-close" aria-label="Close fullscreen preview" onClick={close}><X size={22}/><span>Close</span></button>
   <div className={open?'di-fullscreen-stage':'di-preview-inline'}>{children(open,expandControl)}</div>
  </dialog>
 </div>;
}
