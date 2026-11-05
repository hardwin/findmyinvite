// Browser contract test: local UI with isolated Google OAuth, payment, storage and API fixtures.
// No real Google login, payment, or customer record is created.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {readFile,mkdir} from 'node:fs/promises';
import schemas from './fixtures/template-form-schemas.json' with {type:'json'};
import {definitions} from '../scripts/template-form-definitions.mjs';
import {compileTemplateForm} from '../shared/template-forms.mjs';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const context=await browser.newContext({viewport:process.env.TEST_DESKTOP?{width:1280,height:900}:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});
context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(15000);
const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);console.log('Browser ready');
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
const version=schemas.find(v=>v.template_id==='christian-bells');
const form={template_version_id:version.id,revision:1,definition:compileTemplateForm(definitions['christian-bells'],version.field_schema)};
let invitation=null,published=null,orders=0,verified=false,failPublish=true,uploadComplete=false;
const calls=[];let challenge;
const photo=await readFile(new URL('../public/assets/flagship/christian/rings.webp',import.meta.url));
await context.addInitScript(()=>{window.Razorpay=class {constructor(options){this.options=options;}on(){}open(){this.options.handler({razorpay_order_id:'gateway-order',razorpay_payment_id:'gateway-payment',razorpay_signature:'fixture'});}};});
await context.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.hostname.endsWith('blob.vercel-storage.com')||u.hostname==='vercel.com'&&u.pathname==='/api/blob/')return route.fulfill({json:{url:'https://fixture.private.blob.vercel-storage.com/photo.webp',downloadUrl:'https://fixture.private.blob.vercel-storage.com/photo.webp',pathname:'photo.webp',contentType:'image/webp',contentDisposition:'inline'}});
 if(u.hostname==='google.fixture.test'){
  const callback=origin+'/auth/callback?flow='+u.searchParams.get('flow');
  return route.fulfill({contentType:'text/html',body:'<a href="'+callback+'&amp;code=fixture-code">Approve Google sign-in</a><a href="'+callback+'&amp;error=access_denied">Cancel Google sign-in</a>'});
 }
 if(u.origin!==origin)return route.abort();
 if(!u.pathname.startsWith('/api/'))return route.continue();
 const action=u.searchParams.get('action'),body=req.postDataJSON();calls.push({action,body});
 const ok=data=>route.fulfill({json:data}),bad=(error,status=400)=>route.fulfill({status,json:{error}});
 if(u.pathname==='/api/template-media'){
  if(action==='reserve')return ok({id:'11111111-1111-4111-8111-111111111111',pathname:'photo.webp',url:'/api/template-media?id=11111111-1111-4111-8111-111111111111'});
  if(action==='upload')return ok({clientToken:'vercel_blob_client_fixture_token'});
  if(action==='complete'){uploadComplete=true;return ok({ok:true});}
  return route.fulfill({contentType:'image/webp',body:photo});
 }
 if(action==='editor')return ok({version,form});
 if(action==='v2-config')return ok({configured:true,quote:{basePaise:19900,taxPaise:3582,totalPaise:23482,taxLabel:'GST'}});
 if(action==='google-start'){assert.equal(body.origin,origin);challenge=body.challenge;return ok({url:'https://google.fixture.test/authorize?flow='+body.flow});}
 if(action==='google-exchange'){assert.equal(body.code,'fixture-code');assert.equal(createHash('sha256').update(body.verifier).digest('base64url'),challenge);verified=true;return ok({access_token:'fixture',refresh_token:'fixture-refresh',expires_in:3600,user:{id:'customer',email:'customer@example.com'}});}
 if(action==='v2-create'){assert.ok(verified);invitation={id:'invite',slug:body.slug||'qa-wedding',content:body.content,revision:0,firstPublishedAt:null,published:false,templateVersionId:version.id,formRevision:1,formStepId:body.formStepId};return ok({invitation});}
 if(action==='v2-save'){assert.equal(body.revision,invitation.revision);invitation={...invitation,content:body.content,revision:invitation.revision+1,formStepId:body.formStepId};return ok({invitation});}
 if(action==='v2-order'){assert.ok(uploadComplete);orders++;return ok(orders===1?{id:'order',keyId:'rzp_test_fixture',orderId:'gateway-order',amount:23482}:{captured:true,id:'order'});}
 if(action==='v2-verify')return ok({id:'order',captured:true});
 if(action==='v2-publish'){if(failPublish){failPublish=false;return bad('Connection interrupted. Retry publishing safely.',503);}invitation={...invitation,published:true,firstPublishedAt:'2026-11-04T00:00:00Z',expiresAt:'2027-05-04T00:00:00Z'};published=structuredClone(invitation.content);return ok({invitation});}
 if(action==='v2-manage')return ok({version,form,invitation});
 if(action==='v2-mine')return ok({invitations:invitation?[invitation]:[]});
 if(action==='v2-public')return ok({version,content:published});
 return ok({});
});
const next=async()=>{console.log('Continue:',await page.locator('.iw-body h3').innerText());await page.getByRole('button',{name:'Continue',exact:true}).click();};
try{
 await page.goto(origin+'/personalise?version='+version.id);
 await page.getByLabel('Groom’s name').fill('Arun');await page.getByLabel('Bride’s name').fill('Maya');await next();
 await page.getByLabel('Wedding date').fill('2027-04-20');await page.getByLabel('Wedding time').fill('10:30');await next();
 assert.equal(await page.locator('#wizard-events-0-date').inputValue(),'2027-04-20');assert.equal(await page.locator('#wizard-events-0-time').inputValue(),'10:30');
 await page.getByLabel('Venue',{exact:false}).fill('Lake Hall');await page.getByLabel('Address',{exact:false}).fill('Kochi');await next();await next();await next();
 await page.getByText('Default template media',{exact:false}).first().waitFor();
 await page.getByLabel('Couple photograph',{exact:true}).setInputFiles({name:'couple.webp',mimeType:'image/webp',buffer:photo});await page.getByText('Your selected file',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal(calls.some(c=>['google-start','v2-create'].includes(c.action)),false);
 await page.reload();await page.getByText('Your selected file',{exact:true}).waitFor();
 await next();await page.getByLabel('RSVP WhatsApp number').fill('919876543210');await next();
 await page.getByLabel('Invitation address',{exact:true}).fill('qa-wedding');
 await page.getByRole('button',{name:'Preview your invitation'}).click();await page.getByRole('button',{name:'Back to your answers'}).waitFor();assert.equal(calls.some(c=>c.action==='google-start'),false);await page.getByRole('button',{name:'Back to your answers'}).click();
 await page.getByRole('button',{name:'Pay and publish'}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(orders,0);assert.equal(await page.getByLabel('Invitation address',{exact:true}).inputValue(),'qa-wedding');
 await page.getByRole('button',{name:'Pay and publish'}).click();
 assert.equal(await page.getByRole('dialog',{name:'Sign in to FindMyInvite'}).locator('input').count(),0);
 assert.equal(await page.getByRole('dialog',{name:'Sign in to FindMyInvite'}).getByText(/SMS|OTP/).count(),0);
 await mkdir('work/google-qa',{recursive:true});await page.screenshot({path:'work/google-qa/login-'+(process.env.TEST_DESKTOP?'desktop':'mobile')+'.png'});
 await page.getByRole('button',{name:'Continue with Google'}).click();
 await page.getByRole('link',{name:'Cancel Google sign-in'}).click();
 await page.getByText('Google sign-in was cancelled or declined. Your invitation is still saved.').waitFor();
 assert.equal(new URL(page.url()).search,'');assert.equal(calls.filter(c=>c.action==='google-exchange').length,0);
 await page.getByRole('link',{name:'Return to your invitation'}).click();
 assert.equal(await page.getByLabel('Invitation address',{exact:true}).inputValue(),'qa-wedding');
 await page.getByText('Your selected file',{exact:true}).waitFor();assert.equal(orders,0);
 await page.getByRole('button',{name:'Pay and publish'}).click();await page.getByRole('button',{name:'Continue with Google'}).click();
 await page.getByRole('link',{name:'Approve Google sign-in'}).click();
 await page.getByLabel('Invitation address',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Invitation address',{exact:true}).inputValue(),'qa-wedding');
 await page.getByText('Your selected file',{exact:true}).waitFor();assert.equal(orders,0);
 assert.equal(calls.filter(c=>c.action==='google-exchange').length,1);
 await page.getByRole('button',{name:'Pay and publish'}).click();
 await page.getByText('Connection interrupted. Retry publishing safely.').waitFor();
 assert.equal(invitation.content.groom,'Arun');assert.equal(invitation.content.bride,'Maya');assert.match(invitation.content.cover,/^\/api\/template-media/);assert.ok(uploadComplete);
 await page.getByRole('button',{name:'Pay and publish'}).click();await page.getByRole('button',{name:'Copy invitation link'}).click();await page.getByText('Invitation link copied.').waitFor();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),origin+'/qa-wedding');
 assert.equal(calls.filter(c=>c.action==='v2-verify').length,1);
 const guest=await context.newPage();await guest.goto(origin+'/qa-wedding');await guest.getByText(/Arun/).first().waitFor();assert.ok((await guest.locator('body').innerText()).includes('Maya'));await guest.close();
 await mkdir('work/google-qa',{recursive:true});await page.screenshot({path:'work/google-qa/published-'+(process.env.TEST_DESKTOP?'desktop':'mobile')+'.png'});
 await page.getByRole('link',{name:'My invitations',exact:true}).click();await page.getByRole('link',{name:'Edit / preview / renew →'}).click();
 await page.locator('.iw-review section').first().getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Groom’s name').fill('Arun Kumar');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Your progress is saved to your account.').waitFor();assert.equal(published.groom,'Arun');
 await page.reload();assert.equal(await page.getByLabel('Groom’s name').inputValue(),'Arun Kumar');
 for(let i=0;i<7;i++)await next();await page.getByRole('button',{name:'Publish changes'}).click();await page.getByText('Published. Your guest link is ready to share.').waitFor();assert.equal(published.groom,'Arun Kumar');assert.equal(orders,2);assert.equal(calls.filter(c=>c.action==='v2-verify').length,1);assert.deepEqual(errors,[]);const updatedGuest=await context.newPage();await updatedGuest.goto(origin+'/qa-wedding');await updatedGuest.getByText(/Arun Kumar/).first().waitFor();await updatedGuest.close();
 // A callback opened without its originating tab's PKCE flow cannot establish a session.
 const invalid=await context.newPage();await invalid.goto(origin+'/auth/callback?flow=wrong&code=fixture-code');
 await invalid.getByText('This sign-in attempt expired or belongs to another tab.',{exact:false}).waitFor();
 assert.equal(calls.filter(c=>c.action==='google-exchange').length,1);assert.equal(new URL(invalid.url()).search,'');await invalid.close();
 // Returning customers can authenticate from My invitations and recover their account list.
 await page.goto(origin+'/dashboard');await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await page.getByRole('button',{name:'My invitations',exact:true}).click();
 await page.getByRole('button',{name:'Continue with Google'}).click();await page.getByRole('link',{name:'Approve Google sign-in'}).click();
 await page.getByRole('link',{name:'Edit / preview / renew →'}).waitFor();assert.equal(new URL(page.url()).pathname,'/dashboard');
 assert.equal(calls.filter(c=>c.action==='google-exchange').length,2);assert.equal(orders,2);
 assert.deepEqual(errors,[]);
 console.log('PASS browser journey: anonymous photo selection + reload + preview; cancelled Google redirect preserves draft; Google PKCE redirect restores review and photo before explicit payment; paid publish retry reuses capture; copy link; dashboard reopen, save, reload and republish without another charge; invalid callback rejected.');
}catch(e){console.error('API calls:',calls.map(c=>c.action));console.error('UI:',(await page.locator('body').innerText()).slice(-6000));throw e;}finally{await browser.close();}
