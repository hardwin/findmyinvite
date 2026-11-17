import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {characterService,CHARACTER_STALL_MS} from '../server/video-characters.mjs';
import {replicateProvider,CHARACTER_PROMPT_CANDIDATE} from '../server/video-character-provider.mjs';

function fixture(overrides={}){
 let now=Date.parse('2026-11-17T13:00:00Z');
 const owner=randomUUID(),invitation=randomUUID(),id=randomUUID();
 let row={id,owner_id:owner,invitation_id:invitation,slot:'groom',status:'processing',attempts:1,provider_id:'existing-prediction',raw_key:null,reference_data:[],created_at:new Date(now).toISOString(),updated_at:new Date(now).toISOString(),...overrides};
 const files=new Map(),media=new Map();
 const query=async(path,options)=>{
  if(path.startsWith('personalization_drafts'))return [{id:invitation,owner_id:owner}];
  assert.ok(path.startsWith('video_character_jobs?'));
  if(options?.method==='PATCH')row={...row,...options.body};
  return [{...row}];
 };
 const store={bytes:async key=>{if(!files.has(key))throw Error('Missing saved image');return files.get(key);},putBytes:async(key,bytes)=>files.set(key,bytes),save:async(key,value)=>media.set(key,value)};
 return {id,owner,files,media,get row(){return row;},advance:ms=>now+=ms,service:options=>characterService({query,store,clock:()=>now,align:async bytes=>({bytes,alignment:{verified:true}}),...options})};
}

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
