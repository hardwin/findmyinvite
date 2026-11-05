export const IMAGE_UPLOAD_BYTES=1048576;
export const IMAGE_SOURCE_BYTES=50*1048576;
const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};

// Browser MIME hints (including files staged by older versions) can be wrong.
async function imageSource(file){
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const ascii=(start,end)=>String.fromCharCode(...b.slice(start,end));
 const type=b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':
  b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)?'image/png':
  ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'?'image/webp':file.type;
 return type===file.type?file:new Blob([file],{type});
}

async function decodeImage(file,env){
 if(env.createImageBitmap){
  try{const bitmap=await env.createImageBitmap(file);return {source:bitmap,width:bitmap.width,height:bitmap.height,dispose:()=>bitmap.close()};}catch{/* Some mobile browsers support more formats through <img>. */}
 }
 const url=env.URL.createObjectURL(file),image=new env.Image();
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('This photo could not be opened. Please choose a JPG, PNG or WebP photo. For HEIC photos, export a JPG from Photos and try again.'));image.src=url;});
  return {source:image,width:image.naturalWidth,height:image.naturalHeight,dispose:()=>{image.src='';env.URL.revokeObjectURL(url);}};
 }catch(error){env.URL.revokeObjectURL(url);throw error;}
}

// Keep the original photo on the device; resize and encode only the uploaded copy.
export async function optimise(file,kind='image',env=globalThis){
 if(kind!=='image')return file;
 if(!file.size)throw Error('This photo is empty. Please select it again.');
 if(file.size>IMAGE_SOURCE_BYTES)throw Error('Please choose a photo under 50 MB. Large phone photos are resized automatically.');
 const decoded=await decodeImage(await imageSource(file),env);
 const canvas=env.document.createElement('canvas');
 try{
  if(!decoded.width||!decoded.height)throw Error('This photo could not be opened. Please choose another photo.');
  const context=canvas.getContext('2d');
  if(!context)throw Error('Your browser could not prepare this photo. Please reopen this page in Safari or Chrome and try again.');
  const longest=Math.max(decoded.width,decoded.height);
  let requestedType='image/webp';
  for(let edge=Math.min(1800,longest);;edge=Math.max(320,Math.floor(edge*.75))){
   const scale=Math.min(1,edge/longest);
   canvas.width=Math.max(1,Math.round(decoded.width*scale));
   canvas.height=Math.max(1,Math.round(decoded.height*scale));
   const draw=()=>{context.clearRect(0,0,canvas.width,canvas.height);if(requestedType==='image/jpeg'){context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);}context.drawImage(decoded.source,0,0,canvas.width,canvas.height);};
   draw();
   for(const quality of [.86,.76,.66]){
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,requestedType,quality));
    // Safari can return PNG for a WebP request. Never relabel its bytes as WebP.
    // Use JPEG compression when that PNG is too large (PNG ignores quality).
    if(requestedType==='image/webp'&&(!blob||blob.type!=='image/webp')&&(!blob||blob.size>IMAGE_UPLOAD_BYTES)){
     requestedType='image/jpeg';draw();
     blob=await new Promise(resolve=>canvas.toBlob(resolve,requestedType,quality));
    }
    if(blob&&blob.size&&blob.size<=IMAGE_UPLOAD_BYTES&&extensions[blob.type]){
     const name=(file.name||'photo').replace(/\.[^.]+$/,'');
     return new File([blob],name+'.'+extensions[blob.type],{type:blob.type,lastModified:file.lastModified});
    }
    if(blob?.type==='image/png')break;
   }
   if(edge<=320)break;
  }
  throw Error('Your browser could not prepare this photo. Please reopen this page in Safari or Chrome and try again.');
 }finally{decoded.dispose();canvas.width=0;canvas.height=0;}
}
