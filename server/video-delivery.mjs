import {createHmac,timingSafeEqual} from 'node:crypto';
import {BlobNotFoundError,getDownloadUrl,head} from '@vercel/blob';
import {HttpError} from './core.mjs';
import {videoDownloadTicket} from './video-download-ticket.mjs';

const uuid='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const resultPattern=new RegExp('^results/('+uuid+')/([a-f0-9]{64})/('+uuid+')\\.mp4$');
const unavailable=()=>new HttpError(410,'This video is no longer available.');
function signature(path,key){
 if(!key||key.length<32)throw new HttpError(503,'Video delivery is temporarily unavailable.');
 return createHmac('sha256',key).update('fmi-video-delivery-v1\0'+path).digest('base64url');
}
export function deliveryLink(job,key=process.env.RATE_LIMIT_SECRET){
 if(job.status!=='ready'||!resultPattern.test(job.resultKey)||job.resultKey!==`results/${job.owner}/${job.id}/${job.attempt}.mp4`)throw new HttpError(409,'Your video is not ready to download.');
 const token=Buffer.from(job.resultKey).toString('base64url')+'.'+signature(job.resultKey,key);
 return {path:'/download/video#'+token};
}
export function deliveryResult(token,key=process.env.RATE_LIMIT_SECRET){
 if(typeof token!=='string'||!/^([A-Za-z0-9_-]{100,240})\.([A-Za-z0-9_-]{43})$/.test(token))throw unavailable();
 const [encoded,mac]=token.split('.'),path=Buffer.from(encoded,'base64url').toString();
 if(!resultPattern.test(path)||!timingSafeEqual(Buffer.from(signature(path,key)),Buffer.from(mac)))throw unavailable();
 return path;
}
export async function deliverVideo(req,res,store,action,token){
 const key=deliveryResult(token);
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Referrer-Policy','no-referrer');
 let localBytes;
 try{
  if(store.local)localBytes=await store.bytes(key);
  else await head(store.prefix+key);
 }catch(e){
  if(e.code==='ENOENT'||e instanceof BlobNotFoundError||e.status===404||e.statusCode===404)throw unavailable();
  throw e;
 }
 if(action==='delivery-check')return res.status(200).json({ready:true});
 if(store.local){res.setHeader('Content-Type','video/mp4');res.setHeader('Content-Disposition','attachment; filename="invitation.mp4"');return res.end(localBytes);}
 const signed=await videoDownloadTicket(store.prefix+key);
 res.setHeader('Location',getDownloadUrl(signed.url));res.statusCode=303;res.end();
}
