import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {FREE_WEBSITE_IDS,isFreeWebsite} from '../shared/catalog-access.mjs';
import {FREE_VIDEO_IDS,isFreeVideo} from '../shared/video-access.mjs';
import {videoQuote} from '../shared/video-pricing.mjs';
import {videoPaymentService} from '../server/video-payments.mjs';
import {templateShareData,templateShareMeta} from '../server/template-share.mjs';
import {templateShareCardHtml} from '../shared/template-share-card.mjs';
const migration='20261121102618_free_catalog_invitations';

test('source-scoped prices and share previews distinguish free designs from premium',()=>{
 assert.equal(FREE_WEBSITE_IDS.length,22);assert.equal(FREE_VIDEO_IDS.length,39);
 for(const id of ['ivory-lace','embroidered-garden','mother-of-pearl','fresco','stained-glass','royal','invented'])assert.equal(isFreeWebsite(id),false);
 for(const id of FREE_VIDEO_IDS)assert.equal(videoQuote(id).totalPaise,0);
 assert.equal(isFreeVideo('wedding-bells-v1'),false);assert.equal(isFreeVideo('invented'),false);
 assert.equal(videoQuote('wedding-bells-v1').totalPaise,82482);
 assert.equal(isFreeVideo('film-oonjal-v1'),false);
 assert.equal(videoQuote('film-oonjal-v1').totalPaise,35282);
 const entry=templateShareData({id:'moonlit-nikah',name:'Moonlit Nikah',thumbnail:'/assets/poster.webp',basePaise:0},'website',19900);
 assert.equal(entry.amountPaise,0);assert.equal(entry.originalPaise,0);
 assert.match(templateShareMeta(entry,'https://findmyinvite.com').description,/Free/);
 assert.doesNotMatch(templateShareMeta(entry,'https://findmyinvite.com').description,/applicable tax/);
 assert.doesNotMatch(templateShareCardHtml(entry),/<del|\+ applicable tax/);
});

test('database enforces free publication, durable access and historical payment integrity',async t=>{
 const pg=new PGlite();
 try{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);
 create table public.template_catalog(id text primary key);
 create table public.template_versions(id uuid primary key,template_id text references template_catalog(id),approved_at timestamptz);
 create table public.invitations(id uuid primary key,slug text unique,owner_id uuid,template_version_id uuid,draft_content jsonb,published_content jsonb,draft_revision integer default 0,published_revision integer,first_published_at timestamptz,expires_at timestamptz,published boolean default false,deleted_at timestamptz);
 create table public.cms_audit(actor_id uuid,action text,target text,detail jsonb);
 create table public.website_orders(id uuid primary key default gen_random_uuid(),invitation_id uuid,owner_id uuid,template_version_id uuid,purpose text check(purpose in ('publish','renew')),base_paise integer not null check(base_paise in (100,19900)),tax_bps integer not null check(tax_bps between 0 and 10000),tax_paise integer not null check(tax_paise>=0),amount integer not null check(amount=base_paise+tax_paise),currency text default 'INR',razorpay_order_id text unique,razorpay_payment_id text unique,status text default 'created' check(status in ('created','captured','refunded')),applied_at timestamptz);
 create unique index website_order_unapplied on website_orders(invitation_id,purpose) where applied_at is null and status in ('created','captured');
 grant all on all tables in schema public to service_role;`);
 for(const file of ['20261112070852_video_invitation_checkout','20261115130956_checkout_card_prices','20261117011141_wedding_bells_premium_price','20261112102539_invitation_draft_recovery','20261112104905_video_character_preparation',migration])await pg.exec(await readFile('supabase/migrations/'+file+'.sql','utf8'));
 const owner=randomUUID(),other=randomUUID(),freeVersion=randomUUID(),paidVersion=randomUUID();
 await pg.query('insert into auth.users values($1),($2)',[owner,other]);
 await pg.exec("insert into template_catalog values('moonlit-nikah'),('ivory-lace')");
 await pg.query('insert into template_versions values($1,$2,now()),($3,$4,now())',[freeVersion,'moonlit-nikah',paidVersion,'ivory-lace']);
 await pg.exec('set role service_role');
 const web=async(version=freeVersion)=>{const id=randomUUID(),slug='test-'+id;await pg.query("insert into invitations(id,slug,owner_id,template_version_id,draft_content) values($1,$2,$3,$4,'{\"groom\":\"Test\"}')",[id,slug,owner,version]);return {id,slug};};
 const reserve=async(i,purpose='publish',user=owner)=>(await pg.query('select public.fmi_reserve_free_website_order($1,$2,$3) as result',[i.id,user,purpose])).rows[0].result.order;
 const publish=async(i,o,renew=false,rev=0)=>(await pg.query('select public.fmi_publish_invitation_v2($1,$2,$3,$4,$5) as result',[i.slug,owner,rev,o?.id||null,renew])).rows[0].result;
 const video=async(template='temple-v1')=>{const id=randomUUID();await pg.query("select public.fmi_save_personalization_draft($1,$2,'video',$3,$4,0)",[id,owner,template,JSON.stringify({content:{photos:{}}})]);return id;};
 const reserveVideo=async(id,template='temple-v1',user=owner)=>(await pg.query('select * from public.fmi_reserve_video_invitation_v4($1,$2,$3)',[id,user,template])).rows[0];
 const oonjal='film-oonjal-v1';
 const grandfathered=await video(oonjal);
 await reserveVideo(grandfathered,oonjal);
 await pg.exec('reset role');
 await pg.exec(await readFile('supabase/migrations/20261121120452_oonjal_paid_video.sql','utf8'));
 await pg.exec('set role service_role');
 await t.test('new Oonjal reservations require ₹299 plus GST and past grants still open',async()=>{
  const id=await video(oonjal);
  const row=await reserveVideo(id,oonjal);
  assert.equal(row.status,'pending');
  assert.equal(row.free_access,false);
  assert.deepEqual([row.base_paise,row.tax_paise,row.total_paise],[29900,5382,35282]);
  assert.equal((await reserveVideo(id,oonjal)).id,id);
  await assert.rejects(pg.query('update video_invitation_orders set free_access=true where id=$1',[id]),/video_free_access_template/);
  await assert.rejects(pg.query('update video_invitation_orders set tax_paise=0,total_paise=base_paise where id=$1',[id]),/total_paise_check/);
  const store={get:async id=>(await pg.query('select * from video_invitation_orders where id=$1',[id])).rows[0],reserve:(id,user,tid)=>reserveVideo(id,tid,user)};
  const service=videoPaymentService({store,env:{}});
  await assert.rejects(service.requireAccess(owner,id,oonjal),{status:402,message:/352[.]82/});
  assert.equal((await service.requireAccess(owner,grandfathered,oonjal)).free_access,true);
  assert.equal((await service.order(owner,grandfathered,oonjal)).amount,0);
 });
 await t.test('free website reserves once, publishes, updates and renews without a captured payment',async()=>{
  const i=await web(),o=await reserve(i);assert.equal(o.status,'free');assert.equal(o.amount,0);assert.equal((await reserve(i)).id,o.id);
  const published=await publish(i,o);assert.equal(published.published,true);assert.equal(published.published_content.groom,'Test');assert.equal((await publish(i,o)).expires_at,published.expires_at);
  await pg.query("update invitations set draft_content='{}',draft_revision=1 where id=$1",[i.id]);
  await assert.rejects(publish(i,null),/Draft changed/);
  assert.deepEqual((await publish(i,null,false,1)).published_content,{});
  const renewal=await reserve(i,'renew'),renewed=await publish(i,renewal,true,1);assert.ok(Date.parse(renewed.expires_at)>Date.parse(published.expires_at));assert.equal((await publish(i,renewal,true,1)).expires_at,renewed.expires_at);
 });
 await t.test('wrong owner, paid designs, forged free records and expired recovery remain blocked',async()=>{
  const i=await web();await assert.rejects(reserve(i,'publish',other),/not found/);
  const paid=await web(paidVersion);await assert.rejects(reserve(paid),/requires payment/);await assert.rejects(publish(paid,null),/Payment required/);
  const free=await reserve(i);await pg.query('update website_orders set invitation_id=$2,template_version_id=$3 where id=$1',[free.id,paid.id,paidVersion]);await assert.rejects(publish(paid,free),/Captured payment/);
  await pg.query("update invitations set first_published_at=now()-interval '1 year',expires_at=now()-interval '91 days' where id=$1",[i.id]);await assert.rejects(reserve(i,'renew'),/Recovery period/);
 });
 await t.test('old pending website gateway orders remain untouched alongside a free publication',async()=>{
  const i=await web(),old=randomUUID();await pg.query("insert into website_orders(id,invitation_id,owner_id,template_version_id,purpose,base_paise,tax_bps,tax_paise,amount,razorpay_order_id) values($1,$2,$3,$4,'publish',19900,1800,3582,23482,'order_before')",[old,i.id,owner,freeVersion]);
  const o=await reserve(i);await publish(i,o);const row=(await pg.query('select * from website_orders where id=$1',[old])).rows[0];assert.equal(row.status,'created');assert.equal(row.amount,23482);assert.equal(row.razorpay_order_id,'order_before');
 });
 await t.test('all listed free IDs agree between JavaScript and SQL',async()=>{
  for(const id of FREE_WEBSITE_IDS)assert.equal((await pg.query('select public.fmi_free_website($1) as yes',[id])).rows[0].yes,true);
  for(const id of FREE_VIDEO_IDS)assert.equal((await pg.query('select public.fmi_free_video($1) as yes',[id])).rows[0].yes,true);
 });
 await t.test('free video requires an owned saved draft and an exact template binding',async()=>{
  const id=await video();const row=await reserveVideo(id);assert.equal(row.status,'free');assert.equal(row.total_paise,0);assert.equal(row.free_access,true);assert.equal((await reserveVideo(id)).id,id);
  await assert.rejects(reserveVideo(randomUUID()),/Save your invitation/);await assert.rejects(reserveVideo(id,'temple-v1',other),/Save your invitation/);await assert.rejects(reserveVideo(id,'film-drive-v1'),/Save your invitation/);
  await assert.rejects(pg.query("update video_invitation_orders set template_id='wedding-bells-v1' where id=$1",[id]),/check constraint/);
 });
 await t.test('free video server access never calls Razorpay, including old pending and refunded payments',async()=>{
  const store={get:async id=>(await pg.query('select * from video_invitation_orders where id=$1',[id])).rows[0]||null,reserve:(id,user,template)=>reserveVideo(id,template,user)};
  let gatewayCalls=0;const gateway={get:()=>{gatewayCalls++;throw Error('Gateway must not run');},create:()=>{gatewayCalls++;throw Error('Gateway must not run');}};
  const service=videoPaymentService({store,env:{},gateway});
  const id=await video();assert.equal((await service.order(owner,id,'temple-v1')).amount,0);assert.equal((await service.requireAccess(owner,id,'temple-v1')).free_access,true);
  for(const status of ['pending','captured','refunded']){
   const legacy=await video();await pg.query('select * from fmi_reserve_video_invitation_v3($1,$2,$3)',[legacy,owner,'temple-v1']);
   await pg.query('update video_invitation_orders set status=$2,razorpay_order_id=$3,razorpay_payment_id=$4,unlocked_at=now() where id=$1',[legacy,status,'order_'+legacy,'pay_'+legacy]);
   const before=await store.get(legacy);const result=await service.order(owner,legacy,'temple-v1');assert.equal(result.unlocked,true);assert.equal(result.amount,0);
   const after=await store.get(legacy);assert.deepEqual({...after,free_access:false},before);assert.equal((await service.status(owner,legacy,'temple-v1')).amount,0);
  }
  assert.equal(gatewayCalls,0);
 });
 await t.test('Wedding Bells retains paid access and original amount; unknown IDs cannot get free entitlement',async()=>{
  const id=await video('wedding-bells-v1'),row=await reserveVideo(id,'wedding-bells-v1');assert.equal(row.free_access,false);assert.equal(row.total_paise,82482);
  await assert.rejects(pg.query('update video_invitation_orders set free_access=true where id=$1',[id]),/check constraint/);
  const unknown=await reserveVideo(randomUUID(),'unknown');assert.equal(unknown.free_access,false);assert.ok(unknown.total_paise>0);
 });
 await t.test('free Temple characters retain owner checks, approval revisions and the one-redo limit',async()=>{
  const id=await video();await reserveVideo(id);
  const claim=async(kind,key,user=owner)=>(await pg.query("select * from fmi_claim_video_character($1,$2,'groom',$3,$4,'fixture','v1','[]','{}')",[user,id,kind,key])).rows[0];
  await assert.rejects(claim('initial','wrong',other),/not found/);
  const job=await claim('initial','first');await pg.query("update video_character_jobs set status='review',output_media_id=id where id=$1",[job.id]);
  await assert.rejects(pg.query('select fmi_approve_video_character($1,$2,2)',[owner,job.id]),/another device/);
  await pg.query('select fmi_approve_video_character($1,$2,1)',[owner,job.id]);const redo=await claim('redo','redo');await pg.query("update video_character_jobs set status='review' where id=$1",[redo.id]);await assert.rejects(claim('redo','again'),/one requested redo/);
 });
 await t.test('public and authenticated clients cannot self-grant free access',async()=>{
  for(const role of ['anon','authenticated']){await pg.exec('reset role;set role '+role);await assert.rejects(pg.query('select public.fmi_reserve_video_invitation_v4($1,$2,$3)',[randomUUID(),owner,'temple-v1']),/permission denied/);await assert.rejects(pg.query("select public.fmi_reserve_free_website_order($1,$2,'publish')",[randomUUID(),owner]),/permission denied/);await assert.rejects(pg.query('select public.fmi_publish_invitation_v2($1,$2,0,null,false)',['unknown',owner]),/permission denied/);}
 });
 }finally{await pg.close();}
});
