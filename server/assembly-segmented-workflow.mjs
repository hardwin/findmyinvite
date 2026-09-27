import {tool} from 'ai';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {loadStory as loadStoryDefault,saveStory as saveStoryDefault,validateManifest,SEGMENTED_VERSION} from './assembly-story-session.mjs';
import {authorSegmentedStoryboard} from './assembly-storyboard-astra.mjs';
import {paintEndpoints,storeEndpoint} from './assembly-segmented-board.mjs';
const text=m=>typeof m?.content==='string'?m.content:(m?.parts||[]).filter(p=>p.type==='text').map(p=>p.text).join('\n');
const endpointsReady=board=>Boolean(board?.scenes?.length===5&&board.scenes.every(scene=>scene.first&&scene.last)&&board.sheetUrl);
const wantsApprove=/^Approve storyboard(?:\n|$)/i;
const wantsGenerate=/\bGenerate confirmed\./;
export function createSegmentedWorkflow(tools,{sessionKey,messages=[],env=process.env,fetchImpl=fetch,openaiClient,imageRunner,loadStory=loadStoryDefault,saveStory=saveStoryDefault}={}){
 const fail=message=>({ok:false,stage:'storyboard',error:message,message});
 const latest=text(messages.at(-1));
 tools.prefill_invite_names=tool({
  description:'Prefill the visible confirmation form with names explicitly typed by the user. This NEVER confirms or locks names. Ask the user to review the bride/groom assignment and click Confirm names.',
  inputSchema:z.object({groomName:z.string().min(1).max(80),brideName:z.string().min(1).max(80)}),
  execute:async names=>{
   if(!latest.includes(names.groomName)||!latest.includes(names.brideName))return {ok:false,message:'Only prefill names explicitly present in the latest user message; never invent names.'};
   return {ok:true,nameDraft:names,requiresNameConfirmation:true,message:'The names form is prefilled, not confirmed. Ask the photographer to review both fields and click Confirm names.'};
  }
 });
 let attempt;
 const output=(board,message)=>({ok:true,stage:'storyboard',storyboard:board,sheetUrl:board.sheetUrl,urls:board.sheetUrl?[board.sheetUrl]:[],message});
 /** Persist approval when all ten endpoints exist. Demo-safe repair for lost ETag races / LLM skip. */
 async function ensureApproved(record,{requireExplicit=false,persist=true}={}){
  const board=record.value.board,names=record.value.names;
  if(!names||!endpointsReady(board))return null;
  if(requireExplicit&&!wantsApprove.test(latest)&&!wantsGenerate.test(latest)&&!/^Lock this final image:/m.test(latest))return null;
  const approvalFresh=board.locked&&record.value.approval?.names?.revision===names.revision;
  if(approvalFresh){
   board.revisionPending=false;
   board.namesRevision=names.revision;
   return record.value.approval;
  }
  const revision=randomUUID();
  const final=record.value.identity?.asset||board.scenes[4].last;
  record.value.approval=validateManifest({
   version:SEGMENTED_VERSION,
   approvalRevision:revision,
   names,
   identityRevision:record.value.identity?.revision||final.revision,
   finalAssetHash:final.sha256,
   scenes:board.scenes.map(s=>({index:s.index,duration:3,scene:s.scene,firstBrief:s.firstBrief,lastBrief:s.lastBrief,titleText:s.titleText,prompt:s.prompt,first:s.first,last:s.last,approvalRevision:revision}))
  });
  board.locked=true;
  board.revisionPending=false;
  board.namesRevision=names.revision;
  board.approvalRevision=revision;
  board.openingPrompt=board.scenes.map((s,i)=>'Scene '+(i+1)+' (local 0–3s): '+s.prompt).join('\n\n');
  if(persist){
   try{await saveStory(sessionKey,record,env);}
   catch(error){
    // Generate still carries openingManifest; cloud claims approval+job in one write.
    console.error('ensureApproved saveStory',error?.message||error);
   }
  }
  return record.value.approval;
 }
 async function paint(input){
  const record=await loadStory(sessionKey,env);
  if(!record.value.names)return fail('Confirm both names in the invitation names form before painting. Names supplied by the model are not accepted.');
  const previous=record.value.board;
  if(record.value.identity&&/^Revise shot 5 of the CURRENT storyboard:/.test(latest))return fail('The finale ends on your locked final image. Edit that image in Face Swap, then lock the new version and approve the refreshed endpoints before changing its composition.');
  const pinUrl=record.value.pinUrl||previous?.pinUrl;
  if(!pinUrl)return fail('Lock a theme pin first.');
  try{
   // Save every completed endpoint. Explicit retries reuse a partially painted board.
   let board=previous?.revisionPending&&previous?.namesRevision===record.value.names.revision&&/retry/i.test(latest)?previous:await authorSegmentedStoryboard({request:latest,creativeContext:messages.filter(m=>m.role==='user').slice(-10).map(text),previous,pinUrl,names:record.value.names,env,fetchImpl,openaiClient});
   if(board!==previous&&previous?.version===SEGMENTED_VERSION){
    const match=latest.match(/^Revise shot ([1-5]) of the CURRENT storyboard:/);
    for(let i=0;i<5;i++){
     if(match&&i!==Number(match[1])-1)board.scenes[i]=previous.scenes[i];
     else if(board.namesRevision===previous.namesRevision&&JSON.stringify([board.scenes[i].firstBrief,board.scenes[i].lastBrief,board.continuity])===JSON.stringify([previous.scenes[i].firstBrief,previous.scenes[i].lastBrief,previous.continuity]))board.scenes[i]={...board.scenes[i],first:previous.scenes[i].first,last:previous.scenes[i].last};
    }
   }
   if(previous?.namesRevision!==board.namesRevision){
    if(previous?.version===SEGMENTED_VERSION)for(let i=1;i<5;i++)board.scenes[i]=previous.scenes[i];
    delete board.scenes[0].first;delete board.scenes[0].last;
   }
   record.value.board=board;board.revisionPending=true;board.locked=false;delete record.value.approval;
   const save=async b=>{record.value.board=b;await saveStory(sessionKey,record,env);};
   await save(board);
   board=await paintEndpoints(board,{env,fetchImpl,imageRunner,save,identity:record.value.identity?.asset});
   return output(board,'Ten endpoint images are ready. Review every Start and End before approving. No video has been generated.');
  }catch(error){return {...fail('Endpoint preparation stopped: '+error.message+'. Completed endpoints are saved; retry to resume.'),revisionPending:true,storyboard:record.value.board};}
 }
 tools.propose_storyboard=tool({
  description:'Prepare or resume the ten Start/End endpoint images for the five-scene storyboard. Uses the saved theme pin, form-confirmed names and latest user request. Astra authors the plan. No model-supplied URLs, names or scene drafts are needed. Completed endpoints are reused on retry.',
  inputSchema:z.object({}),execute:()=>(attempt||=paint())
 });
 tools.craft_storyboard_sheet=tool({
  description:'Alias for propose_storyboard. Prepare or resume the same ten endpoints from saved state; never call both tools in one turn.',
  inputSchema:z.object({}),execute:()=>(attempt||=paint())
 });
 const saveDetails=tools.save_invite_details.execute;
 tools.save_invite_details.execute=async input=>{
  const record=await loadStory(sessionKey,env),names=record.value.names;
  if(!names)return fail('Confirm names in the invitation form first.');
  if((input.groomName&&input.groomName!==names.groomName)||(input.brideName&&input.brideName!==names.brideName))return fail('Names differ from the confirmed opening. Change them using Edit names and reapprove the endpoints.');
  return saveDetails({...input,groomName:names.groomName,brideName:names.brideName});
 };
 const lockTheme=tools.lock_theme_pin.execute;
 tools.lock_theme_pin.execute=async input=>{
  const existing=await loadStory(sessionKey,env);
  if(existing.value.pinUrl===input.pinUrl)return {ok:true,locked:true,stage:'storyboard',pinUrl:input.pinUrl,previewUrl:existing.value.board?.pinPreview||input.pinUrl,themeGrounded:true,message:'Theme already locked. Continue the current storyboard.'};
  const result=await lockTheme(input);
  if(!result.ok)return result;
  const record=await loadStory(sessionKey,env);
  if(record.value.pinUrl!==result.pinUrl){
   record.value.pinUrl=result.pinUrl;
   delete record.value.board;delete record.value.approval;delete record.value.identity;delete record.value.generation;delete record.value.segmentedRunId;
   await saveStory(sessionKey,record,env);
  }
  const names=record.value.names;
  return {...result,requiresNameConfirmation:!names,message:names?'Theme locked. Continue the saved storyboard idea; prepare ten endpoint images for review.':'Theme locked. Names are NOT confirmed. Direct the photographer to the visible names form; names typed in chat may only prefill it.'};
 };
 tools.lock_storyboard.execute=async input=>{
  const record=await loadStory(sessionKey,env),board=record.value.board;
  if(!wantsApprove.test(latest)&&!wantsGenerate.test(latest))return fail('Review and approve the current ten endpoint images using the approval button.');
  if(!endpointsReady(board))return fail('Review and approve the current ten endpoint images using the approval button.');
  const chipSheet=(latest.match(/^sheetUrl:\s*(\S+)/m)||[])[1]||'';
  const inputSheet=String(input?.sheetUrl||'');
  // Accept chip/board/model sheetUrl as long as one matches the durable board.
  if(chipSheet&&chipSheet!==board.sheetUrl&&inputSheet&&inputSheet!==board.sheetUrl){
   return fail('Review and approve the current ten endpoint images using the approval button.');
  }
  await ensureApproved(record);
  return {...output(board,'All ten endpoints approved. Use Face Swap or keep this identity; generate only after details are confirmed.'),stage:record.value.identity?'details':'face_swap',heroImageUrl:board.lastImageUrl,firstImageUrl:board.firstImageUrl,lastImageUrl:board.lastImageUrl};
 };
 const lockFinal=tools.lock_final_image.execute;
 tools.lock_final_image.execute=async input=>{
  const record=await loadStory(sessionKey,env),board=record.value.board;
  if(!await ensureApproved(record,{requireExplicit:false})&&!board?.locked){
   return fail('Approve the current endpoints before selecting the final identity.');
  }
  // Prefer the durable Last endpoint over a stale theme-pin heroUrl from the client.
  const selected=latest.match(/^Lock this final image:\s*(https?:\/\/\S+)/m)?.[1];
  const boardLast=board.lastImageUrl;
  let authoritative=boardLast;
  if(selected&&selected===boardLast)authoritative=boardLast;
  else if(selected&&input.imageUrl===boardLast)authoritative=boardLast;
  else if(selected&&selected!==boardLast&&selected!==record.value.pinUrl&&!/pinimg\.com|i\.pinimg\.com/i.test(selected)){
   // Real face-swap / remix still — accept the photographer's Lock choice.
   authoritative=selected;
  }else if(input.imageUrl&&input.imageUrl===boardLast){
   authoritative=boardLast;
  }else if(selected&&(selected===record.value.pinUrl||/pinimg\.com|i\.pinimg\.com/i.test(selected))){
   // Skip-to-solos path often locks the original pin; keep the painted Last.
   authoritative=boardLast;
  }else if(selected){
   authoritative=selected;
  }
  const asset=authoritative===board.lastImageUrl?board.scenes[4].last:await storeEndpoint(authoritative,{env,fetchImpl,source:'face-swap-lock'});
  const result=await lockFinal({...input,imageUrl:asset.url});
  if(!result.ok)return result;
  record.value.identity={revision:randomUUID(),asset,brideImageUrl:result.brideImageUrl,groomImageUrl:result.groomImageUrl};
  if(asset.sha256===board.scenes[4].last.sha256){
   record.value.approval.identityRevision=record.value.identity.revision;
   await saveStory(sessionKey,record,env);
   return {...result,storyboard:board,heroImageUrl:asset.url,lastImageUrl:asset.url};
  }
  board.locked=false;board.revisionPending=true;board.revision=Date.now();delete record.value.approval;
  // Refresh every person-containing endpoint from the newly locked identity.
  for(let i=1;i<5;i++){delete board.scenes[i].first;delete board.scenes[i].last;}
  const save=async b=>{record.value.board=b;await saveStory(sessionKey,record,env);};
  await save(board);
  try{
   await paintEndpoints(board,{env,fetchImpl,imageRunner,save,identity:asset});
   return {...result,...output(board,'Face swap is now the exact final endpoint. Review the refreshed identity-dependent endpoints and approve this board.'),heroImageUrl:asset.url,lastImageUrl:asset.url,stage:'storyboard'};
  }catch(error){return {...fail('Identity refresh stopped: '+error.message+'. Retry storyboard to resume.'),storyboard:board,revisionPending:true};}
 };
 const start=tools.start_template1.execute;
 tools.start_template1.execute=async input=>{
  try{
   const record=await loadStory(sessionKey,env);
   if(!wantsGenerate.test(latest)&&!wantsApprove.test(latest))return fail('Use Generate after approving the endpoints and confirming details.');
   // Build the manifest in-memory; cloud start claims approval+generation in one blob write.
   if(!await ensureApproved(record,{persist:false}))return fail('Approve the current endpoints before generating.');
   const manifest=validateManifest(record.value.approval),last=manifest.scenes[4].last;
   return await start({
    ...input,
    revealType:'custom',
    openingManifest:manifest,
    storySessionKey:sessionKey,
    storyboard:{...record.value.board,revealType:'custom'},
    firstImageUrl:manifest.scenes[0].first.url,
    lastImageUrl:last.url,
    heroImageUrl:last.url,
    coupleImageUrl:last.url,
    groomName:manifest.names.groomName,
    brideName:manifest.names.brideName,
    brideImageUrl:record.value.identity?.brideImageUrl||input.brideImageUrl,
    groomImageUrl:record.value.identity?.groomImageUrl||input.groomImageUrl
   });
  }catch(error){
   const message=String(error?.message||error||'Generation failed.').slice(0,300);
   console.error('start_template1',message);
   return fail(/etag|precondition|412|claim generation/i.test(message)
    ?'Generation state was busy — tap Generate once more.'
    :message);
  }
 };
 const stage=tools.set_sell_stage.execute;
 tools.set_sell_stage.execute=async input=>{
  const record=await loadStory(sessionKey,env);
  if(record.value.board&&!record.value.board.locked&&!['welcome','theme','storyboard'].includes(input.stage)){
   if(endpointsReady(record.value.board)&&record.value.names)await ensureApproved(record);
   else return fail('Review and approve the current endpoint images first.');
  }
  return stage(input);
 };
 tools.craft_storyboard_stills.execute=async()=>fail('Use the ten saved endpoints; do not regenerate or extract a storyboard sheet.');
 const edit=tools.flare_edit.execute;
 tools.flare_edit.execute=async input=>['sheet','first','last'].includes(input.which)?fail('Revise the storyboard scene so its endpoint and approval stay synchronized.'):edit(input);
 return tools;
}
