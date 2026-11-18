import {loadRazorpay} from '../payments';
import {analyticsContext} from '../product-analytics';
import {videoRequest as templateApi} from './request';
export type VideoPurchase={invitationId?:string;unlocked:boolean;status:string;amount:number;currency:string;discount:number;configured:boolean;quote?:{basePaise:number;taxBps:number;taxPaise:number;totalPaise:number;taxLabel:string}|null};
const API='/api/video-personalise?action=payment-';
export function videoPurchase(invitationId:string,templateId:string){return templateApi<VideoPurchase>(API+'status&invitationId='+encodeURIComponent(invitationId)+'&templateId='+encodeURIComponent(templateId));}
export function applyVideoPromo(invitationId:string,templateId:string,code:string){return templateApi<VideoPurchase>(API+'promo',{invitationId,templateId,code});}
export async function checkoutVideo(invitationId:string,templateId:string){
 const analytics=analyticsContext();
 const order=await templateApi<VideoPurchase&{keyId:string;orderId:string}>(API+'order',{invitationId,templateId,analytics});
 if(order.unlocked)return order;
 await loadRazorpay();
 return new Promise<VideoPurchase>((resolve,reject)=>{
  let verifying=false,finished=false;
  const fail=(message:string)=>{if(!finished){finished=true;reject(Error(message));}};
  const widget=new window.Razorpay!({key:order.keyId,order_id:order.orderId,amount:order.amount,currency:order.currency,name:'FindMyInvite',description:'Wedding invitation video · edits included',
   handler:async(response:Record<string,string>)=>{verifying=true;try{const result=await templateApi<VideoPurchase>(API+'verify',{...response,invitationId,templateId,analytics});finished=true;resolve(result);}catch{try{const recovered=await videoPurchase(invitationId,templateId);if(recovered.unlocked){finished=true;resolve(recovered);return;}}catch{}fail('Payment is still being confirmed. Please return to this invitation in a moment.');}},
   modal:{ondismiss:()=>{if(!verifying)fail('Checkout closed. Your details are saved. You can continue whenever you are ready.');}}
  });
  // Razorpay lets customers retry failures inside checkout; dismissal or verified success ends this attempt.
  widget.open();
 });
}
