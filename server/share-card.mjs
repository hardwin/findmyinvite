import {reserved} from './core.mjs';
import {resolveShare,shareImageUrl} from './share-details.mjs';
import {shareDetails} from '../shared/share-preview.mjs';
export const STOREFRONT_STILL='/assets/findmyinvite-og.jpg';
export const TEMPLATE_STILLS={
 'rose-gold-blush-royal':'/assets/50122aee9f7395c4.jpg',
 'royal-majesty':'/assets/5a3bf145f59aa9c7.jpg',
 'modern-minimal-royal':'/assets/15b12cdf24c3ee92.jpg',
 'royal-prestige':'/assets/9b73577a4b10e8db.jpg',
 'royal-prestige-1':'/assets/royal-prestige-1.jpg',
 'royal-prestige-2':'/assets/royal-prestige-2.jpg',
 'royal-prestige-3':'/assets/royal-prestige-3.jpg',
 'royal-prestige-4':'/assets/royal-prestige-4.jpg',
 'royal-prestige-5':'/assets/royal-prestige-5.jpg',
 'royal-prestige-6':'/assets/royal-prestige-6.jpg',
 'royal-prestige-7':'/assets/royal-prestige-7.jpg',
 'royal-prestige-8':'/assets/royal-prestige-8.jpg',
 'royal-prestige-9':'/assets/royal-prestige-9.jpg',
 'royal-prestige-10':'/assets/royal-prestige-10.jpg',
 'royal-prestige-11':'/assets/royal-prestige-11.jpg',
 'royal-prestige-12':'/assets/royal-prestige-12.jpg',
 'royal-prestige-13':'/assets/royal-prestige-13.jpg',
 'royal-prestige-14':'/assets/royal-prestige-14.jpg',
 'royal-prestige-15':'/assets/royal-prestige-15.jpg',
 'royal-prestige-16':'/assets/royal-prestige-16.jpg',
 'royal-heritage':'/assets/3c934c61dec8899c.jpg',
 'royal-heritage-1':'/assets/royal-heritage-1.jpg',
 'royal-heritage-2':'/assets/royal-heritage-2.jpg',
 'royal-heritage-3':'/assets/royal-heritage-3.jpg',
 'royal-heritage-4':'/assets/royal-heritage-4.jpg',
 'royal-heritage-5':'/assets/royal-heritage-5.jpg',
 'royal-heritage-6':'/assets/royal-heritage-6.jpg',
 'royal-heritage-7':'/assets/royal-heritage-7.jpg',
 'royal-heritage-8':'/assets/royal-heritage-8.jpg',
 'royal-heritage-9':'/assets/royal-heritage-9.jpg',
 'royal-heritage-12':'/assets/royal-heritage-12.jpg',
 'royal-heritage-13':'/assets/royal-heritage-13.jpg',
 'royal-heritage-14':'/assets/royal-heritage-14.jpg',
 'royal-grace':'/assets/eaaba0b5d7aeba99.jpg',
 'royal-crest':'/assets/15cbf1df9056e121.jpg',
 'royal-legacy':'/assets/58bf76a6b043df9f.jpg',
 'emerald-noir':'/assets/emerald-hero.jpg',
 'luxury-pink':'/assets/emerald-hero.jpg',
 'ivory-elegance':'/assets/crimson-hero.jpg',
 'rose-gold-blush':'/assets/rose-hero.jpg',
 'modern-minimal':'/assets/emerald-hero.jpg',
 'royal-elegance':'/assets/9b73577a4b10e8db.jpg'
};
const slugPattern=/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
export function escapeHtml(value){
 return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
export function originFrom(req){
 if(process.env.VERCEL_ENV==='production')return 'https://findmyinvite.com';
 const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'findmyinvite.com').split(',')[0].trim();
 const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
 if(!/^[a-z0-9.-]+$/i.test(host))return 'https://findmyinvite.com';
 return (proto==='http'?'http':'https')+'://'+host;
}
export function stillFor(template){
 return TEMPLATE_STILLS[template]||STOREFRONT_STILL;
}
export function shareMetadata({origin,url,title,description,image,siteName='FindMyInvite',language='en',noindex=true}){
 const e=escapeHtml,t=e(title),d=e(description),u=e(url),i=e(new URL(image,origin).href);
 return `<title>${t}</title><meta name="description" content="${d}"/>${noindex?'<meta name="robots" content="noindex, nofollow"/>':''}<meta property="og:type" content="website"/><meta property="og:title" content="${t}"/><meta property="og:description" content="${d}"/><meta property="og:url" content="${u}"/><meta property="og:image" content="${i}"/><meta property="og:image:secure_url" content="${i}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:type" content="image/jpeg"/><meta property="og:image:alt" content="${t}"/><meta property="og:site_name" content="${e(siteName)}"/><meta property="og:locale" content="${e(language)}_IN"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${t}"/><meta name="twitter:description" content="${d}"/><meta name="twitter:image" content="${i}"/><meta name="twitter:image:alt" content="${t}"/><link rel="canonical" href="${u}"/>`;
}
export function sharePage(options){return `<!doctype html><html lang="${escapeHtml(options.language||'en')}"><head><meta charset="UTF-8"/>${shareMetadata(options)}</head><body><p>${escapeHtml(options.title)}</p><p>${escapeHtml(options.description)}</p></body></html>`;}
export function invitationMeta(origin,slug,share){return {origin,url:origin+'/'+slug,...share.details,siteName:share.details.names||share.details.label,image:shareImageUrl(slug,share.revision)};}
export function injectShareMetadata(html,options){return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi,'').replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'').replace('</head>',shareMetadata(options)+'</head>');}
export function storefrontShare(origin){
 return sharePage({
  origin,
  url:origin+'/',
  title:'Create Invitation Webpage Online for All Events | FindMyInvite',
  description:'Create stunning personalized invitation webpages with premium animated templates, music, maps and guest messaging.',
  image:STOREFRONT_STILL,
  noindex:false
 });
}
export function invitationShare(origin,slug,data){return sharePage(invitationMeta(origin,slug,{details:shareDetails(data,data?.template)}));}
export async function htmlForShare(req){
 const origin=originFrom(req),q=new URL(req.url,'https://findmyinvite.com').searchParams,slug=q.get('slug')||'';
 if(q.get('kind')==='brand'||!slugPattern.test(slug)||reserved.has(slug))return storefrontShare(origin);
 return sharePage(invitationMeta(origin,slug,await resolveShare(slug)));
}
