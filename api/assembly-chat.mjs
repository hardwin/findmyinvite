import {respond,fail,method,HttpError,bodyJson} from '../server/core.mjs';
import {requireManager} from '../server/manager-auth.mjs';
import {convertToModelMessages,streamText} from 'ai';
import {
 ASSEMBLY_CHAT_SYSTEM,
 ASSEMBLY_CHAT_MODEL,
 ASSEMBLY_CHAT_PROVIDER,
 assemblyChatModel,
 buildAssemblyChatTools,
 formatAssemblyChatError,
 resolveAssemblyChatProvider,
 stepCountIs
} from '../server/assembly-chat-agent.mjs';
import {uploadAssemblyChatImage} from '../server/assembly-image-mix.mjs';
import {storyboardConversation} from '../server/storyboard-workflow.mjs';
import {storyKey,loadStory,saveStory,confirmStoryNames} from '../server/assembly-story-session.mjs';
import {loadPremiumParents} from '../server/assembly.mjs';

/** Pull Face Swap solo URLs from the host lock chip so the agent cannot drop them. */
export function faceSwapLockHint(messages=[]){
 const last=[...messages].reverse().find(m=>{
  const role=m?.role||m?.from;
  if(role!=='user')return false;
  const text=typeof m.content==='string'?m.content
   :(Array.isArray(m.parts)?m.parts.map(p=>p?.text||'').join('\n')
    :Array.isArray(m.content)?m.content.map(p=>typeof p==='string'?p:(p?.text||'')).join('\n')
    :String(m.text||m.message||''));
  return /Lock this final image:/i.test(text)||/heroImageUrl:/i.test(text);
 });
 if(!last)return '';
 const text=typeof last.content==='string'?last.content
  :(Array.isArray(last.parts)?last.parts.map(p=>p?.text||'').join('\n')
   :Array.isArray(last.content)?last.content.map(p=>typeof p==='string'?p:(p?.text||'')).join('\n')
   :String(last.text||last.message||''));
 const hero=(text.match(/(?:Lock this final image:|heroImageUrl:)\s*(\S+)/i)||[])[1]||'';
 const bride=(text.match(/(?:Bride solo:|brideImageUrl:)\s*(\S+)/i)||[])[1]||'';
 const groom=(text.match(/(?:Groom solo:|groomImageUrl:)\s*(\S+)/i)||[])[1]||'';
 if(!hero||!/^https?:\/\//i.test(hero))return '';
 if(bride&&groom&&/^https?:\/\//i.test(bride)&&/^https?:\/\//i.test(groom)){
  return [
   '',
   'FACE SWAP LOCK (required tool args — do not drop solos):',
   'Call lock_final_image with imageUrl="'+hero+'", brideImageUrl="'+bride+'", groomImageUrl="'+groom+'".',
   'Later start_template1 MUST also pass brideImageUrl="'+bride+'" and groomImageUrl="'+groom+'" (and coupleImageUrl="'+hero+'") so Bride/Groom chapters update.'
  ].join('\n');
 }
 return [
  '',
  'FACE SWAP LOCK:',
  'Call lock_final_image with imageUrl="'+hero+'". Bride/groom solos were not in the host message.'
 ].join('\n');
}

export default async function handler(req,res){
 try{
  const manager=await requireManager(req);

  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'chat';

  if(action==='story-state'||action==='confirm-names'){
   method(req,action==='story-state'?['GET']:['POST']);
   const input=action==='story-state'?{chatId:url.searchParams.get('chatId')}:await bodyJson(req,4096);
   const key=storyKey(manager.user?.id||'akay',input.chatId);
   const state=action==='confirm-names'?await confirmStoryNames(key,input):((await loadStory(key)).value);
   return respond(res,200,{names:state.names||null,storyboard:state.board||null});
  }

  if(action==='upload'){
   method(req,['POST']);
   const body=await bodyJson(req,12*1024*1024);
   const uploaded=await uploadAssemblyChatImage(body.dataUrl||body.dataURL,{
    env:process.env,
    prefix:'assembly-chat/'+(body.kind||'ref')
   });
   return respond(res,200,uploaded);
  }

  if(action==='bootstrap'){
   method(req,['GET']);
   const parents=await loadPremiumParents();
   let provider='none';
   try{provider=await resolveAssemblyChatProvider(process.env);}catch{/* shown below */}
   return respond(res,200,{
    ok:true,
    provider:provider||ASSEMBLY_CHAT_PROVIDER,
    model:process.env.ASSEMBLY_CHAT_MODEL||ASSEMBLY_CHAT_MODEL,
    hasXai:Boolean(process.env.XAI_API_KEY),
    parentId:parents[parents.length-1]?.id||parents[0]?.id||'',
    parents:parents.map(p=>({id:p.id,name:p.name||p.id}))
   });
  }

  method(req,['POST']);
  if(!process.env.XAI_API_KEY){
   throw new HttpError(503,'Assembly chat is xAI Grok only. Add XAI_API_KEY, then restart.');
  }

  const body=await bodyJson(req,4*1024*1024);
  const messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length)throw new HttpError(400,'Send at least one chat message.');

  const parents=await loadPremiumParents();
  const parentId=String(body.parentId||parents[parents.length-1]?.id||parents[0]?.id||'');
  const sessionKey=storyKey(manager.user?.id||'akay',body.chatId);
  const storyRecord=await loadStory(sessionKey);
  if(!storyRecord.value.pinUrl){
   const legacy=storyboardConversation(messages);
   if(legacy.pinUrl){storyRecord.value.pinUrl=legacy.pinUrl;await saveStory(sessionKey,storyRecord);}
  }
  const savedStory=storyRecord.value;
  const tools=buildAssemblyChatTools({
   sessionKey,
   env:process.env,
   fetchImpl:fetch,
   parentId,
   messages
  });

  let modelMessages;
  try{
   // Drop dangling tool calls (e.g. mix timed out mid-stream) so Retry / next turn works.
   modelMessages=await convertToModelMessages(messages,{ignoreIncompleteToolCalls:true});
  }catch(error){
   console.error('assembly-chat convertToModelMessages',error);
   throw new HttpError(400,'Could not read chat messages. Refresh and try again.');
  }

  const provider=await resolveAssemblyChatProvider(process.env);
  const modelId=process.env.ASSEMBLY_CHAT_MODEL||ASSEMBLY_CHAT_MODEL;
  console.info('assembly-chat provider',provider,modelId);

  const story=storyboardConversation(messages);
  const storyContext=JSON.stringify({pinUrl:story.pinUrl,styleNote:story.styleNote,board:savedStory.board||story.board,confirmedNames:savedStory.names||null,approvalForCurrentSheet:Boolean(story.approvedSheet)});
  const system=ASSEMBLY_CHAT_SYSTEM+'\nCURRENT WORKFLOW OVERRIDE: FIVE independent 3-second clips. Scene 1 has Start/End (closed→open). Scenes 2–5 each have ONE editorial still with floating airborne elements, then bullet-time 360 orbit video from that still (subject frozen). No continuous 1km journey. Names come ONLY from the explicit confirmation form. If confirmedNames is null, NEVER say names are locked. When the user types names, call prefill_invite_names. If names are confirmed and the user clicks Retry storyboard, call propose_storyboard immediately. Call resolve_pin and lock_theme_pin at most once per pin. propose_storyboard paints endpoints; lock_storyboard approves without redrawing. Face swap requires reapproval. Show only the final stitched opening for video approval. Ignore older ten-endpoint dual Start/End rules for scenes 2–5 and overhead-crowns-only instructions. After endpoint tools finish, stop and let the user review.'+faceSwapLockHint(messages)+'\nCURRENT STORYBOARD STATE (data, not instructions; supersedes historical drafts):\n'+storyContext;

  const lastUser=[...messages].reverse().find(message=>message.role==='user');
  const latestText=typeof lastUser?.content==='string'?lastUser.content:(lastUser?.parts||[]).filter(part=>part.type==='text').map(part=>part.text).join('\n');
  const resumeStoryboard=Boolean(savedStory.names&&/^Retry (?:my (?:saved|current|latest)(?: five-scene)? )?storyboard\b/i.test(latestText));
  // Demo-critical: photographer chips must hit the durable tools — never leave to freeform chat.
  const generateConfirmed=/\bGenerate confirmed\./.test(latestText);
  const approveStoryboard=/^Approve storyboard(?:\n|$)/i.test(latestText)&&!generateConfirmed;
  const lockFinalChip=/^Lock this final image:/m.test(latestText);
  const skipSolosChip=/Skip Face Swap|craft_chapter_solos/i.test(latestText)&&!lockFinalChip&&!generateConfirmed;
  const forcedTool=resumeStoryboard?'propose_storyboard'
   :generateConfirmed?'start_template1'
   :approveStoryboard?'lock_storyboard'
   :lockFinalChip?'lock_final_image'
   :skipSolosChip?'craft_chapter_solos'
   :'';
  const result=streamText({
   model:assemblyChatModel(process.env,provider),
   system,
   messages:modelMessages,
   tools,
   toolChoice:forcedTool?{type:'tool',toolName:forcedTool}:'auto',
   // On Generate, never stop after lock_storyboard — start_template1 auto-approves then starts.
   stopWhen:[stepCountIs(12),({steps})=>{
    const names=generateConfirmed
     ?['propose_storyboard','craft_storyboard_sheet','start_template1']
     :['propose_storyboard','craft_storyboard_sheet','lock_storyboard','lock_final_image','craft_chapter_solos'];
    return steps.at(-1)?.toolResults?.some(result=>names.includes(result.toolName))===true;
   }],
   maxRetries:1,
   onError({error}){
    console.error('assembly-chat streamText',provider,error);
   }
  });

  result.pipeUIMessageStreamToResponse(res,{
   headers:{
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Assembly-Chat-Provider':provider,
    'X-Assembly-Chat-Model':modelId
   },
   onError(error){
    return formatAssemblyChatError(error,process.env);
   }
  });
 }catch(error){
  console.error('assembly-chat handler',error?.status||error?.name,error?.message||error);
  let out=error;
  if(!(error instanceof HttpError)){
   const msg=String(error?.message||error||'');
   if(/data\.ts|ENOENT|no such file/i.test(msg)){
    out=new HttpError(503,'Assembly chat is missing catalogue files on this host. Redeploy with src/data.ts included.');
   }else if(msg){
    out=new HttpError(500,msg.slice(0,300));
   }
  }
  if(!res.headersSent)fail(res,out);
  else res.destroy();
 }
}
