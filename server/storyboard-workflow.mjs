import {authorStoryboard,compileStoryboard,validateTimedStoryboard,STORYBOARD_DIRECTION} from './assembly-storyboard-astra.mjs';
// Request-scoped storyboard state reconstructed from this conversation, never global.
export function storyboardConversation(messages=[]){
 let board=null,pinUrl='',styleNote='';
 for(const message of messages){
  if(message.role!=='assistant')continue;
  for(const part of message.parts||[]){
   const name=part.toolName||(String(part.type||'').startsWith('tool-')?part.type.slice(5):'');
   const out=part.output||part.result;
   if(!out)continue;
   if(out.ok===false){if(out.revisionPending)board={...board,locked:false,revisionPending:true};continue;}
   if(name==='lock_theme_pin'){pinUrl=out.pinUrl||pinUrl;styleNote=out.themeGrounded===true?(out.styleNote||''):'';board=null;}
   if(out.storyboard){
    const previous=board;
    board={...board,...out.storyboard};
    if(name==='propose_storyboard'&&!out.storyboard.sheetUrl)board={...board,sheetUrl:'',locked:false};
    if(board.sheetUrl&&board.sheetUrl!==previous?.sheetUrl)board.locked=name==='lock_storyboard';
   }
   if(name==='flare_edit'&&out.which==='sheet'&&out.sheetUrl){
    board={...board,sheetUrl:out.sheetUrl,locked:false,firstImageUrl:'',lastImageUrl:''};
   }
  }
 }
 if(board){try{validateTimedStoryboard(board);if(!board.sheetUrl||!board.openingPrompt||board.direction!==STORYBOARD_DIRECTION)board.locked=false;}catch{board.locked=false;}}
 const last=messages.at(-1);
 const text=last?.role==='user'?(typeof last.content==='string'?last.content:(last.parts||[]).filter(p=>p.type==='text').map(p=>p.text||'').join('\n')):'';
 // Explicit approval must refer to the board already visible BEFORE this turn.
 const explicit=/^(?:approve|lock)(?: this| the| current)? storyboard(?: sheet)?[.!]?(?:\n|$)/i.test(text.trim())||/^(?:yes[,! ]*)?(?:I )?approve (?:this|the|current) (?:storyboard|sheet)[.! ]*$/i.test(text.trim());
 const target=(text.match(/^sheetUrl:\s*(\S+)/m)||[])[1];
 const approvedSheet=explicit&&!/\b(?:but|change|revise|instead|except|not yet)\b/i.test(text)&&!board?.revisionPending&&board?.sheetUrl&&(!target||target===board.sheetUrl)?board.sheetUrl:'';
 return {board,pinUrl,styleNote,approvedSheet};
}

export function createStoryboardWorkflow(tools,{messages=[],env=process.env,fetchImpl=fetch,openaiClient,author=authorStoryboard,compile=compileStoryboard}={}){
 const state=storyboardConversation(messages);
 const denied=message=>({ok:false,error:message,message,stage:'storyboard'});
 let paintedSignature='',paintedResult=null;
 let storyboardAttempt;
 const creativeContext=messages.filter(m=>m.role==='user').slice(-10).map(m=>(typeof m.content==='string'?m.content:(m.parts||[]).filter(p=>p.type==='text').map(p=>p.text).join('\n')).slice(0,1600));
 const paint=tools.craft_storyboard_sheet.execute;
 const last=messages.at(-1);
 const request=last?.role==='user'?(last.content||(last.parts||[]).filter(p=>p.type==='text').map(p=>p.text).join('\n')):'';
 async function paintBoard(input){
  const previous=state.board;
  const pinUrl=state.pinUrl||previous?.pinUrl||input.pinUrl;
  if(!pinUrl)return denied('Choose a theme reference before painting the storyboard.');
  let authored;
  state.approvedSheet='';
  try{authored=validateTimedStoryboard(await author({request,creativeContext,previous,draft:input,styleNote:state.styleNote,pinUrl,fetchImpl,env,openaiClient}));}
  catch(error){
   if(previous)state.board={...previous,locked:false,revisionPending:true};
   const timedOut=/timed out|timeout/i.test(String(error.message));
   return {...denied(timedOut?'Storyboard writing timed out before image rendering started. Your theme and idea are preserved. Retry when ready.':'Could not write the five-frame storyboard: '+error.message),failedStage:'writing',timedOut,revisionPending:true,retryable:true,message:'Stop this turn. Storyboard writing failed before painting began. Do not retry automatically or ask for a different idea; let the photographer retry.'};
  }
  const draft={...input,...authored,pinUrl,styleNote:state.styleNote,sheetBaseUrl:previous?.direction===STORYBOARD_DIRECTION?previous.sheetUrl:undefined};
  const signature=JSON.stringify({shots:draft.shots,continuity:draft.continuity,pinUrl:draft.pinUrl,revealType:draft.revealType});
  if(signature===paintedSignature&&paintedResult)return paintedResult;
  state.approvedSheet='';
  const result=await paint(draft);
  if(!result.ok){
   // Keep the last visible board; it cannot be approved after an unrendered revision.
   state.board={...previous,...draft,sheetUrl:previous?.sheetUrl||'',locked:false,revisionPending:true};
   return {...result,stage:'storyboard',failedStage:'painting',revisionPending:true,message:'Stop this turn. The sheet could not be painted. Do not retry automatically; let the photographer retry.'};
  }
  state.board={...result.storyboard,authorModel:authored.authorModel,direction:authored.direction,airborneLayers:authored.airborneLayers,duration:15,openingPrompt:'',revision:(previous?.revision||0)+1,locked:false,revisionPending:false,firstImageUrl:'',lastImageUrl:''};
  paintedSignature=signature;
  paintedResult={...result,storyboard:state.board,message:'Updated visual storyboard is ready in Preview. Describe another change or approve this exact sheet. Stop here; do not generate frames this turn.'};
  return paintedResult;
 }
 tools.propose_storyboard.execute=input=>(storyboardAttempt||=paintBoard(input));
 tools.craft_storyboard_sheet.execute=input=>(storyboardAttempt||=paintBoard(input));
 const lock=tools.lock_storyboard.execute;
 tools.lock_storyboard.execute=async input=>{
  const board=state.board;
  if(!board?.sheetUrl||state.approvedSheet!==board.sheetUrl||input.sheetUrl!==board.sheetUrl){
   return denied('Show the latest painted storyboard and ask the photographer to use Approve storyboard. No First/Last frames have been generated.');
  }
  try{
   if(board.direction!==STORYBOARD_DIRECTION)return denied('Rebuild this board as the new FPV photoshoot before approving; the previous direction is preserved for reference.');
   validateTimedStoryboard(board);
   const openingPrompt=await compile({board,env,openaiClient});
   const result=await lock({...input,...board,pinUrl:board.pinUrl||state.pinUrl,sheetUrl:board.sheetUrl});
   if(result.ok)state.board={...board,...result.storyboard,openingPrompt,promptModel:'gpt-6-astra',locked:true};
   return {...result,storyboard:state.board};
  }catch(error){return denied('Could not prepare the approved video prompt and frames: '+String(error.message||error).slice(0,350)+'. Retry approval; your sheet is preserved.');}
 };
 const lockTheme=tools.lock_theme_pin.execute;
 tools.lock_theme_pin.execute=async input=>{
  const result=await lockTheme(input);
  if(result.ok){state.pinUrl=result.pinUrl;state.styleNote=result.styleNote;state.board=null;state.approvedSheet='';}
  return result;
 };
 const stills=tools.craft_storyboard_stills.execute;
 tools.craft_storyboard_stills.execute=async input=>{
  if(!state.board?.locked)return denied('First/Last generation is blocked until the visual storyboard is approved. Use propose_storyboard to paint or revise the board now.');
  return stills(input);
 };
 const edit=tools.flare_edit.execute;
 tools.flare_edit.execute=async input=>{
  if(input.which==='sheet')return denied('Use propose_storyboard with all revised shots and continuity. It edits the existing sheet AND updates the scene descriptions together.');
  if((state.pinUrl||state.board)&&!state.board?.locked)return denied('Revise the storyboard with propose_storyboard first. Final image editing follows storyboard approval.');
  return edit(input);
 };
 for(const name of ['craft_chapter_solos','lock_final_image','start_template1']){
  const execute=tools[name].execute;
  tools[name].execute=async input=>{
   if((state.pinUrl||state.board)&&!state.board?.locked)return denied('Approve the current visual storyboard and extract its frames before continuing.');
   if(name==='start_template1'&&state.board){
    if(!state.board.openingPrompt)return denied('Approve the five-frame storyboard to prepare its timed opening prompt.');
    return execute({...input,storyboard:state.board,promptParams:{...input.promptParams,approvedOpeningPrompt:state.board.openingPrompt}});
   }
   return execute(input);
  };
 }
 const stage=tools.set_sell_stage.execute;
 tools.set_sell_stage.execute=async input=>{
  if(state.board&&!state.board.locked&&!['welcome','theme','storyboard'].includes(input.stage))return denied('Keep working on the storyboard until the current sheet is approved.');
  return stage(input);
 };
 return tools;
}
