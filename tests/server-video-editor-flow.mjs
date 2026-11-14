import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VIDEO_STEP_IDS,VIDEO_FORM_VERSION,videoStepId,legacyVideoStep,personalPhotosSelected,hasLegacyPhotos,selectedReferenceMode,activeVideoContent,activePending,videoRenderChanged} from '../shared/video-editor-flow.mjs';
import {TEMPLE_DEFAULTS,TEMPLE_FORM} from '../shared/temple-video.mjs';
import {normalizeVideoContent,VIDEO_FORM} from '../shared/video-personalization.mjs';
test('scene sections and old numeric bookmarks resume the corresponding section without changing purchase or photos',()=>{
 assert.deepEqual(TEMPLE_FORM.steps.map(s=>s.id),['title','invitation','groom','bride','parents','ceremony','venue','reception','hosts','closing','music','review']);
 const mapped=['title','groom','review','parents','ceremony','hosts','music','review'];
 mapped.forEach((id,step)=>{assert.equal(videoStepId({step}),id);assert.equal(videoStepId({},String(step)),id);});
 const oldIds=['title','names','parents','events','closing','music','review'];
 ['title','groom','parents','ceremony','hosts','music','review'].forEach((id,index)=>{
  assert.equal(videoStepId({step:index,formVersion:2}),id);
  assert.equal(videoStepId({formStepId:oldIds[index],formVersion:2}),id);
 });
 for(const id of VIDEO_STEP_IDS){const payload={invitationId:'paid-invitation',formStepId:id,formVersion:VIDEO_FORM_VERSION,step:legacyVideoStep(id),personalPhotosEnabled:false,content:{photos:{groom:{id:'retained'}}}};const before=structuredClone(payload);assert.equal(videoStepId(payload),id);assert.ok(payload.step>=0);assert.deepEqual(payload,before);}
 assert.equal(videoStepId({step:7,formVersion:2,formStepId:'events'}),'ceremony');
 assert.equal(videoStepId({formStepId:'parents'},'review'),'review');
 assert.equal(videoStepId({},'closing'),'closing');
 assert.equal(videoStepId({},'photos'),'review');assert.equal(videoStepId({},'invalid'),'title');
 // The unreleased Christian form retains its existing sections.
 const christianIds=VIDEO_FORM.steps.map(s=>s.id);assert.deepEqual(christianIds,oldIds);
 assert.equal(videoStepId({formStepId:'events',formVersion:2},null,christianIds),'events');
 assert.equal(videoStepId({step:5},null,christianIds),'closing');
});
test('every editable temple field belongs to its actual scene, with explicit links for repeated details',async()=>{
 const master=JSON.parse(await readFile(new URL('../public/assets/video-masters/temple-v1/manifest.json',import.meta.url)));
 const scenes=TEMPLE_FORM.steps.filter(s=>s.questions.length);
 assert.deepEqual(scenes.map(s=>s.scene),master.scenes.map(s=>s.id));
 const derived={brideName:['brideTitle','bride'],weddingDateLabel:['weddingDate'],weddingDateShort:['weddingDate'],weddingTimeLabel:['weddingTime','weddingEnd'],weddingVenueLine:['church'],ceremonyAddressLine:['address'],receptionDateLabel:['receptionDate'],receptionTimeLabel:['receptionTime','receptionEnd']};
 for(const step of scenes){
  const bindings=master.text[step.scene].flatMap(t=>derived[t.binding]||[t.binding]);
  const editable=step.questions.map(q=>q.path),shared=(step.shared||[]).flatMap(s=>s.fields);
  assert.deepEqual([...new Set([...editable,...shared])].sort(),[...new Set(bindings)].sort(),step.id+' must account for all and only text visible in its scene');
  for(const link of step.shared||[])assert.ok(link.fields.every(field=>TEMPLE_FORM.steps.find(s=>s.id===link.step).questions.some(q=>q.path===field)));
 }
 const fields=scenes.flatMap(s=>s.questions.map(q=>q.path));
 assert.equal(new Set(fields).size,fields.length);
 assert.deepEqual(fields.slice().sort(),Object.keys(TEMPLE_DEFAULTS).filter(k=>!['photos','music'].includes(k)).sort());
});
test('existing personal work is retained, explicit off wins, and references use one selected source',()=>{
 assert.equal(personalPhotosSelected({}),false);
 for(const data of [{references:{groom:{id:'a'}}},{content:{photos:{bride:{id:'b'}}}},{pending:{couple:{localId:'local'}}}]){
  assert.equal(personalPhotosSelected(data),true);assert.equal(personalPhotosSelected({...data,personalPhotosEnabled:false}),false);
 }
 assert.equal(personalPhotosSelected({pending:{__music:{id:'song'}}}),false);
 assert.equal(hasLegacyPhotos({content:{photos:{bride:{mode:'frame'}}}}),true);
 assert.equal(hasLegacyPhotos({content:{photos:{groom:{mode:'prepared'}}}}),false);
 assert.equal(selectedReferenceMode({references:{couple:{id:'c'}}}),'couple');
 assert.equal(selectedReferenceMode({photoReferenceMode:'couple',references:{groom:{id:'a'},bride:{id:'b'}}}),'couple');
});
test('default preview/export content excludes inactive photos and candidates without losing originals or music',()=>{
 const photo={id:'11111111-1111-4111-8111-111111111111',mode:'prepared',confirmed:true};
 const content={...TEMPLE_DEFAULTS,photos:{groom:photo},music:{mode:'library',id:'canon'}};
 const off=activeVideoContent(content,false),on=activeVideoContent(content,true);
 assert.deepEqual(off.photos,{});assert.deepEqual(content.photos,{groom:photo});assert.equal(on,content);assert.equal(off.music,content.music);
 const request=normalizeVideoContent(off,{complete:true,templateId:'temple-v1'});assert.deepEqual(request.photos,{});assert.equal(request.music.id,'canon');
 assert.deepEqual(normalizeVideoContent(on,{complete:true,templateId:'temple-v1'}).photos,{groom:photo});
 const pending={groom:{id:'unavailable',error:'missing'},__music:{id:'song'}};
 assert.deepEqual(activePending(pending,false),{__music:pending.__music});assert.deepEqual(activePending(pending,true),pending);
});

test('account recovery and photo off/on preserve render identity despite JSON key order',()=>{
 const photo={id:'11111111-1111-4111-8111-111111111111',mode:'prepared',confirmed:true};
 const content={...TEMPLE_DEFAULTS,photos:{groom:photo,bride:{...photo,id:'22222222-2222-4222-8222-222222222222'}},music:{mode:'library',id:'canon'}};
 const saved=JSON.stringify(content);
 const reorder=value=>value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reorder(item)])):value;
 const restored={...TEMPLE_DEFAULTS,...reorder(content)};
 assert.notEqual(JSON.stringify(restored),saved);
 assert.equal(videoRenderChanged(saved,restored),false);
 assert.equal(videoRenderChanged(saved,activeVideoContent(restored,false)),true);
 assert.equal(videoRenderChanged(saved,activeVideoContent(restored,true)),false);
 for(const changed of [{...restored,groom:'Different name'},{...restored,photos:{...restored.photos,groom:{...photo,id:'33333333-3333-4333-8333-333333333333'}}},{...restored,music:{mode:'none'}}])assert.equal(videoRenderChanged(saved,changed),true);
 assert.equal(videoRenderChanged('',restored),false);
 assert.equal(videoRenderChanged('invalid old state',restored),true);
});

test('reverting a character retains saved assets and music but removes it and stale joint art from composition',()=>{const content={photos:{groom:{id:'g'},bride:{id:'b'},couple:{id:'c'}},music:{mode:'library',id:'canon'}};const active=activeVideoContent(content,true,['groom']);assert.deepEqual(active.photos,{bride:{id:'b'}});assert.equal(active.music,content.music);assert.equal(Object.keys(content.photos).length,3);assert.deepEqual(activeVideoContent(content,true,['groom','bride']).photos,{});});
