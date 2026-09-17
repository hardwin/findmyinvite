import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isGuestInvitationPath} from '../server/guest-page.mjs';
import {reserved,slugValue} from '../server/core.mjs';
import {designPages} from '../server/design-landings.mjs';
import {ctaHref} from '../server/occasion-landings.mjs';
const slugs=['anand-karaj','ardas','baraat','biya','biye','garba','haldi','hukamnama','kalyanam','lagan','lagna','maduve','mehndi','muhurtham','nikah','nikkah','pelli','punjabi','sangeet','shaadi','vivah'];
const designSlugs=['royal-imperial','royal-majesty','royal-elegance','royal-prestige','royal-heritage','royal-grace','royal-crest','royal-legacy','emerald-noir','crimson-royale','rose-gold-blush','modern-minimal','majestic-love'];
const skuBySlug={
 'royal-imperial':'rose-gold-blush-royal',
 'royal-majesty':'royal-majesty',
 'royal-elegance':'modern-minimal-royal',
 'royal-prestige':'royal-prestige',
 'royal-heritage':'royal-heritage',
 'royal-grace':'royal-grace',
 'royal-crest':'royal-crest',
 'royal-legacy':'royal-legacy',
 'emerald-noir':'emerald-noir',
 'crimson-royale':'ivory-elegance',
 'rose-gold-blush':'rose-gold-blush',
 'modern-minimal':'modern-minimal',
 'majestic-love':'royal-elegance'
};
test('21 P1 occasion LPs live under /invitations/{slug}, not apex guest paths',async()=>{
 const pages=await readFile(new URL('../server/occasion-landings.mjs',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 const sitemap=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');
 const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(slugs.length,21);
 assert.notEqual(slugs.indexOf('nikah'),slugs.indexOf('nikkah'));
 for(const slug of slugs){
  assert.match(pages,new RegExp("slug:'"+slug+"'"));
  assert.match(sitemap,new RegExp('https://findmyinvite.com/invitations/'+slug));
  assert.equal(sitemap.includes('https://findmyinvite.com/'+slug+'<'),false,slug+' must not be an apex sitemap URL');
  assert.equal(isGuestInvitationPath('/invitations/'+slug),false,slug);
  assert.equal(isGuestInvitationPath('/'+slug),true,slug+' apex remains a guest invitation path');
 }
 assert.match(pages,/tier:'royal'/);
 assert.match(pages,/tier:'classic'/);
 assert.match(pages,/templatesHref/);
 assert.equal(pages.includes('monthly searches'),false);
 assert.equal(pages.includes('search volume'),false);
 assert.equal(sitemap.includes('vercel.app'),false);
 assert.equal([...sitemap.matchAll(/https:\/\/findmyinvite.com\/invitations\/[a-z0-9-]+/g)].length,34);
 assert.match(app,/path\.startsWith\('\/invitations'\)\?<OccasionLanding\/>:\/\^\\\/\[a-z0-9\]\[a-z0-9-\]\{2,47\}\$\/\.test\(path\)\?<PublicInvitation slug=\{path\.slice\(1\)}\/>/);
 assert.match(app,/import OccasionLanding from '\.\/OccasionLanding'/);
 assert.equal(reserved.has('invitations'),true);
 assert.throws(()=>slugValue('invitations'));
 assert.equal(isGuestInvitationPath('/invitations'),false);
 assert.equal(isGuestInvitationPath('/templates'),false);
 const guestRewrite=vercel.rewrites.find(rule=>rule.destination==='/api/guest-page?slug=:slug');
 assert.equal(guestRewrite.source,'/:slug([a-z0-9][a-z0-9-]{2,47})');
 assert.equal(guestRewrite.source.includes('*'),false);
 const spa=vercel.rewrites.find(rule=>rule.destination==='/index.html');
 const spaPattern=new RegExp(`^${spa.source}$`);
 assert.equal(spaPattern.test('/invitations/haldi'),false);
 assert.equal(spaPattern.test('/invitations/nikkah'),false);
 const invitationRewrite=vercel.rewrites.find(rule=>rule.destination==='/api/invitation-page?slug=:slug');
 assert.equal(invitationRewrite.source,'/invitations/:slug');
 const noindex=vercel.headers.find(rule=>rule.headers?.some(header=>header.key==='X-Robots-Tag'&&header.value.includes('noindex')&&rule.source.includes('templates')));
 assert.match(noindex.source,/invitations\(\?:\/\.\*\)\?\$/);
 const landing=await readFile(new URL('../src/OccasionLanding.tsx',import.meta.url),'utf8');
 assert.match(landing,/ctaHref\(page\)/);
 assert.match(landing,/templatesHref\(otherTier\)/);
 assert.match(landing,/page\.h1/);
 assert.match(landing,/page\.cta/);
 assert.match(landing,/page\.switchCopy/);
 assert.equal(landing.includes('PublicInvitation'),false);
});
test('13 live FMI design LPs share /invitations/{slug} HTML, sitemap, and catalog SKU CTAs',async()=>{
 const designs=await readFile(new URL('../server/design-landings.mjs',import.meta.url),'utf8');
 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 const sitemap=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');
 const robots=await readFile(new URL('../public/robots.txt',import.meta.url),'utf8');
 assert.equal(designSlugs.length,13);
 assert.equal(designPages.length,13);
 assert.equal(designs.includes('Royal Temple'),false);
 assert.match(robots,/Disallow: \/akay/);
 for(const slug of designSlugs){
  const page=designPages.find(item=>item.slug===slug);
  assert.equal(Boolean(page),true,slug);
  assert.equal(page.templateId,skuBySlug[slug],slug+' sku');
  assert.match(designs,new RegExp("slug:'"+slug+"'"));
  assert.match(sitemap,new RegExp('https://findmyinvite.com/invitations/'+slug));
  assert.equal(sitemap.includes('https://findmyinvite.com/'+slug+'<'),false,slug+' must not be an apex sitemap URL');
  assert.equal(isGuestInvitationPath('/invitations/'+slug),false,slug);
  assert.equal(isGuestInvitationPath('/'+slug),true,slug+' apex remains a guest invitation path');
  assert.equal(ctaHref(page),'/create?template='+page.templateId+'&type=wedding',slug);
  assert.match(data,new RegExp("id:'"+page.templateId+"'"));
 }
 assert.equal(ctaHref({tier:'classic'}),'/templates?collection=classic&type=wedding');
});
