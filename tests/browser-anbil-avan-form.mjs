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
try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),owner=randomUUID(),invitation=randomUUID(),errors=[],calls=[];
 let record={id:invitation,owner,kind:'video',templateId:def.id,payload:{masterVersion:1,content:structuredClone(def.example),formStepId:'characters',personalPhotosEnabled:true,references:{}},revision:1,updatedAt:new Date().toISOString()},set=null,paid=false;
 const state=()=>({sets:set?[set]:[],current:set&&!set.approved?set.id:null,approved:set?.approved?set.id:null,allowances:{bride:{initialUsed:!!set,redoUsed:false},groom:{initialUsed:!!set,redoUsed:false}}});
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({owner})=>{sessionStorage.setItem('findmyinvite-auth-session-v1',JSON.stringify({access_token:'fixture',expires_at:Date.now()+3600000,user:{id:owner}}));HTMLMediaElement.prototype.play=async function(){this.dispatchEvent(new Event('playing'));};window.Razorpay=class{constructor(o){this.options=o;}open(){void this.options.handler({razorpay_order_id:'order_fixture',razorpay_payment_id:'pay_fixture',razorpay_signature:'fixture'});}};},{owner});
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url()),action=u.searchParams.get('action'),body=req.method()==='POST'&&req.headers()['content-type']?.includes('json')?req.postDataJSON():{};const reply=json=>route.fulfill({json});
  if(req.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="app"></div><script src="/fixture.js"></script>'});
  if(u.pathname==='/fixture.js'||u.pathname==='/fixture.css')return route.fulfill({contentType:u.pathname.endsWith('js')?'application/javascript':'text/css',body:bundle.outputFiles.find(f=>f.path.endsWith(u.pathname.slice(1))).text});
  if(u.pathname==='/api/drafts'){if(action==='save'){record={...record,...body,owner,revision:record.revision+1,updatedAt:new Date().toISOString()};}return reply({draft:record});}
  if(u.pathname==='/api/video-characters'){
   if(action==='set-capabilities')return reply({enabled:true});
   if(action==='sets')return reply(state());
   calls.push(action);
   if(action==='set-submit'){assert.equal(paid,true);set={id:randomUUID(),status:'identity_review',approved:false,photos:body.photos,assets:['bride','groom'].map(p=>({id:randomUUID(),asset:'identity:'+p,status:'ready',mediaId:randomUUID()}))};return reply({set});}
   if(action==='set-confirm'){set.status='review';set.assets.push(...def.characterProfile.poses.map(p=>({id:randomUUID(),asset:'pose:'+p.slot,status:'ready',mediaId:randomUUID()})));return reply({set});}
   if(action==='set-approve'){set.status='approved';set.approved=true;record={...record,revision:record.revision+1,payload:{...record.payload,personalPhotosEnabled:true,charactersChoice:'personal',content:{...record.payload.content,photos:Object.fromEntries(def.characterProfile.poses.map(p=>[p.slot,{id:set.assets.find(a=>a.asset==='pose:'+p.slot).mediaId,mode:'prepared',confirmed:true}]))}}};return reply({draft:record,set});}
  }
  if(u.pathname==='/api/video-personalise'){
   if(action==='media')return route.fulfill({contentType:'image/png',body:png});
   if(action==='reserve')return reply({id:randomUUID(),pathname:'fixture.png'});
   if(action==='local-upload')return reply({ready:true});
   if(action?.startsWith('payment-')){calls.push(action);if(action==='payment-verify')paid=true;return reply({invitationId:invitation,amount:58882,currency:'INR',quote:{basePaise:49900,taxBps:1800,taxPaise:8982,totalPaise:58882},status:paid?'captured':'pending',unlocked:paid,keyId:'fixture',orderId:'order_fixture'});}
   return reply(config);
  }
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://shop.test/video-personalise?template='+def.id+'&draft='+invitation);
 await page.getByRole('radio',{name:'Create matching characters from two photos'}).waitFor();
 assert.equal(await page.getByRole('radio',{name:'Create matching characters from two photos'}).isChecked(),true);
 for(const person of ['bride','groom']){await page.getByLabel('Upload '+person+' photo').setInputFiles({name:person+'.png',mimeType:'image/png',buffer:png});await page.waitForFunction(person=>document.querySelector('[aria-label="Upload '+person+' photo"]')?.disabled===false,person);}
 const nav=page.getByRole('navigation',{name:'Personalization steps'});
 await nav.getByRole('button',{name:/The couple/}).click();await page.locator('#video-bride').fill('Too wide for this scene');await nav.getByRole('button',{name:/Photos/}).click();
 await page.getByRole('button',{name:'Pay ₹588.82',exact:true}).click();
 await page.getByText(/Shorten bride’s name/).first().waitFor();assert.equal(calls.includes('payment-order'),false);
 await page.locator('#video-bride').fill('Priya');await nav.getByRole('button',{name:/Photos/}).click();
 await page.getByRole('button',{name:'Pay ₹588.82',exact:true}).click();
 await page.getByRole('button',{name:'Create my characters',exact:true}).click();
 await page.getByRole('button',{name:'Approve faces & create scenes',exact:true}).click();
 await page.getByRole('button',{name:'Approve all illustrations',exact:true}).click();
 await page.getByText('Your matching illustrations are approved.').waitFor({state:'attached'});
 await nav.getByRole('button',{name:/Review & download/}).click();
 await page.locator('#video-confirm').check();
 await page.getByRole('button',{name:'Create my video',exact:true}).waitFor();
 assert.equal(Object.keys(record.payload.content.photos).length,9);assert.deepEqual(calls.filter(a=>a.startsWith('set-')),['set-submit','set-confirm','set-approve']);
 await page.reload();await page.locator('#video-confirm').waitFor();
 await nav.getByRole('button',{name:/The couple/}).click();await page.locator('#video-bride').fill('Kavya');await nav.getByRole('button',{name:/Review & download/}).click();
 assert.deepEqual(calls.filter(a=>a==='set-submit'),['set-submit']);assert.equal(await page.locator('#video-confirm').isChecked(),false);
 assert.deepEqual(errors,[]);console.log(width+'px: two uploads, ₹588.82 checkout, identity review, nine-pose approval, saved resume and text-only edit passed');await context.close();
}}finally{await browser.close();}
