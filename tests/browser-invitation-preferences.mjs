import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright-core';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const poster='/assets/catalog-previews/names-v1/websites/theeram-edge-v2-320.webp';
const websites=[{id:'kerala-lanterns',name:'Lanterns',tradition:'hindu'},{id:'moonlit-nikah',name:'Moonlit Nikah',tradition:'muslim'},{id:'christian-bells',name:'Bells & Blessings',tradition:'christian'}].map((t,i)=>({...t,thumbnail:poster,current_version_id:'version-'+i,templateCode:'FMI#000'+i,microDescription:'Made for your celebration'}));
const videos=[{id:'temple-v1',name:'Temple Wedding'},{id:'wedding-bells-v1',name:'Wedding Bells'},{id:'film-tiles-v1',name:'Tiles'}].map(t=>({...t,poster,preview:'/fixture.mp4',duration:30,quote:{basePaise:49900},amount:58882}));
const account=(id,preferences,remember=true)=>({access_token:'token-'+id,refresh_token:'refresh-'+id,expires_at:Date.now()+3600000,user:{id,email:id+'@example.test',invitationPreferences:preferences},remember});

for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],writes=[];
  let failSave=false,saveGate=null;
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url()),action=url.searchParams.get('action');
   if(url.pathname==='/api/templates')return route.fulfill({json:{templates:websites,basePaise:19900}});
   if(url.pathname==='/api/video-personalise')return route.fulfill({json:{templates:videos}});
   if(action==='google-exchange')return route.fulfill({json:{...account('one',null),expires_in:3600}});
   if(action==='invitation-preferences'){
    const owner=req.headers().authorization?.replace('Bearer token-','');
    if(req.method()==='PUT'){
     if(saveGate)await saveGate;
     if(failSave)return route.fulfill({status:503,json:{error:'Unavailable'}});
     const preferences=req.postDataJSON();writes.push({owner,preferences});return route.fulfill({json:{userId:owner,preferences}});
    }
    return route.fulfill({json:{userId:owner,preferences:{language:'ml',tradition:'muslim'}}});
   }
   return route.fulfill({json:{}});
  });
  const dialog=page.getByRole('dialog');
  const getStored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('fmi-invitation-preferences-v1:guest')||'null'));
  async function open(){await page.getByRole('button',{name:'Change invitation language',exact:true}).click();await dialog.waitFor();}
  await page.goto(origin+'/');await dialog.waitFor();
  assert.match(await dialog.innerText(),/Choose your invitation language/);
  assert.equal(await dialog.getByRole('button',{name:/^(Continue|Save language|Show my invitations)$/}).count(),0,'No extra confirmation step');
  assert.equal((await dialog.boundingBox()).y,78);
  for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:844});const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y+box.height<=844);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Viewport overflow at '+width);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Tamil'}).click();
  assert.match(await dialog.innerText(),/Which tradition should your invitation celebrate/);
  assert.equal(await dialog.locator('.di-preferences-option').count(),3,'Only tradition is asked in the sheet');
  assert.equal(await dialog.getByRole('button',{name:/^(Continue|Save language|Show my invitations)$/}).count(),0,'Tradition saves on selection');
  assert.equal(await dialog.getByRole('heading').evaluate(el=>el===document.activeElement),true,'Focus follows the new step');
  const sheet=await dialog.boundingBox();assert.ok(Math.abs(sheet.y+sheet.height-844)<1,'Mobile sheet sits at the bottom');
  await page.getByRole('button',{name:'Christian',exact:true}).click();await dialog.waitFor({state:'hidden'});
  assert.deepEqual((await getStored()).preferences,{language:'ta',tradition:'christian'});
  assert.equal(await page.locator('.di-pin h3').first().innerText(),'Bells & Blessings');
  assert.equal(await page.locator('.di-video-card h3').first().innerText(),'Wedding Bells');
  assert.match(await page.locator('.di-pin .di-use-template').first().getAttribute('href'),/lang=ta/);
  assert.equal(await page.locator('.di-pin').count(),3,'Recommendations keep the full catalogue available');
  await page.reload();await page.locator('.di-pin').first().waitFor();assert.equal(await dialog.count(),0,'Returning guest is not prompted');
  await open();await page.getByRole('button',{name:'Malayalam'}).click();await dialog.waitFor({state:'hidden'});
  assert.match(await page.locator('.di-pin .di-use-template').first().getAttribute('href'),/lang=ml/);
  await open();await page.getByRole('button',{name:'Malayalam'}).focus();await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.getByRole('button',{name:'Change invitation language',exact:true}).evaluate(el=>el===document.activeElement),true,'Keyboard selection closes even the current choice and returns focus');
  await open();await page.getByRole('button',{name:'Change celebration style'}).click();await page.getByRole('button',{name:'Islam',exact:true}).click();await dialog.waitFor({state:'hidden'});
  assert.equal(await page.locator('.di-pin h3').first().innerText(),'Moonlit Nikah');
  await page.goto(origin+'/search?q=Christian');await page.locator('.di-pin').first().waitFor();assert.equal(await page.locator('.di-pin h3').first().innerText(),'Bells & Blessings','Explicit searches override the preferred tradition');assert.equal(await dialog.count(),0);

  // Exercise the real Google callback and the preference save before its redirect.
  await page.evaluate(()=>sessionStorage.setItem('fmi-google-flow-v1',JSON.stringify({id:'a'.repeat(64),verifier:'v'.repeat(64),returnTo:'/dashboard',createdAt:Date.now()})));
  await page.goto(origin+'/auth/callback?flow='+'a'.repeat(64)+'&code=fixture');await page.waitForURL(origin+'/dashboard');await page.goto(origin+'/');await page.locator('.di-pin').first().waitFor();
  assert.deepEqual(writes,[{owner:'one',preferences:{language:'ml',tradition:'muslim'}}]);assert.equal(await getStored(),null,'Guest choices are claimed by one account');
  const savedSession=await page.evaluate(()=>JSON.parse(localStorage.getItem('findmyinvite-auth-v1')));
  assert.deepEqual(savedSession.user.invitationPreferences,{language:'ml',tradition:'muslim'});assert.equal(await dialog.count(),0);
  // Same account on a new browser: the authenticated session supplies its saved choices.
  await page.evaluate(()=>{const session=localStorage.getItem('findmyinvite-auth-v1');localStorage.clear();sessionStorage.clear();localStorage.setItem('findmyinvite-auth-v1',session);});
  await page.reload();await page.locator('.di-pin').first().waitFor();assert.equal(await dialog.count(),0);assert.equal(await page.locator('.di-pin h3').first().innerText(),'Moonlit Nikah');

  // Account isolation and "remember me" off preserve session-only authentication.
  await page.evaluate(value=>{localStorage.removeItem('findmyinvite-auth-v1');sessionStorage.setItem('findmyinvite-auth-session-v1',JSON.stringify(value));window.dispatchEvent(new Event('fmi-auth-changed'));},account('two',{language:'en',tradition:'hindu'},false));
  await page.waitForFunction(()=>document.querySelector('.di-pin h3')?.textContent==='Lanterns');assert.equal(writes.length,1,'Account two is never overwritten with account one preferences');
  failSave=true;await open();
  const failedSave=page.waitForResponse(response=>response.url().includes('action=invitation-preferences')&&response.status()===503);
  await page.getByRole('button',{name:'Hindi'}).click();await dialog.waitFor({state:'hidden'});await failedSave;
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fmi-invitation-preferences-v1:two'))),{preferences:{language:'hi',tradition:'hindu'},pending:true},'A failed account sync keeps the choice active without blocking browsing');
  failSave=false;await page.reload();
  await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('findmyinvite-auth-session-v1'))?.user.invitationPreferences?.language==='hi');
  assert.deepEqual(writes.at(-1),{owner:'two',preferences:{language:'hi',tradition:'hindu'}});
  assert.equal(await page.evaluate(()=>localStorage.getItem('findmyinvite-auth-v1')),null);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('findmyinvite-auth-session-v1')).user.invitationPreferences),{language:'hi',tradition:'hindu'});
  await page.reload();await page.locator('.di-pin').first().waitFor();assert.equal(await dialog.count(),0);
  // Hold account sync open: the selection must still apply and close immediately.
  let releaseSave;saveGate=new Promise(resolve=>{releaseSave=resolve;});
  try{
   await open();await page.getByRole('button',{name:'Change celebration style'}).click();
   const pendingSave=page.waitForRequest(request=>request.url().includes('action=invitation-preferences')&&request.method()==='PUT');
   await page.getByRole('button',{name:'Islam',exact:true}).click();await pendingSave;await dialog.waitFor({state:'hidden'});
   assert.equal(await page.locator('.di-pin h3').first().innerText(),'Moonlit Nikah','Recommendations apply before account sync finishes');
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('fmi-invitation-preferences-v1:two'))),{preferences:{language:'hi',tradition:'muslim'},pending:true});
  }finally{releaseSave();saveGate=null;}
  await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('findmyinvite-auth-session-v1'))?.user.invitationPreferences?.tradition==='muslim');
  assert.deepEqual(errors,[]);
  await context.close();

  const dismissed=await browser.newContext({viewport:{width:320,height:568}}),guest=await dismissed.newPage();
  await guest.goto(origin+'/');await guest.getByRole('dialog').waitFor();await guest.getByRole('button',{name:'Browse all invitations'}).click();await guest.reload();await guest.locator('.di-header').waitFor();assert.equal(await guest.getByRole('dialog').count(),0,'Dismissal lasts for the browsing session');
  await dismissed.close();
  console.log(engine.name()+': single-tap first visit, mobile sheet, immediate language/tradition changes, keyboard selection, recommendations, explicit search, Google login, returning accounts, account isolation, session-only login, background retry, nonblocking slow saves and dismissal passed');
 }finally{await browser.close();}
}
