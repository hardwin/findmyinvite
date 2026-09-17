import {HttpError,configured} from './core.mjs';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function credentials(body){
 const email=String(body?.email||'').trim().toLowerCase();
 const password=String(body?.password||'');
 if(!emailPattern.test(email)||email.length>254)throw new HttpError(400,'Enter a valid email address.');
 if(password.length<8||password.length>72)throw new HttpError(400,'Use a password of 8–72 characters.');
 return {email,password};
}
export function sessionFrom(token){
 if(!token||typeof token!=='object')throw new HttpError(401,'Sign in to continue.');
 if(typeof token.access_token!=='string'||!token.access_token)throw new HttpError(401,'Sign in to continue.');
 const user=token.user&&typeof token.user==='object'?token.user:{};
 return {
  access_token:token.access_token,
  refresh_token:typeof token.refresh_token==='string'?token.refresh_token:'',
  expires_in:Number(token.expires_in)||3600,
  user:{id:String(user.id||''),email:String(user.email||'')}
 };
}
export function goTrue(path,options={}){
 if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const headers={apikey:key,'Content-Type':'application/json',...options.headers};
 if(!headers.Authorization)headers.Authorization='Bearer '+key;
 return fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/auth/v1'+path,{...options,headers});
}
export function authError(status,payload){
 const message=typeof payload?.msg==='string'?payload.msg:typeof payload?.error_description==='string'?payload.error_description:typeof payload?.error==='string'?payload.error:'';
 if(/already registered|already been registered/i.test(message))throw new HttpError(409,'An account with this email already exists. Sign in instead.');
 if(/invalid login|invalid_grant|invalid credentials/i.test(message))throw new HttpError(401,'That email or password is not recognised.');
 if(/password/i.test(message)&&status===422)throw new HttpError(400,'Use a password of 8–72 characters.');
 throw new HttpError(status>=400&&status<500?status:401,message&&message.length<180?message:'Could not sign in. Please try again.');
}
