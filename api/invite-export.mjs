import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {HttpError,bodyJson,respond,fail,method} from '../server/core.mjs';
import {resolveExport,readWalkthroughManifest,fetchWalkthroughBlob,walkthroughServeUrl} from '../server/invite-walkthrough.mjs';
import {isExportTemplateId,captureOriginFromPreview} from '../server/invite-walkthrough-imagine.mjs';
import {requireManager} from '../server/manager-auth.mjs';
import {
 assertBakeOperator,
 startWalkthroughBake,
 getWalkthroughJob,
 reportWalkthroughProgress,
 completeWalkthroughBake,
 walkthroughCloudEnabled,
 walkthroughCloudMissing
} from '../server/walkthrough-cloud.mjs';

function assertExportId(template){
 const id=String(template||'').trim();
 if(!isExportTemplateId(id))throw new HttpError(400,'Valid template id required.');
 return id;
}

async function assertCanBake(req,body){
 try{
  await requireManager(req);
  return;
 }catch(error){
  if(error instanceof HttpError&&error.status===401){
   assertBakeOperator(req,body);
   return;
  }
  throw error;
 }
}

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

function absoluteUrl(req,url){
 if(!url)return null;
 if(/^https?:\/\//i.test(url))return url;
 return siteOrigin(req)+url;
}

export default async function handler(req,res){
 try{
  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'export';

  if(action==='status'){
   method(req,['GET']);
   const template=String(url.searchParams.get('template')||'').trim();
   if(!isExportTemplateId(template))throw new HttpError(404,'Unknown template.');
   const row=(await readWalkthroughManifest())[template]||{};
   return respond(res,200,{
    template,
    video:row.blob?.video?walkthroughServeUrl(template,'video'):null,
    image:row.blob?.image?walkthroughServeUrl(template,'image'):null,
    pdf:row.blob?.pdf?walkthroughServeUrl(template,'pdf'):null,
    deliver:row.deliver||null,
    viewport:row.viewport||null,
    cloud:walkthroughCloudEnabled()
   });
  }

  // Stream private Blob → browser (marketing download).
  if(action==='file'){
   method(req,['GET','HEAD']);
   const template=String(url.searchParams.get('template')||'').trim();
   const format=String(url.searchParams.get('format')||'video').trim().toLowerCase();
   if(!template||!isExportTemplateId(template))throw new HttpError(400,'Valid template id required.');
   if(!['video','pdf','image'].includes(format))throw new HttpError(400,'format must be video, pdf, or image.');
   const file=await fetchWalkthroughBlob(template,format);
   if(!file)throw new HttpError(404,'Walkthrough not baked yet.');
   res.statusCode=200;
   res.setHeader('Content-Type',file.contentType||mimeFor(format));
   res.setHeader('Content-Length',String(file.buf.length));
   res.setHeader('Content-Disposition','attachment; filename="'+filenameFor(template,format)+'"');
   res.setHeader('Cache-Control','public, max-age=86400');
   if(req.method==='HEAD'){res.end();return;}
   res.end(file.buf);
   return;
  }

  // Photographer (signed in) or operator: start Sandbox Imagine bake after website preview.
  if(action==='bake'){
   method(req,['POST']);
   const body=await bodyJson(req,64*1024);
   await assertCanBake(req,body);
   const template=assertExportId(body.template||url.searchParams.get('template')||'');
   if(!walkthroughCloudEnabled()){
    throw new HttpError(503,'Cloud bake unavailable: '+walkthroughCloudMissing().join(', '));
   }
   const captureOrigin=captureOriginFromPreview(body.previewUrl||body.origin)
    ||String(process.env.CAPTURE_ORIGIN||'https://findmyinvite.com').replace(/\/$/,'');
   if(!captureOrigin)throw new HttpError(400,'previewUrl must be findmyinvite.com or a Vercel preview.');
   const job=await startWalkthroughBake(template,{
    captureOrigin,
    formats:String(body.formats||'video')
   });
   return respond(res,202,{
    ok:true,
    jobId:job.jobId,
    templateId:job.templateId,
    status:job.status,
    captureOrigin,
    poll:'/api/invite-export?action=bake-status&jobId='+job.jobId
   });
  }

  if(action==='bake-status'){
   method(req,['GET']);
   const jobId=String(url.searchParams.get('jobId')||'').trim();
   const job=await getWalkthroughJob(jobId);
   if(!job)throw new HttpError(404,'Bake job not found.');
   return respond(res,200,{
    jobId:job.id,
    templateId:job.templateId,
    status:job.status,
    percent:job.percent,
    label:job.label,
    detail:job.detail,
    error:job.error,
    urls:job.urls,
    sandboxId:job.sandboxId
   });
  }

  if(action==='bake-progress'){
   method(req,['POST']);
   const jobId=String(req.headers['x-walkthrough-job-id']||url.searchParams.get('jobId')||'').trim();
   const secret=String(req.headers['x-walkthrough-job-secret']||'').trim();
   const body=await bodyJson(req,64*1024);
   const job=await reportWalkthroughProgress(jobId,secret,body);
   return respond(res,200,{ok:true,jobId:job.id,status:job.status,percent:job.percent});
  }

  if(action==='bake-done'){
   method(req,['POST']);
   const jobId=String(req.headers['x-walkthrough-job-id']||url.searchParams.get('jobId')||'').trim();
   const secret=String(req.headers['x-walkthrough-job-secret']||'').trim();
   const body=await bodyJson(req,256*1024);
   const job=await completeWalkthroughBake(jobId,secret,body);
   return respond(res,200,{ok:true,jobId:job.id,status:job.status,urls:job.urls});
  }

  method(req,['POST','GET']);
  const body=req.method==='POST'?await bodyJson(req,64*1024):{};
  const template=String(body.template||url.searchParams.get('template')||'').trim();
  const format=String(body.format||url.searchParams.get('format')||'video').trim().toLowerCase();
  const force=body.force===true||url.searchParams.get('force')==='1';
  if(!template||!isExportTemplateId(template))throw new HttpError(400,'Valid template id required.');
  if(!['video','pdf','image'].includes(format))throw new HttpError(400,'format must be video, pdf, or image.');
  if(force&&process.env.VERCEL&&process.env.WALKTHROUGH_CLOUD_WORKER!=='1'){
   throw new HttpError(400,'Use POST ?action=bake for cloud rebuild (Sandbox).');
  }

  const result=await resolveExport({templateId:template,format,forceRebuild:force});
  if(result.url&&result.cached&&req.method==='GET'){
   res.statusCode=302;
   res.setHeader('Location',absoluteUrl(req,result.url));
   res.end();
   return;
  }
  if(result.url&&!force){
   const abs=absoluteUrl(req,result.url);
   return respond(res,200,{
    ok:true,
    format:result.format,
    template:result.id,
    url:result.url,
    absoluteUrl:abs,
    cached:result.cached
   });
  }
  if(!result.path){
   if(result.url){
    const abs=absoluteUrl(req,result.url);
    return respond(res,200,{
     ok:true,
     format:result.format,
     template:result.id,
     url:result.url,
     absoluteUrl:abs,
     cached:result.cached
    });
   }
   throw new HttpError(500,'Export produced no file.');
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
