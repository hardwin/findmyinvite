// Keyboard event regression: real app/compositor, simulated iOS visual viewport.
// No sign-in, uploads, payments or generation. A desktop engine cannot open an iPhone keyboard.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {webkit,chromium} from 'playwright-core';

const origin=process.env.CHECK_ORIGIN||'http://127.0.0.1:4173',dir='work/video-keyboard';
await mkdir(dir,{recursive:true});
const config=await fetch(origin+'/api/video-personalise?template=temple-v1').then(r=>r.json());
const evidence=[];
for(const engine of (process.env.KEYBOARD_ENGINE?[process.env.KEYBOARD_ENGINE]:['webkit','chromium'])){
 const browser=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH||'C:/Users/Z0046EAD/AppData/Local/ms-playwright/chromium_headless_shell-1148/chrome-win/headless_shell.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}));
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/api/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(new URL(route.request().url()).pathname==='/api/video-personalise'?config:{})}));
  await page.goto(origin+'/video-personalise?template=temple-v1',{waitUntil:'domcontentloaded',timeout:60000});
  const ready=()=>page.waitForFunction(()=>document.querySelector('.vp-film canvas')?.dataset.renderedFrame&&!document.querySelector('.vp-film-message'),null,{timeout:120000});
  await ready();await page.evaluate(()=>document.fonts.ready);
  await page.locator('#video-blessing1').focus();
  await page.evaluate(()=>{
   const vv=visualViewport,canvas=document.querySelector('.vp-film canvas');
   window.__keyboard={canvas,frame:canvas.dataset.renderedFrame,originalScrollBy:window.scrollBy,scrollCalls:0,height:vv.height,top:vv.offsetTop,descriptors:{height:Object.getOwnPropertyDescriptor(vv,'height'),offsetTop:Object.getOwnPropertyDescriptor(vv,'offsetTop')},widths:[],heights:[],mutations:0};
   const k=window.__keyboard;
   window.scrollBy=function(...args){k.scrollCalls++;return k.originalScrollBy.apply(this,args);};
   Object.defineProperty(vv,'height',{configurable:true,get:()=>k.height});
   Object.defineProperty(vv,'offsetTop',{configurable:true,get:()=>k.top});
   k.observer=new MutationObserver(records=>{k.mutations+=records.filter(r=>r.attributeName==='width'||r.attributeName==='height').length;});
   k.observer.observe(canvas,{attributes:true});
  });
  // Opening, address-bar panning, predictive-text row changes, and closing.
  for(const [height,top] of [[700,0],[540,32],[400,80],[370,112],[370,72],[400,40],[370,112],[370,112]]){
   await page.evaluate(({height,top})=>{Object.assign(window.__keyboard,{height,top});visualViewport.dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('scroll'));},{height,top});
   await page.waitForTimeout(220);
   await page.evaluate(()=>{const k=window.__keyboard;k.widths.push(document.querySelector('.vp-preview').getBoundingClientRect().width);k.heights.push(document.documentElement.scrollHeight);});
  }
  const checkpoint=await page.evaluate(()=>{
   const k=window.__keyboard,p=document.querySelector('.vp-preview').getBoundingClientRect();
   return {scrollCalls:k.scrollCalls,widths:k.widths,heights:k.heights,sameCanvas:k.canvas===document.querySelector('.vp-film canvas'),canvasResizes:k.mutations,sameFrame:k.frame===k.canvas.dataset.renderedFrame,frameBefore:k.frame,frameAfter:k.canvas.dataset.renderedFrame,previewVisible:p.top>=k.top&&p.bottom<=k.top+k.height,actionBarVisible:(()=>{const b=document.querySelector('.vp-form-footer').getBoundingClientRect();return b.top>=k.top&&Math.abs(b.bottom-(k.top+k.height))<2;})(),controlsInsidePreview:Array.from(document.querySelectorAll('.vp-pip-controls button')).every(b=>{const r=b.getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom+1;})};
  });
  await writeFile(dir+'/'+engine+'-keyboard-check.json',JSON.stringify(checkpoint,null,2));
  assert.equal(checkpoint.scrollCalls,0,'Keyboard viewport events must never force document scrolling');
  assert.equal(new Set(checkpoint.heights).size,1,'Keyboard changes must not change document scroll space');
  assert.equal(new Set(checkpoint.widths).size,1,'Preview size must remain stable throughout keyboard animation');
  assert.equal(checkpoint.sameCanvas,true);assert.equal(checkpoint.canvasResizes,0);assert.equal(checkpoint.sameFrame,true);assert.equal(checkpoint.previewVisible,true);assert.equal(checkpoint.actionBarVisible,true);assert.equal(checkpoint.controlsInsidePreview,true);
  const before=await page.locator('.vp-film canvas').evaluate(c=>c.toDataURL());
  await page.locator('#video-blessing1').fill('Welcome');await ready();
  await page.waitForFunction(previous=>document.querySelector('.vp-film canvas').toDataURL()!==previous,before);
  assert.equal(await page.locator('#video-blessing1').inputValue(),'Welcome');
  await page.waitForFunction(()=>{const p=document.querySelector('.vp-preview').getBoundingClientRect(),f=document.activeElement.getBoundingClientRect();return p.bottom<=f.top||p.top>=f.bottom||p.right<=f.left||p.left>=f.right;});
  await page.screenshot({path:dir+'/'+engine+'-keyboard.png',clip:{x:0,y:0,width:390,height:500}});
  await page.evaluate(()=>{const k=window.__keyboard;k.observer.disconnect();window.scrollBy=k.originalScrollBy;for(const key of ['height','offsetTop']){if(k.descriptors[key])Object.defineProperty(visualViewport,key,k.descriptors[key]);else delete visualViewport[key];}document.activeElement.blur();visualViewport.dispatchEvent(new Event('resize'));});
  await page.getByRole('button',{name:'Expand video preview',exact:true}).click();await page.getByRole('button',{name:'Back to form',exact:true}).waitFor();
  await page.getByRole('button',{name:'Back to form',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.vp-preview-expanded'));
  await page.locator('.vp-pip-controls').getByRole('button',{name:'Play full video',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('.vp-film canvas').dataset.renderedFrame)>105);
  await page.locator('.vp-pip-controls').getByRole('button',{name:'Pause preview',exact:true}).click();
  assert.deepEqual(errors,[]);evidence.push({engine,...checkpoint,typingUpdatesScene:true,expandCollapse:true,playPause:true});console.log(engine+' keyboard regression passed');
 }finally{await browser.close();}
}
await writeFile(dir+'/keyboard-checks.json',JSON.stringify(evidence,null,2));
