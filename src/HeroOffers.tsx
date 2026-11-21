import {cloneElement,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Gift,Monitor,Pause,Play,Search,Video} from 'lucide-react';
import HorizontalStrip from './HorizontalStrip';
import TemplatePrice from './TemplatePrice';
import {videoOffer} from '../shared/video-pricing.mjs';

import {templateDetailsPath} from '../shared/template-sharing.mjs';
import './hero-offers.css';

const ASSETS='/assets/hero-offers/';
const sizes='(max-width:640px) calc(100vw - 32px), (max-width:1100px) calc((100vw - 44px) / 2), (max-width:1832px) calc((100vw - 56px) / 3), 592px';
function Artwork({name,phone=false,priority=false}:{name:string;phone?:boolean;priority?:boolean}){
 const widths=phone?[180,360,540]:[360,480,720,960,1200],mobile=phone?[180,360]:[360,720];
 const imageSizes=phone?'(max-width:640px) 100px, 140px':sizes;
 const srcset=(values:number[],format:string)=>values.map(width=>`${ASSETS}${name}-${width}.${format} ${width}w`).join(',');
 return <picture className={phone?'di-offer-screen':'di-offer-art'}>
  <source media="(max-width:640px)" type="image/avif" srcSet={srcset(mobile,'avif')} sizes={imageSizes}/>
  <source media="(max-width:640px)" type="image/webp" srcSet={srcset(mobile,'webp')} sizes={imageSizes}/>
  <source media="(min-width:641px)" type="image/avif" srcSet={srcset(widths,'avif')} sizes={imageSizes}/>
  <source media="(min-width:641px)" type="image/webp" srcSet={srcset(widths,'webp')} sizes={imageSizes}/>
  {/* Keep the fallback mobile-sized: WebKit can prefetch it before React attaches the picture sources. */}
  <img src={`${ASSETS}${name}-${phone?180:480}.webp`} srcSet={srcset(mobile,'webp')} sizes={imageSizes} width={phone?360:1774} height={phone?1002:887} alt="" loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'low'} decoding="async"/>
 </picture>;
}

export default function HeroOffers({query='',language='en'}:{query?:string;language?:string}){
 const hero=useRef<HTMLElement>(null),[paused,setPaused]=useState(false);
 const wedding=videoOffer('wedding-bells-v1');
 useEffect(()=>{
  const strip=hero.current!.querySelector<HTMLElement>('.di-offers-track')!;
  const compact=matchMedia('(max-width:1100px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let frame=0,lastTime=0,cycle=0,position=strip.scrollLeft,written=position,resumeAt=0;
  let visible=false,hovered=false,pressed=false,focused=strip.contains(document.activeElement);
  const enabled=()=>compact.matches&&!reduced.matches&&cycle>0;
  const canMove=()=>enabled()&&!paused&&visible&&!document.hidden&&!hovered&&!pressed&&!focused;
  function write(value:number){position=value;strip.scrollLeft=value;written=strip.scrollLeft;}
  function tick(now:number){
   frame=0;
   if(!canMove()){lastTime=0;return;}
   if(lastTime&&now>=resumeAt){
    // Fractional position stays outside React and survives integer scrollLeft
    // rounding. Identical neighbours make this wrap visually imperceptible.
    const next=position+Math.min(now-lastTime,40)*.026;
    write(cycle+((next-cycle)%cycle+cycle)%cycle);
   }
   lastTime=now;frame=requestAnimationFrame(tick);
  }
  function update(){
   if(canMove()){if(!frame)frame=requestAnimationFrame(tick);}
   else{cancelAnimationFrame(frame);frame=0;lastTime=0;}
  }
  function measure(){
   const oldCycle=cycle;
   cycle=compact.matches&&!reduced.matches?(strip.children[3] as HTMLElement).offsetLeft-(strip.children[0] as HTMLElement).offsetLeft:0;
   if(cycle){
    const basis=oldCycle||cycle,progress=((position%basis)+basis)%basis/basis;
    write(cycle+progress*cycle);
   }else write(0);
   update();
  }
  function scroll(){
   // Native touch/trackpad browsing takes ownership until its momentum ends.
   if(Math.abs(strip.scrollLeft-written)<1)return;
   position=strip.scrollLeft;written=position;resumeAt=performance.now()+1800;
   if(enabled()&&!pressed){
    if(position<cycle/2)write(position+cycle);
    else if(position>cycle*2.5)write(position-cycle);
   }
  }
  function enter(event:PointerEvent){if(event.pointerType==='mouse'){hovered=true;update();}}
  function leave(){hovered=false;update();}
  function down(){pressed=true;update();}
  function up(){if(!pressed)return;pressed=false;resumeAt=performance.now()+1800;update();}
  function focus(){focused=true;update();}
  function blur(event:FocusEvent){focused=event.relatedTarget instanceof Node&&strip.contains(event.relatedTarget);update();}
  const resize=new ResizeObserver(measure);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
  strip.addEventListener('scroll',scroll,{passive:true});
  strip.addEventListener('pointerenter',enter);strip.addEventListener('pointerleave',leave);strip.addEventListener('pointerdown',down);
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  strip.addEventListener('focusin',focus);strip.addEventListener('focusout',blur);
  document.addEventListener('visibilitychange',update);compact.addEventListener('change',measure);reduced.addEventListener('change',measure);
  resize.observe(strip);intersection.observe(strip);measure();
  return()=>{
   cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();
   strip.removeEventListener('scroll',scroll);strip.removeEventListener('pointerenter',enter);strip.removeEventListener('pointerleave',leave);strip.removeEventListener('pointerdown',down);
   window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
   strip.removeEventListener('focusin',focus);strip.removeEventListener('focusout',blur);
   document.removeEventListener('visibilitychange',update);compact.removeEventListener('change',measure);reduced.removeEventListener('change',measure);
  };
 },[paused]);
 const offers=[
   <a className="di-offer-card di-offer-video" href={templateDetailsPath('wedding-bells-v1','video',language)} aria-label="Preview Wedding Bells video invitation">
    <Artwork name="wedding-bells" priority/>
    <div className="di-offer-phone" aria-hidden="true"><Artwork name="wedding-bells-card" phone priority/><span className="di-offer-phone-camera"/><span className="di-offer-phone-home"/></div>
    <div className="di-offer-copy">
     <span className="di-offer-ribbon"><Gift size={14} aria-hidden="true"/>{wedding.offerLabel}</span>
     <h2>Wedding Bells</h2>
     <p className="di-offer-type"><Video size={17} aria-hidden="true"/>Video invitation</p>
     <TemplatePrice amountPaise={wedding.basePaise} originalPaise={wedding.originalPaise}/>
     <span className="di-offer-link">Preview this video <ArrowUpRight size={15} aria-hidden="true"/></span>
    </div>
   </a>,
   <a className="di-offer-card di-offer-website" href={'/templates?'+new URLSearchParams({kind:'website',lang:language})} aria-label="Explore wedding website templates">
    <Artwork name="wedding-websites"/>
    <div className="di-offer-copy">
     <span className="di-offer-eyebrow">Made by you</span>
     <h2>Free Website Designs</h2>
     <span className="di-offer-ribbon">No payment required</span>
     <TemplatePrice amountPaise={0}/>
     <span className="di-offer-link">Explore websites <ArrowUpRight size={15} aria-hidden="true"/></span>
    </div>
   </a>,
   <a className="di-offer-card di-offer-celebration" href="/templates" aria-label="Explore offers on invitation videos and wedding websites">
    <Artwork name="celebration-offers"/>
    <div className="di-offer-copy">
     <span className="di-offer-eyebrow"><Gift size={16} aria-hidden="true"/>Celebrate your way</span>
     <h2>Your Celebration, Your Style</h2>
     <p className="di-offer-pair"><span><Video size={17} aria-hidden="true"/>Video invitations</span><span><Monitor size={17} aria-hidden="true"/>Wedding websites</span></p>
     <p className="di-offer-saving"><strong>Free</strong><span>&amp; premium<br/>designs</span></p>
     <span className="di-offer-link">Explore offers <ArrowUpRight size={15} aria-hidden="true"/></span>
    </div>
   </a>
 ];
 return <section ref={hero} className="di-hero di-offer-hero" aria-labelledby="di-offer-heading">
  <h1 id="di-offer-heading" className="di-offer-heading">Wedding invitation offers</h1>
  <div className="di-offers-carousel">
   <HorizontalStrip className="di-offers-track" role="region" aria-label="Wedding invitation offers">
    {[-1,0,1].flatMap(copy=>offers.map((offer,index)=>cloneElement(offer,{
     key:`${copy}-${index}`,className:offer.props.className+(copy?' di-offer-repeat':''),
     'aria-hidden':copy?true:undefined,tabIndex:copy?-1:undefined
    })))}
   </HorizontalStrip>
   <button className="di-offer-motion" type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume banner scrolling':'Pause banner scrolling'} title={paused?'Resume banner scrolling':'Pause banner scrolling'}>
    {paused?<Play size={13} aria-hidden="true"/>:<Pause size={13} aria-hidden="true"/>}
   </button>
  </div>
  <form className="di-search" role="search" action="/search" method="get"><input name="q" aria-label="Search designs" placeholder="Search a design, occasion or style" defaultValue={query}/><button aria-label="Search invitations"><Search size={21}/></button></form>
 </section>;
}
