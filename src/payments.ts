import {readSession} from './auth-session';
import {skuFor} from './shop';

export type CheckoutOrder={keyId:string;order_id:string;orderId:string;amount:number;currency:string;label:string;slug:string};

type RazorpayCheckout={
 open:()=>void;
 on:(event:string,handler:(response:{error?:{description?:string}})=>void)=>void;
};

declare global {
 interface Window {
  Razorpay?:new (options:Record<string,unknown>)=>RazorpayCheckout;
 }
}

function publicKeyId(order?:{keyId?:string}){
 return order?.keyId||import.meta.env.VITE_RAZORPAY_KEY_ID||'';
}

async function payApi<T>(path:string,body?:unknown):Promise<T>{
 const session=readSession();
 const response=await fetch(path,{
  method:body?'POST':'GET',
  headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?.access_token?{Authorization:'Bearer '+session.access_token}:{})},
  body:body?JSON.stringify(body):undefined,
  cache:'no-store'
 });
 let value;try{value=await response.json()}catch{throw new Error('Payments are not configured on this preview.');}
 if(!response.ok)throw new Error(value.error||'Payment could not be completed. Please try again.');
 return value;
}

export function loadRazorpay():Promise<void>{
 if(window.Razorpay)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if(existing){existing.addEventListener('load',()=>resolve());existing.addEventListener('error',()=>reject(new Error('Could not open payment.')));return;}
  const script=document.createElement('script');
  script.src='https://checkout.razorpay.com/v1/checkout.js';
  script.onload=()=>resolve();
  script.onerror=()=>reject(new Error('Could not open payment.'));
  document.head.appendChild(script);
 });
}

export async function startWebsiteCheckout(opts:{slug:string;template:{royal?:boolean;tier?:string;video?:string;[key:string]:unknown};prefillName?:string}):Promise<{paymentId:string;slug:string}>{
 const sku=skuFor(opts.template);
 const order=await payApi<CheckoutOrder>('/api/create-order',{sku,slug:opts.slug});
 const key=publicKeyId(order);
 if(!key)throw new Error('Payments are not configured yet.');
 await loadRazorpay();
 const Razorpay=window.Razorpay;
 if(!Razorpay)throw new Error('Could not open payment.');
 const orderId=order.order_id||order.orderId;
 return new Promise((resolve,reject)=>{
  const checkout=new Razorpay({
   key,
   amount:order.amount,
   currency:order.currency,
   name:'FindMyInvite',
   description:order.label,
   order_id:orderId,
   prefill:{name:opts.prefillName||'',email:readSession()?.user.email||''},
   notes:{slug:opts.slug,sku},
   theme:{color:'#9a6b2f'},
   handler:async(response:{razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string})=>{
    try{
     const verified=await payApi<{paymentId:string;slug:string}>('/api/verify-payment',{
      slug:opts.slug,
      sku,
      razorpay_order_id:response.razorpay_order_id,
      razorpay_payment_id:response.razorpay_payment_id,
      razorpay_signature:response.razorpay_signature
     });
     resolve({paymentId:verified.paymentId,slug:verified.slug});
    }catch(error){reject(error);}
   },
   modal:{ondismiss:()=>reject(new Error('Payment was cancelled.'))}
  });
  checkout.on('payment.failed',response=>{
   reject(new Error(response?.error?.description||'Payment failed. Please try again.'));
  });
  checkout.open();
 });
}
