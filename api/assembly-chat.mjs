import {respond,fail,method,HttpError,bodyJson} from '../server/core.mjs';
import {sessionOk} from '../server/akay-gate.mjs';
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
import {loadPremiumParents} from '../server/assembly.mjs';

export default async function handler(req,res){
 try{
  if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');

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
   parentId
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

  const result=streamText({
   model:assemblyChatModel(process.env,provider),
   system:ASSEMBLY_CHAT_SYSTEM,
   messages:modelMessages,
   tools,
   stopWhen:stepCountIs(8),
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
