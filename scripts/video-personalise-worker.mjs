// Dedicated, immutable-asset worker. Never import the AI invitation export pipeline.
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {videoStore,hash} from '../server/video-personalise-store.mjs';
import {renderPersonalizedVideo} from './render-personalized-video.mjs';
import {videoService} from '../server/video-personalise.mjs';
const {id,secret}=JSON.parse(await readFile(process.argv[2],'utf8'));
if(!/^[a-f0-9]{64}$/.test(id)||!/^[a-f0-9]{64}$/.test(secret))throw Error('Invalid worker input.');
const store=videoStore(),record=await store.read('jobs/'+id+'.json'),job=record?.value;
if(!job||job.secretHash!==hash(secret)||job.masterHash!==hash(job.master)||Date.parse(job.expiresAt)<=Date.now())throw Error('Invalid or expired render.');
async function update(patch){
 // Use the same authenticated job transition directly in private storage. This
 // works on staged, protected deployments without giving the VM a bypass token.
 for(let attempt=0;attempt<3;attempt++){try{return await videoService({store}).finish(id,secret,patch);}catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
}
const temp=await mkdtemp(join(tmpdir(),'fmi-media-'));
try{
 await update({status:'running',progress:1});const photos={};let audioFile;
 for(const media of job.media){const cutout=media.mode==='cutout',bytes=await store.bytes(cutout?media.cutoutKey:media.key);if(hash(bytes)!==(cutout?media.cutoutSha256:media.sha256))throw Error('Media checksum mismatch.');const file=join(temp,media.id+(cutout?'.png':media.kind==='audio'?'.audio':'.image'));await writeFile(file,bytes);if(media.slot)photos[media.slot]={file,mode:media.mode};else audioFile=file;}
 const output=join(temp,'invitation.mp4');let lastProgress=-1;
 // Owner-scoped private scene-chunk reuse exists only for the layered 2D profile.
 const cache=job.master.renderProfile==='layered-2d-v1'?{owner:job.owner,store,worker:true}:undefined;
 const proof=await renderPersonalizedVideo({master:job.master,content:job.content,photos,audioFile,audioCredit:job.media.find(m=>m.library)?.credit,output,cache,onProgress:async progress=>{if(progress>=lastProgress+5){lastProgress=progress;await update({status:'running',progress});}}});
 const resultKey='results/'+job.owner+'/'+id+'/'+job.attempt+'.mp4';await store.putBytes(resultKey,await readFile(output),'video/mp4');await update({status:'ready',progress:100,resultKey,...proof});
}catch(e){console.error('Video render failed:',e.message);await update({status:'failed',errorCode:e.code,errorField:e.field,diagnostic:e.message}).catch(()=>{});process.exitCode=1;}finally{await rm(temp,{recursive:true,force:true});if(store.local)await rm(process.argv[2],{force:true});}
