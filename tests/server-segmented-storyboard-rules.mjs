import test from 'node:test';
import assert from 'node:assert/strict';
import {SEGMENTED_AUTHOR_RULES,assertSegmentedBoardMotion} from '../server/assembly-storyboard-astra.mjs';
import {buildEndpointPrompt} from '../server/assembly-segmented-board.mjs';
import {readFileSync} from 'node:fs';
import {digest} from '../server/assembly-story-session.mjs';

test('segmented author rules require faces, bullet-time endpoint difference, and no activity morph',()=>{
 assert.match(SEGMENTED_AUTHOR_RULES,/clear recognizable faces/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/editorial photoshoot/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/DIFFERENT camera angles/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/bullet-time/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/flying motifs|mid-flight/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/standing↔driving|standing→driving/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/never reverse|back-and-forth/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/HARD VARIETY|DIFFERENT location/i);
 assert.doesNotMatch(SEGMENTED_AUTHOR_RULES,/crowns only/);
 assert.doesNotMatch(SEGMENTED_AUTHOR_RULES,/90-degree top-down/);
});

test('assertSegmentedBoardMotion rejects identical Start/End and cloned couple scenes',()=>{
 const base=i=>({
  scene:'Scene '+i+' setup',
  camera:'camera',
  firstBrief:'Start angle for scene '+i,
  lastBrief:'End with camera orbit 25 degrees and petals mid-flight for scene '+i,
  titleText:'',
  prompt:'prompt'
 });
 const good={scenes:[
  {...base(1),firstBrief:'closed box',lastBrief:'open box with names'},
  {...base(2),scene:'jhumka macro on silk',firstBrief:'macro low angle earring on silk',lastBrief:'macro push-in camera closer with jasmine petals mid-flight'},
  {...base(3),scene:'couple under marigold pillars side by side',firstBrief:'eye-level couple under pillars motifs ready',lastBrief:'camera arcs 25 degrees left; petals mid-arc'},
  {...base(4),scene:'couple on temple steps three-quarter turn',firstBrief:'three-quarter couple on temple steps',lastBrief:'gentle orbit camera; foil motif mid-flight',titleText:"We're getting married"},
  {...base(5),scene:'couple on sunset balcony lean',firstBrief:'balcony lean sunset SAVE THE DATE',lastBrief:'push-in camera; SAVE THE DATE; blossoms mid-flight',titleText:'SAVE THE DATE'}
 ]};
 assert.equal(assertSegmentedBoardMotion(good),good);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],
  {...good.scenes[1],firstBrief:'same still',lastBrief:'same still'},
  good.scenes[2],good.scenes[3],good.scenes[4]
 ]}),/identical/i);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],good.scenes[1],
  {...good.scenes[2],scene:'same couple poster under flowers',firstBrief:'same couple poster under flowers smiling at camera'},
  {...good.scenes[3],scene:'same couple poster under flowers with title',firstBrief:'same couple poster under flowers smiling at camera with title'},
  good.scenes[4]
 ]}),/reuse the same setup/i);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],
  {...good.scenes[1],lastBrief:'end without naming motion'},
  good.scenes[2],good.scenes[3],good.scenes[4]
 ]}),/camera delta/i);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],
  {...good.scenes[1],lastBrief:'camera push-in closer with no floating decor'},
  good.scenes[2],good.scenes[3],good.scenes[4]
 ]}),/flying motifs|mid-flight/i);
});

test('endpoint End prompts contrast Start vs End; clone hash retry contract',()=>{
 const src=readFileSync(new URL('../server/assembly-segmented-board.mjs',import.meta.url),'utf8');
 assert.match(src,/Do not reproduce the Start composition/);
 assert.match(src,/HARD DELTA RETRY/);
 assert.match(src,/clear recognizable faces/);
 assert.match(src,/sha256===scene\.first\.sha256/);
 assert.doesNotMatch(src,/Wide 90-degree overhead, crowns only, no faces/);

 const board={
  continuity:'same couple identity',
  scenes:Array.from({length:5},(_,i)=>({
   index:i+1,
   scene:'scene '+i,
   firstBrief:'Start camera for '+i,
   lastBrief:'End camera orbit and petals mid-flight for '+i,
   titleText:i===3?"We're getting married":i===4?'SAVE THE DATE':''
  }))
 };
 const endPrompt=buildEndpointPrompt(board,2,'last');
 assert.match(endPrompt,/Start was:/);
 assert.match(endPrompt,/End must be:/);
 assert.match(endPrompt,/Do not reproduce the Start composition/);
 assert.match(buildEndpointPrompt(board,2,'last',{strongDelta:true}),/HARD DELTA RETRY/);

 const same=digest(Buffer.from('clone-bytes'));
 const different=digest(Buffer.from('different-end-bytes'));
 let calls=0;
 const paint=()=>{calls++;return calls===1?same:different;};
 let end=paint();
 if(end===same)end=paint();
 assert.equal(calls,2);
 assert.notEqual(end,same);
});
