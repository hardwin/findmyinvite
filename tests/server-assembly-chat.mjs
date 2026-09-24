import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTemplate1Input} from '../server/assembly-template1.mjs';
import {buildAssemblyChatTools,ASSEMBLY_CHAT_SYSTEM,ASSEMBLY_CHAT_MODEL} from '../server/assembly-chat-agent.mjs';
import {assertHttpUrl,buildMixPrompt} from '../server/assembly-image-mix.mjs';
import {HttpError} from '../server/core.mjs';

test('assembly chat system prompt covers mission order',()=>{
 assert.match(ASSEMBLY_CHAT_SYSTEM,/FindMyInvite/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/digital wedding invitation/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/anime/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/Pinterest|Pin|Attach|Camera/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/VIBE|display name/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/Template 1|start_template1/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/Hi/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/MUST use tools/i);
 assert.match(ASSEMBLY_CHAT_MODEL,/grok/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/mix_image|lock_final_image/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/regen_opening_still|approve_stills/i);
 assert.match(ASSEMBLY_CHAT_SYSTEM,/Door-First|Door-First|iterate/i);
 assert.doesNotMatch(ASSEMBLY_CHAT_SYSTEM,/Grok Assembly Coach/i);
});

test('assemblyChatModel is xAI Grok only',async()=>{
 const {assemblyChatModel,resolveAssemblyChatProvider,ASSEMBLY_CHAT_PROVIDER}=await import('../server/assembly-chat-agent.mjs');
 assert.equal(ASSEMBLY_CHAT_PROVIDER,'xai');
 assert.equal(await resolveAssemblyChatProvider({XAI_API_KEY:'x'}),'xai');
 await assert.rejects(()=>resolveAssemblyChatProvider({}), (e)=>e.status===503);
 assert.ok(assemblyChatModel({XAI_API_KEY:'x',ASSEMBLY_CHAT_MODEL:'grok-test'}));
});

test('validateTemplate1Input accepts heroImageUrl without a pin',()=>{
 const input=validateTemplate1Input({
  heroImageUrl:'https://cdn.example.com/hero.jpg',
  displayName:'Golden Dusk',
  musicId:'vazhithunaiye'
 });
 assert.equal(input.heroImageUrl,'https://cdn.example.com/hero.jpg');
 assert.equal(input.pinUrl,'https://cdn.example.com/hero.jpg');
 assert.equal(input.displayName,'Golden Dusk');
});

test('validateTemplate1Input keeps pin provenance when hero is locked',()=>{
 const input=validateTemplate1Input({
  pinUrl:'https://pin.it/demo123',
  heroImageUrl:'https://cdn.example.com/locked.jpg',
  displayName:'Locked Vibe',
  musicId:'vazhithunaiye'
 });
 assert.equal(input.pinUrl,'https://pin.it/demo123');
 assert.equal(input.heroImageUrl,'https://cdn.example.com/locked.jpg');
});

test('validateTemplate1Input still requires an image source',()=>{
 assert.throws(
  ()=>validateTemplate1Input({displayName:'No Image',musicId:'vazhithunaiye'}),
  (error)=>error instanceof HttpError&&error.status===400
 );
});

test('buildAssemblyChatTools exposes the operator desk tools',()=>{
 const tools=buildAssemblyChatTools({});
 for(const name of [
  'resolve_pin',
  'upload_ref',
  'list_music',
  'list_parents',
  'mix_image',
  'lock_final_image',
  'start_template1',
  'get_job_status',
  'cancel_job',
  'retry_phase',
  'regen_opening_still',
  'approve_stills'
 ])assert.ok(tools[name],name);
});

test('mix helpers reject non-http URLs and build prompts',()=>{
 assert.throws(()=>assertHttpUrl('ftp://x','Pin'),HttpError);
 assert.match(buildMixPrompt({styleTwist:'more gold',refCount:2}),/gold/i);
 assert.match(buildMixPrompt({styleTwist:'more gold',refCount:2}),/2/);
});
