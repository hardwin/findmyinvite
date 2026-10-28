import {HttpError,bodyJson,respond,fail,method,authUser,bearer,slugValue,rate,isManagementToken} from '../server/core.mjs';
import {PAYMENT_SKUS,paymentsConfigured,publicKeyId,skuValue,assertCheckoutAmount,verifyCheckoutSignature,verifyWebhookSignature,createRazorpayOrder,recordPayment,requireCapturedPayment,findCapturedPayment} from '../server/payments.mjs';

export default async function handler(req,res){
 try{
  const q=new URL(req.url,'https://findmyinvite.com').searchParams;
  const action=q.get('action')||'config';
  if(action==='config'){
   method(req,['GET']);
   return respond(res,200,{
    configured:paymentsConfigured(),
    keyId:paymentsConfigured()?publicKeyId():'',
    prices:{classic:1199,royal:1499},
    skus:Object.fromEntries(Object.entries(PAYMENT_SKUS).map(([id,sku])=>[id,{amount:sku.amount,label:sku.label}]))
   });
  }
  if(action==='webhook'){
   method(req,['POST']);
   const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
   verifyWebhookSignature(raw,req.headers['x-razorpay-signature']);
   const event=typeof req.body==='string'?JSON.parse(req.body):req.body;
   const entity=event?.payload?.payment?.entity||event?.payload?.order?.entity||{};
   const orderId=entity.order_id||entity.id;
   if(orderId&&entity.status==='captured'){
    await recordPayment({
     razorpay_order_id:orderId,
     razorpay_payment_id:entity.id||null,
     status:'captured',
     amount:Number(entity.amount)||0,
     currency:entity.currency||'INR',
     slug:entity.notes?.slug||null,
     sku:entity.notes?.sku||null,
     host:entity.notes?.host||null
    });
   }
   return respond(res,200,{ok:true});
  }
  if(action==='resume'){
   method(req,['POST']);
   await rate(req,'pay-resume',30,3600);
   const body=await bodyJson(req);
   const slug=slugValue(body.slug);
   const paymentId=typeof body.paymentId==='string'&&body.paymentId?body.paymentId:undefined;
   let row=paymentId?await findCapturedPayment({slug,paymentId}):null;
   if(row&&row.slug&&row.slug!==slug)row=null;
   if(!row)row=await findCapturedPayment({slug});
   if(!row)return respond(res,200,{captured:false,slug});
   return respond(res,200,{captured:true,paymentId:row.razorpay_payment_id||'',slug});
  }
  const token=bearer(req);
  const user=token&&!isManagementToken(token)?await authUser(token).catch(()=>null):null;
  if(action==='order'){
   method(req,['POST']);
   if(!paymentsConfigured())throw new HttpError(503,'Payments are not configured yet.');
   await rate(req,'pay',20,3600);
   const body=await bodyJson(req);
   const host=user?.id||null;
   let amount,currency='INR',receipt,sku=null,slug=null,label='FindMyInvite',notes={host,kind:'checkout'};
   if(body.sku){
    sku=skuValue(body.sku);
    slug=slugValue(body.slug);
    const plan=PAYMENT_SKUS[sku];
    amount=assertCheckoutAmount(plan.amount);
    receipt=String(body.receipt||('fmi-'+slug)).slice(0,40);
    label=plan.label;
    notes={slug,sku,host,kind:'website-create'};
   }else{
    amount=assertCheckoutAmount(body.amount);
    currency=typeof body.currency==='string'&&body.currency?body.currency:'INR';
    receipt=String(body.receipt||('fmi-'+Date.now())).slice(0,40);
   }
   const order=await createRazorpayOrder({amount,currency,receipt,notes});
   if(sku){
    await recordPayment({
     razorpay_order_id:order.id,
     status:'created',
     amount,
     currency,
     sku,
     slug,
     host
    });
   }
   return respond(res,201,{
    keyId:publicKeyId(),
    order_id:order.id,
    orderId:order.id,
    amount:order.amount||amount,
    currency:order.currency||currency,
    label,
    slug
   });
  }
  if(action==='verify'){
   method(req,['POST']);
   const body=await bodyJson(req);
   verifyCheckoutSignature({orderId:body.razorpay_order_id,paymentId:body.razorpay_payment_id,signature:body.razorpay_signature});
   const slug=typeof body.slug==='string'&&body.slug?slugValue(body.slug):null;
   const saved=await recordPayment({
    razorpay_order_id:body.razorpay_order_id,
    razorpay_payment_id:body.razorpay_payment_id,
    status:'captured',
    amount:PAYMENT_SKUS[body.sku]?PAYMENT_SKUS[body.sku].amount:0,
    currency:'INR',
    sku:body.sku||null,
    slug,
    host:user?.id||null
   });
   if(slug)await requireCapturedPayment({slug,paymentId:body.razorpay_payment_id});
   return respond(res,200,{ok:true,paymentId:saved.razorpay_payment_id,slug});
  }
  throw new HttpError(404,'Unknown action.');
 }catch(error){fail(res,error);}
}
