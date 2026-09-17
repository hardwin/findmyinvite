import {db,respond,fail,method,HttpError,bodyJson,rate,configured} from '../server/core.mjs';
import {passwordOk,issueSession,cookieHeader,sessionOk,wantsSecure} from '../server/akay-gate.mjs';
import {summarize} from '../server/akay-insights.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function cleanPath(value){
 if(typeof value!=='string')throw new HttpError(400,'Invalid path.');
 const path=value.split('?')[0].split('#')[0];
 if(!path.startsWith('/')||path.includes('..')||path.length>200||/[\u0000-\u001f]/.test(path))throw new HttpError(400,'Invalid path.');
 return path.length>1&&path.endsWith('/')?path.slice(0,-1):path;
}
function collectBody(body){
 const path=cleanPath(body.path);
 if(path==='/akay'||path.startsWith('/akay/'))return null;
 const type=body.type;
 if(!['pageview','heartbeat','leave'].includes(type))throw new HttpError(400,'Unknown event.');
 const dwell=Number(body.dwell||0);
 if(!Number.isInteger(dwell)||dwell<0||dwell>3600000)throw new HttpError(400,'Invalid dwell.');
 const session=String(body.session||''),visitor=String(body.visitor||'');
 if(!uuid.test(session)||!uuid.test(visitor))throw new HttpError(400,'Invalid session.');
 const viewport=typeof body.viewport==='string'&&/^\d{2,5}x\d{2,5}$/.test(body.viewport)?body.viewport:'';
 let referrer='';
 if(typeof body.referrer==='string'&&body.referrer.length<=300&&!/[\u0000-\u001f]/.test(body.referrer)){
  try{const url=new URL(body.referrer);referrer=(url.origin+url.pathname).slice(0,300);}catch{referrer=body.referrer.startsWith('/')?body.referrer.slice(0,300):'';}
 }
 return {occurred_at:new Date().toISOString(),session_id:session.toLowerCase(),visitor_id:visitor.toLowerCase(),path,event_type:type,dwell_ms:dwell,referrer,viewport};
}
export default async function handler(req,res){
 try{
  const action=new URL(req.url,'https://findmyinvite.com').searchParams.get('action')||'';
  if(action==='collect'){
   method(req,['POST']);
   const row=collectBody(await bodyJson(req,4096));
   if(!row)return respond(res,202,{ok:true});
   if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
   await rate(req,'analytics',120,3600);
   await db('analytics_events',{method:'POST',body:row,headers:{Prefer:'return=minimal'}});
   return respond(res,202,{ok:true});
  }
  if(action==='gate'){
   method(req,['POST']);
   const body=await bodyJson(req,1024);
   if(configured())await rate(req,'akay-gate',20,3600);
   if(!passwordOk(body.gate))throw new HttpError(401,'That access code is not accepted.');
   res.setHeader('Set-Cookie',cookieHeader(issueSession(),wantsSecure(req)));
   return respond(res,200,{ok:true});
  }
  if(action==='leave-gate'){
   method(req,['POST']);
   res.setHeader('Set-Cookie',cookieHeader('',wantsSecure(req),true));
   return respond(res,200,{ok:true});
  }
  if(action==='insights'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
   const days=Math.min(30,Math.max(1,Number(new URL(req.url,'https://findmyinvite.com').searchParams.get('days')||7)||7));
   const since=new Date(Date.now()-days*86400000).toISOString();
   const rows=await db('analytics_events?select=occurred_at,session_id,visitor_id,path,event_type,dwell_ms,referrer,viewport&occurred_at=gte.'+encodeURIComponent(since)+'&order=occurred_at.asc&limit=8000');
   return respond(res,200,{days,since,insights:summarize(rows)});
  }
  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
