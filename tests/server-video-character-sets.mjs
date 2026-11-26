import {verifyReceptionSilhouette} from '../server/video-character-images.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {PGlite} from '@electric-sql/pglite';
import {HttpError} from '../server/core.mjs';
import {hash} from '../server/video-personalise-store.mjs';
import {characterSetService} from '../server/video-character-sets.mjs';
import {validatePreparedCharacters,characterSetsEnabled,characterEnabled} from '../server/video-character-access.mjs';
import {alignToReference} from '../server/video-character-images.mjs';
import {identityPrompt,posePrompt,characterSetInput,CHARACTER_SET_PROMPT_REVISION} from '../shared/anbil-avan-character-prompt.mjs';
import {CHARACTER_PROMPT_REVISION,characterPrompt} from '../server/video-character-provider.mjs';
import {ANBIL_AVAN_ID as templateId,ANBIL_AVAN_DEFAULT_ART,ANBIL_AVAN_CHARACTER_PROFILE as profile,ANBIL_AVAN_POSE_SLOTS as slots} from '../shared/anbil-avan-video.mjs';

const inventory=JSON.parse(await readFile('public'+profile.inventory,'utf8'));
const art=slot=>readFile('public'+(ANBIL_AVAN_DEFAULT_ART[slot]||inventory[slot]).path);

test('2D identity-first prompts are independent of the Temple 3D prompts and keep the photo print',()=>{
 assert.notEqual(CHARACTER_SET_PROMPT_REVISION,CHARACTER_PROMPT_REVISION);
 const identity=identityPrompt('bride','set-1'),couple=posePrompt(profile.poses.find(p=>p.slot==='heartCouple'),'a-1'),print=posePrompt(profile.poses.find(p=>p.slot==='groomPrint'));
 for(const prompt of [identity,couple,print]){assert.match(prompt,/modern painterly 2D illustration/);assert.match(prompt,/no 3D render, no CGI/);assert.match(prompt,/Identity comes first/);assert.match(prompt,/REAL transparent background/);assert.doesNotMatch(prompt,/3D animated movie look|large expressive head|cream silk/);}
 assert.notEqual(identity,characterPrompt('bride'));
 assert.match(couple,/^EDIT PICTURE 1/);
 assert.match(couple,/Picture 2 is the approved illustrated identity reference of the bride[\s\S]*Picture 3 is the approved illustrated identity reference of the groom/);
 assert.match(couple,/the woman is the bride and the man is the groom/);assert.match(couple,/Keep EVERYTHING else/);assert.match(couple,/Tracking reference a-1/);
 assert.match(print,/hanging photo print: keep the print's border\/frame/);assert.match(print,/EDIT PICTURE 1/);
 assert.match(posePrompt(profile.poses.find(p=>p.slot==='receptionCouple')),/hand rests on the near shoulder/);
 assert.deepEqual(characterSetInput('p',['a','b']),{prompt:'p',input_images:['a','b'],aspect_ratio:'2:3',quality:'high',complexity:'low',output_format:'png',background:'transparent',number_of_images:1});
});

test('all nine generation targets match the personalized layers in the public scene graph',async()=>{
 const base=profile.inventory.slice(0,profile.inventory.lastIndexOf('/')+1);
 const scenes=JSON.parse(await readFile('public'+base+'scenes.json','utf8'));
 for(const [i,pose] of profile.poses.entries()){
  const item=inventory[pose.slot],layer=scenes[i].layers.filter(l=>l.characterSlot===pose.slot);
  assert.equal(layer.length,1,pose.slot);
  assert.equal(item.sceneIndex,i);assert.equal(item.layerId,layer[0].id);
  assert.equal(item.path,base+layer[0].src);assert.equal(hash(await art(pose.slot)),(ANBIL_AVAN_DEFAULT_ART[pose.slot]||item).sha256);
 }
});

test('Reception accepts the approved hand-on-shoulder silhouette and rejects the previous leaning pose',async()=>{
 const current=await art('receptionCouple');
 const old=await readFile('public'+inventory.receptionCouple.path);
 await verifyReceptionSilhouette((await alignToReference(current,current)).bytes);
 await assert.rejects(async()=>verifyReceptionSilhouette((await alignToReference(old,current)).bytes),e=>e.code==='CHARACTER_QUALITY');
 const gap=await sharp({create:{width:100,height:100,channels:4,background:'white'}}).png().toBuffer();
 const missingArm=await sharp(current).composite([{input:gap,left:480,top:505,blend:'dest-out'}]).png().toBuffer();
 await assert.rejects(verifyReceptionSilhouette(missingArm),e=>e.code==='CHARACTER_QUALITY');
});

test('pose outputs are placed on the exact approved canvas and pose drift is rejected',async()=>{
 const reference=await art('weddingCouple'),meta=await sharp(reference).metadata();
 const smaller=await sharp({create:{width:900,height:1400,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp(reference).resize(561,701).png().toBuffer(),left:40,top:300}]).png().toBuffer();
 for(const input of [reference,smaller]){const placed=await alignToReference(input,reference);const out=await sharp(placed.bytes).metadata();assert.deepEqual([out.width,out.height],[meta.width,meta.height]);assert.ok(placed.alignment.silhouette>=.9,String(placed.alignment.silhouette));}
 const print=await art('groomPrint'),printed=await alignToReference(print,print,{minSilhouette:.8});assert.deepEqual([printed.alignment.width,printed.alignment.height],[1086,1448]);
 await assert.rejects(alignToReference(await art('umbrellaBride'),print,{minSilhouette:.8}),e=>e.code==='CHARACTER_QUALITY');
 await assert.rejects(alignToReference(await sharp({create:{width:300,height:300,channels:4,background:'red'}}).png().toBuffer(),reference),e=>e.code==='CHARACTER_QUALITY');
});

test('character sets have their own gate; the Temple flag never enables billable set generation',()=>{
 const owner=randomUUID();
 assert.equal(characterEnabled(owner,{VIDEO_CHARACTERS_ENABLED:'1'}),true);assert.equal(characterSetsEnabled(owner,{VIDEO_CHARACTERS_ENABLED:'1'}),false);
 assert.equal(characterSetsEnabled(owner,{VIDEO_CHARACTER_SETS_ENABLED:'qa',VIDEO_CHARACTER_QA_OWNERS:owner}),true);
 assert.equal(characterSetsEnabled(randomUUID(),{VIDEO_CHARACTER_SETS_ENABLED:'qa',VIDEO_CHARACTER_QA_OWNERS:owner}),false);
 assert.equal(characterSetsEnabled(owner,{VIDEO_CHARACTER_SETS_ENABLED:'1'}),true);
});

test('Temple prepared-character validation is unchanged and never reads character sets',async()=>{
 const owner=randomUUID(),invitation=randomUUID(),paths=[];
 const query=async path=>{paths.push(path);return [{slot:'groom',output_media_id:'g',approved_current:true}];};
 await validatePreparedCharacters(owner,invitation,{groom:{id:'g',mode:'prepared'}},query);
 await assert.rejects(validatePreparedCharacters(owner,invitation,{bride:{id:'b',mode:'prepared'}},query),/Approve the bride/);
 await validatePreparedCharacters(owner,invitation,{},query,{templateId:'temple-v1',draft:null});
 assert.ok(paths.every(p=>p.startsWith('video_character_jobs?')));
});

// ---- Durable SQL + service, against the 1B SQL draft (or its applied migration) ----
async function characterSetSql(){
 if(process.env.FMI_CHARACTER_SET_SQL)return readFile(process.env.FMI_CHARACTER_SET_SQL,'utf8');
 const file=(await readdir('supabase/migrations')).find(f=>/_video_character_sets\.sql$/.test(f));
 return file?readFile('supabase/migrations/'+file,'utf8'):null;
}
const sql=await characterSetSql();
const durable=sql?{}:{skip:'The character-set SQL is still a Requests draft; set FMI_CHARACTER_SET_SQL (or add the migration) to run.'};
function pgRepo(pg){
 const rows=async(text,params=[])=>(await pg.query(text,params)).rows,first=async(text,params)=>(await rows(text,params))[0]||null;
 const call=async(text,params)=>{try{return await first(text,params);}catch(e){const status={PT402:402,PT404:404,PT409:409}[e.code];if(status)throw new HttpError(status,e.message);throw e;}};
 function patch(table,id,body,filter=''){
  const keys=Object.keys(body),params=[id,...keys.map(k=>body[k])],where=['id=$1'];
  for(const part of filter.split('&').filter(Boolean)){let m;
   if((m=/^status=in\.\(([a-z_,]+)\)$/.exec(part))){params.push('{'+m[1]+'}');where.push('status=any($'+params.length+'::text[])');}
   else if((m=/^(status|lease_id)=eq\.(.+)$/.exec(part))){params.push(m[2]);where.push(m[1]+'=$'+params.length);}
   else if((m=/^or=\(lease_until\.is\.null,lease_until\.lt\.(.+)\)$/.exec(part))){params.push(decodeURIComponent(m[1]));where.push('(lease_until is null or lease_until<$'+params.length+')');}
   else throw Error('Unsupported filter '+part);}
  return first('update public.'+table+' set '+keys.map((k,i)=>k+'=$'+(i+2)).join(',')+' where '+where.join(' and ')+' returning *',params);
 }
 const list=a=>'{'+a.join(',')+'}';
 return {
  courtesy:async(o,i)=>(await first('select character_courtesy from public.video_invitation_orders where owner_id=$1 and id=$2',[o,i]))?.character_courtesy||[],
  sets:(o,i)=>rows('select * from public.video_character_sets where invitation_id=$1 and owner_id=$2 order by created_at',[i,o]),
  set:id=>first('select * from public.video_character_sets where id=$1',[id]),
  assets:s=>rows('select * from public.video_character_assets where set_id=$1 order by created_at',[s]),
  invitationAssets:(o,i)=>rows('select * from public.video_character_assets where invitation_id=$1 and owner_id=$2 order by created_at',[i,o]),
  asset:id=>first('select * from public.video_character_assets where id=$1',[id]),
  patchAsset:(id,body,filter)=>patch('video_character_assets',id,body,filter),patchSet:(id,body,filter)=>patch('video_character_sets',id,body,filter),
  pending:n=>rows("select * from public.video_character_assets where status in ('queued','submitting','processing','preparing') order by updated_at limit $1",[n]),
  moving:n=>rows("select * from public.video_character_sets where status in ('identities','poses') order by updated_at limit $1",[n]),
  claim:b=>call('select * from public.fmi_claim_video_character_set($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::text[],$11,$12::jsonb)',[b.p_owner,b.p_invitation,b.p_template,b.p_version,b.p_profile,b.p_prompt,b.p_model,b.p_key,JSON.stringify(b.p_photos),list(b.p_regenerate),b.p_redo,JSON.stringify(b.p_identities)]),
  confirm:b=>call('select * from public.fmi_confirm_video_character_set($1,$2,$3,$4::jsonb)',[b.p_owner,b.p_set,b.p_model,JSON.stringify(b.p_poses)]),
  approve:b=>call('select * from public.fmi_approve_video_character_set($1,$2,$3,$4::text[])',[b.p_owner,b.p_set,b.p_revision,list(b.p_slots)]),
  rest:async path=>{let m;
   if((m=/^video_character_sets\?invitation_id=eq\.([a-f0-9-]+)&owner_id=eq\.([a-f0-9-]+)&approved_current=eq\.true&select=\*$/.exec(path)))return rows('select * from public.video_character_sets where invitation_id=$1 and owner_id=$2 and approved_current',[m[1],m[2]]);
   if((m=/^video_character_assets\?set_id=eq\.([a-f0-9-]+)&status=eq\.ready&select=asset,output_media_id$/.exec(path)))return rows("select asset,output_media_id from public.video_character_assets where set_id=$1 and status='ready'",[m[1]]);
   throw Error('Unexpected query '+path);},
  draft:(o,i)=>first('select * from public.personalization_drafts where id=$1 and owner_id=$2',[i,o])
 };
}
function memoryStore(){const files=new Map(),records=new Map();return {files,records,read:async k=>records.has(k)?{value:structuredClone(records.get(k)),etag:'e'}:null,save:async(k,v)=>{records.set(k,structuredClone(v));},bytes:async k=>{if(!files.has(k))throw Error('File unavailable');return files.get(k);},putBytes:async(k,b)=>{if(files.has(k))throw Error('Object exists');files.set(k,b);return k;}};}
function fakeProvider(){
 const calls=[],outputs=new Map();let n=0;const provider={calls,behaviour:()=>'ok',
  async create(input,webhook){n++;calls.push({input,webhook});const id='prediction-'+n,url='https://replicate.delivery/test/'+id+'.png',mode=provider.behaviour(input,n);
   if(mode==='reject')throw Object.assign(Error('Unavailable'),{providerStatus:503});
   const pose=/^EDIT PICTURE/.test(input.prompt),first=Buffer.from(input.input_images[0].split(',')[1],'base64');
   outputs.set(url,mode==='drift'?await sharp({create:{width:300,height:300,channels:4,background:'red'}}).png().toBuffer():pose?first:await sharp(first).resize(640,960).png().toBuffer());
   return mode==='fail'?{id,status:'failed',output:null}:{id,status:'succeeded',output:url,version:'test-version'};},
  get:async id=>({id,status:'succeeded',output:'https://replicate.delivery/test/'+id+'.png'}),recent:async()=>({results:[]}),
  output:async url=>{if(!outputs.has(url))throw Error('Expired provider output');return outputs.get(url);}};
 return provider;
}
async function fixture(){
 const pg=new PGlite();
 await pg.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');
 for(const f of ['20261112070852_video_invitation_checkout','20261112102539_invitation_draft_recovery','20261112104905_video_character_preparation'])await pg.exec(await readFile('supabase/migrations/'+f+'.sql','utf8'));
 await pg.exec(sql);
 await pg.exec(await readFile('supabase/migrations/20261126181627_video_character_courtesy.sql','utf8'));
 const owner=randomUUID(),other=randomUUID(),invitation=randomUUID();await pg.query('insert into auth.users values($1),($2)',[owner,other]);await pg.exec('set role service_role');
 await pg.query("select public.fmi_save_personalization_draft($1,$2,'video',$3,$4,0)",[invitation,owner,templateId,JSON.stringify({masterVersion:1,content:{bride:'Priya',groom:'Arun',photos:{}},personalPhotosEnabled:true,charactersChoice:'personal'})]);
 const repo=pgRepo(pg),store=memoryStore(),provider=fakeProvider();
 const drafts={get:async(o,id)=>{const r=await repo.draft(o,id);if(!r)throw new HttpError(404,'Invitation not found.');return r;},pinMedia:async()=>{}};
 const service=characterSetService({repo,store,provider,drafts,payments:{requireAccess:async()=>{}}});
 const photo=async(color,who=owner)=>{const id=randomUUID(),bytes=await sharp({create:{width:400,height:600,channels:3,background:color}}).jpeg().toBuffer(),key='persistent/'+who+'/'+invitation+'/'+id+'/original';store.files.set(key,bytes);store.records.set('media/'+id+'.json',{id,owner:who,invitationId:invitation,kind:'image',status:'ready',key,sha256:hash(bytes),contentType:'image/jpeg',bytes:bytes.length,durable:true,expiresAt:null});return id;};
 const unlock=async()=>{await pg.query('select public.fmi_reserve_video_invitation($1,$2,$3)',[invitation,owner,templateId]);await pg.query("update public.video_invitation_orders set status='complimentary',promo_sha256=$2,unlocked_at=now() where id=$1",[invitation,'a'.repeat(64)]);};
 const drain=async()=>{for(let i=0;i<20;i++){const pending=await repo.pending(50);if(!pending.length)return;for(const a of pending)await service.process(a.id);}throw Error('Character jobs did not settle.');};
 return {pg,repo,store,provider,service,owner,other,invitation,photo,unlock,drain};
}

test('paid access, two photos -> two identities -> nine aligned poses -> one atomic approval bound to export',durable,async()=>{
 const f=await fixture();try{
  const photos={bride:await f.photo('pink'),groom:await f.photo('navy')};
  await assert.rejects(f.service.submit(f.owner,{invitationId:f.invitation,photos}),e=>e.status===402);assert.equal(f.provider.calls.length,0);
  await f.unlock();
  const [a,b]=await Promise.all([f.service.submit(f.owner,{invitationId:f.invitation,photos}),f.service.submit(f.owner,{invitationId:f.invitation,photos})]);
  assert.equal(a.id,b.id);assert.equal(a.status,'identities');assert.equal((await f.repo.sets(f.owner,f.invitation)).length,1);
  await assert.rejects(f.service.confirm(f.owner,a.id),/not ready|must be ready/);
  await f.drain();assert.equal(f.provider.calls.length,2);
  for(const call of f.provider.calls){assert.equal(call.input.input_images.length,2);assert.match(call.input.prompt,/real photo of the (bride|groom)/);assert.match(call.webhook,/action=asset-callback&id=/);}
  let set=await f.repo.set(a.id);assert.equal(set.status,'identity_review');
  await assert.rejects(f.service.approve(f.owner,a.id,1),/ready for approval|must be ready/);
  await assert.rejects(f.service.confirm(f.other,a.id),e=>e.status===404);
  await f.service.confirm(f.owner,a.id);await f.service.confirm(f.owner,a.id);await f.drain();
  assert.equal(f.provider.calls.length,11);set=await f.repo.set(a.id);assert.equal(set.status,'review');
  const poses=(await f.repo.assets(a.id)).filter(x=>x.asset.startsWith('pose:'));assert.deepEqual(poses.map(x=>x.asset.slice(5)).sort(),[...slots].sort());
  for(const pose of profile.poses){const call=f.provider.calls.find(c=>c.input.prompt.includes('"'+pose.label+'"'));assert.equal(call.input.input_images.length,pose.people.length+1,pose.slot);
   assert.equal(call.input.aspect_ratio,'3:4');
   const targetBytes=Buffer.from(call.input.input_images[0].split(',')[1],'base64');
   assert.equal(hash(await sharp(targetBytes).raw().toBuffer()),hash(await sharp(await art(pose.slot)).raw().toBuffer()),pose.slot);
   for(const [i,person] of pose.people.entries()){
    const identity=(await f.repo.assets(a.id)).find(row=>row.asset==='identity:'+person);
    assert.equal(hash(Buffer.from(call.input.input_images[i+1].split(',')[1],'base64')),identity.output_sha256);
   }
   const asset=poses.find(x=>x.asset==='pose:'+pose.slot),m=f.store.records.get('media/'+asset.id+'.json');
   assert.equal(m.characterSlot,pose.slot);assert.equal(m.characterSetId,a.id);assert.equal(m.characterProfile,profile.id);assert.equal(m.characterMasterVersion,1);assert.equal(m.owner,f.owner);
   assert.deepEqual([m.alignment.width,m.alignment.height],[inventory[pose.slot].width,inventory[pose.slot].height]);assert.ok(m.alignment.silhouette>=.99);
   const preview=await f.store.bytes(m.previewKey),meta=await sharp(preview).metadata();assert.equal(m.previewContentType,'image/webp');assert.equal(m.previewSha256,hash(preview));assert.equal(m.previewBytes,preview.length);assert.ok(preview.length<m.bytes);assert.equal(meta.width*m.alignment.height,meta.height*m.alignment.width);
  }
  await assert.rejects(f.service.approve(f.owner,a.id,0),/another device/);
  const draft=await f.service.approve(f.owner,a.id,1);
  assert.deepEqual(Object.keys(draft.payload.content.photos).sort(),[...slots].sort());
  for(const pose of poses)assert.deepEqual(draft.payload.content.photos[pose.asset.slice(5)],{id:pose.output_media_id,mode:'prepared',confirmed:true});
  assert.equal(draft.payload.personalPhotosEnabled,true);assert.equal(draft.payload.content.bride,'Priya');
  const stored=await f.repo.draft(f.owner,f.invitation),bound=draft.payload.content.photos;
  await validatePreparedCharacters(f.owner,f.invitation,bound,f.repo.rest,{templateId,draft:stored});
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,bound,f.repo.rest,{templateId,draft:{...stored,payload:{...stored.payload,references:{bride:{id:randomUUID()},groom:{id:photos.groom}}}}}),/reference photos changed/);
  const {closingCouple,...partial}=bound;assert.ok(closingCouple);
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,partial,f.repo.rest,{templateId,draft:stored}),/changed/);
  const identity=(await f.repo.assets(a.id)).find(x=>x.asset==='identity:groom');
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,{...bound,groomPrint:{id:identity.output_media_id,mode:'prepared',confirmed:true}},f.repo.rest,{templateId,draft:stored}),/changed/);
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,{},f.repo.rest,{templateId,draft:stored}),/Approve your matching characters/);
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,{},f.repo.rest,{templateId,draft:{payload:{masterVersion:1}}}),/Choose matching characters/);
  await validatePreparedCharacters(f.owner,f.invitation,{},f.repo.rest,{templateId,draft:{payload:{masterVersion:1,personalPhotosEnabled:false,charactersChoice:'original'}}});
  await assert.rejects(validatePreparedCharacters(f.other,f.invitation,bound,f.repo.rest,{templateId,draft:stored}),/Approve your matching characters/);
  // Text-only edits never claim or generate: the same photos return the approved set.
  assert.equal((await f.service.submit(f.owner,{invitationId:f.invitation,photos})).id,a.id);assert.equal(f.provider.calls.length,11);
 }finally{await f.pg.close();}
});

test('a bride photo change uses her one redo, reuses groom-only work and supersedes the old set',durable,async()=>{
 const f=await fixture();try{
  await f.unlock();const photos={bride:await f.photo('pink'),groom:await f.photo('navy')};
  const first=await f.service.submit(f.owner,{invitationId:f.invitation,photos});await f.drain();await f.service.confirm(f.owner,first.id);await f.drain();
  const approved=await f.service.approve(f.owner,first.id,1),oldPhotos=approved.payload.content.photos;assert.equal(f.provider.calls.length,11);
  const changed={...photos,bride:await f.photo('teal')};
  await assert.rejects(f.service.submit(f.owner,{invitationId:f.invitation,photos:changed}),/included redo/);
  const redo=await f.service.submit(f.owner,{invitationId:f.invitation,photos:changed,redo:true});
  assert.equal(redo.kind,'redo');assert.deepEqual(redo.redo,['bride']);assert.deepEqual(redo.regenerate,['bride']);
  await f.drain();assert.equal(f.provider.calls.length,12);
  await f.service.confirm(f.owner,redo.id);
  const assets=await f.repo.assets(redo.id),reused=assets.filter(x=>x.reused_from).map(x=>x.asset).sort();
  assert.deepEqual(reused,['identity:groom','pose:groomPortrait','pose:groomPrint']);
  for(const x of assets.filter(x=>x.reused_from))assert.equal(f.store.records.get('media/'+x.id+'.json').characterSetId,redo.id);
  await f.drain();assert.equal(f.provider.calls.length,19);
  const draft=await f.service.approve(f.owner,redo.id,2),bound=draft.payload.content.photos;
  assert.notEqual(bound.bridePortrait.id,oldPhotos.bridePortrait.id);assert.notEqual(bound.groomPrint.id,oldPhotos.groomPrint.id);
  assert.equal(f.store.records.get('media/'+bound.groomPrint.id+'.json').sha256,f.store.records.get('media/'+oldPhotos.groomPrint.id+'.json').sha256);
  assert.equal((await f.repo.set(first.id)).approved_current,false);
  const stored=await f.repo.draft(f.owner,f.invitation);
  await validatePreparedCharacters(f.owner,f.invitation,bound,f.repo.rest,{templateId,draft:stored});
  await assert.rejects(validatePreparedCharacters(f.owner,f.invitation,oldPhotos,f.repo.rest,{templateId,draft:stored}),/changed/);
  await assert.rejects(f.service.submit(f.owner,{invitationId:f.invitation,photos:{...changed,bride:await f.photo('gold')},redo:true}),/redo for this character has been used/);
  const list=await f.service.list(f.owner,f.invitation);assert.deepEqual(list.allowances,{bride:{initialUsed:true,redoUsed:true},groom:{initialUsed:true,redoUsed:false}});assert.equal(list.approved,redo.id);
  await f.pg.query("update public.video_invitation_orders set character_courtesy=array['bride'] where id=$1",[f.invitation]);
  assert.equal((await f.service.list(f.owner,f.invitation)).courtesy.bride,true);
  const courtesy={invitationId:f.invitation,photos:{...changed,bride:await f.photo('gold')},redo:true};
  const [one,two]=await Promise.all([f.service.submit(f.owner,courtesy),f.service.submit(f.owner,courtesy)]);
  assert.equal(one.id,two.id);await f.drain();
  assert.equal((await f.service.list(f.owner,f.invitation)).courtesy.bride,false);
  await assert.rejects(f.service.submit(f.owner,{...courtesy,photos:{...changed,bride:await f.photo('purple')}}),/included redo/);
  await assert.rejects(f.service.list(f.other,f.invitation),e=>e.status===404);
 }finally{await f.pg.close();}
});

test('technical failures and pose drift retry within bounds; saved output resumes without a new generation',durable,async()=>{
 const f=await fixture();try{
  await f.unlock();const photos={bride:await f.photo('pink'),groom:await f.photo('navy')};
  f.provider.behaviour=(input,n)=>n===1?'fail':'ok';
  const set=await f.service.submit(f.owner,{invitationId:f.invitation,photos});await f.drain();
  const identities=(await f.repo.assets(set.id));assert.ok(identities.every(x=>x.status==='ready'));assert.equal(Math.max(...identities.map(x=>x.attempts)),2);
  // One pose drifts once, then succeeds; another stays unusable and fails after three attempts.
  let drifted=0;f.provider.behaviour=input=>input.prompt.includes('"Shared heart"')&&!drifted++?'drift':input.prompt.includes('"Closing couple"')?'drift':'ok';
  await f.service.confirm(f.owner,set.id);await f.drain();
  const assets=await f.repo.assets(set.id),heart=assets.find(x=>x.asset==='pose:heartCouple'),closing=assets.find(x=>x.asset==='pose:closingCouple');
  assert.equal(heart.status,'ready');assert.equal(heart.attempts,2);assert.equal(closing.status,'failed');assert.equal(closing.attempts,3);
  assert.equal((await f.repo.set(set.id)).status,'poses');
  await assert.rejects(f.service.retry(f.owner,set.id),/exhausted/);
  // Crash after the provider output was persisted: retry re-prepares the saved bytes only.
  const calls=f.provider.calls.length;
  await f.pg.query("update public.video_character_assets set status='failed',attempts=1,raw_key=$2,provider_id='saved' where id=$1",[closing.id,assets.find(x=>x.asset==='pose:openingCouple').raw_key]);
  const openingRaw=f.store.files.get(assets.find(x=>x.asset==='pose:openingCouple').raw_key);assert.ok(openingRaw);
  const retried=await f.service.retry(f.owner,set.id);assert.deepEqual(retried.retried,[closing.id]);
  assert.equal((await f.repo.asset(heart.id)).status,'ready');
  f.provider.behaviour=()=>{throw Error('A saved output must not be regenerated');};
  await f.drain();assert.equal(f.provider.calls.length,calls);
  assert.equal((await f.repo.asset(closing.id)).status,'ready');assert.equal((await f.repo.set(set.id)).status,'review');
 }finally{await f.pg.close();}
});

test('rate limiting defers without spending attempts or an included redo',durable,async()=>{
 const f=await fixture();try{
  await f.unlock();const set=await f.service.submit(f.owner,{invitationId:f.invitation,photos:{bride:await f.photo('pink'),groom:await f.photo('navy')}}),asset=(await f.repo.assets(set.id))[0];
  const original=f.provider.create;let requests=0;f.provider.create=async()=>{requests++;throw Object.assign(Error('Throttled'),{providerStatus:429,retryAfterMs:12000});};
  await f.service.process(asset.id);const deferred=await f.repo.asset(asset.id);assert.equal(deferred.status,'queued');assert.equal(deferred.attempts,0);assert.ok(Date.parse(deferred.lease_until)>Date.now());
  await f.service.process(asset.id);assert.equal(requests,1);
  // An old queued attempt expires; retry gets a new deadline, not created_at.
  await f.pg.query("update public.video_character_assets set lease_until=null,created_at=now()-interval '1 day',updated_at=now()-interval '11 minutes' where id=$1",[asset.id]);
  await f.service.process(asset.id);assert.equal((await f.repo.asset(asset.id)).status,'failed');
  await f.service.retry(f.owner,set.id);const retried=await f.repo.asset(asset.id);
  await f.service.process(asset.id);const waiting=await f.repo.asset(asset.id);assert.equal(waiting.status,'queued');assert.equal(waiting.attempts,0);assert.equal(String(waiting.updated_at),String(retried.updated_at));
  await f.pg.query('update public.video_character_assets set lease_until=null where id=$1',[asset.id]);f.provider.create=original;
  await f.service.process(asset.id);assert.equal((await f.repo.asset(asset.id)).status,'ready');assert.equal((await f.repo.asset(asset.id)).attempts,1);
 }finally{await f.pg.close();}
});

test('SQL is server-only, owner-scoped and blocks concurrent or stale sets',durable,async()=>{
 const f=await fixture();try{
  await f.unlock();const photos={bride:await f.photo('pink'),groom:await f.photo('navy')};
  const set=await f.service.submit(f.owner,{invitationId:f.invitation,photos});
  await assert.rejects(f.service.submit(f.owner,{invitationId:f.invitation,photos:{...photos,bride:await f.photo('teal')}}),/still being prepared/);
  await assert.rejects(f.service.submit(f.other,{invitationId:f.invitation,photos}),e=>e.status===404);
  await assert.rejects(f.pg.query("update public.video_character_sets set approved_current=true where id=$1",[set.id]),/check/);
  for(const role of ['anon','authenticated']){await f.pg.exec('reset role;set role '+role);await assert.rejects(f.pg.query('select * from public.video_character_sets'),/permission denied/);await assert.rejects(f.pg.query('select public.fmi_approve_video_character_set($1,$2,1,$3::text[])',[f.owner,set.id,'{openingCouple}']),/permission denied/);}
  await f.pg.exec('reset role;set role service_role');
  // Temple's three-slot table and RPC still enforce their original slots.
  await assert.rejects(f.pg.query("select public.fmi_claim_video_character($1,$2,'openingCouple','initial','k','m','p','[]','{}')",[f.owner,f.invitation]),/check|violates/);
 }finally{await f.pg.close();}
});
