// Read-only checks against the real catalog, soundtrack, and video playback.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
await fs.mkdir('work/preview-controls',{recursive:true});
const report=[];
async function checkSound(page,card,kind){
 const media=kind==='website'?card.frameLocator('iframe').locator('audio[data-invitation-music]'):card.locator('video');
 await card.locator('.di-preview-sound').waitFor();
 assert.equal(await card.locator('.di-thumbnail-preview').count(),0,'The active preview has no center overlay');
 assert.equal(await card.getByRole('button',{name:/Stop preview/}).count(),0);
 const button=card.locator('.di-preview-sound');
 assert.ok(await button.evaluate(el=>{const r=el.getBoundingClientRect(),box=el.parentElement.getBoundingClientRect();return r.width<=40&&r.height<=40&&r.right<=box.right&&r.bottom<=box.bottom&&r.left>box.left+box.width/2;}),'Sound control stays small and in a corner');
 if(kind==='website')assert.equal(await card.frameLocator('iframe').locator('.invitation-sound').count(),0,'One music control in an embedded preview');
 const source=await media.getAttribute('src');
 await media.evaluate(el=>el.dataset.controlTest='same-player');
 if(await media.evaluate(el=>el.muted))await card.getByRole('button',{name:/Unmute music/}).click();
 await card.getByRole('button',{name:/Mute music/}).click();
 assert.equal(await media.evaluate(el=>el.muted),true);
 assert.equal(await button.getAttribute('aria-pressed'),'true');
 await card.getByRole('button',{name:/Unmute music/}).click();
 await media.evaluate(el=>new Promise((resolve,reject)=>{if(!el.paused&&el.currentTime>0)return resolve();const timeout=setTimeout(()=>reject(Error('Music did not resume')),15000);el.addEventListener('timeupdate',()=>{if(!el.paused&&el.currentTime>0){clearTimeout(timeout);resolve();}},{once:true});}));
 assert.equal(await media.evaluate(el=>el.muted),false);
 const time=await media.evaluate(el=>el.currentTime);
 await card.getByRole('button',{name:/Mute music/}).click();
 await page.waitForTimeout(250);
 assert.ok(await media.evaluate((el,time)=>!el.paused&&el.currentTime>=time,time),'Muting does not stop or restart the preview');
 assert.equal(await media.getAttribute('src'),source);
 assert.equal(await media.getAttribute('data-control-test'),'same-player');
}
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.di-pin').length===28&&document.querySelectorAll('.di-video-card').length===4);
  const website=page.locator('.di-pin').filter({hasText:'Bells & Blessings'});
  await website.getByRole('button',{name:'Preview Bells & Blessings',exact:true}).click();
  await checkSound(page,website,'website');
  await page.screenshot({path:`work/preview-controls/${width}-website-card.png`});
  await website.getByRole('button',{name:/Expand /}).click();
  let dialog=page.getByRole('dialog');await checkSound(page,dialog,'website');
  await page.screenshot({path:`work/preview-controls/${width}-website-expanded.png`});
  await dialog.getByRole('button',{name:'Close fullscreen preview'}).click();
  assert.equal(await website.locator('iframe').count(),1,'Closing keeps the same website preview');
  const video=page.locator('.di-video-card').first();
  await video.getByRole('button',{name:/Play preview/}).click();
  await checkSound(page,video,'video');
  await page.screenshot({path:`work/preview-controls/${width}-video-card.png`});
  await video.getByRole('button',{name:/Expand /}).click();
  dialog=page.getByRole('dialog');await checkSound(page,dialog,'video');
  await page.screenshot({path:`work/preview-controls/${width}-video-expanded.png`});
  // Native fullscreen video controls and the small toggle must agree.
  await dialog.locator('video').evaluate(el=>{el.muted=false;});
  await dialog.getByRole('button',{name:/Mute music/}).waitFor();
  await dialog.locator('video').evaluate(el=>{el.muted=true;});
  await dialog.getByRole('button',{name:/Unmute music/}).waitFor();
  await dialog.getByRole('button',{name:'Close fullscreen preview'}).click();
  assert.equal(await video.locator('video').count(),1,'Closing keeps the same video preview');
  assert.deepEqual(errors,[]);
  report.push({width,inlineAndExpandedSound:true,centerControlsHidden:true,playbackPreserved:true});
  await page.close();
 }
 const page=await browser.newPage();
 const {templates}=await fetch(origin+'/api/templates?action=public').then(r=>r.json());
 const version=templates.find(t=>t.id==='christian-bells').current_version_id;
 await page.goto(origin+'/template-preview?version='+version+'&lang=en');
 await page.locator('.invitation-sound').waitFor();
 await page.close();
 console.log(JSON.stringify({report,standaloneMusicControlPreserved:true}));
}finally{await browser.close();}
