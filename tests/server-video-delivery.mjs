import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {deliveryLink,deliveryResult,deliverVideo} from '../server/video-delivery.mjs';
import {videoActor} from '../server/video-assistance.mjs';

const key='fixture-delivery-secret-'.repeat(3),owner=randomUUID(),id='a'.repeat(64),attempt=randomUUID(),invitation=randomUUID();
const record={id,owner,attempt,status:'ready',resultKey:`results/${owner}/${id}/${attempt}.mp4`};
test('a copied link resolves only its original immutable MP4 and survives a new render attempt',()=>{
 const token=deliveryLink(record,key).path.split('#')[1];
 assert.equal(deliveryResult(token,key),record.resultKey);
 const next=randomUUID(),newRecord={...record,attempt:next,resultKey:`results/${owner}/${id}/${next}.mp4`};
 assert.notEqual(deliveryLink(newRecord,key).path,deliveryLink(record,key).path);
 assert.throws(()=>deliveryResult(token.slice(0,-2)+'!!',key),{status:410});
 assert.throws(()=>deliveryResult(token,'another signing key'.repeat(4)),{status:410});
 assert.throws(()=>deliveryLink({...record,resultKey:'media/private'},key),{status:409});
});
test('customer link downloads exact bytes without a login and expires when the object disappears',async()=>{
 const old=process.env.RATE_LIMIT_SECRET;process.env.RATE_LIMIT_SECRET=key;
 try{
  const token=deliveryLink(record).path.split('#')[1],bytes=Buffer.from('original MP4');
  let body;const response={setHeader(){},end(value){body=value;}};
  await deliverVideo({},response,{local:true,bytes:async path=>{assert.equal(path,record.resultKey);return bytes;}},'delivery-file',token);assert.deepEqual(body,bytes);
  await assert.rejects(deliverVideo({},response,{local:true,bytes:async()=>{throw Object.assign(Error(),{code:'ENOENT'});}},'delivery-check',token),{status:410});
 }finally{if(old===undefined)delete process.env.RATE_LIMIT_SECRET;else process.env.RATE_LIMIT_SECRET=old;}
});
test('assisted editing resolves the owner from the order and records scoped work',async()=>{
 const seen=[],order={id:invitation,owner_id:owner,template_id:'film-anbil-avan-v1',status:'captured'};
 const deps={authorize:async()=>({actorId:'support'}),query:async()=>[order],record:async(...a)=>seen.push(a),store:{read:async()=>({value:{owner,invitationId:invitation}})}};
 const req={headers:{'x-fmi-assist':invitation},method:'POST',url:'/api/drafts?action=save',body:{id:invitation,templateId:order.template_id,kind:'video'}};
 assert.equal((await videoActor(req,'drafts','save',deps)).id,owner);assert.deepEqual(seen,[['support','video.assist.save',invitation]]);
 await assert.rejects(videoActor({...req,body:{...req.body,id:randomUUID()}},'drafts','save',deps),{status:403});
 await assert.rejects(videoActor(req,'drafts','delete',deps),{status:403});
 await assert.rejects(videoActor(req,'video','payment-order',deps),{status:403});
 await assert.rejects(videoActor(req,'drafts','save',{...deps,authorize:async()=>{throw Object.assign(Error(),{status:401});}}),{status:401});
});
