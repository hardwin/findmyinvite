import {useEffect,useState} from 'react';
import './promo-banner.css';

const OFFER_TEXT='50% off on all Websites & Videos till 21st December 2026 - Grab Now';
// The offer includes all of 21 December in India, including in tabs left open.
const OFFER_EXPIRES_AT=Date.parse('2026-12-22T00:00:00+05:30');

export default function PromoBanner(){
 const [paused,setPaused]=useState(false);
 const [active,setActive]=useState(()=>Date.now()<OFFER_EXPIRES_AT);
 useEffect(()=>{
  if(!active)return;
  let timer:number|undefined;
  function checkExpiry(){
   window.clearTimeout(timer);
   const remaining=OFFER_EXPIRES_AT-Date.now();
   if(remaining<=0)setActive(false);
   else timer=window.setTimeout(checkExpiry,Math.min(remaining,86_400_000));
  }
  checkExpiry();
  document.addEventListener('visibilitychange',checkExpiry);
  return()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',checkExpiry);};
 },[active]);
 if(!active)return null;

 return <aside className="promo-banner" aria-label="Special offer" data-paused={paused}>
  <a className="promo-banner-link" href="/templates">
   <span className="promo-banner-track">
    {[0,1,2,3].map(copy=><span className="promo-banner-copy" key={copy} aria-hidden={copy>0?true:undefined}>{OFFER_TEXT}</span>)}
   </span>
  </a>
  <button className="promo-banner-toggle" type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume offer scrolling':'Pause offer scrolling'} title={paused?'Resume scrolling':'Pause scrolling'}>
   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {paused?<path d="M7 4.5L15 10L7 15.5Z"/>:<><path d="M7 5V15"/><path d="M13 5V15"/></>}
   </svg>
  </button>
 </aside>;
}
