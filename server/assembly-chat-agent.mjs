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
 buildSoloStillPrompt,
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

CREATIVE LAW (non-negotiable)
- Every visual change happens IN the conversation with a NEW image preview — never text-only and dump images at Generate.
- After theme is locked, that pin IS the base image forever. NEVER ask again for a Pinterest URL, "first image", hero pin, or moodboard pick.
- After propose_storyboard (or any First/Last edit), IMMEDIATELY call craft_storyboard_stills (or flare_edit) so First and Last appear as real previews before you ask Lock.
- Do NOT call lock_storyboard until firstImageUrl AND lastImageUrl exist.
- Whatever they change ("redder envelope", "happier couple", "more gold") → generate a new still THIS turn, show it, ask confirm. Iterate until they Lock.
- Bride and Groom chapter portraits MUST exist before lock_final_image: Face Swap solos OR craft_chapter_solos from the Last couple still. Never skip solos.

SALES RHYTHM (every step)
1) Understand their style (short question).
2) Show options (chips / alternates) — never leave them guessing.
3) Ask them to confirm.
4) Call set_sell_stage and move forward.
Never stall. Always play for the confirmation.

PHOTOGRAPHER SELL PATH (locked order)
1) welcome — Hi, what are we creating today? (wedding invite / save-the-date / etc.) No tools on bare hello.
2) theme — Learn mood/colors/culture. Call update_theme_search so the Theme desk grid updates. They tap a suggestion or paste a pin → resolve_pin + lock_theme_pin. After lock: never re-ask for a pin.
3) storyboard — Entrance opening:
   - FIRST = reveal hook (door / envelope / building frame / arches / windows). No people.
   - MIDDLE = 2–4 journey beats (opening video middle).
   - LAST = happy couple romantic cinematic dramatic freeze.
   propose_storyboard → craft_storyboard_stills (show First + Last) → iterate with flare_edit / craft again → lock_storyboard only when both previews exist and they confirm.
4) face_swap — Offer Face Swap on the Last still. If they skip: craft_chapter_solos on Last, then lock.
5) lock — lock_final_image with hero (= Last) + brideImageUrl + groomImageUrl.
6) details — Collect one-by-one (groom, bride, display/VIBE name, date, venue, city, RSVP, music optional). Call save_invite_details as fields land. Confirm each.
7) generate — When details complete, tell them to tap Generate. Do NOT call start_template1 until Generate confirm. Pass displayName, hero, pinUrl, storyboard, firstImageUrl, lastImageUrl, bride/groom names + date + venue + city, and solos. ~15 min. No invented charges.
8) ready — Celebrate when the job is done / they return.

STYLE MEMORY
- Remember palette, mood, culture, reveal preference and reuse it in every craft / flare brief.

TOOL POLICY
- set_sell_stage — whenever the step changes
- update_theme_search / resolve_pin / lock_theme_pin — theme only
- propose_storyboard / craft_storyboard_stills / flare_edit / lock_storyboard — creative stills during chat
- craft_chapter_solos — bride + groom portraits from Last (required if Face Swap skipped)
- save_invite_details / lock_final_image / start_template1 — close the sale
- Never invent URLs. Never ask "shall I call the tool?" — just call it.

RULES
- One clear question at a time.
- Music is optional (offer Skip). Face Swap is optional but solos are NOT — craft them if skipped.
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
     message:'Show the storyboard text, then IMMEDIATELY call craft_storyboard_stills with the locked theme pin so First + Last image previews appear before asking Lock. Reveal types: '+REVEAL_TYPES.join(', ')+'.'
    };
   }
  }),

  craft_storyboard_stills:tool({
   description:'Generate First (reveal) + Last (couple) still previews in one turn from the locked theme pin. Call after propose_storyboard and after any visual change until lock.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Locked theme pin / previous still URL — never ask for a new pin'),
    revealType:z.enum(['door','envelope','building_frame','arches','windows']),
    firstBrief:z.string().min(4).max(800),
    lastBrief:z.string().min(4).max(800),
    styleNote:z.string().max(300).optional(),
    firstBaseUrl:z.string().url().optional().describe('Prior First still to iterate from'),
    lastBaseUrl:z.string().url().optional().describe('Prior Last still to iterate from')
   }),
   execute:async(input)=>{
    try{
     const revealType=normalizeRevealType(input.revealType);
     const style=input.styleNote||'';
     const runOne=async(which,baseUrl,brief)=>{
      const prompt=buildStoryboardStillPrompt({which,revealType,brief,pinStyleNote:style});
      const resolved=normalizeReferenceImage(await resolveReferenceImage(baseUrl,{fetchImpl}));
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
       role:which==='first'?'opening-first':'opening-last'
      }),IMAGE_MIX_TIMEOUT_MS,'Craft '+which);
      return result.url;
     };
     const firstBase=input.firstBaseUrl||input.pinUrl;
     const lastBase=input.lastBaseUrl||input.pinUrl;
     const [firstImageUrl,lastImageUrl]=await Promise.all([
      runOne('first',firstBase,input.firstBrief),
      runOne('last',lastBase,input.lastBrief)
     ]);
     return {
      ok:true,
      stage:'storyboard',
      firstImageUrl,
      lastImageUrl,
      urls:[firstImageUrl,lastImageUrl],
      revealType,
      provider:'flare',
      model:STILL_MODEL,
      message:'First + Last previews ready — show BOTH images, ask confirm / tweak / Lock. Do not lock until they confirm.'
     };
    }catch(error){
     console.error('assembly-chat craft_storyboard_stills',error?.message||error);
     const msg=String(error?.message||error||'Craft stills failed.').slice(0,400);
     const timedOut=/timed out|timeout/i.test(msg);
     return {
      ok:false,
      timedOut,
      error:msg,
      message:timedOut
       ?'Preview craft timed out. Retry craft_storyboard_stills or flare_edit one frame at a time.'
       :'Could not craft First/Last previews — retry with the locked theme pin.'
     };
    }
   }
  }),

  craft_chapter_solos:tool({
   description:'Generate Bride + Groom individual chapter portraits from the Last couple still. Required when Face Swap is skipped.',
   inputSchema:z.object({
    coupleImageUrl:z.string().url().describe('Last couple / hero still URL'),
    styleNote:z.string().max(300).optional(),
    brideBrief:z.string().max(400).optional(),
    groomBrief:z.string().max(400).optional()
   }),
   execute:async(input)=>{
    try{
     const style=input.styleNote||'';
     const runSolo=async(which,brief)=>{
      const prompt=buildSoloStillPrompt({which,brief,pinStyleNote:style});
      const resolved=normalizeReferenceImage(await resolveReferenceImage(input.coupleImageUrl,{fetchImpl}));
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
       role:which==='bride'?'bride-solo':'groom-solo'
      }),IMAGE_MIX_TIMEOUT_MS,'Craft '+which+' solo');
      return result.url;
     };
     const [brideImageUrl,groomImageUrl]=await Promise.all([
      runSolo('bride',input.brideBrief||''),
      runSolo('groom',input.groomBrief||'')
     ]);
     return {
      ok:true,
      stage:'lock',
      brideImageUrl,
      groomImageUrl,
      coupleImageUrl:input.coupleImageUrl,
      urls:[brideImageUrl,groomImageUrl],
      provider:'flare',
      model:STILL_MODEL,
      message:'Bride + Groom solos ready — show both, then lock_final_image with hero (= couple) + brideImageUrl + groomImageUrl.'
     };
    }catch(error){
     console.error('assembly-chat craft_chapter_solos',error?.message||error);
     const msg=String(error?.message||error||'Chapter solos failed.').slice(0,400);
     const timedOut=/timed out|timeout/i.test(msg);
     return {
      ok:false,
      timedOut,
      error:msg,
      message:timedOut
       ?'Solo craft timed out. Retry craft_chapter_solos.'
       :'Could not craft Bride/Groom solos — retry from the Last couple still.'
     };
    }
   }
  }),

  lock_storyboard:tool({
   description:'Lock storyboard ONLY after First + Last image previews exist and the host confirms.',
   inputSchema:z.object({
    revealType:z.enum(['door','envelope','building_frame','arches','windows']),
    firstBrief:z.string().min(8).max(400),
    middleBeats:z.array(z.string().min(4).max(200)).min(1).max(6),
    lastBrief:z.string().min(8).max(400),
    firstImageUrl:z.string().url().describe('Crafted First reveal still — required'),
    lastImageUrl:z.string().url().describe('Crafted Last couple still — required'),
    pinUrl:z.string().url().optional()
   }),
   execute:async(input)=>{
    if(!input.firstImageUrl||!input.lastImageUrl){
     throw new HttpError(400,'Lock storyboard needs firstImageUrl and lastImageUrl — craft previews first.');
    }
    assertHttpUrl(input.firstImageUrl);
    assertHttpUrl(input.lastImageUrl);
    const storyboard={
     revealType:normalizeRevealType(input.revealType),
     firstBrief:String(input.firstBrief||'').trim(),
     middleBeats:(input.middleBeats||[]).map(s=>String(s).trim()).filter(Boolean).slice(0,6),
     lastBrief:String(input.lastBrief||'').trim(),
     firstImageUrl:input.firstImageUrl,
     lastImageUrl:input.lastImageUrl,
     pinUrl:input.pinUrl||''
    };
    return {
     ok:true,
     locked:true,
     stage:'face_swap',
     storyboard,
     heroImageUrl:storyboard.lastImageUrl,
     promptParams:storyboardToPromptParams(storyboard),
     message:'Storyboard locked with First + Last stills. Offer Face Swap on Last, or skip → craft_chapter_solos, then lock_final_image.'
    };
   }
  }),

  flare_edit:tool({
   description:'Edit First, Last, hero, or a single bride/groom solo with Flare from conversation. Use for one-frame tweaks after craft_storyboard_stills.',
   inputSchema:z.object({
    imageUrl:z.string().url().describe('Base pin or previous still URL'),
    which:z.enum(['first','last','hero','bride','groom']).describe('first=reveal, last=couple, hero=entry, bride/groom=chapter solos'),
    revealType:z.enum(['door','envelope','building_frame','arches','windows']).optional(),
    brief:z.string().min(4).max(800),
    styleNote:z.string().max(300).optional()
   }),
   execute:async(input)=>{
    try{
     const which=input.which||'hero';
     let prompt;
     if(which==='bride'||which==='groom'){
      prompt=buildSoloStillPrompt({which,brief:input.brief,pinStyleNote:input.styleNote||''});
     }else if(which==='hero'){
      prompt=[
       'Edit into a premium wedding invitation hero still, vertical 9:16.',
       String(input.brief||'').trim(),
       input.styleNote?('Style: '+input.styleNote):'',
       'No readable text, watermark, or labels.'
      ].filter(Boolean).join(' ');
     }else{
      prompt=buildStoryboardStillPrompt({
       which,
       revealType:input.revealType||'door',
       brief:input.brief,
       pinStyleNote:input.styleNote||''
      });
     }
     const resolved=normalizeReferenceImage(await resolveReferenceImage(input.imageUrl,{fetchImpl}));
     let imageUrl=preferPublicImageUrl(resolved);
     if(!imageUrl||!/^https?:\/\//i.test(imageUrl)){
      const {resolveReplicateImageUrl}=await import('./assembly-ai.mjs');
      imageUrl=await resolveReplicateImageUrl(resolved,{env,fetchImpl});
     }
     const role=
      which==='first'?'opening-first'
      :which==='last'?'opening-last'
      :which==='bride'?'bride-solo'
      :which==='groom'?'groom-solo'
      :'hero-still';
     const result=await withTimeout(runReplicateImage({
      prompt,
      image:imageUrl,
      model:STILL_MODEL,
      env,
      fetchImpl,
      role
     }),IMAGE_MIX_TIMEOUT_MS,'Flare edit');
     return {
      ok:true,
      which,
      revealType:normalizeRevealType(input.revealType||'door'),
      urls:[result.url],
      url:result.url,
      brideImageUrl:which==='bride'?result.url:undefined,
      groomImageUrl:which==='groom'?result.url:undefined,
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
   description:'Lock the hero (Last couple still) plus Bride/Groom chapter solos. Solos required — Face Swap or craft_chapter_solos.',
   inputSchema:z.object({
    imageUrl:z.string().url(),
    brideImageUrl:z.string().url().optional().describe('Bride chapter portrait URL (photos[0])'),
    groomImageUrl:z.string().url().optional().describe('Groom chapter portrait URL (photos[1])'),
    note:z.string().optional()
   }),
   execute:async({imageUrl,brideImageUrl,groomImageUrl,note})=>{
    assertHttpUrl(imageUrl);
    const noteText=String(note||'');
    const brideFromNote=(noteText.match(/(?:Bride solo:|brideImageUrl:)\s*(\S+)/i)||[])[1]||'';
    const groomFromNote=(noteText.match(/(?:Groom solo:|groomImageUrl:)\s*(\S+)/i)||[])[1]||'';
    const bride=brideImageUrl||brideFromNote||'';
    const groom=groomImageUrl||groomFromNote||'';
    if(!bride||!groom){
     throw new HttpError(400,'lock_final_image needs brideImageUrl and groomImageUrl — run Face Swap or craft_chapter_solos first.');
    }
    assertHttpUrl(bride);
    assertHttpUrl(groom);
    return {
     ok:true,
     locked:true,
     heroImageUrl:imageUrl,
     brideImageUrl:bride,
     groomImageUrl:groom,
     coupleImageUrl:imageUrl,
     note:note||'',
     stage:'details',
     message:'Final hero + Bride/Groom solos locked. Collect invite details (names, date, venue), save_invite_details, then Generate.'
    };
   }
  }),

  start_template1:tool({
   description:'Start Template 1 after Generate confirm. Pass locked hero, chat-crafted First/Last stills, invite details, and Bride/Groom solos.',
   inputSchema:z.object({
    displayName:z.string().min(2).max(80),
    heroImageUrl:z.string().url(),
    pinUrl:z.string().url().optional(),
    firstImageUrl:z.string().url().optional().describe('Chat-crafted First reveal still — reused as opening-first'),
    lastImageUrl:z.string().url().optional().describe('Chat-crafted Last couple still — reused as opening-last'),
    brideImageUrl:z.string().url().optional().describe('Bride solo — photos[0] / Bride chapter'),
    groomImageUrl:z.string().url().optional().describe('Groom solo — photos[1] / Groom chapter'),
    coupleImageUrl:z.string().url().optional().describe('Couple still for hero poster (defaults to heroImageUrl)'),
    musicId:z.string().optional(),
    parentId:z.string().optional(),
    budgetUsd:z.number().min(0.01).max(50).optional(),
    styleTwist:z.string().optional(),
    brideName:z.string().max(80).optional(),
    groomName:z.string().max(80).optional(),
    eventDate:z.string().max(40).optional(),
    venue:z.string().max(120).optional(),
    city:z.string().max(80).optional(),
    address:z.string().max(200).optional(),
    storyboard:z.object({
     revealType:z.enum(['door','envelope','building_frame','arches','windows']).optional(),
     firstBrief:z.string().optional(),
     middleBeats:z.array(z.string()).optional(),
     lastBrief:z.string().optional()
    }).optional()
   }),
   execute:async(input)=>{
    if(!input.brideImageUrl||!input.groomImageUrl){
     throw new HttpError(400,'start_template1 needs brideImageUrl and groomImageUrl — craft_chapter_solos or Face Swap first.');
    }
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
    const city=input.city?String(input.city).trim():'';
    const venue=input.venue?String(input.venue).trim():'';
    const address=input.address?String(input.address).trim():(city||'');
    const payload={
     pinUrl:input.pinUrl||input.heroImageUrl,
     heroImageUrl:input.heroImageUrl,
     firstImageUrl:input.firstImageUrl||undefined,
     lastImageUrl:input.lastImageUrl||input.heroImageUrl||undefined,
     displayName:input.displayName,
     parentId:chosenParent,
     musicId,
     budgetUsd:input.budgetUsd??4,
     promptParams:Object.keys(promptParams).length?promptParams:undefined,
     coupleNames:coupleNames.length?coupleNames:undefined,
     eventDate:input.eventDate||undefined,
     venue:venue||undefined,
     address:address||undefined,
     city:city||undefined,
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
 const chunks=[
  raw.data?.error?.message,
  typeof raw.data?.error==='string'?raw.data.error:'',
  raw.data?.message,
  raw.responseBody,
  raw.cause?.message,
  raw.message,
  raw.statusText,
  typeof error==='string'?error:''
 ].filter(Boolean).map(v=>String(v));
 // AI SDK sometimes only surfaces HTTP statusText "Forbidden" — dig nested JSON bodies.
 for(const chunk of chunks.slice()){
  if(typeof chunk==='string'&&chunk.trim().startsWith('{')){
   try{
    const parsed=JSON.parse(chunk);
    if(parsed?.error)chunks.push(typeof parsed.error==='string'?parsed.error:(parsed.error.message||''));
    if(parsed?.message)chunks.push(String(parsed.message));
   }catch{/* not JSON */}
  }
 }
 const msg=chunks.filter(Boolean).join(' | ')||'Chat failed.';
 const status=Number(raw.statusCode||raw.status||raw.cause?.statusCode||0);
 if(/credit|quota|billing|insufficient|spending limit|used all available/i.test(msg)||(status===403&&/permission-denied|Forbidden/i.test(msg))){
  return 'xAI is out of credits for Grok. Top up https://console.x.ai then retry.';
 }
 if(/model|not found|does not exist/i.test(msg)){
  return 'Grok model unavailable ('+(env.ASSEMBLY_CHAT_MODEL||ASSEMBLY_CHAT_MODEL)+'). Check ASSEMBLY_CHAT_MODEL / xAI access.';
 }
 if(status===403||/^Forbidden$/i.test(msg.trim())){
  return 'xAI blocked this chat (403). Usually out of credits — top up https://console.x.ai then retry.';
 }
 return msg.slice(0,400);
}

export {stepCountIs};
