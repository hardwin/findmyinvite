import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parsePromptSections,
 buildOpeningPrompt,
 stagePercent,
 stageLabel,
 MAIN_PROMPT_MAX,
 NEGATIVE_PROMPT_MAX,
 HERO_LOOP_PROMPT,
 CINEMATIC_PROMPT_WRITER
} from '../server/assembly-ai.mjs';
import handler from '../api/assembly.mjs';
import {issueSession} from '../server/akay-gate.mjs';

function cookie(){return 'fmi_akay='+issueSession();}

function mockRes(){
 const res={statusCode:200,headers:{},body:null};
 res.status=code=>{res.statusCode=code;return res;};
 res.setHeader=(k,v)=>{res.headers[k]=v;};
 res.json=value=>{res.body=value;return res;};
 return res;
}

async function request(url,opts={}){
 const req={
  method:opts.method||'GET',
  url,
  headers:{cookie:opts.cookie===undefined?cookie():opts.cookie,...(opts.headers||{})},
  body:opts.body
 };
 const res=mockRes();
 await handler(req,res);
 return res;
}

test('parsePromptSections extracts MAIN and NEGATIVE with caps',()=>{
 const raw=`MAIN PROMPT:
${'A'.repeat(MAIN_PROMPT_MAX+40)}

NEGATIVE PROMPT:
${'B'.repeat(NEGATIVE_PROMPT_MAX+20)}`;
 const parsed=parsePromptSections(raw);
 assert.equal(parsed.main.length,MAIN_PROMPT_MAX);
 assert.equal(parsed.negative.length,NEGATIVE_PROMPT_MAX);
 assert.match(parsed.main,/^A+$/);
 assert.match(parsed.negative,/^B+$/);
});

test('parsePromptSections rejects empty and missing main',()=>{
 assert.throws(()=>parsePromptSections(''),/empty/i);
 assert.throws(()=>parsePromptSections('NEGATIVE PROMPT:\nonly bad'),/MAIN PROMPT/i);
});

test('buildOpeningPrompt folds Avoid suffix for Grok',()=>{
 const out=buildOpeningPrompt('Steady forward push.','extra text, identity drift');
 assert.match(out,/Steady forward push/);
 assert.match(out,/Avoid: extra text, identity drift/);
 assert.equal(buildOpeningPrompt('Only main.',''),'Only main.');
});

test('stage map covers generate pipeline',()=>{
 assert.equal(stagePercent('queued'),0);
 assert.ok(stagePercent('writing_prompt')>stagePercent('fetching_image'));
 assert.ok(stagePercent('generating_hero')>stagePercent('generating_opening'));
 assert.equal(stagePercent('done'),100);
 assert.match(stageLabel('generating_opening'),/opening/i);
 assert.match(HERO_LOOP_PROMPT,/static camera/i);
 assert.match(CINEMATIC_PROMPT_WRITER,/FINAL-FRAME/i);
});

test('generate-pair requires session and imageUrl',async()=>{
 const denied=await request('/api/assembly?action=generate-pair',{
  method:'POST',
  cookie:'',
  body:JSON.stringify({imageUrl:'https://example.com/a.jpg'}),
  headers:{'Content-Type':'application/json'}
 });
 assert.equal(denied.statusCode,401);

 const missing=await request('/api/assembly?action=generate-pair',{
  method:'POST',
  body:JSON.stringify({}),
  headers:{'Content-Type':'application/json'}
 });
 assert.equal(missing.statusCode,400);
});

test('sniff and public CDN URL prefer pinimg jpeg',async()=>{
 const {sniffImageFormat,preferPublicImageUrl,normalizeReferenceImage}=await import('../server/assembly-ai.mjs');
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46]);
 assert.equal(sniffImageFormat(jpeg).ext,'.jpg');
 const image=normalizeReferenceImage({
  buffer:jpeg,
  contentType:'application/octet-stream',
  ext:'.bin',
  sourceUrl:'https://i.pinimg.com/736x/ab/cd/ef/abcd.jpg'
 });
 assert.equal(image.ext,'.jpg');
 assert.equal(preferPublicImageUrl(image),'https://i.pinimg.com/736x/ab/cd/ef/abcd.jpg');
 assert.equal(preferPublicImageUrl({sourceUrl:'https://www.pinterest.com/pin/123/'}), '');
 // Face-swap proxy ends with …jpg in the query — must NOT be treated as a public image URL.
 const proxy='https://findmyinvite.com/api/face-swap?action=file&url='+encodeURIComponent(
  'https://0p000etsgn9iq7q1.private.blob.vercel-storage.com/face-swap/preview/abc/couple-1.jpg'
 );
 assert.equal(preferPublicImageUrl({sourceUrl:proxy}),'');
 assert.equal(preferPublicImageUrl({
  sourceUrl:'https://0p000etsgn9iq7q1.private.blob.vercel-storage.com/face-swap/preview/abc/couple-1.jpg'
 }),'');
 assert.equal(preferPublicImageUrl({
  sourceUrl:'https://public.blob.vercel-storage.com/face-swap/couple-1.jpg'
 }),'https://public.blob.vercel-storage.com/face-swap/couple-1.jpg');
});

test('generate-status 404 for unknown job',async()=>{
 const res=await request('/api/assembly?action=generate-status&jobId=does-not-exist');
 assert.equal(res.statusCode,404);
});

test('lastFrameFromImage prefers public pinimg URL then data URI',async()=>{
 const {lastFrameFromImage,normalizeReferenceImage}=await import('../server/assembly-ai.mjs');
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46]);
 const publicFrame=lastFrameFromImage(normalizeReferenceImage({
  buffer:jpeg,
  contentType:'image/jpeg',
  ext:'.jpg',
  sourceUrl:'https://i.pinimg.com/736x/ab/cd/ef/abcd.jpg'
 }));
 assert.deepEqual(publicFrame,{url:'https://i.pinimg.com/736x/ab/cd/ef/abcd.jpg'});
 const dataFrame=lastFrameFromImage({
  buffer:jpeg,
  contentType:'image/jpeg',
  ext:'.jpg',
  sourceUrl:'https://www.pinterest.com/pin/123/'
 });
 assert.match(dataFrame.url,/^data:image\/jpeg;base64,/);
});

test('startGeneratePair requires XAI_API_KEY for opening last_frame',async()=>{
 const {startGeneratePair}=await import('../server/assembly-ai.mjs');
 assert.throws(
  ()=>startGeneratePair({
   imageUrl:'https://example.com/a.jpg',
   env:{OPENAI_API_KEY:'k',REPLICATE_API_TOKEN:'r',ASSEMBLY_FS:'1'}
  }),
  /XAI_API_KEY/
 );
 assert.throws(
  ()=>startGeneratePair({
   imageUrl:'https://example.com/a.jpg',
   env:{OPENAI_API_KEY:'k',XAI_API_KEY:'x',ASSEMBLY_FS:'1'}
  }),
  /REPLICATE_API_TOKEN/
 );
});

test('runXaiImagineVideo posts last_frame and polls until done',async()=>{
 const {runXaiImagineVideo,XAI_VIDEO_GENERATIONS,XAI_VIDEO_MODEL}=await import('../server/assembly-ai.mjs');
 const calls=[];
 let polls=0;
 const mp4=Buffer.from('fake-mp4');
 const fetchImpl=async(url,opts={})=>{
  calls.push({url,method:opts.method||'GET',body:opts.body,headers:opts.headers});
  if(url===XAI_VIDEO_GENERATIONS){
   const body=JSON.parse(opts.body);
   assert.equal(body.model,XAI_VIDEO_MODEL);
   assert.deepEqual(body.last_frame,{url:'https://i.pinimg.com/last.jpg'});
   assert.equal(body.duration,10);
   assert.equal(body.aspect_ratio,'9:16');
   assert.equal(body.resolution,'720p');
   assert.equal(body.image,undefined);
   assert.match(body.prompt,/gates open/i);
   assert.match(String(opts.headers.Authorization||''),/^Bearer xai-test$/);
   return {ok:true,status:200,json:async()=>({request_id:'req-open-1'})};
  }
  if(url==='https://api.x.ai/v1/videos/req-open-1'){
   polls+=1;
   if(polls===1)return {ok:true,status:200,json:async()=>({status:'pending',progress:40})};
   return {ok:true,status:200,json:async()=>({status:'done',video:{url:'https://vidgen.x.ai/out.mp4'}})};
  }
  if(url==='https://vidgen.x.ai/out.mp4'){
   return {ok:true,status:200,arrayBuffer:async()=>mp4};
  }
  throw new Error('unexpected fetch '+url);
 };
 const result=await runXaiImagineVideo({
  lastFrameUrl:'https://i.pinimg.com/last.jpg',
  prompt:'Closed gates open toward the final pin frame.',
  duration:10,
  env:{XAI_API_KEY:'xai-test'},
  fetchImpl,
  sleepImpl:async()=>{}
 });
 assert.equal(result.requestId,'req-open-1');
 assert.equal(result.url,'https://vidgen.x.ai/out.mp4');
 assert.equal(Buffer.compare(result.buffer,mp4),0);
 assert.equal(polls,2);
 assert.equal(calls[0].url,XAI_VIDEO_GENERATIONS);
 assert.equal(calls[0].method,'POST');
});

test('runXaiImagineVideo fails on expired and failed statuses',async()=>{
 const {runXaiImagineVideo}=await import('../server/assembly-ai.mjs');
 const expiredFetch=async(url)=>{
  if(url.includes('/generations'))return {ok:true,status:200,json:async()=>({request_id:'r1'})};
  return {ok:true,status:200,json:async()=>({status:'expired'})};
 };
 await assert.rejects(
  ()=>runXaiImagineVideo({
   lastFrame:{url:'https://i.pinimg.com/last.jpg'},
   prompt:'x',
   env:{XAI_API_KEY:'k'},
   fetchImpl:expiredFetch,
   sleepImpl:async()=>{}
  }),
  /expired/i
 );
 const failedFetch=async(url)=>{
  if(url.includes('/generations'))return {ok:true,status:200,json:async()=>({request_id:'r2'})};
  return {ok:true,status:200,json:async()=>({status:'failed',error:{message:'engine down'}})};
 };
 await assert.rejects(
  ()=>runXaiImagineVideo({
   lastFrame:{url:'https://i.pinimg.com/last.jpg'},
   prompt:'x',
   env:{XAI_API_KEY:'k'},
   fetchImpl:failedFetch,
   sleepImpl:async()=>{}
  }),
  /engine down/
 );
});

test('resolveXaiLastFrame uses Files API when the buffer is too large for a data URI',async()=>{
 const {resolveXaiLastFrame}=await import('../server/assembly-ai.mjs');
 const jpegHead=Buffer.from([0xff,0xd8,0xff,0xe0]);
 const huge=Buffer.concat([jpegHead,Buffer.alloc(4*1024*1024+16,0x11)]);
 const fetchImpl=async(url,opts={})=>{
  assert.equal(url,'https://api.x.ai/v1/files');
  assert.equal(opts.method,'POST');
  assert.match(String(opts.headers.Authorization||''),/^Bearer xai-test$/);
  assert.ok(opts.body instanceof FormData);
  return {ok:true,status:200,json:async()=>({id:'file_abc'})};
 };
 const frame=await resolveXaiLastFrame({
  buffer:huge,
  contentType:'image/jpeg',
  ext:'.jpg',
  sourceUrl:'https://www.pinterest.com/pin/no-direct/'
 },{env:{XAI_API_KEY:'xai-test'},fetchImpl});
 assert.deepEqual(frame,{file_id:'file_abc'});
});
