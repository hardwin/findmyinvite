import {useEffect,useId,useRef} from 'react';
import './storefront-atmosphere.css';

/** The supplied identity sheet's ribbon, botanical and champagne details.
 * Decorative only: no pointer targets, layout boxes or invitation content. */
function BrandRibbon({id}:{id:string}){
 return <svg viewBox="0 0 300 180" fill="none" focusable="false" aria-hidden="true">
  <defs>
   <linearGradient id={id+'-silk'} x1="18" y1="45" x2="265" y2="135" gradientUnits="userSpaceOnUse">
    <stop stopColor="#fcd1cf"/><stop offset=".22" stopColor="#cc759b"/><stop offset=".48" stopColor="#9e2d69"/><stop offset=".63" stopColor="#fcd1cf"/><stop offset=".82" stopColor="#cc759b"/><stop offset="1" stopColor="#6e1443"/>
   </linearGradient>
   <linearGradient id={id+'-fold'} x1="190" y1="105" x2="271" y2="143" gradientUnits="userSpaceOnUse">
    <stop stopColor="#fdf2ed"/><stop offset=".5" stopColor="#cc759b"/><stop offset="1" stopColor="#9e2d69"/>
   </linearGradient>
  </defs>
  <path d="M8 59C49 26 82 42 117 71C150 99 165 112 194 103C223 93 253 78 273 137C253 106 231 111 205 113C166 119 151 116 114 92C77 68 51 37 8 59Z" fill={`url(#${id}-silk)`}/>
  <path d="M194 103C221 94 245 83 256 105C241 96 227 107 205 113C201 110 197 106 194 103Z" fill={`url(#${id}-fold)`}/>
  <path d="M8 59C49 26 82 42 117 71C150 99 165 112 194 103" stroke="#fdf2ed" strokeOpacity=".65" strokeWidth=".7"/>
  <path d="M199 149C221 147 237 168 274 145C255 176 226 172 199 149Z" fill={`url(#${id}-fold)`}/>
 </svg>;
}

function BrandBotanical({id}:{id:string}){
 return <svg viewBox="0 0 150 250" fill="none" focusable="false" aria-hidden="true">
  <defs>
   <linearGradient id={id+'-leaf'} x1="25" y1="50" x2="110" y2="165" gradientUnits="userSpaceOnUse">
    <stop stopColor="#fcd1cf"/><stop offset=".34" stopColor="#cc759b"/><stop offset=".68" stopColor="#9e2d69"/><stop offset="1" stopColor="#6e1443"/>
   </linearGradient>
   <radialGradient id={id+'-bud'} cx=".3" cy=".25" r=".78">
    <stop stopColor="#fdf2ed"/><stop offset=".4" stopColor="#dfb08e"/><stop offset="1" stopColor="#c08261"/>
   </radialGradient>
  </defs>
  <g stroke="var(--sa-gold)" strokeWidth="1.2" strokeLinecap="round">
   <path d="M124 240C109 197 99 151 75 117C59 91 53 60 57 27M85 134C71 111 45 92 20 86M104 177C115 153 118 121 127 103M113 208C88 194 66 183 43 179M69 104C85 85 96 64 99 45"/>
   <path d="M78 126C50 128 31 117 25 105C47 105 70 110 78 126ZM57 76C42 53 47 26 56 10C68 31 71 57 57 76ZM73 109C72 78 91 61 103 52C104 77 93 98 73 109ZM103 172C76 171 60 156 50 145C77 146 96 154 103 172ZM111 161C107 132 119 112 132 99C136 126 126 148 111 161ZM114 211C89 213 73 204 59 196C80 190 101 198 114 211Z" fill={`url(#${id}-leaf)`} stroke="#9e2d69" strokeOpacity=".22" strokeWidth=".7"/>
  </g>
  <g stroke="#fdf2ed" strokeWidth=".65" opacity=".48">
   <path d="M57 72L56 15M76 105L99 58M75 124L30 107M101 170L54 148M111 158L130 104M111 209L64 197"/>
  </g>
  <g fill={`url(#${id}-bud)`}>
   <circle cx="18" cy="85" r="4.5"/><circle cx="100" cy="43" r="3.2"/><circle cx="41" cy="178" r="3.8"/>
  </g>
 </svg>;
}

function BrandHeart({id}:{id:string}){
 return <svg viewBox="0 0 76 82" fill="none" focusable="false" aria-hidden="true">
  <defs><radialGradient id={id} cx=".24" cy=".2" r=".95"><stop stopColor="#fdf2ed"/><stop offset=".4" stopColor="#dfb08e"/><stop offset=".7" stopColor="#c08261"/><stop offset="1" stopColor="#c08261"/></radialGradient></defs>
  <path d="M38 74C32 58 8 45 9 25C10 6 29 7 38 20C48 5 67 7 68 25C69 45 46 59 38 74Z" fill={`url(#${id})`}/>
  <path d="M15 24C15 12 28 11 36 22" stroke="#ffffff" strokeOpacity=".62" strokeWidth="1.3" strokeLinecap="round"/>
 </svg>;
}

function BrandArc(){
 return <svg viewBox="0 0 240 130" fill="none" focusable="false" aria-hidden="true">
  <path d="M12 115C61 10 184 3 230 116" stroke="var(--sa-gold)" strokeWidth="1.15" strokeLinecap="round"/>
  <circle cx="41" cy="69" r="3" fill="var(--sa-gold)"/>
 </svg>;
}

function BrandDots({id}:{id:string}){
 return <svg viewBox="0 0 64 75" fill="none" focusable="false" aria-hidden="true">
  <defs><radialGradient id={id} cx=".3" cy=".25" r=".75"><stop stopColor="#fdf2ed"/><stop offset=".45" stopColor="#dfb08e"/><stop offset="1" stopColor="#c08261"/></radialGradient></defs>
  <circle cx="14" cy="21" r="3" fill={`url(#${id})`}/><circle cx="42" cy="30" r="5" fill={`url(#${id})`}/><circle cx="28" cy="59" r="2" fill={`url(#${id})`}/>
 </svg>;
}

export default function StorefrontAtmosphere(){
 const root=useRef<HTMLDivElement>(null);
 const id=useId().replace(/:/g,'');
 useEffect(()=>{
  const decoration=root.current;
  const main=document.querySelector<HTMLElement>('.di-main');
  if(!decoration||!main)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const touched=new Set<HTMLElement>();
  const seen=new WeakSet<HTMLElement>();
  let observer:IntersectionObserver|null=null,mutation:MutationObserver|null=null;
  let scrollFrame=0,scanFrame=0;

  function finish(element:HTMLElement){
   if(!touched.has(element))return;
   element.dataset.saReveal='seen';
   element.style.removeProperty('--sa-delay');
  }
  function finishAncestors(event:Event){
   if(!(event.target instanceof Element))return;
   let element:Element|null=event.target;
   while(element&&element!==main!.parentElement){
    if(element instanceof HTMLElement&&touched.has(element))finish(element);
    element=element.parentElement;
   }
  }
  function scan(){
   scanFrame=0;
   if(!observer)return;
   // Containers fade only. Card movement is temporary and never applies to an
   // ancestor of an open native fullscreen dialog (also guarded in CSS).
   const targets=main!.querySelectorAll<HTMLElement>(':scope > section, .dc-category-card, .di-preview-anchor');
   let cardIndex=0;
   targets.forEach(element=>{
    if(seen.has(element))return;
    seen.add(element);touched.add(element);
    const card=element.matches('.dc-category-card,.di-preview-anchor');
    element.dataset.saMotion=card?'card':'section';
    element.dataset.saReveal='ready';
    if(card)element.style.setProperty('--sa-delay',`${(cardIndex++%4)*45}ms`);
    observer!.observe(element);
   });
  }
  function updateParallax(){
   scrollFrame=0;
   if(reduced.matches||document.hidden)return;
   // Bounded scroll response: no perpetual animation, no motion when idle.
   const position=window.scrollY;
   decoration!.style.setProperty('--sa-drift',`${Math.sin(position/1350)*64}px`);
   decoration!.style.setProperty('--sa-drift-far',`${Math.sin(position/1900)*28}px`);
   decoration!.style.setProperty('--sa-turn',`${Math.sin(position/1600)*9}deg`);
  }
  function scheduleParallax(){if(!scrollFrame&&!reduced.matches&&!document.hidden)scrollFrame=requestAnimationFrame(updateParallax);}
  function stopMotion(){
   observer?.disconnect();observer=null;mutation?.disconnect();mutation=null;
   cancelAnimationFrame(scrollFrame);cancelAnimationFrame(scanFrame);scrollFrame=scanFrame=0;
   touched.forEach(finish);
   decoration!.style.removeProperty('--sa-drift');
   decoration!.style.removeProperty('--sa-drift-far');
   decoration!.style.removeProperty('--sa-turn');
  }
  function configure(){
   stopMotion();
   if(reduced.matches)return;
   if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{
     for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const element=entry.target as HTMLElement;
      observer?.unobserve(element);
      // Do not interrupt something already being focused or interacted with.
      if(element.matches(':focus-within')||element.querySelector('dialog[open]'))finish(element);
      else element.dataset.saReveal='entering';
     }
    },{threshold:.04,rootMargin:'0px 0px -16px 0px'});
    scan();
    mutation=new MutationObserver(()=>{if(!scanFrame)scanFrame=requestAnimationFrame(scan);});
    mutation.observe(main!,{childList:true,subtree:true});
   }
   scheduleParallax();
  }
  function animationEnd(event:AnimationEvent){if(event.target instanceof HTMLElement&&event.animationName.startsWith('sa-'))finish(event.target);}
  reduced.addEventListener('change',configure);
  window.addEventListener('scroll',scheduleParallax,{passive:true});
  window.addEventListener('resize',scheduleParallax,{passive:true});
  document.addEventListener('visibilitychange',scheduleParallax);
  main.addEventListener('focusin',finishAncestors);
  main.addEventListener('pointerdown',finishAncestors,{capture:true});
  main.addEventListener('animationend',animationEnd);
  configure();
  return()=>{
   stopMotion();
   reduced.removeEventListener('change',configure);
   window.removeEventListener('scroll',scheduleParallax);
   window.removeEventListener('resize',scheduleParallax);
   document.removeEventListener('visibilitychange',scheduleParallax);
   main.removeEventListener('focusin',finishAncestors);
   main.removeEventListener('pointerdown',finishAncestors,{capture:true});
   main.removeEventListener('animationend',animationEnd);
   touched.forEach(element=>{delete element.dataset.saReveal;delete element.dataset.saMotion;element.style.removeProperty('--sa-delay');});
  };
 },[]);
 return <div ref={root} className="sa-atmosphere" aria-hidden="true">
  <div className="sa-ornament sa-ribbon sa-ribbon-left"><BrandRibbon id={id+'-ribbon-left'}/></div>
  <div className="sa-ornament sa-ribbon sa-ribbon-right"><BrandRibbon id={id+'-ribbon-right'}/></div>
  <div className="sa-ornament sa-botanical sa-botanical-left"><BrandBotanical id={id+'-branch-left'}/></div>
  <div className="sa-ornament sa-botanical sa-botanical-right"><BrandBotanical id={id+'-branch-right'}/></div>
  <div className="sa-ornament sa-heart"><BrandHeart id={id+'-heart'}/></div>
  <div className="sa-ornament sa-arc"><BrandArc/></div>
  <div className="sa-ornament sa-dots"><BrandDots id={id+'-dots'}/></div>
 </div>;
}
