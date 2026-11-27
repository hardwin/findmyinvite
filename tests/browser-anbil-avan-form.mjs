// Exercise the actual editor/photo approval UX with deterministic API/provider fixtures.
// Real generation and rendering have separate production-environment proofs.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rmdir,unlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {chromium,webkit} from 'playwright-core';
import sharp from 'sharp';
import {videoConfig} from '../server/video-personalise.mjs';
import {ANBIL_AVAN_DEFINITION as def} from '../shared/anbil-avan-video.mjs';
import {uploadReference} from '../shared/scene-uploads.mjs';
const config=await videoConfig({VIDEO_PERSONALISE_ENABLED:'1'},def.id,{tracks:[],assignments:[]},1);
config.ready=true;config.localUploads=true;config.templateCode='FMI#0111';
const bundle=await build({stdin:{loader:'tsx',resolveDir:process.cwd(),contents:`import './src/style.css';import './src/iteration2.css';import './src/discovery.css';import './src/glass-theme.css';import './src/storefront-density.css';import React from 'react';import{createRoot}from'react-dom/client';import Editor from './src/video/VideoPersonalise';createRoot(document.getElementById('app')).render(<Editor/>);`},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',loader:{'.css':'css'},define:{'process.env.NODE_ENV':'"production"'},external:['/assets/*'],outfile:'fixture.js',logLevel:'silent'});
const resultPng=await sharp('public'+uploadReference(def,'openingCouple')).resize(240,320,{fit:'inside'}).modulate({saturation:.8}).png().toBuffer();
const png=await sharp(resultPng).flatten({background:'#f4dfcd'}).png().toBuffer();
const confirmation='I confirm that the image is correct for this scene.';
// Use the editor's real iframe compositor. The delayed film makes the gap
// between mounting the iframe and drawing its first frame observable.
const filmFixture=`<!doctype html><script>
 let initialized=false;
 window.fmiFilmReady=new Promise(resolve=>setTimeout(()=>resolve({
  init(content,photos){this.photos=photos;initialized=true;},
  setContent(){},
  render(){if(!initialized)throw Error('Film was not initialized');document.body.dataset.photoCount=Object.keys(this.photos).filter(k=>this.photos[k].url.startsWith('blob:')).length;},
  validate(){},destroy(){initialized=false;}
 }),100));
</script>`;
const browser=process.env.FMI_BROWSER==='webkit'?await webkit.launch():await chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH});
const fixtureDir=await mkdtemp(join(tmpdir(),'fmi-scene-')),uploadFile=join(fixtureDir,'scene.png');
await writeFile(uploadFile,png);
try{for(const width of [390,768]){
 const assisted=width===768;
 const cutouts=new Map();
 let holdFirst=width===390,finishUpload;
 const uploadGate=new Promise(resolve=>{finishUpload=resolve;});
 let lostSave=false,reloading=false;
 let context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
 const owner=randomUUID(),invitation=randomUUID(),errors=[],calls=[];
 let record={id:invitation,owner,kind:'video',templateId:def.id,payload:{masterVersion:1,content:structuredClone(def.example),formStepId:'characters',personalPhotosEnabled:true,references:{}},revision:1,updatedAt:new Date().toISOString()},paid=false;
 if(assisted){paid=true;record.payload.references={bride:{id:randomUUID()}};}
 async function connectPage(){
 page.setDefaultTimeout(15000);page.on('pageerror',e=>{
  // Windows WebKit reports a canceled pagehide fetch as a page error while the
  // old document unloads. Below we verify that this exact upload survives reload.
  if(reloading&&process.env.FMI_BROWSER==='webkit'&&e.message.includes('/api/drafts?action=save due to access control checks.'))return;
  errors.push(e.message);
 });
 await page.addInitScript(()=>{
  window.previewFailures=[];
  new MutationObserver(()=>{
   const error=document.querySelector('.vp-film-message h2');
   if(error?.textContent==='Check your invitation')window.previewFailures.push(error.parentElement.textContent);
  }).observe(document,{childList:true,subtree:true});
 });
 await page.addInitScript(({owner,assisted})=>{if(assisted)sessionStorage.setItem('fmi-owner-csrf','fixture-csrf');else sessionStorage.setItem('findmyinvite-auth-session-v1',JSON.stringify({access_token:'fixture',expires_at:Date.now()+3600000,user:{id:owner}}));HTMLMediaElement.prototype.play=async function(){this.dispatchEvent(new Event('playing'));};window.Razorpay=class{constructor(o){this.options=o;}open(){void this.options.handler({razorpay_order_id:'order_fixture',razorpay_payment_id:'pay_fixture',razorpay_signature:'fixture'});}};},{owner,assisted});
 await page.route('https://**/*',async route=>{const req=route.request(),u=new URL(req.url()),action=u.searchParams.get('action'),body=req.method()==='POST'&&req.headers()['content-type']?.includes('json')?req.postDataJSON():{};const reply=json=>route.fulfill({json});
  if(u.pathname===config.master.sceneFrame)return route.fulfill({contentType:'text/html',body:filmFixture});
  if(req.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en" class="di-site"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/fixture.css"><body class="di-site"><div id="app"></div><script src="/fixture.js"></script></body></html>'});
  if(/^\/assets\/fonts\/[a-z0-9_/.-]+\.woff2$/i.test(u.pathname))return route.fulfill({contentType:'font/woff2',body:await readFile('public'+u.pathname)});
  if(u.pathname.startsWith('/assets/video-scenes/anbil-avan-v1/assets/')&&u.pathname.endsWith('.webp'))return route.fulfill({contentType:'image/webp',body:await readFile('public'+u.pathname)});
  if(u.pathname==='/fixture.js'||u.pathname==='/fixture.css')return route.fulfill({contentType:u.pathname.endsWith('js')?'application/javascript':'text/css',body:bundle.outputFiles.find(f=>f.path.endsWith(u.pathname.slice(1))).text});
  if(assisted&&['/api/drafts','/api/video-personalise','/api/video-characters'].includes(u.pathname)){
   assert.equal(req.headers()['x-fmi-assist'],invitation);
   if(req.method()==='POST')assert.equal(req.headers()['x-owner-csrf'],'fixture-csrf');
  }
  if(u.pathname==='/api/drafts'){if(action==='save'){assert.equal(body.revision,record.revision);record={...record,...body,owner,revision:record.revision+1,updatedAt:new Date().toISOString()};if(width===390&&!lostSave){lostSave=true;return route.abort('timedout');}}return reply({draft:record});}
  if(u.pathname==='/api/video-characters'){calls.push('generation');throw Error('Unexpected character generation route');}
  if(u.pathname==='/api/video-personalise'){
   if(action==='cutout'){
    const id=u.searchParams.get('id');
    if(req.method()==='POST'){calls.push('cutout');cutouts.set(id,holdFirst?'running':'ready');}
    if(cutouts.get(id)==='running')return reply({ready:false,started:true,failed:!holdFirst});
    return reply(cutouts.has(id)?{ready:true}:{ready:false,started:false});
   }
   if(action==='media')return route.fulfill({contentType:'image/png',body:u.searchParams.has('cutout')?resultPng:png});
   if(action==='render'){calls.push(action);return reply({id:'a'.repeat(64),status:'ready',download:'/api/video-personalise?action=download&id='+('a'.repeat(64)),expiresAt:new Date(Date.now()+86400000).toISOString()});}
   if(action==='delivery-link')return reply({path:'/download/video#fixture'});
   if(action==='reserve'){assert.ok(def.photoSlots.some(s=>s.slot===body.sceneSlot));return reply({id:randomUUID(),pathname:'fixture.png'});}
   if(action==='local-upload'){calls.push('upload');if(holdFirst)await uploadGate;return reply({ready:true});}
   if(action?.startsWith('payment-')){calls.push(action);if(action==='payment-verify')paid=true;return reply({invitationId:invitation,amount:35282,currency:'INR',quote:{basePaise:29900,taxBps:1800,taxPaise:5382,totalPaise:35282},status:paid?'captured':'pending',unlocked:paid,keyId:'fixture',orderId:'order_fixture'});}
   return reply(config);
  }
  return route.fulfill({status:204,body:''});
 });
 }
 await connectPage();
 await page.goto('https://shop.test/video-personalise?template='+def.id+'&draft='+invitation+(assisted?'&assist=1':''));
 await page.getByRole('article',{name:'Opening couple',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('iframe[title="Personalised invitation"]')?.contentDocument?.body?.dataset.photoCount==='0');
 let nav=page.getByRole('navigation',{name:'Personalization steps'});
 for(const [index,scene] of def.photoSlots.entries()){
  if(index===1||index===3){
   const resume=page.url(),stored=structuredClone(record.payload);
   assert.equal(stored.sceneUploadSlot,scene.slot);assert.ok(stored.content.photos.openingCouple.id);
   await context.close();context=await browser.newContext({viewport:{width,height:844}});page=await context.newPage();await connectPage();
   await page.goto(resume);nav=page.getByRole('navigation',{name:'Personalization steps'});
   assert.deepEqual(record.payload.content.photos,stored.content.photos);
  }
  const card=page.getByRole('article',{name:scene.label,exact:true});
  await card.waitFor();assert.equal(await page.locator('.vp-scene-upload').count(),1);
  if(index===2&&width===390){
   assert.equal(await card.getByRole('button',{name:'Our drawing'}).getAttribute('aria-pressed'),'true');
   await card.getByRole('button',{name:'Next',exact:true}).click();continue;
  }
  await card.getByRole('button',{name:'My photo',exact:true}).click();
  assert.equal(await card.getByRole('link',{name:'ChatGPT',exact:true}).getAttribute('href'),'https://chatgpt.com/');
  const tiles=await card.locator('.vp-image-choices button').evaluateAll(nodes=>nodes.map(x=>x.getBoundingClientRect().toJSON()));
  assert.equal(tiles[0].top,tiles[1].top);assert.ok(tiles[1].right<=width);
  const preview=page.locator('.vp-preview');if(width===390)assert.equal(await preview.isVisible(),false);
  await card.getByText('Show prompt',{exact:true}).click();
  assert.match(await card.getByLabel('Scene prompt').inputValue(),/Image 1 is my personal/);
  await card.getByText('Show prompt',{exact:true}).click();
  if(process.env.FMI_MOBILE_SCREENSHOT&&width===390&&index===0){
   await card.locator('.vp-choice-art img').first().evaluate(img=>img.decode());
   await page.locator('.vp-form-body').evaluate(el=>{el.scrollTop=0;});
   await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:process.env.FMI_MOBILE_SCREENSHOT});
   const body=page.locator('.vp-form-body'),extra=await body.evaluate(el=>Math.max(0,el.scrollHeight-el.clientHeight));
   await page.setViewportSize({width,height:844+extra+4});await page.waitForFunction(()=>{const el=document.querySelector('.vp-form-body');return el.scrollHeight<=el.clientHeight+4;});
   await page.screenshot({path:process.env.FMI_MOBILE_SCREENSHOT.replace(/\.png$/,'-full.png')});
   await page.setViewportSize({width,height:844});

  }
  await card.getByRole('button',{name:'Copy ChatGPT prompt'}).click();
  {
   assert.equal(await card.getByRole('button',{name:'Next',exact:true}).count(),0);
   if(index===0){
    await nav.getByRole('button',{name:/Review & download/}).click();
    await page.getByRole('button',{name:'Continue scene choices',exact:true}).click();await card.waitFor();
   }
   const [picker]=await Promise.all([page.waitForEvent('filechooser'),card.getByRole('button',{name:'Add picture from ChatGPT'}).click()]);
   await picker.setFiles(uploadFile);
  }
  const review=card.getByRole('region',{name:'Image review for '+scene.label});
  const agreement=review.getByRole('checkbox',{name:confirmation,exact:true});
  const confirm=review.getByRole('button',{name:'Click to Proceed',exact:true});
  if(holdFirst){
   await review.getByRole('progressbar',{name:'Uploading your picture…'}).waitFor();
   assert.equal(await card.getByRole('link',{name:'Download style sample'}).isVisible(),false);
   finishUpload();
   const removing=review.getByRole('progressbar',{name:'Removing the background…'});
   await removing.waitFor().catch(async cause=>{throw new Error('Removal did not start. '+await card.innerText()+'; requests '+calls.join(', '),{cause});});assert.equal(await confirm.count(),0);
   assert.ok(record.payload.pending[scene.slot].id);
   reloading=true;try{await page.reload();}finally{reloading=false;}await removing.waitFor();
   if(process.env.FMI_MOBILE_SCREENSHOT)await page.screenshot({path:process.env.FMI_MOBILE_SCREENSHOT.replace(/\.png$/,'-progress.png')});
   holdFirst=false;
   const retry=review.getByRole('button',{name:'Retry',exact:true});await retry.waitFor();
   const alertBox=await review.getByRole('alert').boundingBox(),retryBox=await retry.boundingBox();
   assert.ok(retryBox.y>=alertBox.y+alertBox.height,'Retry should occupy its own action row');
   await page.setViewportSize({width:320,height:568});
   await retry.click();
   assert.equal(calls.filter(c=>c==='upload').length,1);
  }
  await confirm.waitFor();
  assert.equal(await agreement.isChecked(),false);assert.equal(await confirm.isEnabled(),false);
  assert.equal(await card.getByRole('link',{name:'Download style sample'}).isVisible(),false);
  if(index===0&&width===390){
   for(const viewport of [{width:320,height:568},{width,height:844}]){
    await page.setViewportSize(viewport);
    await page.waitForFunction(()=>document.querySelector('.vp-editor-shell').offsetWidth===innerWidth);
    const panel=await review.boundingBox(),body=await page.locator('.vp-form-body').boundingBox();
    const imgs=await review.getByRole('img').evaluateAll(nodes=>nodes.map(el=>({width:el.naturalWidth,top:el.getBoundingClientRect().top})));
    assert.equal(imgs.length,2);assert.ok(imgs.every(img=>img.width>0));assert.equal(imgs[0].top,imgs[1].top);
    assert.ok(panel.y>=body.y-1&&panel.y+panel.height<=body.y+body.height+1,'Both images and confirmation fit together: '+JSON.stringify({viewport,panel,body}));
   }
   if(process.env.FMI_MOBILE_SCREENSHOT)await page.screenshot({path:process.env.FMI_MOBILE_SCREENSHOT.replace(/\.png$/,'-review.png')});
   await card.getByText('Upload instructions',{exact:true}).click();
   await card.getByRole('link',{name:'Download style sample'}).waitFor();
   await card.getByText('Upload instructions',{exact:true}).click();
  }
  if(index===0&&assisted){
   await agreement.check();assert.equal(await confirm.isEnabled(),true);
   const originalId=record.payload.pending[scene.slot].id;
   const [picker]=await Promise.all([page.waitForEvent('filechooser'),card.getByRole('button',{name:'Replace picture'}).click()]);
   await Promise.all([page.waitForResponse(r=>r.url().includes('action=media')&&r.url().includes('cutout=1')&&!r.url().includes(originalId)),picker.setFiles(uploadFile)]);
   await confirm.waitFor();
   assert.notEqual(record.payload.pending[scene.slot].id,originalId);
   assert.equal(await agreement.isChecked(),false);assert.equal(await confirm.isEnabled(),false);
  }
  await agreement.check();assert.equal(await confirm.isEnabled(),true);
  if(index===0){await agreement.uncheck();assert.equal(await confirm.isEnabled(),false);await agreement.check();}
  await confirm.click();
  if(index===0){
   await page.getByRole('article',{name:def.photoSlots[1].label,exact:true}).waitFor();
   await page.waitForFunction(()=>document.querySelector('iframe[title="Personalised invitation"]')?.contentDocument?.body?.dataset.photoCount==='1');
   assert.deepEqual(await page.evaluate(()=>window.previewFailures),[]);
  }
  assert.equal(calls.includes('payment-order')||calls.includes('render'),false);
 }
 await page.locator('#video-confirm').waitFor();assert.equal(record.payload.formStepId,'review');assert.equal(Object.keys(record.payload.content.photos).length,assisted?9:8);assert.equal(Object.keys(record.payload.sceneChecks).length,9);
 assert.equal(calls.filter(c=>c==='cutout').length,assisted?10:9);assert.equal(calls.includes('generation'),false);
 await page.locator('#video-confirm').check();
 if(!assisted){await page.getByRole('button',{name:/^Pay ₹/}).click();}
 await page.getByRole('button',{name:'Create my video',exact:true}).waitFor();assert.equal(calls.includes('render'),false);
 assert.equal(calls.filter(c=>c==='payment-order').length,assisted?0:1);
 await page.getByRole('button',{name:'Create my video',exact:true}).click();
 await page.getByRole('button',{name:'Download HD MP4',exact:true}).first().waitFor();
 assert.deepEqual(errors,[]);console.log(width+'px scene uploads, saved selections, approval and checkout passed');await context.close();
}}finally{await browser.close();await unlink(uploadFile);await rmdir(fixtureDir);}
