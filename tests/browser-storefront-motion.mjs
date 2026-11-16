// Follow actual rendered frames: a card must not get dimmer after it appears.
// API fixtures deliberately arrive late, reproducing the old visible/faded flash.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
import media from '../shared/catalog-preview-media.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const websites=Array.from({length:16},(_,i)=>({id:`motion-${i}`,name:`Invitation ${i+1}`,tradition:'hindu',thumbnail:media.websites.theeram.poster,current_version_id:`motion-version-${i}`,templateCode:`FMI#${String(i+1).padStart(4,'0')}`,microDescription:'A riverside celebration'}));
const videos=Array.from({length:8},(_,i)=>({id:`motion-video-${i}`,name:`Wedding Film ${i+1}`,poster:media.websites.thiruvarul.poster,preview:'/test-preview.mp4',duration:54,amount:49900,templateCode:`FMI#${100+i}`,microDescription:'A temple celebration'}));
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:800},reducedMotion:'no-preference'});
  await context.route('**/api/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public'){
    await new Promise(resolve=>setTimeout(resolve,300));return route.fulfill({json:{templates:websites,basePaise:19900}});
   }
   if(url.pathname==='/api/video-personalise'&&url.searchParams.get('action')==='templates')return route.fulfill({json:{templates:videos}});
   return route.fulfill({json:{templates:[],drafts:[],invitations:[]}});
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
   window.motionAudit={drops:[],nested:[],intermediate:0,frames:0};
   const previous=new WeakMap();
   function sample(){
    const audit=window.motionAudit;audit.frames++;
    for(const el of document.querySelectorAll('.di-preview-anchor,.dc-category-card')){
     const rect=el.getBoundingClientRect();
     if(rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth)continue;
     const opacity=Number(getComputedStyle(el).opacity),last=previous.get(el);
     if(last!==undefined&&opacity+.002<last)audit.drops.push({name:el.textContent?.slice(0,70),from:last,to:opacity,state:el.dataset.saReveal});
     if(opacity>0&&opacity<1)audit.intermediate++;
     previous.set(el,opacity);
     const parent=el.parentElement.closest('[data-sa-reveal]');
     if(parent&&Number(getComputedStyle(parent).opacity)<.999)audit.nested.push(parent.className);
    }
    requestAnimationFrame(sample);
   }
   requestAnimationFrame(sample);
  });
  await page.goto(origin+'/');await page.locator('.di-pin').last().waitFor({state:'attached'});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{
   const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
   // Scroll naturally through several reveals, then jump down and back twice.
   for(let y=0;y<Math.min(document.documentElement.scrollHeight-innerHeight,3000);y+=45){scrollTo({top:y,behavior:'instant'});await frame();await frame();}
   for(const y of [0,document.documentElement.scrollHeight,600,0]){scrollTo({top:y,behavior:'instant'});for(let i=0;i<40;i++)await frame();}
  });
  const audit=await page.evaluate(()=>window.motionAudit);
  assert.deepEqual(audit.drops,[],`${engine.name()} ${width}: card opacity never resets while scrolling or revisiting`);
  assert.deepEqual(audit.nested,[],`${engine.name()} ${width}: no compounded section/card fade`);
  assert.ok(audit.intermediate>0,'Offscreen cards still have a smooth reveal');
  // A focused action is usable immediately, even before its reveal would run.
  await page.locator('.di-pin .di-use-template').last().focus();
  assert.equal(await page.locator('.di-pin').last().evaluate(el=>getComputedStyle(el.closest('.di-preview-anchor')).opacity),'1');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.ok(await page.locator('[data-sa-reveal]').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).animationName==='none')),'Reduced motion keeps every card visible');
  const gap=await page.locator('.di-card-micro').first().evaluate(el=>({height:el.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight),next:el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom}));
  assert.ok(gap.height<=gap.line*2+.5,'Description occupies only its actual text lines');
  assert.ok(Math.abs(gap.next-5)<.5,'Description to template number has the consistent 5px gap');
  console.log(`${engine.name()} ${width}px: ${audit.frames} frames, smooth once-only reveals, fast scrolling, keyboard focus, reduced motion and compact metadata passed`);
  await context.close();
 }
}finally{await browser.close();}
