// Real catalogue and editor controls, with media playback, rendering, drafts and the gateway stubbed.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {videoConfig} from '../server/video-personalise.mjs';

const id='wedding-bells-v1',config=await videoConfig({VIDEO_PERSONALISE_ENABLED:'1'},id,{tracks:[],assignments:[]},2);
Object.assign(config.defaults,{
 groomShort:'Alex',brideShort:'Sam',groom:'Alex James',bride:'Sam Rose',
 groomFather:'James',brideFather:'Chris',church:'Chapel',address:'Church Street',
 receptionDate:'2027-02-15',receptionTime:'18:30',receptionVenue:'Town Hall',
 receptionAddress:'Main Street',host1:'Family and friends',weddingDate:'2027-02-15'
});
const entry={id,name:'Wedding Bells',poster:'/poster.jpg',preview:'/preview.mp4',amount:82482,duration:54};
const bundle=await build({
 stdin:{loader:'tsx',resolveDir:process.cwd(),contents:`
  import React from 'react';
  import {createRoot} from 'react-dom/client';
  import {VideoCard} from './src/video/VideoCollection';
  import Editor from './src/video/VideoPersonalise';
  import {startProductTracking} from './src/product-analytics';
  startProductTracking();
  createRoot(document.getElementById('app')).render(location.pathname==='/video-personalise'?<Editor/>:<VideoCard entry={${JSON.stringify(entry)}}/>);
 `},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',loader:{'.css':'empty'},
 define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',plugins:[{
  name:'fixture-compositor',
  setup(builder){
   builder.onResolve({filter:/\/create-compositor\.mjs$/},()=>({path:'compositor',namespace:'fixture'}));
   builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`
    export function createVideoCompositor(){return {loaded:true,load:async()=>{},render:async()=>{},setContent(){},validateText(){},dispose(){}};}
   `}));
  }
 }]
});
const browser=await chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH||undefined});
const page=await browser.newPage(),events=[],opened=[],verified=[],errors=[];
try{
 page.setDefaultTimeout(10000);
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  sessionStorage.setItem('findmyinvite-auth-session-v1',JSON.stringify({access_token:'fixture',expires_at:Date.now()+3600000,user:{id:'fixture-user'}}));
  HTMLMediaElement.prototype.play=async function(){this.dispatchEvent(new Event('playing'));};
  window.Razorpay=class {constructor(options){this.options=options;}open(){void this.options.handler({razorpay_order_id:'order_fixture',razorpay_payment_id:'pay_fixture',razorpay_signature:'fixture'});}};
 });
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),action=url.searchParams.get('action');
  if(request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><style>.di-preview-dialog:not([open]),.di-preview-inline{display:contents}</style><div id="app"></div><script src="/fixture.js"></script>'});
  if(url.pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript',body:bundle.outputFiles[0].text});
  if(url.pathname==='/api/owner'){events.push(request.postDataJSON());return route.fulfill({json:{accepted:true}});}
  if(url.pathname==='/api/drafts'&&action==='save')return route.fulfill({json:{draft:{...request.postDataJSON(),revision:1,updatedAt:new Date().toISOString()}}});
  if(url.pathname==='/api/video-personalise'){
   const pending={status:'pending',unlocked:false,amount:82482,currency:'INR'};
   if(action==='payment-order'){opened.push(request.postDataJSON());return route.fulfill({json:{...pending,keyId:'fixture',orderId:'order_fixture'}});}
   if(action==='payment-verify'){verified.push(request.postDataJSON());return route.fulfill({json:{...pending,unlocked:true,status:'captured'}});}
   if(action==='payment-status')return route.fulfill({json:pending});
   if(action==='render')return route.fulfill({json:{id:randomUUID(),status:'queued',progress:0}});
   return route.fulfill({json:config});
  }
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://shop.test/templates');
 await Promise.all([
  page.waitForResponse(r=>r.url().includes('/api/owner')&&r.request().postDataJSON().type==='preview'),
  page.getByRole('button',{name:'Play preview for Wedding Bells'}).click()
 ]);
 await page.getByRole('link',{name:'Use Template: Wedding Bells'}).click();
 await page.waitForSelector('.vp-editor-shell');
 await page.getByRole('navigation',{name:'Personalization steps'}).getByRole('button',{name:/review/i}).click();
 await page.locator('#video-confirm').check();
 await Promise.all([
  page.waitForResponse(r=>r.url().includes('action=payment-verify')),
  page.getByRole('button',{name:/Pay ₹824\.82/}).click()
 ]);
 const stages=events.map(e=>e.type);
 assert.deepEqual(stages,['template_selected','preview','template_selected','form_start']);
 assert.ok(events.every(e=>e.templateId===id&&e.session===events[0].session));
 assert.equal(opened.length,1);assert.equal(verified.length,1);
 assert.equal(opened[0].analytics.session,events[0].session);
 assert.deepEqual(verified[0].analytics,opened[0].analytics);
 assert.equal(verified[0].invitationId,opened[0].invitationId);
 assert.deepEqual(errors,[]);
 console.log('Wedding Bells catalogue Play, editor, payment order and verified callback used the same session.');
}catch(error){
 console.error({events:events.map(e=>e.type),opened:opened.length,errors,pageText:(await page.locator('body').innerText()).slice(-1500)});
 throw error;
}finally{await browser.close();}
