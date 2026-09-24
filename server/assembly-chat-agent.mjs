// Assembly Chat agent: xAI Grok + tools for chat → single hero image → website (Template 1).
import {tool,stepCountIs} from 'ai';
import {createOpenAI} from '@ai-sdk/openai';
import {z} from 'zod';
import {HttpError} from './core.mjs';
import {resolveReferenceImage,normalizeReferenceImage,preferPublicImageUrl} from './assembly-ai.mjs';
import {listMusicLibrary} from './music-library.mjs';
import {mixAssemblyImage,uploadAssemblyChatImage} from './assembly-image-mix.mjs';
import {
 startTemplate1Job,
 loadTemplate1Job,
 cancelTemplate1Job,
 proceedTemplate1Job
} from './assembly-template1.mjs';
import {
 cloudAssemblyEnabled,
 startCloudTemplate1Job,
 getCloudTemplate1Job,
 cancelCloudTemplate1Job,
 resumeCloudPush
} from './assembly-cloud.mjs';
import {loadPremiumParents,fsWritesAllowed} from './assembly.mjs';

/** Locked brain: xAI Grok only. No OpenAI / Sol. */
export const ASSEMBLY_CHAT_PROVIDER='xai';
export const ASSEMBLY_CHAT_MODEL=process.env.ASSEMBLY_CHAT_MODEL||'grok-4-1-fast-non-reasoning';

export const ASSEMBLY_CHAT_SYSTEM=`You are Akay — a Grok agent (xAI) on FindMyInvite Assembly.

WHO YOU ARE
- You are the same Grok family that builds this product: warm, sharp, short, agentic.
- You speak to Ashok at the /assembly desk. Never dump SQL, file trees, migrations, or secrets.
- Brain = xAI Grok only. Never mention OpenAI, Sol, or GPT.

PRODUCT MISSION — Chat → Single Image → Website
1) Collect one source (Pinterest pin URL **or** Attach / Camera photo).
2) Optional: Style Twist, extra refs, bride/groom/baby refs (offer Skip each time).
3) VIBE name = template display name (required before website).
4) Music from library (optional — default first track — offer Skip).
5) Call mix_image until ONE hero looks right, then lock_final_image (single locked image).
6) Call start_template1 → that locked image becomes the invite website (preview + GitHub branch).

FIRST MESSAGE / HELLOS
- On hi/hello/hey: greet starting with "Hi", say you are Akay (Grok Assembly Coach), ask for a Pinterest pin or Attach / Camera.
- Do NOT call tools on a bare hello.
- Exception: if they ask for music first, call list_music immediately, then ask for the pin.

TOOL POLICY (agentic — you MUST use tools, never pretend)
- resolve_pin — Pinterest or image URL
- upload_ref — only for pasted data-URLs (UI uploads are already hosted)
- list_music — songs / library — call immediately, no permission ask
- list_parents — which Premium parent clones — call immediately
- mix_image — after base image (+ optional refs/twist); then Lock / Remix / Retry
- lock_final_image — when they confirm the ONE hero
- start_template1 — only after lock + VIBE (music optional)
- get_job_status / cancel_job / retry_phase — Template 1 ops
- Never ask "shall I call the tool?" — just call it when intent matches.

RULES
- Ask ONE clear question at a time.
- Never invent image URLs, preview links, GitHub branches, or spend numbers — only report tool output.
- Opening video in Template 1 is xAI-only (no silent Replicate fallback). Say so clearly on xAI failure.
- After start_template1, point at the live job card + Cancel / Retry / Pipeline.`;

function previewFromResolved(resolved){
 const preferred=preferPublicImageUrl(resolved);
 if(preferred)return preferred;
 if(resolved?.sourceUrl&&/^https:\/\//i.test(resolved.sourceUrl))return resolved.sourceUrl;
 if(resolved?.buffer){
  const mime=(resolved.contentType||'image/jpeg').split(';')[0]||'image/jpeg';
  return 'data:'+mime+';base64,'+Buffer.from(resolved.buffer).toString('base64');
 }
 return '';
}

function assertHttpUrl(value){
 let parsed;
 try{parsed=new URL(String(value||''));}catch{throw new HttpError(400,'URL must be http(s).');}
 if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new HttpError(400,'URL must be http(s).');
 return parsed.toString();
}

export function buildAssemblyChatTools({env=process.env,fetchImpl=fetch,parentId=''}={}){
 return {
  resolve_pin:tool({
   description:'Resolve a Pinterest pin or direct image URL into a previewable https image.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Pinterest or direct https image URL')
   }),
   execute:async({pinUrl})=>{
    const resolved=normalizeReferenceImage(await resolveReferenceImage(pinUrl,{fetchImpl}));
    return {
     ok:true,
     pinUrl,
     sourceUrl:resolved.sourceUrl||pinUrl,
     previewUrl:previewFromResolved(resolved),
     bytes:resolved.buffer?.length||0,
     contentType:resolved.contentType||'image/jpeg'
    };
   }
  }),

  upload_ref:tool({
   description:'Persist a data-URL image to public Blob storage for mixing.',
   inputSchema:z.object({
    dataUrl:z.string().describe('data:image/jpeg|png|webp;base64,...'),
    kind:z.enum(['ref','person','hero']).optional()
   }),
   execute:async({dataUrl,kind})=>{
    const uploaded=await uploadAssemblyChatImage(dataUrl,{env,prefix:'assembly-chat/'+(kind||'ref')});
    return {ok:true,kind:kind||'ref',...uploaded};
   }
  }),

  list_music:tool({
   description:'List tap-to-play tracks from the Assembly music library.',
   inputSchema:z.object({}),
   execute:async()=>{
    const tracks=await listMusicLibrary();
    return {
     ok:true,
     tracks:tracks.map(t=>({
      id:t.id,
      displayName:t.displayName,
      url:t.url,
      durationS:t.durationS
     })),
     defaultId:tracks[0]?.id||''
    };
   }
  }),

  list_parents:tool({
   description:'List Premium cinematic parent templates available for Assembly.',
   inputSchema:z.object({}),
   execute:async()=>{
    const parents=await loadPremiumParents();
    return {
     ok:true,
     parents:parents.map(p=>({id:p.id,name:p.name||p.id})),
     defaultId:parentId||parents[parents.length-1]?.id||parents[0]?.id||''
    };
   }
  }),

  mix_image:tool({
   description:'Mix the pin/base image with optional refs and a style twist into a new hero candidate.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Base pin or image URL'),
    referenceUrls:z.array(z.string().url()).optional(),
    styleTwist:z.string().optional(),
    peopleNote:z.string().optional(),
    extraPrompt:z.string().optional(),
    provider:z.enum(['auto','replicate','openai','xai']).optional()
   }),
   execute:async(input)=>{
    const result=await mixAssemblyImage({
     pinUrl:input.pinUrl,
     referenceUrls:input.referenceUrls||[],
     styleTwist:input.styleTwist||'',
     peopleNote:input.peopleNote||'',
     extraPrompt:input.extraPrompt||'',
     provider:input.provider||'auto',
     env,
     fetchImpl
    });
    return {
     ok:true,
     urls:result.urls,
     provider:result.provider,
     predictionId:result.predictionId,
     costUsd:result.costUsd,
     message:'Candidate ready — ask Lock / Remix / Retry.'
    };
   }
  }),

  lock_final_image:tool({
   description:'Lock the chosen hero image URL for Template 1. Call before start_template1.',
   inputSchema:z.object({
    imageUrl:z.string().url(),
    note:z.string().optional()
   }),
   execute:async({imageUrl,note})=>{
    assertHttpUrl(imageUrl);
    return {
     ok:true,
     locked:true,
     heroImageUrl:imageUrl,
     note:note||'',
     message:'Final hero locked. Ask for VIBE name + music (or skip music), then start_template1.'
    };
   }
  }),

  start_template1:tool({
   description:'Start Template 1 after lock_final_image + VIBE name.',
   inputSchema:z.object({
    displayName:z.string().min(2).max(80),
    heroImageUrl:z.string().url(),
    pinUrl:z.string().url().optional(),
    musicId:z.string().optional(),
    parentId:z.string().optional(),
    budgetUsd:z.number().min(0.01).max(50).optional(),
    styleTwist:z.string().optional()
   }),
   execute:async(input)=>{
    const tracks=await listMusicLibrary();
    const musicId=input.musicId||tracks[0]?.id;
    if(!musicId)throw new HttpError(400,'Music library is empty.');
    const parents=await loadPremiumParents();
    const chosenParent=input.parentId||parentId||parents[parents.length-1]?.id||parents[0]?.id;
    const payload={
     pinUrl:input.pinUrl||input.heroImageUrl,
     heroImageUrl:input.heroImageUrl,
     displayName:input.displayName,
     parentId:chosenParent,
     musicId,
     budgetUsd:input.budgetUsd??4,
     promptParams:input.styleTwist?{styleTwist:String(input.styleTwist).slice(0,300)}:undefined
    };
    if(cloudAssemblyEnabled()){
     const started=await startCloudTemplate1Job(payload,{env,fetchImpl});
     return {
      ok:true,
      cloud:true,
      jobId:started.jobId,
      spend:started.spend||null,
      message:'Cloud Template 1 started. Poll get_job_status for live percent/label.'
     };
    }
    if(!fsWritesAllowed(env))throw new HttpError(503,'Template 1 needs local writes or Cloud Assembly (ASSEMBLY_CLOUD=1).');
    const started=startTemplate1Job(payload,{env,fetchImpl});
    return {
     ok:true,
     cloud:false,
     jobId:started.jobId,
     spend:started.spend||null,
     message:'Template 1 started locally. Poll get_job_status for live percent/label.'
    };
   }
  }),

  get_job_status:tool({
   description:'Fetch live Template 1 job status (percent, label, stills, preview links).',
   inputSchema:z.object({jobId:z.string().min(6)}),
   execute:async({jobId})=>{
    if(cloudAssemblyEnabled()){
     const job=await getCloudTemplate1Job(jobId);
     if(!job)throw new HttpError(404,'Template 1 job not found.');
     return {ok:true,cloud:true,...job};
    }
    const job=await loadTemplate1Job(jobId);
    if(!job)throw new HttpError(404,'Template 1 job not found.');
    return {ok:true,cloud:false,...job};
   }
  }),

  cancel_job:tool({
   description:'Cancel a running Template 1 job.',
   inputSchema:z.object({jobId:z.string().min(6)}),
   execute:async({jobId})=>{
    if(cloudAssemblyEnabled())return {ok:true,...await cancelCloudTemplate1Job(jobId)};
    return {ok:true,...cancelTemplate1Job(jobId)};
   }
  }),

  retry_phase:tool({
   description:'Retry / resume after failure. Local proceed, or cloud resume-push.',
   inputSchema:z.object({
    jobId:z.string().min(6),
    mode:z.enum(['proceed','resume-push']).optional()
   }),
   execute:async({jobId,mode})=>{
    const useMode=mode||(cloudAssemblyEnabled()?'resume-push':'proceed');
    if(useMode==='resume-push'){
     if(!cloudAssemblyEnabled())throw new HttpError(503,'Cloud Assembly is off.');
     return {ok:true,...await resumeCloudPush(jobId)};
    }
    if(cloudAssemblyEnabled())throw new HttpError(503,'Cloud Assembly auto-continues past stills. Use resume-push if push stalled.');
    return {ok:true,...await proceedTemplate1Job(jobId,{env,fetchImpl})};
   }
  })
 };
}

function xaiClient(env){
 return createOpenAI({
  name:'xai',
  apiKey:env.XAI_API_KEY,
  baseURL:'https://api.x.ai/v1'
 });
}

export async function resolveAssemblyChatProvider(env=process.env){
 if(!env.XAI_API_KEY)throw new HttpError(503,'XAI_API_KEY missing — Assembly chat is xAI Grok only.');
 return 'xai';
}

export function assemblyChatModel(env=process.env,_provider='xai'){
 if(!env.XAI_API_KEY)throw new HttpError(503,'XAI_API_KEY missing — Assembly chat is xAI Grok only.');
 return xaiClient(env).chat(env.ASSEMBLY_CHAT_MODEL||ASSEMBLY_CHAT_MODEL);
}

export function formatAssemblyChatError(error,env=process.env){
 const raw=error&&typeof error==='object'?error:{};
 const msg=String(
  raw.data?.error?.message||
  raw.cause?.message||
  raw.message||
  error||
  'Chat failed.'
 );
 if(/credit|quota|billing|insufficient/i.test(msg)){
  return 'xAI is out of credits for Grok. Top up https://console.x.ai then retry.';
 }
 if(/model|not found|does not exist/i.test(msg)){
  return 'Grok model unavailable ('+(env.ASSEMBLY_CHAT_MODEL||ASSEMBLY_CHAT_MODEL)+'). Check ASSEMBLY_CHAT_MODEL / xAI access.';
 }
 return msg.slice(0,400);
}

export {stepCountIs};
