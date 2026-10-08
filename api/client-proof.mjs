import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {HttpError,bodyJson,respond,fail,method,rate} from '../server/core.mjs';
import {requireManager} from '../server/manager-auth.mjs';
import {clientDecide,clientProof,createJob,jobDetail,jobIdValue,listJobs,loadJob,rotateLink,sendForApproval,setStatus,streamClientStill,streamStill,uploadStill} from '../server/client-proofs.mjs';

function originOf(req){
 if(process.env.SITE_ORIGIN)return process.env.SITE_ORIGIN;
 const host=req.headers?.['x-forwarded-host']||req.headers?.host||'findmyinvite.com';
 const proto=req.headers?.['x-forwarded-proto']||(String(host).startsWith('localhost')||String(host).startsWith('127.')?'http':'https');
 return proto+'://'+host;
}

async function sendImage(res,blob){
 res.setHeader('Content-Type',blob.contentType||'image/jpeg');
 res.setHeader('Cache-Control','private, max-age=300');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Content-Disposition','inline');
 await pipeline(blob.stream instanceof ReadableStream?Readable.fromWeb(blob.stream):blob.stream,res);
}

export default async function handler(req,res){
 try{
  const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'';
  const origin=originOf(req);
  if(action==='proof'){method(req,['GET']);await rate(req,'proof-view',120,600);return respond(res,200,await clientProof(q.get('token')));}
  if(action==='proof-image'){method(req,['GET']);await rate(req,'proof-image',600,600);return await sendImage(res,await streamClientStill(q.get('token'),q.get('scene'),q.get('v')));}
  if(action==='decide'){method(req,['POST']);await rate(req,'proof-decide',30,600);return respond(res,200,await clientDecide(q.get('token'),await bodyJson(req,65536)));}

  const gate=await requireManager(req);
  const id=q.get('id');
  if(action==='list'){method(req,['GET']);return respond(res,200,await listJobs(gate,origin));}
  if(action==='create'){method(req,['POST']);await rate(req,'proof-create',60,3600);return respond(res,201,{job:await createJob(gate,await bodyJson(req,8192),origin)});}
  if(action==='job'){method(req,['GET']);return respond(res,200,await jobDetail(gate,id,origin));}
  if(action==='still'){method(req,['POST']);await rate(req,'proof-upload',400,3600);return respond(res,200,await uploadStill(gate,id,q.get('scene'),await bodyJson(req,3*1048576)));}
  if(action==='send'){method(req,['POST']);return respond(res,200,{job:await sendForApproval(gate,id,origin)});}
  if(action==='status'){method(req,['POST']);return respond(res,200,{job:await setStatus(gate,id,await bodyJson(req,4096),origin)});}
  if(action==='rotate'){method(req,['POST']);return respond(res,200,{job:await rotateLink(gate,id,origin)});}
  if(action==='image'){
   method(req,['GET']);
   await loadJob(gate,id);
   return await sendImage(res,await streamStill(jobIdValue(id),q.get('scene'),q.get('v')));
  }
  throw new HttpError(404,'Unknown action.');
 }catch(error){if(!res.headersSent)fail(res,error);else res.destroy();}
}

