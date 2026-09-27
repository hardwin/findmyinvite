// Durable, owner-scoped authority for names, storyboard assets and approvals.
import {createHash,randomUUID} from 'node:crypto';
import {get,put} from '@vercel/blob';
import {HttpError} from './core.mjs';
export const SEGMENTED_VERSION='five-clips-v1';
export const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
export function storyKey(owner,chatId){
 if(!/^[a-zA-Z0-9_-]{4,100}$/.test(String(chatId||'')))throw new HttpError(400,'A valid invitation chat is required.');
 return 'assembly-stories/'+digest(owner).slice(0,32)+'/'+chatId+'/state.json';
}
export async function readPrivate(url,env=process.env){
 const result=await get(url,{access:'private',useCache:false,token:env.BLOB_READ_WRITE_TOKEN});
 if(!result||result.statusCode!==200)throw new HttpError(404,'Saved invitation asset is unavailable. Nothing was regenerated.');
 return Buffer.from(await new Response(result.stream).arrayBuffer());
}
export async function loadStory(key,env=process.env){
 const result=await get(key,{access:'private',useCache:false,token:env.BLOB_READ_WRITE_TOKEN});
 if(!result)return {value:{version:SEGMENTED_VERSION},etag:null};
 if(result.statusCode!==200)throw new HttpError(503,'Could not load invitation state.');
 return {value:JSON.parse(await new Response(result.stream).text()),etag:result.blob.etag};
}
function mergeStory(local,remote){
 const next={...remote,...local};
 if(local.board?.scenes&&remote.board?.scenes){
  next.board={
   ...remote.board,
   ...local.board,
   scenes:remote.board.scenes.map((scene,index)=>({...scene,...(local.board.scenes[index]||{})}))
  };
 }else if(local.board){
  next.board=local.board;
 }
 // Explicit durable claims always win when the writer set them.
 for(const field of ['names','pinUrl','identity','approval','generation','segmentedRunId']){
  if(local[field]!==undefined)next[field]=local[field];
 }
 return next;
}
export async function saveStory(key,record,env=process.env,{attempts=6}={}){
 let lastError;
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const force=attempt===attempts;
   const result=await put(key,JSON.stringify(record.value),{
    access:'private',
    addRandomSuffix:false,
    contentType:'application/json',
    token:env.BLOB_READ_WRITE_TOKEN,
    ...(force
     ?{allowOverwrite:true}
     :(record.etag?{ifMatch:record.etag}:{allowOverwrite:false}))
   });
   record.etag=result.etag;
   return record.value;
  }catch(error){
   lastError=error;
   const race=/precondition|etag|412|conflict|already exists|overwrite/i.test(String(error?.message||error||''));
   if(!race&&attempt===1)throw error;
   if(!race&&attempt>1)throw error;
   const latest=await loadStory(key,env);
   record.value=mergeStory(record.value,latest.value);
   record.etag=latest.etag;
  }
 }
 throw lastError;
}
export async function confirmStoryNames(key,names,env=process.env){
 const groomName=String(names.groomName||'').trim(),brideName=String(names.brideName||'').trim();
 if(!groomName||!brideName||groomName.length>80||brideName.length>80)throw new HttpError(400,'Confirm both names, up to 80 characters each.');
 const record=await loadStory(key,env);
 const old=record.value.names;
 if(old?.groomName!==groomName||old?.brideName!==brideName){
  record.value.names={groomName,brideName,revision:randomUUID(),confirmedAt:new Date().toISOString()};
  if(record.value.board){record.value.board.locked=false;record.value.board.revisionPending=true;}
  delete record.value.approval;
 }
 await saveStory(key,record,env);
 return record.value;
}
export function validateManifest(manifest){
 if(manifest?.version!==SEGMENTED_VERSION||!manifest.approvalRevision||!manifest.names?.revision||!manifest.names.groomName||!manifest.names.brideName||!manifest.identityRevision||manifest.scenes?.length!==5)throw new HttpError(409,'Approve all ten current storyboard endpoints before generating.');
 manifest.scenes.forEach((scene,i)=>{
  if(scene.approvalRevision!==manifest.approvalRevision||scene.index!==i+1||scene.duration!==3||!scene.prompt?.trim()||scene.prompt.length>4096)throw new HttpError(409,'Invalid approved scene '+(i+1));
  for(const side of ['first','last'])if(!scene[side]?.blobUrl||!scene[side]?.sha256)throw new HttpError(409,'Missing approved endpoint for scene '+(i+1));
 });
 if(manifest.scenes[4].last.sha256!==manifest.finalAssetHash)throw new HttpError(409,'Final endpoint does not match the locked identity image.');
 return manifest;
}
