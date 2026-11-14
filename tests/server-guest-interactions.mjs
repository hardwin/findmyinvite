import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {validateInteraction,interactionDesigns} from '../server/guest-interactions.mjs';
import handler from '../api/invitations.mjs';
const uuid='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const valid={kind:'wish',visitor:'visitor-browser-1234',requestId:uuid,name:'മീനാക്ഷി',message:'Wishing you joy <script>alert(1)</script>'};
test('validates and bounds all public interaction fields',()=>{
 const result=validateInteraction(valid);assert.equal(result.value.name,valid.name);assert.equal(result.visitor.length,64);assert.equal(result.value.message,valid.message);
 for(const patch of [{kind:'unknown'},{visitor:''},{requestId:'bad'},{name:''},{name:'x'.repeat(81)},{message:'x'.repeat(1001)},{message:'a\u0000b'},{kind:'poll',vote:'invalid'},{kind:'glitter',add:-1},{kind:'glitter',add:101},{kind:'kolam',pattern:'zzzzz'}])assert.throws(()=>validateInteraction({...valid,...patch}));
 assert.equal(validateInteraction({...valid,kind:'poll',vote:'girl'}).value.vote,'girl');
 assert.deepEqual(interactionDesigns['up-and-away-v1'],['wish']);
});
test('database shares responses, isolates invitations, deduplicates retries and restricts public access',async()=>{
 const pg=new PGlite();try{
 await pg.exec('create role anon;create role authenticated;create role service_role;create table invitations(id uuid primary key,published boolean,deleted_at timestamptz,expires_at timestamptz);');
 await pg.exec(fs.readFileSync('supabase/migrations/20261114071917_shared_guest_interactions.sql','utf8'));
 await pg.query("insert into invitations values($1,true,null,now()+interval '1 day'),($2,true,null,now()+interval '1 day')",[uuid,other]);
 const write=(id,kind,visitor,request,value)=>pg.query('select fmi_write_guest_interaction($1,$2,$3,$4,$5)',[id,kind,visitor,request,JSON.stringify(value)]);
 const read=async id=>(await pg.query('select fmi_read_guest_interactions($1) as data',[id])).rows[0].data;
 await write(uuid,'wish','a',uuid,{name:'Guest A',message:'Shared wish'});await write(uuid,'wish','a',uuid,{name:'Guest A',message:'Shared wish'});
 assert.equal((await read(uuid)).wishes.length,1);assert.equal((await read(other)).wishes.length,0);
 await Promise.all([write(uuid,'poll','a',uuid,{vote:'girl'}),write(uuid,'poll','b',other,{vote:'boy'})]);
 assert.equal((await read(uuid)).girl,1);assert.equal((await read(uuid)).boy,1);
 await write(uuid,'poll','a',uuid,{vote:'boy'});assert.equal((await read(uuid)).girl,0);assert.equal((await read(uuid)).boy,2);
 await write(uuid,'glitter','a',uuid,{add:3});await write(uuid,'glitter','a',uuid,{add:3});assert.equal((await read(uuid)).total,3);
 for(const role of ['anon','authenticated']){await pg.exec('set role '+role);await assert.rejects(pg.query('select * from guest_interactions'));await assert.rejects(read(uuid));await assert.rejects(write(uuid,'wish','a',other,{name:'X',message:'X'}));await pg.exec('reset role');}
 await pg.query("update invitations set expires_at=now()-interval '1 second' where id=$1",[uuid]);assert.equal(await read(uuid),null);await assert.rejects(write(uuid,'wish','a',other,{name:'X',message:'X'}));
 }finally{await pg.close();}
});
test('API requires a published invitation and matching renderer and returns no-store public fields',async()=>{
 const original=global.fetch,env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'server-secret',RATE_LIMIT_SECRET:'x'.repeat(32)});
 let available=true,renderer='up-and-away-v1',writes=0;
 global.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  const response=path.endsWith('/invitations')?(available?[{id:uuid,template_version_id:other}]:[]):path.endsWith('/template_versions')?[{renderer}]:path.endsWith('/consume_rate_limit')?true:path.endsWith('/fmi_read_guest_interactions')?{wishes:[{name:'A',message:'Shared'}],kolams:[],girl:0,boy:0,total:0}:null;
  if(path.endsWith('/fmi_write_guest_interaction'))writes++;
  return new Response(JSON.stringify(response),{status:200});
 };
 const invoke=async body=>{const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.code=s;return this;},json(v){this.data=v;}};await handler({url:'/api/invitations?action=guest-interactions&slug=sample-invite',method:body?'POST':'GET',headers:{},socket:{remoteAddress:'local'},body},res);return res;};
 try{
  let r=await invoke();assert.equal(r.code,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(r.data.wishes[0].message,'Shared');
  r=await invoke(valid);assert.equal(r.code,200);assert.equal(writes,1);
  r=await invoke({...valid,kind:'poll',vote:'girl'});assert.equal(r.code,400);assert.equal(writes,1);
  available=false;r=await invoke();assert.equal(r.code,404);r=await invoke(valid);assert.equal(r.code,404);
  available=true;renderer='other-v1';r=await invoke(valid);assert.equal(r.code,404);
 }finally{global.fetch=original;for(const k of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RATE_LIMIT_SECRET']){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}}
});
