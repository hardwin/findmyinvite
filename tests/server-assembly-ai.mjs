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
});

test('generate-status 404 for unknown job',async()=>{
 const res=await request('/api/assembly?action=generate-status&jobId=does-not-exist');
 assert.equal(res.statusCode,404);
});
