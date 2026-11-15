// Base price per saved invitation. GST is added at checkout; edits and retries are included.
export const VIDEO_PRICE_PAISE = 49900;
export const VIDEO_CURRENCY = 'INR';
export const VIDEO_GST_BPS = 1800;
export function videoQuote(){
 const taxPaise=Math.round(VIDEO_PRICE_PAISE*VIDEO_GST_BPS/10000);
 return {basePaise:VIDEO_PRICE_PAISE,taxBps:VIDEO_GST_BPS,taxPaise,totalPaise:VIDEO_PRICE_PAISE+taxPaise,taxLabel:'GST',currency:VIDEO_CURRENCY};
}
