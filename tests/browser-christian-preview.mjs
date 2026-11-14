// Regression: the unpaid wizard preview scrolls an element, not the window.
// API fixtures keep this check independent of accounts, payments and customer data.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import schemas from './fixtures/template-form-schemas.json' with {type:'json'};
import previews from './fixtures/template-preview-content.json' with {type:'json'};
import {definitions} from '../scripts/template-form-definitions.mjs';
import {compileTemplateForm} from '../shared/template-forms.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const version={...schemas.find(v=>v.template_id==='christian-bells'),defaults:previews.find(v=>v.template_id==='christian-bells').defaults};
const form={template_version_id:version.id,revision:1,definition:compileTemplateForm(definitions['christian-bells'],version.field_schema)};
const content={...version.defaults,language:'en',whatsapp:'919876543210',_form:{authored:true,story:true}};
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});

async function scrollScene(page,id,progress,nested){
 await page.locator('#'+id).evaluate((scene,{progress,nested})=>{
  const container=nested?document.querySelector('.iw-preview'):null;
  const height=container?.clientHeight||innerHeight;
  const top=container?.getBoundingClientRect().top||0;
  const rect=scene.getBoundingClientRect();
  (container||window).scrollTo({top:(container?.scrollTop||scrollY)+rect.top-top+(rect.height-height)*progress,behavior:'instant'});
 },{progress,nested});
 await page.waitForFunction(({id,progress})=>Math.abs(Number(document.getElementById(id).style.getPropertyValue('--p'))-progress)<.02,{id,progress});
 const stageTop=await page.locator('#'+id+' .stage').evaluate(stage=>stage.getBoundingClientRect().top);
 assert.ok(Math.abs(stageTop)<2,`${id} remains pinned while scrolling (${nested?'wizard':'catalogue'}, top=${stageTop})`);
}

async function checkScenes(page,nested){
 await page.locator('.ce-page').waitFor();
 await scrollScene(page,'s-sky',.7,nested);
 for(const side of ['l','r']){
  const palm=page.locator('.palm.'+side);
  await palm.locator('img').evaluate(img=>img.decode());
  assert.ok(await palm.evaluate(el=>{
   const r=el.getBoundingClientRect(),stage=el.parentElement.getBoundingClientRect();
   return r.width>0&&r.right>stage.left+50&&r.left<stage.right-50&&r.bottom>stage.top&&r.top<stage.bottom;
  }),'Palm tree is inside the visible stage');
 }
 await scrollScene(page,'s-doors',0,nested);
 const closed=await page.locator('.half.l').evaluate(el=>getComputedStyle(el).transform);
 await scrollScene(page,'s-doors',.4,nested);
 assert.notEqual(await page.locator('.half.l').evaluate(el=>getComputedStyle(el).transform),closed,'Door rotates as the user scrolls');
 await scrollScene(page,'s-doors',.8,nested);
 assert.equal(await page.locator('.doors').evaluate(el=>Number(getComputedStyle(el).opacity)),0,'Open doors reveal the aisle');
 assert.ok(await page.locator('.vow').evaluate(el=>Number(getComputedStyle(el).opacity))>.5,'Ceremony card appears');
 await scrollScene(page,'s-story',.5,nested);
 assert.ok(await page.locator('.pol').nth(1).evaluate(el=>Number(getComputedStyle(el).opacity))>.9,'Story also follows the preview scroll');
}

try{
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
  const context=await browser.newContext({viewport,reducedMotion:'no-preference'});
  const errors=[],calls=[];
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin)return route.abort();
   if(!url.pathname.startsWith('/api/'))return route.continue();
   const action=url.searchParams.get('action');calls.push(action);
   if(action==='editor')return route.fulfill({json:{version,form}});
   if(action==='version')return route.fulfill({json:{version}});
   if(action==='v2-config')return route.fulfill({json:{configured:true,quote:{basePaise:19900,taxPaise:3582,totalPaise:23482}}});
   return route.fulfill({json:{}});
  });
  await context.addInitScript(({version,form,content})=>{
   sessionStorage.setItem('fmi-form:'+version.id+':new',JSON.stringify({formRevision:1,content,stepIndex:form.definition.steps.length-1}));
  },{version,form,content});
  await page.goto(origin+'/personalise?version='+version.id);
  await page.getByRole('button',{name:'Preview your invitation',exact:true}).click();
  await checkScenes(page,true);
  assert.equal(await page.evaluate(()=>scrollY),0,'Only the preview container scrolls');
  await page.getByRole('button',{name:'Back to your answers'}).click();
  await page.getByRole('button',{name:'Preview your invitation',exact:true}).click();
  await scrollScene(page,'s-sky',.7,true);
  assert.ok(!calls.some(action=>['google-start','v2-create','v2-order','v2-publish'].includes(action)),'Preview needs no login, payment or publication');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.ce-page .still').waitFor();
  assert.equal(await page.locator('.doors').evaluate(el=>Number(getComputedStyle(el).opacity)),0,'Reduced motion shows the open doors without scrolling');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(origin+'/template-preview?version='+version.id);
  await checkScenes(page,false);
  assert.deepEqual(errors,[]);
  console.log(`Bells & Blessings preview passed: ${viewport.width}px (unpaid, reopened, reduced motion, catalogue)`);
  await context.close();
 }
}finally{await browser.close();}
