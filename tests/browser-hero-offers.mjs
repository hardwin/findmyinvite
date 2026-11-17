import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const nextFrames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function setup(page){
 await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
 await page.route('**/api/**',route=>route.fulfill({json:{templates:[],basePaise:19900}}));
 await page.goto(origin+'/');await page.locator('.di-offers-track').waitFor();await page.evaluate(()=>document.fonts.ready);
}
async function sample(page,duration){
 return page.locator('.di-offers-track').evaluate((el,duration)=>new Promise(resolve=>{
  const positions=[],start=performance.now();
  function read(now){positions.push(el.scrollLeft);if(now-start>=duration)resolve(positions);else requestAnimationFrame(read);}
  requestAnimationFrame(read);
 }),duration);
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await setup(page);await page.mouse.move(0,0);
  const strip=page.locator('.di-offers-track');
  assert.equal(await page.locator('.di-offer-pagination').count(),0);
  assert.equal(await strip.getByRole('link').count(),3,'Only the original offers appear in the accessibility tree');
  const motion=await sample(page,450);assert.ok(motion.at(-1)-motion[0]>7,'Banners move automatically');
  await page.getByRole('button',{name:'Pause banner scrolling',exact:true}).click();
  const stopped=await sample(page,350);assert.ok(Math.max(...stopped)-Math.min(...stopped)<1,'Pause holds the exact current position');
  await page.getByRole('button',{name:'Resume banner scrolling',exact:true}).click();await page.mouse.move(0,0);
  const resumed=await sample(page,350);assert.ok(resumed.at(-1)-resumed[0]>5,'Resume continues from the current position');

  // Put the viewport just before the end of a cycle, then observe the actual
  // compositor frames across the wrap. No rewind animation or empty tail.
  const cycle=await strip.evaluate(el=>{const width=el.children[3].offsetLeft-el.children[0].offsetLeft;el.scrollLeft=2*width-5;return width;});
  const wrapping=await sample(page,2600);let wraps=0;
  for(let i=1;i<wrapping.length;i++){
   let step=wrapping[i]-wrapping[i-1];if(step<-cycle/2){wraps++;step+=cycle;}
   assert.ok(step>=-1&&step<3,`Continuous visual movement at the loop boundary (${step})`);
  }
  assert.equal(wraps,1,'Last banner wraps directly into the first');

  const box=await strip.boundingBox();await page.mouse.move(box.x+100,box.y+100);
  const hovering=await sample(page,250);assert.ok(Math.max(...hovering)-Math.min(...hovering)<1,'Hover pauses readable content');
  await page.mouse.move(0,0);await strip.getByRole('link').first().focus();await nextFrames(page);
  const focused=await sample(page,250);assert.ok(Math.max(...focused)-Math.min(...focused)<1,'Keyboard focus pauses movement');
  await page.locator('input[name=q]').focus();
  await page.emulateMedia({reducedMotion:'reduce'});await nextFrames(page);
  const reduced=await sample(page,250);assert.ok(Math.max(...reduced)-Math.min(...reduced)<1);
  assert.equal(await page.getByRole('button',{name:'Pause banner scrolling',exact:true}).count(),0,'Reduced motion hides the unnecessary control');
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:844});await nextFrames(page);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
   assert.equal(await strip.locator('.di-offer-card:visible').count(),3);
   const trackBounds=await strip.boundingBox();assert.ok(trackBounds.width>width*.85,'Banners use the available hero width');
   if(width<=640){const card=await strip.getByRole('link').first().boundingBox();assert.ok(Math.abs(card.width-trackBounds.width)<2,'Mobile banner fills the viewport without shrinking');}
   if(width===1440){const cards=await strip.getByRole('link').all();for(const card of cards){const bounds=await card.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width);}}
  }
  await page.emulateMedia({reducedMotion:'no-preference'});await nextFrames(page);
  const desktop=await sample(page,250);assert.ok(Math.max(...desktop)<1,'Desktop retains the three-column layout');
  assert.equal(await strip.locator('.di-offer-card:visible').count(),3,'Loop copies stay hidden on desktop with motion enabled');
  await page.setViewportSize({width:390,height:844});await page.mouse.move(0,0);await page.getByRole('button',{name:'Pause banner scrolling',exact:true}).click();
  await strip.evaluate(el=>el.scrollLeft=el.children[3].offsetLeft-el.children[0].offsetLeft);await nextFrames(page);
  if(engine===chromium)await page.screenshot({path:'work/glass/hero-loop-mobile.png'});
  const location=await strip.boundingBox();await page.mouse.move(location.x+100,location.y+100);const before=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(12,180);await page.waitForFunction(before=>scrollY>before+100,before);
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': smooth endless wrap, automatic motion, pause/resume, hover/focus, reduced motion, responsive layout and vertical wheel handoff passed');
 }finally{await browser.close();}
}

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});await setup(page);
 const cdp=await page.context().newCDPSession(page),strip=page.locator('.di-offers-track');
 for(const [dx,dy] of [[0,-160],[-25,-160],[-160,-10]]){
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await nextFrames(page);
  const box=await strip.boundingBox(),y=box.y+box.height-15;
  const before=await strip.evaluate(el=>({x:el.scrollLeft,y:scrollY}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y,id:1}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:280+dx*i/12,y:y+dy*i/12,id:1}]});await nextFrames(page);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await nextFrames(page);
  const after=await strip.evaluate(el=>({x:el.scrollLeft,y:scrollY,pageX:scrollX}));
  if(Math.abs(dy)>Math.abs(dx)){assert.ok(after.y-before.y>70,'Vertical/diagonal swipes scroll the page');assert.ok(Math.abs(after.x-before.x)<8,'Animation pauses while swiping');}
  else{assert.ok(after.x-before.x>70,'Manual horizontal swipe still browses banners');assert.ok(Math.abs(after.y-before.y)<5);}
  assert.equal(after.pageX,0);
 }
 console.log('chromium touch: vertical, diagonal and horizontal gestures remain native without fighting autoplay');
}finally{await browser.close();}
