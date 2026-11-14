import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
import {websiteRecoveryConflict} from '../shared/website-recovery.mjs';
test('website recovery detects a newer canonical edit even when the generic draft sync lagged',()=>{const recovered={slug:'test-invite',serverRevision:3,content:{groom:'Earlier answer'}},canonical={revision:4,content:{groom:'New account answer'}};assert.equal(websiteRecoveryConflict(recovered,canonical),true);assert.equal(websiteRecoveryConflict({...recovered,content:canonical.content},canonical),false);assert.equal(websiteRecoveryConflict({...recovered,serverRevision:4},canonical),false);assert.equal(websiteRecoveryConflict({content:recovered.content},null),false);});
test('draft recovery saves incomplete values, deduplicates retries, rejects conflicts and isolates owners',async()=>{
 const pg=new PGlite();try{await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');await pg.exec(await readFile('supabase/migrations/20261112102539_invitation_draft_recovery.sql','utf8'));
 const owner=randomUUID(),other=randomUUID(),id=randomUUID();await pg.query('insert into auth.users values ($1),($2)',[owner,other]);await pg.exec('set role service_role');
 const save=async(who,payload,rev)=> (await pg.query('select * from public.fmi_save_personalization_draft($1,$2,$3,$4,$5,$6)',[id,who,'video','temple-v1',JSON.stringify(payload),rev])).rows[0];
 const first=await save(owner,{content:{groom:'A',weddingDate:''},step:1},0);assert.equal(first.revision,1);
 assert.equal((await save(owner,first.payload,0)).revision,1);
 await assert.rejects(save(other,{content:{}},1),/unavailable/);
 const next=await save(owner,{content:{groom:'Arun'},step:2},1);assert.equal(next.revision,2);
 await assert.rejects(save(owner,{content:{groom:'Older device'}},1),/another device/);
 await pg.query('update public.personalization_drafts set deleted_at=now() where id=$1',[id]);await assert.rejects(save(owner,next.payload,2),/unavailable/);
 for(const role of ['anon','authenticated']){await pg.exec('reset role;set role '+role);await assert.rejects(pg.query('select * from public.personalization_drafts'),/permission denied/);await assert.rejects(save(owner,{},0),/permission denied/);}
 }finally{await pg.close();}
});
