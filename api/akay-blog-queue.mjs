import {respond,fail,method,bodyJson,rate,HttpError,bearer} from '../server/core.mjs';
import {sessionOk} from '../server/akay-gate.mjs';
import {parseListQuery,cleanId,decideStatus,listTopics,decideTopic,runPulse,runManualPulse} from '../server/akay-blog-queue.mjs';
import {timingSafeEqual} from 'node:crypto';

function cronAuthorized(req){
 const expected=String(process.env.BLOG_PULSE_CRON_SECRET||process.env.CRON_SECRET||'');
 if(!expected)return false;
 const provided=bearer(req);
 if(!provided||provided.length!==expected.length){
  timingSafeEqual(Buffer.from(expected),Buffer.from(expected));
  return false;
 }
 try{return timingSafeEqual(Buffer.from(provided),Buffer.from(expected));}
 catch{return false;}
}

export default async function handler(req,res){
 try{
  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'list';

  if(action==='pulse'){
   method(req,['GET','POST']);
   if(!cronAuthorized(req))throw new HttpError(401,'Cron secret required.');
   const forceSlot=url.searchParams.get('slot')||undefined;
   return respond(res,200,await runPulse(forceSlot?{forceSlot}:{}));
  }

  if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');

  if(action==='list'){
   method(req,['GET']);
   return respond(res,200,await listTopics(parseListQuery(req.url)));
  }

  if(action==='run'){
   method(req,['POST']);
   await rate(req,'akay-blog-pulse-manual',3,3600);
   const body=await bodyJson(req,4096).catch(()=>({}));
   const force=body.force!==false;
   const forceSlot=typeof body.slot==='string'?body.slot:undefined;
   return respond(res,200,await runManualPulse({force,forceSlot}));
  }

  if(action==='decide'){
   method(req,['POST','PATCH']);
   await rate(req,'akay-blog-queue',60,3600);
   const body=await bodyJson(req,4096);
   return respond(res,200,await decideTopic(cleanId(body.id||url.searchParams.get('id')),decideStatus(body.status)));
  }

  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
