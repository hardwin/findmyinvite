import test from 'node:test';
import assert from 'node:assert/strict';
import {SEGMENTED_AUTHOR_RULES,assertSegmentedBoardMotion,buildBulletTimePrompt,BULLET_TIME_BASE} from '../server/assembly-storyboard-astra.mjs';
import {buildEndpointPrompt} from '../server/assembly-segmented-board.mjs';
import {readFileSync} from 'node:fs';

test('segmented author rules use single still + floating elements for scenes 2–5',()=>{
 assert.match(SEGMENTED_AUTHOR_RULES,/ONE still|ONE glamorous editorial/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/floating\/airborne|floating\/airborne elements|abundant floating/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/bullet-time/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/clear recognizable faces/i);
 assert.match(BULLET_TIME_BASE,/360-degree orbit/i);
 assert.match(BULLET_TIME_BASE,/frozen mid-motion/i);
});

test('assertSegmentedBoardMotion accepts single-still boards with float cues',()=>{
 const good={scenes:[
  {scene:'reveal',firstBrief:'closed box',lastBrief:'open box with names',titleText:'',prompt:'p'},
  {scene:'jhumka macro',firstBrief:'gold jhumka on silk with floating jasmine petals mid-air',lastBrief:'gold jhumka on silk with floating jasmine petals mid-air',titleText:'',prompt:'p'},
  {scene:'couple under marigold pillars side by side',firstBrief:'eye-level couple under pillars with airborne petals and foil',lastBrief:'eye-level couple under pillars with airborne petals and foil',titleText:'',prompt:'p'},
  {scene:'couple on temple steps three-quarter turn',firstBrief:'three-quarter couple on temple steps with floating blossoms',lastBrief:'three-quarter couple on temple steps with floating blossoms',titleText:"We're getting married",prompt:'p'},
  {scene:'couple on sunset balcony lean',firstBrief:'balcony lean sunset with sparkles suspended mid-air SAVE THE DATE',lastBrief:'balcony lean sunset with sparkles suspended mid-air SAVE THE DATE',titleText:'SAVE THE DATE',prompt:'p'}
 ]};
 assert.equal(assertSegmentedBoardMotion(good),good);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],
  {...good.scenes[1],firstBrief:'static earring no motion words',lastBrief:'static earring no motion words'},
  good.scenes[2],good.scenes[3],good.scenes[4]
 ]}),/floating|airborne/i);

 assert.throws(()=>assertSegmentedBoardMotion({scenes:[
  good.scenes[0],good.scenes[1],
  {...good.scenes[2],scene:'same couple poster under flowers',firstBrief:'same couple poster under flowers with floating petals'},
  {...good.scenes[3],scene:'same couple poster under flowers with title',firstBrief:'same couple poster under flowers with floating petals and title'},
  good.scenes[4]
 ]}),/reuse the same setup/i);
});

test('buildBulletTimePrompt customizes the generic base per scene',()=>{
 const prompt=buildBulletTimePrompt({
  index:3,
  scene:'couple under pillars',
  firstBrief:'editorial still with floating petals',
  titleText:"We're getting married"
 });
 assert.match(prompt,/360-degree orbit/i);
 assert.match(prompt,/frozen/i);
 assert.match(prompt,/couple under pillars/);
 assert.match(prompt,/We're getting married/);
 assert.match(prompt,/bride and groom/i);
});

test('endpoint prompts for scenes 2–5 demand floating elements in one still',()=>{
 const src=readFileSync(new URL('../server/assembly-segmented-board.mjs',import.meta.url),'utf8');
 assert.match(src,/MANDATORY: fill the air with highly detailed floating/);
 assert.match(src,/Bullet-time still/);
 assert.doesNotMatch(src,/HARD DELTA RETRY/);

 const board={
  continuity:'same couple',
  scenes:[{firstBrief:'closed',lastBrief:'open',titleText:''},{firstBrief:'macro with floating petals',lastBrief:'macro with floating petals',titleText:''}]
 };
 const p=buildEndpointPrompt(board,1,'first');
 assert.match(p,/floating\/airborne|floating/);
 assert.match(p,/editorial still/i);
});
