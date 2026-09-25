import {respond,fail,method,bodyJson,rate,authUser,bearer,HttpError} from '../server/core.mjs';
import {credentials,sessionFrom,goTrue,authError} from '../server/auth-account.mjs';

const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readGoTrue(response){
 const raw=await response.text();
 let payload=null;
 try{payload=raw?JSON.parse(raw):null;}catch{payload=null;}
 if(!response.ok)authError(response.status,payload||{});
 return payload;
}

function siteOrigin(req){
 const proto=req.headers['x-forwarded-proto'];
 const host=req.headers['x-forwarded-host']||req.headers.host;
 if(proto&&host)return String(proto).split(',')[0].trim()+'://'+String(host).split(',')[0].trim();
 return process.env.SITE_ORIGIN||'https://findmyinvite.com';
}

/** Prefer public signup (+ email confirm) when SMTP is ready; else admin create + auto-confirm. */
function emailConfirmRequired(env=process.env){
 return env.MANAGER_EMAIL_CONFIRM==='1'||env.MANAGER_EMAIL_CONFIRM==='true'||Boolean(env.SUPABASE_ANON_KEY&&env.AUTH_SMTP_READY==='1');
}

export default async function handler(req,res){
 try{
  const action=new URL(req.url,'https://findmyinvite.com').searchParams.get('action')||'';

  if(action==='signup'){
   method(req,['POST']);
   const body=credentials(await bodyJson(req,2048));
   await rate(req,'signup',10,3600);
   const origin=siteOrigin(req);
   if(emailConfirmRequired()){
    const anon=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
    const created=await fetch(String(process.env.SUPABASE_URL||'').replace(/\/$/,'')+'/auth/v1/signup',{
     method:'POST',
     headers:{apikey:anon,Authorization:'Bearer '+anon,'Content-Type':'application/json'},
     body:JSON.stringify({
      email:body.email,
      password:body.password,
      email_redirect_to:origin+'/manager/login'
     })
    });
    const payload=await readGoTrue(created);
    if(payload?.access_token)return respond(res,201,sessionFrom(payload));
    return respond(res,201,{
     needs_confirmation:true,
     user:payload?.user?{id:payload.user.id,email:payload.user.email}: {email:body.email},
     message:'Check your email to confirm the account, then sign in.'
    });
   }
   const created=await goTrue('/admin/users',{method:'POST',body:JSON.stringify({email:body.email,password:body.password,email_confirm:true})});
   await readGoTrue(created);
   const session=await goTrue('/token?grant_type=password',{method:'POST',body:JSON.stringify({email:body.email,password:body.password})});
   return respond(res,201,sessionFrom(await readGoTrue(session)));
  }

  if(action==='signin'){
   method(req,['POST']);
   const body=credentials(await bodyJson(req,2048));
   await rate(req,'signin',20,3600);
   const session=await goTrue('/token?grant_type=password',{method:'POST',body:JSON.stringify({email:body.email,password:body.password})});
   return respond(res,200,sessionFrom(await readGoTrue(session)));
  }

  if(action==='recover'){
   method(req,['POST']);
   const body=await bodyJson(req,2048);
   const email=String(body.email||'').trim().toLowerCase();
   if(!emailOk.test(email)||email.length>254)throw new HttpError(400,'Enter a valid email address.');
   await rate(req,'recover',8,3600);
   const origin=siteOrigin(req);
   // Always 200 — do not reveal whether the email exists.
   const anon=process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
   await fetch(String(process.env.SUPABASE_URL||'').replace(/\/$/,'')+'/auth/v1/recover',{
    method:'POST',
    headers:{apikey:anon,Authorization:'Bearer '+anon,'Content-Type':'application/json'},
    body:JSON.stringify({email,redirect_to:origin+'/manager/login'})
   }).catch(()=>null);
   return respond(res,200,{ok:true,message:'If that email is registered, a reset link is on the way.'});
  }

  if(action==='refresh'){
   method(req,['POST']);
   const body=await bodyJson(req,4096);
   if(typeof body.refresh_token!=='string'||body.refresh_token.length<10)throw new HttpError(400,'Sign in to continue.');
   const session=await goTrue('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:body.refresh_token})});
   return respond(res,200,sessionFrom(await readGoTrue(session)));
  }

  if(action==='me'){
   method(req,['GET']);
   const user=await authUser(bearer(req));
   if(!user)throw new HttpError(401,'Sign in to continue.');
   return respond(res,200,{user});
  }

  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
