import {get,put} from '@vercel/blob';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {digest,readPrivate,validateManifest} from './assembly-story-session.mjs';
import {runXaiImagineVideo} from './assembly-ai.mjs';
import {estimateCost} from './assembly-template1-gen.mjs';
import {run,probeMedia} from './assembly-template1-craft.mjs';
import {saveOpeningCheckpoint,readOpeningCheckpoint} from './assembly-opening-checkpoint.mjs';
import {HttpError} from './core.mjs';

async function readState(key,env){
 const result=await get(key,{access:'private',useCache:false,token:env.BLOB_READ_WRITE_TOKEN});
 if(!result)return {value:{},etag:null};
 return {value:JSON.parse(await new Response(result.stream).text()),etag:result.blob.etag};
}
async function saveState(key,record,env){
 const blob=await put(key,JSON.stringify(record.value),{access:'private',addRandomSuffix:false,contentType:'application/json',token:env.BLOB_READ_WRITE_TOKEN,...(record.etag?{ifMatch:record.etag}:{allowOverwrite:false})});
 record.etag=blob.etag;
}
async function frameCount(path){
 const {stdout}=await run('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames','-of','json',path]);
 return Number(JSON.parse(stdout.toString()).streams?.[0]?.nb_read_frames);
}
async function normalizeClip(source,out){
 const info=await probeMedia(source);
 if(!info.videoStreams||Math.abs(info.duration-3)>0.15)throw new HttpError(502,'A scene returned an invalid duration; expected 3 seconds. Saved original retained.');
 // Decode fully; preserve duration and reject corrupt frames. No time stretching.
 await run('ffmpeg',['-v','error','-xerror','-i',source,'-an','-f','null','-']);
 await run('ffmpeg',['-y','-i',source,'-vf','scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,tpad=stop_mode=clone:stop_duration=0.1','-frames:v','90','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out]);
 if(await frameCount(out)!==90)throw new HttpError(502,'Scene normalization did not produce exactly 90 frames.');
}
export async function runSegmentedOpening(job,{env=process.env,fetchImpl=fetch,sleepImpl,onProgress=()=>{},checkCancelled=()=>{}}={}){
 const manifest=validateManifest(job.input.openingManifest);
 const runId=job.input.segmentedRunId||env.ASSEMBLY_JOB_ID||job.id;
 const root='assembly-clips/'+digest(runId).slice(0,32);
 const context=await readState(root+'/context.json',env);
 if(!context.value.checkpointUrl||context.value.approvalRevision!==manifest.approvalRevision){
  const saved=await saveOpeningCheckpoint({input:job.input,prompts:job.prompts,pinImageUrl:job.pinImageUrl,palette:job.palette,styleCard:job.styleCard,spend:job.ledger.snapshot(),assets:job.assets},runId,env);
  context.value={checkpointUrl:saved.checkpointUrl,approvalRevision:manifest.approvalRevision};await saveState(root+'/context.json',context,env);
 }
 const dir=join(job.workdir,'gen','opening-clips');await mkdir(dir,{recursive:true});
 const estimate=estimateCost('opening-video',{duration:3});
 const records=await Promise.all(manifest.scenes.map(async scene=>{
  const signature=digest({first:scene.first.sha256,last:scene.last.sha256,prompt:scene.prompt,take:scene.take||0});
  const key=root+'/'+scene.index+'-'+signature+'.json';
  return {scene,key,record:await readState(key,env),signature};
 }));
 // Restore known spend before reserving for outstanding clips.
 for(const {record,scene,signature} of records){
  const role='opening-scene-'+scene.index+'-'+signature;
  if(record.value.costUsd!=null&&!job.ledger.entries.some(e=>e.role===role))job.ledger.charge(role,record.value.costUsd,{requestId:record.value.requestId});
 }
 job.ledger.reserve('remaining opening scenes',records.filter(r=>!r.record.value.blobUrl&&r.record.value.costUsd==null).length*estimate);
 let completed=0,cursor=0,stopped=false;
 const files=new Array(5);
 async function execute(item){
  const {scene,key,record,signature}=item;
  const role='opening-scene-'+scene.index+'-'+signature;
  checkCancelled();
  const raw=join(dir,'scene-'+scene.index+'-raw.mp4'),normalized=join(dir,'scene-'+scene.index+'.mp4');
  if(record.value.blobUrl){await writeFile(raw,await readPrivate(record.value.blobUrl,env));}
  else{
   if(record.value.status==='submitting'||record.value.status==='uncertain')throw new HttpError(409,'Scene '+scene.index+' submission outcome is uncertain. It will not be charged again automatically. Contact support to reconcile the provider request.');
   if(record.value.status==='failed')throw new HttpError(409,'Scene '+scene.index+' failed at the provider. Use Retry scene to explicitly create a replacement.');
   const buffers=await Promise.all([scene.first,scene.last].map(async asset=>{
    const buffer=await readPrivate(asset.blobUrl,env);
    if(digest(buffer)!==asset.sha256)throw new HttpError(409,'Approved endpoint checksum mismatch. Reapprove the scene before spending.');
    return 'data:'+asset.contentType+';base64,'+buffer.toString('base64');
   }));
   try{
    const result=await runXaiImagineVideo({image:{url:buffers[0]},lastFrame:{url:buffers[1]},duration:3,prompt:scene.prompt,env,fetchImpl,sleepImpl,resumeRequestId:record.value.requestId,
     onSubmitting:async()=>{checkCancelled();record.value={...record.value,status:'submitting',signature,startedAt:new Date().toISOString()};await saveState(key,record,env);},
     onSubmitted:async requestId=>{record.value={...record.value,status:'rendering',requestId};await saveState(key,record,env);},
     onTick:()=>{checkCancelled();onProgress('Creating opening: '+completed+' of 5 scenes ready. Scene '+scene.index+' rendering.');}
    });
    const blob=await put(root+'/'+scene.index+'-'+signature+'.mp4',result.buffer,{access:'private',addRandomSuffix:true,contentType:'video/mp4',token:env.BLOB_READ_WRITE_TOKEN});
    record.value={...record.value,status:'ready',blobUrl:blob.url,requestId:result.requestId,costUsd:result.costUsd??estimate};
    await saveState(key,record,env);
    if(!job.ledger.entries.some(e=>e.role===role))job.ledger.charge(role,record.value.costUsd,{requestId:result.requestId});
    await writeFile(raw,result.buffer);
   }catch(error){
    if(error.submissionRejected)record.value.status='rejected';
    else if(error.providerTerminal)record.value.status='failed';
    else if(!record.value.requestId)record.value.status='uncertain';
    record.value.error=String(error.message).slice(0,400);await saveState(key,record,env);throw error;
   }
  }
  await normalizeClip(raw,normalized);
  files[scene.index-1]=normalized;completed++;
  onProgress('Creating opening: '+completed+' of 5 scenes ready.');
 }
 const work=async()=>{while(!stopped){const i=cursor++;if(i>=records.length)return;try{await execute(records[i]);}catch(error){stopped=true;throw error;}}};
 const results=await Promise.allSettled([work(),work()]);
 const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
 checkCancelled();onProgress('All five scenes ready. Stitching the opening…');
 const list=join(dir,'concat.txt');await writeFile(list,files.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n'));
 const path=join(job.workdir,'gen','opening-video.mp4');
 await run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-an','-c:v','copy','-movflags','+faststart',path]);
 const info=await probeMedia(path);
 if(await frameCount(path)!==450||Math.abs(info.duration-15)>0.04||info.width!==720||info.height!==1280||info.audioStreams)throw new HttpError(502,'Stitched opening must contain exactly 450 frames at 720×1280, without audio.');
 return {path,provider:'xai-segmented',duration:15,manifest,clipKeys:records.map(r=>r.key),costUsd:records.reduce((sum,r)=>sum+(r.record.value.costUsd||0),0)};
}

export async function readSegmentedCheckpoint(runId,env=process.env){
 const record=await readState('assembly-clips/'+digest(runId).slice(0,32)+'/context.json',env);
 return record.value.checkpointUrl?readOpeningCheckpoint(record.value.checkpointUrl,env):null;
}

export async function assertSceneReplacementAllowed(runId,scene,env=process.env){
 const signature=digest({first:scene.first.sha256,last:scene.last.sha256,prompt:scene.prompt,take:scene.take||0});
 const record=await readState('assembly-clips/'+digest(runId).slice(0,32)+'/'+scene.index+'-'+signature+'.json',env);
 if(['submitting','uncertain','rendering'].includes(record.value.status))throw new HttpError(409,'This scene still has an unresolved provider request. Use Retry to resume polling; an uncertain submission must be reconciled before replacing it.');
}
