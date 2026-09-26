import test from 'node:test';
import assert from 'node:assert/strict';
import {authorStoryboard,compileStoryboard,validateTimedStoryboard} from '../server/assembly-storyboard-astra.mjs';
import {buildPrompts} from '../server/assembly-template1-prompts.mjs';
import {validateTemplate1Input} from '../server/assembly-template1.mjs';
import {storyboardToPromptParams} from '../server/assembly-sell-path.mjs';
const board={title:'Oyster',revealType:'oyster',airborneLayers:Array.from({length:15},(_,i)=>'Pearlescent layer '+i+' at depth '+i+' drifting in orbit'),continuity:'Continuous FPV through connected pearl palace setups.',shots:Array.from({length:5},(_,i)=>({start:i*3,end:(i+1)*3,titleText:['','','SAVE THE DATE',"We're getting married",''][i],scene:i===0?'Half closed oyster':'Couple sits ON the pearl',camera:'FPV drone',movement:i===4?'360-degree orbit through 15 moving layers':'Continuous parallax transition',emotion:'Romantic',transition:'Continuous'}))};
test('Astra authors exactly five timed frames and compiles a timestamped prompt without generic camera overrides',async()=>{
 const calls=[];
 const openaiClient={responses:{create:async input=>{calls.push(input);return {output_text:JSON.stringify(calls.length===1?board:{constraints:board.continuity,beats:board.shots.map(s=>s.scene+' '+s.camera+' '+s.movement)})};}}};
 const authored=await authorStoryboard({openaiClient,request:'Keep oyster half closed initially'});
 const prompt=await compileStoryboard({openaiClient,board:authored});
 assert.equal(calls.length,2);
 assert.ok(calls.every(c=>c.model==='gpt-6-astra'));
 assert.match(prompt,/\[0–3s\]/);assert.match(prompt,/\[12–15s\]/);
 const params=storyboardToPromptParams({...authored,openingPrompt:prompt});
 const input=validateTemplate1Input({pinUrl:'https://example.com/pin.jpg',displayName:'Oyster',parentId:'royal-prestige-14',musicId:'music',promptParams:params});
 assert.equal(buildPrompts(input.promptParams).opening,prompt);
 assert.ok(prompt.length>400);
 assert.match(buildPrompts(input.promptParams).opening,/360-degree orbit/);
 assert.match(calls[0].instructions,/first TWO frames together are the reveal/);
 assert.match(calls[1].instructions,/We're getting married/);
 assert.equal(authored.airborneLayers.length,15);
});
test('reject incomplete or discontinuous timelines and do not fallback on Astra failure',async()=>{
 assert.throws(()=>validateTimedStoryboard({...board,shots:board.shots.slice(0,2)}),/five/);
 assert.throws(()=>validateTimedStoryboard({...board,shots:board.shots.map((s,i)=>i===3?{...s,start:8}:s)}),/0–15/);
 await assert.rejects(authorStoryboard({openaiClient:{responses:{create:async()=>{throw new Error('Astra unavailable');}}}}),/Astra unavailable/);
});

test('Astra board rejects missing finale layers and misplaced title beats',async()=>{
 for(const bad of [{...board,airborneLayers:[]},{...board,shots:board.shots.map(s=>({...s,titleText:''}))}]){
 await assert.rejects(authorStoryboard({openaiClient:{responses:{create:async()=>({output_text:JSON.stringify(bad)})}}}),/layers|title beats/);
 }
});
