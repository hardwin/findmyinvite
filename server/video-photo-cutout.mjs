import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {alignToReference} from './video-character-images.mjs';
import {uploadReference} from '../shared/scene-uploads.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {HttpError} from './core.mjs';
import {hash} from './video-personalise-store.mjs';
import {replicateProvider} from './video-character-provider.mjs';

export async function photoCutout(store,media,{start=false,provider=replicateProvider(),onStart=async()=>{},createPrediction}={}){
 const recordKey='media/'+media.id+'.json',row=await store.read(recordKey),m=row?.value;
 if(!m||m.owner!==media.owner||m.kind!=='image'||m.status!=='ready')throw new HttpError(400,'Choose a saved photo.');
 if(m.cutoutKey)return {ready:true};
 let job=m.cutoutRequest;
 if(!job||job.status==='failed'){
  if(!start)return {ready:false,started:!!job,failed:job?.status==='failed'};
  const original=m.sceneUpload?await store.bytes(m.key):null;
  if(original&&await transparentSubject(original))return saveCutout(store,recordKey,m,await sharp(original).rotate().png().toBuffer(),job?.attempt);
  job={attempt:randomUUID(),status:'submitting',since:Date.now()};
  try{await store.save(recordKey,{...m,cutoutRequest:job},{etag:row.etag});}catch{return {ready:false};}
  try{
   await onStart();
   const image='data:'+m.contentType+';base64,'+(original||await store.bytes(m.key)).toString('base64');
   const hook=callback(m.id,job.attempt),prediction=createPrediction?await createPrediction(image,hook):m.sceneUpload?await provider.sceneBackgroundMask(image,hook):await provider.removeBackground(image,hook);
   await setPrediction(store,recordKey,job.attempt,prediction.id);
  }catch(error){
   if(error.status===429||error.providerStatus&&error.providerStatus<500){
    const current=await store.read(recordKey);
    if(current?.value.cutoutRequest?.attempt===job.attempt)await store.save(recordKey,{...current.value,cutoutRequest:{...job,status:'failed'}},{etag:current.etag});
    throw error;
   }
  }
  return {ready:false};
 }
 if(!job.id){
  if(Date.now()-job.since>15000){const recent=await provider.recent(),match=recent.results?.find(p=>p.webhook===callback(m.id,job.attempt));if(match)await setPrediction(store,recordKey,job.attempt,match.id);else if(Date.now()-job.since>300000){await store.save(recordKey,{...m,cutoutRequest:{...job,status:'failed'}},{etag:row.etag});return {ready:false,failed:true};}}
  return {ready:false};
 }
 const result=await provider.get(job.id);
 if(['failed','canceled'].includes(result.status)){await store.save(recordKey,{...m,cutoutRequest:{...job,status:'failed'}},{etag:row.etag});return {ready:false,failed:true};}
 const url=Array.isArray(result.output)?result.output[0]:result.output;if(result.status!=='succeeded'||typeof url!=='string')return {ready:false};
 let png=await provider.output(url);
 try{
 if(m.sceneUpload){
  const original=await sharp(await store.bytes(m.key),{limitInputPixels:16000000}).rotate().removeAlpha().toColourspace('srgb').png().toBuffer({resolveWithObject:true});
  if(!await transparentSubject(png))throw new HttpError(422,'Choose a picture with a clear subject.');
  const mask=await sharp(png).extractChannel('alpha').resize(original.info.width,original.info.height,{fit:'fill'}).raw().toBuffer();
  png=await sharp(original.data).joinChannel(mask,{raw:{width:original.info.width,height:original.info.height,channels:1}}).png().toBuffer();
 }
 return await saveCutout(store,recordKey,m,png,job.attempt);
 }catch(error){
  if(error.status===422||error.code==='CHARACTER_QUALITY'){
   const latest=await store.read(recordKey);
   if(!latest.value.cutoutKey&&latest.value.cutoutRequest?.attempt===job.attempt)await store.save(recordKey,{...latest.value,cutoutRequest:{...job,status:'failed'}},{etag:latest.etag});
   return {ready:false,failed:true};
  }
  throw error;
 }
}
async function transparentSubject(bytes){
 const image=sharp(bytes,{limitInputPixels:16000000});if(!(await image.metadata()).hasAlpha)return false;
 const alpha=await image.extractChannel('alpha').resize(96,96,{fit:'fill'}).raw().toBuffer();
 return alpha.filter(v=>v<20).length>alpha.length*.04&&alpha.filter(v=>v>128).length>alpha.length*.02;
}
async function saveCutout(store,recordKey,m,png,attempt){
 const definition=m.sceneUpload&&videoDefinition(m.sceneUpload.templateId,m.sceneUpload.masterVersion);
 if(definition?.characterProfile){
  const path=uploadReference(definition,m.sceneUpload.slot);
  png=(await alignToReference(png,await readFile('public'+path),{minSilhouette:0})).bytes;
 }
 const image=sharp(png,{limitInputPixels:16000000}),meta=await image.metadata();
 if(meta.format!=='png'||!meta.hasAlpha)throw new HttpError(422,'The photo needs a transparent background. Choose another photo.');
 const alpha=await image.clone().ensureAlpha().extractChannel(3).resize(96,96,{fit:'fill'}).raw().toBuffer();
 if(!alpha.some(value=>value>64)||!alpha.some(value=>value<64))throw new HttpError(422,'Choose an image with a visible subject and a clear background.');
 const sha=hash(png),key=m.durable?'persistent/'+m.owner+'/'+m.invitationId+'/'+m.id+'/cutout.png':'cutouts/'+m.owner+'/'+m.id+'.png';
 try{await store.putBytes(key,png,'image/png');}catch(error){if(hash(await store.bytes(key))!==sha)throw error;}
 const latest=await store.read(recordKey);
 if(latest.value.cutoutKey)return {ready:true};
 if(latest.value.cutoutRequest?.attempt!==attempt)return {ready:false};
 await store.save(recordKey,{...latest.value,cutoutKey:key,cutoutSha256:sha},{etag:latest.etag});return {ready:true};
}
const callback=(id,attempt)=>'https://findmyinvite.com/api/video-characters?action=cutout-callback&id='+id+'&attempt='+attempt;
export async function setPrediction(store,key,attempt,id){
 const row=await store.read(key),job=row?.value?.cutoutRequest;
 if(!job||job.attempt!==attempt||job.id||!id)return;
 await store.save(key,{...row.value,cutoutRequest:{...job,id,status:'processing'}},{etag:row.etag});
}
