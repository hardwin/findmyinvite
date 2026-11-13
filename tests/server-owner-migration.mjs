import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('owner SQL migration enforces private grants, revisions, payment invariants and future capture dates',async()=>{
 const pg=await PGlite.create();try{
  await pg.exec(`create role anon;create role authenticated;create role service_role;
   create table website_orders(id text primary key,status text);create table payments(id text primary key,status text);
   insert into website_orders values('historical','captured'),('new','created');`);
  await pg.exec(await readFile(new URL('../supabase/migrations/20261104074410_owner_command_centre.sql',import.meta.url),'utf8'));
  const numbers=(await pg.query("select owner_order_numbers(array['a','b']) as n")).rows[0].n;assert.deepEqual(numbers,{a:1,b:2});assert.deepEqual((await pg.query("select owner_order_numbers(array['b','a','c']) as n")).rows[0].n,{a:1,b:2,c:3});assert.equal((await pg.query("select has_function_privilege('anon','owner_order_numbers(text[])','execute') as allowed")).rows[0].allowed,false);
  const write=(kind,id,data,revision=0)=>pg.query('select owner_save($1,$2,$3::jsonb,$4,$5,$6) as record',[kind,id,JSON.stringify(data),revision,'fixture',kind+'.saved']);
  assert.equal((await pg.query("select has_table_privilege('anon','owner_records','select') as allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("select has_function_privilege('authenticated','owner_save(text,text,jsonb,bigint,text,text)','execute') as allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("select relrowsecurity from pg_class where relname='owner_records'")).rows[0].relrowsecurity,true);
  const row=(await write('project','p',{name:'Project'})).rows[0].record;assert.equal(row.revision,1);await assert.rejects(write('project','p',{name:'Old'},0),/newer revision/);
  await write('sale','s',{total:118,tax:18,sourceId:'invoice'});await write('receipt','r1',{saleId:'s',amount:80,kind:'Payment',sourceId:'payment1'});
  await assert.rejects(write('receipt','r2',{saleId:'s',amount:80,kind:'Payment',sourceId:'payment2'}),/outstanding balance/);
  await assert.rejects(write('receipt','r1',{saleId:'s',amount:50,kind:'Payment',sourceId:'payment1'},1),/immutable/);
  await assert.rejects(write('sale','s',{total:200,tax:18,sourceId:'invoice'},1),/cannot have its price/);
  await write('receipt','refund',{saleId:'s',amount:80,kind:'Refund',sourceId:'refund1'});
  await write('article','a',{name:'Article',slug:'article',status:'Draft'});assert.equal((await pg.query('select count(*) from owner_revisions')).rows[0].count,1);
  await assert.rejects(write('article','b',{slug:'article',status:'Draft'}),/already exists/);
  assert.equal((await pg.query("select captured_at from website_orders where id='historical'")).rows[0].captured_at,null);
  await pg.exec("update website_orders set status='captured' where id='new';update website_orders set status='refunded' where id='new'");
  const dates=(await pg.query("select captured_at,refunded_at from website_orders where id='new'")).rows[0];assert(dates.captured_at);assert(dates.refunded_at);
  await pg.exec('set role anon');await assert.rejects(pg.query('select * from owner_records'),/permission denied/);
 }finally{await pg.close();}
});
