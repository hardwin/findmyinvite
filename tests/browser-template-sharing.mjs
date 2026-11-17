import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1');
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}});
   Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>data.files?.[0]?.type==='image/jpeg'});
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared={url:data.url,files:data.files.map(file=>({name:file.name,type:file.type,size:file.size}))};}});
  });
  for(const [product,kind,name] of [['film-walk-v1','video','Wisteria Walk'],['wedding-bells-v1','video','Wedding Bells'],['kerala-lanterns','website','Lanterns & Kasavu']]){
   const path='/templates?'+new URLSearchParams({product,kind});
   const response=await page.request.get(origin+path,{headers:{'User-Agent':'WhatsApp/2.2236.3 N'}}),html=await response.text();
   assert.equal(response.status(),200);assert.ok(html.includes('template-share-images/'+kind+'/'+product+'/'));assert.ok(!html.includes('findmyinvite-og.jpg'));
   await page.goto(origin+path);await page.locator('.di-detail-copy').waitFor();
   await page.locator('.di-detail-copy').getByRole('button',{name:'Share '+name,exact:true}).click();
   const dialog=page.getByRole('dialog',{name:'Share '+name,exact:true});
   await dialog.getByAltText(name+' share preview').waitFor({timeout:20000});
   for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:844});
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   }
   await dialog.getByRole('button',{name:'Copy link',exact:true}).click();
   const copied=await page.evaluate(()=>window.__copied);assert.equal(new URL(copied).searchParams.get('product'),product);assert.equal(new URL(copied).searchParams.get('share'),'card-v1');
   const whatsApp=new URL(await dialog.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href'));
   assert.ok(whatsApp.searchParams.get('text').includes(copied));
   await dialog.getByRole('button',{name:'Instagram',exact:true}).click();
   const shared=await page.evaluate(()=>window.__shared);assert.equal(shared.url,copied);assert.equal(shared.files.length,1);assert.equal(shared.files[0].type,'image/jpeg');assert.ok(shared.files[0].size>10000&&shared.files[0].size<600000);
   const downloaded=page.waitForEvent('download');await dialog.getByRole('link',{name:'Save preview image'}).click();const download=await downloaded;assert.equal(download.suggestedFilename(),product+'-findmyinvite.jpg');
   if(engine===chromium&&product==='film-walk-v1')await download.saveAs('work/glass/share-film-walk-v1-final.jpg');
   if(engine===chromium&&product==='wedding-bells-v1'){
    await download.saveAs('work/glass/share-wedding-bells-v1-final.jpg');
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'work/glass/share-dialog-mobile.png'});
   }
   await dialog.getByRole('button',{name:'Close share options'}).click();
  }
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await page.locator('.di-detail-copy .di-template-share').click();
  const dialog=page.getByRole('dialog',{name:'Share Lanterns & Kasavu',exact:true});await dialog.getByAltText('Lanterns & Kasavu share preview').waitFor();
  await dialog.getByRole('button',{name:'Instagram',exact:true}).click();await dialog.getByRole('link',{name:'Open Instagram ↗'}).waitFor();
  assert.ok(await page.evaluate(()=>window.__copied.includes('product=kerala-lanterns')));assert.ok(await dialog.getByRole('link',{name:'Save preview image'}).isVisible());
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': no-JS crawler metadata, three template previews, 320/390/1440px dialog bounds, WhatsApp URL, native JPEG sharing, download and Instagram fallback passed');
 }finally{await browser.close();}
}
