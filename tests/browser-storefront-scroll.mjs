import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const art='/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp';
const templates=Array.from({length:8},(_,i)=>({id:'site-'+i,name:'Website '+i,thumbnail:art,current_version_id:'version-'+i,microDescription:'Wedding celebration',templateCode:'FMI#00'+i}));
const videos=Array.from({length:16},(_,i)=>({id:'video-'+i,name:'Video '+i,poster:art,preview:'/fixture.mp4',duration:54,amount:49900,microDescription:'Wedding celebration',templateCode:'FMI#01'+i}));
const nextFrames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
  await page.route('**/api/**',route=>route.fulfill({json:new URL(route.request().url()).pathname==='/api/video-personalise'?{templates:videos}:{templates,basePaise:19900}}));
  await page.route('**/fixture.mp4',route=>route.fulfill({status:404,body:''}));
  for(const path of ['/','/templates?kind=website','/templates?kind=video','/search?q=wedding','/pricing','/about']){
   await page.goto(origin+path);await page.locator('.di-footer').waitFor();await page.evaluate(()=>document.fonts.ready);
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:844});
    for(const position of ['top','bottom']){
     // Reaching the video sentinel appends cards and moves the footer. Let
     // those batches settle before measuring the actual final page boundary.
     for(let pass=0;pass<(position==='bottom'?3:1);pass++){
      await page.evaluate(position=>scrollTo({left:9999,top:position==='top'?-9999:document.documentElement.scrollHeight+9999,behavior:'instant'}),position);await nextFrames(page);
     }
     const bounds=await page.evaluate(()=>{
      const root=document.documentElement,footer=document.querySelector('.di-footer').getBoundingClientRect(),header=document.querySelector('.di-header').getBoundingClientRect();
      return {x:scrollX,y:scrollY,max:root.scrollHeight-innerHeight,overflow:root.scrollWidth>innerWidth+1,rootOverflow:getComputedStyle(root).overflowX,rootOverscroll:CSS.supports('overscroll-behavior','none')?getComputedStyle(root).overscrollBehavior:null,footer:{left:footer.left,right:footer.right,bottom:footer.bottom},headerTop:header.top};
     });
     assert.equal(bounds.x,0,`${path} ${width}: page cannot scroll sideways`);assert.equal(bounds.overflow,false);
     assert.ok(bounds.y>=0&&bounds.y<=bounds.max+1,`${path}: vertical bounds`);
     assert.equal(bounds.rootOverflow,'clip');if(bounds.rootOverscroll!==null)assert.equal(bounds.rootOverscroll,'none');
     assert.ok(Math.abs(bounds.headerTop)<1,'Top bar stays sticky with clipping enabled');
     assert.ok(Math.abs(bounds.footer.left)<1&&Math.abs(bounds.footer.right-width)<1,'Footer fills the viewport');
     if(position==='bottom')assert.ok(Math.abs(bounds.footer.bottom-844)<2,`${engine.name()} ${path} ${width}: no blank body strip below the footer (${JSON.stringify(bounds)})`);
    }
   }
  }
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/');await page.locator('.di-video-featured').waitFor();
  async function position(selector,left=80){
   const strip=page.locator(selector);
   await strip.evaluate((el,left)=>{el.scrollTo({left,behavior:'instant'});scrollTo({top:scrollY+el.getBoundingClientRect().top-180,behavior:'instant'});},left);await nextFrames(page);
   const box=await strip.boundingBox();await page.mouse.move(195,box.y+Math.min(box.height/2,120));
   return strip;
  }
  for(const selector of ['.di-trending>div','.dc-category-scroller','.di-video-featured']){
   for(const [dx,dy] of [[0,250],[12,250],[-12,250],[180,250],[12,-200]]){
    const strip=await position(selector),before=await page.evaluate(()=>scrollY),left=await strip.evaluate(el=>el.scrollLeft);
    await page.mouse.wheel(dx,dy);
    const expected=Math.max(0,before+dy);
    await page.waitForFunction(expected=>Math.abs(scrollY-expected)<2,expected);
    assert.equal(await strip.evaluate(el=>el.scrollLeft),left,`${selector}: a mostly vertical gesture does not move the strip`);
   }
   const strip=await position(selector,0),before=await page.evaluate(()=>scrollY);
   await page.mouse.wheel(180,0);await page.waitForFunction(selector=>document.querySelector(selector).scrollLeft>30,selector);
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Deliberate horizontal wheel browsing remains native');
   const modifiers=await strip.evaluate(el=>['ctrlKey','metaKey','shiftKey'].map(key=>el.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:100,[key]:true}))));
   assert.deepEqual(modifiers,[true,true,true],'Zoom and shifted wheel shortcuts are not intercepted');
  }
  const strip=await position('.di-video-featured',0);
  await strip.locator('.di-use-template').last().focus();
  assert.ok(await strip.evaluate(el=>el.scrollLeft)>0,'Keyboard focus can reach offscreen cards');assert.equal(await page.evaluate(()=>scrollX),0);
  await position('.di-video-featured',0);await strip.locator('.di-card-expand').first().click();await page.locator('dialog[open]').waitFor();
  const locked=await page.evaluate(()=>scrollY);await page.mouse.move(195,400);await page.mouse.wheel(12,250);await nextFrames(page);
  assert.equal(await page.evaluate(()=>scrollY),locked,'Fullscreen preview never scrolls the background page');
  await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflowX),'clip','Closing preview restores edge containment');
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': six storefront pages bounded at 320/390/768/1440px; full-width footer, sticky header, diagonal wheel handoff on all strips, horizontal browsing, zoom shortcuts, keyboard reachability and fullscreen scroll lock passed');
 }finally{await browser.close();}
}

// Real compositor touch gestures, rather than synthetic DOM pointer events.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
 await page.route('**/api/**',route=>route.fulfill({json:new URL(route.request().url()).pathname==='/api/video-personalise'?{templates:videos}:{templates,basePaise:19900}}));
 await page.goto(origin+'/');await page.locator('.di-video-featured').waitFor();const cdp=await page.context().newCDPSession(page);
 for(const [dx,dy] of [[0,-220],[-35,-220],[-140,-200],[-200,-20]]){
  await page.locator('.di-video-featured').evaluate(el=>{el.scrollTo({left:200,behavior:'instant'});scrollTo({top:scrollY+el.getBoundingClientRect().top-140,behavior:'instant'});});
  const before=await page.evaluate(()=>({y:scrollY,x:document.querySelector('.di-video-featured').scrollLeft}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:450,id:1}]});
  for(let step=1;step<=15;step++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300+dx*step/15,y:450+dy*step/15,id:1}]});await nextFrames(page);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await nextFrames(page);
  const after=await page.evaluate(()=>({y:scrollY,x:document.querySelector('.di-video-featured').scrollLeft,pageX:scrollX}));
  if(Math.abs(dy)>Math.abs(dx)){assert.ok(after.y-before.y>100,'Native vertical swipe scrolls the page');assert.ok(Math.abs(after.x-before.x)<2);}
  else{assert.ok(after.x-before.x>100,'Native horizontal swipe scrolls videos');assert.ok(Math.abs(after.y-before.y)<2);}
  assert.equal(after.pageX,0);
 }
 console.log('chromium touch: vertical, diagonal and horizontal swipes retain native direction and keep the page horizontally bounded');
}finally{await browser.close();}
