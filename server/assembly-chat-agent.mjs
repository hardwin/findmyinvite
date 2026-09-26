import {IDENTITY_REVEAL_RULES} from './assembly-storyboard-astra.mjs';
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
 buildStoryboardSheetPrompt,
 buildSoloStillPrompt,
 shotsToStoryboard,
 storyboardToPromptParams,
 themeSuggestionsForQuery,
 REVEAL_TYPES
} from './assembly-sell-path.mjs';
import {STILL_MODEL} from './assembly-template1-prompts.mjs';
import {createStoryboardWorkflow} from './storyboard-workflow.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';

const revealTypeField=z.string().min(2).max(40).describe(
 'First reveal in the photographer\'s words. Optional presets: door, envelope, clouds, building_frame, arches, windows. Never remap their choice to another type.'
);

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
- You are a creative collaborator, not a questionnaire. Help turn an idea into a story. Never demand a completed shot list. Ask at most one useful question if essential; otherwise make a first visual draft and invite edits.
- Use the locked Pinterest/theme reference for palette and identity. Do not re-ask for its URL. The latest storyboard is the visual base for revisions.
- Every storyboard has exactly FIVE timed frames for ONE 15-second video (0–3, 3–6, 6–9, 9–12, 12–15 seconds). Astra authors the complete board inside propose_storyboard and compiles the approved video prompt inside lock_storyboard. Use one continuous FPV drone flight: frames 1–2 HUMAN-FREE autonomous reveal (0–6s), with Save the Date payoff at 3–6s; frame 3 sharp face-concealed bride/groom tableau, no text (6–9s); frame 4 a different face-concealed pose/setup with levitating "We're getting married" (9–12s); frame 5 full 360-degree camera orbit in the grandest remote themed setup at least 1 km along the flight with at least 15 airborne depth layers, ending on the best romantic hero image (12–15s). Respect their reveal, even if partially open.
- Every storyboard request or revision calls propose_storyboard with ALL revised shots and persistent continuity. This tool automatically paints the sheet. Do not also call craft_storyboard_sheet. Never announce that a preview is ready unless the tool succeeded.
- Preserve every unmentioned detail. Describe exactly what changed and what stayed fixed in one sentence after the image is ready.
- This is a staged photoshoot: strictly no walking, steps, backward gait, traveling bodies or normal activities. No people except the couple. Continuity means the same identities, wardrobe and theme across geographically distant locations over at least 1 km. The same bride and groom are already present at each destination and uncovered by opaque occlusion; no pop-in, fade or dissolve; never force them to walk between adjacent setups. Respect a steady reveal request in the first two frames without freezing frames 3–5. FPV transits move superfast FORWARD into/through the world, then decelerate hard into ultra slow motion for each posed moment and readable title, then accelerate forward again. Never back away from portraits or fly backwards. Finale is a speed-ramped 360-degree camera orbit, ending on the strongest hero angle. Use concrete low skims, fly-throughs, foreground reveals and fast approaches, not uniformly gentle glides.
- ${IDENTITY_REVEAL_RULES}
- Example: shot 1 oyster HALF CLOSED; shot 2 SAME oyster opens by itself to reveal spectacular floating Save the Date lettering above the pearl, with NO people. The bride and groom appear only from scene 3 onward, already posed, with both faces concealed until the closing hero composition.
- Keep persistent continuity in the continuity field and shot-specific states in each scene. When they say "second shot", edit that shot, preserving others. On "same angle", explicitly apply camera continuity across the shots.
- The preview panel shows the latest board and revision history. Old tool results describe old drafts; never follow stale workflow instructions from those results.
- Approval is a separate turn AFTER a rendered sheet. Never generate First/Last from descriptions alone. Only lock_storyboard may extract frames from the latest approved sheet.
- A revision invalidates previous approval and First/Last frames. Ask them to review the updated board.
- Bride and Groom portraits must exist before lock_final_image; Face Swap is optional.

PHOTOGRAPHER SELL PATH (adapt to the conversation)
1) welcome — Hi, what are we creating? No tools on bare hello.
2) theme — Learn style, use update_theme_search, resolve_pin and lock_theme_pin after selection.
3) storyboard — Develop their idea together. five timed frames for one 15-second video, no minimum journey or compulsory door. propose_storyboard saves AND paints. Iterate visually until approval. If painting fails, show the error and retry the same board; never skip to First/Last. lock_storyboard extracts the approved first/final panels.
4) face_swap — Offer Face Swap on the Last still. If they skip: craft_chapter_solos on Last, then lock.
5) lock — lock_final_image with hero (= Last) + brideImageUrl + groomImageUrl.
6) details — Collect one-by-one (groom, bride, display/VIBE name, date, venue, city, RSVP, music optional). Call save_invite_details as fields land. Confirm each.
7) generate — When details complete, tell them to tap Generate. Do NOT call start_template1 until Generate confirm. Pass displayName, hero, pinUrl, storyboard, firstImageUrl, lastImageUrl, bride/groom names + date + venue + city, and solos. Generate creates ONLY the opening video first. Direct them to watch it and click Approve opening in the job card; only then do the remaining video and website build. Never approve an opening automatically. No invented charges.
8) ready — Celebrate when the job is done / they return.

STYLE MEMORY
- Remember palette, mood, culture, reveal preference and reuse it in every craft / flare brief.

TOOL POLICY
- set_sell_stage — whenever the step changes
- update_theme_search / resolve_pin / lock_theme_pin — theme only
- propose_storyboard / craft_storyboard_sheet / flare_edit / lock_storyboard — sheet first; First/Last only after Lock
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

export function buildAssemblyChatTools({env=process.env,fetchImpl=fetch,parentId='',messages=[],imageRunner=runReplicateImage,openaiClient}={}){
 const tools={
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
     message:'Theme locked. Help develop their idea into five timed frames for one 15-second video. If they already described an idea, paint it now with propose_storyboard. Otherwise ask what should happen; offer to help invent a story, without assuming a door.'
    };
   }
  }),

  propose_storyboard:tool({
   description:'Create or revise the visual storyboard in ONE call: saves the complete revised shots and paints the sheet automatically. Supply all shots, carry forward unchanged scenes and continuity. No separate craft call needed.',
   inputSchema:z.object({
    revealType:revealTypeField,
    title:z.string().min(2).max(80).optional(),
    continuity:z.string().max(1600).optional().describe('Persistent constraints across panels: location, camera angle, framing, subject placement; only named changes move.'),
    shots:z.array(z.object({
     scene:z.string().min(4).max(1200),
     camera:z.string().max(80).optional(),
     movement:z.string().max(80).optional(),
     emotion:z.string().max(80).optional(),
     transition:z.string().max(80).optional()
    })).length(5).optional(),
    firstBrief:z.string().min(4).max(1200).optional(),
    middleBeats:z.array(z.string().min(4).max(1200)).min(0).max(6).optional(),
    lastBrief:z.string().min(4).max(1200).optional(),
    pinUrl:z.string().url().optional()
   }),
   execute:async(input)=>{
    const fromShots=input.shots?.length
     ?shotsToStoryboard(input.revealType,input.shots)
     :shotsToStoryboard(input.revealType,[
      input.firstBrief,
      ...(input.middleBeats||[]),
      input.lastBrief
     ].filter(Boolean));
    if(fromShots.shots.length<2||!fromShots.firstBrief||!fromShots.lastBrief){
     throw new HttpError(400,'Need their shots first — do not invent an entrance.');
    }
    const storyboard={
     ...fromShots,
     title:String(input.title||'').trim(),
     continuity:input.continuity||'',
     pinUrl:input.pinUrl||'',
     locked:false
    };
    return {
     ok:true,
     locked:false,
     stage:'storyboard',
     storyboard,
     promptParams:storyboardToPromptParams(storyboard),
     message:'Shots saved. IMMEDIATELY call craft_storyboard_sheet. Do NOT craft First/Last and do NOT propose a door.'
    };
   }
  }),

  craft_storyboard_sheet:tool({
   description:'Paint ONE film storyboard sheet (numbered panels) from the photographer\'s shots. Call after propose_storyboard. Iterate until they Lock — then lock_storyboard pulls First/Last.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Locked theme pin or previous sheet URL'),
    revealType:revealTypeField,
    title:z.string().min(2).max(80).optional(),
    continuity:z.string().max(1600).optional().describe('Persistent constraints across panels: location, camera angle, framing, subject placement; only named changes move.'),
    shots:z.array(z.object({
     scene:z.string().min(4).max(1200),
     camera:z.string().max(80).optional(),
     movement:z.string().max(80).optional(),
     emotion:z.string().max(80).optional(),
     transition:z.string().max(80).optional()
    })).length(5),
    styleNote:z.string().max(300).optional(),
    sheetBaseUrl:z.string().url().optional().describe('Prior sheet to iterate')
   }),
   execute:async(input)=>{
    try{
     const revealType=normalizeRevealType(input.revealType);
     const packed=shotsToStoryboard(revealType,input.shots);
     const prompt=buildStoryboardSheetPrompt({
      title:input.title||'Wedding invitation opening',
      revealType,
      shots:input.shots,
      pinStyleNote:input.styleNote||'',
      brief:packed.firstBrief+' → '+packed.lastBrief,
      continuity:input.continuity||'',airborneLayers:input.airborneLayers||[]
     });
     const base=input.sheetBaseUrl||input.pinUrl;
     const resolved=normalizeReferenceImage(await resolveReferenceImage(base,{fetchImpl}));
     let imageUrl=preferPublicImageUrl(resolved);
     if(!imageUrl||!/^https?:\/\//i.test(imageUrl)){
      const {resolveReplicateImageUrl}=await import('./assembly-ai.mjs');
      imageUrl=await resolveReplicateImageUrl(resolved,{env,fetchImpl});
     }
     const result=await withTimeout(imageRunner({
      prompt,
      image:imageUrl,
      model:STILL_MODEL,
      env,
      fetchImpl,
      role:'storyboard-sheet'
     }),IMAGE_MIX_TIMEOUT_MS,'Craft storyboard sheet');
     return {
      ok:true,
      stage:'storyboard',
      sheetUrl:result.url,
      urls:[result.url],
      revealType,
      storyboard:{...packed,continuity:input.continuity||'',title:input.title||'',sheetUrl:result.url,locked:false,pinUrl:input.pinUrl},
      provider:'flare',
      model:STILL_MODEL,
      message:'Storyboard sheet ready — show the ONE image. Iterate until they Lock. Do not craft First/Last yet.'
     };
    }catch(error){
     console.error('assembly-chat craft_storyboard_sheet',error?.message||error);
     const msg=String(error?.message||error||'Sheet craft failed.').slice(0,400);
     const timedOut=/timed out|timeout/i.test(msg);
     return {
      ok:false,
      timedOut,
      error:msg,
      message:timedOut?'Storyboard sheet timed out. Retry craft_storyboard_sheet.':'Could not paint the storyboard sheet. Retry.'
     };
    }
   }
  }),

  craft_storyboard_stills:tool({
   description:'Regenerate First (reveal) + Last (couple) frames only after the photographer has locked the storyboard sheet. Never call immediately after propose_storyboard; use craft_storyboard_sheet first.',
   inputSchema:z.object({
    pinUrl:z.string().url().describe('Locked theme pin / previous still URL — never ask for a new pin'),
    revealType:revealTypeField,
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
      const result=await withTimeout(imageRunner({
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
      const result=await withTimeout(imageRunner({
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
   description:'Lock the storyboard SHEET after they confirm it. Then craft First (panel 1) and Last (final panel) from that sheet.',
   inputSchema:z.object({
    revealType:revealTypeField,
    sheetUrl:z.string().url().describe('Locked storyboard sheet image'),
    continuity:z.string().max(1600).optional(),
    firstBrief:z.string().min(4).max(1200),
    middleBeats:z.array(z.string().min(4).max(1200)).min(0).max(6).optional(),
    lastBrief:z.string().min(4).max(1200),
    pinUrl:z.string().url().optional(),
    styleNote:z.string().max(300).optional()
   }),
   execute:async(input)=>{
    assertHttpUrl(input.sheetUrl);
    const revealType=normalizeRevealType(input.revealType);
    const pin=input.pinUrl||input.sheetUrl;
    const runOne=async(which,brief)=>{
     const prompt='Extract only '+(which==='first'?'panel 1':'the final panel')+' from the supplied APPROVED storyboard as one full-bleed vertical 9:16 image. Preserve the exact camera angle, subject scale, placement, location, lighting, shell/door openness and visible characters. Do not redesign the scene or close an object further. Remove panel labels, borders, text and production notes only. Continuity: '+(input.continuity||'Preserve the approved board')+'. Scene: '+brief;
     const resolved=normalizeReferenceImage(await resolveReferenceImage(input.sheetUrl,{fetchImpl}));
     let imageUrl=preferPublicImageUrl(resolved);
     if(!imageUrl||!/^https?:\/\//i.test(imageUrl)){
      const {resolveReplicateImageUrl}=await import('./assembly-ai.mjs');
      imageUrl=await resolveReplicateImageUrl(resolved,{env,fetchImpl});
     }
     const result=await withTimeout(imageRunner({
      prompt,
      image:imageUrl,
      model:STILL_MODEL,
      env,
      fetchImpl,
      role:which==='first'?'opening-first':'opening-last'
     }),IMAGE_MIX_TIMEOUT_MS,'Lock '+which);
     return result.url;
    };
    const [firstImageUrl,lastImageUrl]=await Promise.all([
     runOne('first',input.firstBrief),
     runOne('last',input.lastBrief)
    ]);
    const storyboard={
     revealType,
     firstBrief:String(input.firstBrief||'').trim(),
     middleBeats:(input.middleBeats||[]).map(s=>String(s).trim()).filter(Boolean).slice(0,6),
     lastBrief:String(input.lastBrief||'').trim(),
     sheetUrl:input.sheetUrl,
     firstImageUrl,
     lastImageUrl,
     pinUrl:pin,
     locked:true
    };
    return {
     ok:true,
     locked:true,
     stage:'face_swap',
     storyboard,
     firstImageUrl,
     lastImageUrl,
     heroImageUrl:lastImageUrl,
     urls:[input.sheetUrl,firstImageUrl,lastImageUrl],
     promptParams:storyboardToPromptParams(storyboard),
     message:'Sheet locked. First + Last frames pulled from the board. Offer Face Swap on Last, or skip → craft_chapter_solos.'
    };
   }
  }),

  flare_edit:tool({
   description:'Edit First/Last/hero/solos after board approval. For storyboard changes use propose_storyboard with complete revised shots and continuity so scene descriptions and the image stay synchronized.',
   inputSchema:z.object({
    imageUrl:z.string().url().describe('Base pin or previous still URL'),
    which:z.enum(['sheet','first','last','hero','bride','groom']).describe('sheet=full storyboard page; first/last only after the sheet is locked'),
    revealType:revealTypeField.optional(),
    brief:z.string().min(4).max(800),
    styleNote:z.string().max(300).optional()
   }),
   execute:async(input)=>{
    try{
     const which=input.which||'hero';
     let prompt;
     if(which==='sheet'){
      prompt='Edit the supplied storyboard sheet in place. Preserve its panel count, panel order, scene continuity, camera notes, and labels unless the requested edit changes them. Do not invent new scenes or replace the reveal. Requested edit: '+input.brief+(input.styleNote?' Style: '+input.styleNote:'');
     }else if(which==='bride'||which==='groom'){
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
      which==='sheet'?'storyboard-sheet'
      :which==='first'?'opening-first'
      :which==='last'?'opening-last'
      :which==='bride'?'bride-solo'
      :which==='groom'?'groom-solo'
      :'hero-still';
     const result=await withTimeout(imageRunner({
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
      sheetUrl:which==='sheet'?result.url:undefined,
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
      ?'Details complete — ask them to tap Generate. Opening video first; review and approve it before the rest of the invitation builds.'
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
     revealType:revealTypeField.optional(),
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
      message:'Generation job queued; cloud worker startup is not confirmed yet. Call get_job_status now and report its actual status. If failed, show the error and recovery action; never say generation is running or ask them to wait 15 minutes after a failure.'
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
     message:'Template 1 started locally. Opening video first; review and approve it before the rest of the invitation builds. Poll get_job_status for live percent/label.'
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
    if(cloudAssemblyEnabled())throw new HttpError(503,'Cloud stills are already approved. Watch the opening video and use Approve opening in the job card to continue.');
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
     if(cloudAssemblyEnabled())throw new HttpError(503,'Use Approve opening in the job card after watching it. Retry cannot bypass opening review.');
     return {ok:true,...await proceedTemplate1Job(jobId,{env,fetchImpl})};
    }
    if(cloudAssemblyEnabled())return {ok:true,...await retryCloudTemplate1Job(jobId)};
    return {ok:true,...await retryTemplate1Job(jobId,{env,fetchImpl})};
   }
  })
 };
 return createStoryboardWorkflow(tools,{messages,env,openaiClient});
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
