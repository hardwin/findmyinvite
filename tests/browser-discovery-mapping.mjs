// Read-only catalog checks against a real dev server or deployment. No customer data is created.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {discoveryHref,matchesDiscoverySearch,matchesVideoSearch} from '../shared/discovery-taxonomy.mjs';

import {browseCategories} from '../shared/discovery-categories.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const report=[];
const sorted=items=>[...items].sort();
try{
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(request.url()));
  const videoResponse=page.waitForResponse(r=>r.url().includes('/api/video-personalise?action=templates'));
  const response=page.waitForResponse(r=>r.url().includes('/api/templates?action=public'));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  const catalog=(await (await response).json()).templates;
  const videos=(await (await videoResponse).json()).templates;
  assert.equal(catalog.length,28);
  await page.waitForFunction(()=>document.querySelectorAll('.di-pin .di-card-details').length===28&&document.querySelectorAll('.di-video-card').length===4&&!Array.from(document.querySelectorAll('.dc-category-count')).some(e=>e.textContent.includes('…')));
  const links=await page.locator('.di-trending a,.dc-category-card').evaluateAll(elements=>elements.map(e=>({label:e.querySelector('.dc-category-name')?.textContent||e.querySelector('span')?.textContent,href:e.getAttribute('href'),count:e.querySelector('.dc-category-count')?.textContent})));
  assert.equal(links.length,23);
  assert.deepEqual(await page.locator('.di-trending a span').allTextContents(),['Save the Date','Christian','Temple','Church','Minimal','Royal','Blush','Floral','Palace','Ivory','Gold','Garden']);
  assert.deepEqual(await page.locator('.dc-category-name').allTextContents(),browseCategories.map(c=>c.label));
  for(const link of links){const category=browseCategories.find(c=>c.label===link.label);assert.equal(link.href,category?discoveryHref(category.query,category.kind):discoveryHref(link.label),link.label);}
  await page.getByRole('heading',{name:'Invitation Websites',exact:true}).waitFor();
  const navigation=page.getByRole('navigation',{name:'Main navigation',exact:true});
  assert.equal(await navigation.getByRole('link',{name:/Pricing|My Pins/}).count(),0);
  await navigation.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('fmi-after-auth')),'/dashboard');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  // Only exercise local UI session state; no authentication request is made.
  await page.evaluate(()=>{sessionStorage.removeItem('fmi-after-auth');localStorage.setItem('findmyinvite-auth-v1',JSON.stringify({access_token:'local-ui-check',user:{id:'local-ui-check'}}));window.dispatchEvent(new Event('fmi-auth-changed'));});
  await navigation.getByRole('button',{name:'My Invitations',exact:true}).waitFor();
  await page.evaluate(()=>{localStorage.removeItem('findmyinvite-auth-v1');window.dispatchEvent(new Event('fmi-auth-changed'));});
  await navigation.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  if(width<640){
   await navigation.getByRole('button',{name:'Menu',exact:true}).click();
   await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).getByRole('button',{name:'Sign in',exact:true}).click();
   await page.getByRole('dialog').waitFor();
   await page.getByRole('button',{name:'Cancel',exact:true}).click();
   assert.ok(await page.locator('.di-video-cards').evaluate(el=>el.scrollWidth>el.clientWidth),'Video row is swipeable');
   await page.locator('.di-video-view-all').scrollIntoViewIfNeeded();
   assert.ok(await page.locator('.di-video-cards').evaluate(el=>el.scrollLeft>0),'End link is reachable by horizontal scrolling');
  }
  assert.equal(await page.locator('.di-video-card').count(),4);
  assert.equal(await page.locator('.di-video-collection>header a').count(),0);
  assert.equal((await page.locator('.di-collection-more a').textContent()).trim(),'View More');
  assert.equal(await page.locator('.di-video-card .di-pin-kind').first().textContent(),'Video');
  assert.match(await page.locator('.di-video-duration').first().textContent(),/^\d+:\d{2}$/);
  assert.equal(await page.locator('.di-video-play').first().textContent(),'');
  for(const kind of ['.di-pin','.di-video-card']){
   const card=page.locator(kind).first();
   assert.equal(await card.locator('.di-card-price strong').textContent(),kind==='.di-pin'?'₹199':'₹499');
   assert.equal(await card.locator('.di-card-price del').textContent(),kind==='.di-pin'?'₹499':'₹999');
   assert.equal(await card.locator('.di-use-template svg').count(),1);
   const target=new URL(await card.locator('.di-use-template').getAttribute('href'),origin);
   assert.equal(target.pathname,kind==='.di-pin'?'/personalise':'/video-personalise');
   if(kind==='.di-pin')assert.equal(target.searchParams.get('version'),catalog[0].current_version_id);
   await card.scrollIntoViewIfNeeded();
   assert.ok(await card.evaluate(el=>{const media=el.querySelector('.di-live-thumbnail,.di-video-demo').getBoundingClientRect();const control=el.querySelector('.di-thumbnail-preview').getBoundingClientRect();return Math.abs((media.left+media.width/2)-(control.left+control.width/2))<2&&Math.abs((media.top+media.height/2)-(control.top+control.height/2))<2;}),'Preview control is centered');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow');
  const footer=await page.locator('.di-footer-grid section').nth(1).locator('a').evaluateAll(elements=>elements.map(e=>({label:e.textContent,href:e.getAttribute('href')})));
  for(const link of footer)assert.equal(link.href,discoveryHref(link.label),link.label+' footer');
  await page.locator('.di-footer').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('iframe,video,audio').count(),0,'Browsing does not start previews');
  assert.ok(!requests.some(url=>/heic-to|three\.module|(?:Flagship|Cinorev)Renderer|TheeramInvitation|KnotsJourneyInvitation|\.mp4(?:\?|$)/i.test(url)),'No renderer or video downloads before Play');
  assert.equal(requests.filter(url=>url.includes('/api/video-personalise?action=templates')).length,1,'Category counts and collection share one request');
  assert.equal(await page.locator('.dc-promotion').count(),0,'My Pins promotion stays hidden');
  const websitePreview=page.getByRole('button',{name:'Preview Bells & Blessings',exact:true});
  await websitePreview.click();
  await page.waitForFunction(()=>document.querySelector('.di-pin iframe')?.style.opacity==='1');
  await page.getByRole('button',{name:'Stop preview for Bells & Blessings',exact:true}).click();
  assert.equal(await page.locator('iframe').count(),0,'Website preview can be stopped');

  async function websiteIds(){
   await page.waitForFunction(()=>document.querySelector('.df-controls .df-count')&&!document.querySelector('#di-results')?.textContent.includes('Loading invitations…'));
   return sorted(await page.locator('.di-pin .di-card-details h3 a').evaluateAll(links=>links.map(a=>new URL(a.href).searchParams.get('product'))));
  }
  async function videoNames(){
   await page.waitForFunction(()=>document.querySelector('.di-video-collection .df-count'));
   return sorted(await page.locator('.di-video-card h3').allTextContents());
  }
  // Click a trending style and a format-specific occasion through the homepage controls.
  await page.locator('.di-trending a').filter({hasText:/^Church$/}).click();
  assert.deepEqual(await websiteIds(),['christian-bells']);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('.dc-category-card').filter({hasText:'Engagement Website'}).click();
  assert.deepEqual(await websiteIds(),['garden-curtains','the-ring-box']);

  for(const link of links){
   await page.goto(origin+link.href,{waitUntil:'domcontentloaded'});
   if(new URL(link.href,origin).searchParams.get('kind')==='video'){
    const query=new URL(link.href,origin).searchParams.get('q')||'';
    const expected=videos.filter(video=>matchesVideoSearch(video,query));
    assert.deepEqual(await videoNames(),sorted(expected.map(video=>video.name)),link.label);
    if(link.count)assert.equal(link.count,expected.length+' invitations');
   }else{
    const expected=sorted(catalog.filter(template=>matchesDiscoverySearch(template,browseCategories.find(c=>c.label===link.label)?.query??link.label)).map(t=>t.id));
    assert.deepEqual(await websiteIds(),expected,link.label+' results');
    assert.equal(await page.locator('.df-controls .df-count').textContent(),`${expected.length} designs`);
    if(link.count)assert.equal(link.count,`${expected.length} invitations`,link.label+' category count');
    for(const price of await page.locator('.di-pin .di-card-price strong').allTextContents())assert.equal(price,'₹199');
   }
  }
  // Old shared search links must work as well as the new structured category links.
  for(const [query,expected] of [['Church',['christian-bells']],['Islam',['garden-curtains','moonlit-nikah','royal-crimson']],['Christian',sorted(catalog.filter(t=>t.tradition==='christian').map(t=>t.id))]]){
   await page.goto(origin+'/templates?q='+encodeURIComponent(query),{waitUntil:'domcontentloaded'});
   assert.deepEqual(await websiteIds(),expected,query+' legacy URL');
  }
  await page.goto(origin+'/templates?q=Save%20the%20Date',{waitUntil:'domcontentloaded'});
  assert.deepEqual(await videoNames(),['Save the Date','Save the Date Drive']);

  await page.goto(origin+'/templates',{waitUntil:'domcontentloaded'});
  assert.equal((await websiteIds()).length,28);
  await page.getByRole('combobox',{name:'Tradition',exact:true}).click();
  await page.getByRole('option',{name:'Islam',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.di-pin .di-card-details').length===3);
  assert.deepEqual(await websiteIds(),['garden-curtains','moonlit-nikah','royal-crimson']);
  await page.getByRole('combobox',{name:'Style',exact:true}).click();
  await page.getByRole('option',{name:'Courtyard',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.di-pin .di-card-details').length===1);
  assert.deepEqual(await websiteIds(),['moonlit-nikah']);
  await page.getByRole('button',{name:'Pin Moonlit Nikah',exact:true}).click();
  await page.goto(origin+'/saved',{waitUntil:'domcontentloaded'});
  assert.deepEqual(await websiteIds(),['moonlit-nikah']);
  await page.locator('.di-pin .di-card-details h3 a').click();
  await page.locator('.di-detail-copy h1').waitFor();
  assert.deepEqual((await page.locator('.di-tags span').allTextContents()).slice(0,2),['Islam','Courtyard']);
  const personalisation=await page.getByRole('link',{name:'Personalise this invitation'}).getAttribute('href');
  assert.equal(new URL(personalisation,origin).searchParams.get('version'),catalog.find(t=>t.id==='moonlit-nikah').current_version_id,'Version binding stays unchanged');

  await page.goto(origin+'/templates',{waitUntil:'domcontentloaded'});
  await websiteIds();
  await page.getByRole('textbox',{name:'Search designs',exact:true}).fill('Islamic');
  await page.getByRole('textbox',{name:'Search designs',exact:true}).press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('.di-pin .di-card-details').length===3);
  assert.deepEqual(await websiteIds(),['garden-curtains','moonlit-nikah','royal-crimson']);
  await page.getByRole('textbox',{name:'Search designs',exact:true}).fill('Save the Date');
  await page.getByRole('textbox',{name:'Search designs',exact:true}).press('Enter');
  assert.deepEqual(await videoNames(),['Save the Date','Save the Date Drive']);
  const firstVideo=page.locator('.di-video-card').first();
  const canPlayMp4=await page.evaluate(()=>Boolean(document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"')));
  await firstVideo.getByRole('button',{name:/Play preview/}).click();
  if(canPlayMp4){
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('video')).some(video=>!video.paused&&video.currentTime>0),null,{timeout:45000});
   await firstVideo.getByRole('button',{name:/Stop preview/}).click();
  }else{
   await firstVideo.getByRole('button',{name:/Retry preview/}).waitFor();
   assert.match(await firstVideo.getByRole('status').textContent(),/Preview could not load/);
   console.log('MP4 playback unavailable: this browser has no H.264 codec; error recovery verified.');
  }
  assert.equal(await page.locator('video').count(),0);

  // Simulate a metadata outage and retry; all consumers, including counts, must recover.
  let failed=true;
  await page.route('**/api/video-personalise?action=templates',route=>failed?route.fulfill({status:503,contentType:'application/json',body:'{}'}):route.continue());
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Retry',exact:true}).waitFor();
  assert.equal(await page.locator('.dc-category-card').filter({hasText:'Save the Date Video'}).locator('.dc-category-count').textContent(),'Browse videos');
  failed=false;
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.dc-category-card')).find(e=>e.textContent.includes('Save the Date Video'))?.querySelector('.dc-category-count')?.textContent==='2 invitations');
  await page.waitForFunction(()=>document.querySelectorAll('.di-video-card').length===4);
  assert.deepEqual(errors,[],'No browser exceptions');
  report.push({width,catalog:catalog.length,links:links.length,footerLinks:footer.length,counts:'passed',filters:'passed',search:'passed',pins:'passed',websitePreview:'passed',videoPlayback:canPlayMp4?'passed':'unsupported codec; recovery passed',catalogRetry:'passed'});
  console.log(JSON.stringify(report.at(-1)));
  await context.close();
 }
 console.log(JSON.stringify({origin,result:'passed',checks:report}));
}finally{await browser.close();}
