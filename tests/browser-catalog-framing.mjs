// Exercise real invitation documents/assets. The public version API is replaced
// with the checked-in template definitions, never a placeholder iframe document.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright-core';
import {cinorevTemplate} from '../shared/cinorev-templates.mjs';
import media from '../shared/catalog-preview-media.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const affected=['midnight-stage','little-blessing','noir-and-gold','golden-hour','pearl-and-sapphire'];
const versions=affected.map(id=>({...cinorevTemplate(id).template,id:media.websites[id].version,template_id:id}));
const catalog=versions.map(version=>({id:version.template_id,name:version.name,tradition:version.tradition,thumbnail:media.websites[version.template_id].poster,current_version_id:version.id}));
const browser=await engine.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const context=await browser.newContext({viewport:{width:400,height:560},reducedMotion:'reduce'});
await context.route('**/*',route=>{
 const url=new URL(route.request().url());
 if(url.origin!==origin)return route.abort();
 if(!url.pathname.startsWith('/api/'))return route.continue();
 if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='version')return route.fulfill({json:{version:versions.find(version=>version.id===url.searchParams.get('id'))}});
 if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public')return route.fulfill({json:{templates:catalog,basePaise:19900}});
 return route.fulfill({json:{templates:[],drafts:[],invitations:[]}});
});

async function invitationFrame(page){
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe')).some(frame=>frame.contentDocument?.documentElement?.dataset.fmiReady==='true'),{},{timeout:30000});
 const frame=page.frames().find(frame=>frame.url()==='about:srcdoc');
 assert.ok(frame,'Real personalised invitation document loaded');
 await frame.evaluate(()=>document.fonts.ready);
 return frame;
}

async function fillsFrame(frame,label){
 const bounds=await frame.evaluate(()=>{const rect=document.querySelector('.inv').getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width,viewport:innerWidth};});
 assert.equal(bounds.viewport,400,label+' uses the existing 400px native preview');
 assert.ok(Math.abs(bounds.left)<1&&Math.abs(bounds.right-bounds.viewport)<1&&Math.abs(bounds.width-bounds.viewport)<1,label+' inner invitation fills the iframe, with no pillarbox gutters');
}

async function noBlackGutters(bytes,label){
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const darkFraction=x=>{
  let dark=0;
  for(let y=0;y<info.height;y++){const i=(y*info.width+x)*4;if(data[i]<22&&data[i+1]<22&&data[i+2]<22&&data[i+3]>240)dark++;}
  return dark/info.height;
 };
 assert.ok(!(darkFraction(1)>.95&&darkFraction(info.width-2)>.95),label+' does not contain full-height black bars baked into its pixels');
 return info;
}

try{
 for(const version of versions){
  for(const mode of ['embedded=1','thumbnail=1']){
   const page=await context.newPage();
   await page.goto(origin+'/template-preview?version='+version.id+'&lang=en&'+mode);
   const frame=await invitationFrame(page);
   await fillsFrame(frame,version.template_id+' '+mode);
   if(version.template_id==='noir-and-gold'){
    const title=await frame.locator('.g-k').boundingBox();
    assert.ok(title.y>=0&&title.y+title.height<=560,'Expanding the artwork keeps the couple names visible');
    await noBlackGutters(await page.screenshot(),version.template_id+' '+mode);
   }
   if(version.template_id==='golden-hour'){
    const hint=await frame.locator('.tap0').boundingBox();
    assert.ok(hint.y>=0&&hint.y+hint.height<=560,'Expanding the artwork keeps the opening instruction visible');
   }
   await page.close();
  }
  for(const [width,path] of Object.entries(media.websites[version.template_id].posters)){
   const info=await noBlackGutters(await readFile(new URL('../public'+path,import.meta.url)),path);
   assert.equal(info.width,Number(width),path+' retains its responsive image width');
   assert.equal(info.height,Number(width)*560/400,path+' retains the card artwork ratio');
  }
  console.log(`${engine.name()}: ${version.name} real preview and poster framing passed`);
 }

 // The fix is scoped to catalogue presentation; full invitation framing remains authored.
 const standalone=await context.newPage();
 const noir=versions.find(version=>version.template_id==='noir-and-gold');
 await standalone.goto(origin+'/template-preview?version='+noir.id+'&lang=en');
 const original=await invitationFrame(standalone);
 assert.equal(await original.locator('[data-catalog-framing]').count(),0);
 assert.equal(await original.locator('.inv').evaluate(element=>element.getBoundingClientRect().width),380,'Standalone design keeps its original stage width');
 await standalone.close();

 for(const width of [390,1440]){
  const page=await context.newPage();await page.setViewportSize({width,height:900});
  await page.goto(origin+'/');
  const card=page.locator('.di-pin').filter({has:page.getByRole('heading',{name:'Noir & Gold',exact:true})});
  await card.getByRole('button',{name:'Preview Noir & Gold',exact:true}).click();
  await card.locator('.di-preview-sound').waitFor({timeout:30000});
  const frame=page.frames().find(frame=>frame.url()==='about:srcdoc');
  await fillsFrame(frame,width+'px actual inline catalogue');
  await card.getByRole('button',{name:'Expand Noir & Gold',exact:true}).click();
  await fillsFrame(frame,width+'px actual expanded catalogue');
  await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();
  assert.ok(page.frames().includes(frame),'Closing fullscreen preserves the same invitation document');
  await page.close();
 }
 console.log(`${engine.name()}: five real invitation stages fill embedded/thumbnail frames, 15 poster variants have no black gutters, mobile/desktop expanded previews fit, and standalone framing is preserved`);
}finally{await browser.close();}
