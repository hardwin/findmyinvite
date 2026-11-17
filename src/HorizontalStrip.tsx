import {useEffect,useRef,type HTMLAttributes} from 'react';

/** Keep native sideways swiping, but don't let a trackpad's slight horizontal
 * drift capture a mostly vertical wheel gesture inside a one-row scroller. */
export default function HorizontalStrip(props:HTMLAttributes<HTMLDivElement>){
 const strip=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=strip.current!;
  function wheel(event:WheelEvent){
   if(event.defaultPrevented||!event.cancelable||event.ctrlKey||event.metaKey||event.shiftKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
   if(element.scrollWidth<=element.clientWidth+1)return;
   // Fullscreen previews own their scrolling and must keep the page locked.
   if(event.target instanceof Element&&event.target.closest('dialog[open]'))return;
   const unit=event.deltaMode===WheelEvent.DOM_DELTA_PAGE?innerHeight:event.deltaMode===WheelEvent.DOM_DELTA_LINE?(parseFloat(getComputedStyle(element).lineHeight)||16):1;
   event.preventDefault();
   window.scrollBy({top:event.deltaY*unit,behavior:'instant'});
  }
  element.addEventListener('wheel',wheel,{passive:false});
  return()=>element.removeEventListener('wheel',wheel);
 },[]);
 return <div {...props} ref={strip}/>;
}
