// Exercise real navigation and mixed pagination with independent public fixtures.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';
import {discoveryTaxonomy,videoDiscoveryTaxonomy,matchesDiscoverySearch,matchesVideoSearch} from '../shared/discovery-taxonomy.mjs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const websites=Object.keys(discoveryTaxonomy).map((id,i)=>({id,name:'Design Website '+i,description:'Personalised invitation',thumbnail:'/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp',current_version_id:'search-version-'+i,templateCode:'FMI#'+String(i+1).padStart(4,'0'),microDescription:'A unique celebration'}));
const videos=Object.keys(videoDiscoveryTaxonomy).map((id,i)=>({id,name:'Design Video '+i,poster:'/assets/catalog-previews/names-v1/websites/thiruvarul-edge-v2-320.webp',preview:'/test-preview.mp4',amount:49900,duration:54,templateCode:'FMI#'+String(i+100).padStart(4,'0'),microDescription:'An animated celebration'}));
const expected=query=>websites.filter(t=>matchesDiscoverySearch({...t,kind:'website'},query)).length+videos.filter(t=>matchesVideoSearch(t,query)).length;
const browser=await engine.launch({headless:true});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  let videoFailure=false,websiteFailure=false;
  await context.route('**/api/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/templates'&&url.searchParams.get('action')==='public')return route.fulfill(websiteFailure?{status:503,json:{error:'Unavailable'}}:{json:{templates:websites,basePaise:19900}});
   if(url.pathname==='/api/video-personalise'&&url.searchParams.get('action')==='templates'){
    await new Promise(resolve=>setTimeout(resolve,150));
    return route.fulfill(videoFailure?{status:503,json:{error:'Unavailable'}}:{json:{templates:videos}});
   }
   return route.fulfill({json:{templates:[],drafts:[],invitations:[]}});
  });
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  const input=()=>page.getByRole('textbox',{name:'Search designs',exact:true});
  const resultCards=()=>page.locator('.di-search-grid > .di-preview-anchor');
  const ready=()=>page.locator('.di-search-grid').waitFor();
  async function submit(query){await input().fill(query);await input().press('Enter');await page.waitForURL(u=>u.pathname==='/search'&&u.searchParams.get('q')===query);await ready();}
  await page.goto(origin+'/');await page.locator('.di-pin').first().waitFor();
  await submit('wedding');
  assert.equal(await page.locator('.di-hero,.di-trending,.dc-categories,.di-video-collection').count(),0,'Search results contain no homepage sections or separate video section');
  assert.equal(await page.locator('.di-search-grid').count(),1);
  assert.equal(await resultCards().count(),24);
  assert.equal(await page.evaluate(()=>scrollY),0,'Enter opens results at the top instead of scrolling the homepage');
  assert.deepEqual(await resultCards().evaluateAll(els=>els.slice(0,8).map(el=>el.querySelector('.di-video-card')?'video':'website')),['website','video','website','video','website','video','website','video']);
  assert.equal(await page.getByRole('heading',{name:/^Invitation (Videos|Websites)$/}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Load more',exact:true}).count(),1);
  const firstCodes=await page.locator('.di-search-grid .di-template-code').allTextContents();
  const more=page.getByRole('button',{name:'Load more',exact:true});await more.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);
  await more.click();await page.waitForFunction(()=>document.querySelectorAll('.di-search-grid>.di-preview-anchor').length===48);
  assert.deepEqual((await page.locator('.di-search-grid .di-template-code').allTextContents()).slice(0,24),firstCodes,'Load more appends without replacing earlier results');
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<3,'Load more keeps the current scroll position');
  while(await more.count())await more.click();
  assert.equal(await resultCards().count(),expected('wedding'));
  assert.equal(new Set(await page.locator('.di-search-grid .di-template-code').allTextContents()).size,expected('wedding'));
  const site=page.locator('.di-search-grid .di-pin').first(),video=page.locator('.di-search-grid .di-video-card').first();
  assert.match(await site.locator('.di-use-template').getAttribute('href'),/^\/personalise\?version=search-version-/);
  assert.match(await video.locator('.di-use-template').getAttribute('href'),/^\/video-personalise\?template=/);
  await page.reload();await ready();assert.equal(await resultCards().count(),24,'Reload preserves the query and starts one result page');
  await input().fill('FMI#0001');await page.getByRole('button',{name:'Search invitations',exact:true}).click();await page.waitForURL(u=>u.pathname==='/search'&&u.searchParams.get('q')==='FMI#0001');await ready();assert.equal(await resultCards().count(),1);
  assert.equal(await page.locator('.di-template-code').first().textContent(),'FMI#0001');
  await page.goBack();await ready();assert.equal(await input().inputValue(),'wedding');
  await page.getByRole('link',{name:'Clear search',exact:true}).click();await page.waitForURL(u=>u.pathname==='/search'&&!u.searchParams.has('q'));await ready();assert.equal(await input().inputValue(),'');
  await input().fill('zzzz-no-match');await input().press('Enter');await page.getByRole('heading',{name:'No invitations found'}).waitFor();assert.equal(await resultCards().count(),0);assert.equal(await more.count(),0);
  await page.goto(origin+'/?q=wedding',{waitUntil:'domcontentloaded'});await page.waitForURL('**/search?q=wedding');await ready();assert.equal(await page.locator('.di-hero').count(),0,'Old homepage search URLs migrate to the search page');
  await page.goto(origin+'/');await page.locator('.di-pin').first().waitFor();assert.equal(await page.locator('.di-search-grid').count(),0);await page.locator('.di-trending a').first().click();await page.waitForURL('**/search?*');await ready();
  await page.goto(origin+'/templates?kind=website');await page.locator('.di-pin').first().waitFor();await submit('wedding');assert.ok(await page.locator('.di-search-grid .di-video-card').count()>0,'Searching from website library includes matching videos');
  if(width===1440){await page.goto(origin+'/pricing');await page.getByRole('textbox',{name:'Search invitations',exact:true}).fill('wedding');await page.getByRole('button',{name:'Submit search',exact:true}).click();await page.waitForURL('**/search?q=wedding');await ready();}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  // A failed catalogue must not erase matches from the other format or claim no matches.
  videoFailure=true;await page.goto(origin+'/search?q=wedding');await page.getByRole('alert').waitFor();await ready();assert.equal(await page.locator('.di-search-grid .di-video-card').count(),0);assert.ok(await page.locator('.di-search-grid .di-pin').count()>0);
  videoFailure=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('.di-search-grid .di-video-card').first().waitFor();
  websiteFailure=true;await page.reload();await page.getByRole('alert').waitFor();await ready();assert.ok(await page.locator('.di-search-grid .di-video-card').count()>0);assert.equal(await page.locator('.di-search-grid .di-pin').count(),0);
  assert.deepEqual(errors,[]);
  console.log(`${engine.name()} ${width}px: Enter/click search, mixed results, one Load more, back/reload/clear, homepage isolation, legacy URLs, empty state, partial failures and retry passed`);
  await context.close();
 }
}finally{await browser.close();}
