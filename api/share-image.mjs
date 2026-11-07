import {method,fail,HttpError} from '../server/core.mjs';
import {resolveShare} from '../server/share-details.mjs';
import {generatedShareImage} from '../server/share-image.mjs';
export default async function handler(req,res){try{
 method(req,['GET','HEAD']);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex');
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,share=await resolveShare(q.get('slug'));
 if(q.has('v')&&q.get('v')!==share.revision)throw new HttpError(404,'Preview unavailable.');
 const {bytes,rendered}=await generatedShareImage(share);
 // Recheck after rendering, in case publication was removed during generation.
 if(rendered){const current=await resolveShare(share.row.slug);if(current.revision!==share.revision)throw new HttpError(404,'Preview changed.');}
 if(Date.parse(share.row.expires_at)<=Date.now())throw new HttpError(404,'Preview unavailable.');
 res.setHeader('Content-Disposition','inline; filename="wedding-invitation.jpg"');res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',bytes.length);res.setHeader('X-Content-Type-Options','nosniff');res.statusCode=200;res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){fail(res,error);}}
