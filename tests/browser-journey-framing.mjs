import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright-core';
import {theeramTemplate} from '../shared/theeram-template.mjs';
import {thiruvarulTemplate} from '../shared/thiruvarul-template.mjs';
import {payanamTemplate} from '../shared/kalyana-payanam-template.mjs';
import media from '../shared/catalog-preview-media.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const templates=[theeramTemplate,thiruvarulTemplate,payanamTemplate];
const versions=templates.map(t=>({...t,id:media.websites[t.id].version,template_id:t.id}));
const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
try{
 const context=await browser.newContext({viewport:{width:400,height:560},reducedMotion:'reduce'});
 await context.route('**/api/**',route=>{const url=new URL(route.request().url());return route.fulfill({json:{version:versions.find(v=>v.id===url.searchParams.get('id'))}});});
 for(const version of versions){
  for(const mode of ['embedded=1','thumbnail=1','']){
   const page=await context.newPage();
   await page.goto(`${origin}/template-preview?version=${version.id}&lang=en&${mode}`);
   await page.locator('iframe[data-template-version]').waitFor({timeout:45000});
   const frame=page.frames().find(f=>f.url()==='about:srcdoc');
   await frame.locator('#doors.ready').waitFor({state:'attached',timeout:45000});
   const bounds=await frame.locator('#stage').evaluate(el=>{const r=el.getBoundingClientRect();const canvas=el.querySelector('#gl').getBoundingClientRect();return {left:r.left,width:r.width,height:r.height,canvas:canvas.width,viewport:innerWidth};});
   if(mode){
    assert.equal(bounds.left,0,`${version.template_id}: no left gutter`);
    assert.equal(bounds.width,bounds.viewport,`${version.template_id}: stage fills catalogue width`);
    assert.equal(bounds.canvas,bounds.width,'WebGL canvas fills stage');
   }else{
    assert.equal(await frame.locator('[data-catalog-framing]').count(),0,'Standalone invitation keeps its authored framing');
    assert.ok(bounds.width<bounds.viewport,'Original portrait proportions remain unchanged');
   }
   await page.close();
  }
  for(const [width,path] of Object.entries(media.websites[version.template_id].posters)){
   const {data,info}=await sharp(await readFile(new URL('../public'+path,import.meta.url))).removeAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(info.width,Number(width));assert.equal(info.height,Number(width)*1.4);
   // Flat coloured pillars are as wrong as black pillars. Artwork must vary
   // vertically at both sides instead of repeating the page background.
   for(const x of [2,info.width-3]){
    const colors=new Set();for(let y=8;y<info.height-8;y+=8){const i=(y*info.width+x)*info.channels;colors.add([data[i]>>4,data[i+1]>>4,data[i+2]>>4].join(','));}
    assert.ok(colors.size>12,`${path}: ${x===2?'left':'right'} edge contains artwork, not a flat gutter (${colors.size} colours)`);
   }
  }
  console.log(`${engine.name()}: ${version.template_id} live/thumbnail frames fill width; three poster sizes contain artwork at both edges; standalone preserved`);
 }
}finally{await browser.close();}
