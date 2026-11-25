import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import handler from '../api/template-share.mjs';
import {templateShareRequest,templateShareOrigin,publicTemplateAsset,templateShareData,resolveTemplateShare,injectTemplateShareMetadata} from '../server/template-share.mjs';
import {renderTemplateShareImage} from '../server/template-share-image.mjs';
import {templateShareUrl,templateShareImagePath} from '../shared/template-sharing.mjs';
import {templateShareCardHtml} from '../shared/template-share-card.mjs';

const row={id:'wedding-bells-v1',name:'Wedding Bells',poster:'/assets/video-masters/wedding-bells-v1/poster-tracked-v1.jpg',preview:'/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-v1.mp4',quote:{basePaise:69900},originalPaise:159900,offerLabel:'Christmas Offer',templateCode:'FMI#0109',microDescription:'Sunlit church romance',duration:28};
const params=(id=row.id,kind='video')=>new URLSearchParams({product:id,kind});

test('share requests reject private routes, arbitrary assets and malformed identifiers',()=>{
 for(const id of ['', '../private','x&select=*','https://example.com'])assert.throws(()=>templateShareRequest(params(id)));
 assert.throws(()=>templateShareRequest(params(row.id,'draft')));
 assert.throws(()=>templateShareUrl('/video-personalise?draft=secret'));
 for(const asset of ['https://evil.test/a.jpg','//evil.test/a.jpg','/assets/../secret','/api/media?id=private','/assets/x.jpg?url=secret'])assert.equal(publicTemplateAsset(asset),false);
 assert.equal(publicTemplateAsset(row.poster),true);
 assert.equal(publicTemplateAsset('/api/template-media?id=12345678-1234-1234-1234-123456789abc'),true);
 const link=templateShareUrl('/templates?product=wedding-bells-v1&kind=video&draft=secret&token=private');
 assert.ok(link.includes('share=card-v1'));assert.ok(!/secret|private/.test(link));
 assert.equal(templateShareOrigin({headers:{host:'attacker.test'}}),'https://findmyinvite.com');
});

test('only public catalogue entries resolve and private fields never enter sharing data',async()=>{
 const entry=await resolveTemplateShare(params(),'https://findmyinvite.com',async()=>({templates:[{...row,owner_id:'PRIVATE-OWNER',management_hash:'PRIVATE-KEY',draft:'PRIVATE-DRAFT'}]}));
 assert.ok(!JSON.stringify(entry).includes('PRIVATE'));
 await assert.rejects(resolveTemplateShare(params('unknown-template'),'https://findmyinvite.com',async()=>({templates:[row]})),{status:404});
 assert.throws(()=>templateShareData({...row,poster:'https://evil.test/image.jpg'},'video'),{status:503});
});

test('server HTML has one specific preview, no stale homepage tags, and escaped content',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const entry=templateShareData({...row,name:'Wedding <Bells> & Love'},'video');
 const result=injectTemplateShareMetadata(html,entry,'https://findmyinvite.com');
 assert.equal((result.match(/property="og:image" /g)||[]).length,1);
 assert.equal((result.match(/property="og:title" /g)||[]).length,1);
 assert.ok(result.includes('Wedding &lt;Bells&gt; &amp; Love'));
 assert.ok(!result.includes('<Bells>'));
 assert.ok(!result.includes('findmyinvite-og.jpg'));
 assert.match(result,/og:video:type" content="video\/mp4/);
 assert.match(result,/template-share-images\/video\/wedding-bells-v1\/[a-f0-9]{16}\.jpg/);
 assert.ok(result.indexOf('og:image')<300000);
 assert.match(result,/₹699 \+ applicable tax/);
 assert.ok(result.includes('<div id="root"></div>'),'Normal browser app remains in the HTML');
 const website=templateShareData({id:'website-v1',name:'Wedding website',thumbnail:row.poster,templateCode:'FMI#0001'},'website');
 const websiteHtml=injectTemplateShareMetadata(html,website,'https://findmyinvite.com');
 assert.ok(!websiteHtml.includes('og:video'));assert.match(websiteHtml,/₹199/);
 for(const change of [{name:'New title'},{microDescription:'A new description'},{quote:{basePaise:79900}},{originalPaise:199900},{offerLabel:'New offer'},{poster:'/assets/new-poster.jpg'},{current_version_id:'new-artwork-version'}])assert.notEqual(templateShareData({...row,...change},'video').revision,templateShareData(row,'video').revision);
});

test('generated preview is a small JPEG with the recommended landscape dimensions',async()=>{
 const entry=templateShareData(row,'video'),poster=await readFile(new URL('../public'+row.poster,import.meta.url));
 const bytes=await renderTemplateShareImage(entry,poster),meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'jpeg');assert.equal(meta.width,1200);assert.equal(meta.height,630);
 assert.ok(bytes.length<600000);assert.ok(bytes.length>10000);
});

test('public HTML/image handlers work for crawlers and HEAD without session credentials',async()=>{
 const originalFetch=global.fetch;let port=52701;
 const keys=['VIDEO_PERSONALISE_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{VIDEO_PERSONALISE_ENABLED:'1',SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'TEST-SERVICE-ONLY'});
 global.fetch=async(url,options)=>{
  const parsed=new URL(url);
  if(parsed.hostname==='database.test'){assert.equal(options.headers.Authorization,'Bearer TEST-SERVICE-ONLY');return Response.json([]);}
  assert.ok(!options?.headers?.authorization&&!options?.headers?.cookie);
  assert.equal(parsed.hostname,'127.0.0.1');
  if(parsed.pathname===row.poster)return new Response(await readFile(new URL('../public'+row.poster,import.meta.url)),{headers:{'Content-Type':'image/jpeg'}});
  throw Error('Unexpected fetch: '+url);
 };
 async function request(url,method='GET',agent='WhatsApp/2.2236.3 N'){
  const res={headers:{},statusCode:0,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(data){this.body=data;},end(data){this.body=data;}};
  await handler({url,method,headers:{'user-agent':agent,host:'attacker.test',authorization:'Bearer PRIVATE'},socket:{localPort:port++}},res);return res;
 }
 try{
  for(const agent of ['WhatsApp/2.2236.3 N','facebookexternalhit/1.1','Mozilla/5.0']){
   const res=await request('/api/template-share?product=wedding-bells-v1&kind=video','GET',agent);
   assert.equal(res.statusCode,200);assert.match(res.body,/Wedding Bells · Invitation Video/);assert.ok(!res.body.includes('PRIVATE'));assert.ok(!res.body.includes('attacker.test'));
  }
  const image=await request('/api/template-share?format=image&kind=video&product=wedding-bells-v1');assert.equal(image.statusCode,200);assert.equal(image.headers['Content-Type'],'image/jpeg');assert.ok(Buffer.isBuffer(image.body));
  const head=await request('/api/template-share?product=wedding-bells-v1&kind=video','HEAD');assert.equal(head.statusCode,200);assert.equal(head.body,undefined);
  const missing=await request('/api/template-share?product=missing-video&kind=video');assert.equal(missing.statusCode,404);assert.equal(missing.headers['Cache-Control'],'no-store');
  const denied=await request('/api/template-share?product=wedding-bells-v1&kind=video','POST');assert.equal(denied.statusCode,405);
 }finally{global.fetch=originalFetch;for(const k of keys)if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}
});

test('template routing precedes the generic brand crawler rule and bundles renderer assets',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const page=config.rewrites.findIndex(rule=>rule.source==='/templates'&&rule.has?.some(condition=>condition.key==='product'));
 const generic=config.rewrites.findIndex(rule=>rule.destination==='/api/share?slug=:slug');
 assert.ok(page>=0&&page<generic);assert.equal(config.rewrites[page].destination,'/api/template-share');
 assert.ok(config.rewrites.some(rule=>rule.source==='/template-share-images/:kind/:product/:revision.jpg'));
 assert.match(config.functions['api/template-share.mjs'].includeFiles,/dist\/index.html/);
 assert.ok(config.functions['api/template-share.mjs'].includeFiles.includes('fonts/{discovery/*,share/*}'));
 assert.ok(config.functions['api/template-share.mjs'].includeFiles.includes('video-masters/*/manifest*.json'));
 assert.equal(templateShareImagePath('/templates?product=wedding-bells-v1&kind=video'),'/template-share-images/video/wedding-bells-v1/card-v1.jpg');
});

test('one HTML design takes thumbnail, title, description, price and offers from its data',()=>{
 const first=templateShareData(row,'video');
 const changed=templateShareData({...row,name:'New title',poster:'/assets/new-thumbnail.jpg',microDescription:'New short description',quote:{basePaise:79900},offerLabel:'New offer'},'video');
 const html=templateShareCardHtml(changed);
 for(const value of ['New title','/assets/new-thumbnail.jpg','New short description','₹799','New offer'])assert.ok(html.includes(value));
 assert.ok(!html.includes('₹699'));assert.notEqual(changed.revision,first.revision);
});

test('website prices follow the public catalogue response',async()=>{
 const website={id:'website-v1',name:'Website',thumbnail:row.poster,offerLabel:'Launch Offer',originalPaise:59900};
 const entry=await resolveTemplateShare(params('website-v1','website'),'https://findmyinvite.com',async()=>({templates:[website],basePaise:29900}));
 assert.equal(entry.amountPaise,29900);assert.equal(entry.originalPaise,59900);assert.match(templateShareCardHtml(entry),/₹299/);
});

test('rupee glyph comes from the bundled font rather than host-system fallback',async()=>{
 const {chromium}=await import('playwright-core');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),assets={};
  for(const [key,file] of [['regular','montserrat-static-400'],['bold','montserrat-static-700']]){
   assets[key]='data:font/woff2;base64,'+(await readFile(new URL('../public/assets/fonts/discovery/'+file+'.woff2',import.meta.url))).toString('base64');
  }
  for(const [key,weight] of [['currencyRegular',400],['currencyBold',700]])assets[key]='data:font/ttf;base64,'+(await readFile(new URL('../public/assets/fonts/share/noto-sans-rupee-'+weight+'.ttf',import.meta.url))).toString('base64');
  await page.setContent(templateShareCardHtml(templateShareData(row,'video'),assets));
  await page.locator('.price,.original').evaluateAll(elements=>elements.forEach(el=>{el.textContent='₹';}));
  await page.evaluate(()=>document.fonts.ready);
  const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument');
  for(const selector of ['.price','.original']){
   const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
   const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
   assert.ok(fonts.length>0);assert.ok(fonts.every(font=>font.isCustomFont&&/Noto Sans/i.test(font.familyName)),JSON.stringify(fonts));
  }
 }finally{await browser.close();}
});
