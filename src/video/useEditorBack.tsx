import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const key='fmiVideoEditor';
export function useEditorBack({previous,flush,status,unsafe}:{previous?:()=>void;flush:()=>Promise<void>;status:string;unsafe:boolean}){
 const [open,setOpen]=useState(false),[leaving,setLeaving]=useState(false),bypass=useRef(false),leavingRef=useRef(false),restoring=useRef(false),latest=useRef({previous,flush,status,href:location.href});latest.current={previous,flush,status,href:location.href};
 useEffect(()=>{
  const existing=history.state?.[key],marker=existing||{role:'base',prior:history.length>2||history.length>1&&!!document.referrer};
  if(!existing)history.replaceState({...history.state,[key]:marker},'',location.href);
  // iOS skips entries created without user activation. Arm once, during an actual
  // tap/key press, and retain the same pair across autosaves and refreshes.
  const arm=()=>{if(bypass.current||history.state?.[key]?.role==='guard')return;history.pushState({...history.state,[key]:{...marker,role:'guard'}},'',location.href);};
  const pop=()=>{if(bypass.current)return;if(restoring.current){restoring.current=false;return;}if(history.state?.[key]?.role==='base'){
   restoring.current=true;history.forward();if(!leavingRef.current)setOpen(true);
  }};
  document.addEventListener('pointerdown',arm,true);document.addEventListener('keydown',arm,true);addEventListener('popstate',pop);
  return()=>{document.removeEventListener('pointerdown',arm,true);document.removeEventListener('keydown',arm,true);removeEventListener('popstate',pop);};
 },[]);
 useEffect(()=>{if(!unsafe)return;const protect=(e:BeforeUnloadEvent)=>{if(!bypass.current){e.preventDefault();e.returnValue='';}};addEventListener('beforeunload',protect);return()=>removeEventListener('beforeunload',protect);},[unsafe]);
 async function exit(){if(leavingRef.current)return;leavingRef.current=true;setLeaving(true);await Promise.race([latest.current.flush().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,2500))]);bypass.current=true;if(history.state?.[key]?.prior)history.go(history.state?.[key]?.role==='guard'?-2:-1);else location.replace('/dashboard');}
 const dialog=<Dialog.Root open={open} onOpenChange={value=>{if(!leaving)setOpen(value);}}><Dialog.Portal><Dialog.Overlay className="vp-dialog-overlay"/><Dialog.Content className="vp-exit-dialog"><Dialog.Title>Go back?</Dialog.Title><Dialog.Description>Choose where to go.</Dialog.Description>{/waiting|unavailable|review|Saving/.test(status)&&<p role="status">{status}</p>}<div>{previous&&<button type="button" disabled={leaving} onClick={()=>{setOpen(false);latest.current.previous?.();}}>Previous step</button>}<button type="button" disabled={leaving} onClick={()=>void exit()}>{leaving?'Leaving…':'Exit editor'}</button><Dialog.Close asChild><button type="button" className="vp-primary" disabled={leaving}>Keep editing</button></Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
 return {dialog,requestBack:()=>setOpen(true)};
}
