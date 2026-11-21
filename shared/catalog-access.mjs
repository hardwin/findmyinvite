// Source-scoped policy: Digital Yes and legacy websites retain their own pricing.
export const FREE_WEBSITE_IDS = Object.freeze([
 'kerala-lanterns','christian-bells','moonlit-nikah',
 'theeram','thiruvarul','kalyana-payanam',
 'midnight-stage','little-blessing','noir-and-gold','golden-hour',
 'pearl-and-sapphire','royal-crimson','garden-curtains','pulli','pattu','olai',
 'jasmine-arch','palace-of-lights','the-ring-box','home-sweet-home','up-and-away','temple-doors',
]);
export const isFreeWebsite = id => FREE_WEBSITE_IDS.includes(id);
export const freeWebsiteQuote = () => ({basePaise:0,taxPaise:0,taxBps:0,totalPaise:0,currency:'INR',months:6,taxLabel:'GST'});
