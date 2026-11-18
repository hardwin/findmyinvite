import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {get,save,isLocal} from './store.mjs';
import {hashToken,session,sameOrigin} from './auth.mjs';
import {parse} from './contracts.mjs';
import {db,HttpError} from '../core.mjs';
export const eventSchema=z.object({id:z.string().uuid(),session:z.string().uuid(),type:z.enum(['template_selected','preview','form_start','form_progress','checkout','error']),templateId:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),language:z.enum(['en','ta','te','kn','hi','ml']).default('en'),step:z.number().int().min(0).max(100).optional(),device:z.enum(['mobile','tablet','desktop']),attribution:z.object({source:z.string().regex(/^[a-zA-Z0-9 _.-]{1,100}$/),medium:z.string().regex(/^[a-zA-Z0-9 _.-]{0,100}$/),campaign:z.string().regex(/^[a-zA-Z0-9 _.-]{0,100}$/),at:z.string().datetime()}).optional()}).strict();
export async function limitBucket(id,limit=200){const now=Date.now(),key=hashToken(id),old=await get('api-limit',key),count=old&&now-old.start<60000?old.count:0;if(count>=limit)throw new HttpError(429,'Reporting rate exceeded. Retry in one minute.');await save('api-limit',key,{start:count?old.start:now,count:count+1},old?.revision||0,'system','rate.consume');}
async function limitProductEvents(key,limit){
 if(isLocal())return limitBucket(key,limit);
 const allowed=await db('rpc/consume_rate_limit',{method:'POST',body:{p_key:hashToken('product-event:'+key),p_limit:limit,p_seconds:60}});
 if(!allowed)throw new HttpError(429,'Reporting rate exceeded. Retry in one minute.');
}
async function customerEvent(req,input){
 sameOrigin(req);
 if(await session(req))return null;
 const event=parse(eventSchema,input);
 if(event.attribution&&(Date.parse(event.attribution.at)<Date.now()-30*86400000||Date.parse(event.attribution.at)>Date.now()+60000))delete event.attribution;
 return event;
}
async function storeProductEvent(req,event,at){
 await limitProductEvents('ip:'+hashToken(String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'local')),300);
 await limitProductEvents('visitor:'+event.session,60);
 const old=await get('product-event',event.id);
 if(old)return {accepted:true,duplicate:true};
 try{await save('product-event',event.id,{...event,at},0,'customer','journey.event');}
 catch(error){
  if(error.status===409&&await get('product-event',event.id))return {accepted:true,duplicate:true};
  throw error;
 }
 return {accepted:true};
}
export async function collectEvent(req,input){
 const at=new Date().toISOString(),event=await customerEvent(req,input);
 return event?storeProductEvent(req,event,at):{accepted:false,reason:'owner activity excluded'};
}

// Webhook-only captures can inherit a single observed checkout session. When two
// sessions open one payable order, only its verified widget callback resolves which paid.
async function linkVideoSession(orderId,event,confirmed){
 const context={session:event.session,attribution:event.attribution||null,language:event.language,device:event.device,at:new Date().toISOString(),confirmed};
 for(let attempt=0;attempt<3;attempt++){
  const old=await get('order-context',orderId);
  if(old?.confirmed||(!confirmed&&old&&(old.session===event.session||!old.session)))return;
  const next=old&&!confirmed?{session:null,at:context.at,confirmed:false}:context;
  try{await save('order-context',orderId,next,old?.revision||0,'customer','checkout.attributed');return;}
  catch(error){if(error.status!==409||attempt===2)throw error;}
 }
}
export async function recordVideoCheckout(req,action,purchase,input,templateId){
 if(!input||!purchase.invitationId)return;
 const confirmed=action==='payment-verify'&&purchase.status==='captured';
 const payable=action==='payment-order'&&purchase.status==='pending'&&purchase.orderId;
 if(!payable&&!confirmed)return;
 const at=new Date().toISOString(),event=await customerEvent(req,{...input,type:'checkout',templateId});
 if(!event)return;
 if(payable)await storeProductEvent(req,event,at);
 await linkVideoSession(purchase.invitationId,event,confirmed);
}
export async function attachOrderContext(orderId,input,templateId){try{if(!input||await get('order-context',orderId))return;const event=parse(eventSchema,{...input,id:input.id||randomUUID(),type:'checkout',templateId});await save('order-context',orderId,{session:event.session,attribution:event.attribution||null,language:event.language,device:event.device,at:new Date().toISOString()},0,'customer','checkout.attributed');}catch{/* Reporting must never interrupt checkout. */}}
