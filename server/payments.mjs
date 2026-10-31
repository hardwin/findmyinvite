import {createHmac,timingSafeEqual} from 'node:crypto';
import {db,HttpError,databaseConfigured} from './core.mjs';

export const PAYMENT_SKUS={
 'website-classic':{amount:119900,label:'Wedding website'},
 'website-royal':{amount:149900,label:'Wedding website'},
 'video-royal':{amount:149900,label:'Wedding invitation video'}
};

function cleanSecret(value){
 return String(value||'').trim().replace(/^['"]|['"]$/g,'');
}

export function razorpayCredentials(env=process.env){
 return {keyId:cleanSecret(env.RAZORPAY_KEY_ID),keySecret:cleanSecret(env.RAZORPAY_KEY_SECRET)};
}

export function paymentsConfigured(env=process.env){
 const {keyId,keySecret}=razorpayCredentials(env);
 const liveRequired=env.VERCEL_ENV==='production'||env.PAYMENT_MODE==='live';
 return Boolean(keyId&&keySecret&&(!liveRequired||(keyId.startsWith('rzp_live_')&&cleanSecret(env.RAZORPAY_WEBHOOK_SECRET))));
}

export function publicKeyId(env=process.env){
 return razorpayCredentials(env).keyId;
}

export function skuValue(value){
 if(!PAYMENT_SKUS[value])throw new HttpError(400,'Choose a wedding website or video plan.');
 return value;
}

export function assertCheckoutAmount(amount){
 const paise=Number(amount);
 if(!Number.isInteger(paise)||paise<100)throw new HttpError(400,'Amount must be at least 100 paise.');
 return paise;
}

function equal(actual,expected){
 const a=Buffer.from(String(actual||''));
 const b=Buffer.from(String(expected||''));
 return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}

export function razorpayAuth(env=process.env){
 const {keyId,keySecret}=razorpayCredentials(env);
 if(!keyId||!keySecret)throw new HttpError(503,'Payments are not configured yet.');
 return 'Basic '+Buffer.from(keyId+':'+keySecret).toString('base64');
}

export function verifyCheckoutSignature({orderId,paymentId,signature},env=process.env){
 if(!paymentsConfigured(env))throw new HttpError(503,'Payments are not configured yet.');
 if(typeof orderId!=='string'||!orderId||typeof paymentId!=='string'||!paymentId||typeof signature!=='string'||!signature)throw new HttpError(400,'Payment confirmation is incomplete.');
 const expected=createHmac('sha256',razorpayCredentials(env).keySecret).update(orderId+'|'+paymentId).digest('hex');
 if(!equal(signature,expected))throw new HttpError(400,'Payment could not be verified.');
}

export function verifyWebhookSignature(rawBody,signature,env=process.env){
 const secret=cleanSecret(env.RAZORPAY_WEBHOOK_SECRET);
 if(!secret)throw new HttpError(503,'Payment notifications are not configured yet.');
 const expected=createHmac('sha256',secret).update(String(rawBody||'')).digest('hex');
 if(!equal(signature,expected))throw new HttpError(400,'Payment notification could not be verified.');
}

export async function razorpayRequest(path,body,env=process.env){
 const response=await fetch('https://api.razorpay.com/v1/'+path,{
  method:'POST',
  headers:{Authorization:razorpayAuth(env),'Content-Type':'application/json'},
  body:JSON.stringify(body)
 });
 const value=await response.json().catch(()=>({}));
 if(response.status===401)throw new HttpError(401,'Razorpay authentication failed.');
 if(!response.ok)throw new HttpError(500,value.error?.description||'Could not start payment. Please try again.');
 return value;
}

export async function createRazorpayOrder({amount,currency='INR',receipt,notes},env=process.env){
 if(!paymentsConfigured(env))throw new HttpError(503,'Payments are not configured yet.');
 const paise=assertCheckoutAmount(amount);
 return razorpayRequest('orders',{amount:paise,currency,receipt,notes},env);
}

export async function findCapturedPayment({slug,paymentId}){
 if(!databaseConfigured())throw new HttpError(503,'Publishing is not configured yet.');
 const query=paymentId
  ?'payments?razorpay_payment_id=eq.'+encodeURIComponent(paymentId)+'&status=eq.captured&select=*&limit=1'
  :'payments?slug=eq.'+encodeURIComponent(slug)+'&status=eq.captured&select=*&order=created_at.desc&limit=1';
 const rows=await db(query);
 return rows?.[0]||null;
}

export async function requireCapturedPayment({slug,paymentId}){
 const row=await findCapturedPayment({slug,paymentId});
 if(!row)throw new HttpError(402,'Pay to create this invitation page.');
 if(row.slug&&row.slug!==slug)throw new HttpError(409,'This payment belongs to a different address.');
 return row;
}

export async function recordPayment(row){
 const existing=await db('payments?razorpay_order_id=eq.'+encodeURIComponent(row.razorpay_order_id)+'&select=*&limit=1');
 if(existing?.length){
  const current=existing[0];
  const next={...current,...row,updated_at:new Date().toISOString()};
  const saved=await db('payments?id=eq.'+encodeURIComponent(current.id),{method:'PATCH',headers:{Prefer:'return=representation'},body:next});
  return saved[0];
 }
 const created=await db('payments',{method:'POST',headers:{Prefer:'return=representation'},body:row});
 return created[0];
}
