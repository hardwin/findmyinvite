import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {videoQuote} from '../shared/video-pricing.mjs';
import {videoPaymentService,videoInvitationId,promoDigest,validVideoPromo} from '../server/video-payments.mjs';
import {collectEvent,recordVideoCheckout} from '../server/owner/events.mjs';
import {get,list} from '../server/owner/store.mjs';
import {orderedFunnel} from '../shared/owner-metrics.mjs';
const owner='owner-a',template='wedding-bells-v1',code='PRIVATE-TEST-CODE';
function fixture(){
 const rows=new Map(),payments=new Map(),created=[],calls=[];
 const env={RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'fixture-secret',VIDEO_TEST_PROMO_SHA256:promoDigest(code)};
 let time=Date.now(),sequence=0;
 const copy=v=>v?structuredClone(v):null;
 const store={
  async get(id){return copy(rows.get(id));},
  async byOrder(id){return copy([...rows.values()].find(r=>r.razorpay_order_id===id));},
  async byPayment(id){return copy([...rows.values()].find(r=>r.razorpay_payment_id===id));},
  async reserve(id,user,tid){if(!rows.has(id)){const q=videoQuote(tid);rows.set(id,{id,owner_id:user,template_id:tid,status:'pending',total_paise:q.totalPaise,base_paise:q.basePaise,tax_bps:q.taxBps,tax_paise:q.taxPaise});}return copy(rows.get(id));},
  async patch(id,patch,filter=''){
   const r=rows.get(id);if(!r)return null;
   if(filter.includes('status=eq.pending')&&r.status!=='pending'||filter.includes('status=neq.refunded')&&r.status==='refunded'||filter.includes('razorpay_order_id=is.null')&&r.razorpay_order_id)return null;
   if(filter.includes('checkout_started_at.lt.')&&r.checkout_started_at&&Date.parse(r.checkout_started_at)>time-120000)return null;
   const token=/checkout_token=eq.([^&]+)/.exec(filter)?.[1];if(token&&token!==r.checkout_token)return null;
   Object.assign(r,patch);return copy(r);
  }
 };
 const gateway={async create(input){created.push(input);return {id:'order_fixture'+(++sequence),amount:input.amount,currency:input.currency};},async get(path){calls.push(path);if(path.startsWith('payments/'))return copy(payments.get(path.slice(9)));return {items:[...payments.values()].filter(p=>path==='orders/'+p.order_id+'/payments')};}};
 const service=videoPaymentService({store,env,gateway,now:()=>time});
 function captured(order,patch={}){const p={id:'pay_fixture'+(++sequence),order_id:order.orderId,amount:82482,currency:'INR',status:'captured',amount_refunded:0,...patch};payments.set(p.id,p);return p;}
 const response=p=>({razorpay_order_id:p.order_id,razorpay_payment_id:p.id,razorpay_signature:createHmac('sha256',env.RAZORPAY_KEY_SECRET).update(p.order_id+'|'+p.id).digest('hex')});
 return {rows,payments,created,calls,env,store,gateway,service,captured,response,advance:ms=>time+=ms};
}
test('₹699 plus 18% GST is fixed server-side, checkout resumes the same order',async()=>{const f=fixture(),id=randomUUID();const a=await f.service.order(owner,id,template),b=await f.service.order(owner,id,template);assert.equal(a.amount,82482);assert.deepEqual(a.quote,{basePaise:69900,taxBps:1800,taxPaise:12582,totalPaise:82482,taxLabel:'GST',currency:'INR'});assert.equal(a.currency,'INR');assert.equal(a.orderId,b.orderId);assert.equal(f.created.length,1);assert.equal(f.created[0].amount,82482);assert.equal(f.created[0].notes.videoInvitationId,id);});
test('an existing ₹299 gateway order still settles at its agreed amount after the price change',async()=>{
 const f=fixture(),id=randomUUID();
 f.rows.set(id,{id,owner_id:owner,template_id:template,status:'pending',total_paise:29900,razorpay_order_id:'order_legacy'});
 const order=await f.service.order(owner,id,template);
 assert.equal(order.amount,29900);assert.equal(order.quote,null);assert.equal(f.created.length,0);
 const p=f.captured(order,{amount:29900});
 assert.equal((await f.service.verify(owner,id,template,f.response(p))).unlocked,true);
 assert.equal((await f.service.order(owner,id,template)).amount,29900);
});
test('a legacy reservation without a gateway order receives the new price and GST breakdown',async()=>{
 const f=fixture(),id=randomUUID();f.rows.set(id,{id,owner_id:owner,template_id:template,status:'pending',total_paise:29900});
 assert.equal((await f.service.status(owner,id,template)).amount,82482);
 const order=await f.service.order(owner,id,template);assert.equal(order.amount,82482);assert.equal(f.rows.get(id).tax_paise,12582);
});
test('concurrent checkouts create at most one payable Razorpay order',async()=>{const f=fixture(),id=randomUUID();const results=await Promise.allSettled([f.service.order(owner,id,template),f.service.order(owner,id,template)]);assert.equal(f.created.length,1);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);});
test('unpaid and client-invented invitations cannot start renders',async()=>{const f=fixture(),id=randomUUID();await assert.rejects(f.service.requireAccess(owner,id,template),e=>e.status===402);await f.service.order(owner,id,template);await assert.rejects(f.service.requireAccess(owner,id,template),e=>e.status===402);assert.throws(()=>videoInvitationId('../escape'));});
test('private promo is normalized, grants zero-charge access without contacting gateway',async()=>{const f=fixture(),id=randomUUID();assert.equal(validVideoPromo('guess',f.env),false);assert.equal(validVideoPromo(code,{}),false);assert.equal(validVideoPromo(code,{VIDEO_TEST_PROMO_SHA256:'bad'}),false);await assert.rejects(f.service.promo(owner,id,template,'invalid'),/not valid/);const result=await f.service.promo(owner,id,template,'  '+code.toLowerCase()+' ');assert.equal(result.unlocked,true);assert.equal(result.discount,82482);assert.equal(result.status,'complimentary');assert.equal((await f.service.order(owner,id,template)).unlocked,true);assert.equal(f.calls.length+f.created.length,0);assert.equal(JSON.stringify([...f.rows.values()]).includes(code),false);});
test('purchase access belongs to one owner, saved invitation and template',async()=>{const f=fixture(),id=randomUUID();await f.service.promo(owner,id,template,code);for(const operation of ['status','order','requireAccess']){await assert.rejects(f.service[operation]('other',id,template),/not found/);await assert.rejects(f.service[operation](owner,id,'other-template'),/not found/);}await assert.rejects(f.service.requireAccess(owner,randomUUID(),template),e=>e.status===402);});
test('captured payment unlocks once and subsequent edits/retries do not create new orders',async()=>{const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template),p=f.captured(order);const result=await f.service.verify(owner,id,template,f.response(p));assert.equal(result.status,'captured');for(let i=0;i<3;i++){await f.service.requireAccess(owner,id,template);assert.equal((await f.service.order(owner,id,template)).unlocked,true);}await f.service.verify(owner,id,template,f.response(p));assert.equal(f.created.length,1);assert.equal(f.rows.get(id).razorpay_payment_id,p.id);});
test('forged signature and order substitution never unlock access',async()=>{const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template),p=f.captured(order);await assert.rejects(f.service.verify(owner,id,template,{...f.response(p),razorpay_signature:'forged'}),/verified/);await assert.rejects(f.service.verify(owner,id,template,{...f.response(p),razorpay_order_id:'order_another'}),/match/);assert.equal(f.rows.get(id).status,'pending');});
test('server verifies captured state, exact total, currency and gateway order',async()=>{for(const patch of [{amount:100},{currency:'USD'},{status:'authorized'},{amount_refunded:100},{order_id:'order_wrong'}]){const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template),p=f.captured(order,patch);await assert.rejects(f.service.settle(order.orderId,p.id));assert.equal(f.rows.get(id).status,'pending');}});
test('closing browser after captured payment recovers access without a second charge',async()=>{const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template);f.captured(order);assert.equal((await f.service.status(owner,id,template)).unlocked,true);assert.equal((await f.service.order(owner,id,template)).unlocked,true);assert.equal(f.created.length,1);});
test('cancelled unpaid checkout can use promo; already captured checkout stays paid',async()=>{for(const paid of [false,true]){const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template);if(paid)f.captured(order);const result=await f.service.promo(owner,id,template,code);assert.equal(result.status,paid?'captured':'complimentary');assert.equal(f.created.length,1);}});
test('webhook replays are idempotent and recovery requires matching server notes',async()=>{const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template),p=f.captured(order,{notes:f.created[0].notes});const event={event:'payment.captured',payload:{payment:{entity:p}}};f.rows.get(id).razorpay_order_id=null;assert.equal(await f.service.webhook(event),true);assert.equal(await f.service.webhook(event),true);assert.equal(f.rows.get(id).status,'captured');const other=randomUUID();await f.store.reserve(other,owner,template);f.rows.get(other).checkout_token='different';await assert.rejects(f.service.settle('order_other',f.captured({orderId:'order_other'},{notes:{videoInvitationId:other,ownerId:owner,checkoutToken:'forged'}}).id,other),/match/);});
test('refund webhook revokes access and payment notification cannot reinstate it',async()=>{const f=fixture(),id=randomUUID(),order=await f.service.order(owner,id,template),p=f.captured(order);await f.service.verify(owner,id,template,f.response(p));p.amount_refunded=82482;p.status='refunded';f.payments.set(p.id,p);assert.equal(await f.service.webhook({event:'refund.processed',payload:{payment:{entity:{...p,status:'captured'}},refund:{entity:{payment_id:p.id}}}}),true);assert.equal(await f.service.webhook({event:'payment.captured',payload:{payment:{entity:{...p,status:'captured'}}}}),true);await assert.rejects(f.service.requireAccess(owner,id,template),e=>e.status===402);await assert.rejects(f.service.settle(order.orderId,p.id),/refunded/);});
test('SQL enforces unique purchases and blocks direct client billing changes',async()=>{
 const pg=new PGlite();try{
  await pg.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
  const sql=await readFile(new URL('../supabase/migrations/20261112070852_video_invitation_checkout.sql',import.meta.url),'utf8');await pg.exec(sql);
  await pg.exec(await readFile(new URL('../supabase/migrations/20261115130956_checkout_card_prices.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../supabase/migrations/20261117011141_wedding_bells_premium_price.sql',import.meta.url),'utf8'));
  const id=randomUUID(),user=randomUUID(),other=randomUUID();await pg.query('insert into auth.users values($1),($2)',[user,other]);
  await pg.exec('set role service_role');
  const next=randomUUID(),priced=(await pg.query('select * from public.fmi_reserve_video_invitation_v2($1,$2,$3)',[next,user,template])).rows[0];
  const premiumId=randomUUID(),premium=(await pg.query('select * from public.fmi_reserve_video_invitation_v3($1,$2,$3)',[premiumId,user,'wedding-bells-v1'])).rows[0];
  assert.equal(premium.base_paise,69900);assert.equal(premium.tax_paise,12582);assert.equal(premium.total_paise,82482);
  await assert.rejects(pg.query("update public.video_invitation_orders set template_id='temple-v1' where id=$1",[premiumId]),/check constraint/);
  assert.equal((await pg.query('select * from public.fmi_reserve_video_invitation_v3($1,$2,$3)',[next,user,template])).rows[0].total_paise,58882);
  assert.equal(priced.base_paise,49900);assert.equal(priced.tax_bps,1800);assert.equal(priced.tax_paise,8982);assert.equal(priced.total_paise,58882);
  await assert.rejects(pg.query('update public.video_invitation_orders set tax_paise=null where id=$1',[next]),/check constraint/);
  await assert.rejects(pg.query('select * from public.fmi_reserve_video_invitation_v2($1,$2,$3)',[next,other,template]),/unavailable/);
  assert.equal((await pg.query('select * from public.fmi_reserve_video_invitation($1,$2,$3)',[id,user,template])).rows.length,1);
  assert.equal((await pg.query('select * from public.fmi_reserve_video_invitation($1,$2,$3)',[id,user,template])).rows.length,1);
  await assert.rejects(pg.query('select * from public.fmi_reserve_video_invitation($1,$2,$3)',[id,other,template]),/unavailable/);
  await assert.rejects(pg.query("update public.video_invitation_orders set total_paise=1 where id=$1",[id]),/check constraint/);
  await assert.rejects(pg.query("update public.video_invitation_orders set status='captured' where id=$1",[id]),/check constraint/);
  await assert.rejects(pg.query("update public.video_invitation_orders set status='complimentary',unlocked_at=now() where id=$1",[id]),/check constraint/);
  for(const role of ['anon','authenticated']){await pg.exec('reset role; set role '+role);await assert.rejects(pg.query('select * from public.fmi_reserve_video_invitation_v3($1,$2,$3)',[premiumId,user,'wedding-bells-v1']),/permission denied/);await assert.rejects(pg.query('select * from public.video_invitation_orders'),/permission denied/);await assert.rejects(pg.query('select * from public.fmi_reserve_video_invitation($1,$2,$3)',[id,user,template]),/permission denied/);await assert.rejects(pg.query('select * from public.fmi_reserve_video_invitation_v2($1,$2,$3)',[next,user,template]),/permission denied/);}
 }finally{await pg.close();}
});
test('HTTP render endpoint rejects invented paid flags and unauthenticated requests',async()=>{
 const before={...process.env};process.env.NODE_ENV='test';
 const {startHarness}=await import('./video-harness.mjs');const harness=await startHarness();
 try{for(const token of ['video-qa-owner','invalid']){const response=await fetch(harness.origin+'/api/video-personalise?action=render',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({invitationId:randomUUID(),templateId:template,paid:true,unlocked:true,amount:0,content:{}})});assert.equal(response.status,token==='invalid'?401:402);}}
 finally{await harness.close();for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
});

test('Wedding Bells advertises and charges ₹699 plus GST, with free standard videos',async()=>{
 const f=fixture(),id=randomUUID(),tid='wedding-bells-v1';
 assert.equal((await f.service.status(owner,id,tid)).amount,82482);
 const order=await f.service.order(owner,id,tid);assert.equal(order.amount,82482);assert.equal(order.quote.basePaise,69900);assert.equal(order.quote.taxPaise,12582);assert.equal(f.created[0].amount,82482);
 const p=f.captured(order,{amount:82482});assert.equal((await f.service.verify(owner,id,tid,f.response(p))).unlocked,true);
 assert.equal((await f.service.status(owner,randomUUID(),'temple-v1')).amount,0);
});
test('Wedding Bells keeps an existing gateway order and captured price at ₹499',async()=>{
 const f=fixture(),id=randomUUID(),tid='wedding-bells-v1';f.rows.set(id,{id,owner_id:owner,template_id:tid,status:'pending',total_paise:58882,base_paise:49900,tax_bps:1800,tax_paise:8982,razorpay_order_id:'order_existing'});
 const order=await f.service.order(owner,id,tid);assert.equal(order.amount,58882);assert.equal(f.created.length,0);
 const p=f.captured(order,{amount:58882});await f.service.verify(owner,id,tid,f.response(p));assert.equal((await f.service.status(owner,id,tid)).amount,58882);
});
test('Wedding Bells updates an unreserved draft price and grants a correctly priced promo',async()=>{
 const f=fixture(),id=randomUUID(),tid='wedding-bells-v1';f.rows.set(id,{id,owner_id:owner,template_id:tid,status:'pending',total_paise:58882,base_paise:49900,tax_bps:1800,tax_paise:8982});
 assert.equal((await f.service.order(owner,id,tid)).amount,82482);
 assert.equal((await f.service.promo(owner,randomUUID(),tid,code)).discount,82482);
});

test('paid video sessions reach the ordered funnel only after discovery, with one checkout per attempt',async t=>{
 const before={...process.env};
 t.after(()=>{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);});
 process.env.FMI_OWNER_LOCAL='1';process.env.FMI_OWNER_DB=resolve('work/owner-tests/'+randomUUID()+'.sqlite');
 delete process.env.VERCEL;
 const f=fixture(),templateId='wedding-bells-v1',orders=[],events=[];
 const req={headers:{host:'shop.test',origin:'http://shop.test'}};
 async function buy(discovered){
  const id=randomUUID(),session=randomUUID(),context={id:randomUUID(),session,device:'mobile',language:'en'};
  if(discovered)for(const type of ['template_selected','preview','form_start']){
   const input={...context,id:randomUUID(),type,templateId};await collectEvent(req,input);events.push(await get('product-event',input.id));
  }
  const order=await f.service.order(owner,id,templateId);
  await recordVideoCheckout(req,'payment-order',order,context,templateId);
  await recordVideoCheckout(req,'payment-order',order,context,templateId);
  events.push(await get('product-event',context.id));
  const captured=await f.service.verify(owner,id,templateId,f.response(f.captured(order,{amount:82482})));
  await recordVideoCheckout(req,'payment-verify',captured,context,templateId);
  const linked=await get('order-context',id);
  assert.equal(linked.session,session);assert.equal(linked.confirmed,true);
  orders.push({id,purpose:'video',analyticsSession:linked.session,status:captured.status,reporting_at:new Date().toISOString()});
  for(const action of ['payment-order','payment-status','payment-promo']){
   const retry={...context,id:randomUUID()};await recordVideoCheckout(req,action,captured,retry,templateId);
   assert.equal(await get('product-event',retry.id),null);
  }
 }
 await buy(true);await buy(false);
 assert.equal((await list('product-event')).filter(e=>e.type==='checkout').length,2);
 assert.deepEqual(orderedFunnel(events,orders).map(stage=>stage.sessions),[1,1,1,1,1]);
 const id=randomUUID(),pending=await f.service.order(owner,id,templateId);
 const first={id:randomUUID(),session:randomUUID(),device:'mobile'},second={...first,id:randomUUID(),session:randomUUID()};
 await recordVideoCheckout(req,'payment-order',pending,first,templateId);
 assert.equal((await get('order-context',id)).session,first.session);
 await recordVideoCheckout(req,'payment-order',pending,second,templateId);
 assert.equal((await get('order-context',id)).session,null);
 const paid=await f.service.verify(owner,id,templateId,f.response(f.captured(pending,{amount:82482})));
 await recordVideoCheckout(req,'payment-verify',paid,second,templateId);
 await recordVideoCheckout(req,'payment-order',pending,first,templateId);
 assert.equal((await get('order-context',id)).session,second.session);
 const promo=await f.service.promo(owner,randomUUID(),templateId,code);
 await recordVideoCheckout(req,'payment-order',promo,first,templateId);
 assert.equal(await get('order-context',promo.invitationId),null);
});
