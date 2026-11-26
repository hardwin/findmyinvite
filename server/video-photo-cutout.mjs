import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {HttpError} from './core.mjs';
import {hash} from './video-personalise-store.mjs';
import {replicateProvider} from './video-character-provider.mjs';

export async function photoCutout(store,media,{start=false,provider=replicateProvider(),onStart=async()=>{}}={}){
 const recordKey='media/'+media.id+'.json',row=await store.read(recordKey),m=row?.value;
 if(!m||m.owner!==media.owner||m.kind!=='image'||m.status!=='ready')throw new HttpError(400,'Choose a saved photo.');
 if(m.cutoutKey)return {ready:true};
 let job=m.cutoutRequest;
 if(!job||job.status==='failed'){
  if(!start)return {ready:false,failed:job?.status==='failed'};
  await onStart();
  job={attempt:randomUUID(),status:'submitting',since:Date.now()};
  try{await store.save(recordKey,{...m,cutoutRequest:job},{etag:row.etag});}catch{return {ready:false};}
  const image='data:'+m.contentType+';base64,'+(await store.bytes(m.key)).toString('base64');
  try{
   const prediction=await provider.removeBackground(image,callback(m.id,job.attempt));
   await setPrediction(store,recordKey,job.attempt,prediction.id);
  }catch(error){
   if(error.providerStatus&&error.providerStatus<500){
    const current=await store.read(recordKey);
    if(current?.value.cutoutRequest?.attempt===job.attempt)await store.save(recordKey,{...current.value,cutoutRequest:{...job,status:'failed'}},{etag:current.etag});
    throw error;
   }
  }
  return {ready:false};
 }
 if(!job.id){
  if(Date.now()-job.since>15000){const recent=await provider.recent(),match=recent.results?.find(p=>p.webhook===callback(m.id,job.attempt));if(match)await setPrediction(store,recordKey,job.attempt,match.id);}
  return {ready:false};
 }
 const result=await provider.get(job.id);
 if(['failed','canceled'].includes(result.status)){await store.save(recordKey,{...m,cutoutRequest:{...job,status:'failed'}},{etag:row.etag});return {ready:false,failed:true};}
 const url=Array.isArray(result.output)?result.output[0]:result.output;if(result.status!=='succeeded'||typeof url!=='string')return {ready:false};
 const png=await provider.output(url),image=sharp(png,{limitInputPixels:16000000}),meta=await image.metadata();
 if(meta.format!=='png'||!meta.hasAlpha)throw new HttpError(422,'The photo needs a transparent background. Choose another photo.');
 const sha=hash(png),key=m.durable?'persistent/'+m.owner+'/'+m.invitationId+'/'+m.id+'/cutout.png':'cutouts/'+m.owner+'/'+m.id+'.png';
 try{await store.putBytes(key,png,'image/png');}catch(error){if(hash(await store.bytes(key))!==sha)throw error;}
 const latest=await store.read(recordKey);
 if(latest.value.cutoutKey)return {ready:true};
 if(latest.value.cutoutRequest?.attempt!==job.attempt)return {ready:false};
 await store.save(recordKey,{...latest.value,cutoutKey:key,cutoutSha256:sha},{etag:latest.etag});return {ready:true};
}
const callback=(id,attempt)=>'https://findmyinvite.com/api/video-characters?action=cutout-callback&id='+id+'&attempt='+attempt;
export async function setPrediction(store,key,attempt,id){
 const row=await store.read(key),job=row?.value?.cutoutRequest;
 if(!job||job.attempt!==attempt||job.id||!id)return;
 await store.save(key,{...row.value,cutoutRequest:{...job,id,status:'processing'}},{etag:row.etag});
}
