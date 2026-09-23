// Template 1 generation workers: Replicate stills + hero video, xAI opening. Spend ledger + moderation stop.
import {HttpError} from './core.mjs';
import {runGrokImagineVideo,runXaiImagineVideo,downloadVideoBuffer} from './assembly-ai.mjs';
import {IMAGE_MODEL,HERO_SECONDS,OPENING_SECONDS} from './assembly-template1-prompts.mjs';

export const COSTS=Object.freeze({
 still:0.02,
 heroVideoPerSecond:0.08,
 openingPerSecond:0.14
});

export class ModerationError extends Error{
 constructor(message,role){super(message);this.name='ModerationError';this.role=role;this.moderated=true;}
}
export function isModerationError(error){
 return Boolean(error&&(error.moderated||error.name==='ModerationError'))||/moderat|nsfw|safety|flagged|blocked/i.test(String(error?.message||''));
}

export function estimateCost(role,{duration}={}){
 switch(role){
  case 'hero-video':return +(COSTS.heroVideoPerSecond*(Number(duration)||HERO_SECONDS)).toFixed(2);
  case 'opening-video':return +(COSTS.openingPerSecond*(Number(duration)||OPENING_SECONDS)).toFixed(2);
  default:return COSTS.still;
 }
}

export function createLedger(budgetUsd=4){
 const budget=Number(budgetUsd)>0?Number(budgetUsd):4;
 const entries=[];
 const ledger={
  budget,
  get used(){return +entries.reduce((sum,e)=>sum+e.usd,0).toFixed(4);},
  get remaining(){return +(budget-ledger.used).toFixed(4);},
  entries,
  canAfford(estimate){return ledger.remaining-Number(estimate||0)>=-1e-9;},
  reserve(role,estimate){
   if(!ledger.canAfford(estimate))throw new HttpError(402,'Budget stop: '+role+' needs ~$'+Number(estimate).toFixed(2)+' but only $'+ledger.remaining.toFixed(2)+' of $'+budget.toFixed(2)+' remains.');
  },
  charge(role,usd,meta={}){
   const amount=Number(usd)||0;
   entries.push({role,usd:+amount.toFixed(4),at:new Date().toISOString(),...meta});
   return ledger.snapshot();
  },
  snapshot(){return {budget,used:ledger.used,remaining:ledger.remaining,entries:entries.slice()};}
 };
 return ledger;
}

async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

function replicateToken(env){
 const token=env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY||'';
 if(!token)throw new HttpError(503,'Replicate is not configured (REPLICATE_API_TOKEN).');
 return token;
}

/** Flatten Replicate / provider error bodies into an operator-readable snippet. */
export function formatProviderError(status,body){
 const parts=[];
 if(status)parts.push('HTTP '+status);
 if(!body||typeof body!=='object'){
  if(typeof body==='string'&&body.trim())parts.push(body.trim().slice(0,300));
  return (parts.join(' — ')||'no provider body').slice(0,450);
 }
 if(typeof body.detail==='string')parts.push(body.detail);
 else if(Array.isArray(body.detail)){
  parts.push(body.detail.map(item=>{
   if(typeof item==='string')return item;
   if(item&&typeof item==='object')return String(item.msg||item.message||item.type||JSON.stringify(item));
   return String(item);
  }).filter(Boolean).join('; '));
 }
 if(typeof body.error==='string')parts.push(body.error);
 else if(body.error&&typeof body.error==='object')parts.push(String(body.error.message||JSON.stringify(body.error)));
 if(typeof body.title==='string')parts.push(body.title);
 if(typeof body.message==='string')parts.push(body.message);
 if(typeof body.status==='string'&&body.status!=='succeeded')parts.push(body.status);
 return (parts.filter(Boolean).join(' — ')||'no provider body').slice(0,450);
}

/** Replicate image edit (xai/grok-imagine-image): single prompt + source image URL, 9:16. */
export async function runReplicateImage({prompt,image,env=process.env,fetchImpl=fetch,sleepImpl=sleep,onTick,role='still'}={}){
 const token=replicateToken(env);
 if(!image)throw new HttpError(400,'Replicate image edit needs a source image URL.');
 const create=await fetchImpl('https://api.replicate.com/v1/models/'+IMAGE_MODEL+'/predictions',{
  method:'POST',
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({input:{prompt:String(prompt||'').trim(),image:String(image),aspect_ratio:'9:16'}})
 });
 let prediction=await create.json().catch(()=>({}));
 if(!create.ok&&create.status!==201){
  const detail=formatProviderError(create.status,prediction);
  console.error('Replicate image create failed',role,detail);
  throw new HttpError(502,role+' image generation failed to start: '+detail);
 }
 const id=prediction.id;
 if(!id){
  const detail=formatProviderError(create.status,prediction);
  throw new HttpError(502,role+' image generation returned no prediction id: '+detail);
 }
 const started=Date.now();
 while(prediction.status==='starting'||prediction.status==='processing'||prediction.status==='queued'){
  if(typeof onTick==='function')onTick(prediction);
  if(Date.now()-started>8*60*1000)throw new HttpError(504,role+' image generation timed out after 8m (last status: '+String(prediction.status||'?')+').');
  await sleepImpl(2000);
  const poll=await fetchImpl('https://api.replicate.com/v1/predictions/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+token}});
  prediction=await poll.json().catch(()=>({}));
  if(!poll.ok){
   const detail=formatProviderError(poll.status,prediction);
   console.error('Replicate image poll failed',role,detail);
   throw new HttpError(502,role+' image status check failed: '+detail);
  }
 }
 if(prediction.status!=='succeeded'){
  const detail=formatProviderError(0,{error:prediction.error,status:prediction.status,detail:prediction.detail});
  if(/moderat|nsfw|safety|flagged|sensitive/i.test(detail))throw new ModerationError(role+' image was blocked by moderation: '+detail,role);
  throw new HttpError(502,role+' image generation failed: '+detail);
 }
 const out=prediction.output;
 const url=typeof out==='string'?out:Array.isArray(out)?out[0]:out?.url||'';
 if(!url)throw new HttpError(502,role+' image generation returned no file (prediction '+id+').');
 const buffer=await downloadVideoBuffer(url,{fetchImpl});
 return {buffer,url,predictionId:id,costUsd:COSTS.still};
}

/** Hero loop: Replicate xai/grok-imagine-video-1.5 from the hero still URL. Moderation → ModerationError. */
export async function runHeroVideo({imageUrl,prompt,env=process.env,fetchImpl=fetch,onTick}={}){
 try{
  const result=await runGrokImagineVideo({imageUrl,prompt,duration:HERO_SECONDS,env,fetchImpl,onTick});
  return {...result,costUsd:estimateCost('hero-video')};
 }catch(error){
  if(isModerationError(error))throw new ModerationError('hero video was blocked by moderation.','hero-video');
  throw error;
 }
}

/** Opening: xAI first+last only. Never fall back to Replicate without Ashok's permission. */
export async function runOpeningVideo({firstDataUrl,lastDataUrl,prompt,env=process.env,fetchImpl=fetch,sleepImpl,onTick}={}){
 if(!firstDataUrl||!lastDataUrl)throw new HttpError(400,'Opening needs FIRST and LAST stills.');
 try{
  const result=await runXaiImagineVideo({
   image:{url:firstDataUrl},
   lastFrame:{url:lastDataUrl},
   prompt,
   duration:OPENING_SECONDS,
   env,
   fetchImpl,
   sleepImpl,
   onTick
  });
  return {...result,costUsd:result.costUsd??estimateCost('opening-video'),provider:'xai'};
 }catch(error){
  if(isModerationError(error))throw new ModerationError('opening video was blocked by moderation.','opening-video');
  throw error;
 }
}

/** Optional no-text QA on LAST via OpenAI vision. Returns true when readable text is detected. Skips (false) when not configured. */
export async function detectBakedText(buffer,{env=process.env,openaiClient,qaPrompt}={}){
 if(!env.OPENAI_API_KEY&&!openaiClient)return {checked:false,hasText:false};
 let client=openaiClient;
 if(!client){
  const {default:OpenAI}=await import('openai');
  client=new OpenAI({apiKey:env.OPENAI_API_KEY,timeout:60000,maxRetries:1});
 }
 const dataUrl='data:image/jpeg;base64,'+Buffer.from(buffer).toString('base64');
 try{
  const response=await client.responses.create({
   model:env.ASSEMBLY_QA_MODEL||env.ASSEMBLY_PROMPT_MODEL||'gpt-6-astra',
   input:[{role:'user',content:[{type:'input_text',text:qaPrompt},{type:'input_image',image_url:dataUrl}]}]
  });
  const text=String(response?.output_text||'').trim().toUpperCase();
  return {checked:true,hasText:text.startsWith('YES')};
 }catch(error){
  console.error('Template 1 no-text QA skipped',error?.message||error);
  return {checked:false,hasText:false};
 }
}

export function dataUrlFromJpeg(buffer){
 return 'data:image/jpeg;base64,'+Buffer.from(buffer).toString('base64');
}
