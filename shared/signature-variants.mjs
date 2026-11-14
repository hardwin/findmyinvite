// Versioned visual variants. Old renderer IDs never opt into a new treatment.
/** @type {Record<string, {template:string,baseRenderer:string,revision:string,stylesheet:string,poster:string,accent:string,document?:string,sage?:string,divider?:string}>} */
export const SIGNATURE_VARIANTS={
 'golden-hour-v2':{template:'golden-hour',baseRenderer:'golden-hour-v1',revision:'signature-v1',document:'/assets/signature-v1/golden-hour/document.json',stylesheet:'/assets/signature-v1/golden-hour/style.css',poster:'/assets/signature-v1/golden-hour/poster.webp',accent:'#BFA16C'},
 'jasmine-arch-v2':{template:'jasmine-arch',baseRenderer:'jasmine-arch-v1',revision:'signature-v1',document:'/assets/signature-v1/jasmine-arch/document.json',stylesheet:'/assets/signature-v1/jasmine-arch/style.css',poster:'/assets/signature-v1/jasmine-arch/poster.webp',accent:'#BEA16A'},
 'christian-editorial-v3':{template:'christian-bells',baseRenderer:'christian-editorial-v2',revision:'signature-v1',stylesheet:'/assets/signature-v1/christian-bells/style.css',poster:'/assets/signature-v1/christian-bells/poster.webp',accent:'#A88B50',sage:'#536B5B',divider:'/assets/signature-v1/christian-bells/divider.svg#orn'}
};
export const SIGNATURE_RENDERERS=Object.keys(SIGNATURE_VARIANTS);
export const SIGNATURE_CINOREV_RENDERERS=SIGNATURE_RENDERERS.filter(id=>SIGNATURE_VARIANTS[id].document);
