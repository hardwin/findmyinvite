import {method,fail,HttpError} from '../server/core.mjs';
import {spaIndexHtml} from '../server/guest-page.mjs';
import {resolveTemplateShare,templateShareOrigin,injectTemplateShareMetadata} from '../server/template-share.mjs';

export default async function handler(req,res){try{
 method(req,['GET','HEAD']);
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,format=q.get('format')||'page';
 if(!['image','page'].includes(format))throw new HttpError(400,'Invalid preview format.');
 const origin=templateShareOrigin(req),entry=await resolveTemplateShare(q,origin);
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public, max-age=60, must-revalidate');
 res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=60');
 if(format==='image'){
  const {templateShareImage}=await import('../server/template-share-image.mjs');
  const bytes=await templateShareImage(entry,origin);
  res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',bytes.length);
  res.setHeader('Content-Disposition',`${q.get('download')==='1'?'attachment':'inline'}; filename="${entry.id}-findmyinvite.jpg"`);
  res.statusCode=200;return res.end(req.method==='HEAD'?undefined:bytes);
 }
 const html=injectTemplateShareMetadata(await spaIndexHtml(req),entry,origin);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.statusCode=200;res.end(req.method==='HEAD'?undefined:html);
 }catch(error){res.setHeader('Vercel-CDN-Cache-Control','no-store');fail(res,error);}}
