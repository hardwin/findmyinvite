import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/share.mjs';
import {escapeHtml,invitationShare,stillFor,storefrontShare,STOREFRONT_STILL} from '../server/share-card.mjs';
import {templates} from '../server/core.mjs';
async function request(url,headers={}){
 const res={headers:{},body:'',code:0,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=typeof b==='string'?b:JSON.stringify(b);},end(b){this.body=b;if(!this.code)this.code=this.statusCode||200;}};
 await handler({url,method:'GET',headers:{host:'findmyinvite.com','x-forwarded-proto':'https',...headers}},res);
 return res;
}
test('share cards escape names and use a public template still, never guest photos',()=>{
 const html=invitationShare('https://findmyinvite.com','ashok-supriya',{groom:'Ashok <script>',bride:'Supriya & Co',template:'royal-prestige'});
 assert.match(html,/og:title" content="Ashok &lt;script&gt; &amp; Supriya &amp; Co"/);
 assert.equal(html.includes('<script>'),false);
 assert.equal(html.includes('Ashok <script>'),false);
 assert.match(html,/og:image" content="https:\/\/findmyinvite.com\/assets\/9b73577a4b10e8db\.jpg"/);
 assert.equal(html.includes('/api/media'),false);
 assert.equal(stillFor('emerald-noir'),'/assets/emerald-hero.jpg');
 assert.equal(stillFor('unknown-design'),STOREFRONT_STILL);
});
test('unpublished or unknown slugs fall back to the storefront card',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 global.fetch=async()=>new Response(JSON.stringify([]),{status:200});
 try{
  const missing=await request('/api/share?slug=akay-test-1');
  assert.equal(missing.code,200);
  assert.match(String(missing.body),/og:image" content="https:\/\/findmyinvite.com\/assets\/50122aee9f7395c4\.jpg"/);
  assert.match(String(missing.body),/FindMyInvite/);
  assert.equal(String(missing.body).includes('akay-test-1'),false);
  const reserved=await request('/api/share?slug=templates');
  assert.match(String(reserved.body),/Create Invitation Webpage/);
 }finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
});
test('published invitations get couple names and the matching still',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 global.fetch=async()=>new Response(JSON.stringify([{slug:'veer-zara',published:true,expires_at:'2099-01-01T00:00:00Z',data:{groom:'Veer',bride:'Zara',template:'rose-gold-blush'}}]),{status:200});
 try{
  const res=await request('/api/share?slug=veer-zara');
  assert.equal(res.code,200);
  assert.equal(res.headers['Content-Type'],'text/html; charset=utf-8');
  assert.match(String(res.body),/og:title" content="Veer &amp; Zara"/);
  assert.match(String(res.body),/og:image" content="https:\/\/findmyinvite.com\/assets\/rose-hero\.jpg"/);
  assert.match(String(res.body),/noindex/);
 }finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
});
test('every catalog template has a share still and the storefront HTML advertises one',async()=>{
 for(const id of templates)assert.match(stillFor(id),/^\/assets\/[a-z0-9-]+\.(jpg|png)$/);
 const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(index,/property="og:image" content="https:\/\/findmyinvite.com\/assets\/50122aee9f7395c4\.jpg"/);
 assert.match(index,/name="twitter:image" content="https:\/\/findmyinvite.com\/assets\/50122aee9f7395c4\.jpg"/);
 const vercel=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.ok(vercel.rewrites.some(rule=>rule.destination==='/api/share?slug=:slug'&&/WhatsApp/.test(rule.has?.[0]?.value||'')));
 const invitation=await readFile(new URL('../src/Invitation.tsx',import.meta.url),'utf8');
 assert.match(invitation,/Made with/);
 assert.match(invitation,/Share on WhatsApp/);
 assert.match(invitation,/!cloudData&&<a className="use-design"/);
 assert.match(invitation,/Use this Design/);
 const guest=await readFile(new URL('../src/GuestPages.tsx',import.meta.url),'utf8');
 assert.equal(guest.includes('Share on WhatsApp'),true);
 assert.equal(escapeHtml('A & B <C>'),'A &amp; B &lt;C&gt;');
 assert.match(storefrontShare('https://findmyinvite.com'),/og:image" content="https:\/\/findmyinvite.com\/assets\/50122aee9f7395c4\.jpg"/);
});
