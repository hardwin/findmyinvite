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
import {
 normalizeSellStage,
 normalizeRevealType,
 pinterestSearchUrl,
 STAGE_LABELS,
 buildStoryboardStillPrompt,
 storyboardToPromptParams,
 themeSuggestionsForQuery,
 REVEAL_TYPES
} from './assembly-sell-path.mjs';
import {STILL_MODEL} from './assembly-template1-prompts.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';

/** Locked brain: xAI Grok only. No OpenAI / Sol. */
export const ASSEMBLY_CHAT_PROVIDER='xai';
export const ASSEMBLY_CHAT_MODEL=process.env.ASSEMBLY_CHAT_MODEL||'grok-4-1-fast-non-reasoning';

export const ASSEMBLY_CHAT_SYSTEM=`You are Akay — the best helpful sales person in the FindMyInvite digital invitation store.

WHO YOU ARE
- Warm, confident, human. You help photographers create cinematic digital wedding invitations.
- Your only objective: guide them through the Photographer Sell Path until they confirm Generate and walk out with a ready invite.
- Speak simply: one or two sentences, then a choice. Never dump jargon, SQL, secrets, vendor names (never say OpenAI / Sol / GPT / Grok / Flare model ids out loud).
- Always name the step they are in ("We're in Theme planning…", "Now Storyboarding…").

SALES RHYTHM (every step)
1) Understand their style (short question).
2) Show options (chips / alternates) — never leave them guessing.
3) Ask them to confirm.
4) Call set_sell_stage and move forward.
Never stall. Always play for the confirmation.

PHOTOGRAPHER SELL PATH (locked order)
1) welcome — Hi, what are we creating today? (wedding invite / save-the-date / etc.) No tools on bare hello.
2) theme — Learn mood/colors/culture. Call update_theme_search often so the right-side Theme desk grid updates (Pinterest.com refuses iframes — never rely on embedding their site). Keep them browsing INSIDE FindMyInvite. They tap a suggestion or paste a pin URL → resolve_pin + lock_theme_pin → confirm theme.
3) storyboard — Entrance opening for the invite video:
   - FIRST = always a reveal hook (door / envelope / building frame / arches / windows). No people.
   - MIDDLE = 2–4 journey beats (these become the opening video prompt middle).
   - LAST = happy couple romantic cinematic dramatic freeze.
   Call propose_storyboard, iterate with them, then flare_edit for First and Last stills whenever they want changes. Lock with lock_storyboard when they confirm.
4) face_swap — Offer Face Swap on the Last/couple still. Confirm.
5) lock — lock_final_image on the final hero (pass bride/groom solos after Face Swap).
6) details — Collect invite details one-by-one (names, display/VIBE name, date, venue, city, RSVP, music optional). Call save_invite_details as fields land. Confirm each.
7) generate — When details are complete, tell them to tap the Generate button (do NOT call start_template1 yourself until they confirm Generate / the UI asks you to). Say estimated time ~15 minutes. Credit charge comes later — do not invent charges.
8) ready — When the job is done / they return: celebrate — invitation is ready + preview.

STYLE MEMORY
- Remember palette, mood, culture, reveal preference from chat and reuse it in every suggestion and flare_edit brief.

TOOL POLICY
- set_sell_stage — call whenever the step changes
- update_theme_search — keep Pinterest iframe query fresh while they talk
- resolve_pin / lock_theme_pin — when they share a pin
- propose_storyboard / lock_storyboard — storyboard draft + lock
- flare_edit — ANY visual edit (First, Last, hero) via Flare stills — show result, ask confirm
- mix_image — optional alternate mix path; prefer flare_edit for storyboard First/Last
- list_music / list_parents — when needed
- save_invite_details — persist fields as confirmed
- lock_final_image — after Face Swap or as-is confirm
- start_template1 — ONLY after Generate confirm (hero + VIBE + storyboard promptParams + details). Pass brideImageUrl + groomImageUrl when Face Swap ran.
- get_job_status / cancel_job / retry_phase / regen_opening_still / approve_stills — job ops
- Never invent URLs or spend. Never ask "shall I call the tool?" — just call it.

RULES
- One clear question at a time.
- Always offer Skip when a step is optional (music, Face Swap).
- Opening video is xAI-only — say so clearly on xAI failure.
- After start_template1, point at the live job card.`;

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
  set_sell_stage:tool({
   description:'Advance the Photographer Sell Path stage. Call whenever the photographer confirms a step.',
   inputSchema:z.object({
    stage:z.enum(['welcome','theme','storyboard','face_swap','lock','details','generate','ready']),
    note:z.string().max(200).optional()
   }),
   execute:async({stage,note})=>{
    const next=normalizeSellStage(stage);
    return {ok:true,stage:next,label:STAGE_LABELS[next]||next,note:note||'',message:'Now in '+(STAGE_LABELS[next]||next)+'.'};
   }
  }),

  update_theme_search:tool({
   description:'Update the on-page Theme desk search from photographer style talk. Pinterest.com cannot load in iframes — this refreshes our in-page suggestion grid. Call often during theme planning.',
   inputSchema:z.object({
    query:z.string().min(2).max(120).describe('Theme search phrase matching their style'),
    styleNote:z.string().max(200).optional()
   }),
   execute:async({query,styleNote})=>{
    const q=String(query||'').trim().slice(0,120);
    const suggestions=themeSuggestionsForQuery(q,9);
    return {
     ok:true,
     query:q,
     styleNote:styleNote||'',
     iframeUrl:pinterestSearchUrl(q),
     suggestions,
     message:'Theme desk updated with '+suggestions.length+' on-page ideas. Keep them browsing inside FindMyInvite — Pinterest website blocks iframes.'
    };
   }
  }),

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

  lock_theme_pin:tool({
   description:'Lock the chosen Pinterest/theme pin after the photographer confirms it.',
   inputSchema:z.object({
    pinUrl:z.string().url(),
    previewUrl:z.string().url().optional(),
    styleNote:z.string().max(200).optional()
   }),
   execute:async({pinUrl,previewUrl,styleNote})=>{
    assertHttpUrl(pinUrl);
    let preview=previewUrl||'';
    if(!preview){
     try{
      const resolved=normalizeReferenceImage(await resolveReferenceImage(pinUrl,{fetchImpl}));
      preview=previewFromResolved(resolved);
     }catch{/* keep empty */}
    }
    return {
     ok:true,
     locked:true,
     stage:'storyboard',
     pinUrl,
     previewUrl:preview,
     styleNote:styleNote||'',
     message:'Theme locked. Move to Storyboarding (First reveal / Middle / Last couple).'
    };
   }
  }),

  propose_storyboard:tool({
   description:'Propose or update the entrance storyboard: reveal First, middle journey beats, Last couple freeze.',
   inputSchema:z.object({
    revealType:z.enum(['door','envelope','building_frame','arches','windows']),
    firstBrief:z.string().min(8).max(400),
    middleBeats:z.array(z.string().min(4).max(200)).min(1).max(6),
    lastBrief:z.string().min(8).max(400),
    pinUrl:z.string().url().optional()
   }),
   execute:async(input)=>{
    const revealType=normalizeRevealType(input.revealType);
    const storyboard={
     revealType,
     firstBrief:String(input.firstBrief||'').trim(),
     middleBeats:(input.middleBeats||[]).map(s=>String(s).trim()).filter(Boolean).slice(0,6),
     lastBrief:String(input.lastBrief||'').trim(),
     pinUrl:input.pinUrl||''
    };
    return {
     ok:true,
     locked:false,
     storyboard,
     promptParams:storyboardToPromptParams(storyboard),
     message:'Show this storyboard and ask them to confirm, edit, or pick another reveal type ('+REVEAL_TYPES.join(', ')+').'
    };
   }
  }),

  lock_storyboard:tool({
   description:'Lock the confirmed storyboard (First / Middle / Last) before Face Swap.',
   inputSchema:z.object({
    revealType:z.enum(['door','envelope','building_frame','arches','windows']),
    firstBrief:z.string().min(8).max(400),
    middleBeats:z.array(z.string().min(4).max(200)).min(1).max(6),
    lastBrief:z.string().min(8).max(400),
    firstImageUrl:z.string().url().optional(),
    lastImageUrl:z.string().url().optional(),
    pinUrl:z.string().url().optional()
   }),
   execute:async(input)=>{
    const storyboard={
     revealType:normalizeRevealType(input.revealType),
     firstBrief:String(input.firstBrief||'').trim(),
     middleBeats:(input.middleBeats||[]).map(s=>String(s).trim()).filter(Boolean).slice(0,6),
     lastBrief:String(input.lastBrief||'').trim(),
     firstImageUrl:input.firstImageUrl||'',
     lastImageUrl:input.lastImageUrl||'',
     pinUrl:input.pinUrl||''
    };
    if(storyboard.firstImageUrl)assertHttpUrl(storyboard.firstImageUrl);
    if(storyboard.lastImageUrl)assertHttpUrl(storyboard.lastImageUrl);
    return {
     ok:true,
     locked:true,
     stage:'face_swap',
     storyboard,
     promptParams:storyboardToPromptParams(storyboard),
     message:'Storyboard locked. Offer Face Swap on the Last/couple still, then lock the hero.'
    };
   }
  }),

  flare_edit:tool({
   description:'Edit First, Last, or hero still with Flare (gpt-image-2.5-flare) from conversation. Prefer this for storyboard visual edits.',
   inputSchema:z.object({
    imageUrl:z.string().url().describe('Base pin or previous still URL'),
    which:z.enum(['first','last','hero']).describe('first=reveal hook, last=couple freeze, hero=entry still'),
    revealType:z.enum(['door','envelope','building_frame','arches','windows']).optional(),
    brief:z.string().min(4).max(800),
    styleNote:z.string().max(300).optional()
   }),
   execute:async(input)=>{
    try{
     const which=input.which||'hero';
     const prompt=which==='hero'
      ?[
        'Edit into a premium wedding invitation hero still, vertical 9:16.',
        String(input.brief||'').trim(),
        input.styleNote?('Style: '+input.styleNote):'',
        'No readable text, watermark, or labels.'
       ].filter(Boolean).join(' ')
      :buildStoryboardStillPrompt({
        which,
        revealType:input.revealType||'door',
        brief:input.brief,
        pinStyleNote:input.styleNote||''
       });
     const resolved=normalizeReferenceImage(await resolveReferenceImage(input.imageUrl,{fetchImpl}));
     let imageUrl=preferPublicImageUrl(resolved);
     if(!imageUrl||!/^https?:\/\//i.test(imageUrl)){
      const {resolveReplicateImageUrl}=await import('./assembly-ai.mjs');
      imageUrl=await resolveReplicateImageUrl(resolved,{env,fetchImpl});
     }
     const result=await withTimeout(runReplicateImage({
      prompt,
      image:imageUrl,
      model:STILL_MODEL,
      env,
      fetchImpl,
      role:which==='first'?'opening-first':which==='last'?'opening-last':'hero-still'
     }),IMAGE_MIX_TIMEOUT_MS,'Flare edit');
     return {
      ok:true,
      which,
      revealType:normalizeRevealType(input.revealType||'door'),
      urls:[result.url],
      url:result.url,
      provider:'flare',
      model:STILL_MODEL,
      predictionId:result.predictionId||null,
      message:'Flare edit ready — show it and ask them to confirm, remix, or lock.'
     };
    }catch(error){
     console.error('assembly-chat flare_edit',error?.message||error);
     const msg=String(error?.message||error||'Flare edit failed.').slice(0,400);
     const timedOut=/timed out|timeout/i.test(msg);
     return {
      ok:false,
      timedOut,
      error:msg,
      message:timedOut
       ?'Flare edit timed out. Ask them to retry, simplify the brief, or wait.'
       :'Flare edit failed — try again with a clearer brief.'
     };
    }
   }
  }),

  save_invite_details:tool({
   description:'Save confirmed invite details collected in chat (names, date, venue, etc.).',
   inputSchema:z.object({
    displayName:z.string().min(2).max(80).optional(),
    brideName:z.string().max(80).optional(),
    groomName:z.string().max(80).optional(),
    eventDate:z.string().max(40).optional(),
    venue:z.string().max(120).optional(),
    city:z.string().max(80).optional(),
    rsvpContact:z.string().max(120).optional(),
    musicId:z.string().max(80).optional(),
    complete:z.boolean().optional()
   }),
   execute:async(details)=>{
    const cleaned={};
    for(const [k,v] of Object.entries(details||{})){
     if(typeof v==='boolean')cleaned[k]=v;
     else if(typeof v==='string'&&v.trim())cleaned[k]=v.trim();
    }
    const needed=['displayName','brideName','groomName','eventDate','venue'];
    const missing=needed.filter(k=>!cleaned[k]);
    const complete=Boolean(cleaned.complete)||missing.length===0;
    return {
     ok:true,
     details:cleaned,
     missing,
     complete,
     stage:complete?'generate':'details',
     message:complete
      ?'Details complete — ask them to tap Generate. Estimated time ~15 minutes.'
      :('Still need: '+missing.join(', ')+'.')
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
   description:'Start Template 1 after Generate confirm. Pass locked hero, storyboard promptParams, invite details, and Face Swap solos when available.',
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
    styleTwist:z.string().optional(),
    brideName:z.string().max(80).optional(),
    groomName:z.string().max(80).optional(),
    storyboard:z.object({
     revealType:z.enum(['door','envelope','building_frame','arches','windows']).optional(),
     firstBrief:z.string().optional(),
     middleBeats:z.array(z.string()).optional(),
     lastBrief:z.string().optional()
    }).optional()
   }),
   execute:async(input)=>{
    const tracks=await listMusicLibrary();
    const musicId=input.musicId||tracks[0]?.id;
    if(!musicId)throw new HttpError(400,'Music library is empty.');
    const parents=await loadPremiumParents();
    const chosenParent=input.parentId||parentId||parents[parents.length-1]?.id||parents[0]?.id;
    const fromBoard=input.storyboard?storyboardToPromptParams(input.storyboard):{};
    const promptParams={
     ...fromBoard,
     ...(input.styleTwist?{styleTwist:String(input.styleTwist).slice(0,300)}:{})
    };
    const coupleNames=[];
    if(input.groomName)coupleNames.push(String(input.groomName).trim());
    if(input.brideName)coupleNames.push(String(input.brideName).trim());
    const payload={
     pinUrl:input.pinUrl||input.heroImageUrl,
     heroImageUrl:input.heroImageUrl,
     displayName:input.displayName,
     parentId:chosenParent,
     musicId,
     budgetUsd:input.budgetUsd??4,
     promptParams:Object.keys(promptParams).length?promptParams:undefined,
     coupleNames:coupleNames.length?coupleNames:undefined,
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
      stage:'generate',
      message:'Cloud Template 1 started. Estimated time ~15 minutes. Poll get_job_status for live percent/label.'
     };
    }
    if(!fsWritesAllowed(env))throw new HttpError(503,'Template 1 needs local writes or Cloud Assembly (ASSEMBLY_CLOUD=1).');
    const started=startTemplate1Job(payload,{env,fetchImpl});
    return {
     ok:true,
     cloud:false,
     jobId:started.jobId,
     spend:started.spend||null,
     stage:'generate',
     message:'Template 1 started locally. Estimated time ~15 minutes. Poll get_job_status for live percent/label.'
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
