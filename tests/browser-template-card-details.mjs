import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const live=process.env.TEST_LIVE_CATALOG==='1';
const screenshotDir=process.env.CARD_SCREENSHOT_DIR;
if(screenshotDir)await mkdir(screenshotDir,{recursive:true});
const poster='/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp';
const websites=['Bells & Blessings','Theeram · Backwater Journey','A Very Long Wedding Invitation Name'].map((name,i)=>({id:'site-'+i,name,thumbnail:poster,current_version_id:'version-'+i,templateCode:'FMI#000'+i,microDescription:'Opening church doors'}));
const videos=[{id:'wedding-bells-v1',name:'Wedding Bells',poster,preview:'/test-preview.mp4',templateCode:'FMI#0109',microDescription:'Sunlit church romance',quote:{basePaise:69900},originalPaise:159900,offerLabel:'Christmas Offer',tier:'premium',duration:28,amount:82482},{id:'temple-v1',name:'Temple Wedding',poster,preview:'/test-preview.mp4',templateCode:'FMI#0101',microDescription:'Sacred temple ceremony',quote:{basePaise:49900},duration:54,amount:58882}];

for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'}),errors=[];
  page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedTemplateUrl=text;}}}));
  if(!live)await page.route('**/api/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/templates')return route.fulfill({json:{templates:websites,basePaise:19900}});
   if(url.pathname==='/api/video-personalise')return route.fulfill({json:{templates:videos}});
   return route.fulfill({json:{}});
  });
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  async function verifyCards(label){
   await settle();
   const failures=await page.locator('.di-card-details').evaluateAll(details=>{
    const failures=[];
    for(const detail of details){
     if(!detail.getClientRects().length)continue;
     const card=detail.closest('article'),box=card.getBoundingClientRect(),info=detail.getBoundingClientRect(),title=detail.querySelector('h3').textContent;
     if(detail.scrollWidth>detail.clientWidth+1)failures.push(title+': inner layout overflows');
     for(const el of detail.querySelectorAll('h3,.di-card-micro,.di-template-code,.di-offer-label,.fmi-price-current,.fmi-price-original,.di-template-share,.di-use-template')){
      const r=el.getBoundingClientRect();
      if(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1)failures.push(title+': clipped '+el.className);
     }
     const action=detail.querySelector('.di-use-template'),a=action.getBoundingClientRect(),style=getComputedStyle(detail);
     if(Math.abs(a.left-info.left-parseFloat(style.paddingLeft))>1||Math.abs(info.right-a.right-parseFloat(style.paddingRight))>1)failures.push(title+': action is not full width');
     if(a.height<44||action.scrollWidth>action.clientWidth+1)failures.push(title+': action label or tap target is clipped');
     const share=detail.querySelector('.di-template-share'),s=share.getBoundingClientRect(),heading=detail.querySelector('h3').getBoundingClientRect();
     if(s.left<heading.right-1)failures.push(title+': share overlaps title');
     const shareLabel=share.querySelector('span');
     // The invisible tap target can extend past the visible button; measure its label instead.
     if(shareLabel.getClientRects().length&&(shareLabel.getBoundingClientRect().right>s.right+1||parseFloat(getComputedStyle(share).fontSize)>13.1))failures.push(title+': oversized share label');
     const pseudo=getComputedStyle(share,'::before');
     if(s.height-parseFloat(pseudo.top)-parseFloat(pseudo.bottom)<44)failures.push(title+': share tap target is too short');
    }
    if(document.documentElement.scrollWidth>innerWidth+1)failures.push('Page overflows viewport');
    return failures;
   });
   assert.deepEqual(failures,[],`${engine.name()} ${label}`);
  }
  async function verifyShare(card){
   const link=await card.locator('h3 a').getAttribute('href');
   await card.getByRole('button',{name:/^Share /}).click();
   const dialog=page.getByRole('dialog',{name:/^Share /});await dialog.waitFor();
   const box=await dialog.boundingBox(),viewport=page.viewportSize();
   assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1&&box.y>=0&&box.y+box.height<=viewport.height+1,'Share dialog fits viewport');
   const value=await dialog.locator('input').inputValue();
   assert.equal(new URL(value).searchParams.get('product'),new URL(link,origin).searchParams.get('product'));
   await dialog.getByRole('button',{name:'Copy link',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__copiedTemplateUrl),value);
   await dialog.getByRole('button',{name:'Close share options'}).click();
   assert.equal(await dialog.count(),0);
  }
  await page.goto(origin+(live?'/search?q=wedding':'/search'));await page.locator('.di-card-details').first().waitFor();
  for(const width of [320,360,390,488,768,1440]){
   await page.setViewportSize({width,height:1000});await verifyCards('search '+width);
   if(screenshotDir&&[320,390,1440].includes(width)){
    await page.locator('.di-card-details').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('.di-search-grid img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).every(img=>img.complete&&img.naturalWidth>0));
    await page.screenshot({path:`${screenshotDir}/search-${engine.name()}-${width}.png`});
   }
  }
  await page.setViewportSize({width:320,height:1000});
  await verifyShare(page.locator('.di-pin').first());
  await verifyShare(page.locator('.di-video-card').first());
  const premium=page.locator('.di-video-card').filter({has:page.getByRole('heading',{name:'Wedding Bells',exact:true,level:3})});
  assert.equal((await premium.locator('.di-offer-label').textContent()).trim(),'Christmas Offer');
  assert.equal(await premium.locator('.fmi-price-current').textContent(),'₹699');
  assert.equal(await premium.locator('.fmi-price-original').textContent(),'₹1,599');
  assert.match(await premium.locator('.di-use-template').getAttribute('href'),/video-personalise\?template=wedding-bells-v1/);
  assert.equal(await page.locator('.di-pin .di-offer-label').count(),0,'No video offer is added to website cards');
  const websiteDetails=await page.locator('.di-pin h3 a').first().getAttribute('href');
  for(const path of ['/','/templates?kind=website','/templates?kind=video']){
   await page.goto(origin+path);await page.locator('.di-card-details').first().waitFor();
   for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});await verifyCards(path+' '+width);}
   await page.setViewportSize({width:320,height:1000});await verifyShare(page.locator('.di-card-details').first());
  }
  for(const path of [websiteDetails,'/templates?kind=video&product=wedding-bells-v1']){
   await page.goto(origin+path);await page.locator('.di-detail-copy').waitFor();
   for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:1000});await settle();
    const overflow=await page.locator('.di-detail-copy').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('.di-button,.di-template-share')].some(action=>{const b=action.getBoundingClientRect();return b.left<r.left||b.right>r.right||action.scrollWidth>action.clientWidth+1;})||document.documentElement.scrollWidth>innerWidth+1;});
    assert.equal(overflow,false,`Detail actions fit at ${width}px`);
   }
  }
  assert.deepEqual(errors,[]);
  console.log(`${engine.name()}: card bounds, readable actions, Share/copy, and detail actions passed on search/home/catalogue/detail pages at 320–1440px`);
 }finally{await browser.close();}
}
