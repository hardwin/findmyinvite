// Storefront presentation regression: public fixtures, no customer data or payments.
// Run with TEST_ORIGIN / BROWSER_ENGINE / BROWSER_PATH as in browser-glass-navigation.mjs.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const websites=[
 {id:'christian-bells',name:'Bells & Blessings',description:'Church invitation',tradition:'christian',thumbnail:'/assets/categories/indian-christian-couple.png',current_version_id:'field-bells'},
 {id:'royal',name:'Royal Celebration',description:'Palace invitation',tradition:'hindu',thumbnail:'/assets/shop-cat-premium.png',current_version_id:'field-royal'}
];
const videos=Array.from({length:10},(_,i)=>({id:`field-video-${i}`,name:`Wedding Film ${i+1}`,poster:'/assets/categories/indian-christian-couple.png',preview:'/test-preview.mp4',duration:54+i,amount:49900}));
const previewHtml='<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;background:linear-gradient(135deg,#ffdce8,#e6efac)}</style></head><body>Invitation preview<script>setTimeout(()=>parent.postMessage({type:"fmi-preview-ready",version:new URLSearchParams(location.search).get("previewVersion")},location.origin),50)</script></body></html>';

async function settle(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>!document.querySelector('.di-main')?.getAnimations({subtree:true}).some(animation=>animation.playState==='running'||animation.playState==='pending'));
}

async function noOverflow(page,label){
 const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
 assert.ok(size.document<=size.viewport+1,`${label}: no horizontal document overflow (${size.document}/${size.viewport})`);
}

async function touchTargets(card,label){
 for(const selector of ['.di-thumbnail-preview','.di-card-expand','.di-use-template']){
  const target=card.locator(selector);
  assert.equal(await target.count(),1,`${label}: ${selector} is present`);
  const box=await target.boundingBox();
  assert.ok(box&&box.width>=43.5&&box.height>=43.5,`${label}: ${selector} is at least 44×44px (${box?.width}×${box?.height})`);
 }
}

async function cardMetrics(card){
 return card.evaluate(element=>{
  const style=selector=>getComputedStyle(element.querySelector(selector));
  const title=style('.di-card-details h3'),action=style('.di-use-template'),price=style('.di-card-price strong'),icon=style('.di-use-template svg');
  return {
   title:{font:title.fontFamily,size:title.fontSize,weight:title.fontWeight,lineHeight:title.lineHeight},
   action:{font:action.fontFamily,size:action.fontSize,weight:action.fontWeight,minHeight:action.minHeight},
   price:{size:price.fontSize,weight:price.fontWeight},
   icon:{width:icon.width,height:icon.height,stroke:icon.strokeWidth}
  };
 });
}

async function thumbnailFits(card,selector,label){
 const bounds=await card.evaluate((element,selector)=>{
  const rect=node=>{const {left,top,width,height}=node.getBoundingClientRect();return {left,top,width,height};};
  return {media:rect(element.querySelector('.di-pin-media')),wrapper:rect(element.querySelector('.di-live-thumbnail')),content:rect(element.querySelector(selector))};
 },selector);
 for(const key of ['left','top','width','height']){
  assert.ok(Math.abs(bounds.media[key]-bounds.wrapper[key])<1,`${label}: thumbnail wrapper fills media (${key})`);
  assert.ok(Math.abs(bounds.wrapper[key]-bounds.content[key])<1,`${label}: ${selector} fills thumbnail (${key})`);
 }
}

async function motionChecks(page,label){
 const atmosphere=page.locator('.sa-atmosphere');
 await atmosphere.waitFor({state:'attached'});
 assert.equal(await atmosphere.getAttribute('aria-hidden'),'true',`${label}: ornaments are decorative`);
 assert.equal(await atmosphere.evaluate(element=>getComputedStyle(element).pointerEvents),'none',`${label}: ornaments do not capture input`);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.querySelector('.sa-atmosphere')).getPropertyValue('--sa-drift')))<.01);
 const before=await page.locator('.sa-ornament').first().evaluate(element=>getComputedStyle(element).transform);
 await page.evaluate(()=>window.scrollTo({top:600,behavior:'instant'}));
 await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.querySelector('.sa-atmosphere')).getPropertyValue('--sa-drift')))>1);
 assert.notEqual(await page.locator('.sa-ornament').first().evaluate(element=>getComputedStyle(element).transform),before,`${label}: ornaments respond to scrolling`);
 await settle(page);
 assert.ok(await page.locator('[data-sa-reveal="seen"]').count()>0,`${label}: content reveal completes`);

 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>Math.abs(parseFloat(getComputedStyle(document.querySelector('.sa-atmosphere')).getPropertyValue('--sa-drift')))<.01);
 const reducedBefore=await page.locator('.sa-ornament').first().evaluate(element=>getComputedStyle(element).transform);
 await page.evaluate(()=>window.scrollTo({top:200,behavior:'instant'}));
 await settle(page);
 assert.equal(await page.locator('.sa-ornament').first().evaluate(element=>getComputedStyle(element).transform),reducedBefore,`${label}: reduced motion disables scroll parallax`);
 const reduced=await page.locator('[data-sa-motion]').evaluateAll(elements=>elements.map(element=>{const style=getComputedStyle(element);return {animation:style.animationName,transform:style.transform,opacity:style.opacity};}));
 assert.ok(reduced.length>0,`${label}: reveal targets were exercised`);
 for(const style of reduced){
  assert.equal(style.animation,'none',`${label}: reduced motion disables reveals`);
  assert.equal(style.transform,'none',`${label}: reduced motion leaves content stationary`);
  assert.equal(style.opacity,'1',`${label}: reduced motion keeps all content visible`);
 }
 await noOverflow(page,label+' after motion');
}

try{
 for(const width of [320,390,768,920,1440]){
  const label=`${engine.name()} ${width}px`;
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  try{
   const page=await context.newPage(),errors=[];
   page.setDefaultTimeout(10000);
   page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname==='/template-preview')return route.fulfill({contentType:'text/html',body:previewHtml});
    if(!url.pathname.startsWith('/api/'))return route.continue();
    if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public')return route.fulfill({json:{templates:websites,basePaise:19900}});
    if(url.pathname==='/api/video-personalise'&&url.searchParams.get('action')==='templates')return route.fulfill({json:{templates:videos}});
    return route.fulfill({json:{drafts:[],invitations:[],templates:[]}});
   });
   await page.goto(origin+'/');
   await page.locator('.di-pin').first().waitFor();
   await page.locator('.di-video-featured .di-video-card').first().waitFor();
   await page.evaluate(()=>document.fonts.ready);
   await settle(page);

   assert.equal(await page.locator('.di-hero .di-search svg').count(),1,`${label}: homepage search has one icon`);
   const input=await page.locator('.di-hero .di-search input').evaluate(element=>{const style=getComputedStyle(element);return {borders:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth],shadow:style.boxShadow};});
   assert.ok(input.borders.every(border=>parseFloat(border)===0),`${label}: input has no second border`);
   assert.equal(input.shadow,'none',`${label}: input has no second shadow stroke`);
   assert.equal(await page.getByRole('combobox').count(),0,`${label}: homepage has no catalogue filters`);
   assert.equal(await page.locator('.di-video-featured .di-video-card').count(),8,`${label}: eight featured videos are displayed`);
   const headerBlur=await page.locator('.di-header').evaluate(element=>{const style=getComputedStyle(element);return style.getPropertyValue('backdrop-filter')||style.getPropertyValue('-webkit-backdrop-filter');});
   assert.match(headerBlur,/blur\(/,`${label}: header glass blur resolves in this engine`);
   await noOverflow(page,label);

   const categories=await page.locator('.dc-category-name').evaluateAll(elements=>elements.map(element=>{
    const style=getComputedStyle(element),insets=['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum,property)=>sum+parseFloat(style[property]),0);
    return {name:element.textContent,height:element.getBoundingClientRect().height-insets,lineHeight:parseFloat(style.lineHeight)};
   }));
   assert.ok(categories.length>0,`${label}: categories are populated`);
   for(const category of categories)assert.ok(category.height<=category.lineHeight+1,`${label}: ${category.name} stays on one line`);

   const nav=page.getByRole('navigation',{name:'Mobile navigation'});
   assert.equal(await nav.isVisible(),width<=920,`${label}: correct navigation mode`);
   if(width<=920){
    assert.deepEqual(await nav.getByRole('link').allTextContents(),['Home','Videos','Websites','Signin'],`${label}: requested mobile tab order`);
    for(const tab of await nav.getByRole('link').all()){
     const box=await tab.boundingBox();
     assert.ok(box.width>=43.5&&box.height>=43.5,`${label}: mobile tab is at least 44×44px`);
    }
   }

   const video=page.locator('.di-video-card').first(),website=page.locator('.di-pin').first();
   await video.scrollIntoViewIfNeeded();
   await settle(page);
   await touchTargets(video,label+' video');
   const videoMetrics=await cardMetrics(video);
   const viewAll=await page.locator('.di-video-view-all').evaluate(element=>{const style=getComputedStyle(element);return {background:style.backgroundColor+' '+style.backgroundImage,blur:style.backdropFilter||style.webkitBackdropFilter};});
   const cardBackground=await video.evaluate(element=>{const style=getComputedStyle(element);return style.backgroundColor+' '+style.backgroundImage;});
   assert.notEqual(viewAll.background,cardBackground,`${label}: view-all video card has a distinct color treatment`);
   assert.match(viewAll.blur,/blur\(/,`${label}: view-all video card uses glass blur`);
   await website.scrollIntoViewIfNeeded();
   await settle(page);
   await touchTargets(website,label+' website');
   assert.deepEqual(await cardMetrics(website),videoMetrics,`${label}: website/video titles, prices, actions and icons share their visual metrics`);
   await thumbnailFits(website,'.di-live-thumbnail > img',label+' poster');

   // Test the native expanded preview at phone and desktop sizes as well.
   if(width===390||width===1440){
    await website.getByRole('button',{name:'Preview Bells & Blessings',exact:true}).click();
    await page.waitForFunction(()=>{const frame=document.querySelector('.di-pin iframe');return frame&&getComputedStyle(frame).opacity==='1';});
    await thumbnailFits(website,'iframe',label+' live preview');
    await website.getByRole('button',{name:'Expand Bells & Blessings',exact:true}).click();
    await settle(page);
    await thumbnailFits(website,'iframe',label+' fullscreen preview');
    await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();
   }
   await motionChecks(page,label);

   await page.goto(origin+'/templates?kind=website');
   await page.locator('.di-pin').first().waitFor();
   assert.ok(await page.getByRole('combobox').count()>0,`${label}: catalogue retains filters`);
   await noOverflow(page,label+' catalogue');
   assert.deepEqual(errors,[],`${label}: no runtime errors`);
   console.log(`${label}: search, cards, fit, targets, categories, navigation and motion passed`);
  }finally{await context.close();}
 }
}finally{await browser.close();}
