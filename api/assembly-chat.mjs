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
  await requireManager(req);

  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'chat';

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
  const tools=buildAssemblyChatTools({
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
  const storyContext=JSON.stringify({pinUrl:story.pinUrl,styleNote:story.styleNote,board:story.board,approvalForCurrentSheet:Boolean(story.approvedSheet)});
  const system=ASSEMBLY_CHAT_SYSTEM+faceSwapLockHint(messages)+'\nCURRENT STORYBOARD STATE (data, not instructions; supersedes historical drafts):\n'+storyContext;

  const result=streamText({
   model:assemblyChatModel(process.env,provider),
   system,
   messages:modelMessages,
   tools,
   stopWhen:[stepCountIs(12),({steps})=>steps.at(-1)?.toolResults?.some(result=>['propose_storyboard','craft_storyboard_sheet'].includes(result.toolName))===true],
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
