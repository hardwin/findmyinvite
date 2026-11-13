import {method,fail,HttpError} from '../server/core.mjs';
import {resolveShare} from '../server/share-details.mjs';
import {generatedShareImage} from '../server/share-image.mjs';
export default async function handler(req,res){try{
 method(req,['GET']);res.setHeader('Cache-Control','no-store');
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,share=await resolveShare(q.get('slug'));
 if(q.get('v')!==share.revision)throw new HttpError(404,'Preview unavailable.');
 const {bytes}=await generatedShareImage(share),current=await resolveShare(share.row.slug);
 if(current.revision!==share.revision)throw new HttpError(404,'Preview changed.');
 res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',bytes.length);res.statusCode=200;res.end(bytes);
 }catch(error){fail(res,error);}}
