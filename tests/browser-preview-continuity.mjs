import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
await fs.mkdir('work/preview-continuity',{recursive:true});
async function ready(card){await card.locator('.di-preview-sound').waitFor();}
async function videoState(card){return card.locator('video').evaluate(v=>({same:v===window.continuityVideo,time:v.currentTime,paused:v.paused,muted:v.muted,loads:window.continuityLoads}));}
async function websiteState(card){return card.locator('iframe').evaluate(frame=>{const w=frame.contentWindow,a=w.document.querySelector('audio[data-invitation-music]');return{token:w.continuityToken,y:w.scrollY,time:a.currentTime,muted:a.muted,same:a===w.continuityAudio};});}
async function seekVideo(card,time){await card.locator('video').evaluate((v,time)=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=time;}),time);}
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(30000);
  await page.addInitScript(()=>{window.previewPlayEvents=[];document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement)window.previewPlayEvents.push({tag:e.target.tagName,muted:e.target.muted});},true);});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.di-video-card').length===4&&document.querySelectorAll('.di-pin').length===28);
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.locator('video,iframe').count(),0,'No media starts while browsing');
  const first=page.locator('.di-video-card').first();
  await first.getByRole('button',{name:/Play preview/}).click();await ready(first);
  assert.equal(await first.locator('video').evaluate(v=>v.muted),false,'First play defaults to sound on');
  await first.locator('video').evaluate(v=>{window.continuityVideo=v;window.continuityLoads=0;v.addEventListener('loadstart',()=>window.continuityLoads++);});
  await seekVideo(first,12);
  await first.getByRole('button',{name:/^Mute music/}).click();
  const before=await videoState(first),scroll=await page.evaluate(()=>scrollY);
  await first.getByRole('button',{name:/^Expand /}).click();
  let dialog=page.getByRole('dialog');await ready(dialog);
  let state=await videoState(dialog);
  assert.ok(state.same&&!state.paused&&state.time>=before.time&&state.time<before.time+5);
  assert.equal(state.loads,0);assert.equal(state.muted,true);
  await page.screenshot({path:`work/preview-continuity/${width}-video-expanded.png`});
  await dialog.getByRole('button',{name:'Close fullscreen preview'}).click();
  state=await videoState(first);assert.ok(state.same&&!state.paused&&state.time>=before.time);assert.equal(state.muted,true);assert.equal(state.loads,0);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<=3);
  // Preserve the user's paused state too, including an Escape close.
  await first.locator('video').evaluate(v=>v.pause());const paused=await videoState(first);
  await first.getByRole('button',{name:/^Expand /}).click();await page.keyboard.press('Escape');
  state=await videoState(first);assert.equal(state.paused,true);assert.equal(state.time,paused.time);assert.ok(state.same);
  console.log(JSON.stringify({width,videoContinuity:true}));

  const second=page.locator('.di-video-card').nth(1);
  await second.getByRole('button',{name:/^Expand /}).click();dialog=page.getByRole('dialog');await ready(dialog);
  assert.equal(await dialog.locator('video').evaluate(v=>v.muted),true,'A different preview inherits mute');
  await dialog.getByRole('button',{name:'Close fullscreen preview'}).click();
  assert.equal(await second.locator('video').count(),1);

  const website=page.locator('.di-pin').filter({hasText:'Bells & Blessings'});
  await website.getByRole('button',{name:'Preview Bells & Blessings',exact:true}).click();await ready(website);
  await website.locator('iframe').evaluate(frame=>{const w=frame.contentWindow,a=w.document.querySelector('audio[data-invitation-music]');w.continuityToken=Math.random();w.continuityAudio=a;w.scrollTo(0,1400);a.currentTime=5;});
  await page.waitForTimeout(200);
  const webBefore=await websiteState(website);assert.equal(webBefore.muted,true);assert.ok(webBefore.y>0);
  assert.ok(await website.locator('iframe').evaluate(f=>f.contentWindow.previewPlayEvents.filter(e=>e.tag==='AUDIO').every(e=>e.muted)),'Muted website never starts audibly');
  await website.getByRole('button',{name:/^Expand /}).click();dialog=page.getByRole('dialog');await ready(dialog);
  let web=await websiteState(dialog);assert.equal(web.token,webBefore.token);assert.equal(web.y,webBefore.y);assert.ok(web.same&&web.time>=webBefore.time);assert.equal(web.muted,true);
  await dialog.getByRole('button',{name:/^Unmute music/}).click();
  assert.equal((await websiteState(dialog)).muted,false);
  await page.screenshot({path:`work/preview-continuity/${width}-website-expanded.png`});
  await dialog.getByRole('button',{name:'Close fullscreen preview'}).click();
  web=await websiteState(website);assert.equal(web.token,webBefore.token);assert.equal(web.y,webBefore.y);assert.ok(web.same&&web.time>=webBefore.time);assert.equal(web.muted,false);
  await website.getByRole('button',{name:/^Mute music/}).click();
  console.log(JSON.stringify({width,websiteScrollAndMusicContinuity:true}));

  // A reload must apply mute before new players start, not after their first sound.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.di-video-card').first().getByRole('button',{name:/^Play preview/}).click();await ready(page.locator('.di-video-card').first());
  assert.equal(await page.locator('video').evaluate(v=>v.muted),true);
  assert.ok(await page.evaluate(()=>window.previewPlayEvents.filter(e=>e.tag==='VIDEO').every(e=>e.muted)));
  await page.locator('.di-video-card').first().getByRole('button',{name:/^Unmute music/}).click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.di-video-card').first().getByRole('button',{name:/^Play preview/}).click();await ready(page.locator('.di-video-card').first());
  assert.equal(await page.locator('video').evaluate(v=>v.muted),false,'Turning sound back on is remembered too');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,preferenceSurvivesReload:true,noAudibleStartWhenMuted:true}));
  await page.close();
 }
 // Nested invitation documents must also survive promotion without reloading.
 const page=await browser.newPage({viewport:{width:1280,height:844},reducedMotion:'reduce'});
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 const nested=page.locator('.di-pin').filter({has:page.locator('a[href*="product=royal-crimson"]')});
 await nested.getByRole('button',{name:/^Preview /}).click();await ready(nested);
 const original=await nested.locator('iframe').evaluate(f=>{const w=f.contentDocument.querySelector('iframe').contentWindow;w.continuityToken=Math.random();w.scrollTo(0,600);return{token:w.continuityToken,y:w.scrollY};});
 await nested.getByRole('button',{name:/^Expand /}).click();
 let actual=await nested.locator('iframe').evaluate(f=>{const w=f.contentDocument.querySelector('iframe').contentWindow;return{token:w.continuityToken,y:w.scrollY};});assert.deepEqual(actual,original);
 await nested.locator('iframe').evaluate(f=>f.focus());await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
 actual=await nested.locator('iframe').evaluate(f=>{const w=f.contentDocument.querySelector('iframe').contentWindow;return{token:w.continuityToken,y:w.scrollY};});assert.deepEqual(actual,original);
 await page.close();
 console.log(JSON.stringify({nestedDocumentPreserved:true,escapeFromIframe:true}));

 // A failed preference write must still share the choice with invitation frames.
 const privatePage=await browser.newPage({viewport:{width:1280,height:844}});
 await privatePage.addInitScript(()=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(key){if(key==='findmyinvite-preview-muted-v1')throw new DOMException('Blocked','SecurityError');return get.call(this,key);};Storage.prototype.setItem=function(key,value){if(key==='findmyinvite-preview-muted-v1')throw new DOMException('Blocked','SecurityError');return set.call(this,key,value);};});
 await privatePage.goto(origin,{waitUntil:'domcontentloaded'});
 const first=privatePage.locator('.di-video-card').first();await first.getByRole('button',{name:/^Play preview/}).click();await ready(first);await first.getByRole('button',{name:/^Mute music/}).click();
 const website=privatePage.locator('.di-pin').filter({hasText:'Bells & Blessings'});await website.getByRole('button',{name:/^Preview /}).click();await ready(website);
 assert.equal(await website.frameLocator('iframe').locator('audio[data-invitation-music]').evaluate(a=>a.muted),true);
 await privatePage.close();console.log(JSON.stringify({blockedStorageStillRemembersMuteWithinPage:true}));
}finally{await browser.close();}
