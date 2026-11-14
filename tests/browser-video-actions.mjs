// Browser-level editor interactions; API fixtures never charge or generate characters.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {webkit,chromium} from 'playwright-core';
const origin=process.env.CHECK_ORIGIN||'http://127.0.0.1:5173',dir='work/video-actions';
await mkdir(dir,{recursive:true});
const config=await fetch(origin+'/api/video-personalise?template=temple-v1').then(r=>r.json()),evidence=[];
for(const engine of ['webkit','chromium']){
 const browser=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH||'C:/Users/Z0046EAD/AppData/Local/ms-playwright/chromium_headless_shell-1148/chrome-win/headless_shell.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}));
 const page=await browser.newPage({viewport:engine==='webkit'?{width:390,height:844}:{width:1366,height:900},...(engine==='webkit'?{isMobile:true,hasTouch:true}:{})}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/api/**',route=>{const url=route.request().url();requests.push(url);return route.fulfill({contentType:'application/json',body:JSON.stringify(url.includes('action=public')||url.includes('action=templates')?{templates:[],basePaise:19900}:config)});});
  await page.goto(origin+'/templates',{waitUntil:'networkidle'});
  await page.goto(origin+'/video-personalise?template=temple-v1');
  const ready=()=>page.waitForFunction(()=>document.querySelector('canvas')?.dataset.renderedFrame&&!document.querySelector('.vp-film-message'),null,{timeout:120000});
  await ready();const original=await page.locator('#video-blessing1').inputValue();
  await page.locator('#video-blessing1').focus();await page.locator('.tf-field').first().getByRole('button',{name:/Clear/}).click();
  assert.equal(await page.locator('#video-blessing1').inputValue(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'video-blessing1');
  await page.waitForFunction(()=>location.search.includes('draft='));const draftURL=page.url();
  await page.locator('.vp-form-footer').getByRole('button',{name:'Next',exact:true}).click();
  await page.locator('.vp-toast[role=alert]').waitFor();assert.equal(await page.locator('#video-blessing1').getAttribute('aria-invalid'),'true');
  assert.equal(await page.locator('.vp-form-footer').getByRole('button',{name:'Next',exact:true}).isEnabled(),true);
  await page.locator('#video-blessing1').fill(original);await page.locator('.vp-toast').waitFor({state:'hidden'});await ready();
  await page.evaluate(()=>window.testCanvas=document.querySelector('canvas'));
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  assert.equal(await page.locator('.vp-preview').isVisible(),false);await page.getByRole('button',{name:'Show preview',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.testCanvas===document.querySelector('canvas')),true);
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  await page.locator('.vp-form-footer').getByRole('button',{name:'Next',exact:true}).click();await page.locator('#video-greeting').waitFor();await ready();assert.equal(await page.locator('.vp-preview').isVisible(),false);await page.getByRole('button',{name:'Show preview',exact:true}).click();
  await page.goBack();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(page.url(),draftURL);
  await page.locator('.vp-form-footer').getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Previous step',exact:true}).click();await page.locator('#video-blessing1').waitFor();
  await page.reload();await ready();assert.equal(await page.locator('#video-blessing1').inputValue(),original);
  await page.goBack();await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('button',{name:'Previous step',exact:true}).count(),0);await page.getByRole('button',{name:'Exit editor',exact:true}).click();await page.waitForURL(origin+'/templates');
  assert.equal(requests.filter(r=>r.includes('video-characters')).length,0);assert.deepEqual(errors,[]);
  // A fresh tab has no previous page; exit must go to My Invitations.
  const direct=await browser.newPage({viewport:{width:390,height:844}});await direct.route('**/api/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(config)}));await direct.goto(origin+'/video-personalise?template=temple-v1');await direct.locator('#video-blessing1').click();await direct.goBack();await direct.getByRole('button',{name:'Exit editor',exact:true}).click();await direct.waitForURL(origin+'/dashboard');await direct.close();
  evidence.push({engine,clearKeepsFocus:true,validationToast:true,nextEnabled:true,previewPreservesCanvas:true,previewRemainsClosedAcrossSteps:true,browserBackDialog:true,previousStep:true,refreshRetainsGuard:true,exitReturnsToOrigin:true,directExitDashboard:true,noCharacterRequests:true});console.log(engine+' action and navigation checks passed');
 }catch(error){await page.screenshot({path:dir+'/'+engine+'-failure.png',fullPage:true});await writeFile(dir+'/'+engine+'-failure.json',JSON.stringify({message:error.message,errors,url:page.url()},null,2));throw error;}finally{await browser.close();}
}
await writeFile(dir+'/checks.json',JSON.stringify(evidence,null,2));
