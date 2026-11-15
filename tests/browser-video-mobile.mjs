// UI-only API fixtures: no account writes, payments or generative requests.
// Real reusable media and native browser composition are exercised.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright-core';
import {TEMPLE_DEFAULTS,TEMPLE_FORM} from '../shared/temple-video.mjs';
const origin=process.env.CHECK_ORIGIN||'http://127.0.0.1:5173',dir='work/video-minimal',owner='00000000-0000-4000-8000-000000000001';
await mkdir(dir,{recursive:true});const config=await fetch(origin+'/api/video-personalise?template=temple-v1',{signal:AbortSignal.timeout(30000)}).then(r=>r.json());config.localUploads=true;
const assets=Object.fromEntries(await Promise.all(['groom','bride','couple'].map(async slot=>[slot,await readFile((process.env.VIDEO_CHARACTER_FIXTURE_DIR||'work/video-ux')+'/'+slot+'-v2-prepared.png').catch(()=>readFile('public/assets/video-masters/temple-v1/'+(slot==='groom'?'bride':'groom')+'.png'))]))),evidence=[];
const signature=b=>createHash('sha256').update(b).digest('hex');
for(const mobile of [true,false]){
 const browser=await(mobile?webkit.launch():chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH||'C:/Users/Z0046EAD/AppData/Local/ms-playwright/chromium_headless_shell-1148/chrome-win/headless_shell.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}));
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1366,height:1000},...(mobile?{isMobile:true,hasTouch:true}:{})});
 page.setDefaultTimeout(25000);console.log(mobile?'Checking mobile flow':'Checking desktop flow');
 const errors=[],requests=[],submissions=[],renders=[],jobs=[],media=new Map();let saved,paid=false,failUpload=false,failList=false,paymentDelay=0;
 page.on('pageerror',e=>{errors.push(e.message);console.log('Browser error stack:',e.stack);});
 try{
 await page.addInitScript(({owner})=>localStorage.setItem('findmyinvite-auth-v1',JSON.stringify({access_token:'ui-fixture',expires_at:Date.now()+3600000,user:{id:owner,email:'ui-fixture@example.com'}})),{owner});
 // Only API calls are fixtures. Native compositor, audio, fonts and video assets are real.
 await page.route('**/api/**',async route=>{
  const req=route.request(),u=new URL(req.url()),a=u.searchParams.get('action'),body=req.method()==='POST'&&req.headers()['content-type']?.includes('json')?req.postDataJSON():{};requests.push(u.pathname+'?'+u.searchParams);
  const fulfill=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(u.pathname==='/api/drafts'){
   if(a==='save'){if(saved&&body.revision!==saved.revision)return fulfill({error:'This invitation changed on another device.'},409);saved={...body,owner,revision:body.revision+1,updatedAt:new Date().toISOString()};return fulfill({draft:saved});}
   return fulfill(a==='get'?{draft:saved}:{drafts:saved?[saved]:[]});
  }
  if(u.pathname==='/api/video-characters'){
   if(a==='capabilities')return fulfill({enabled:true});
   if(!saved)return fulfill({error:'Invitation not saved'},404);
   if(a==='submit'){
    assert.ok(paid,'Generation must be unlocked');submissions.push(body);const job={id:randomUUID(),slot:body.slot,kind:body.redo?'redo':'initial',status:'review',approved:false,mediaId:randomUUID()};jobs.push(job);media.set(job.mediaId,{bytes:assets[job.slot],type:'image/png'});return fulfill({job},202);
   }
   if(a==='approve'){
    assert.equal(body.revision,saved.revision);const job=jobs.find(j=>j.id===body.id);for(const j of jobs)if(j.slot===job.slot)j.approved=false;job.approved=true;job.status='approved';saved={...saved,revision:saved.revision+1,payload:{...saved.payload,content:{...saved.payload.content,photos:{...saved.payload.content.photos,[job.slot]:{id:job.mediaId,mode:'prepared',confirmed:true}}}}};return fulfill({draft:saved});
   }
   if(failList)return fulfill({error:'Replicate API 503: model gpt-image-2.6-flare unavailable'},503);
   return fulfill({jobs,allowances:Object.fromEntries(['groom','bride','couple'].map(slot=>[slot,{initialUsed:jobs.some(j=>j.slot===slot),redoUsed:jobs.some(j=>j.slot===slot&&j.kind==='redo')} ])),coupleNeedsUpdate:false});
  }
  if(u.pathname==='/api/video-personalise'){
   if(a?.startsWith('payment-')){if(a==='payment-status'&&paymentDelay)await new Promise(r=>setTimeout(r,paymentDelay));if(a==='payment-promo')paid=true;return fulfill({unlocked:paid,status:paid?'complimentary':'pending',amount:paid?0:58882,currency:'INR'});}
   if(a==='reserve'){const id=randomUUID();return fulfill({id,pathname:'fixture/'+id});}
   if(a==='local-upload'){if(failUpload){failUpload=false;return fulfill({error:'Upload interrupted'},503);}const bytes=req.postDataBuffer();media.set(u.searchParams.get('id'),{bytes:bytes||assets.groom,type:bytes?req.headers()['content-type']:'image/png'});return fulfill({ok:true});}
   if(a==='media'){const m=media.get(u.searchParams.get('id'));if(!m)return fulfill({error:'Photo not found'},404);return route.fulfill({status:200,contentType:m.type,body:m.bytes});}
   if(a==='render'){renders.push(body);return fulfill({id:randomUUID(),status:'ready',progress:100,expiresAt:new Date(Date.now()+86400000).toISOString(),download:'/api/video-personalise?action=download&id=fixture'},202);}
   return fulfill(config);
  }
  return fulfill({});
 });
 const ready=async()=>{await page.waitForFunction(()=>document.querySelector('canvas')&&(!document.querySelector('.vp-film-message')||document.querySelector('.vp-film-message button')),null,{timeout:120000});if(await page.locator('.vp-film-message button').count()){console.log('Activating preview after browser playback restriction');const retry=page.locator('.vp-toast').getByRole('button',{name:'Retry preview',exact:true});if(await retry.isVisible())await retry.click();else {await page.getByRole('button',{name:'Expand video preview',exact:true}).click();await page.locator('.vp-film-message button').click();}}await page.waitForFunction(()=>!document.querySelector('.vp-film-message'),null,{timeout:120000});if(await page.locator('.vp-preview-expanded').count()&&!await page.getByRole('button',{name:'Approve character',exact:true}).count())await page.getByRole('button',{name:'Back to form',exact:true}).click();};
 // Centre controls clear of the fixed footer/PiP and exercise touch on mobile.
 const press=async locator=>{await locator.waitFor({state:'visible'});await locator.evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));if(mobile)await locator.tap();else await locator.click();};
 const choose=async(locator,checked=true)=>{if(await locator.isChecked()!==checked)await press(locator);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await locator.isChecked(),checked);};
 const step=async label=>{await press(page.locator('.vp-form nav').getByRole('button',{name:label}));};
 const checkbox=()=>page.getByRole('checkbox',{name:'Use personal photos'});
 const settled=async()=>{await page.waitForTimeout(1600);assert.ok(saved?.revision>0);};
 await page.goto(origin+'/video-personalise?template=temple-v1',{waitUntil:'domcontentloaded'});await page.locator('.vp-form:not([inert])').waitFor();await ready();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.vp-form nav button').count(),12);assert.equal(await page.locator('.vp-toolbar').count(),0);assert.equal(await page.locator('.vp-form-body').evaluate(e=>e.scrollHeight>e.clientHeight),false);assert.doesNotMatch(await page.locator('.vp-form-footer').innerText(),/saved automatically|Checking payment/);assert.equal(requests.filter(r=>r.startsWith('/api/video-characters')).length,0);
 for(const [index,section] of TEMPLE_FORM.steps.filter(s=>s.questions.length).entries()){
  console.log('Checking scene '+section.title);await step(section.title);await ready();
  assert.equal(await page.locator('.vp-eyebrow').textContent(),'SCENE '+(index+1)+' OF 10');
  assert.deepEqual(await page.locator('.vp-form-body [id^="video-"]').evaluateAll(nodes=>nodes.filter(n=>['INPUT','TEXTAREA','SELECT'].includes(n.tagName)).map(n=>n.id.slice(6))),section.questions.map(q=>q.path));
  assert.equal(Number(await page.locator('.vp-film canvas').getAttribute('data-rendered-frame')),config.master.scenes[index].reviewFrame);
 }
 await step('Invitation');await page.locator('#video-invitationHeading').fill('Welcome');await settled();
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#video-greeting').waitFor();await ready();
 assert.equal(Number(await page.locator('.vp-film canvas').getAttribute('data-rendered-frame')),210);
 assert.equal(saved.payload.formStepId,'invitation');assert.equal(saved.payload.formVersion,3);
 await step('Groom');await page.locator('#video-groom').fill('Arjun');await step('Bride');await page.locator('#video-bride').fill('Meera');await ready();
 await step('Parents');await settled();await page.reload({waitUntil:'domcontentloaded'});await page.locator('#video-groomFather').waitFor();assert.equal(saved.payload.formStepId,'parents');assert.equal(saved.payload.step,3);
 await step('Music');await choose(page.getByRole('radio',{name:'Canon in D',exact:true}),true);paymentDelay=3000;await step('Review & download');await page.locator('.vp-busy-notice').waitFor();await step('Closing');assert.equal(await page.getByRole('button',{name:'Next',exact:true}).isVisible(),true);assert.equal(await page.locator('.vp-busy-notice').count(),0);await page.waitForTimeout(3200);assert.equal(await page.getByRole('button',{name:'Next',exact:true}).isVisible(),true);paymentDelay=0;await step('Review & download');await ready();assert.equal(await checkbox().isChecked(),false);
 assert.equal(await page.locator('.vp-checkout').count(),1);assert.equal(await page.locator('.vp-characters').count(),0);assert.equal(await page.locator('input[type=file]').count(),0);assert.equal(await page.locator('#video-promo').isVisible(),false);
 assert.equal(requests.filter(r=>r.startsWith('/api/video-characters')).length,0);assert.equal(await page.locator('.vp-summary[open]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:dir+'/'+(mobile?'phone':'desktop')+'-default.png'});
 // Default flow can render without even loading the photo workflow.
 await press(page.getByText('Have a promo code?',{exact:true}));await page.locator('#video-promo').fill('FIXTURE');await press(page.getByRole('button',{name:'Apply',exact:true}));await page.locator('.vp-checkout').waitFor({state:'hidden'});
 await choose(page.getByRole('checkbox',{name:'I’ve checked the names, dates and spellings.'}),true);await press(page.getByRole('button',{name:/^Create (my|updated) video$/}));await page.waitForFunction(()=>document.querySelector('.vp-form-footer .vp-primary')?.textContent==='Download MP4');assert.deepEqual(renders[0].content.photos,{});assert.equal(renders[0].content.music.id,'canon');assert.equal(submissions.length,0);
 // All uploads are visible together. Results apply automatically with no approval modal.
 failList=true;await choose(checkbox());await page.locator('.vp-characters').waitFor();await page.locator('.vp-toast').waitFor();
 assert.doesNotMatch(await page.locator('.vp-form').innerText(),/replicate|gpt-image|API 503/i);
 failList=false;await press(page.locator('.vp-form-footer').getByRole('button',{name:'Try again',exact:true}));
 await settled();assert.equal(await page.locator('.vp-photo-list input[type=file]').count(),3);assert.equal(await page.locator('.vp-checkout').count(),0);
 assert.equal(await page.locator('input[name=reference-method]').count(),0);assert.equal(await page.locator('.vp-characters select').count(),0);
 await page.screenshot({path:dir+'/'+(mobile?'phone':'desktop')+'-optional.png'});
 await page.locator('input[aria-label="Upload groom photo"]').setInputFiles('public/assets/temple/sample_groom.webp');await page.waitForFunction(()=>!document.querySelector('.vp-photo-opt-in input').disabled&&document.querySelector('.vp-photo-thumbnail img'));
 failUpload=true;await page.locator('input[aria-label="Upload bride photo"]').setInputFiles('public/assets/temple/sample_bride.webp');await page.getByRole('button',{name:'Retry bride upload',exact:true}).waitFor();await press(page.getByRole('button',{name:'Retry bride upload',exact:true}));await page.waitForFunction(()=>!document.querySelector('.vp-photo-opt-in input').disabled);
 await page.locator('input[aria-label="Upload couple photo"]').setInputFiles('public/assets/temple/sample_groom.webp');await page.waitForFunction(()=>!document.querySelector('.vp-photo-opt-in input').disabled);
 await settled();assert.equal(submissions.length,0);
 // Closing the PiP used to strand the form in an invisible approval modal.
 await press(page.getByRole('button',{name:'Close preview',exact:true}));
 await press(page.getByRole('button',{name:'Create my characters',exact:true}));
 await page.waitForFunction(()=>document.querySelectorAll('[data-character-ready]').length===3,null,{timeout:90000});await page.locator('#video-confirm').waitFor();await ready();
 assert.equal(submissions.length,3);assert.equal(submissions[0].reference.identity,'single');assert.equal(submissions[1].reference.identity,'single');assert.equal(jobs.every(j=>j.approved),true);
 assert.equal(await page.locator('.vp-preview').isVisible(),false);assert.equal(await page.locator('.vp-form[inert]').count(),0);
 assert.equal(await page.getByRole('button',{name:/Approve/}).count(),0);
 await press(page.getByRole('button',{name:'Preview groom character',exact:true}));await ready();assert.equal(await page.locator('.vp-preview').isVisible(),true);assert.equal(await page.locator('.vp-form[inert]').count(),0);
 // Return to the actual selected composition before comparing output.
 await ready();const personalShot=signature(await page.locator('canvas').screenshot());
 await choose(checkbox(),false);await ready();assert.equal(await page.locator('.vp-characters').count(),0);const normalShot=signature(await page.locator('canvas').screenshot());assert.notEqual(personalShot,normalShot);await settled();assert.equal(saved.payload.personalPhotosEnabled,false);assert.equal(Object.keys(saved.payload.content.photos).length,3);
 await page.reload({waitUntil:'domcontentloaded'});await checkbox().waitFor();await ready();assert.equal(await checkbox().isChecked(),false);const before=requests.length;await page.waitForTimeout(200);assert.equal(requests.slice(before).filter(r=>r.includes('video-characters')||r.includes('action=media')).length,0);
 await choose(checkbox());await page.locator('#video-confirm').waitFor();await ready();assert.equal(await page.locator('.vp-photo-list input[type=file]').count(),3);assert.equal(submissions.length,3);
 await choose(page.getByRole('checkbox',{name:'I’ve checked the names, dates and spellings.'}),true);await press(page.getByRole('button',{name:/^Create (my|updated) video$/}));await page.waitForTimeout(300);assert.equal(Object.keys(renders.at(-1).content.photos).length,3);assert.equal(renders.at(-1).invitationId,renders[0].invitationId);assert.equal(renders.at(-1).content.music.id,'canon');
 await settled();await page.screenshot({path:dir+'/'+(mobile?'phone':'desktop')+'-approved.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await writeFile(dir+'/'+(mobile?'phone':'desktop')+'-render-inputs.json',JSON.stringify(renders,null,2));
 if(!mobile){for(const enabled of [true,false]){if(!enabled)await choose(checkbox(),false);await ready();for(const index of [0,2,3,9]){await press(page.locator('.vp-scenes button').nth(index));await ready();const frame=await page.locator('canvas').getAttribute('data-rendered-frame'),png=await page.locator('canvas').evaluate(c=>c.toDataURL().split(',')[1]);await writeFile(dir+'/preview-'+(enabled?'personal':'default')+'-'+frame+'.png',Buffer.from(png,'base64'));}}await settled();}
 // Removal restores originals immediately, persists after refresh and spends nothing.
 await choose(checkbox(),true);await page.locator('#video-confirm').waitFor();await ready();
 await press(page.getByRole('button',{name:'Remove groom photo and use originals',exact:true}));await ready();await settled();
 assert.equal(saved.payload.references.groom.useDefault,true);assert.equal(Object.keys(saved.payload.content.photos).length,3);assert.equal(submissions.length,3);
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#video-confirm').waitFor();await ready();
 await choose(page.getByRole('checkbox',{name:'I’ve checked the names, dates and spellings.'}),true);await press(page.getByRole('button',{name:/^Create (my|updated) video$/}));await page.waitForTimeout(500);assert.deepEqual(Object.keys(renders.at(-1).content.photos),['bride']);assert.equal(submissions.length,3);
 // A new invitation can use just a couple photo: no identity question or approval.
 await settled();jobs.length=0;saved=null;paid=false;await page.goto(origin+'/video-personalise?template=temple-v1');await page.locator('.vp-form:not([inert])').waitFor();await ready();await step('Review & download');await choose(checkbox(),true);
 await page.locator('input[aria-label="Upload couple photo"]').setInputFiles('public/assets/temple/sample_groom.webp');await page.waitForFunction(()=>!document.querySelector('.vp-photo-opt-in input').disabled);
 await press(page.getByText('Have a promo code?',{exact:true}));await page.locator('#video-promo').fill('FIXTURE');await press(page.getByRole('button',{name:'Apply',exact:true}));await page.locator('.vp-checkout').waitFor({state:'hidden'});assert.equal(submissions.length,3);
 await press(page.getByRole('button',{name:'Create my characters',exact:true}));await page.waitForFunction(()=>document.querySelectorAll('[data-character-ready]').length===3,null,{timeout:90000});await page.locator('#video-confirm').waitFor();await ready();assert.equal(submissions.length,6);assert.equal(submissions[3].reference.identity,'auto');assert.equal(submissions[4].reference.identity,'auto');assert.equal(submissions[3].reference.id,submissions[4].reference.id);assert.equal(submissions[5].reference,undefined);
 // Existing frame/cutout work resumes in Review; switching it off does not request missing media.
 await settled();const legacyId=randomUUID(),legacyMedia=randomUUID();media.set(legacyMedia,{bytes:assets.groom,type:'image/png'});saved={id:legacyId,kind:'video',templateId:'temple-v1',owner,revision:1,updatedAt:new Date().toISOString(),payload:{content:{...TEMPLE_DEFAULTS,photos:{groom:{id:legacyMedia,mode:'frame',confirmed:true}}},step:2,pending:{bride:{id:randomUUID(),mode:'cutout'}}}};
 await page.goto(origin+'/video-personalise?template=temple-v1&draft='+legacyId+'&step=2',{waitUntil:'domcontentloaded'});await page.locator('.vp-legacy-photos').waitFor();await ready();assert.equal(await checkbox().isChecked(),true);assert.equal(await page.locator('.vp-characters').count(),0);await choose(checkbox(),false);await ready();assert.equal(await page.getByRole('button',{name:'Confirm details',exact:true}).isVisible(),true);await settled();
 const baseline=requests.length;await page.reload({waitUntil:'domcontentloaded'});await checkbox().waitFor();await ready();assert.equal(await checkbox().isChecked(),false);assert.equal(requests.slice(baseline).filter(r=>r.includes('video-characters')||r.includes('action=media')).length,0);
 assert.deepEqual(errors,[]);evidence.push({browser:mobile?'mobile WebKit':'desktop Chromium',sceneAlignedSteps:true,noPhotoRequestsByDefault:true,oneCheckout:true,collapsedPromo:true,defaultExportPhotosEmpty:true,automaticRoleSelection:true,uploadRetry:true,explicitGenerationOnly:true,plainCustomerCopy:true,providerFailureHidden:true,threeCompactPhotoRows:true,automaticCharacters:true,hiddenPreviewDoesNotFreeze:true,personalExportPhotos:3,sameInvitationPayment:true,togglePreservesAssets:true,legacyDraftMigration:true,missingInactivePhotosDoNotBlock:true});console.log(evidence.at(-1));
 await writeFile(dir+'/'+(mobile?'phone':'desktop')+'-render-inputs.json',JSON.stringify(renders,null,2));
 }catch(e){const messages=await page.locator('[role=alert], .vp-film-message').allTextContents();await page.screenshot({path:dir+'/'+(mobile?'phone':'desktop')+'-failure.png',fullPage:true});await writeFile(dir+'/failure.json',JSON.stringify({message:e.message,messages,errors,requests:requests.slice(-15),saved,jobs},null,2));throw e;}finally{await browser.close();}
}
await writeFile(dir+'/checks.json',JSON.stringify(evidence,null,2));
