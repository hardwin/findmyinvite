import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
import {videoDiscoveryTaxonomy,filterVideoCatalog} from '../shared/discovery-taxonomy.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const templates=Object.keys(videoDiscoveryTaxonomy).map((id,i)=>({id,name:`${i%2?'Celebration':'Wedding'} ${String(i).padStart(2,'0')}`,poster:'/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp',preview:'/fixture-preview.mp4',duration:54,tier:i%2?'elite':'premium',templateCode:'FMI#'+String(i).padStart(4,'0'),microDescription:i%2?'A celebration to remember':'Temple ceremony',amount:(999-i)*100,quote:{basePaise:(999-i)*100},...(i%3===0?{offerLabel:'Christmas Offer'}:{})}));
assert.ok(templates.length>24);

for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
  await page.route('**/fixture-preview.mp4',route=>route.fulfill({status:404,body:''}));
  await page.route('**/api/**',route=>{
   const url=new URL(route.request().url());
   return route.fulfill({json:url.pathname==='/api/video-personalise'?{templates}:url.pathname==='/api/templates'?{templates:[],basePaise:19900}:{}});
  });
  const grid=page.locator('.di-video-library-grid');
  const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  async function packing(){
   await settle();
   const layout=await grid.evaluate(el=>{
    const origin=el.getBoundingClientRect(),style=getComputedStyle(el);
    return {gap:parseFloat(style.columnGap),width:origin.width,height:origin.height,overflow:el.scrollWidth>el.clientWidth+1,cards:[...el.children].map(card=>{const b=card.getBoundingClientRect();return {x:b.x-origin.x,y:b.y-origin.y,width:b.width,height:b.height};})};
   });
   const columns=new Map();
   for(const card of layout.cards){const key=Math.round(card.x);if(!columns.has(key))columns.set(key,[]);columns.get(key).push(card);}
   for(const column of columns.values()){
    column.sort((a,b)=>a.y-b.y);assert.ok(Math.abs(column[0].y)<1);
    for(let i=1;i<column.length;i++){
     const gap=column[i].y-column[i-1].y-column[i-1].height;
     assert.ok(gap>=layout.gap-.15&&gap<=layout.gap+1.1,`Tight masonry gap: ${gap}`);
    }
   }
   assert.equal(layout.overflow,false,'Grid never becomes a horizontal scroller');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.ok(layout.height>=Math.max(...layout.cards.map(card=>card.y+card.height)));
   return layout;
  }
  async function choose(label,option){await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();await settle();}
  await page.goto(origin+'/templates?kind=video');await grid.waitFor();
  assert.equal(await page.getByRole('heading',{level:1}).innerText(),'Invitation Videos');
  assert.equal(await page.getByRole('heading',{name:'Invitation Videos',exact:true}).count(),1);
  assert.doesNotMatch(await page.locator('main').innerText(),/Invitation library|Find your invitation video|Explore designs for your occasion|\d+ (video )?designs|Browse websites/);
  assert.deepEqual(await page.getByRole('combobox').allTextContents(),['Style','Collection','Featured']);
  const initial=await packing();assert.equal(initial.cards.length,12);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:844});await packing();
   const row=await page.getByRole('combobox').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {y:b.y,width:b.width,height:b.height};}));
   assert.ok(row.every(item=>Math.abs(item.y-row[0].y)<1&&item.height>=(width<=920?44:35)&&item.width>=44),'Three compact controls occupy one row with mobile touch targets');
  }
  await page.setViewportSize({width:390,height:844});
  const before=await packing();
  await page.locator('.di-video-library-more').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelectorAll('.di-video-library-grid>.di-preview-anchor').length===24);
  const appended=await packing();assert.deepEqual(appended.cards.slice(0,12),before.cards,'Appending does not reshuffle existing cards');
  while(await page.locator('.di-video-library-more').count()){
   const previous=await grid.locator(':scope>.di-preview-anchor').count();
   await page.locator('.di-video-library-more').scrollIntoViewIfNeeded();
   await page.waitForFunction(count=>document.querySelectorAll('.di-video-library-grid>.di-preview-anchor').length>count,previous);
  }
  assert.equal((await packing()).cards.length,templates.length,'Scrolling reveals the entire collection without clicking Load more');
  await choose('Style','Temple');
  const temple=filterVideoCatalog(templates,{setting:'temple'});
  assert.equal(await grid.locator(':scope>.di-preview-anchor').count(),Math.min(12,temple.length),'Filtering resets pagination');
  await choose('Collection','Elite');
  const elite=filterVideoCatalog(templates,{setting:'temple',collection:'elite'});
  assert.equal(await grid.locator(':scope>.di-preview-anchor').count(),elite.length);
  await choose('Sort designs','Price: low to high');
  assert.equal(await grid.locator('h3').first().innerText(),filterVideoCatalog(templates,{setting:'temple',collection:'elite',sort:'price'})[0].name);
  await packing();
  await choose('Collection','Free collection');assert.match(await page.locator('main').innerText(),/No videos match these choices/);assert.equal(await grid.count(),0);
  await choose('Collection','Collection');await choose('Style','Style');await choose('Sort designs','Featured');
  await grid.locator('.di-card-expand').first().click();await page.locator('dialog[open]').waitFor();
  await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();await packing();
  // Error copy changes a card's height; packing must remain correct.
  await page.locator('.di-card-status').first().waitFor();await packing();
  await page.goto(origin+'/');await page.locator('.di-video-featured').waitFor();
  assert.equal(await page.locator('.di-video-featured .di-video-card').count(),8,'Homepage keeps its existing featured layout');
  assert.equal(await page.getByRole('combobox').count(),0);
  await page.goto(origin+'/templates?kind=website');await page.getByRole('combobox',{name:'Style',exact:true}).waitFor();
  assert.deepEqual(await page.getByRole('combobox').allTextContents(),['Style','Collection','Featured']);

  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(origin+'/templates?kind=video');await grid.waitFor();await settle();
  await page.evaluate(()=>{
   window.revealAudit={frames:0,intermediate:0,regressions:0,running:true};const seen=new WeakSet();
   function tick(){const audit=window.revealAudit;if(!audit.running)return;
    for(const el of document.querySelectorAll('.di-video-library-grid>.di-preview-anchor')){
     const opacity=Number(getComputedStyle(el).opacity);
     if(seen.has(el)&&opacity<.99)audit.regressions++;
     if(el.dataset.libraryReveal==='seen')seen.add(el);
     if(opacity>0&&opacity<1)audit.intermediate++;
    }
    audit.frames++;requestAnimationFrame(tick);
   }requestAnimationFrame(tick);
  });
  const reveal=grid.locator('[data-library-reveal=ready]').first();
  const index=await reveal.evaluate(el=>[...el.parentElement.children].indexOf(el));
  await reveal.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-350,behavior:'instant'}));
  await page.waitForFunction(i=>document.querySelector('.di-video-library-grid').children[i].dataset.libraryReveal==='seen',index);
  for(const top of [0,1000,0,1000]){await page.evaluate(top=>scrollTo({top,behavior:'instant'}),top);await settle();}
  const audit=await page.evaluate(()=>{window.revealAudit.running=false;return window.revealAudit;});
  assert.ok(audit.intermediate>0,'Cards fade in over multiple frames');assert.equal(audit.regressions,0,'Revealed cards never fade out on repeated scrolling');
  await page.emulateMedia({reducedMotion:'reduce'});await settle();
  assert.ok(await grid.locator(':scope>.di-preview-anchor').evaluateAll(els=>els.every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).animationName==='none')));
  assert.deepEqual(errors,[]);
  console.log(engine.name()+': compact three-filter row at 320/390/768/1440px, no extra headings/counts, masonry, automatic append, filter/sort/reset, fullscreen/error heights, preserved homepage, smooth once-only reveal and reduced motion passed');
 }finally{await browser.close();}
}
