import {isFreeVideo} from './video-access.mjs';
import {ANBIL_AVAN_ID} from './anbil-avan-video.mjs';
// Base price per saved invitation. GST is added at checkout; edits and retries are included.
export const VIDEO_PRICE_PAISE = 0;
export const VIDEO_CURRENCY = 'INR';
export const VIDEO_GST_BPS = 1800;
export const BLACK_FRIDAY_START = Date.parse('2026-11-26T17:10:00Z');
export const BLACK_FRIDAY_END = BLACK_FRIDAY_START + 48 * 60 * 60 * 1000;

export function videoOffer(templateId, now = Date.now()){
 if(templateId==='wedding-bells-v1')return {basePaise:69900,originalPaise:159900,offerLabel:'Christmas Offer',tier:'premium'};
 if(['film-oonjal-v1','film-were-next-v1'].includes(templateId))return {basePaise:29900,originalPaise:0,offerLabel:'',tier:'premium'};
 if(templateId===ANBIL_AVAN_ID){
  const active=now>=BLACK_FRIDAY_START&&now<BLACK_FRIDAY_END;
  return {basePaise:29900,originalPaise:active?69900:0,offerLabel:active?'Black Friday offer':'',tier:'premium'};
 }
 const free=isFreeVideo(templateId);
 return {basePaise:free?0:49900,originalPaise:free?0:99900,offerLabel:'',tier:'standard'};
}
export function videoQuote(templateId, now = Date.now()){
 const {basePaise}=videoOffer(templateId,now),taxPaise=Math.round(basePaise*VIDEO_GST_BPS/10000);
 return {basePaise,taxBps:basePaise?VIDEO_GST_BPS:0,taxPaise,totalPaise:basePaise+taxPaise,taxLabel:'GST',currency:VIDEO_CURRENCY};
}
