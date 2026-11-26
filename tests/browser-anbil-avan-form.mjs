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
try{for(const width of [390,1280,768,800]){
 const assisted=width===768||width===800;
 let lostSave=false;
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),owner=randomUUID(),invitation=randomUUID(),errors=[],calls=[];
 let record={id:invitation,owner,kind:'video',templateId:def.id,payload:{masterVersion:1,content:structuredClone(def.example),formStepId:'characters',personalPhotosEnabled:true,references:{}},revision:1,updatedAt:new Date().toISOString()},set=null,paid=false;
 if(assisted){
  paid=true;const photos={bride:randomUUID(),groom:randomUUID()};
  set={id:randomUUID(),status:'identity_review',approved:false,photos,assets:['bride','groom'].map(p=>({id:randomUUID(),asset:'identity:'+p,status:'ready',mediaId:randomUUID()}))};
  record.payload.references={bride:{id:photos.bride,identity:'single'},groom:{id:randomUUID(),identity:'single'}};
 }
 const state=()=>({courtesy:assisted?{groom:true}:{},sets:set?[set]:[],current:set&&!set.approved?set.id:null,approved:set?.approved?set.id:null,allowances:{bride:{initialUsed:!!set,redoUsed:false},groom:{initialUsed:!!set,redoUsed:assisted}}});
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
  if(u.pathname==='/api/video-characters'){
   if(action==='set-capabilities')return reply({enabled:true});
   if(action==='sets')return reply(state());
   calls.push(action);
   if(action==='set-submit'){assert.equal(paid,true);set={id:randomUUID(),status:'identity_review',approved:false,photos:body.photos,assets:['bride','groom'].map(p=>({id:randomUUID(),asset:'identity:'+p,status:'ready',mediaId:randomUUID()}))};return reply({set});}
   if(action==='set-confirm'){set.status='review';set.assets.push(...def.characterProfile.poses.map(p=>({id:randomUUID(),asset:'pose:'+p.slot,status:'ready',mediaId:randomUUID()})));return reply({set});}
   if(action==='set-revise'){assert.equal(body.id,set.id);assert.equal(body.slot,'heartCouple');assert.ok(body.requestId);assert.deepEqual(Object.keys(body.references),[body.mode==='cutout'?'photo':'bride']);set={...set,id:randomUUID(),approved:false,status:'review'};return reply({set});}
   if(action==='set-approve'){set.status='approved';set.approved=true;record={...record,revision:record.revision+1,payload:{...record.payload,personalPhotosEnabled:true,charactersChoice:'personal',content:{...record.payload.content,photos:Object.fromEntries(def.characterProfile.poses.map(p=>[p.slot,{id:set.assets.find(a=>a.asset==='pose:'+p.slot).mediaId,mode:'prepared',confirmed:true}]))}}};return reply({draft:record,set});}
  }
  if(u.pathname==='/api/video-personalise'){
   if(action==='media')return route.fulfill({contentType:'image/png',body:png});
   if(action==='render'){calls.push(action);return reply({id:'a'.repeat(64),status:'ready',download:'/api/video-personalise?action=download&id='+('a'.repeat(64)),expiresAt:new Date(Date.now()+86400000).toISOString()});}
   if(action==='delivery-link')return reply({path:'/download/video#fixture'});
   if(action==='reserve')return reply({id:randomUUID(),pathname:'fixture.png'});
   if(action==='local-upload')return reply({ready:true});
   if(action?.startsWith('payment-')){calls.push(action);if(action==='payment-verify')paid=true;return reply({invitationId:invitation,amount:35282,currency:'INR',quote:{basePaise:29900,taxBps:1800,taxPaise:5382,totalPaise:35282},status:paid?'captured':'pending',unlocked:paid,keyId:'fixture',orderId:'order_fixture'});}
   return reply(config);
  }
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://shop.test/video-personalise?template='+def.id+'&draft='+invitation+(assisted?'&assist=1':''));
 await page.getByRole('radio',{name:'Create matching characters from two photos'}).waitFor();
 assert.equal(await page.getByRole('radio',{name:'Create matching characters from two photos'}).isChecked(),true);
 const nav=page.getByRole('navigation',{name:'Personalization steps'});
 if(assisted){
  await page.getByText(/Editing for customer/).waitFor();await page.getByText(/These illustrated faces are saved/).waitFor();
  if(width===768)await page.getByRole('button',{name:'Use saved faces',exact:true}).click();
  else {await page.getByLabel('Upload groom photo').setInputFiles({name:'update.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'Use free courtesy redo',exact:true}).click();}
 }else{
 for(const person of ['bride','groom']){await page.getByLabel('Upload '+person+' photo').setInputFiles({name:person+'.png',mimeType:'image/png',buffer:png});await page.waitForFunction(person=>document.querySelector('[aria-label="Upload '+person+' photo"]')?.disabled===false,person);}
 await nav.getByRole('button',{name:/The couple/}).click();await page.locator('#video-bride').fill('Too wide for this scene');await nav.getByRole('button',{name:/Photos/}).click();
 await page.getByRole('button',{name:'Pay ₹352.82',exact:true}).click();
 await page.getByText(/Shorten bride’s name/).first().waitFor();assert.equal(calls.includes('payment-order'),false);
 await page.locator('#video-bride').fill('Priya');await nav.getByRole('button',{name:/Photos/}).click();
 await page.getByRole('button',{name:'Pay ₹352.82',exact:true}).click();
 await page.getByRole('button',{name:'Create my characters',exact:true}).click();
 }
 await page.getByRole('button',{name:'Approve faces & create scenes',exact:true}).click();
 if(width===390){
  for(const cutout of [false,true]){
   const scene=page.locator('.vp-character-poses figure').filter({has:page.getByText('Shared heart',{exact:true})});
   await scene.getByText('Edit this scene',{exact:true}).click();
   await scene.getByLabel((cutout?'Use my own photo':'Bride reference')+' for Shared heart').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:png});
   await scene.getByRole('button',{name:cutout?'Remove background and use photo':'Recreate this illustration'}).click();
   await page.waitForFunction(()=>!document.querySelector('.vp-scene-edit[open]'));
   assert.ok(!calls.includes('set-approve'));assert.ok(!calls.includes('render'));
  }
 }
 await page.getByRole('button',{name:'Approve all illustrations',exact:true}).click();
 await page.getByText('Your matching illustrations are approved.').waitFor({state:'attached'});
 await nav.getByRole('button',{name:/Review & download/}).click();
 await page.locator('#video-confirm').check();
 await page.getByRole('button',{name:'Create my video',exact:true}).waitFor();
 if(assisted){await page.getByRole('button',{name:'Create my video',exact:true}).click();await page.getByRole('button',{name:'Copy download link'}).waitFor();assert.ok(calls.includes('render'));assert.ok(!calls.includes('payment-order'));assert.equal(record.id,invitation);assert.ok(page.url().includes('assist=1'));assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('fmi-draft-v1:'))),false);assert.deepEqual(errors,[]);console.log('Assisted '+(width===768?'saved-face':'courtesy-redo')+' review, render and delivery passed');await context.close();continue;}
 if(width===390){assert.equal(lostSave,true);assert.equal(await page.getByText('The connection took too long. Please try again.',{exact:true}).count(),0);}
 assert.equal(Object.keys(record.payload.content.photos).length,9);assert.deepEqual(calls.filter(a=>a.startsWith('set-')),['set-submit','set-confirm',...(width===390?['set-revise','set-revise']:[]),'set-approve']);
 await page.reload();await page.locator('#video-confirm').waitFor();
 await nav.getByRole('button',{name:/The couple/}).click();await page.locator('#video-bride').fill('Kavya');await nav.getByRole('button',{name:/Review & download/}).click();
 assert.deepEqual(calls.filter(a=>a==='set-submit'),['set-submit']);assert.equal(await page.locator('#video-confirm').isChecked(),false);
 assert.deepEqual(errors,[]);console.log(width+'px: two uploads, ₹352.82 checkout, identity review, nine-pose approval, saved resume and text-only edit passed');await context.close();
}}finally{await browser.close();}
