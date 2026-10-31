import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import handler from '../api/payments.mjs';
import createOrder from '../api/create-order.mjs';
import verifyPayment from '../api/verify-payment.mjs';
import {PAYMENT_SKUS,skuValue,assertCheckoutAmount,verifyCheckoutSignature,verifyWebhookSignature,paymentsConfigured} from '../server/payments.mjs';

const jwt='eyJhbGciOiJub25lIn0.e30.one';
test('production checkout requires live credentials and webhook recovery configuration',()=>{
 const credentials={RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'fixture-secret',RAZORPAY_WEBHOOK_SECRET:'fixture-hook'};
 assert.equal(paymentsConfigured({...credentials,VERCEL_ENV:'preview'}),true);
 assert.equal(paymentsConfigured({...credentials,VERCEL_ENV:'production'}),false);
 assert.equal(paymentsConfigured({...credentials,PAYMENT_MODE:'live'}),false);
 const live={...credentials,VERCEL_ENV:'production',RAZORPAY_KEY_ID:'rzp_live_fixture'};
 assert.equal(paymentsConfigured(live),true);
 assert.equal(paymentsConfigured({...live,RAZORPAY_KEY_SECRET:''}),false);
 assert.equal(paymentsConfigured({...live,RAZORPAY_WEBHOOK_SECRET:''}),false);
});
async function request(url,options={},fn=handler){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await fn({url,method:options.method||'GET',headers:options.headers||{},body:options.body,socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}

test('website and video SKUs are fixed INR amounts',()=>{
 assert.equal(PAYMENT_SKUS['website-classic'].amount,119900);
 assert.equal(PAYMENT_SKUS['website-royal'].amount,149900);
 assert.equal(PAYMENT_SKUS['video-royal'].amount,149900);
 assert.equal(skuValue('website-classic'),'website-classic');
 assert.throws(()=>skuValue('free'),{status:400});
 assert.throws(()=>skuValue('assembly-proceed'),{status:400});
 assert.throws(()=>skuValue('face-swap'),{status:400});
 assert.equal('assembly-proceed' in PAYMENT_SKUS,false);
 assert.equal('face-swap' in PAYMENT_SKUS,false);
});

test('checkout amount must be at least 100 paise',()=>{
 assert.equal(assertCheckoutAmount(100),100);
 assert.throws(()=>assertCheckoutAmount(99),{status:400});
 assert.throws(()=>assertCheckoutAmount(12.5),{status:400});
});

test('checkout signatures must match the Razorpay HMAC',()=>{
 const env={RAZORPAY_KEY_ID:'rzp_test',RAZORPAY_KEY_SECRET:'secret-key'};
 const orderId='order_1',paymentId='pay_1';
 const signature=createHmac('sha256',env.RAZORPAY_KEY_SECRET).update(orderId+'|'+paymentId).digest('hex');
 assert.equal(paymentsConfigured(env),true);
 verifyCheckoutSignature({orderId,paymentId,signature},env);
 assert.throws(()=>verifyCheckoutSignature({orderId,paymentId,signature:'deadbeef'},env),{status:400});
 assert.throws(()=>verifyCheckoutSignature({orderId,paymentId:'',signature},env),{status:400});
 assert.throws(()=>verifyCheckoutSignature({orderId,paymentId},env),{status:400});
});

test('payments config hides the secret and reports whether checkout can run',async()=>{
 const env={...process.env};
 delete process.env.RAZORPAY_KEY_ID;delete process.env.RAZORPAY_KEY_SECRET;
 try{
  const closed=await request('/api/payments?action=config');
  assert.equal(closed.code,200);assert.equal(closed.body.configured,false);assert.equal(closed.body.keyId,'');
  process.env.RAZORPAY_KEY_ID=' rzp_test_key ';process.env.RAZORPAY_KEY_SECRET='"secret-key"';
  const open=await request('/api/payments?action=config');
  assert.equal(open.body.configured,true);assert.equal(open.body.keyId,'rzp_test_key');
  assert.equal(JSON.stringify(open.body).includes('secret-key'),false);
 }finally{for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});

test('retired website checkout is blocked; video checkout still creates orders',async t=>{
 const env={...process.env};
 Object.assign(process.env,{
  SUPABASE_URL:'https://pay-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-service',
  RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789',
  RAZORPAY_KEY_ID:'rzp_test_key',
  RAZORPAY_KEY_SECRET:'secret-key'
 });
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const parsed=new URL(String(url));
  calls.push({host:parsed.hostname,path:parsed.pathname,method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined});
  if(parsed.pathname==='/auth/v1/user')return new Response(JSON.stringify({id:'user-1',email:'host@example.com'}));
  if(parsed.pathname.endsWith('/rpc/consume_rate_limit'))return new Response('true',{headers:{'Content-Type':'application/json'}});
  if(parsed.hostname==='api.razorpay.com')return new Response(JSON.stringify({id:'order_test',amount:149900,currency:'INR'}),{status:200});
  if(parsed.pathname.endsWith('/payments'))return new Response(JSON.stringify([{id:'pay-row',razorpay_order_id:'order_test',status:'created'}]),{status:201});
  return new Response('[]');
 });
 try{
  const retired=await request('/api/create-order',{method:'POST',body:{sku:'website-classic',slug:'aaron-maria'}},createOrder);
  assert.equal(retired.code,410);assert.equal(calls.some(c=>c.host==='api.razorpay.com'),false);
  const created=await request('/api/create-order',{method:'POST',body:{sku:'video-royal',slug:'aaron-maria'}},createOrder);
  assert.equal(created.code,201);assert.equal(created.body.order_id,'order_test');assert.equal(created.body.orderId,'order_test');assert.equal(created.body.amount,149900);
  assert.equal(created.body.keyId,'rzp_test_key');
  assert.ok(calls.some(c=>c.host==='api.razorpay.com'&&c.body?.amount===149900));
  const tiny=await request('/api/create-order',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{amount:50,currency:'INR',receipt:'tiny'}},createOrder);
  assert.equal(tiny.code,400);
 }finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});

test('Razorpay auth failures return 401 and API errors return 500',async t=>{
 const env={...process.env};
 Object.assign(process.env,{
  SUPABASE_URL:'https://pay-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-service',
  RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789',
  RAZORPAY_KEY_ID:'rzp_test_key',
  RAZORPAY_KEY_SECRET:'secret-key'
 });
 let razorpayStatus=401;
 t.mock.method(globalThis,'fetch',async(url)=>{
  const parsed=new URL(String(url));
  if(parsed.pathname==='/auth/v1/user')return new Response(JSON.stringify({id:'user-1',email:'host@example.com'}));
  if(parsed.pathname.endsWith('/rpc/consume_rate_limit'))return new Response('true',{headers:{'Content-Type':'application/json'}});
  if(parsed.hostname==='api.razorpay.com')return new Response(JSON.stringify({error:{description:'Razorpay unavailable'}}),{status:razorpayStatus});
  return new Response('[]');
 });
 try{
  const unauthorized=await request('/api/create-order',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{sku:'video-royal',slug:'aaron-maria'}},createOrder);
  assert.equal(unauthorized.code,401);
  razorpayStatus=502;
  const failed=await request('/api/create-order',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{sku:'video-royal',slug:'aaron-maria'}},createOrder);
  assert.equal(failed.code,500);
 }finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});

test('verify captures a matching checkout signature',async t=>{
 const env={...process.env};
 Object.assign(process.env,{
  SUPABASE_URL:'https://pay-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-service',
  RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789',
  RAZORPAY_KEY_ID:'rzp_test_key',
  RAZORPAY_KEY_SECRET:'secret-key'
 });
 const signature=createHmac('sha256','secret-key').update('order_test|pay_test').digest('hex');
 const writes=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const parsed=new URL(String(url));
  if(parsed.pathname==='/auth/v1/user')return new Response(JSON.stringify({id:'user-1',email:'host@example.com'}));
  if(parsed.pathname.endsWith('/payments')){
   writes.push({method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined});
   return new Response(JSON.stringify([{id:'pay-row',razorpay_order_id:'order_test',razorpay_payment_id:'pay_test',status:'captured',slug:'aaron-maria'}]),{status:200});
  }
  return new Response('[]');
 });
 try{
  const verified=await request('/api/verify-payment',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{slug:'aaron-maria',sku:'website-classic',razorpay_order_id:'order_test',razorpay_payment_id:'pay_test',razorpay_signature:signature}},verifyPayment);
  assert.equal(verified.code,200);assert.equal(verified.body.ok,true);assert.equal(verified.body.paymentId,'pay_test');
  const mismatch=await request('/api/verify-payment',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{slug:'aaron-maria',sku:'website-classic',razorpay_order_id:'order_test',razorpay_payment_id:'pay_test',razorpay_signature:'deadbeef'}},verifyPayment);
  assert.equal(mismatch.code,400);
  assert.equal(writes.some(row=>row.body?.status==='captured'&&row.body?.razorpay_signature==='deadbeef'),false);
  const missing=await request('/api/verify-payment',{method:'POST',headers:{authorization:'Bearer '+jwt},body:{razorpay_order_id:'order_test'}},verifyPayment);
  assert.equal(missing.code,400);
 }finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});

test('webhook signatures must match the raw Razorpay HMAC',()=>{
 const env={RAZORPAY_WEBHOOK_SECRET:' "hook-secret" '};
 const raw='{"event":"payment.captured"}';
 const signature=createHmac('sha256','hook-secret').update(raw).digest('hex');
 verifyWebhookSignature(raw,signature,env);
 assert.throws(()=>verifyWebhookSignature(raw,'deadbeef',env),{status:400});
 assert.throws(()=>verifyWebhookSignature(raw,signature,{}),{status:503});
});

test('resume returns a captured payment without opening Razorpay',async t=>{
 const env={...process.env};
 Object.assign(process.env,{
  SUPABASE_URL:'https://pay-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-service',
  RATE_LIMIT_SECRET:'test-rate-secret-01234567890123456789',
  RAZORPAY_KEY_ID:'rzp_test_key',
  RAZORPAY_KEY_SECRET:'secret-key'
 });
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const parsed=new URL(String(url));
  calls.push({host:parsed.hostname,path:parsed.pathname,search:parsed.search,method:options.method||'GET'});
  if(parsed.pathname.endsWith('/rpc/consume_rate_limit'))return new Response('true',{headers:{'Content-Type':'application/json'}});
  if(parsed.pathname.endsWith('/payments')&&parsed.search.includes('status=eq.captured')){
   const slug=(parsed.searchParams.get('slug')||'').replace(/^eq\./,'');
   if(slug==='aaron-maria')return new Response(JSON.stringify([{id:'pay-row',razorpay_order_id:'order_test',razorpay_payment_id:'pay_test',status:'captured',slug:'aaron-maria'}]));
   return new Response('[]');
  }
  return new Response('[]');
 });
 try{
  const captured=await request('/api/payments?action=resume',{method:'POST',body:{slug:'aaron-maria'}});
  assert.equal(captured.code,200);assert.equal(captured.body.captured,true);assert.equal(captured.body.paymentId,'pay_test');
  assert.equal(calls.some(c=>c.host==='api.razorpay.com'),false);
  const unpaid=await request('/api/payments?action=resume',{method:'POST',body:{slug:'open-slot-one'}});
  assert.equal(unpaid.code,200);assert.equal(unpaid.body.captured,false);
 }finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});

test('webhook capture records the paid slug for later resume',async t=>{
 const env={...process.env};
 Object.assign(process.env,{
  SUPABASE_URL:'https://pay-test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-service',
  RAZORPAY_WEBHOOK_SECRET:'hook-secret'
 });
 const writes=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const parsed=new URL(String(url));
  if(parsed.pathname.endsWith('/payments')){
   writes.push({method:options.method||'GET',body:options.body?JSON.parse(options.body):undefined,search:parsed.search});
   if((options.method||'GET')==='GET')return new Response('[]');
   return new Response(JSON.stringify([{id:'pay-row',razorpay_order_id:'order_hook',razorpay_payment_id:'pay_hook',status:'captured',slug:'aaron-maria'}]),{status:201});
  }
  return new Response('[]');
 });
 const raw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_hook',order_id:'order_hook',status:'captured',amount:119900,currency:'INR',notes:{slug:'aaron-maria',sku:'website-classic'}}}}});
 const signature=createHmac('sha256','hook-secret').update(raw).digest('hex');
 try{
  const captured=await request('/api/payments?action=webhook',{method:'POST',headers:{'x-razorpay-signature':signature},body:raw});
  assert.equal(captured.code,200);assert.equal(captured.body.ok,true);
  assert.equal(writes.some(row=>row.body?.status==='captured'&&row.body?.slug==='aaron-maria'&&row.body?.razorpay_payment_id==='pay_hook'),true);
  const rejected=await request('/api/payments?action=webhook',{method:'POST',headers:{'x-razorpay-signature':'deadbeef'},body:raw});
  assert.equal(rejected.code,400);
 }finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
