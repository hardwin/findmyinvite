import {get,put} from '@vercel/blob';
const memory=new Map();
export const shareImagePath=share=>'invitation-share/'+share.row.id+'/'+share.revision+'.jpg';
function remember(path,bytes){if(memory.size>=32)memory.delete(memory.keys().next().value);memory.set(path,{bytes,until:Date.now()+300000});}
export async function imageBytes(stream,limit=2000000){
 const reader=stream.getReader(),chunks=[];let length=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('Image too large');chunks.push(Buffer.from(value));}}finally{await reader.cancel();}
 return Buffer.concat(chunks);
}
export async function cachedShareImage(share){
 const path=shareImagePath(share),hit=memory.get(path);if(hit?.until>Date.now())return hit.bytes;
 let blob;try{blob=await get(path,{access:'private',useCache:true});}catch(error){if(error?.name!=='BlobNotFoundError')console.error('Share cache unavailable',share.row.id);}
 if(blob?.statusCode!==200)return null;
 const bytes=await imageBytes(blob.stream);remember(path,bytes);return bytes;
}
export async function storeShareImage(share,bytes){
 const path=shareImagePath(share);await put(path,bytes,{access:'private',contentType:'image/jpeg',addRandomSuffix:false,allowOverwrite:true}).catch(()=>console.error('Share cache write deferred',share.row.id));remember(path,bytes);
}
