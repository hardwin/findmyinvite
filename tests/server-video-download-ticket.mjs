import test from 'node:test';import assert from 'node:assert/strict';
import {videoDownloadTicket} from '../server/video-download-ticket.mjs';
test('download grants are restricted to one result, GET only, and fifteen minutes',async()=>{
 const pathname='video-personalise/results/11111111-1111-4111-8111-111111111111/'+'a'.repeat(64)+'/22222222-2222-4222-8222-222222222222.mp4';
 const token={clientSigningToken:'private',delegationToken:'private'};
 const result=await videoDownloadTicket(pathname,{now:1000,issue:async options=>{assert.deepEqual(options,{pathname,operations:['get'],validUntil:901000});return token;},sign:async(given,options)=>{assert.equal(given,token);assert.deepEqual(options,{operation:'get',pathname,access:'private',validUntil:901000});return {presignedUrl:'signed'};}});
 assert.deepEqual(result,{url:'signed',expiresAt:901000});
 await assert.rejects(videoDownloadTicket('*'),/Invalid/);await assert.rejects(videoDownloadTicket('video-personalise/jobs/a.json'),/Invalid/);
});
