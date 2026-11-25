import {videoPublicCatalog} from '../server/video-public-catalog.mjs';
import {isVersionedVideo,videoDraftVersion,videoMasterVersion} from '../shared/video-master-version.mjs';
import {withCatalogIdentity} from '../server/catalog-identity.mjs';
import {videoDownloadTicket} from '../server/video-download-ticket.mjs';
import {queueVideoRender} from '../server/video-render-queue.mjs';
import {handleUpload} from '@vercel/blob/client';
import {get,head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {waitUntil} from '@vercel/functions';
import {HttpError,bodyJson,method,respond,fail,rate} from '../server/core.mjs';
import {customer,operator} from '../server/template-cms.mjs';
import {DEFAULT_PUBLIC_VIDEO_ID} from '../shared/video-visibility.mjs';
import {requireVideoVisibility} from '../server/video-visibility.mjs';
import {videoStore,hash,VIDEO_TTL} from '../server/video-personalise-store.mjs';
import {videoConfig,videoService,publicJob,loadVideoMaster,requireVideoRelease} from '../server/video-personalise.mjs';
import {launchVideoRender,prepareVideoPhoto,stopVideoSandbox} from '../server/video-personalise-cloud.mjs';
import {matchesMediaType} from '../server/template-file-validation.mjs';
import {mediaRange} from '../server/template-media-range.mjs';
import {videoDefinition,DEFAULT_VIDEO_ID} from '../shared/video-personalization.mjs';
import {videoPaymentService,videoPrice} from '../server/video-payments.mjs';
import {recordVideoCheckout} from '../server/owner/events.mjs';
import {draftService} from '../server/personalization-drafts.mjs';
import {db} from '../server/core.mjs';
import {validatePreparedCharacters} from '../server/video-character-access.mjs';
const types={image:['image/jpeg','image/png','image/webp'],audio:['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/aac']};
const limits={image:1048576,audio:20*1048576};
export const config={maxDuration:300,memory:1024};
export function uploadSignature(bytes,type){return matchesMediaType(bytes,type)||type==='audio/wav'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE'||type==='audio/aac'&&bytes[0]===255&&(bytes[1]&246)===240;}
async function stopCompletedRender(store,job){if(store.local||!job.sandboxId||job.sandboxStoppedAt||!['ready','failed'].includes(job.status))return;try{await stopVideoSandbox(job.sandboxId);const row=await store.read('jobs/'+job.id+'.json');if(row?.value.attempt===job.attempt)await store.save('jobs/'+job.id+'.json',{...row.value,sandboxStoppedAt:new Date().toISOString()},{etag:row.etag});}catch(e){console.error('Video worker cleanup will retry:',job.id,e.message);}}
export default async function handler(req,res){const store=videoStore(),service=videoService({store,launch:(job,secret)=>queueVideoRender(job,secret,{launch:launchVideoRender,finish:(...args)=>service.finish(...args),waitUntil})});try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'template';
 if(action==='templates'){
  method(req,['GET']);const includeHidden=q.get('includeHidden')==='1';if(includeHidden)await operator(req);
  const {templates,musicUnavailable}=await videoPublicCatalog({includeHidden});
  res.setHeader('Cache-Control',includeHidden?'private, no-store':musicUnavailable?'no-store':'public, max-age=0, must-revalidate, s-maxage=60');if(includeHidden)res.setHeader('Vary','Cookie, Authorization');res.setHeader('X-Content-Type-Options','nosniff');return res.status(200).json({templates});
 }
 if(action==='template'){
  method(req,['GET']);
  const templateId=q.get('template')||DEFAULT_PUBLIC_VIDEO_ID;
  await requireVideoVisibility(req,templateId,q.get('invitationId'));
  const requested=q.get('masterVersion');
  const version=isVersionedVideo(templateId)&&(requested||templateId!=='film-oonjal-v1')
   ?videoMasterVersion(templateId,Number(requested||(['wedding-bells-v1','film-were-next-v1','film-anbil-avan-v1'].includes(templateId)?1:3))):undefined;
  const config=await videoConfig(process.env,templateId,undefined,version);
  return respond(res,200,{...(await withCatalogIdentity([config],'video'))[0],price:videoPrice(process.env,templateId)});
 }
 if(action==='retention'){method(req,['GET']);if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)throw new HttpError(401,'Unauthorized');await store.expired();await draftService({store}).cleanupDeleted();return respond(res,200,{ok:true});}
 if(action==='callback'){method(req,['POST']);const b=await bodyJson(req),secret=String(req.headers['x-video-secret']||'');const result=await service.finish(b.id,secret,b);const row=await store.read('jobs/'+b.id+'.json');if(['ready','failed'].includes(result.status)&&row?.value.sandboxId)waitUntil(stopVideoSandbox(row.value.sandboxId).catch(()=>{}));return respond(res,200,result);}
 if(action==='upload'){method(req,['POST']);const body=await bodyJson(req);return respond(res,200,await handleUpload({request:req,body,onBeforeGenerateToken:async pathname=>{const user=await customer(req),m=/^video-personalise\/(?:uploads\/([a-f0-9-]{36})\/([a-f0-9-]{36})|persistent\/([a-f0-9-]{36})\/([a-f0-9-]{36})\/([a-f0-9-]{36})\/original)$/.exec(pathname);if(!m||(m[1]||m[3])!==user.id)throw new HttpError(403,'Upload not reserved.');const record=await service.media(user.id,m[2]||m[5]);if(pathname!==store.prefix+record.key)throw new HttpError(403,'Upload not reserved.');if(record.status!=='pending')throw new HttpError(409,'Upload already completed.');return {allowedContentTypes:types[record.kind],maximumSizeInBytes:limits[record.kind],addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+600000};},onUploadCompleted:async()=>{}}));}
 const user=await customer(req);
 if(['payment-status','payment-order','payment-verify','payment-promo'].includes(action)){
  method(req,action==='payment-status'?['GET']:['POST']);
  const b=action==='payment-status'?Object.fromEntries(q):await bodyJson(req,4000),templateId=b.templateId||DEFAULT_VIDEO_ID;
  await requireVideoVisibility(req,templateId,b.invitationId,{user});
  requireVideoRelease(await loadVideoMaster(templateId),process.env);
  await rate(req,'video-'+(action==='payment-promo'?'promo':'checkout')+':'+user.id,action==='payment-promo'?10:60,3600);
  await draftService({store}).get(user.id,b.invitationId,{optional:true});const payments=videoPaymentService(),args=[user.id,b.invitationId,templateId];
  const result=action==='payment-status'?await payments.status(...args):action==='payment-order'?await payments.order(...args):action==='payment-promo'?await payments.promo(...args,b.code):await payments.verify(...args,b);
  if(b.analytics)waitUntil(recordVideoCheckout(req,action,result,b.analytics,templateId).catch(()=>console.warn('Video checkout reporting could not be saved.')));
  return respond(res,200,result);
 }
 if(action==='reserve'){method(req,['POST']);const b=await bodyJson(req);await requireVideoVisibility(req,b.templateId||DEFAULT_VIDEO_ID,b.invitationId,{user});requireVideoRelease(await loadVideoMaster(b.templateId||DEFAULT_VIDEO_ID),process.env);await rate(req,'video-upload:'+user.id,40,3600);if(!types[b.kind])throw new HttpError(400,'Unsupported media type.');const draft=b.invitationId?await draftService({store}).get(user.id,b.invitationId):null;const id=randomUUID(),key=draft?'persistent/'+user.id+'/'+draft.id+'/'+id+'/original':'uploads/'+user.id+'/'+id;await store.save('media/'+id+'.json',{id,owner:user.id,kind:b.kind,key,status:'pending',...(draft?{invitationId:draft.id,durable:true,expiresAt:null}:{expiresAt:new Date(Date.now()+VIDEO_TTL).toISOString()})},{create:true});return respond(res,201,{id,pathname:store.prefix+key});}
 if(action==='local-upload'){method(req,['POST']);if(!store.local)throw new HttpError(404,'Unknown video action.');const m=await service.media(user.id,q.get('id'));if(m.status!=='pending')throw new HttpError(409,'Upload already completed.');const type=String(req.headers['content-type']||'').split(';')[0];if(!types[m.kind].includes(type))throw new HttpError(400,'Unsupported file type.');const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>limits[m.kind])throw new HttpError(413,'File exceeds the upload limit.');chunks.push(chunk);}const bytes=Buffer.concat(chunks);if(bytes.length<12||!uploadSignature(bytes,type))throw new HttpError(400,'The file contents do not match its type.');await store.putBytes(m.key,bytes,type);const current=await store.read('media/'+m.id+'.json');await store.save('media/'+m.id+'.json',{...m,status:'ready',sha256:hash(bytes),contentType:type,bytes:bytes.length},{etag:current.etag});return respond(res,200,{id:m.id});}
 if(action==='complete'){method(req,['POST']);const m=await service.media(user.id,q.get('id'));if(m.status==='ready')return respond(res,200,{id:m.id});const meta=await head(store.prefix+m.key);if(!types[m.kind].includes(meta.contentType)||meta.size>limits[m.kind]||meta.size<12)throw new HttpError(400,'Unsupported file type or size.');const bytes=await store.bytes(m.key);if(!uploadSignature(bytes,meta.contentType))throw new HttpError(400,'The file contents do not match its type.');const current=await store.read('media/'+m.id+'.json');await store.save('media/'+m.id+'.json',{...m,status:'ready',sha256:hash(bytes),contentType:meta.contentType,bytes:bytes.length},{etag:current.etag});return respond(res,200,{id:m.id});}
 if(action==='cutout'){method(req,['POST']);await rate(req,'video-cutout:'+user.id,12,3600);const m=await service.media(user.id,q.get('id'));if(m.kind!=='image'||m.status!=='ready')throw new HttpError(400,'Photo is not ready.');if(!m.cutoutKey){const output=await prepareVideoPhoto(await store.bytes(m.key)),key=m.durable?'persistent/'+user.id+'/'+m.invitationId+'/'+m.id+'/cutout.png':'cutouts/'+user.id+'/'+m.id+'.png';await store.putBytes(key,output,'image/png');const current=await store.read('media/'+m.id+'.json');await store.save('media/'+m.id+'.json',{...current.value,cutoutKey:key,cutoutSha256:hash(output)},{etag:current.etag});}return respond(res,200,{id:m.id});}
 if(action==='render'){method(req,['POST']);const b=await bodyJson(req,64000),templateId=b.templateId||DEFAULT_VIDEO_ID;await requireVideoVisibility(req,templateId,b.invitationId,{user});const savedDraft=await draftService({store}).get(user.id,b.invitationId,{optional:true});if(savedDraft&&savedDraft.template_id!==templateId)throw new HttpError(404,'Invitation not found.');const purchase=await videoPaymentService().requireAccess(user.id,b.invitationId,templateId);await rate(req,'video-render:'+user.id,5,3600);await validatePreparedCharacters(user.id,purchase.id,b.content?.photos,undefined,{templateId,draft:savedDraft});const job=await service.start(user.id,b.content,templateId,purchase.id,isVersionedVideo(templateId)?videoDraftVersion(templateId,savedDraft?.payload):undefined);await db('personalization_drafts?id=eq.'+purchase.id+'&owner_id=eq.'+user.id,{method:'PATCH',body:{last_job_id:job.id}});return respond(res,202,job);}
 if(action==='status'){method(req,['GET']);const job=await service.job(user.id,q.get('id'));waitUntil(stopCompletedRender(store,job));return respond(res,200,publicJob(job));}
 if(action==='download-ticket'){method(req,['GET']);const j=await service.job(user.id,q.get('id'));if(j.status!=='ready')throw new HttpError(409,'Video is not ready.');return respond(res,200,store.local?{url:null}:{...await videoDownloadTicket(store.prefix+j.resultKey),bytes:j.bytes,sha256:j.resultSha256});}
 if(action==='download'||action==='media'){
  method(req,['GET']);let key,type,size;
  if(action==='download'){const j=await service.job(user.id,q.get('id'));if(j.status!=='ready')throw new HttpError(409,'Video is not ready.');key=j.resultKey;type='video/mp4';size=j.bytes;res.setHeader('Content-Disposition','attachment; filename="'+videoDefinition(j.templateId).filename+'"');}
  else{const m=await service.media(user.id,q.get('id'));if(m.status!=='ready')throw new HttpError(404,'Media not ready.');
   const cutout=q.get('cutout')==='1',preview=!cutout&&q.get('preview')==='1'&&m.previewKey;
   key=cutout?m.cutoutKey:preview?m.previewKey:m.key;if(!key)throw new HttpError(404,'Cutout not ready.');
   type=cutout?'image/png':preview?m.previewContentType:m.contentType;
   size=cutout?(store.local?(await store.bytes(key)).length:(await head(store.prefix+key)).size):preview?m.previewBytes:m.bytes;
  }
  let range;try{range=mediaRange(String(req.headers.range||''),size);}catch{res.setHeader('Content-Range','bytes */'+size);throw new HttpError(416,'Invalid byte range.');}res.setHeader('Content-Type',type);res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Accept-Ranges','bytes');
  if(store.local){const b=await store.bytes(key);if(range){res.statusCode=206;res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.end(b.subarray(range.start,range.end+1));}else res.end(b);return;}
  const blob=await get(store.prefix+key,{access:'private',headers:range?{Range:`bytes=${range.start}-${range.end}`}:undefined});if(!blob||blob.statusCode!==200)throw new HttpError(404,'File unavailable.');if(range){const expected=`bytes ${range.start}-${range.end}/${size}`;if(blob.headers.get('content-range')!==expected){await blob.stream.cancel();throw new HttpError(503,'Download range unavailable.');}res.statusCode=206;res.setHeader('Content-Range',expected);res.setHeader('Content-Length',range.end-range.start+1);}const {Readable}=await import('node:stream'),{pipeline}=await import('node:stream/promises');await pipeline(Readable.fromWeb(blob.stream),res);return;
 }
 throw new HttpError(404,'Unknown video action.');
}catch(e){if(!(e instanceof HttpError))console.error('Video request failed:',String(e.message||e.name).replace(/https?:\/\/\S+/g,'[service URL]').replace(/[A-Za-z0-9_=-]{32,}/g,'[redacted]').slice(0,600));if(!res.headersSent)fail(res,e);else res.destroy();}}
