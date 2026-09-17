import {del,head} from '@vercel/blob';
import {HttpError,promotion,configured,slugValue,tokenHash,verifyToken,validateData,validateRsvp,db,bodyJson,bearer,invitation,rate,respond,fail,method,authUser,hostId,publicData,isManagementToken} from '../server/core.mjs';
async function availableTemplate(id){const rows=await db('template_catalog?id=eq.'+encodeURIComponent(id)+'&published=eq.true&select=id&limit=1');if(!rows.length)throw new HttpError(403,'This design is not currently available for publishing.');}
const view=row=>({invitation:{...publicData(row.data),id:row.slug},slug:row.slug,published:row.published,expiresAt:row.expires_at,createdAt:row.created_at});
function withHost(data,host){return host?{...data,_host:host}:data;}
export default async function handler(req,res){try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams;const action=q.get('action')||'read';
 if(action==='config'){method(req,['GET']);return respond(res,200,{configured:configured(),serverNow:new Date().toISOString(),promotion:promotion(),prices:{classic:1199,royal:1499},uploadsConfigured:Boolean(process.env.BLOB_READ_WRITE_TOKEN),auth:true});}
 if(action==='mine'){
  method(req,['GET']);
  const user=await authUser(bearer(req));
  if(!user)throw new HttpError(401,'Sign in to continue.');
  const rows=await db('invitations?data->>_host=eq.'+encodeURIComponent(user.id)+'&select=slug,published,expires_at,created_at,data&order=created_at.desc&limit=50')||[];
  return respond(res,200,{invitations:rows.map(view)});
 }
 if(action==='create'){
  method(req,['POST']);
  const user=await authUser(bearer(req));
  if(!user)throw new HttpError(401,'Sign in to save or publish.');
  const body=await bodyJson(req);const slug=slugValue(body.slug),management_hash=tokenHash(body.managementToken);
  const previous=await db('invitations?slug=eq.'+encodeURIComponent(slug)+'&select=*&limit=1');
  if(previous.length){
   if(hostId(previous[0].data)===user.id)return respond(res,200,view(previous[0]));
   try{verifyToken(body.managementToken,previous[0].management_hash);}catch{throw new HttpError(409,'This address is already in use.');}
   return respond(res,200,view(previous[0]));
  }
  if(!promotion().active)throw new HttpError(403,'Free creation is available during the launch offer.');
  await rate(req,'create',10,3600);
  const valid=validateData(body.data,slug);
  await availableTemplate(valid.data.template);
  if(valid.data.photos.some(p=>p.startsWith('/api/media')))throw new HttpError(400,'Create the draft before uploading its photos.');
  if(Date.parse(valid.expires_at)<=Date.now())throw new HttpError(400,'Choose an upcoming event.');
  let rows;
  try{rows=await db('invitations',{method:'POST',headers:{Prefer:'return=representation'},body:{slug,management_hash,data:withHost(valid.data,user.id),expires_at:valid.expires_at,published:false}});}
  catch(error){
   if(error.status!==409)throw error;
   const existing=await db('invitations?slug=eq.'+encodeURIComponent(slug)+'&select=*&limit=1');
   if(!existing.length)throw error;
   if(hostId(existing[0].data)===user.id||existing[0].management_hash===management_hash)return respond(res,200,view(existing[0]));
   throw error;
  }
  return respond(res,201,view(rows[0]));
 }
 const slug=slugValue(q.get('slug'));
 if(action==='read'){method(req,['GET']);return respond(res,200,view(await invitation(slug)));}
 if(action==='rsvp'){
  method(req,['POST']);const row=await invitation(slug);await rate(req,'rsvp',30,3600);await rate(req,'rsvp:'+slug,10,3600);
  if(!row.data.sections.rsvp)throw new HttpError(403,'Responses are closed.');
  const valid=validateRsvp(await bodyJson(req));
  await db('responses',{method:'POST',headers:{Prefer:'return=minimal'},body:{invitation_id:row.id,...valid}});
  return respond(res,201,{ok:true});
 }
 const row=await invitation(slug,bearer(req));
 if(action==='manage'){method(req,['GET']);return respond(res,200,view(row));}
 if(action==='responses'){
  method(req,['GET']);
  const responses=await db('responses?invitation_id=eq.'+row.id+'&select=id,name,email,attendance,guests,message,created_at&order=created_at.desc&limit=1001');
  return respond(res,200,{hasMore:responses.length>1000,limit:1000,responses:responses.slice(0,1000).map(r=>({...r,invitationId:slug,createdAt:r.created_at}))});
 }
 if(action==='update'){
  method(req,['POST','PUT']);
  const body=await bodyJson(req);
  if(row.data.studioId){
   if(body.data!==undefined||typeof body.published!=='boolean')throw new HttpError(400,'Edit this invitation in Love Studio.');
   const rows=await db('invitations?id=eq.'+row.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:{published:body.published,updated_at:new Date().toISOString()}});
   return respond(res,200,view(rows[0]));
  }
  const valid=validateData(body.data,slug);
  if(valid.data.template!==row.data.template)await availableTemplate(valid.data.template);
  for(const photo of valid.data.photos.filter(p=>p.startsWith('/api/media'))){
   if(!process.env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'Photo storage is unavailable.');
   const slot=new URL(photo,'https://findmyinvite.com').searchParams.get('slot');
   try{await head('invitations/'+row.id+'/'+slot);}catch{throw new HttpError(400,'A photo is missing. Upload it again before saving.');}
  }
  if(body.published!==undefined&&typeof body.published!=='boolean')throw new HttpError(400,'Invalid publication status.');
  let host=hostId(row.data);
  if(!host&&!isManagementToken(bearer(req))){const user=await authUser(bearer(req));if(user)host=user.id;}
  const rows=await db('invitations?id=eq.'+row.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:{data:withHost(valid.data,host),expires_at:valid.expires_at,published:body.published??row.published,updated_at:new Date().toISOString()}});
  return respond(res,200,view(rows[0]));
 }
 if(action==='delete'){
  method(req,['DELETE']);
  if(process.env.BLOB_READ_WRITE_TOKEN)await del([0,1,2,3].map(slot=>'invitations/'+row.id+'/'+slot));
  await db('invitations?id=eq.'+row.id,{method:'DELETE',headers:{Prefer:'return=minimal'}});
  return respond(res,200,{ok:true});
 }
 throw new HttpError(404,'Unknown action.');
}catch(error){fail(res,error);}}
