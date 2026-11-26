import {useEffect,useState} from 'react';
import {ANBIL_AVAN_ID} from '../../shared/anbil-avan-video.mjs';
import {BLACK_FRIDAY_START,BLACK_FRIDAY_END,videoOffer} from '../../shared/video-pricing.mjs';

export function useBlackFridayOffer(templateId?:string){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{
  if(templateId!==ANBIL_AVAN_ID)return;
  let timeout:number;
  const tick=()=>{
   window.clearTimeout(timeout);
   const time=Date.now();
   setNow(time);
   if(time>=BLACK_FRIDAY_END)return;
   const delay=time<BLACK_FRIDAY_START?BLACK_FRIDAY_START-time:1000-time%1000;
   timeout=window.setTimeout(tick,Math.min(delay,2147483647));
  };
  tick();
  document.addEventListener('visibilitychange',tick);
  window.addEventListener('pageshow',tick);
  return ()=>{
   window.clearTimeout(timeout);
   document.removeEventListener('visibilitychange',tick);
   window.removeEventListener('pageshow',tick);
  };
 },[templateId]);
 if(templateId!==ANBIL_AVAN_ID)return null;
 const offer=videoOffer(templateId,now);
 return {...offer,secondsLeft:offer.offerLabel?Math.ceil((BLACK_FRIDAY_END-now)/1000):0};
}

export function OfferCountdown({seconds}:{seconds?:number}){
 if(!seconds)return null;
 const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),remainder=seconds%60;
 const pad=(value:number)=>String(value).padStart(2,'0');
 return <small className="fmi-offer-countdown" role="timer" aria-live="off" aria-label={`Offer ends in ${hours} hours, ${minutes} minutes and ${remainder} seconds`}>Ends in {pad(hours)}h {pad(minutes)}m {pad(remainder)}s</small>;
}
