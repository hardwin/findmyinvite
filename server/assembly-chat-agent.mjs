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
 proceedTemplate1Job,
 regenTemplate1Still,
 retryTemplate1Job
} from './assembly-template1.mjs';
import {
 cloudAssemblyEnabled,
 startCloudTemplate1Job,
 getCloudTemplate1Job,
 cancelCloudTemplate1Job,
 resumeCloudPush,
 retryCloudTemplate1Job
} from './assembly-cloud.mjs';
import {loadPremiumParents,fsWritesAllowed} from './assembly.mjs';

/** Locked brain: xAI Grok only. No OpenAI / Sol. */
export const ASSEMBLY_CHAT_PROVIDER='xai';
export const ASSEMBLY_CHAT_MODEL=process.env.ASSEMBLY_CHAT_MODEL||'grok-4-1-fast-non-reasoning';

export const ASSEMBLY_CHAT_SYSTEM=`You are Akay from FindMyInvite.

WHO YOU ARE
- Warm host of FindMyInvite — not a robot checklist, not a model-brand pitch.
- You help people create a **digital wedding invitation** they will love to share.
- Speak simply, one question at a time. Short messages. No SQL, file trees, secrets, or vendor name-dropping (never say OpenAI / Sol / GPT; do not introduce yourself as Grok).

THE REAL MISSION (keep this under the surface)
- Every invitation starts from **one hero image** — ideally a romantic **anime-style** couple / ceremony still that becomes the invite's cinematic face.
- Never announce the process as: "I need an image first" or "paste a pin to begin."
- Instead, invite their story: why they are on FindMyInvite, whose wedding it is, the mood they want — then gently steer them toward creating or bringing that anime-style image (Pinterest pin, upload, camera, or mix_image from refs).

CONVERSATION ARC
1) Hello → introduce as Akay from FindMyInvite; offer to help craft their digital wedding invitation; ask what brought them here / what they want to create.
2) Learn the vibe (names optional, season, colors, temple vs garden, playful vs regal).
3) Guide toward the hero still — e.g. "Shall we dream up an anime-style portrait of the couple for the opening?" Offer: paste a Pinterest pin, Attach / Camera a photo, or describe a scene for you to mix.
4) Optional Style Twist + extra refs (always offer Skip).
5) VIBE name = invite display name (required before website).
6) Music from library (optional — default first track — offer Skip).
7) mix_image until ONE hero feels right → optional Face Swap add-on (bride+groom faces on that still; host confirms) → lock_final_image on the final (swapped or as-is) hero. After Face Swap, ALWAYS pass brideImageUrl + groomImageUrl into lock_final_image and start_template1 (Bride/Groom chapter portraits).
8) start_template1 → that locked image becomes the invite website (preview + GitHub branch). Include brideImageUrl + groomImageUrl whenever Face Swap produced them.
9) When status is review: Door-First + last stills appear on the job card. Offer iterate (regen_opening_still) until they love both, then approve_stills (or they tap Approve). Do not skip straight to Approve if they dislike a still.

FIRST MESSAGE / HELLOS
- On hi/hello/hey: start with "Hi" — you are **Akay from FindMyInvite**. You are here to help them create their **digital wedding invitation**. Ask what brought them to FindMyInvite or what they want to create. Warm, short, curious.
- Do not lead with tools, pins, uploads, or "I need an image."
- Do NOT call tools on a bare hello.
- Exception: if they already paste a pin / upload / ask for music, act on that immediately.

TOOL POLICY (agentic — you MUST use tools for real work; never pretend)
- resolve_pin — Pinterest or image URL
- upload_ref — only for pasted data-URLs (UI uploads are already hosted)
- list_music — songs / library — call immediately when they want music
- list_parents — Premium parent clones — call immediately when needed
- mix_image — after a base image (+ optional refs/twist); lean **anime / cinematic wedding** unless they ask otherwise; then Lock / Remix / Retry. Default provider is Replicate. If it times out, WAIT for the host radio choice before calling mix_image again with provider "xai" (or retry Replicate). Never silently switch providers.
- lock_final_image — when they confirm the ONE hero (after optional Face Swap on that still). After Face Swap, pass brideImageUrl + groomImageUrl from the Face Swap result.
- start_template1 — only after lock + VIBE (music optional). Pass brideImageUrl + groomImageUrl when Face Swap ran so Bride/Groom chapters update.
- regen_opening_still — while reviewing: iterate Door-First (first) or last still; pass a short note when they say what to change
- approve_stills — after they like both stills (or say Approve / proceed)
- get_job_status / cancel_job / retry_phase — Template 1 ops
- Never ask "shall I call the tool?" — just call it when intent matches.
- Never invent image URLs, previews, branches, or spend — only report tool output.

RULES
- Ask ONE clear question at a time.
- Stay in invitation-designer voice; the anime hero is the creative goal, not a technical prerequisite you lecture about.
- Opening video in Template 1 is xAI-only (no silent Replicate fallback). Say so clearly on xAI failure.
- After start_template1, point at the live job card. In review: Iterate Door-First / last, then Approve.`;

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

const IMAGE_MIX_TIMEOUT_MS=Number(process.env.ASSEMBLY_CHAT_IMAGE_TIMEOUT_MS||110000);

function withTimeout(promise,ms,label){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(label+' timed out after '+Math.round(ms/1000)+'s.')),ms);
  Promise.resolve(promise).then(
   value=>{clearTimeout(timer);resolve(value);},
   error=>{clearTimeout(timer);reject(error);}
  );
 });
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
   description:'Mix the pin/base image with optional refs and a style twist into a new hero candidate. Default provider is Replicate. Only pass provider "xai" after the host explicitly approves xAI fallback via the radio choice.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Base pin or image URL'),
    referenceUrls:z.array(z.string().url()).optional(),
    styleTwist:z.string().optional(),
    peopleNote:z.string().optional(),
    extraPrompt:z.string().optional(),
    provider:z.enum(['auto','replicate','openai','xai']).optional()
   }),
   execute:async(input)=>{
    try{
     const result=await withTimeout(mixAssemblyImage({
      pinUrl:input.pinUrl,
      referenceUrls:input.referenceUrls||[],
      styleTwist:input.styleTwist||'',
      peopleNote:input.peopleNote||'',
      extraPrompt:input.extraPrompt||'',
      provider:input.provider||'auto',
      env,
      fetchImpl
     }),IMAGE_MIX_TIMEOUT_MS,'Image mix');
     return {
      ok:true,
      urls:result.urls,
      provider:result.provider,
      predictionId:result.predictionId,
      costUsd:result.costUsd,
      message:'Candidate ready — ask Lock / Remix / Retry.'
     };
    }catch(error){
     // Always return a tool result so the UI never sticks on "input available" / MissingToolResultsError.
     console.error('assembly-chat mix_image',error?.message||error);
     const msg=String(error?.message||error||'Image mix failed.').slice(0,400);
     const timedOut=/timed out|timeout/i.test(msg);
     return {
      ok:false,
      timedOut,
      canFallbackXai:timedOut,
      error:msg,
      message:timedOut
       ?'Replicate timed out. Ask the host (radio choice) whether to fall back to the xAI image API, retry Replicate, or wait.'
       :'Mix failed — try again or pick a different pin/style.'
     };
    }
   }
  }),

  lock_final_image:tool({
   description:'Lock the chosen hero image URL for Template 1. After Face Swap, also pass brideImageUrl + groomImageUrl solos for Bride/Groom chapters.',
   inputSchema:z.object({
    imageUrl:z.string().url(),
    brideImageUrl:z.string().url().optional().describe('Face Swap bride solo portrait URL (photos[0])'),
    groomImageUrl:z.string().url().optional().describe('Face Swap groom solo portrait URL (photos[1])'),
    note:z.string().optional()
   }),
   execute:async({imageUrl,brideImageUrl,groomImageUrl,note})=>{
    assertHttpUrl(imageUrl);
    // Host chip may put solos in the note: "Bride solo: https://…\nGroom solo: https://…"
    const noteText=String(note||'');
    const brideFromNote=(noteText.match(/(?:Bride solo:|brideImageUrl:)\s*(\S+)/i)||[])[1]||'';
    const groomFromNote=(noteText.match(/(?:Groom solo:|groomImageUrl:)\s*(\S+)/i)||[])[1]||'';
    const bride=brideImageUrl||brideFromNote||'';
    const groom=groomImageUrl||groomFromNote||'';
    if(bride)assertHttpUrl(bride);
    if(groom)assertHttpUrl(groom);
    return {
     ok:true,
     locked:true,
     heroImageUrl:imageUrl,
     brideImageUrl:bride,
     groomImageUrl:groom,
     coupleImageUrl:imageUrl,
     note:note||'',
     message:bride&&groom
      ?'Final hero + Face Swap solos locked. Ask for VIBE name + music (or skip music), then start_template1 with heroImageUrl + brideImageUrl + groomImageUrl.'
      :'Final hero locked. Ask for VIBE name + music (or skip music), then start_template1.'
    };
   }
  }),

  start_template1:tool({
   description:'Start Template 1 after lock_final_image + VIBE name. Pass Face Swap brideImageUrl + groomImageUrl when available so Bride/Groom chapters get the solos.',
   inputSchema:z.object({
    displayName:z.string().min(2).max(80),
    heroImageUrl:z.string().url(),
    pinUrl:z.string().url().optional(),
    brideImageUrl:z.string().url().optional().describe('Face Swap bride solo — becomes photos[0] / Bride chapter'),
    groomImageUrl:z.string().url().optional().describe('Face Swap groom solo — becomes photos[1] / Groom chapter'),
    coupleImageUrl:z.string().url().optional().describe('Face Swap couple still for hero poster (defaults to heroImageUrl)'),
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
     promptParams:input.styleTwist?{styleTwist:String(input.styleTwist).slice(0,300)}:undefined,
     brideImageUrl:input.brideImageUrl||undefined,
     groomImageUrl:input.groomImageUrl||undefined,
     coupleImageUrl:input.coupleImageUrl||input.heroImageUrl||undefined
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

  regen_opening_still:tool({
   description:'Iterate Door-First (first) or last opening still while the job is in review. Pass a short note when they say what to change.',
   inputSchema:z.object({
    jobId:z.string().min(6),
    which:z.enum(['first','last']).describe('first = Door-First closed door; last = couple outro still'),
    note:z.string().max(300).optional().describe('Optional operator note steering the next take')
   }),
   execute:async({jobId,which,note})=>{
    if(cloudAssemblyEnabled())throw new HttpError(503,'Stills iteration is local-only. Cloud Assembly auto-continues past stills.');
    if(!fsWritesAllowed(env))throw new HttpError(503,'Template 1 needs local writes for still iteration.');
    const result=await regenTemplate1Still(jobId,{role:which,note},{env,fetchImpl});
    return {
     ok:true,
     which,
     jobId:result.jobId,
     status:result.status,
     phase:result.phase,
     detail:result.detail,
     regenRole:result.regenRole,
     stills:result.stills,
     spend:result.spend||null,
     message:which==='first'
      ?'Door-First iteration started. Poll get_job_status until regenRole clears, then show the new still.'
      :'Last-still iteration started. Poll get_job_status until regenRole clears, then show the new still.'
    };
   }
  }),

  approve_stills:tool({
   description:'Approve Door-First + last stills and continue Template 1 into videos (local review only).',
   inputSchema:z.object({jobId:z.string().min(6)}),
   execute:async({jobId})=>{
    if(cloudAssemblyEnabled())throw new HttpError(503,'Cloud Assembly auto-continues past stills. Wait for the preview.');
    return {ok:true,...await proceedTemplate1Job(jobId,{env,fetchImpl})};
   }
  }),

  retry_phase:tool({
   description:'Retry a failed/stuck Template 1 job from saved input, or resume a stalled GitHub push. Prefer retry for OpenAI/xAI/credit failures; resume-push only when clone+sandbox already exist.',
   inputSchema:z.object({
    jobId:z.string().min(6),
    mode:z.enum(['retry','proceed','resume-push']).optional()
   }),
   execute:async({jobId,mode})=>{
    const useMode=mode||'retry';
    if(useMode==='resume-push'){
     if(!cloudAssemblyEnabled())throw new HttpError(503,'Cloud Assembly is off.');
     return {ok:true,...await resumeCloudPush(jobId)};
    }
    if(useMode==='proceed'){
     if(cloudAssemblyEnabled())throw new HttpError(503,'Cloud Assembly auto-continues past stills. Use retry or resume-push.');
     return {ok:true,...await proceedTemplate1Job(jobId,{env,fetchImpl})};
    }
    if(cloudAssemblyEnabled())return {ok:true,...await retryCloudTemplate1Job(jobId)};
    return {ok:true,...await retryTemplate1Job(jobId,{env,fetchImpl})};
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
