import {respond,fail,method,bodyJson,rate,authUser,bearer,HttpError} from '../server/core.mjs';
import {credentials,sessionFrom,goTrue,authError} from '../server/auth-account.mjs';
async function readGoTrue(response){
 const raw=await response.text();
 let payload=null;
 try{payload=raw?JSON.parse(raw):null;}catch{payload=null;}
 if(!response.ok)authError(response.status,payload||{});
 return payload;
}
export default async function handler(req,res){
 try{
  const action=new URL(req.url,'https://findmyinvite.com').searchParams.get('action')||'';
  if(action==='signup'){
   method(req,['POST']);
   const body=credentials(await bodyJson(req,2048));
   await rate(req,'signup',10,3600);
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
