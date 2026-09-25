import assert from 'node:assert/strict';
import test from 'node:test';
import {
 normalizeRevealType,
 normalizeSellStage,
 pinterestSearchUrl,
 storyboardToPromptParams,
 buildStoryboardStillPrompt,
 buildSoloStillPrompt,
 revealOpenBeat,
 themeSuggestionsForQuery
} from '../server/assembly-sell-path.mjs';
import {buildPrompts,ensurePromptAffixes} from '../server/assembly-template1-prompts.mjs';

test('sell stages and reveal types normalize',()=>{
 assert.equal(normalizeSellStage('theme'),'theme');
 assert.equal(normalizeSellStage('nope'),'welcome');
 assert.equal(normalizeRevealType('Artistic Windows'),'windows');
 assert.equal(normalizeRevealType('door'),'door');
 assert.equal(normalizeRevealType('Clouds'),'clouds');
 assert.equal(normalizeRevealType('cloud reveal'),'clouds');
 assert.equal(normalizeRevealType('silk curtain'),'silk_curtain');
 assert.equal(normalizeRevealType('building_frame'),'building_frame');
});

test('pinterest search URL is external-only (site blocks iframes)',()=>{
 const url=pinterestSearchUrl('temple gold wedding watercolor');
 assert.match(url,/pinterest\.com\/search\/pins/);
 assert.match(url,/temple/);
});

test('theme suggestions rank by query tags',()=>{
 const temple=themeSuggestionsForQuery('temple gold royal hindu',9);
 assert.ok(temple.length>=1);
 assert.ok(temple.some(t=>/temple|royal|gold/i.test(t.label+t.tags.join(' '))));
 const water=themeSuggestionsForQuery('watercolor garden magenta',3);
 assert.equal(water[0].id,'velicha');
});

test('storyboard maps to First / Middle / Last prompt params',()=>{
 const params=storyboardToPromptParams({
  revealType:'envelope',
  firstBrief:'sealed crimson wax envelope fills the frame',
  middleBeats:['seal breaks','SAVE THE DATE floats','glide through lotus courtyard'],
  lastBrief:'couple laughing forehead touch golden hour freeze'
 });
 assert.equal(params.revealType,'envelope');
 assert.match(params.firstScene,/envelope/i);
 assert.match(params.openingRoute,/seal breaks/i);
 assert.match(params.lastPose,/laughing/i);
 assert.match(revealOpenBeat('envelope'),/envelope/i);
});

test('solo prompts isolate bride or groom',()=>{
 const bride=buildSoloStillPrompt({which:'bride',brief:'silk saree'});
 assert.match(bride,/BRIDE|bride|girl/i);
 assert.match(bride,/girl\/woman|remove the boy/i);
 const groom=buildSoloStillPrompt({which:'groom'});
 assert.match(groom,/GROOM|groom|boy/i);
 assert.match(groom,/boy\/man|remove the girl/i);
});

test('flare first prompt uses reveal prefix without people',()=>{
 const prompt=buildStoryboardStillPrompt({
  which:'first',
  revealType:'arches',
  brief:'marble arches with jasmine vines'
 });
 assert.match(prompt,/arches/i);
 assert.match(prompt,/No people/i);
 const clouds=buildStoryboardStillPrompt({
  which:'first',
  revealType:'clouds',
  brief:'dramatic sunset clouds fill the sky'
 });
 assert.match(clouds,/clouds/i);
 assert.doesNotMatch(clouds,/Make an aesthetic architectural building frame/i);
 assert.match(revealOpenBeat('clouds'),/clouds part/i);
});

test('buildPrompts respects non-door revealType',()=>{
 const pack=buildPrompts({
  revealType:'windows',
  firstScene:'stained glass windows fill the frame',
  openingFirst:'closed artistic windows FILL the frame',
  openingRoute:'windows open then glide through rose courtyard',
  openingLast:'arrive at couple romantic freeze',
  lastPose:'happy couple romantic freeze'
 });
 assert.match(pack.first,/windows/i);
 assert.doesNotMatch(pack.first,/10ft-tall, opaque solid-gold double door/);
 assert.match(pack.opening,/windows open/i);
 assert.match(ensurePromptAffixes('first','Edit pin into FIRST FRAME windows.', 'windows'),/artistic closed windows|Edit pin/i);
});
