import {method,fail,HttpError} from '../server/core.mjs';
import {resolveShare} from '../server/share-details.mjs';
import {cachedShareImage,imageBytes} from '../server/share-image-store.mjs';
export default async function handler(req,res){try{
 method(req,['GET','HEAD']);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex');
 const started=Date.now();
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,share=await resolveShare(q.get('slug'));
 if(q.has('v')&&q.get('v')!==share.revision)throw new HttpError(404,'Preview unavailable.');
 const resolved=Date.now();let bytes=await cachedShareImage(share),rendered=false;
 if(!bytes){const origin=process.env.VERCEL?'https://findmyinvite.com':'http://127.0.0.1:'+(req.socket?.localPort||5173);const response=await fetch(origin+'/api/share-render?slug='+encodeURIComponent(share.row.slug)+'&v='+share.revision,{signal:AbortSignal.timeout(55000)});if(!response.ok||response.headers.get('content-type')!=='image/jpeg')throw new HttpError(503,'Preview is being prepared. Please retry.');bytes=await imageBytes(response.body);rendered=true;}
 // Recheck after rendering, in case publication was removed during generation.
 if(rendered){const current=await resolveShare(share.row.slug);if(current.revision!==share.revision)throw new HttpError(404,'Preview changed.');}
 if(Date.parse(share.row.expires_at)<=Date.now())throw new HttpError(404,'Preview unavailable.');
 res.setHeader('Server-Timing',`lookup;dur=${resolved-started},image;dur=${Date.now()-resolved}`);
 res.setHeader('Content-Disposition','inline; filename="wedding-invitation.jpg"');res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',bytes.length);res.setHeader('X-Content-Type-Options','nosniff');res.statusCode=200;res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){fail(res,error);}}
