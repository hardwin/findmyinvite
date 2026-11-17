import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {randomUUID,createHmac} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
import {verifyCharacterWebhook,characterInput,characterPrompt,CHARACTER_MODEL,CHARACTER_PROMPT_REVISION,CHARACTER_PROMPT_CANDIDATE} from '../server/video-character-provider.mjs';
import {alignCharacter,characterBounds} from '../server/video-character-images.mjs';
import {characterService} from '../server/video-characters.mjs';
test('an unapproved couple from an older individual revision offers its included refresh',async()=>{const id=randomUUID(),owner=randomUUID(),jobs=[{id:'g2',slot:'groom',approved_current:true,status:'approved'},{id:'b1',slot:'bride',approved_current:true,status:'approved'},{id:'c1',slot:'couple',approved_current:false,status:'review',basis:{groom:'g1',bride:'b1'}}];const service=characterService({store:{},query:async path=>path.startsWith('personalization_drafts')?[{id,owner_id:owner}]:jobs});assert.equal((await service.list(owner,id)).coupleNeedsUpdate,true);jobs[2].basis.groom='g2';assert.equal((await service.list(owner,id)).coupleNeedsUpdate,false);});
test('Flare inputs request the exact model, transparent canvas and focused edit; forged callbacks fail',()=>{
 assert.equal(CHARACTER_MODEL,'openai/gpt-image-2.6-flare');assert.deepEqual(characterInput('test',['a']).input_images,['a']);assert.equal(characterInput('',[]).background,'transparent');assert.equal(characterInput('',[]).aspect_ratio,'9:16');
 const secret=Buffer.from('fixed-test-secret').toString('base64'),raw='{"id":"test"}',timestamp=Math.floor(Date.now()/1000).toString(),headers={'webhook-id':'test','webhook-timestamp':timestamp};headers['webhook-signature']='v1,'+createHmac('sha256',Buffer.from(secret,'base64')).update('test.'+timestamp+'.'+raw).digest('base64');assert.equal(verifyCharacterWebhook(raw,headers,'whsec_'+secret),true);assert.equal(verifyCharacterWebhook(raw+' ',headers,'whsec_'+secret),false);assert.equal(verifyCharacterWebhook(raw,headers,'whsec_'+secret,Date.now()+600000),false);
});
test('character alpha, size and feet align to the original template without another cutout fit',async()=>{const b=await readFile('public/assets/video-masters/temple-v1/groom.png'),result=await alignCharacter(b,b,{removeBackground:()=>{throw Error('Should not remove genuine alpha');}});const bounds=await characterBounds(result.bytes);assert.equal(bounds.width,720);assert.equal(bounds.height,1280);assert.ok(bounds.clear>.1);assert.ok(Math.abs(result.alignment.placed.top+result.alignment.placed.height-result.alignment.target.top-result.alignment.target.height)<=2);});
test('durable SQL enforces purchase, one redo, free failures, independent slots and approval revisions',async()=>{
 const pg=new PGlite();try{
 await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');
 for(const file of ['20261112070852_video_invitation_checkout','20261112102539_invitation_draft_recovery','20261112104905_video_character_preparation'])await pg.exec(await readFile('supabase/migrations/'+file+'.sql','utf8'));
 const owner=randomUUID(),other=randomUUID(),id=randomUUID();await pg.query('insert into auth.users values($1),($2)',[owner,other]);await pg.exec('set role service_role');await pg.query("select public.fmi_save_personalization_draft($1,$2,'video','temple-v1',$3,0)",[id,owner,JSON.stringify({content:{photos:{},groom:'A'}})]);
 const claim=async(slot,kind,key,basis={},who=owner)=>(await pg.query('select * from public.fmi_claim_video_character($1,$2,$3,$4,$5,$6,$7,$8,$9)',[who,id,slot,kind,key,CHARACTER_MODEL,'v1','[]',JSON.stringify(basis)])).rows[0];
 await assert.rejects(claim('groom','initial','a'),/Unlock/);await pg.query("select public.fmi_reserve_video_invitation($1,$2,'temple-v1')",[id,owner]);await pg.query("update public.video_invitation_orders set status='complimentary',promo_sha256=$2,unlocked_at=now() where id=$1",[id,'a'.repeat(64)]);
 const groom=await claim('groom','initial','a');assert.equal((await claim('groom','initial','a')).id,groom.id);await assert.rejects(claim('groom','initial','b'),/already/);await assert.rejects(claim('bride','initial','b',{},other),/not found/);const bride=await claim('bride','initial','b');
 await pg.query("update public.video_character_jobs set status='review',output_media_id=id where id in ($1,$2)",[groom.id,bride.id]);
 let draft=(await pg.query('select * from public.fmi_approve_video_character($1,$2,1)',[owner,groom.id])).rows[0];assert.equal(draft.payload.content.photos.groom.mode,'prepared');await assert.rejects(pg.query('select public.fmi_approve_video_character($1,$2,1)',[owner,bride.id]),/another device/);draft=(await pg.query('select * from public.fmi_approve_video_character($1,$2,$3)',[owner,bride.id,draft.revision])).rows[0];
 const basis={groom:groom.id,bride:bride.id},couple=await claim('couple','initial','c',basis);await pg.query("update public.video_character_jobs set status='review',output_media_id=id where id=$1",[couple.id]);const redo=await claim('groom','redo','d');await pg.query("update public.video_character_jobs set status='failed' where id=$1",[redo.id]);const retry=await claim('groom','redo','e');await pg.query("update public.video_character_jobs set status='review',output_media_id=id where id=$1",[retry.id]);await assert.rejects(claim('groom','redo','f'),/one requested redo/);await pg.query('select public.fmi_approve_video_character($1,$2,$3)',[owner,retry.id,draft.revision]);
 const dependent=await claim('couple','dependent','g',{groom:retry.id,bride:bride.id});assert.equal(dependent.kind,'dependent');await pg.query("update public.video_character_jobs set status='review' where id=$1",[dependent.id]);assert.equal((await claim('couple','redo','h',{groom:retry.id,bride:bride.id})).kind,'redo');
 for(const role of ['anon','authenticated']){await pg.exec('reset role;set role '+role);await assert.rejects(pg.query('select * from public.video_character_jobs'),/permission denied/);await assert.rejects(claim('bride','redo','i'),/permission denied/);}
 }finally{await pg.close();}
});

test('couple references identify the requested role without a customer left/right question',()=>{assert.match(characterPrompt('groom','auto'),/Identify the groom/);assert.match(characterPrompt('bride','auto'),/Identify the bride/);assert.match(characterPrompt('bride','left'),/person on the left/);assert.match(characterPrompt('couple'),/SECOND image is the approved illustrated groom/);assert.match(characterPrompt('couple'),/THIRD image is the approved illustrated bride/);assert.doesNotMatch(characterPrompt('couple'),/FOURTH/);});

test('customer likeness governs face, hair and proportions instead of the template character',()=>{
 for(const slot of ['groom','bride','couple']){
  const prompt=characterPrompt(slot,'single','',CHARACTER_PROMPT_CANDIDATE);
  assert.ok(prompt.includes('Preserve the exact face details and face shape and facial hairs and hairstyle, Match the body proportion according to the face size and shape'));
  assert.match(prompt,/Identity and recognizable likeness take priority/);
  assert.doesNotMatch(prompt,/large expressive head|large rounded eyes|soft rounded facial geometry|Keep its head size|Leave everything below the jaw unchanged|Keep.*hair arrangement/);
 }
});

test('unreviewed likeness candidates are explicitly selected, never made the default by deployment',()=>{
 assert.notEqual(CHARACTER_PROMPT_REVISION,CHARACTER_PROMPT_CANDIDATE);
 assert.match(characterPrompt('groom'),/large expressive head/);
 assert.match(characterPrompt('groom','single','',CHARACTER_PROMPT_CANDIDATE),/recognizable likeness take priority/);
 assert.throws(()=>characterPrompt('groom','single','','unknown-revision'),/Unsupported/);
});

test('a delayed worker cannot reacquire a character that has already finished',async()=>{const id=randomUUID(),owner=randomUUID(),invitation=randomUUID();let leaseFilter='';const service=characterService({store:{},provider:{get:()=>{throw Error('Finished work must not be processed again');}},query:async(path,options)=>{if(path.startsWith('personalization_drafts'))return [{id:invitation,owner_id:owner}];if(options?.method==='PATCH'){leaseFilter=path;return [];}return [{id,owner_id:owner,invitation_id:invitation,status:'preparing'}];}});await service.process(id);assert.match(leaseFilter,/status=in\.\(queued,submitting,processing,preparing\)/);});
