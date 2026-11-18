import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
 await page.route('**/template-preview?**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Invitation preview</body></html>'}));
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/templates')return route.fulfill({json:{templates:Array.from({length:34},(_,i)=>({id:'site-'+i,name:'Website '+i,thumbnail:'/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp',current_version_id:'version-'+i,templateCode:'FMI#'+i,microDescription:i%2?'A celebration to remember':'Temple ceremony'})),basePaise:19900}});
  if(url.pathname==='/api/video-personalise')return route.fulfill({json:{templates:Array.from({length:34},(_,i)=>({id:'video-'+i,name:'Video '+i,poster:'/assets/catalog-previews/names-v1/websites/thiruvarul-edge-v2-320.webp',preview:'/test-preview.mp4',templateCode:'FMI#'+(i+34),microDescription:i%2?'Celebrate your wedding story':'Garden ceremony',amount:49900,duration:54}))}});
  return route.fulfill({json:{}});
 });
 const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const geometry=()=>page.locator('.di-search-grid').evaluate(grid=>{
  const rect=grid.getBoundingClientRect(),style=getComputedStyle(grid);
  return {width:rect.width,height:rect.height,gap:parseFloat(style.columnGap),cards:Array.from(grid.children).map(card=>{
   const box=card.getBoundingClientRect();return {x:box.left-rect.left,y:box.top-rect.top,width:box.width,height:box.height};
  })};
 });
 async function verifyPacking(){
  await settle();const state=await geometry(),columns=new Map();
  for(const card of state.cards){const key=Math.round(card.x);if(!columns.has(key))columns.set(key,[]);columns.get(key).push(card);}
  const ordered=[...columns.values()].sort((a,b)=>a[0].x-b[0].x);
  for(const column of ordered){
   column.sort((a,b)=>a.y-b.y);assert.ok(Math.abs(column[0].y)<1,'Every column begins at the top');
   for(let i=1;i<column.length;i++){
    const gap=column[i].y-column[i-1].y-column[i-1].height;
    assert.ok(gap>=state.gap-.1&&gap<state.gap+1.1,`Cards pack without blank row space: ${gap}px gap`);
   }
  }
  for(let i=1;i<ordered.length;i++)assert.ok(Math.abs(ordered[i][0].x-ordered[i-1][0].x-ordered[i-1][0].width-state.gap)<1,'Horizontal spacing matches the vertical gutter');
  assert.ok(Math.abs(ordered[0][0].x)<1,'No extra left inset');
  assert.ok(Math.abs(ordered.at(-1)[0].x+ordered.at(-1)[0].width-state.width)<1,'Cards fill the right edge');
  assert.ok(state.height>=Math.max(...state.cards.map(c=>c.y+c.height)),'Container encloses every card');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  return state;
 }
 await page.goto(origin+'/search');await page.locator('.di-search-grid').waitFor();
 const initial=await verifyPacking();assert.equal(initial.cards.length,24);
 assert.ok(initial.cards[2].y<initial.cards[1].height,'The next website fills the shorter first column');
 const more=page.getByRole('button',{name:'Load more',exact:true});
 await more.scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);await more.click();
 await page.waitForFunction(()=>document.querySelectorAll('.di-search-grid>.di-preview-anchor').length===48);
 const appended=await verifyPacking();assert.deepEqual(appended.cards.slice(0,24),initial.cards,'Loading more does not reshuffle earlier cards');
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<3,'Load more keeps scroll position');
 while(await more.count())await more.click();
 const full=await verifyPacking();assert.equal(full.cards.length,68);
 for(const width of [320,768,1440,390]){await page.setViewportSize({width,height:900});await verifyPacking();}
 const before=await geometry();
 await page.locator('.di-pin').first().getByRole('button',{name:/Expand/}).click();
 await page.locator('dialog[open]').waitFor();await verifyPacking();
 await page.getByRole('button',{name:'Close fullscreen preview',exact:true}).click();
 const after=await verifyPacking();assert.deepEqual(after.cards,before.cards,'Fullscreen preview keeps its masonry position');
 // A media error adds status text; the measured layout must adapt to its height.
 await page.locator('.di-video-card').first().getByRole('button',{name:/Play preview/}).click();
 await page.locator('.di-card-status').waitFor();await verifyPacking();
 assert.deepEqual(errors,[]);
 console.log(`${engine.name()}: tightly packed 68 cards at 320/390/768/1440px; stable append, resize, fullscreen and scroll passed`);
}finally{await browser.close();}
