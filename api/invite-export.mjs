import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {HttpError,bodyJson,respond,fail,method,templates} from '../server/core.mjs';
import {resolveExport,walkthroughPaths} from '../server/invite-walkthrough.mjs';

export const config={maxDuration:300,memory:1024};

function siteOrigin(req){
 const proto=req.headers['x-forwarded-proto'];
 const host=req.headers['x-forwarded-host']||req.headers.host;
 if(proto&&host)return String(proto).split(',')[0].trim()+'://'+String(host).split(',')[0].trim();
 return process.env.SITE_ORIGIN||'https://findmyinvite.com';
}

function mimeFor(format){
 if(format==='pdf')return 'application/pdf';
 if(format==='image')return 'image/png';
 return 'video/mp4';
}

function filenameFor(id,format){
 if(format==='pdf')return id+'-letter.pdf';
 if(format==='image')return id+'-invite.png';
 return id+'-walkthrough.mp4';
}

export default async function handler(req,res){
 try{
  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'export';

  if(action==='status'){
   method(req,['GET']);
   const template=String(url.searchParams.get('template')||'').trim();
   if(!templates.has(template))throw new HttpError(404,'Unknown template.');
   const p=walkthroughPaths(template);
   const {access}=await import('node:fs/promises');
   const {constants}=await import('node:fs');
   const has=async(path)=>{try{await access(path,constants.R_OK);return true;}catch{return false;}};
   return respond(res,200,{
    template,
    video:await has(p.prebakedVideo)?p.publicVideo:null,
    image:await has(p.prebakedImage)?p.publicImage:null,
    pdf:await has(p.prebakedPdf)?p.publicPdf:null
   });
  }

  method(req,['POST','GET']);
  const body=req.method==='POST'?await bodyJson(req,64*1024):{};
  const template=String(body.template||url.searchParams.get('template')||'').trim();
  const format=String(body.format||url.searchParams.get('format')||'video').trim().toLowerCase();
  const force=body.force===true||url.searchParams.get('force')==='1';
  if(!template||!templates.has(template))throw new HttpError(400,'Valid template id required.');
  if(!['video','pdf','image'].includes(format))throw new HttpError(400,'format must be video, pdf, or image.');

  const result=await resolveExport({templateId:template,format,forceRebuild:force});
  // Prefer public URL redirect when cached under /assets (CDN-friendly for marketing).
  if(result.url&&result.cached&&req.method==='GET'){
   res.statusCode=302;
   res.setHeader('Location',result.url);
   res.end();
   return;
  }
  if(result.url&&!force){
   return respond(res,200,{
    ok:true,
    format:result.format,
    template:result.id,
    url:result.url,
    absoluteUrl:siteOrigin(req)+result.url,
    cached:result.cached
   });
  }
  const info=await stat(result.path);
  res.statusCode=200;
  res.setHeader('Content-Type',mimeFor(result.format));
  res.setHeader('Content-Length',String(info.size));
  res.setHeader('Content-Disposition','attachment; filename="'+filenameFor(result.id,result.format)+'"');
  res.setHeader('Cache-Control','public, max-age=3600');
  createReadStream(result.path).pipe(res);
 }catch(error){fail(res,error);}
}
