// Navigation and interaction regression for the storefront's glass finish.
// Public API fixtures keep this independent of customer accounts and payments.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const websites=[
 {id:'christian-bells',name:'Bells & Blessings',description:'Church invitation',tradition:'christian',thumbnail:'/assets/categories/indian-christian-couple.png',current_version_id:'glass-bells'},
 {id:'royal',name:'Royal',description:'Palace invitation',tradition:'hindu',thumbnail:'/assets/shop-cat-premium.png',current_version_id:'glass-royal'}
];
try{
 for(const width of [320,390,768,920,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin)return route.abort();
   if(url.pathname==='/template-preview')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Invitation preview</body></html>'});
   if(!url.pathname.startsWith('/api/'))return route.continue();
   if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public')return route.fulfill({json:{templates:websites,basePaise:19900}});
   if(url.pathname==='/api/video-personalise'&&url.searchParams.get('action')==='templates')return route.fulfill({json:{templates:[{id:'temple',name:'Temple Wedding',poster:'/assets/categories/indian-christian-couple.png',preview:'/test-preview.mp4',duration:54,amount:49900}]}});
   return route.fulfill({json:{drafts:[],invitations:[],templates:[]}});
  });
  await page.goto(origin+'/');
  await page.locator('.di-pin').first().waitFor();
  const nav=page.getByRole('navigation',{name:'Mobile navigation'});
  const mobile=width<=920;
  assert.equal(await page.getByRole('combobox').count(),0,'Homepage has no catalogue filters');
  assert.equal(await nav.isVisible(),mobile);
  assert.equal(await page.getByRole('button',{name:'Menu',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`No horizontal page overflow at ${width}px`);
  if(!mobile){
   assert.ok(await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Website Templates',exact:true}).isVisible());
   assert.equal(await page.locator('.di-masonry').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),6);
  }else{
   assert.deepEqual(await nav.getByRole('link').allTextContents(),['Home','Videos','Websites','Signin']);
   assert.equal(await nav.getByRole('link',{name:'Home',exact:true}).getAttribute('aria-current'),'page');
   for(const link of await nav.getByRole('link').all()){
    const box=await link.boundingBox();
    assert.ok(box.width>=44&&box.height>=44,'Tabs have accessible touch targets');
   }
   await nav.getByRole('link',{name:'Videos',exact:true}).click();
   await page.waitForURL('**/templates?kind=video');
   await page.locator('.di-video-card').waitFor();
   assert.equal(await nav.getByRole('link',{name:'Videos',exact:true}).getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.di-pin').count(),0);
   await nav.getByRole('link',{name:'Websites',exact:true}).click();
   await page.waitForURL('**/templates?kind=website');
   await page.locator('.di-pin').first().waitFor();
   assert.equal(await nav.getByRole('link',{name:'Websites',exact:true}).getAttribute('aria-current'),'page');
   assert.equal(await page.locator('.di-video-card').count(),0);

   // Filters are available only after navigating to the catalogue.
   assert.equal(await page.getByRole('combobox').count(),3);
   await page.getByRole('combobox',{name:'Style',exact:true}).click();
   await page.getByRole('option',{name:'Palace',exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('.di-pin').length===1);
   assert.match(await page.locator('.di-card-details').innerText(),/Royal/);
   await page.getByRole('combobox',{name:'Style',exact:true}).click();
   await page.getByRole('option',{name:'Style',exact:true}).click();

   await page.getByRole('button',{name:'Expand Bells & Blessings',exact:true}).click();
   assert.ok(await page.getByRole('dialog',{name:'Bells & Blessings fullscreen preview'}).isVisible());
   const navBox=await nav.boundingBox();
   assert.ok(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('dialog[open]'),{x:navBox.x+navBox.width/2,y:navBox.y+navBox.height/2}),'Fullscreen preview is above navigation');
   await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();

   await nav.getByRole('link',{name:'Signin',exact:true}).click();
   assert.ok(await page.getByRole('dialog',{name:'Sign in to FindMyInvite'}).isVisible());
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('fmi-after-auth')),'/dashboard');
   await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Signin');

   // Session fixture tests account destination and keeps sign-out accessible.
   await page.evaluate(()=>{
    sessionStorage.removeItem('fmi-after-auth');
    localStorage.setItem('findmyinvite-auth-v1',JSON.stringify({access_token:'fixture-only',user:{id:'glass-test',email:'test@example.invalid'}}));
    window.dispatchEvent(new Event('fmi-auth-changed'));
   });
   await nav.getByRole('link',{name:'Account',exact:true}).click();
   await page.waitForURL('**/dashboard');
   assert.equal(await nav.getByRole('link',{name:'Account',exact:true}).getAttribute('aria-current'),'page');
   await page.locator('.di-header').getByRole('button',{name:'Sign out',exact:true}).click();
   assert.ok(await nav.getByRole('link',{name:'Signin',exact:true}).isVisible());
   await nav.getByRole('link',{name:'Home',exact:true}).click();
   await page.waitForURL(origin+'/');

   await page.getByRole('textbox',{name:'Search designs',exact:true}).fill('Bells');
   await page.locator('.di-search').getByRole('button').click();
   await page.waitForURL('**/search?q=Bells');
   await page.waitForFunction(()=>document.querySelectorAll('.di-pin').length===1);
   assert.match(await page.locator('.di-pin .di-card-details').innerText(),/Bells & Blessings/);
   await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
   const lastLink=await page.getByRole('link',{name:'Refunds',exact:true}).boundingBox();
   assert.ok(lastLink.y+lastLink.height<(await nav.boundingBox()).y,'Footer links clear the bottom bar');
   await page.keyboard.press('Tab');
   await nav.getByRole('link',{name:'Home',exact:true}).focus();
   assert.ok(await nav.getByRole('link',{name:'Home',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle!=='none'),'Keyboard focus stays visible');

   if(engine===chromium){
    const cdp=await context.newCDPSession(page);
    for(const feature of ['prefers-reduced-transparency','prefers-contrast']){
     await cdp.send('Emulation.setEmulatedMedia',{features:[{name:feature,value:feature==='prefers-contrast'?'more':'reduce'}]});
     const style=await nav.evaluate(el=>({blur:getComputedStyle(el).backdropFilter,fill:getComputedStyle(el).backgroundColor}));
     assert.equal(style.blur,'none');
     assert.equal(style.fill,'rgb(255, 255, 255)');
    }
    await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    assert.equal(await nav.getByRole('link').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
   }
  }
  assert.deepEqual(errors,[],`No runtime errors at ${width}px`);
  console.log(`${engine.name()} ${width}px: navigation, layout and interactions passed`);
  await context.close();
 }
}finally{await browser.close();}



