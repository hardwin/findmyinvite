import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {videoCustomerMessage} from '../../shared/video-customer-message.mjs';
import {TransferProgress} from './TransferProgress';

export type EditorAction={label:string;reason:string;disabled?:boolean;run:()=>void|Promise<unknown>};
type Issue={message:string;action?:EditorAction;success?:boolean};
const FeedbackContext=createContext<(source:string,issue:Issue|null)=>void>(()=>{});
const ToastHeightContext=createContext(0);
export const useToastHeight=()=>useContext(ToastHeightContext);
export function FeedbackProvider({children}:{children:ReactNode}){
 const [issues,setIssues]=useState<Record<string,Issue>>({}),[dismissed,setDismissed]=useState<Record<string,string>>({});
 const toast=useRef<HTMLDivElement>(null),[toastHeight,setToastHeight]=useState(0);
 const report=useCallback((source:string,issue:Issue|null)=>setIssues(current=>{
  if(!issue){if(!current[source])return current;const next={...current};delete next[source];return next;}
  if(current[source]?.message===issue.message&&current[source]?.action?.label===issue.action?.label)return current;
  return {...current,[source]:issue};
 }),[]);
 const visible=Object.entries(issues).filter(([key,value])=>dismissed[key]!==value.message),latest=visible.filter(([,v])=>!v.success).at(-1)||visible.at(-1);
 useEffect(()=>{if(!latest?.[1].success)return;const [key,issue]=latest,timer=setTimeout(()=>setDismissed(d=>({...d,[key]:issue.message})),5000);return()=>clearTimeout(timer);},[latest?.[0],latest?.[1].message]);
 // Resolved errors can be shown again if a later attempt fails in the same way.
 useEffect(()=>setDismissed(d=>Object.fromEntries(Object.entries(d).filter(([key])=>issues[key]))),[issues]);
 useEffect(()=>{if(!toast.current){setToastHeight(0);return;}const observer=new ResizeObserver(()=>setToastHeight(Math.ceil(toast.current?.getBoundingClientRect().height||0)+8));observer.observe(toast.current);return()=>observer.disconnect();},[latest?.[0],latest?.[1].message]);
 return <FeedbackContext.Provider value={report}><ToastHeightContext.Provider value={toastHeight}>{children}</ToastHeightContext.Provider>{latest&&<div ref={toast} className="vp-toast" role={latest[1].success?'status':'alert'}>
  <div><p>{videoCustomerMessage(latest[1].message)}</p>{latest[1].action&&<button type="button" onClick={()=>void latest[1].action?.run()}>{latest[1].action.label}</button>}</div>
  <button type="button" aria-label="Dismiss notification" onClick={()=>setDismissed(d=>({...d,[latest[0]]:latest[1].message}))}><X size={18}/></button>
 </div>}</FeedbackContext.Provider>;
}
export function useEditorIssue(source:string,message:string,action?:EditorAction,success=false){
 const report=useContext(FeedbackContext),latest=useRef(action);latest.current=action;
 useEffect(()=>{report(source,message?{message,success,action:action?{...action,run:()=>latest.current?.run()}:undefined}:null);return()=>report(source,null);},[report,source,message,action?.label,success]);
}

export type EditorViewport={left:number;top:number;width:number;height:number;mobile:boolean;keyboard:boolean;obstacles:{left:number;right:number;top:number;bottom:number}[];field:{left:number;right:number;top:number;bottom:number}|null};
const fieldSelector='.vp-form input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]), .vp-form textarea, .vp-form select';
export function useEditorViewport(){
 const read=():EditorViewport=>{const v=window.visualViewport,a=document.activeElement,r=a instanceof HTMLElement&&a.matches(fieldSelector)?a.getBoundingClientRect():null;return {left:Math.round(v?.offsetLeft||0),top:Math.round(v?.offsetTop||0),width:Math.round(v?.width||innerWidth),height:Math.round(v?.height||innerHeight),mobile:matchMedia('(max-width:760px)').matches,keyboard:false,obstacles:Array.from(document.querySelectorAll<HTMLElement>('.vp-form-body button, .vp-form-body input[type=checkbox], .vp-form-body input[type=radio], .vp-form-body summary, .vp-form-body a')).filter(el=>el.getClientRects().length&&!el.closest('[inert]')).map(el=>{const r=el.getBoundingClientRect();return {left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom)};}),field:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null};};
 const [view,setView]=useState(read);
 useEffect(()=>{let raf=0,baselineHeight=innerHeight,baselineWidth=innerWidth;const update=()=>{raf=0;const next=read();if(baselineWidth!==innerWidth){baselineWidth=innerWidth;baselineHeight=innerHeight;}if(!next.field)baselineHeight=Math.max(baselineHeight,innerHeight,next.height);next.keyboard=!!next.field&&Math.max(baselineHeight,innerHeight)-next.height>120;setView(current=>JSON.stringify(current)===JSON.stringify(next)?current:next);};const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};const sources:[EventTarget,string][]=[[window,'resize'],[document,'scroll'],[document,'focusin'],[document,'focusout']];if(visualViewport)sources.push([visualViewport,'resize'],[visualViewport,'scroll']);sources.forEach(([target,event])=>target.addEventListener(event,schedule,{passive:true,capture:true}));const observer=new MutationObserver(schedule);const form=document.querySelector('.vp-form');if(form)observer.observe(form,{childList:true,subtree:true});schedule();return()=>{observer.disconnect();cancelAnimationFrame(raf);sources.forEach(([target,event])=>target.removeEventListener(event,schedule,true));};},[]);
 return view;
}
export function BusyNotice({message,percent,secondsRemaining}:{message:string;percent?:number|null;secondsRemaining?:number|null}){
 return message?<div className="vp-busy-notice"><TransferProgress label={message} percent={percent} secondsRemaining={secondsRemaining}/></div>:null;
}
/** Move only the inner form once focus/keyboard sizing settles, never the page or canvas. */
export function useComfortableFieldFocus(){
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>,raf=0;const body=document.querySelector<HTMLElement>('.vp-form-body');if(!body)return;
  const align=()=>{const field=document.activeElement;if(!(field instanceof HTMLElement)||!field.matches(fieldSelector)){body.style.paddingBottom='';return;}
   const mobile=matchMedia('(max-width:760px)').matches,keyboard=mobile&&innerHeight-(visualViewport?.height||innerHeight)>120;
   const wrapper=field.closest<HTMLElement>('.tf-field')||field,box=body.getBoundingClientRect();
   // Only the keyboard session needs room below the final field to bring its label up.
   body.style.paddingBottom=keyboard?Math.max(14,box.height-Math.min(wrapper.getBoundingClientRect().height,box.height-28)-28)+'px':'';
   const rect=wrapper.getBoundingClientRect(),input=field.getBoundingClientRect();
   if(keyboard||rect.top<box.top+12||input.bottom>box.bottom-16)body.scrollTop+=rect.top-box.top-14;
  };
  const schedule=()=>{clearTimeout(timer);cancelAnimationFrame(raf);timer=setTimeout(()=>{raf=requestAnimationFrame(align);},140);};
  document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);visualViewport?.addEventListener('resize',schedule);window.addEventListener('resize',schedule);
  return()=>{clearTimeout(timer);cancelAnimationFrame(raf);body.style.paddingBottom='';document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);visualViewport?.removeEventListener('resize',schedule);window.removeEventListener('resize',schedule);};
 },[]);
}
export function ActionBar({view,action,back,working,hidden,onHeight}:{view:EditorViewport;action:EditorAction;back:()=>void;working:boolean;hidden:boolean;onHeight:(height:number)=>void}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(!ref.current)return;const observer=new ResizeObserver(()=>onHeight(Math.ceil(ref.current!.getBoundingClientRect().height)));observer.observe(ref.current);return()=>observer.disconnect();},[onHeight]);
 useEffect(()=>{document.documentElement.style.setProperty('--vp-visible-bottom',Math.max(0,innerHeight-view.top-view.height)+'px');return()=>{document.documentElement.style.removeProperty('--vp-visible-bottom');};},[view.top,view.height]);
 return <footer ref={ref} className="vp-form-footer" inert={hidden} aria-hidden={hidden||undefined}>
  {!working&&action.disabled&&action.reason&&<p id="vp-action-reason" className="vp-action-reason">{action.reason}</p>}
  <div className="vp-action-buttons"><button type="button" onPointerDown={e=>e.preventDefault()} onClick={back}>Back</button>{!working&&<button type="button" className="vp-primary" aria-describedby={action.disabled?'vp-action-reason':undefined} disabled={action.disabled} onPointerDown={e=>e.preventDefault()} onClick={()=>void action.run()}>{action.label}</button>}</div>
 </footer>;
}
