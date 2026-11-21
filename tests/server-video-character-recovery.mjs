import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {hash} from '../server/video-personalise-store.mjs';
import {characterService,CHARACTER_STALL_MS} from '../server/video-characters.mjs';
import {replicateProvider,CHARACTER_PROMPT_CANDIDATE,CHARACTER_PROMPT_REVISION,characterPromptRevision} from '../server/video-character-provider.mjs';

function fixture(overrides={},masterVersion){
 let now=Date.parse('2026-11-17T13:00:00Z');
 const owner=randomUUID(),invitation=randomUUID(),id=randomUUID();
 let row={id,owner_id:owner,invitation_id:invitation,slot:'groom',status:'processing',attempts:1,provider_id:'existing-prediction',raw_key:null,reference_data:[],created_at:new Date(now).toISOString(),updated_at:new Date(now).toISOString(),...overrides};
 const files=new Map(),media=new Map();
 const query=async(path,options)=>{
  if(path.startsWith('personalization_drafts'))return [{id:invitation,owner_id:owner,payload:masterVersion?{masterVersion}:{}}];
  assert.ok(path.startsWith('video_character_jobs?'));
  if(options?.method==='PATCH')row={...row,...options.body};
  return [{...row}];
 };
 const store={read:async key=>({value:media.get(key)}),bytes:async key=>{if(!files.has(key))throw Error('Missing saved image');return files.get(key);},putBytes:async(key,bytes)=>files.set(key,bytes),save:async(key,value)=>media.set(key,value)};
 const reference=(bytes,identity)=>{const id=randomUUID(),key='references/'+id+'.png';files.set(key,bytes);media.set('media/'+id+'.json',{id,key,owner,contentType:'image/png',durable:true,expiresAt:null});row.reference_data.push({id,sha256:hash(bytes),identity});};
 return {id,owner,files,media,reference,get row(){return row;},advance:ms=>now+=ms,service:options=>characterService({query,store,clock:()=>now,align:async bytes=>({bytes,alignment:{verified:true}}),...options})};
}

test('new individual requests send the identity first and artwork second with transparent 2:3 output',async()=>{
 for(const slot of ['groom','bride']){
  const f=fixture({slot,status:'queued',provider_id:null,attempts:0,prompt_revision:CHARACTER_PROMPT_REVISION,reference_data:[]}),photo=await sharp({create:{width:16,height:24,channels:4,background:'red'}}).png().toBuffer();f.reference(photo,'single');let sent;
  await f.service({provider:{create:async input=>{sent=input;return {id:'new-'+slot,status:'processing'};}}}).process(f.id);
  assert.equal(f.row.status,'processing');assert.equal(sent.input_images.length,2);assert.deepEqual(Buffer.from(sent.input_images[0].split(',')[1],'base64'),photo);assert.deepEqual(Buffer.from(sent.input_images[1].split(',')[1],'base64'),await readFile('public/assets/video-masters/temple-v1/'+slot+'.png'));
  assert.equal(sent.aspect_ratio,'2:3');assert.equal(sent.background,'transparent');assert.equal(sent.output_format,'png');assert.match(sent.prompt,/EDIT PICTURE 2/);assert.ok(sent.prompt.includes('Tracking reference '+f.id+'-1'));
 }
});

test('v3 character requests and alignment use the teal artwork; existing versions keep cream outfits',async()=>{
 for(const version of [1,2,3])for(const slot of ['groom','bride','couple']){
  const f=fixture({slot,status:'queued',provider_id:null,attempts:0,prompt_revision:characterPromptRevision(version),reference_data:[]},version);
  const photo=await sharp({create:{width:16,height:24,channels:4,background:'blue'}}).png().toBuffer();
  f.reference(photo,slot==='couple'?'groom':'single');if(slot==='couple')f.reference(photo,'bride');
  let sent,aligned;const expected=await readFile('public/assets/video-masters/temple-v1/'+(version===3?'style-v3/':'')+(slot==='couple'?'closing':slot)+'.png');
  await f.service({provider:{create:async input=>{sent=input;return {id:'sample',status:'succeeded',output:'https://replicate.delivery/sample.png'};},output:async()=>photo},align:async(bytes,reference)=>{aligned=reference;return {bytes,alignment:{verified:true}};}}).process(f.id);
  assert.equal(f.row.status,'review');assert.deepEqual(Buffer.from(sent.input_images[1].split(',')[1],'base64'),expected);assert.deepEqual(aligned,expected);assert.equal(sent.aspect_ratio,'2:3');
  if(version===3){assert.match(sent.prompt,/peacock-teal/);assert.doesNotMatch(sent.prompt,/cream silk (shirt|saree)|pink blouse/);}else assert.match(sent.prompt,/cream silk/);
 }
});

test('new couple requests combine groom left and bride right as one identity picture, without changing the artwork',async()=>{
 const f=fixture({slot:'couple',status:'queued',provider_id:null,attempts:0,prompt_revision:CHARACTER_PROMPT_REVISION,reference_data:[]});
 for(const [identity,background]of [['groom','red'],['bride','blue']])f.reference(await sharp({create:{width:72,height:128,channels:4,background}}).png().toBuffer(),identity);
 let sent;await f.service({provider:{create:async input=>{sent=input;return {id:'new-couple',status:'processing'};}}}).process(f.id);
 assert.equal(f.row.status,'processing');assert.equal(sent.input_images.length,2);const combined=Buffer.from(sent.input_images[0].split(',')[1],'base64'),{data,info}=await sharp(combined).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1440);assert.equal(info.height,1280);
 const pixel=x=>[...data.subarray((640*info.width+x)*4,(640*info.width+x)*4+4)];assert.deepEqual(pixel(360),[255,0,0,255]);assert.deepEqual(pixel(1080),[0,0,255,255]);
 assert.deepEqual(Buffer.from(sent.input_images[1].split(',')[1],'base64'),await readFile('public/assets/video-masters/temple-v1/closing.png'));assert.match(sent.prompt,/approved groom on the left and approved bride on the right/);assert.equal(sent.aspect_ratio,'2:3');
});

test('repeated provider outages have a deadline; retries resume the known prediction without another charge',async()=>{
 const f=fixture();let creates=0;const provider={get:async()=>{throw Object.assign(Error('Unavailable'),{providerStatus:503});},create:async()=>creates++};
 const service=f.service({provider}),started=f.row.updated_at;
 f.advance(CHARACTER_STALL_MS-1000);await service.process(f.id);
 assert.equal(f.row.status,'processing');assert.equal(f.row.updated_at,started);assert.equal(f.row.lease_until,null);
 f.advance(1001);await service.process(f.id);assert.equal(f.row.status,'failed');assert.equal(f.row.provider_id,'existing-prediction');
 await service.retry(f.owner,f.id);assert.equal(f.row.status,'processing');assert.equal(f.row.attempts,1);assert.notEqual(f.row.updated_at,started);assert.equal(creates,0);
});

test('a provider that keeps reporting processing cannot spin forever',async()=>{
 const f=fixture(),service=f.service({provider:{get:async()=>({status:'processing',output:null})}});
 f.advance(CHARACTER_STALL_MS+1);await service.process(f.id);assert.equal(f.row.status,'failed');assert.match(f.row.error,/taking too long/);
});

test('ready sync output is persisted immediately even before the provider marks it succeeded',async()=>{
 const f=fixture({status:'queued',provider_id:null,attempts:0});let downloaded=0;
 const service=f.service({provider:{create:async()=>({id:'new-prediction',status:'processing',output:['https://replicate.delivery/result.png']}),get:async()=>{throw Error('Must use the returned output');},output:async()=>{downloaded++;return Buffer.from('saved image');}}});
 await service.process(f.id);assert.equal(f.row.status,'review');assert.equal(downloaded,1);assert.ok(f.files.has(f.row.raw_key));
 const stored=f.media.get('media/'+f.id+'.json');assert.equal(stored.durable,true);assert.equal(stored.expiresAt,null);assert.ok(stored.key.startsWith('persistent/'));assert.equal(stored.owner,f.owner);assert.ok(f.files.has(stored.key));
 const prediction=[...f.media.entries()].find(([key])=>key.endsWith('/prediction-1.json'))?.[1];assert.equal(prediction.id,'new-prediction');assert.equal(prediction.output,'https://replicate.delivery/result.png');assert.equal(prediction.input,undefined);
});

test('saved raw output can finish after Replicate expires, without contacting the provider',async()=>{
 const f=fixture({status:'preparing',raw_key:'persistent/saved.png',attempts:3});f.files.set(f.row.raw_key,Buffer.from('saved image'));
 const service=f.service({provider:{get:async()=>{throw Error('Expired provider must not be contacted');}}});
 await service.process(f.id);assert.equal(f.row.status,'review');assert.equal(f.row.attempts,3);
});

test('a job submits the shared likeness prompt recorded in its revision',async()=>{
 const f=fixture({status:'queued',provider_id:null,attempts:0,prompt_revision:CHARACTER_PROMPT_CANDIDATE});let prompt;
 const service=f.service({provider:{create:async input=>{prompt=input.prompt;return {id:'candidate-prediction',status:'processing',output:null};}}});
 await service.process(f.id);assert.equal(f.row.provider_id,'candidate-prediction');assert.match(prompt,/Preserve the exact face details and face shape/);assert.doesNotMatch(prompt,/large expressive head/);
});

test('a preparation failure retains raw bytes and retry never regenerates them',async()=>{
 const f=fixture({status:'preparing',raw_key:'persistent/saved.png',attempts:3});f.files.set(f.row.raw_key,Buffer.from('saved image'));
 let fail=true;const service=f.service({provider:{get:async()=>{throw Error('Must use saved image');}},align:async bytes=>{if(fail)throw Error('Temporary preparation failure');return {bytes,alignment:{}};}});
 await service.process(f.id);assert.equal(f.row.status,'failed');assert.equal(f.row.raw_key,'persistent/saved.png');assert.equal(f.row.provider_id,'existing-prediction');
 fail=false;await service.retry(f.owner,f.id);assert.equal(f.row.status,'preparing');await service.process(f.id);assert.equal(f.row.status,'review');assert.equal(f.row.attempts,3);
});

test('Replicate creation requests sync output and retains the authenticated callback',async t=>{
 let options; t.mock.method(globalThis,'fetch',async(_url,value)=>{options=value;return new Response(JSON.stringify({id:'prediction',status:'processing'}),{status:201});});
 await replicateProvider({REPLICATE_API_TOKEN:'test-only'}).create({prompt:'test'},'https://findmyinvite.com/api/video-characters?action=callback&id=test');
 assert.equal(options.headers.Prefer,'wait=60');const body=JSON.parse(options.body);assert.deepEqual(body.webhook_events_filter,['completed']);assert.match(body.webhook,/action=callback/);
});

test('an unconfirmed submission cannot be regenerated just because status lookup failed',async()=>{
 const f=fixture({status:'submitting',provider_id:null});f.advance(CHARACTER_STALL_MS+1);
 const service=f.service({provider:{recent:async()=>{throw Object.assign(Error('Unavailable'),{providerStatus:503});}}});
 await service.process(f.id);assert.equal(f.row.status,'failed');await assert.rejects(service.retry(f.owner,f.id),/Contact support/);assert.equal(f.row.attempts,1);
});

test('authenticated prediction output can use the observed signed gateway bucket, while unrelated hosts stay blocked',async t=>{
 const host='ai-gateway-outputs.0d37909e38d3e99c29fa2cd343ac421a.r2.cloudflarestorage.com';let fetched=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{fetched++;assert.equal(new URL(url).hostname,host);assert.equal(options.redirect,'error');assert.equal(options.headers,undefined);return new Response(Buffer.from('image bytes'));});
 const provider=replicateProvider();assert.equal((await provider.output('https://'+host+'/provider-outputs/prediction/result.png?signature=private')).toString(),'image bytes');
 for(const url of ['https://other.r2.cloudflarestorage.com/provider-outputs/image.png','https://'+host+'.evil.test/provider-outputs/image.png','https://'+host+'/other/image.png','http://'+host+'/provider-outputs/image.png','https://user:password@'+host+'/provider-outputs/image.png','https://'+host+':444/provider-outputs/image.png'])await assert.rejects(provider.output(url),/Unrecognized/);
 assert.equal(fetched,1);
});
