import test from 'node:test';import assert from 'node:assert/strict';
import {downloadPrivateFile} from '../src/video/private-download.mjs';
const getToken=async()=> 'fixture';
const chunk=(text,range)=>new Response(text,{status:206,headers:{'Content-Range':range,'Content-Type':'video/mp4'}});
test('an interrupted range is retried without repeating successful download chunks',async()=>{const ranges=[];let calls=0;const blob=await downloadPrivateFile('/private',{getToken,fetcher:async(_url,options)=>{ranges.push(options.headers.Range);calls++;if(calls===1)return chunk('abc','bytes 0-2/6');if(calls===2)throw new TypeError('Network error');return chunk('def','bytes 3-5/6');}});assert.equal(await blob.text(),'abcdef');assert.equal(ranges[1],ranges[2]);assert.notEqual(ranges[0],ranges[1]);assert.equal(blob.type,'video/mp4');});
test('expired or unauthorized downloads do not retry or expose technical errors',async()=>{let calls=0;await assert.rejects(downloadPrivateFile('/private',{getToken,fetcher:async()=>{calls++;return new Response('',{status:403});}}),/sign in/);assert.equal(calls,1);});
test('repeated interruptions release the action with an actionable error',async()=>{let calls=0;await assert.rejects(downloadPrivateFile('/private',{getToken,fetcher:async()=>{calls++;throw new DOMException('The user aborted a request.','AbortError');}}),/^Error: Your download was interrupted\. Please try again\.$/);assert.equal(calls,2);});
test('a changed file length or invalid byte range cannot create a corrupted download',async()=>{let calls=0;await assert.rejects(downloadPrivateFile('/private',{getToken,fetcher:async()=>++calls===1?chunk('abc','bytes 0-2/6'):chunk('def','bytes 3-5/7')}),/incomplete/);});
test('parallel ranges finish in order and report live monotonic byte progress through retry',async()=>{
 const input='abcdefghijklmnopqr',progress=[],calls=new Map();let active=0,maxActive=0;
 const blob=await downloadPrivateFile('/private',{getToken,chunkSize:3,onProgress:p=>progress.push(p),fetcher:async(_url,o)=>{
  const [,s,e]=/bytes=(\d+)-(\d+)/.exec(o.headers.Range),start=+s,end=Math.min(+e,input.length-1);calls.set(start,(calls.get(start)||0)+1);
  if(start===6&&calls.get(start)===1)throw Error('Connection lost');active++;maxActive=Math.max(maxActive,active);
  const stream=new ReadableStream({async start(controller){for(let i=start;i<=end;i++){await new Promise(r=>setTimeout(r,20));controller.enqueue(new TextEncoder().encode(input[i]));}active--;controller.close();}});
  return new Response(stream,{status:206,headers:{'Content-Range':`bytes ${start}-${end}/${input.length}`,'Content-Type':'video/mp4'}});
 }});
 assert.equal(await blob.text(),input);assert.ok(maxActive>1&&maxActive<=3);assert.equal(calls.get(0),1);assert.equal(calls.get(6),2);
 assert.ok(progress.some(p=>p.percent>0&&p.percent<100));assert.equal(progress.at(-1).percent,100);
 for(let i=1;i<progress.length;i++)assert.ok(progress[i].loaded>=progress[i-1].loaded);
});
