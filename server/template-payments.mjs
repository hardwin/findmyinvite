import {HttpError,db,method,respond,bodyJson,rate} from './core.mjs';
import {customer,owned,requireRecoverable,rpc,websiteOffer,audit} from './template-cms.mjs';
import {websiteQuote,validateContent} from '../shared/template-contract.mjs';
import {version} from './template-cms.mjs';
import {createRazorpayOrder,publicKeyId,paymentsConfigured,razorpayAuth,verifyCheckoutSignature} from './payments.mjs';
export async function settleWebsiteOrder(orderId,paymentId,recoveryId){
 let rows=await db('website_orders?razorpay_order_id=eq.'+encodeURIComponent(orderId)+'&select=*&limit=1');if(!rows[0]&&/^[a-f0-9-]{36}$/.test(recoveryId||''))rows=await db('website_orders?id=eq.'+recoveryId+'&razorpay_order_id=is.null&select=*&limit=1');if(!rows[0])return null;const row=rows[0];
 const r=await fetch('https://api.razorpay.com/v1/payments/'+encodeURIComponent(paymentId),{headers:{Authorization:razorpayAuth()}});if(!r.ok)throw new HttpError(502,'Could not verify captured payment. Retry safely.');const p=await r.json();
 if(p.order_id!==orderId||(row.razorpay_order_id&&p.order_id!==row.razorpay_order_id)||(!row.razorpay_order_id&&p.notes?.websiteOrderId!==row.id)||p.status!=='captured'||p.amount!==row.amount||p.currency!=='INR')throw new HttpError(402,'Payment has not been captured for this order.');
 if(row.razorpay_payment_id&&row.razorpay_payment_id!==paymentId)throw new HttpError(409,'This order already has a captured payment.');
 if(row.status==='refunded')throw new HttpError(409,'This payment was refunded.');
 const saved=await db('website_orders?id=eq.'+row.id+'&status=neq.refunded',{method:'PATCH',headers:{Prefer:'return=representation'},body:{status:'captured',razorpay_payment_id:p.id,razorpay_order_id:orderId}});if(!saved[0])throw new HttpError(409,'Payment state changed. Contact support.');return saved[0];
}
export default async function handle(req,res,q){const action=q.get('action');
 if(action==='v2-config'){method(req,['GET']);let quote=null;try{quote=await websiteOffer();}catch{}const configured=!!quote&&paymentsConfigured();return respond(res,200,{basePaise:19900,quote,configured,message:!quote?'Tax configuration is pending.':!configured?'Checkout is temporarily unavailable. You can still save and preview your invitation.':''});}
 const user=await customer(req);method(req,['POST']);const b=await bodyJson(req),row=await owned(b.slug,user);requireRecoverable(row);
 if(action==='v2-failure'){const orders=await db('website_orders?id=eq.'+encodeURIComponent(b.orderId)+'&owner_id=eq.'+user.id+'&invitation_id=eq.'+row.id+'&select=id');if(!orders[0])throw new HttpError(404,'Order not found.');await audit(user,'payment.failed',orders[0].id,{operation:'checkout'});return respond(res,200,{ok:true});}
 if(action==='v2-order'){
 await rate(req,'website-order',10,3600);if(!paymentsConfigured())throw new HttpError(503,'Checkout is not configured.');let quote;try{quote=await websiteOffer();}catch(e){throw new HttpError(503,e.message);}
 const purpose=b.purpose==='renew'?'renew':'publish';if(purpose==='renew'&&!row.first_published_at||purpose==='publish'&&row.first_published_at)throw new HttpError(409,'Invalid order purpose.');
 const v=await version(row.template_version_id);try{validateContent(v.field_schema,row.draft_content,{complete:true});}catch(e){throw new HttpError(400,e.message);}
 const active=await db('template_catalog?id=eq.'+encodeURIComponent(v.template_id)+'&isactive=eq.true&select=id');if(!row.first_published_at&&(!active.length||!v.approved_at))throw new HttpError(403,'Template not released.');
 // An existing captured payment must be resumed rather than charged again.
 const existing=await db('website_orders?invitation_id=eq.'+row.id+'&purpose=eq.'+purpose+'&status=eq.captured&applied_at=is.null&select=*&limit=1');if(existing[0])return respond(res,200,{captured:true,id:existing[0].id});
 const reserved=await rpc('fmi_reserve_website_order',{p_invitation:row.id,p_owner:user.id,p_purpose:purpose,p_tax_bps:quote.taxBps});const order=reserved.order;
 if(order.status==='captured')return respond(res,200,{captured:true,id:order.id});
 if(order.razorpay_order_id)return respond(res,200,{id:order.id,keyId:publicKeyId(),orderId:order.razorpay_order_id,amount:order.amount,currency:'INR',quote:{basePaise:order.base_paise,taxBps:order.tax_bps,taxPaise:order.tax_paise,totalPaise:order.amount}});
 if(!reserved.created)throw new HttpError(409,'Your order is being prepared. Retry shortly. If this persists, contact support; do not make a second payment.');
 const gateway=await createRazorpayOrder({amount:order.amount,receipt:order.id,notes:{websiteOrderId:order.id}});await db('website_orders?id=eq.'+order.id,{method:'PATCH',body:{razorpay_order_id:gateway.id}});return respond(res,201,{id:order.id,keyId:publicKeyId(),orderId:gateway.id,amount:order.amount,currency:'INR',quote});
 }
 if(action==='v2-verify'){
 const rows=await db('website_orders?id=eq.'+encodeURIComponent(b.orderId)+'&owner_id=eq.'+user.id+'&invitation_id=eq.'+row.id+'&select=*&limit=1');if(!rows[0])throw new HttpError(404,'Order unavailable.');
 verifyCheckoutSignature({orderId:rows[0].razorpay_order_id,paymentId:b.razorpay_payment_id,signature:b.razorpay_signature});const settled=await settleWebsiteOrder(rows[0].razorpay_order_id,b.razorpay_payment_id);return respond(res,200,{id:settled.id,captured:true});
 }
 if(action==='v2-resume'){const rows=await db('website_orders?invitation_id=eq.'+row.id+'&owner_id=eq.'+user.id+'&status=eq.captured&applied_at=is.null&select=id,purpose&order=created_at.desc');return respond(res,200,{orders:rows});}
 throw new HttpError(404,'Unknown payment operation.');}
