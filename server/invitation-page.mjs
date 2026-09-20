import {escapeHtml,STOREFRONT_STILL} from './share-card.mjs';
import {ctaHref,demoHref,occasionBySlug,relatedLabel,templatesHref} from './occasion-landings.mjs';
export const CANONICAL_ORIGIN='https://findmyinvite.com';
export const PAGE_HEADER='x-fmi-invitation-page';
const slugPattern=/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])?$/;
const css='body{margin:0;background:#f8f6f1;color:#2b2e36;font-family:Georgia,serif}a{color:#8f6a2e}nav,footer{padding:18px 24px;text-align:center}nav a.brand{font-size:28px;color:#b88e40;text-decoration:none}main{max-width:760px;margin:0 auto;padding:24px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;margin:16px 0}h2{font-size:24px;margin:36px 0 12px}p,li{line-height:1.8;color:#655d53}section{margin:28px 0}.cta{display:inline-block;margin:8px 8px 8px 0;padding:13px 26px;background:#b88e40;color:#fff9e9;text-decoration:none;border-radius:7px}.cta.outline{background:transparent;color:#ad8237;border:1px solid #b88e40}.tier{display:inline-block;padding:6px 12px;border:1px solid #d8c59d;border-radius:20px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8f6a2e}.related a{display:inline-block;margin:6px 8px 0 0;padding:7px 14px;border:1px solid #d8c59f;border-radius:20px;text-decoration:none}.switch{border:1px solid #d8c59d;border-radius:14px;padding:18px 20px;background:#fff9ee}details{border-bottom:1px solid #dcd3c1;padding:16px 0}';
export const NOT_FOUND_HTML='<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Invitation page not found | FindMyInvite</title><meta name="robots" content="noindex, nofollow"/><meta name="description" content="This invitation landing page is not available."/></head><body><h1>Page not found</h1><p>This invitation landing page is not available.</p><p><a href="'+CANONICAL_ORIGIN+'/templates">Browse invitation templates</a></p></body></html>';
export function invitationSlugFromRequest(req){
 const url=new URL(req.url,'https://findmyinvite.com');
 const query=url.searchParams.get('slug');
 if(typeof query==='string'&&query)return query;
 const parts=url.pathname.split('/').filter(Boolean);
 if(parts[0]==='invitations')return parts[1]||'';
 return '';
}
export function pageHeaders(found){
 const headers={'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',[PAGE_HEADER]:found?'hit':'404'};
 if(found)headers['Cache-Control']='public, max-age=60, s-maxage=300';
 else{headers['Cache-Control']='no-store';headers['X-Robots-Tag']='noindex, nofollow';}
 return headers;
}
function applyHeaders(res,headers){for(const [key,value] of Object.entries(headers))res.setHeader(key,value);}
export function invitationPageHtml(page){
 const url=CANONICAL_ORIGIN+'/invitations/'+page.slug;
 const image=CANONICAL_ORIGIN+STOREFRONT_STILL;
 const other=page.tier==='royal'?'classic':'royal';
 const t=escapeHtml(page.title);
 const d=escapeHtml(page.description);
 const h1=escapeHtml(page.h1);
 const cta=escapeHtml(page.cta);
 const related=page.related.map(href=>'<a href="'+escapeHtml(href)+'">'+escapeHtml(relatedLabel(href))+'</a>').join('');
 const faqs=page.faqs.map(([q,a])=>'<details><summary>'+escapeHtml(q)+'</summary><p>'+escapeHtml(a)+'</p></details>').join('');
 return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${t}</title><meta name="description" content="${d}"/><link rel="canonical" href="${escapeHtml(url)}"/><meta property="og:type" content="website"/><meta property="og:title" content="${t}"/><meta property="og:description" content="${d}"/><meta property="og:url" content="${escapeHtml(url)}"/><meta property="og:image" content="${escapeHtml(image)}"/><meta property="og:site_name" content="FindMyInvite"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${t}"/><meta name="twitter:description" content="${d}"/><meta name="twitter:image" content="${escapeHtml(image)}"/><style>${css}</style></head><body>
<nav><a class="brand" href="/">FindMyInvite</a></nav>
<main>
<p class="tier">FindMyInvite ${escapeHtml(page.tier==='royal'?'Royal':'Classic')}</p>
<h1>${h1}</h1>
<p>${escapeHtml(page.hero)}</p>
<p><a class="cta" href="${escapeHtml(ctaHref(page))}">${cta}</a><a class="cta outline" href="${escapeHtml(demoHref(page))}">View live demo</a></p>
<p>Personalise, preview, and share the public link on WhatsApp. Guests open it with no account.</p>
<section><h2>What a ${escapeHtml(page.name)} invitation webpage includes</h2><p>${escapeHtml(page.includes)}</p></section>
<section><h2>Who this ${escapeHtml(page.name)} invitation is for</h2><p>${escapeHtml(page.who)}</p></section>
<section><h2>How to personalise, preview, and share on WhatsApp</h2><p>${escapeHtml(page.how)}</p>
<div class="switch"><p>${escapeHtml(page.switchCopy)}</p><p><a class="cta outline" href="${escapeHtml(templatesHref(other))}">Browse ${other==='royal'?'Premium':'Free'} templates</a></p></div></section>
<section class="related"><h2>Keep planning the wedding</h2><p>${related}</p></section>
<section><h2>Frequently asked questions</h2>${faqs}</section>
<section><h2>${cta}</h2><p>${page.templateId?'Start from this live FindMyInvite template, then switch collections if you want a different look — without a second landing URL.':'Start from '+(page.tier==='royal'?'Royal':'Classic')+' templates, then switch collections if you want a different look — without a second landing URL.'}</p><p><a class="cta" href="${escapeHtml(ctaHref(page))}">${cta}</a></p></section>
</main>
<footer><p><a href="/">FindMyInvite home</a> · <a href="/templates">Invitation templates</a></p></footer>
</body></html>`;
}
export function invitationDecision(slug){
 if(typeof slug!=='string'||!slugPattern.test(slug)||!occasionBySlug[slug])return {found:false,slug:typeof slug==='string'?slug:''};
 return {found:true,slug,page:occasionBySlug[slug]};
}
export function writeInvitationPage(req,res,decision=invitationDecision(invitationSlugFromRequest(req))){
 const headers=pageHeaders(decision.found);
 res.statusCode=decision.found?200:404;
 applyHeaders(res,headers);
 if(typeof res.status==='function')res.status(res.statusCode);
 if(req.method==='HEAD'){res.end();return true;}
 res.end(decision.found?invitationPageHtml(decision.page):NOT_FOUND_HTML);
 return true;
}
