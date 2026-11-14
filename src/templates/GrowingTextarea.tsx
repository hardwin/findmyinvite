import {useLayoutEffect,useRef,type TextareaHTMLAttributes} from 'react';
/** Opt-in sizing for the invitation editor; other forms retain their own sizing. */
export function GrowingTextarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>){
 const ref=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{const field=ref.current;if(!field)return;let width=0;
  const fit=()=>{field.style.height='0px';field.style.height=field.scrollHeight+2+'px';};
  fit();const observer=new ResizeObserver(entries=>{const next=entries[0].contentRect.width;if(next!==width){width=next;fit();}});observer.observe(field);
  void document.fonts.ready.then(()=>{if(field.isConnected)fit();});return()=>observer.disconnect();
 },[props.value]);
 return <textarea {...props} ref={ref} rows={2} style={{...props.style,resize:'none',overflowY:'hidden'}}/>;
}
