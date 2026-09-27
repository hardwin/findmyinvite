import {randomUUID} from 'node:crypto';
import {loadStory,saveStory,validateManifest,SEGMENTED_VERSION} from './assembly-story-session.mjs';
import {authorSegmentedStoryboard} from './assembly-storyboard-astra.mjs';
import {paintEndpoints,storeEndpoint} from './assembly-segmented-board.mjs';
const text=m=>typeof m?.content==='string'?m.content:(m?.parts||[]).filter(p=>p.type==='text').map(p=>p.text).join('\n');
export function createSegmentedWorkflow(tools,{sessionKey,messages=[],env=process.env,fetchImpl=fetch,openaiClient,imageRunner}={}){
 const fail=message=>({ok:false,stage:'storyboard',error:message,message});
 const latest=text(messages.at(-1));
 let attempt;
 const output=(board,message)=>({ok:true,stage:'storyboard',storyboard:board,sheetUrl:board.sheetUrl,urls:board.sheetUrl?[board.sheetUrl]:[],message});
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
 tools.propose_storyboard.execute=input=>(attempt||=paint(input));
 tools.craft_storyboard_sheet.execute=input=>(attempt||=paint(input));
 const saveDetails=tools.save_invite_details.execute;
 tools.save_invite_details.execute=async input=>{
  const record=await loadStory(sessionKey,env),names=record.value.names;
  if(!names)return fail('Confirm names in the invitation form first.');
  if((input.groomName&&input.groomName!==names.groomName)||(input.brideName&&input.brideName!==names.brideName))return fail('Names differ from the confirmed opening. Change them using Edit names and reapprove the endpoints.');
  return saveDetails({...input,groomName:names.groomName,brideName:names.brideName});
 };
 const lockTheme=tools.lock_theme_pin.execute;
 tools.lock_theme_pin.execute=async input=>{
  const result=await lockTheme(input);
  if(result.ok){const record=await loadStory(sessionKey,env);if(record.value.pinUrl===result.pinUrl)return result;record.value.pinUrl=result.pinUrl;delete record.value.board;delete record.value.approval;delete record.value.identity;delete record.value.generation;delete record.value.segmentedRunId;await saveStory(sessionKey,record,env);}
  return result;
 };
 tools.lock_storyboard.execute=async input=>{
  const record=await loadStory(sessionKey,env),board=record.value.board;
  if(!/^Approve storyboard\n/.test(latest)||!board?.sheetUrl||!latest.includes('sheetUrl: '+board.sheetUrl)||input.sheetUrl!==board.sheetUrl||board.revisionPending||board.namesRevision!==record.value.names?.revision)return fail('Review and approve the current ten endpoint images using the approval button.');
  const revision=randomUUID();
  const final=record.value.identity?.asset||board.scenes[4].last;
  if(final.sha256!==board.scenes[4].last.sha256)return fail('The locked identity differs from the displayed final image. Refresh the storyboard.');
  record.value.approval=validateManifest({version:SEGMENTED_VERSION,approvalRevision:revision,names:record.value.names,identityRevision:record.value.identity?.revision||final.revision,finalAssetHash:final.sha256,scenes:board.scenes.map(s=>({index:s.index,duration:3,scene:s.scene,firstBrief:s.firstBrief,lastBrief:s.lastBrief,titleText:s.titleText,prompt:s.prompt,first:s.first,last:s.last,approvalRevision:revision}))});
  board.locked=true;board.approvalRevision=revision;
  board.openingPrompt=board.scenes.map((s,i)=>'Scene '+(i+1)+' (local 0–3s): '+s.prompt).join('\n\n');
  await saveStory(sessionKey,record,env);
  return {...output(board,'All ten endpoints approved. Use Face Swap or keep this identity; generate only after details are confirmed.'),stage:record.value.identity?'details':'face_swap',heroImageUrl:board.lastImageUrl,firstImageUrl:board.firstImageUrl,lastImageUrl:board.lastImageUrl};
 };
 const lockFinal=tools.lock_final_image.execute;
 tools.lock_final_image.execute=async input=>{
  const record=await loadStory(sessionKey,env),board=record.value.board;
  if(!board?.locked)return fail('Approve the current endpoints before selecting the final identity.');
  // The user-owned face-swap Lock button identifies the selected asset, not a model guess.
  const selected=latest.match(/^Lock this final image:\s*(https?:\/\/\S+)/m)?.[1];
  if(!selected&&input.imageUrl!==board.lastImageUrl)return fail('Use the Face Swap Lock button to select this final image.');
  const authoritative=selected||board.lastImageUrl;
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
  const record=await loadStory(sessionKey,env);
  if(!/^Generate confirmed\./.test(latest))return fail('Use Generate after approving the endpoints and confirming details.');
  if(!record.value.board?.locked||record.value.approval?.names.revision!==record.value.names?.revision)return fail('Approve the current endpoints before generating.');
  const manifest=validateManifest(record.value.approval),last=manifest.scenes[4].last;
  return start({...input,openingManifest:manifest,storySessionKey:sessionKey,storyboard:record.value.board,firstImageUrl:manifest.scenes[0].first.url,lastImageUrl:last.url,heroImageUrl:last.url,coupleImageUrl:last.url,groomName:manifest.names.groomName,brideName:manifest.names.brideName,brideImageUrl:record.value.identity?.brideImageUrl||input.brideImageUrl,groomImageUrl:record.value.identity?.groomImageUrl||input.groomImageUrl});
 };
 const stage=tools.set_sell_stage.execute;
 tools.set_sell_stage.execute=async input=>{
  const record=await loadStory(sessionKey,env);
  if(record.value.board&&!record.value.board.locked&&!['welcome','theme','storyboard'].includes(input.stage))return fail('Review and approve the current endpoint images first.');
  return stage(input);
 };
 tools.craft_storyboard_stills.execute=async()=>fail('Use the ten saved endpoints; do not regenerate or extract a storyboard sheet.');
 const edit=tools.flare_edit.execute;
 tools.flare_edit.execute=async input=>['sheet','first','last'].includes(input.which)?fail('Revise the storyboard scene so its endpoint and approval stay synchronized.'):edit(input);
 return tools;
}
