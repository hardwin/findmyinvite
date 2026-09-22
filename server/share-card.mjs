import {invitation} from './core.mjs';
export const STOREFRONT_STILL='/assets/50122aee9f7395c4.jpg';
export const TEMPLATE_STILLS={
 'rose-gold-blush-royal':'/assets/50122aee9f7395c4.jpg',
 'royal-majesty':'/assets/5a3bf145f59aa9c7.jpg',
 'modern-minimal-royal':'/assets/15b12cdf24c3ee92.jpg',
 'royal-prestige':'/assets/9b73577a4b10e8db.jpg',
 'royal-prestige-1':'/assets/royal-prestige-1.jpg',
 'royal-prestige-2':'/assets/royal-prestige-2.jpg',
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
 const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'findmyinvite.com').split(',')[0].trim();
 const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
 if(!/^[a-z0-9.-]+$/i.test(host))return 'https://findmyinvite.com';
 return (proto==='http'?'http':'https')+'://'+host;
}
export function stillFor(template){
 return TEMPLATE_STILLS[template]||STOREFRONT_STILL;
}
export function sharePage({origin,url,title,description,image,noindex=true}){
 const t=escapeHtml(title),d=escapeHtml(description),u=escapeHtml(url),i=escapeHtml(origin+image);
 return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><title>${t}</title><meta name="description" content="${d}"/>${noindex?'<meta name="robots" content="noindex, nofollow"/>':''}<meta property="og:type" content="website"/><meta property="og:title" content="${t}"/><meta property="og:description" content="${d}"/><meta property="og:url" content="${u}"/><meta property="og:image" content="${i}"/><meta property="og:site_name" content="FindMyInvite"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${t}"/><meta name="twitter:description" content="${d}"/><meta name="twitter:image" content="${i}"/><link rel="canonical" href="${u}"/></head><body><p>${t}</p><p>${d}</p><p><a href="${u}">Open invitation</a></p></body></html>`;
}
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
export function invitationShare(origin,slug,data){
 const groom=String(data?.groom||'').slice(0,100);
 const bride=String(data?.bride||'').slice(0,100);
 const title=groom&&bride?`${groom} & ${bride}`:'You are invited';
 return sharePage({
  origin,
  url:`${origin}/${slug}`,
  title,
  description:'You are invited. Open this link to view the invitation.',
  image:stillFor(data?.template),
  noindex:true
 });
}
export async function htmlForShare(req){
 const origin=originFrom(req);
 const slug=new URL(req.url,'https://findmyinvite.com').searchParams.get('slug')||'';
 if(!slugPattern.test(slug))return storefrontShare(origin);
 try{
  const row=await invitation(slug);
  return invitationShare(origin,slug,row.data||{});
 }catch{
  return storefrontShare(origin);
 }
}
