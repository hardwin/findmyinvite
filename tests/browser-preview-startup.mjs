// Simulate a slow but successful preview, followed by an unresponsive preview.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import media from '../shared/catalog-preview-media.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});
 let respond=true;
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public')return route.fulfill({json:{templates:[{id:'theeram',name:'Slow invitation',thumbnail:media.websites.theeram.poster,current_version_id:'slow-version',tradition:'hindu'}]}});
  return route.fulfill({json:{templates:[],drafts:[],invitations:[]}});
 });
 await page.route('**/template-preview?*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Invitation<script>'+(respond?'setTimeout(()=>parent.postMessage({type:"fmi-preview-ready",version:"slow-version"},location.origin),25000);':'')+'</script></body></html>'}));
 await page.goto(origin+'/');await page.locator('.di-pin').waitFor();await page.clock.install();
 await page.getByRole('button',{name:'Preview Slow invitation',exact:true}).click();
 await page.frameLocator('.di-pin iframe').locator('body').waitFor();
 await page.clock.runFor(26000);
 assert.equal(await page.locator('.di-pin .di-preview-sound').count(),1,'A preview ready after 25 seconds is retained and becomes usable');
 assert.equal(await page.getByRole('button',{name:'Retry preview for Slow invitation'}).count(),0);
 await page.evaluate(()=>window.dispatchEvent(new Event('catalog-stop-all')));respond=false;
 await page.getByRole('button',{name:'Preview Slow invitation',exact:true}).click();
 await page.clock.runFor(46000);
 await page.getByRole('button',{name:'Retry preview for Slow invitation',exact:true}).waitFor();
 assert.equal(await page.locator('.di-pin iframe').count(),0,'An unresponsive preview is still stopped with a retry action');
 console.log('Slow preview starts successfully after 25 seconds; unresponsive preview retains bounded retry fallback');
}finally{await browser.close();}
