import test from 'node:test';
import assert from 'node:assert/strict';
import {SEGMENTED_AUTHOR_RULES,assertSegmentedBoardMotion,buildBulletTimePrompt,BULLET_TIME_BASE} from '../server/assembly-storyboard-astra.mjs';
import {buildEndpointPrompt} from '../server/assembly-segmented-board.mjs';
import {readFileSync} from 'node:fs';

test('segmented author rules use GlamBOT single still + face adapt + action poses',()=>{
 assert.match(SEGMENTED_AUTHOR_RULES,/ONE still|ONE glamorous/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/floating\/airborne|abundant floating/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/GLAMBOT|GlamBOT/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/CAUGHT-IN-ACTION|caught-in-action/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/DO NOT lock the pin/i);
 assert.match(BULLET_TIME_BASE,/GLAMBOT/i);
 assert.match(BULLET_TIME_BASE,/UNIDIRECTIONALLY|unidirectional/i);
 assert.match(BULLET_TIME_BASE,/blink|hair and clothes/i);
 assert.match(BULLET_TIME_BASE,/30 percent|30%/i);
 assert.match(BULLET_TIME_BASE,/never reverse|never ping-pong/i);
 assert.match(BULLET_TIME_BASE,/REFERENCE/i);
 assert.doesNotMatch(BULLET_TIME_BASE,/360-degree orbit around/);
});

test('assertSegmentedBoardMotion accepts single-still boards with float cues',()=>{
 const good={scenes:[
  {scene:'reveal',firstBrief:'closed box',lastBrief:'open box with names',titleText:'',prompt:'p'},
  {scene:'jhumka macro',firstBrief:'gold jhumka on silk with floating jasmine petals mid-air',lastBrief:'gold jhumka on silk with floating jasmine petals mid-air',titleText:'',prompt:'p'},
  {scene:'couple under marigold pillars mid-twirl',firstBrief:'eye-level couple mid-twirl under pillars with airborne petals and foil',lastBrief:'eye-level couple mid-twirl under pillars with airborne petals and foil',titleText:'',prompt:'p'},
  {scene:'couple on temple steps lean into wind',firstBrief:'three-quarter couple lean into wind on temple steps with floating blossoms',lastBrief:'three-quarter couple lean into wind on temple steps with floating blossoms',titleText:"We're getting married",prompt:'p'},
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

test('buildBulletTimePrompt customizes the GlamBOT base per scene',()=>{
 const prompt=buildBulletTimePrompt({
  index:3,
  scene:'couple under pillars mid-twirl',
  firstBrief:'editorial still with floating petals',
  titleText:"We're getting married"
 });
 assert.match(prompt,/GLAMBOT/i);
 assert.match(prompt,/UNIDIRECTIONALLY|unidirectional|start→end/i);
 assert.match(prompt,/blink|wind/i);
 assert.match(prompt,/couple under pillars/);
 assert.match(prompt,/We're getting married/);
 assert.match(prompt,/30%|30 percent/i);
 assert.doesNotMatch(prompt,/full 360-degree orbit around the frozen subject/i);
});

test('author repair injects titles and float cues without throwing on Astra drift',()=>{
 const repaired={scenes:[
  {scene:'box',titleText:'Padayappa Weds Neelambari',firstBrief:'sealed box',lastBrief:'open box Exact text "Padayappa Weds Neelambari" readable in frame.',prompt:'p'},
  {scene:'macro',titleText:'',firstBrief:'gold work with floating petals, foil scraps and sparkles suspended mid-air',lastBrief:'gold work with floating petals, foil scraps and sparkles suspended mid-air',prompt:'p'},
  {scene:'pillars mid-twirl',titleText:'',firstBrief:'couple mid-twirl under pillars with floating petals',lastBrief:'couple mid-twirl under pillars with floating petals',prompt:'p'},
  {scene:'temple steps lean',titleText:"We're getting married",firstBrief:'temple steps Exact text "We\'re getting married" readable in frame. with floating petals, foil scraps and sparkles suspended mid-air',lastBrief:'temple steps Exact text "We\'re getting married" readable in frame. with floating petals, foil scraps and sparkles suspended mid-air',prompt:'p'},
  {scene:'balcony lean',titleText:'SAVE THE DATE',firstBrief:'balcony Exact text "SAVE THE DATE" readable in frame. with floating petals, foil scraps and sparkles suspended mid-air',lastBrief:'balcony Exact text "SAVE THE DATE" readable in frame. with floating petals, foil scraps and sparkles suspended mid-air',prompt:'p'}
 ]};
 assert.equal(assertSegmentedBoardMotion(repaired),repaired);
});

test('endpoint prompts for scenes 2–5 demand floating elements and face adapt',()=>{
 const src=readFileSync(new URL('../server/assembly-segmented-board.mjs',import.meta.url),'utf8');
 assert.match(src,/MANDATORY: fill the air with highly detailed floating/);
 assert.match(src,/ADAPT naturally|faces must ADAPT/i);
 assert.match(src,/CAUGHT-IN-ACTION/i);
 assert.match(src,/COUPLE_STILL_MODEL|gpt-image-2|storyboardStillModel/);
 assert.doesNotMatch(src,/HARD DELTA RETRY/);

 const board={
  continuity:'same couple',
  scenes:[
   {firstBrief:'closed',lastBrief:'open',titleText:''},
   {firstBrief:'macro with floating petals',lastBrief:'macro with floating petals',titleText:''},
   {firstBrief:'mid-twirl with floating petals',lastBrief:'mid-twirl with floating petals',titleText:''}
  ]
 };
 const p=buildEndpointPrompt(board,2,'first');
 assert.match(p,/floating\/airborne|floating/);
 assert.match(p,/GlamBOT|editorial still/i);
 assert.match(p,/ADAPT|caught-in-action|CAUGHT-IN-ACTION/i);
});

test('scenes 3–5 stills use openai/gpt-image-2 at high quality',async()=>{
 const {storyboardStillModel}=await import('../server/assembly-segmented-board.mjs');
 const {COUPLE_STILL_MODEL,STILL_MODEL}=await import('../server/assembly-template1-prompts.mjs');
 const {buildReplicateImageInput}=await import('../server/assembly-template1-gen.mjs');
 assert.equal(COUPLE_STILL_MODEL,'openai/gpt-image-2');
 assert.equal(storyboardStillModel(0),STILL_MODEL);
 assert.equal(storyboardStillModel(1),STILL_MODEL);
 assert.equal(storyboardStillModel(2),COUPLE_STILL_MODEL);
 assert.equal(storyboardStillModel(3),COUPLE_STILL_MODEL);
 assert.equal(storyboardStillModel(4),COUPLE_STILL_MODEL);
 const input=buildReplicateImageInput(COUPLE_STILL_MODEL,{prompt:'test',image:'https://example.com/a.jpg'});
 assert.deepEqual(input.input_images,['https://example.com/a.jpg']);
 assert.equal(input.aspect_ratio,'2:3');
 assert.equal(input.quality,'high');
 assert.equal(input.output_format,'jpeg');
 const flare=buildReplicateImageInput(STILL_MODEL,{prompt:'door',image:'https://example.com/a.jpg'});
 assert.equal(flare.aspect_ratio,'9:16');
 assert.equal(flare.quality,'high');
});

test('segmented video uses hero-style single reference for scenes 2–5',()=>{
 const src=readFileSync(new URL('../server/assembly-segmented-video.mjs',import.meta.url),'utf8');
 assert.match(src,/runGrokImagineVideo/);
 assert.match(src,/hero-style|REFERENCE|reference image/i);
 assert.match(src,/motif ping-pong/);
 assert.doesNotMatch(src,/lastFrame:\{url:single\?buffers\[0\]/);
});
