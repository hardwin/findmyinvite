import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useSearchMasonry} from '../useSearchMasonry';
import type {VideoEntry} from './catalog';
import './video-library.css';

const PAGE_SIZE=12;

export default function VideoLibraryGrid({entries,renderCard}:{entries:VideoEntry[];renderCard:(entry:VideoEntry)=>ReactNode}){
 const [limit,setLimit]=useState(PAGE_SIZE);
 const shown=entries.slice(0,limit),hasMore=limit<entries.length;
 const grid=useSearchMasonry(shown.length,false,shown.map(entry=>entry.id).join('|'));
 const more=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  if(!hasMore||!more.current||!('IntersectionObserver' in window))return;
  let requested=false;
  const observer=new IntersectionObserver(([entry])=>{
   if(entry.isIntersecting&&!requested){requested=true;setLimit(current=>current+PAGE_SIZE);}
  },{rootMargin:'400px 0px'});
  observer.observe(more.current);
  return()=>observer.disconnect();
 },[hasMore,limit]);

 useLayoutEffect(()=>{
  const element=grid.current;if(!element)return;
  const cards=Array.from(element.children) as HTMLElement[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finish=(card:HTMLElement)=>{card.dataset.libraryReveal='seen';};
  let observer:IntersectionObserver|undefined;
  function configure(){
   observer?.disconnect();
   if(reduced.matches||!('IntersectionObserver' in window)){cards.forEach(finish);return;}
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting)continue;
     const card=entry.target as HTMLElement;
     observer?.unobserve(card);
     card.dataset.libraryReveal=card.matches(':focus-within')?'seen':'entering';
    }
   },{rootMargin:'80px 0px'});
   // Spans have already been measured by useSearchMasonry. Never hide a card
   // that is already visible, and never reset a previously revealed card.
   for(const card of cards){
    if(!card.dataset.libraryReveal){
     const bounds=card.getBoundingClientRect();
     card.dataset.libraryReveal=bounds.top<innerHeight&&bounds.bottom>0?'seen':'ready';
    }
    if(card.dataset.libraryReveal==='ready')observer.observe(card);
   }
  }
  function animationEnd(event:AnimationEvent){if(event.animationName==='di-library-card-enter'&&event.target instanceof HTMLElement)finish(event.target);}
  function interact(event:Event){
   const card=event.target instanceof Element?event.target.closest<HTMLElement>('.di-preview-anchor'):null;
   if(card?.parentElement===element){observer?.unobserve(card);finish(card);}
  }
  configure();reduced.addEventListener('change',configure);
  element.addEventListener('animationend',animationEnd);element.addEventListener('focusin',interact);element.addEventListener('pointerdown',interact);
  return()=>{observer?.disconnect();reduced.removeEventListener('change',configure);element.removeEventListener('animationend',animationEnd);element.removeEventListener('focusin',interact);element.removeEventListener('pointerdown',interact);};
 },[shown.length,grid]);

 return <>
  <div ref={grid} className="di-masonry di-video-library-grid" role="region" aria-label="Invitation video templates">{shown.map(renderCard)}</div>
  {hasMore&&<div ref={more} className="di-video-library-more"><button type="button" className="di-button di-secondary" onClick={()=>setLimit(current=>current+PAGE_SIZE)}>Load more videos</button></div>}
 </>;
}
