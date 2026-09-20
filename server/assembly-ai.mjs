import {createHash,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import OpenAI from 'openai';
import {HttpError} from './core.mjs';
import {fsWritesAllowed,INBOX_DIR} from './assembly.mjs';

export const MAIN_PROMPT_MAX=2500;
export const NEGATIVE_PROMPT_MAX=600;
export const OPENING_DURATION=10;
export const HERO_DURATION=6;
export const HERO_LOOP_PROMPT='static camera shot, the couple looks at each other, wind moving, eyes blink in love, hair and clothes slightly sway with wind, lights shine, petals fall, no body movements or hand movements';
export const REPLICATE_MODEL='xai/grok-imagine-video-1.5';

export const CINEMATIC_PROMPT_WRITER=`Act as a cinematic invitation-video prompt writer. Study the attached image and produce a Gemini video-generation prompt tailored to it.

OUTPUT
Return two separate copy-ready sections:
1. MAIN PROMPT: maximum 2,500 characters, including spaces.
2. NEGATIVE PROMPT: maximum 600 characters.
Check both limits before responding. No explanations.

REFERENCE USE
Treat the image as the FINAL-FRAME target only. Extract its location, architecture, visual style, characters, facial identities, clothing, poses, flowers, decorations, colors, lighting, and atmosphere. Preserve these in the ending. Exclude any reference text, signs, logos, or watermarks.

Design the journey backward from that ending. Invent a believable entrance and short connecting route appropriate to the image’s location. Do not automatically reuse a lounge, sofas, balcony, garden pergola, or wedding decorations. Every setting and prop must fit this particular reference.

VIDEO REQUIREMENTS
10 seconds, vertical 9:16, 24fps. One uninterrupted, steady eye-level forward camera move. Two physically practical reveals, natural depth and parallax, consistent geography. No cuts, dissolves, introductory portrait, scene reset, reverse motion, or camera passing through solid objects.

FIRST FRAME
At 00:00.000, show fully closed, opaque double gates or doors suited to the location. Hold closed for the first second. Their panels display exactly one centered “you are invited” and smaller “tap to open”. These are the ONLY visible words in the video. Lettering remains attached to the entrance panels and disappears when they leave view.

REVEAL STRUCTURE
00:00–00:01: Closed entrance; no characters.
00:01–00:03: Entrance opens naturally as the camera advances, revealing the connecting environment.
00:03–00:06: Continue through that environment. Foreground objects move past the edges, establishing depth.
00:06–00:09: Approach a second opaque barrier appropriate to the setting. It completely conceals the final subjects.
00:09–00:10: Second barrier opens and clears the view. Reveal the subjects for the first time and finish on the reference composition.

Choose believable hinges, sliding tracks, or curtain movement. Keep attachments intact. Place subjects close enough beyond the second barrier to reach the ending composition without a sudden zoom.

Preserve the reference subjects’ identities, outfits, relative positions, and pose. Never display their image at the beginning or paste it in as a final still.

The negative prompt must target premature character visibility, opening portraits, text on people, extra text, transitions, impossible geometry, and identity drift.`;

const jobs=new Map();
const IMAGE_MAX=12*1024*1024;
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FindMyInviteAssembly/1.0';

export function stagePercent(stage){
 const map={
  queued:0,
  fetching_image:8,
  writing_prompt:22,
  generating_opening:40,
  generating_hero:72,
  saving:92,
  done:100,
  error:0
 };
 return map[stage]??0;
}

export function stageLabel(stage,error=''){
 const map={
  queued:'Queued…',
  fetching_image:'Fetching reference image…',
  writing_prompt:'Writing cinematic prompts…',
  generating_opening:'Generating opening video…',
  generating_hero:'Generating hero loop…',
  saving:'Saving to inbox…',
  done:'Ready in inbox',
  error:error?('Failed: '+String(error).slice(0,160)):'Failed'
 };
 return map[stage]||stage;
}

export function parsePromptSections(raw){
 const text=String(raw||'').replace(/\r\n/g,'\n').trim();
 if(!text)throw new Error('Prompt writer returned empty output.');
 if(!/MAIN\s*PROMPT/i.test(text))throw new Error('Could not parse MAIN PROMPT.');
 const mainMatch=text.match(/MAIN\s*PROMPT\s*:?\s*([\s\S]*?)(?=NEGATIVE\s*PROMPT\s*:|$)/i);
 const negMatch=text.match(/NEGATIVE\s*PROMPT\s*:?\s*([\s\S]*)$/i);
 let main=(mainMatch?mainMatch[1]:'').trim();
 let negative=(negMatch?negMatch[1]:'').trim();
 main=main.replace(/^[-–—*\d.)\s]+/,'').trim();
 negative=negative.replace(/^[-–—*\d.)\s]+/,'').trim();
 if(!main)throw new Error('Could not parse MAIN PROMPT.');
 return {
  main:main.slice(0,MAIN_PROMPT_MAX),
  negative:negative.slice(0,NEGATIVE_PROMPT_MAX)
 };
}

export function buildOpeningPrompt(main,negative){
 const base=String(main||'').trim().slice(0,MAIN_PROMPT_MAX);
 const avoid=String(negative||'').trim().slice(0,NEGATIVE_PROMPT_MAX);
 if(!avoid)return base;
 const suffix='\n\nAvoid: '+avoid;
 const room=MAIN_PROMPT_MAX+800;
 return (base+suffix).slice(0,room);
}

function extractOutputText(response){
 if(!response)return '';
 if(typeof response.output_text==='string'&&response.output_text)return response.output_text;
 const chunks=[];
 for(const item of response.output||[]){
  for(const part of item.content||[]){
   if(part.type==='output_text'&&part.text)chunks.push(part.text);
   if(part.type==='text'&&part.text)chunks.push(part.text);
  }
 }
 return chunks.join('\n').trim();
}

function assertHttpUrl(raw){
 let parsed;
 try{parsed=new URL(String(raw||'').trim());}catch{throw new HttpError(400,'Paste a valid http(s) image URL.');}
 if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new HttpError(400,'Only http(s) image URLs are allowed.');
 return parsed.toString();
}

function extFromContentType(type,fallback='.jpg'){
 const t=String(type||'').toLowerCase();
 if(t.includes('png'))return '.png';
 if(t.includes('webp'))return '.webp';
 if(t.includes('gif'))return '.gif';
 if(t.includes('jpeg')||t.includes('jpg'))return '.jpg';
 return fallback;
}

function pickOgImage(html){
 const match=String(html||'').match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  ||String(html||'').match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
 return match?match[1].trim():'';
}

export async function resolveReferenceImage(imageUrl,{fetchImpl=fetch}={}){
 const start=assertHttpUrl(imageUrl);
 const first=await fetchImpl(start,{
  headers:{'User-Agent':UA,Accept:'image/*,text/html,*/*'},
  redirect:'follow'
 });
 if(!first.ok)throw new HttpError(502,'Could not fetch the reference image ('+first.status+').');
 const type=String(first.headers.get('content-type')||'').toLowerCase();
 if(type.includes('text/html')||type.includes('application/xhtml')){
  const html=await first.text();
  const og=pickOgImage(html);
  if(!og)throw new HttpError(400,'Could not find an image on that page. Paste a direct image URL or a Pinterest pin with og:image.');
  const secondUrl=new URL(og,start).toString();
  const second=await fetchImpl(secondUrl,{
   headers:{'User-Agent':UA,Accept:'image/*'},
   redirect:'follow'
  });
  if(!second.ok)throw new HttpError(502,'Could not download the resolved image ('+second.status+').');
  const buf=Buffer.from(await second.arrayBuffer());
  if(!buf.length)throw new HttpError(400,'Resolved image was empty.');
  if(buf.length>IMAGE_MAX)throw new HttpError(413,'Reference image is too large (max 12MB).');
  const ctype=String(second.headers.get('content-type')||'image/jpeg');
  return {buffer:buf,contentType:ctype,ext:extFromContentType(ctype),sourceUrl:secondUrl};
 }
 const buf=Buffer.from(await first.arrayBuffer());
 if(!buf.length)throw new HttpError(400,'Image download was empty.');
 if(buf.length>IMAGE_MAX)throw new HttpError(413,'Reference image is too large (max 12MB).');
 return {buffer:buf,contentType:type||'image/jpeg',ext:extFromContentType(type),sourceUrl:start};
}

export async function writeCinematicPrompts(image,{openaiClient,env=process.env,fetchImpl=fetch}={}){
 if(!env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured (OPENAI_API_KEY).');
 const client=openaiClient||new OpenAI({apiKey:env.OPENAI_API_KEY,timeout:120000,maxRetries:1});
 const model=env.ASSEMBLY_PROMPT_MODEL||'gpt-6-astra';
 let imageUrl;
 if(image?.dataUrl)imageUrl=image.dataUrl;
 else if(image?.buffer){
  const b64=image.buffer.toString('base64');
  const mime=(image.contentType||'image/jpeg').split(';')[0]||'image/jpeg';
  imageUrl='data:'+mime+';base64,'+b64;
 }else if(image?.url)imageUrl=image.url;
 else throw new HttpError(400,'Reference image missing for prompt writer.');

 let response;
 try{
  response=await client.responses.create({
   model,
   reasoning:{effort:'low'},
   input:[{
    role:'user',
    content:[
     {type:'input_text',text:CINEMATIC_PROMPT_WRITER},
     {type:'input_image',image_url:imageUrl}
    ]
   }]
  });
 }catch(error){
  // Fallback without reasoning for older SDK / model aliases.
  if(String(error?.message||'').toLowerCase().includes('reasoning')||error?.status===400){
   response=await client.responses.create({
    model,
    input:[{
     role:'user',
     content:[
      {type:'input_text',text:CINEMATIC_PROMPT_WRITER},
      {type:'input_image',image_url:imageUrl}
     ]
    }]
   });
  }else{
   console.error('Assembly Astra prompt failed',error?.message||error);
   throw new HttpError(502,'Prompt writer failed.');
  }
 }
 const parsed=parsePromptSections(extractOutputText(response));
 return {...parsed,openingPrompt:buildOpeningPrompt(parsed.main,parsed.negative),raw:extractOutputText(response)};
}

async function replicateAuth(env=process.env){
 const token=env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY||'';
 if(!token)throw new HttpError(503,'Replicate is not configured (REPLICATE_API_TOKEN).');
 return token;
}

function mimeFromExt(ext){
 const e=String(ext||'').toLowerCase();
 if(e==='.png')return 'image/png';
 if(e==='.webp')return 'image/webp';
 if(e==='.gif')return 'image/gif';
 return 'image/jpeg';
}

/** Detect real image format from magic bytes (Pinterest/CDN labels can lie). */
export function sniffImageFormat(buffer){
 const b=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer||[]);
 if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return {ext:'.jpg',contentType:'image/jpeg'};
 if(b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return {ext:'.png',contentType:'image/png'};
 if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return {ext:'.webp',contentType:'image/webp'};
 return null;
}

export function normalizeReferenceImage(image){
 const sniffed=sniffImageFormat(image?.buffer);
 if(!sniffed)throw new HttpError(400,'Reference must be JPEG, PNG, or WebP.');
 return {
  ...image,
  ext:sniffed.ext,
  contentType:sniffed.contentType
 };
}

export function preferPublicImageUrl(image){
 const url=String(image?.sourceUrl||'').trim();
 if(!/^https:\/\//i.test(url))return '';
 // Direct CDN / file URLs Grok can fetch. Avoid HTML pages.
 if(/\.(jpe?g|png|webp)(\?|#|$)/i.test(url))return url;
 if(/pinimg\.com\//i.test(url))return url;
 return '';
}

export async function uploadReplicateFile(buffer,filename,{contentType,env=process.env,fetchImpl=fetch}={}){
 const token=await replicateAuth(env);
 const name=filename||'reference.jpg';
 const mime=contentType||mimeFromExt(extnameSafe(name));
 const form=new FormData();
 form.append('content',new Blob([new Uint8Array(buffer)],{type:mime}),name);
 const res=await fetchImpl('https://api.replicate.com/v1/files',{
  method:'POST',
  headers:{Authorization:'Bearer '+token},
  body:form
 });
 const body=await res.json().catch(()=>({}));
 if(!res.ok){
  console.error('Replicate file upload failed',res.status,body);
  throw new HttpError(502,'Could not upload reference image to Replicate.');
 }
 const url=body?.urls?.get||body?.url||'';
 if(!url)throw new HttpError(502,'Replicate file upload returned no URL.');
 return url;
}

function extnameSafe(name){
 const m=String(name||'').toLowerCase().match(/\.[a-z0-9]+$/);
 return m?m[0]:'.jpg';
}

export async function resolveReplicateImageUrl(image,{env=process.env,fetchImpl=fetch}={}){
 const normalized=normalizeReferenceImage(image);
 const publicUrl=preferPublicImageUrl(normalized);
 if(publicUrl)return publicUrl;
 return uploadReplicateFile(normalized.buffer,'reference'+normalized.ext,{
  contentType:normalized.contentType,
  env,
  fetchImpl
 });
}

async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

export async function runGrokImagineVideo({imageUrl,prompt,duration,env=process.env,fetchImpl=fetch,onTick}={}){
 const token=await replicateAuth(env);
 const create=await fetchImpl('https://api.replicate.com/v1/models/'+REPLICATE_MODEL+'/predictions',{
  method:'POST',
  headers:{
   Authorization:'Bearer '+token,
   'Content-Type':'application/json'
  },
  body:JSON.stringify({
   input:{
    prompt:String(prompt||'').trim(),
    image:imageUrl,
    aspect_ratio:'9:16',
    resolution:'720p',
    duration:Number(duration)||OPENING_DURATION
   }
  })
 });
 let prediction=await create.json().catch(()=>({}));
 if(!create.ok&&create.status!==201){
  console.error('Replicate create failed',create.status,prediction);
  throw new HttpError(502,'Video generation failed to start.');
 }
 const id=prediction.id;
 const started=Date.now();
 while(prediction.status==='starting'||prediction.status==='processing'||prediction.status==='queued'){
  if(typeof onTick==='function')onTick(prediction);
  if(Date.now()-started>12*60*1000)throw new HttpError(504,'Video generation timed out.');
  await sleep(2500);
  const poll=await fetchImpl('https://api.replicate.com/v1/predictions/'+encodeURIComponent(id),{
   headers:{Authorization:'Bearer '+token}
  });
  prediction=await poll.json().catch(()=>({}));
  if(!poll.ok){
   console.error('Replicate poll failed',poll.status,prediction);
   throw new HttpError(502,'Video generation status check failed.');
  }
 }
 if(prediction.status!=='succeeded'){
  const detail=prediction.error||prediction.status||'unknown';
  console.error('Replicate prediction failed',detail);
  throw new HttpError(502,'Video generation failed: '+detail);
 }
 const out=prediction.output;
 const videoUrl=typeof out==='string'?out:Array.isArray(out)?out[0]:out?.url||'';
 if(!videoUrl)throw new HttpError(502,'Video generation returned no file.');
 const file=await fetchImpl(videoUrl,{headers:{Authorization:'Bearer '+token}});
 if(!file.ok)throw new HttpError(502,'Could not download generated video.');
 const buffer=Buffer.from(await file.arrayBuffer());
 if(!buffer.length)throw new HttpError(502,'Generated video was empty.');
 return {buffer,url:videoUrl,predictionId:id};
}

function stamp(){
 return new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14)+'-'+randomBytes(3).toString('hex');
}

function updateJob(job,patch){
 const prevPercent=job.percent||0;
 Object.assign(job,patch);
 if(patch.stage){
  const next=stagePercent(patch.stage);
  job.percent=patch.stage==='error'?(patch.percent!=null?patch.percent:(prevPercent||next)):next;
  job.label=stageLabel(patch.stage,patch.error||job.error||'');
 }
 job.updatedAt=Date.now();
 return job;
}

export function getGenerateJob(jobId){
 const job=jobs.get(String(jobId||''));
 if(!job)return null;
 return {
  jobId:job.id,
  status:job.status,
  stage:job.stage,
  percent:job.percent,
  label:job.label,
  opening:job.opening||null,
  hero:job.hero||null,
  error:job.error||null,
  mainPrompt:job.mainPrompt||null,
  negativePrompt:job.negativePrompt||null
 };
}

export function startGeneratePair({imageUrl,env=process.env,openaiClient,fetchImpl=fetch}={}){
 if(!fsWritesAllowed(env))throw new HttpError(503,'AI generate is local-only. Run Assembly on your Cursor machine.');
 if(!env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured (OPENAI_API_KEY).');
 if(!(env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY))throw new HttpError(503,'Replicate is not configured (REPLICATE_API_TOKEN).');
 assertHttpUrl(imageUrl);
 const id=randomBytes(8).toString('hex');
 const job={
  id,
  status:'running',
  stage:'queued',
  percent:0,
  label:stageLabel('queued'),
  opening:null,
  hero:null,
  error:null,
  mainPrompt:null,
  negativePrompt:null,
  createdAt:Date.now(),
  updatedAt:Date.now()
 };
 jobs.set(id,job);

 void (async()=>{
  try{
   updateJob(job,{stage:'fetching_image'});
   const image=normalizeReferenceImage(await resolveReferenceImage(imageUrl,{fetchImpl}));
   await mkdir(INBOX_DIR,{recursive:true});

   updateJob(job,{stage:'writing_prompt'});
   const prompts=await writeCinematicPrompts(image,{openaiClient,env,fetchImpl});
   job.mainPrompt=prompts.main;
   job.negativePrompt=prompts.negative;

   updateJob(job,{stage:'generating_opening'});
   const replicateImage=await resolveReplicateImageUrl(image,{env,fetchImpl});
   const opening=await runGrokImagineVideo({
    imageUrl:replicateImage,
    prompt:prompts.openingPrompt,
    duration:OPENING_DURATION,
    env,
    fetchImpl
   });

   updateJob(job,{stage:'generating_hero'});
   const hero=await runGrokImagineVideo({
    imageUrl:replicateImage,
    prompt:HERO_LOOP_PROMPT,
    duration:HERO_DURATION,
    env,
    fetchImpl
   });

   updateJob(job,{stage:'saving'});
   const tag=stamp();
   const openingName='gen-'+tag+'-opening.mp4';
   const heroName='gen-'+tag+'-hero.mp4';
   await writeFile(join(INBOX_DIR,openingName),opening.buffer);
   await writeFile(join(INBOX_DIR,heroName),hero.buffer);
   updateJob(job,{
    status:'done',
    stage:'done',
    opening:openingName,
    hero:heroName
   });
  }catch(error){
   const message=error instanceof HttpError?error.message:(error?.message||'Generate failed.');
   console.error('Assembly generate-pair failed',message);
   updateJob(job,{status:'error',stage:'error',error:message,percent:job.percent||0});
  }
 })();

 return {jobId:id};
}

/** Pure helpers exported for tests — hash unused but keeps deterministic stamp options. */
export function jobFingerprint(imageUrl){
 return createHash('sha256').update(String(imageUrl||'')).digest('hex').slice(0,12);
}
