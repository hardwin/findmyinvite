import {isFreeVideo} from './video-access.mjs';
// Base price per saved invitation. GST is added at checkout; edits and retries are included.
export const VIDEO_PRICE_PAISE = 0;
export const VIDEO_CURRENCY = 'INR';
export const VIDEO_GST_BPS = 1800;
export function videoOffer(templateId){
 if(templateId==='wedding-bells-v1')return {basePaise:69900,originalPaise:159900,offerLabel:'Christmas Offer',tier:'premium'};
 if(templateId==='film-oonjal-v1')return {basePaise:29900,originalPaise:0,offerLabel:'',tier:'premium'};
 const free=isFreeVideo(templateId);
 return {basePaise:free?0:49900,originalPaise:free?0:99900,offerLabel:'',tier:'standard'};
}
export function videoQuote(templateId){
 const {basePaise}=videoOffer(templateId),taxPaise=Math.round(basePaise*VIDEO_GST_BPS/10000);
 return {basePaise,taxBps:basePaise?VIDEO_GST_BPS:0,taxPaise,totalPaise:basePaise+taxPaise,taxLabel:'GST',currency:VIDEO_CURRENCY};
}
