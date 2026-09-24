// Loose image-mix adapters for Assembly Chat. Same return shape across providers.
import {put} from '@vercel/blob';
import {HttpError} from './core.mjs';
import {resolveReferenceImage,normalizeReferenceImage,preferPublicImageUrl,resolveReplicateImageUrl} from './assembly-ai.mjs';
import {PLATE_MODEL} from './assembly-template1-prompts.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';

function assertHttpUrl(value,label='URL'){
 const raw=String(value||'').trim();
 let parsed;
 try{parsed=new URL(raw);}catch{throw new HttpError(400,label+' must be a valid http(s) URL.');}
 if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new HttpError(400,label+' must be http(s).');
 return parsed.toString();
}

function buildMixPrompt({styleTwist='',peopleNote='',extraPrompt='',refCount=0}={}){
 const parts=[
  'Create a single premium wedding invitation hero still in vertical 9:16.',
  'Default look: romantic anime / anime-cinematic illustration — soft light, expressive faces, elegant wardrobe, invitation-poster quality.',
  'Keep the reference composition, palette, wardrobe, and floral language unless the style twist asks otherwise.',
  'No readable text, no watermark, no logo, no UI chrome.'
 ];
 if(styleTwist)parts.push('Style twist: '+String(styleTwist).trim().slice(0,600));
 if(peopleNote)parts.push('People / occasion refs: '+String(peopleNote).trim().slice(0,600));
 if(refCount>0)parts.push('Blend identity and wardrobe cues from '+refCount+' attached reference image(s) into the scene naturally.');
 if(extraPrompt)parts.push(String(extraPrompt).trim().slice(0,800));
 return parts.join(' ');
}

async function ensurePublicImageUrl(imageUrl,{env,fetchImpl}={}){
 const resolved=normalizeReferenceImage(await resolveReferenceImage(imageUrl,{fetchImpl}));
 const publicUrl=preferPublicImageUrl(resolved);
 if(publicUrl&&/^https?:\/\//i.test(publicUrl))return {url:publicUrl,resolved};
 return {url:await resolveReplicateImageUrl(resolved,{env,fetchImpl}),resolved};
}

async function mixViaReplicate({baseImageUrl,prompt,env,fetchImpl,sleepImpl,onTick}){
 const {url}=await ensurePublicImageUrl(baseImageUrl,{env,fetchImpl});
 // Chat mix must stay on xAI Imagine (PLATE_MODEL) — gpt-image-2.5-flare routinely blows the chat maxDuration and leaves a dangling tool call.
 const result=await runReplicateImage({
  prompt,
  image:url,
  model:PLATE_MODEL,
  env,
  fetchImpl,
  sleepImpl,
  onTick,
  role:'mix'
 });
 return {
  urls:[result.url],
  provider:'replicate',
  predictionId:result.predictionId||null,
  costUsd:result.costUsd??null
 };
}

async function mixViaOpenAI({baseImageUrl,prompt,env,fetchImpl}){
 if(!env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured (OPENAI_API_KEY).');
 const image=normalizeReferenceImage(await resolveReferenceImage(baseImageUrl,{fetchImpl}));
 const form=new FormData();
 form.append('model',env.ASSEMBLY_CHAT_IMAGE_MODEL||'gpt-image-1');
 form.append('prompt',prompt.slice(0,3000));
 form.append('size','1024x1536');
 form.append('image',new Blob([image.buffer],{type:image.contentType||'image/jpeg'}),'ref.jpg');
 const res=await fetchImpl('https://api.openai.com/v1/images/edits',{
  method:'POST',
  headers:{Authorization:'Bearer '+env.OPENAI_API_KEY},
  body:form
 });
 const body=await res.json().catch(()=>({}));
 if(!res.ok){
  const detail=String(body?.error?.message||body?.error||res.status);
  throw new HttpError(502,'OpenAI image mix failed: '+detail.slice(0,300));
 }
 const item=Array.isArray(body.data)?body.data[0]:null;
 let outUrl=item?.url||'';
 if(!outUrl&&item?.b64_json){
  const buf=Buffer.from(item.b64_json,'base64');
  if(!env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'OpenAI returned inline image data but BLOB_READ_WRITE_TOKEN is missing.');
  const blob=await put('assembly-chat/mix-'+Date.now()+'.png',buf,{
   access:'public',
   contentType:'image/png',
   token:env.BLOB_READ_WRITE_TOKEN
  });
  outUrl=blob.url;
 }
 if(!outUrl)throw new HttpError(502,'OpenAI image mix returned no file.');
 return {urls:[outUrl],provider:'openai',predictionId:null,costUsd:null};
}

async function mixViaXai({baseImageUrl,prompt,env,fetchImpl}){
 // Direct xAI Imagine API (not Replicate) — used only after the host approves fallback.
 if(!env.XAI_API_KEY)throw new HttpError(503,'xAI is not configured (XAI_API_KEY).');
 const {url}=await ensurePublicImageUrl(baseImageUrl,{env,fetchImpl});
 const model=env.ASSEMBLY_CHAT_XAI_IMAGE_MODEL||'grok-imagine-image';
 const res=await fetchImpl('https://api.x.ai/v1/images/edits',{
  method:'POST',
  headers:{
   Authorization:'Bearer '+env.XAI_API_KEY,
   'Content-Type':'application/json'
  },
  body:JSON.stringify({
   model,
   prompt:String(prompt||'').slice(0,4000),
   image:{url,type:'image_url'},
   aspect_ratio:'9:16',
   n:1
  })
 });
 const body=await res.json().catch(()=>({}));
 if(!res.ok){
  const detail=String(body?.error?.message||body?.error||body?.detail||res.status);
  throw new HttpError(502,'xAI image mix failed: '+detail.slice(0,300));
 }
 const item=Array.isArray(body.data)?body.data[0]:null;
 let outUrl=item?.url||'';
 if(!outUrl&&item?.b64_json){
  const buf=Buffer.from(item.b64_json,'base64');
  if(!env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'xAI returned inline image data but BLOB_READ_WRITE_TOKEN is missing.');
  const blob=await put('assembly-chat/mix-xai-'+Date.now()+'.png',buf,{
   access:'public',
   contentType:'image/png',
   token:env.BLOB_READ_WRITE_TOKEN
  });
  outUrl=blob.url;
 }
 if(!outUrl)throw new HttpError(502,'xAI image mix returned no file.');
 return {urls:[outUrl],provider:'xai',predictionId:null,costUsd:null};
}

/**
 * Mix pin + optional refs into one or more hero candidates.
 * provider: 'auto' | 'replicate' | 'openai' | 'xai'
 */
export async function mixAssemblyImage({
 pinUrl,
 referenceUrls=[],
 styleTwist='',
 peopleNote='',
 extraPrompt='',
 provider='auto',
 env=process.env,
 fetchImpl=fetch,
 sleepImpl,
 onTick
}={}){
 const base=assertHttpUrl(pinUrl||referenceUrls[0],'Pin or reference image');
 const refs=(Array.isArray(referenceUrls)?referenceUrls:[]).map(u=>assertHttpUrl(u,'Reference image')).filter(u=>u!==base);
 const prompt=buildMixPrompt({styleTwist,peopleNote,extraPrompt,refCount:refs.length});
 const wanted=String(provider||'auto').toLowerCase();
 const order=wanted==='auto'
  ?['replicate']
  :[wanted];

 let lastError=null;
 for(const name of order){
  try{
   if(name==='openai')return await mixViaOpenAI({baseImageUrl:base,prompt,env,fetchImpl});
   if(name==='xai')return await mixViaXai({baseImageUrl:base,prompt,env,fetchImpl});
   if(name==='replicate')return await mixViaReplicate({baseImageUrl:base,prompt,env,fetchImpl,sleepImpl,onTick});
   throw new HttpError(400,'Unknown image provider: '+name);
  }catch(error){
   lastError=error;
   if(wanted!=='auto')throw error;
   console.error('assembly image mix provider failed',name,error?.message||error);
  }
 }
 throw lastError||new HttpError(502,'Image mix failed on all providers.');
}

export async function uploadAssemblyChatImage(dataUrl,{env=process.env,prefix='assembly-chat'}={}){
 if(!env.BLOB_READ_WRITE_TOKEN)throw new HttpError(503,'Photo uploads are not configured (BLOB_READ_WRITE_TOKEN).');
 if(typeof dataUrl!=='string')throw new HttpError(400,'Choose an image.');
 const match=/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
 if(!match)throw new HttpError(400,'Use a JPEG, PNG, or WebP image.');
 const ext=match[1].toLowerCase()==='jpg'?'jpeg':match[1].toLowerCase();
 const bytes=Buffer.from(match[2],'base64');
 if(bytes.length<64||bytes.length>8*1024*1024)throw new HttpError(413,'Each chat image must be between 64B and 8MB.');
 const pathname=String(prefix||'assembly-chat').replace(/[^a-z0-9/_-]/gi,'').replace(/^\/+|\/+$/g,'')+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
 const blob=await put(pathname,bytes,{
  access:'public',
  contentType:'image/'+ext,
  token:env.BLOB_READ_WRITE_TOKEN
 });
 return {url:blob.url,bytes:bytes.length,contentType:'image/'+ext};
}

export {buildMixPrompt,assertHttpUrl};
