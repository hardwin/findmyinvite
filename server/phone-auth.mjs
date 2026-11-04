import {createHmac} from 'node:crypto';
import {normalisePhone} from '../shared/phone.mjs';
import {HttpError,db,rate,configured} from './core.mjs';
import {sessionFrom} from './auth-account.mjs';

export async function phoneRate(phone,scope,limit,seconds){
 if(!configured())throw new HttpError(503,'SMS sign-in is not configured yet. Your invitation is safe.');
 const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET).update(scope+':'+phone).digest('hex');
 const ok=await db('rpc/consume_rate_limit',{method:'POST',body:{p_key:key,p_limit:limit,p_seconds:seconds}});
 if(ok!==true)throw new HttpError(429,'Too many attempts. Please wait before trying again.');
}

export async function phoneAuth(req,action,body){
 let phone;try{phone=normalisePhone(body.phone);}catch(e){throw new HttpError(400,e.message);}
 const sending=action==='sms-send';
 if(!sending&&!/^\d{6}$/.test(String(body.token||'')))throw new HttpError(400,'Enter the 6-digit code from your SMS.');
 if(!configured()||!process.env.SUPABASE_ANON_KEY)throw new HttpError(503,'SMS sign-in is not configured yet. Your invitation is safe.');
 await rate(req,sending?'sms-send':'sms-verify',sending?10:30,3600);
 await phoneRate(phone,sending?'sms-phone-send':'sms-phone-verify',sending?5:10,3600);
 if(sending)await phoneRate(phone,'sms-phone-cooldown',1,60);
 const key=process.env.SUPABASE_ANON_KEY;
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/auth/v1/'+(sending?'otp':'verify'),{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify(sending?{phone,channel:'sms',create_user:true}:{phone,token:body.token,type:'sms'}),signal:AbortSignal.timeout(15000)
 });
 const payload=await response.json().catch(()=>({}));
 if(!response.ok){
  if(response.status===429)throw new HttpError(429,'Please wait before requesting or trying another code.');
  if(!sending&&['otp_expired','otp_disabled','validation_failed'].includes(payload.code))throw new HttpError(400,'That code is incorrect or expired. Try again or request a new code.');
  throw new HttpError(sending?503:400,sending?'Could not send your SMS. Please try again shortly.':'That code could not be verified. Try again or request a new code.');
 }
 return sending?{sent:true,phone,retryAfter:60}:sessionFrom(payload);
}
