import test from 'node:test';
import {STORYBOARD_DIRECTION} from '../server/assembly-storyboard-astra.mjs';
import assert from 'node:assert/strict';
import {createStoryboardWorkflow,storyboardConversation} from '../server/storyboard-workflow.mjs';
import {buildStoryboardSheetPrompt,shotsToStoryboard} from '../server/assembly-sell-path.mjs';
import {buildAssemblyChatTools} from '../server/assembly-chat-agent.mjs';

const shots=[
 {scene:'Oyster HALF CLOSED on the beach; pearl partially concealed.',camera:'Locked tripod, eye level, 50mm, identical framing'},
 {scene:'Same oyster opens to reveal the couple sitting ON the pearl. Same beach, same angle.',camera:'Locked tripod, eye level, 50mm, identical framing'}
];
shots.push(...Array.from({length:3},()=>({...shots[1]})));
shots.forEach((s,i)=>{s.start=i*3;s.end=(i+1)*3;});
const board={direction:STORYBOARD_DIRECTION,...shotsToStoryboard('oyster',shots),continuity:'Same beach, same oyster, same pearl, locked camera; only shell opens.',sheetUrl:'https://example.com/board-v1.jpg',revision:1,locked:false};
const output=(name,out)=>({role:'assistant',parts:[{type:'tool-'+name,state:'output-available',output:out}]});
const history=[output('lock_theme_pin',{ok:true,pinUrl:'https://example.com/pin.jpg'}),output('propose_storyboard',{ok:true,storyboard:board})];
function harness(messages=history,{fail=false}={}){
 const calls=[];
 const names=['propose_storyboard','craft_storyboard_sheet','lock_storyboard','craft_storyboard_stills','flare_edit','craft_chapter_solos','lock_final_image','start_template1','set_sell_stage','lock_theme_pin'];
 const tools=Object.fromEntries(names.map(name=>[name,{execute:async input=>{
  calls.push({name,input});
  if(name==='propose_storyboard')return {ok:true,storyboard:shotsToStoryboard(input.revealType,input.shots)};
  if(name==='craft_storyboard_sheet')return fail?{ok:false,error:'Provider unavailable'}:{ok:true,sheetUrl:'https://example.com/board-v2.jpg',storyboard:{...shotsToStoryboard(input.revealType,input.shots),continuity:input.continuity,sheetUrl:'https://example.com/board-v2.jpg'}};
  if(name==='lock_storyboard')return {ok:true,storyboard:{...input,locked:true,firstImageUrl:'https://example.com/first.jpg',lastImageUrl:'https://example.com/last.jpg'}};
  return {ok:true,...input};
 }}]));
 return {tools:createStoryboardWorkflow(tools,{messages,author:async()=>({...board,authorModel:'gpt-6-astra'}),compile:async()=> 'Approved timeline'}),calls};
}

test('five-frame oyster story paints automatically, preserves continuity, and uses previous sheet',async()=>{
 const {tools,calls}=harness();
 const revised=await tools.propose_storyboard.execute({revealType:'oyster',shots});
 assert.equal(revised.ok,true);
 assert.equal(revised.storyboard.revision,2);
 assert.equal(revised.storyboard.locked,false);
 const paint=calls.find(c=>c.name==='craft_storyboard_sheet').input;
 assert.equal(paint.sheetBaseUrl,board.sheetUrl);
 assert.equal(paint.continuity,board.continuity);
 assert.equal(paint.shots.length,5);
 assert.match(paint.shots[0].scene,/HALF CLOSED/);
 assert.match(paint.shots[1].scene,/ON the pearl/);
 assert.equal((await tools.craft_storyboard_stills.execute({})).ok,false);
 assert.equal((await tools.lock_storyboard.execute({sheetUrl:revised.sheetUrl})).ok,false);
 assert.equal(calls.some(c=>c.name==='lock_storyboard'),false);
});

test('only separate approval of visible latest sheet extracts its canonical scene descriptions',async()=>{
 const {tools,calls}=harness([...history,{role:'user',parts:[{type:'text',text:'Approve storyboard\nsheetUrl: '+board.sheetUrl}]}]);
 const result=await tools.lock_storyboard.execute({sheetUrl:board.sheetUrl,firstBrief:'wrong door',lastBrief:'wrong couple'});
 assert.equal(result.ok,true);
 assert.equal(calls[0].input.firstBrief,shots[0].scene);
 assert.equal(calls[0].input.lastBrief,shots[1].scene);
 assert.equal((await tools.lock_final_image.execute({})).ok,true);
});

test('stale approval, approval mixed with edits, and missing sheet never run extraction',async()=>{
 for(const text of ['Approve storyboard\nsheetUrl: https://example.com/older.jpg','Approve storyboard but change the oyster first','Approve storyboard\nChange the oyster first','yes']){
  const {tools,calls}=harness([...history,{role:'user',content:text}]);
  assert.equal((await tools.lock_storyboard.execute({sheetUrl:board.sheetUrl})).ok,false);
  assert.equal(calls.length,0);
 }
 const {tools}=harness([]);
 assert.equal((await tools.lock_storyboard.execute({sheetUrl:board.sheetUrl})).ok,false);
});

test('revising after approval invalidates approval; downstream tools cannot skip the board',async()=>{
 const {tools}=harness([...history,{role:'user',content:'Approve storyboard'}]);
 await tools.propose_storyboard.execute({revealType:'oyster',shots});
 for(const name of ['lock_storyboard','craft_storyboard_stills','craft_chapter_solos','lock_final_image','start_template1']){
  assert.equal((await tools[name].execute({sheetUrl:'https://example.com/board-v2.jpg'})).ok,false,name);
 }
 assert.equal((await tools.set_sell_stage.execute({stage:'face_swap'})).ok,false);
 assert.equal((await tools.flare_edit.execute({which:'sheet'})).ok,false);
});

test('provider failure keeps old image but blocks approval across subsequent turns',async()=>{
 const {tools}=harness(history,{fail:true});
 const result=await tools.propose_storyboard.execute({revealType:'oyster',shots});
 assert.equal(result.ok,false);
 assert.equal(result.revisionPending,true);
 const messages=[...history,output('propose_storyboard',result),{role:'user',content:'Approve storyboard'}];
 assert.equal(storyboardConversation(messages).board.sheetUrl,board.sheetUrl);
 assert.equal(storyboardConversation(messages).approvedSheet,'');
 assert.equal((await harness(messages).tools.lock_storyboard.execute({sheetUrl:board.sheetUrl})).ok,false);
});

test('theme can be locked and storyboard painted in same request',async()=>{
 const {tools,calls}=harness([]);
 await tools.lock_theme_pin.execute({pinUrl:'https://example.com/new-pin.jpg'});
 assert.equal((await tools.propose_storyboard.execute({revealType:'oyster',shots})).ok,true);
 assert.equal(calls.find(c=>c.name==='craft_storyboard_sheet').input.pinUrl,'https://example.com/new-pin.jpg');
});

test('real tool schemas accept five shots and continuity; prompt does not force hidden first scene',()=>{
 const tools=buildAssemblyChatTools();
 for(const name of ['propose_storyboard','craft_storyboard_sheet']){
  assert.ok(tools[name].inputSchema.parse({pinUrl:'https://example.com/pin.jpg',revealType:'oyster',shots,continuity:board.continuity}));
 }
 const prompt=buildStoryboardSheetPrompt({revealType:'oyster',shots,continuity:board.continuity});
 assert.match(prompt,/5 stacked numbered rows/);
 assert.match(prompt,/HALF CLOSED/);
 assert.match(prompt,/ON the pearl/);
 assert.match(prompt,/locked camera/);
 assert.doesNotMatch(prompt,/people allowed only here|nothing beyond visible yet/);
});

 test('legacy text-only locks do not count as visual approval',()=>{
 const state=storyboardConversation([output('lock_storyboard',{ok:true,storyboard:{firstBrief:'door',lastBrief:'couple',locked:true}})]);
 assert.equal(state.board.locked,false);
 });

 test('approval compiles once and generation receives the authoritative prompt',async()=>{
 const {tools}=harness([...history,{role:'user',content:'Approve storyboard'}]);
 const approved=await tools.lock_storyboard.execute({sheetUrl:board.sheetUrl});
 assert.equal(approved.storyboard.openingPrompt,'Approved timeline');
 const job=await tools.start_template1.execute({storyboard:{openingPrompt:'wrong'}});
 assert.equal(job.storyboard.openingPrompt,'Approved timeline');
 });

test('an older five-frame static board must be revised before approval',async()=>{
 const old={...board,direction:undefined};
 const {tools,calls}=harness([output('propose_storyboard',{ok:true,storyboard:old}),{role:'user',content:'Approve storyboard'}]);
 const result=await tools.lock_storyboard.execute({sheetUrl:old.sheetUrl});
 assert.equal(result.ok,false);
 assert.match(result.message,/FPV photoshoot/);
 assert.equal(calls.length,0);
});

test('sheet includes both in-scene titles and all finale layers without locking every camera',()=>{
 const layered=shots.map((shot,i)=>({...shot,titleText:['','','SAVE THE DATE',"We're getting married",''][i]}));
 const prompt=buildStoryboardSheetPrompt({shots:layered,airborneLayers:['Near-lens pearl dust drifting left','Distant silk canopy undulating']});
 assert.match(prompt,/In-scene title: SAVE THE DATE/);
 assert.match(prompt,/In-scene title: We're getting married/);
 assert.match(prompt,/Distant silk canopy undulating/);
 assert.match(prompt,/360-degree orbit/);
 assert.doesNotMatch(prompt,/use identical location, framing/);
});
