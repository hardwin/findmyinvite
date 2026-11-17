// Base price per saved invitation. GST is added at checkout; edits and retries are included.
export const VIDEO_PRICE_PAISE = 49900;
export const VIDEO_CURRENCY = 'INR';
export const VIDEO_GST_BPS = 1800;
export function videoOffer(templateId){
 return templateId==='wedding-bells-v1'
  ?{basePaise:69900,originalPaise:159900,offerLabel:'Christmas Offer',tier:'premium'}
  :{basePaise:VIDEO_PRICE_PAISE,originalPaise:99900,offerLabel:'',tier:'standard'};
}
export function videoQuote(templateId){
 const {basePaise}=videoOffer(templateId),taxPaise=Math.round(basePaise*VIDEO_GST_BPS/10000);
 return {basePaise,taxBps:VIDEO_GST_BPS,taxPaise,totalPaise:basePaise+taxPaise,taxLabel:'GST',currency:VIDEO_CURRENCY};
}
