import test from 'node:test';
import assert from 'node:assert/strict';
import {SEGMENTED_AUTHOR_RULES} from '../server/assembly-storyboard-astra.mjs';
import {readFileSync} from 'node:fs';

test('segmented author rules require faces, bullet-time endpoint difference, and no activity morph',()=>{
 assert.match(SEGMENTED_AUTHOR_RULES,/clear recognizable faces/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/editorial photoshoot/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/DIFFERENT camera angles/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/bullet-time/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/flying motifs/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/standing↔driving|standing→driving/i);
 assert.match(SEGMENTED_AUTHOR_RULES,/never reverse|back-and-forth/i);
 assert.doesNotMatch(SEGMENTED_AUTHOR_RULES,/crowns only/);
 assert.doesNotMatch(SEGMENTED_AUTHOR_RULES,/90-degree top-down/);
});

test('endpoint painter prompts no longer force overhead face hiding',()=>{
 const src=readFileSync(new URL('../server/assembly-segmented-board.mjs',import.meta.url),'utf8');
 assert.match(src,/clear recognizable faces/);
 assert.match(src,/bullet-time/);
 assert.match(src,/standing→driving/);
 assert.doesNotMatch(src,/Wide 90-degree overhead, crowns only, no faces/);
});
