import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
import {articleHtml,shell} from '../server/owner/content.mjs';
import {invitationPageHtml} from '../server/invitation-page.mjs';
import {occasionBySlug} from '../server/occasion-landings.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const poster='/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp';
const websites=Array.from({length:30},(_,i)=>({id:'site-'+i,name:i%2?'A Long Wedding Invitation Name':'Wedding Bells',thumbnail:poster,current_version_id:'version-'+i,templateCode:'FMI#'+String(i).padStart(4,'0'),microDescription:'Sunlit church romance'}));
const videos=Array.from({length:30},(_,i)=>({id:i?'video-'+i:'wedding-bells-v1',name:i?'Celebration '+i:'Wedding Bells',poster,preview:'/fixture-preview.mp4',templateCode:'FMI#'+String(i+30).padStart(4,'0'),microDescription:'Garden wedding story',quote:{basePaise:69900},amount:82482,duration:28,offerLabel:'Christmas Offer'}));
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(location.protocol.startsWith('http'))sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1');});
  await page.route('**/api/**',route=>{const url=new URL(route.request().url());return route.fulfill({json:url.pathname==='/api/templates'?{templates:websites,basePaise:19900}:url.pathname==='/api/video-personalise'?{templates:videos}:{}});});
  await page.route('**/fixture-preview.mp4',route=>route.fulfill({status:404,body:''}));
  await page.route('**/template-preview?**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0">Original invitation artwork</body></html>'}));
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  async function bounds(){
   await settle();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Page stays inside the viewport');
   const failures=await page.locator('.di-card-details').evaluateAll(details=>details.flatMap(detail=>{
    if(!detail.getClientRects().length)return [];
    const box=detail.getBoundingClientRect();return [...detail.querySelectorAll('h3,.di-template-share,.di-use-template,.fmi-price-current')].filter(el=>{const r=el.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1||r.bottom>box.bottom+1;}).map(el=>el.className);
   }));assert.deepEqual(failures,[],'Card titles, prices and actions fit');
  }
  for(const width of [320,390,768,1440,1920]){
   await page.setViewportSize({width,height:1000});await page.goto(origin+'/');await page.locator('.di-card-details').first().waitFor();await bounds();
   const dimensions=await page.evaluate(()=>({root:parseFloat(getComputedStyle(document.documentElement).fontSize),zoom:getComputedStyle(document.documentElement).zoom,header:document.querySelector('.di-header').getBoundingClientRect().height,search:parseFloat(getComputedStyle(document.querySelector('.di-search input')).fontSize),cta:document.querySelector('.di-use-template').getBoundingClientRect().height}));
   assert.equal(dimensions.root,12.8);assert.equal(dimensions.zoom,'1','Browser/page zoom stays normal');
   assert.ok(Math.abs(dimensions.header-(width<=920?51.2:60.8))<1,'Header follows the 80% scale');
   assert.ok(dimensions.cta>=(width<=920?44:36),'Compact buttons retain a mobile touch target');
   if(width<=920)assert.ok(dimensions.search>=16,'Mobile input remains readable without focus zoom');
   const compact=await page.locator('.di-search').boundingBox();
   await page.evaluate(()=>document.documentElement.style.fontSize='100%');await settle();
   const original=await page.locator('.di-search').boundingBox();
   assert.ok(compact.height<original.height,'Search chrome is visibly smaller');
   await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
   if(width<=920){
    const nav=await page.locator('.di-bottom-nav').boundingBox();assert.ok(nav.x>=0&&nav.y+nav.height<=1000&&nav.height<65,'Bottom navigation stays anchored and compact');
   }
  }
  for(const path of ['/templates?kind=website','/templates?kind=video','/search?q=wedding','/saved','/pricing','/templates?product=wedding-bells-v1&kind=video','/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy']){
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:900});await page.goto(origin+path);await page.locator('.di-header').waitFor().catch(async e=>{console.log('Failed route',path,await page.locator('body').innerText(),errors);throw e;});await bounds();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize),'12.8px',path);
   }
  }
  // Production serves the journal and occasion landing pages as standalone HTML.
  // Render their real server templates with public fixtures, without database access.
  const article={slug:'test',title:'A wedding celebration',excerpt:'Ideas for your invitation.',body:'## Your celebration\n\nChoose a design and make it yours.',published_at:'2026-11-18'};
  for(const html of [shell('Journal','Invitation ideas',origin+'/blog','<h1>A little inspiration.</h1><p>Ideas for your celebration.</p>'),articleHtml(article),invitationPageHtml(Object.values(occasionBySlug)[0])]){
   for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});await page.goto('about:blank');await page.setContent(html);await bounds();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize),'12.8px','Server-rendered public pages use the same scale');
   }
  }
  await page.setViewportSize({width:390,height:700});await page.goto(origin+'/templates?kind=website');await page.locator('.di-card-details').first().waitFor();
  await page.getByRole('combobox',{name:'Style',exact:true}).click();
  const options=page.getByRole('listbox');await options.waitFor();const filter=await options.boundingBox();assert.ok(filter.x>=0&&filter.x+filter.width<=391&&filter.y+filter.height<=701,'Filter portal fits the screen');await page.keyboard.press('Escape');
  await page.locator('.di-pin').first().getByRole('button',{name:/^Expand/}).click();
  const fullscreen=page.locator('dialog[open]');await fullscreen.waitFor();
  const frame=fullscreen.locator('iframe');await frame.waitFor();
  const canvas=await frame.evaluate(el=>({width:getComputedStyle(el).width,height:getComputedStyle(el).height,visual:el.getBoundingClientRect().width,container:el.parentElement.getBoundingClientRect().width}));
  assert.equal(canvas.width,'400px');assert.equal(canvas.height,'560px');assert.ok(Math.abs(canvas.visual-canvas.container)<1,'Invitation artwork still fills the card');
  const full=await fullscreen.boundingBox();assert.ok(full.x===0&&full.y===0&&Math.abs(full.width-390)<1&&Math.abs(full.height-700)<1,'Fullscreen preview covers the actual viewport');
  await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();
  await page.locator('.di-pin').first().getByRole('button',{name:/^Share /}).click();
  const share=page.getByRole('dialog',{name:/^Share /});await share.waitFor();const shareBox=await share.boundingBox();assert.ok(shareBox.x>=0&&shareBox.x+shareBox.width<=391&&shareBox.y>=0&&shareBox.y+shareBox.height<=701);await page.keyboard.press('Escape');
  await page.goto(origin+'/');await page.getByRole('button',{name:'Change invitation language',exact:true}).click();
  const language=page.getByRole('dialog');await language.waitFor();const langBox=await language.boundingBox();assert.ok(langBox.x>=0&&langBox.x+langBox.width<=391&&langBox.y+langBox.height<=701,'Language popover fits');await page.keyboard.press('Escape');
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Signin',exact:true}).click();
  const auth=page.getByRole('dialog');await auth.waitFor();const authBox=await auth.boundingBox();assert.ok(authBox.x>=0&&authBox.x+authBox.width<=391&&authBox.y+authBox.height<=701,'Sign-in dialog fits');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
  const analytics=page.getByRole('dialog');await analytics.waitFor();const analyticsBox=await analytics.boundingBox();assert.ok(analyticsBox.x>=0&&analyticsBox.x+analyticsBox.width<=391&&analyticsBox.y+analyticsBox.height<=701,'Footer preference dialog fits');await page.keyboard.press('Escape');
  // These are separate surfaces, not public storefront pages.
  for(const path of ['/login','/dashboard','/personalise','/video-personalise','/cms','/manager/login']){
   await page.goto(origin+path);await page.waitForFunction(()=>document.documentElement.classList.contains('di-site')||document.querySelector('#root')?.childElementCount);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('di-storefront')),false,path+' is excluded');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize),'16px',path+' keeps its original size');
  }
  await page.goto(origin+'/template-preview?version=test');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize),'16px','Guest invitation document keeps its original scale');
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': 80% storefront sizing, all public routes, mobile touch targets, viewport bounds, portals, preview canvas and excluded editor/admin/account routes passed');
 }finally{await browser.close();}
}
