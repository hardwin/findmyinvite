import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedShare,shareImageUrl} from '../server/share-details.mjs';
import {shareDetails,sharePhoto,shareCardHtml,SHARE_STYLES} from '../shared/share-preview.mjs';
import {injectShareMetadata,invitationMeta} from '../server/share-card.mjs';
import {ownedSharePhoto,buildShareImage} from '../server/share-image.mjs';
import imageHandler from '../api/share-image.mjs';
const row={id:'test',slug:'test-couple',owner_id:'owner',published:true,expires_at:'2099-01-01',template_version_id:'v1',published_revision:2,data:{template:'ivory-lace',bride:'Legacy'},published_content:{bride:'Ashok',groom:'Kumar',date:'2026-11-26',venue:'Wedding Hall'},draft_content:{bride:'PRIVATE NAME'}};
test('a failed photo produces personalised artwork, reports failure and can retry successfully',async()=>{
 const share={...publishedShare(row),content:{cover:'/api/template-media?id=12345678-1234-1234-1234-123456789abc'}};let reports=0;
 const fallback=await buildShareImage(share,{loadPhoto:async()=>{throw Error('unavailable');},render:async details=>Buffer.from(details.names),report:async()=>{reports++;}});
 assert.equal(fallback.fallback,true);assert.equal(fallback.bytes.toString(),'Ashok & Kumar');assert.equal(reports,1);
 const success=await buildShareImage(share,{loadPhoto:async()=> 'image',render:async(details,photo)=>Buffer.from(photo),report:async()=>{reports++;}});
 assert.equal(success.fallback,false);assert.equal(success.bytes.toString(),'image');assert.equal(reports,1);
});
test('published resolver never leaks drafts, and card revision changes only with published changes',()=>{
 const first=publishedShare(row);assert.equal(first.details.names,'Ashok & Kumar');assert.equal(publishedShare({...row,draft_content:{bride:'OTHER PRIVATE NAME'}}).revision,first.revision);
 assert.notEqual(publishedShare({...row,published_revision:3}).revision,first.revision);
 assert.equal(JSON.stringify(first.details).includes('PRIVATE'),false);
 assert.equal(publishedShare({...row,template_version_id:null,data:{groom:'Legacy',bride:'Couple'}}).details.names,'Legacy & Couple');
 for(const patch of [{published:false},{deleted_at:'2026-01-01'},{expires_at:'2020-01-01'},{expires_at:null},{expires_at:'invalid'},{published_content:null}])assert.throws(()=>publishedShare({...row,...patch}),/unavailable/);
});
test('each template and language produces personal text and a controlled card, with and without a photo',()=>{
 for(const template of Object.keys(SHARE_STYLES))for(const language of ['en','ml','ta','te','kn','hi']){
  const info=shareDetails({...row.published_content,language},template);assert.ok(info.title.includes('Ashok'));assert.ok(info.date.includes('2026'));assert.ok(info.description.includes('Wedding Hall'));assert.equal(info.language,language);
  for(const photo of ['', 'data:image/jpeg;base64,a']){const html=shareCardHtml(info,{photo});assert.ok(html.includes(info.names.replace('&','&amp;')));assert.equal(html.includes('FindMyInvite'),false);assert.equal(html.includes('class="photo"'),!!photo);}
 }
});
test('names follow invitation order and incomplete details are omitted',()=>{
 assert.equal(shareDetails(row.published_content,'christian-bells').names,'Kumar & Ashok');
 for(const template of ['theeram','thiruvarul','kalyana-payanam'])assert.equal(shareDetails(row.published_content,template).names,'Ashok & Kumar');
 assert.equal(shareDetails({...row.published_content,nameOrder:'bride_first'},'theeram').names,'Ashok & Kumar');
 assert.equal(shareDetails({date:'2026-02-30'}).date,'');
 assert.equal(shareDetails({}).description.includes('undefined'),false);
 assert.equal(shareDetails({events:[{venue:'Chapel'}]}).venue,'Chapel');
});
test('only main uploaded customer photo is selected; artwork choice overrides it',()=>{
 const cover='/api/template-media?id=12345678-1234-1234-1234-123456789abc';
 assert.equal(sharePhoto({cover}),cover);assert.equal(sharePhoto({cover,_form:{shareArtwork:true}}),null);
 for(const cover of ['/assets/demo-couple.jpg','https://example.com/photo.jpg','http://127.0.0.1/private','javascript:alert(1)'])assert.equal(sharePhoto({cover}),null);
 assert.equal(sharePhoto({venueImage:cover,locationImage:cover}),null);
});
test('initial HTML replaces storefront metadata, escapes text and has HTTPS large image tags',()=>{
 const share=publishedShare({...row,published_content:{...row.published_content,bride:'A <script> & "B"'}});
 const html=injectShareMetadata('<html><head><title>FMI</title><meta property="og:title" content="FMI"><meta name="twitter:image" content="old"><link rel="canonical" href="old"></head><body><div id="root"></div></body></html>',invitationMeta('https://findmyinvite.com',row.slug,share));
 assert.equal((html.match(/property="og:title"/g)||[]).length,1);assert.equal(html.includes('<script>'),false);assert.equal(html.includes('content="FMI"'),false);assert.match(html,/og:image:width" content="1200/);assert.match(html,/twitter:card" content="summary_large_image/);assert.ok(html.includes('https://findmyinvite.com/share-images/test-couple/'));assert.ok(html.includes('id="root"'));
 assert.equal(shareImageUrl(row.slug,share.revision).includes('/2-'),true);
});
test('foreign, template-owned and non-ready photos cannot render',async()=>{
 const oldFetch=global.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;Object.assign(process.env,{SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test'});
 try{for(const media of [{invitation_id:'other',owner_id:'owner'},{invitation_id:null,owner_id:'owner'},{invitation_id:'test',owner_id:'other'},{invitation_id:'test',owner_id:'owner',status:'pending'}]){
  global.fetch=async()=>Response.json([{kind:'image',status:'ready',content_type:'image/jpeg',...media}]);
  await assert.rejects(ownedSharePhoto({...publishedShare(row),content:{cover:'/api/template-media?id=12345678-1234-1234-1234-123456789abc'}}),/Unverified/);
 }}finally{global.fetch=oldFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
test('public image GET and HEAD reject expired and deleted records before accessing storage',async()=>{
 const oldFetch=global.fetch,env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test'});
 try{for(const method of ['GET','HEAD'])for(const patch of [{published:false},{deleted_at:'2026-01-01'},{expires_at:'2000-01-01'}]){
  global.fetch=async()=>Response.json([{...row,...patch}]);const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;},end(){}};
  await imageHandler({url:'/api/share-image?slug=test-couple',method,headers:{}},res);assert.equal(res.code,404);assert.equal(JSON.stringify(res.body).includes('Ashok'),false);
 }}finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
