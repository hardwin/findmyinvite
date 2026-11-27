// Exercise the actual editor/photo approval UX with deterministic API/provider fixtures.
// Real generation and rendering have separate production-environment proofs.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import sharp from 'sharp';
import {videoConfig} from '../server/video-personalise.mjs';
import {ANBIL_AVAN_DEFINITION as def} from '../shared/anbil-avan-video.mjs';
const config=await videoConfig({VIDEO_PERSONALISE_ENABLED:'1'},def.id,{tracks:[],assignments:[]},1);
config.ready=true;config.localUploads=true;
const bundle=await build({stdin:{loader:'tsx',resolveDir:process.cwd(),contents:`import React from 'react';import{createRoot}from'react-dom/client';import Editor from './src/video/VideoPersonalise';createRoot(document.getElementById('app')).render(<Editor/>);`},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',loader:{'.css':'css'},define:{'process.env.NODE_ENV':'"production"'},external:['/assets/*'],outfile:'fixture.js',logLevel:'silent',plugins:[{name:'fixture-compositor',setup(b){b.onResolve({filter:/\/create-compositor\.mjs$/},()=>({path:'compositor',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export function createVideoCompositor(){return {loaded:true,load:async()=>{},render:async()=>{},setContent(c){this.content=c;},validateText(){if(this.content?.bride==="Too wide for this scene")throw Object.assign(Error("Too wide"),{code:"TEXT_FIT",field:"bride"});},dispose(){}};}`}));}}]});
const png=await sharp({create:{width:240,height:320,channels:3,background:'#bd8d72'}}).png().toBuffer();
const browser=await chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH});
try{for(const width of [390,768]){
 const assisted=width===768;
 const cutouts=new Map();
 let lostSave=false;
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),owner=randomUUID(),invitation=randomUUID(),errors=[],calls=[];
 let record={id:invitation,owner,kind:'video',templateId:def.id,payload:{masterVersion:1,content:structuredClone(def.example),formStepId:'characters',personalPhotosEnabled:true,references:{}},revision:1,updatedAt:new Date().toISOString()},paid=false;
 if(assisted){paid=true;record.payload.references={bride:{id:randomUUID()}};}
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({owner,assisted})=>{if(assisted)sessionStorage.setItem('fmi-owner-csrf','fixture-csrf');else sessionStorage.setItem('findmyinvite-auth-session-v1',JSON.stringify({access_token:'fixture',expires_at:Date.now()+3600000,user:{id:owner}}));HTMLMediaElement.prototype.play=async function(){this.dispatchEvent(new Event('playing'));};window.Razorpay=class{constructor(o){this.options=o;}open(){void this.options.handler({razorpay_order_id:'order_fixture',razorpay_payment_id:'pay_fixture',razorpay_signature:'fixture'});}};},{owner,assisted});
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url()),action=u.searchParams.get('action'),body=req.method()==='POST'&&req.headers()['content-type']?.includes('json')?req.postDataJSON():{};const reply=json=>route.fulfill({json});
  if(req.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="app"></div><script src="/fixture.js"></script>'});
  if(u.pathname==='/fixture.js'||u.pathname==='/fixture.css')return route.fulfill({contentType:u.pathname.endsWith('js')?'application/javascript':'text/css',body:bundle.outputFiles.find(f=>f.path.endsWith(u.pathname.slice(1))).text});
  if(assisted&&['/api/drafts','/api/video-personalise','/api/video-characters'].includes(u.pathname)){
   assert.equal(req.headers()['x-fmi-assist'],invitation);
   if(req.method()==='POST')assert.equal(req.headers()['x-owner-csrf'],'fixture-csrf');
  }
  if(u.pathname==='/api/drafts'){if(action==='save'){assert.equal(body.revision,record.revision);record={...record,...body,owner,revision:record.revision+1,updatedAt:new Date().toISOString()};if(width===390&&!lostSave){lostSave=true;return route.abort('timedout');}}return reply({draft:record});}
  if(u.pathname==='/api/video-characters'){calls.push('generation');throw Error('Unexpected character generation route');}
  if(u.pathname==='/api/video-personalise'){
   if(action==='cutout'){
    const id=u.searchParams.get('id');if(req.method()==='POST'){calls.push('cutout');cutouts.set(id,true);}
    return reply(cutouts.has(id)?{ready:true}:{ready:false,started:false});
   }
   if(action==='media')return route.fulfill({contentType:'image/png',body:png});
   if(action==='render'){calls.push(action);return reply({id:'a'.repeat(64),status:'ready',download:'/api/video-personalise?action=download&id='+('a'.repeat(64)),expiresAt:new Date(Date.now()+86400000).toISOString()});}
   if(action==='delivery-link')return reply({path:'/download/video#fixture'});
   if(action==='reserve'){assert.ok(def.photoSlots.some(s=>s.slot===body.sceneSlot));return reply({id:randomUUID(),pathname:'fixture.png'});}
   if(action==='local-upload')return reply({ready:true});
   if(action?.startsWith('payment-')){calls.push(action);if(action==='payment-verify')paid=true;return reply({invitationId:invitation,amount:35282,currency:'INR',quote:{basePaise:29900,taxBps:1800,taxPaise:5382,totalPaise:35282},status:paid?'captured':'pending',unlocked:paid,keyId:'fixture',orderId:'order_fixture'});}
   return reply(config);
  }
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://shop.test/video-personalise?template='+def.id+'&draft='+invitation+(assisted?'&assist=1':''));
 await page.getByRole('article',{name:'Opening couple',exact:true}).waitFor();
 const nav=page.getByRole('navigation',{name:'Personalization steps'});
 for(const [index,scene] of def.photoSlots.entries()){
  const card=page.getByRole('article',{name:scene.label,exact:true});
  await card.waitFor();assert.equal(await page.locator('.vp-scene-upload').count(),1);
  assert.equal(await card.getByRole('link',{name:'Open ChatGPT'}).getAttribute('href'),'https://chatgpt.com/');
  await card.getByRole('button',{name:'Copy prompt'}).click();
  {
   if(index===1){await page.reload();await card.waitFor();}
   assert.equal(await card.getByRole('button',{name:'Next',exact:true}).isEnabled(),false);
   if(index===0){
    await nav.getByRole('button',{name:/Review & download/}).click();
    await page.getByRole('button',{name:'Continue scene uploads',exact:true}).click();await card.waitFor();
   }
   await card.getByLabel('Upload '+scene.label,{exact:true}).setInputFiles({name:'scene.png',mimeType:'image/png',buffer:png});
  }
  await card.getByRole('checkbox',{name:/I confirm this image/}).waitFor();
  assert.equal(await card.getByRole('button',{name:'Next',exact:true}).isEnabled(),false);
  await card.getByRole('checkbox',{name:/I confirm this image/}).check();
  await card.getByRole('button',{name:'Next',exact:true}).click();
  assert.equal(calls.includes('payment-order')||calls.includes('render'),false);
 }
 await page.locator('#video-confirm').waitFor();assert.equal(Object.keys(record.payload.content.photos).length,9);
 assert.equal(calls.filter(c=>c==='cutout').length,9);assert.equal(calls.includes('generation'),false);
 await page.locator('#video-confirm').check();
 if(!assisted){await page.getByRole('button',{name:/^Pay ₹/}).click();}
 await page.getByRole('button',{name:'Create my video',exact:true}).waitFor();assert.equal(calls.includes('render'),false);
 assert.equal(calls.filter(c=>c==='payment-order').length,assisted?0:1);
 await page.getByRole('button',{name:'Create my video',exact:true}).click();
 await page.getByRole('button',{name:'Download HD MP4',exact:true}).first().waitFor();
 assert.deepEqual(errors,[]);console.log(width+'px scene uploads, saved selections, approval and checkout passed');await context.close();
}}finally{await browser.close();}
