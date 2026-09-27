import test from 'node:test';
import assert from 'node:assert/strict';
import {createSegmentedWorkflow} from '../server/assembly-segmented-workflow.mjs';
import {SEGMENTED_VERSION} from '../server/assembly-story-session.mjs';

const names={groomName:'Arun',brideName:'Monica',revision:'name-1'};
const asset=(id)=>({id,blobUrl:'https://blob.example/'+id,url:'https://findmyinvite.com/api/face-swap/file.jpg?url='+id,sha256:'sha-'+id,contentType:'image/jpeg',source:'test',revision:'rev-'+id});
function board(){
 const scenes=Array.from({length:5},(_,i)=>({
  index:i+1,scene:'Scene '+(i+1),firstBrief:'first '+i,lastBrief:'last '+i,titleText:'',prompt:'move '+i,
  first:asset('f'+i),last:asset('l'+i)
 }));
 return {
  version:SEGMENTED_VERSION,direction:'five-clips-v1',revealType:'custom',scenes,
  sheetUrl:'https://findmyinvite.com/api/face-swap/file.jpg?url=sheet',
  firstImageUrl:scenes[0].first.url,lastImageUrl:scenes[4].last.url,
  firstBrief:scenes[0].firstBrief,lastBrief:scenes[4].lastBrief,middleBeats:['a','b','c'],
  continuity:'same set',locked:false,revisionPending:false,namesRevision:names.revision
 };
}

function harness(latest){
 const state={value:{version:SEGMENTED_VERSION,names,pinUrl:'https://pin.it/x',board:board()},etag:'1'};
 const tools={
  save_invite_details:{execute:async i=>({ok:true,details:i,complete:true})},
  lock_theme_pin:{execute:async i=>({ok:true,pinUrl:i.pinUrl})},
  lock_storyboard:{execute:async i=>({ok:true,...i})},
  lock_final_image:{execute:async i=>({ok:true,locked:true,heroImageUrl:i.imageUrl,brideImageUrl:i.brideImageUrl,groomImageUrl:i.groomImageUrl,stage:'details'})},
  start_template1:{execute:async i=>({ok:true,jobId:'job-1',...i})},
  set_sell_stage:{execute:async i=>({ok:true,stage:i.stage})},
  craft_storyboard_stills:{execute:async()=>({ok:true})},
  flare_edit:{execute:async i=>({ok:true,...i})}
 };
 const loadStory=async()=>({value:state.value,etag:state.etag});
 const saveStory=async(_k,record)=>{state.value=record.value;return record.value;};
 return {
  state,
  tools:createSegmentedWorkflow(tools,{
   sessionKey:'assembly-stories/test/chat/state.json',
   messages:[{role:'user',content:latest}],
   env:{},
   loadStory,
   saveStory
  })
 };
}

test('Approve chip persists durable approval even when board was unlocked',async()=>{
 const {tools,state}=harness('Approve storyboard\nsheetUrl: https://findmyinvite.com/api/face-swap/file.jpg?url=sheet\nApprove these exact ten endpoint images and five local 0–3-second motion prompts. Do not redraw or extract panels.');
 const result=await tools.lock_storyboard.execute({sheetUrl:state.value.board.sheetUrl});
 assert.equal(result.ok,true);
 assert.equal(state.value.board.locked,true);
 assert.ok(state.value.approval?.approvalRevision);
 assert.equal(state.value.approval.names.revision,names.revision);
});

test('Generate confirmed auto-approves complete endpoints and starts Template 1',async()=>{
 const {tools,state}=harness('Generate confirmed. Start Template 1 now with start_template1.\nbrideImageUrl: https://cdn.example/b.jpg\ngroomImageUrl: https://cdn.example/g.jpg');
 const result=await tools.start_template1.execute({
  displayName:'Demo',
  heroImageUrl:state.value.board.lastImageUrl,
  brideImageUrl:'https://cdn.example/b.jpg',
  groomImageUrl:'https://cdn.example/g.jpg'
 });
 assert.equal(result.ok,true);
 assert.equal(state.value.board.locked,true);
 assert.equal(result.heroImageUrl,state.value.board.lastImageUrl);
 assert.equal(result.brideImageUrl,'https://cdn.example/b.jpg');
});

test('Locking the original pin keeps painted Last instead of identity refresh',async()=>{
 const pin='https://i.pinimg.com/736x/56/d6/90/56d69062297e4269208aa06f661f8c3e.jpg';
 const {tools,state}=harness('Lock this final image: '+pin+'\nbrideImageUrl: https://cdn.example/b.jpg\ngroomImageUrl: https://cdn.example/g.jpg\ncoupleImageUrl: '+pin);
 state.value.pinUrl=pin;
 const last=state.value.board.lastImageUrl;
 const result=await tools.lock_final_image.execute({
  imageUrl:pin,
  brideImageUrl:'https://cdn.example/b.jpg',
  groomImageUrl:'https://cdn.example/g.jpg'
 });
 assert.equal(result.ok,true);
 assert.equal(result.heroImageUrl,last);
 assert.equal(state.value.board.locked,true);
 assert.equal(result.stage,'details');
});
