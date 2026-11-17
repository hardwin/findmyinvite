import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import {db,HttpError} from './core.mjs';
import {createRazorpayOrder,paymentsConfigured,publicKeyId,razorpayAuth,verifyCheckoutSignature} from './payments.mjs';
import {videoQuote,videoOffer,VIDEO_CURRENCY} from '../shared/video-pricing.mjs';

const table='video_invitation_orders';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function videoInvitationId(id){if(typeof id!=='string'||!uuid.test(id))throw new HttpError(400,'Reload your saved invitation before continuing.');return id.toLowerCase();}
export function promoDigest(code){return createHash('sha256').update(String(code||'').trim().toUpperCase()).digest('hex');}
export function validVideoPromo(code,env=process.env){
 const expected=String(env.VIDEO_TEST_PROMO_SHA256||'').trim();
 return typeof code==='string'&&code.trim().length>=8&&code.length<=100&&/^[a-f0-9]{64}$/.test(expected)&&timingSafeEqual(Buffer.from(promoDigest(code),'hex'),Buffer.from(expected,'hex'));
}
export function videoPrice(env=process.env,templateId){const quote=videoQuote(templateId);return {...videoOffer(templateId),amount:quote.totalPaise,quote,currency:VIDEO_CURRENCY,configured:paymentsConfigured(env)};}
const unlocked=row=>['captured','complimentary'].includes(row?.status);
function publicPurchase(row,env,templateId){
 const price=videoPrice(env,row?.template_id||templateId),reserved=row&&(row.razorpay_order_id||unlocked(row));
 const amount=reserved?row.total_paise:price.amount;
 const quote=reserved?(row.base_paise!=null?{basePaise:row.base_paise,taxBps:row.tax_bps,taxPaise:row.tax_paise,totalPaise:amount,taxLabel:'GST',currency:VIDEO_CURRENCY}:null):price.quote;
 return {...price,amount,quote,invitationId:row?.id,unlocked:unlocked(row),status:row?.status||'pending',discount:row?.status==='complimentary'?amount:0};
}

export function videoPaymentStore(query=db){
 const one=async(path,options)=>(await query(path,options))?.[0]||null;
 return {
  get:id=>one(table+'?id=eq.'+encodeURIComponent(id)+'&select=*'),
  byOrder:id=>one(table+'?razorpay_order_id=eq.'+encodeURIComponent(id)+'&select=*'),
  byPayment:id=>one(table+'?razorpay_payment_id=eq.'+encodeURIComponent(id)+'&select=*'),
  reserve:(id,owner,template)=>one('rpc/fmi_reserve_video_invitation_v3',{method:'POST',body:{p_id:id,p_owner:owner,p_template:template}}),
  patch:(id,patch,filter='')=>one(table+'?id=eq.'+encodeURIComponent(id)+filter,{method:'PATCH',headers:{Prefer:'return=representation'},body:patch})
 };
}
async function gatewayGet(path,env){
 const response=await fetch('https://api.razorpay.com/v1/'+path,{headers:{Authorization:razorpayAuth(env)},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new HttpError(503,'Payment confirmation is temporarily unavailable. Your draft is saved. Please check payment status again.');
 return response.json();
}
export function videoPaymentService({store=videoPaymentStore(),env=process.env,now=()=>Date.now(),gateway={create:input=>createRazorpayOrder(input,env),get:path=>gatewayGet(path,env)}}={}){
 async function owned(owner,id,template,reserve=false){
  id=videoInvitationId(id);const row=reserve?await store.reserve(id,owner,template):await store.get(id);
  if(row&&(row.owner_id!==owner||row.template_id!==template))throw new HttpError(404,'Invitation not found.');
  return row;
 }
 async function settle(orderId,paymentId,recoveryId){
  if(!/^order_[A-Za-z0-9]+$/.test(orderId||'')||!/^pay_[A-Za-z0-9]+$/.test(paymentId||''))throw new HttpError(400,'Invalid payment reference.');
  let row=await store.byOrder(orderId);
  if(!row&&uuid.test(recoveryId||''))row=await store.get(recoveryId);
  if(!row)return null;
  const payment=await gateway.get('payments/'+paymentId);
  if(payment.id!==paymentId||payment.order_id!==orderId||payment.amount!==row.total_paise||payment.currency!==VIDEO_CURRENCY)throw new HttpError(409,'The payment does not match this invitation.');
  if(row.razorpay_order_id&&row.razorpay_order_id!==orderId||!row.razorpay_order_id&&(payment.notes?.videoInvitationId!==row.id||payment.notes?.checkoutToken!==row.checkout_token||payment.notes?.ownerId!==row.owner_id))throw new HttpError(409,'The payment does not match this invitation.');
  if(row.razorpay_payment_id&&row.razorpay_payment_id!==paymentId)throw new HttpError(409,'A different payment already belongs to this invitation.');
  if(payment.amount_refunded>0||payment.status==='refunded'){
   if(row.razorpay_payment_id===paymentId)await store.patch(row.id,{status:'refunded',refunded_at:new Date(now()).toISOString()});
   throw new HttpError(409,'This payment has been refunded. Contact support for help with this invitation.');
  }
  if(payment.status!=='captured'||row.status==='refunded')throw new HttpError(409,'Payment is still being confirmed. Check payment status again before retrying.');
  if(row.status==='captured')return row;
  row=await store.patch(row.id,{status:'captured',razorpay_order_id:orderId,razorpay_payment_id:paymentId,unlocked_at:new Date(now()).toISOString()},'&status=neq.refunded');
  if(!row)throw new HttpError(409,'Payment status changed. Please reload.');
  return row;
 }
 async function recover(row){
  if(row?.status==='pending'&&row.razorpay_order_id){
   const payments=await gateway.get('orders/'+row.razorpay_order_id+'/payments');
   const captured=payments.items?.find(p=>p.status==='captured'&&!p.amount_refunded);
   if(captured)return await settle(row.razorpay_order_id,captured.id);
  }
  return row;
 }
 async function status(owner,id,template){return publicPurchase(await recover(await owned(owner,id,template)),env,template);}
 async function requireAccess(owner,id,template){
  const row=await owned(owner,id,template);
  if(!unlocked(row))throw new HttpError(402,`Pay ₹${publicPurchase(row,env,template).amount/100} including GST, or apply a valid promo code to create this invitation.`);
  return row;
 }
 async function promo(owner,id,template,code){
  if(!validVideoPromo(code,env))throw new HttpError(400,'That promo code is not valid. Please check it and try again.');
  let row=await recover(await owned(owner,id,template,true));
  if(row.status==='refunded')throw new HttpError(409,'Contact support for help with this invitation.');
  if(!unlocked(row))row=await store.patch(row.id,{status:'complimentary',promo_sha256:promoDigest(code),unlocked_at:new Date(now()).toISOString()},'&status=eq.pending')||await owned(owner,id,template);
  return publicPurchase(row,env);
 }
 async function order(owner,id,template){
  let row=await recover(await owned(owner,id,template,true));
  if(unlocked(row))return publicPurchase(row,env);
  if(row.status==='refunded')throw new HttpError(409,'Contact support for help with this invitation.');
  if(!paymentsConfigured(env))throw new HttpError(503,'Checkout is temporarily unavailable. Your draft is saved.');
  if(!row.razorpay_order_id){
   const token=randomUUID(),time=new Date(now()).toISOString(),before=encodeURIComponent(new Date(now()-120000).toISOString());
   const quote=videoQuote(template);
   const claimed=await store.patch(row.id,{checkout_token:token,checkout_started_at:time,total_paise:quote.totalPaise,base_paise:quote.basePaise,tax_bps:quote.taxBps,tax_paise:quote.taxPaise},'&status=eq.pending&razorpay_order_id=is.null&or=(checkout_started_at.is.null,checkout_started_at.lt.'+before+')');
   if(!claimed)throw new HttpError(409,'Checkout is already opening. Please wait a moment and try again.');
   // A claim prevents simultaneous tabs creating separate payable orders.
   const created=await gateway.create({amount:quote.totalPaise,currency:VIDEO_CURRENCY,receipt:'v-'+token,notes:{kind:'video-personalise',videoInvitationId:row.id,ownerId:owner,checkoutToken:token,templateId:template}});
   if(!/^order_[A-Za-z0-9]+$/.test(created.id||'')||created.amount!==quote.totalPaise||created.currency!==VIDEO_CURRENCY)throw new HttpError(503,'Checkout could not be verified. Please retry shortly.');
   row=await store.patch(row.id,{razorpay_order_id:created.id},'&checkout_token=eq.'+token)||await owned(owner,id,template);
  }
  return {...publicPurchase(row,env),keyId:publicKeyId(env),orderId:row.razorpay_order_id};
 }
 async function verify(owner,id,template,response){
  const row=await owned(owner,id,template);
  if(!row?.razorpay_order_id||row.razorpay_order_id!==response.razorpay_order_id)throw new HttpError(400,'Payment does not match your saved invitation.');
  verifyCheckoutSignature({orderId:row.razorpay_order_id,paymentId:response.razorpay_payment_id,signature:response.razorpay_signature},env);
  return publicPurchase(await settle(row.razorpay_order_id,response.razorpay_payment_id),env);
 }
 async function webhook(event){
  const paymentId=event?.payload?.refund?.entity?.payment_id;
  if(paymentId&&event.event==='refund.processed'){
   if(!/^pay_[A-Za-z0-9]+$/.test(paymentId))return false;
   const row=await store.byPayment(paymentId);if(!row)return false;
   const current=await gateway.get('payments/'+paymentId);
   if(current.amount_refunded>0)await store.patch(row.id,{status:'refunded',refunded_at:new Date(now()).toISOString()});
   return true;
  }
  const p=event?.payload?.payment?.entity;
  if(p?.status==='captured'){
   try{return !!await settle(p.order_id,p.id,p.notes?.videoInvitationId);}
   catch(e){
    // A delayed/replayed capture notification must acknowledge an already verified refund.
    if(e.status===409&&(await store.byPayment(p.id))?.status==='refunded')return true;
    throw e;
   }
  }
  return false;
 }
 return {status,requireAccess,promo,order,verify,settle,webhook};
}
