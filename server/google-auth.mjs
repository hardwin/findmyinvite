import {HttpError,configured,rate} from './core.mjs';
import {sessionFrom} from './auth-account.mjs';

export function googleRedirectOrigin(value,env=process.env){
 let url;try{url=new URL(value);}catch{throw new HttpError(400,'Invalid sign-in origin.');}
 if(url.origin!==value||url.username||url.password)throw new HttpError(400,'Invalid sign-in origin.');
 const allowed=[env.SITE_ORIGIN||'https://findmyinvite.com',...(env.AUTH_REDIRECT_ORIGINS||'').split(',')].map(x=>x.trim());
 const local=!env.VERCEL&&env.NODE_ENV!=='production'&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(value);
 if(!allowed.includes(value)&&!local)throw new HttpError(400,'This address is not configured for Google sign-in.');
 return value;
}
export async function googleAuth(req,action,body){
 if(!configured()||!process.env.SUPABASE_ANON_KEY)throw new HttpError(503,'Google sign-in is not configured yet. Your invitation is saved on this browser.');
 const base=process.env.SUPABASE_URL.replace(/\/$/,''),headers={apikey:process.env.SUPABASE_ANON_KEY,'Content-Type':'application/json'};
 if(action==='google-start'){
  const origin=googleRedirectOrigin(body.origin);
  if(!/^[A-Za-z0-9_-]{43}$/.test(body.challenge||'')||!/^[a-f0-9]{64}$/.test(body.flow||''))throw new HttpError(400,'Invalid sign-in request.');
  await rate(req,'google-start',30,3600);
  const response=await fetch(base+'/auth/v1/settings',{headers,signal:AbortSignal.timeout(10000)});
  const settings=await response.json().catch(()=>({}));
  if(!response.ok||settings.external?.google!==true)throw new HttpError(503,'Google sign-in is not configured yet. Your invitation is saved on this browser.');
  const url=new URL(base+'/auth/v1/authorize');
  url.search=new URLSearchParams({provider:'google',redirect_to:origin+'/auth/callback?flow='+body.flow,code_challenge:body.challenge,code_challenge_method:'s256',prompt:'select_account'}).toString();
  return {url:url.href};
 }
 if(typeof body.code!=='string'||!body.code||body.code.length>2048||!/^[-._~A-Za-z0-9]{43,128}$/.test(body.verifier||''))throw new HttpError(400,'Invalid Google sign-in response. Please try again.');
 await rate(req,'google-exchange',30,3600);
 const response=await fetch(base+'/auth/v1/token?grant_type=pkce',{method:'POST',headers,body:JSON.stringify({auth_code:body.code,code_verifier:body.verifier}),signal:AbortSignal.timeout(15000)});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new HttpError(400,'Google sign-in expired or could not be completed. Please try again.');
 return sessionFrom(payload);
}
