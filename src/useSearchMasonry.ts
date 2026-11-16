import {useLayoutEffect,useRef} from 'react';

// Measure the cards rather than their artwork: descriptions, font loading and
// fullscreen preview placeholders can all affect the occupied height.
export function useSearchMasonry(count:number,loading:boolean){
 const grid=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const element=grid.current;
  if(!element)return;
  const cards=Array.from(element.children) as HTMLElement[];
  let frame=0;
  function layout(){
   const gap=parseFloat(getComputedStyle(element!).columnGap)||0;
   // Read all heights before writing spans to avoid repeated forced layouts.
   const spans=cards.map(card=>Math.ceil(card.getBoundingClientRect().height+gap));
   cards.forEach((card,index)=>{
    const span='span '+spans[index];
    if(card.style.gridRowEnd!==span)card.style.gridRowEnd=span;
   });
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);}
  const observer=new ResizeObserver(schedule);
  observer.observe(element);
  cards.forEach(card=>observer.observe(card));
  layout();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[count,loading]);
 return grid;
}
