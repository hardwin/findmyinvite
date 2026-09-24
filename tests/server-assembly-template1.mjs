import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
 buildPrompts,
 BASE_PROMPTS,
 DEFAULT_PARAMS,
 DEFAULT_STYLE_CARD,
 DEFAULT_PROMPT_MODEL,
 DOOR_STILL_PREFIX,
 OPENING_MOTION_PREFIX,
 OPENING_MOTION_SUFFIX,
 OPENING_SAVE_THE_DATE,
 ensurePromptAffixes,
 softNonIp,
 fillBasePrompts,
 parsePromptWriterJson,
 writeTemplate1PromptsFromPin,
 IMAGE_MODEL,
 STILL_MODEL,
 PLATE_MODEL,
 OPENING_SECONDS
} from '../server/assembly-template1-prompts.mjs';
import {
 createLedger,
 estimateCost,
 runReplicateImage,
 runOpeningVideo,
 runHeroVideo,
 isModerationError,
 ModerationError,
 imageModelForRole,
 buildReplicateImageInput
} from '../server/assembly-template1-gen.mjs';
import {paletteFromPixels,hex} from '../server/assembly-template1-craft.mjs';
import {
 themeCss,
 patchThemeCss,
 patchPreviewDefaults,
 patchMusicTracks,
 patchDataRow,
 patchAppMusicOption
} from '../server/assembly-template1-theme.mjs';
import {validateTemplate1Input,slugify,startTemplate1Job,getTemplate1Job,proceedTemplate1Job,hydrateLiveJob} from '../server/assembly-template1.mjs';
import {listMusicLibrary} from '../server/music-library.mjs';
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
 const req={method:opts.method||'GET',url,headers:{cookie:opts.cookie===undefined?cookie():opts.cookie,...(opts.headers||{})},body:opts.body};
 const res=mockRes();
 await handler(req,res);
 return res;
}

const WIRE={
 last:'Edit this pin into a romantic closing frame: same two people (man in white shirt, woman in magenta dress with purple flower in hair), modern 2D watercolor paper-texture. Facing each other, holding both hands, CLEAR eye contact. Cream handmade paper, magenta and sage washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
 heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. Man white shirt, woman magenta dress + purple flower in hair. CENTER and UPPER ~70% EMPTY cream watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.',
 plate1:'Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment matching romantic garden pin palette. Modern 2D watercolor paper-texture. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
 plate2:'Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Different unique arrangement: delicate magenta–sage watercolor filigree corners, tiny blossom clusters, soft paper-edge pigment drips matching same romantic pin palette. Modern 2D watercolor paper-texture. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
 heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only'
};

test('Template 1 default first still demands a frame-filling fortune door',()=>{
 const p=buildPrompts();
 assert.equal(p.first.startsWith(DOOR_STILL_PREFIX),true);
 assert.match(p.first,/FILL the entire 9:16 frame/);
 assert.match(p.first,/Handle is the MAIN FOCUS/);
 assert.match(p.first,/fortune/);
 assert.equal(p.opening.startsWith(OPENING_MOTION_PREFIX),true);
 assert.equal(p.opening.endsWith(OPENING_MOTION_SUFFIX),true);
 assert.match(p.opening,/FILL the entire frame/);
 assert.match(p.opening,/SAVE THE DATE/);
 assert.ok(p.opening.includes(OPENING_SAVE_THE_DATE));
 for(const key of Object.keys(WIRE))assert.equal(p[key],WIRE[key],key);
 assert.equal(STILL_MODEL,'openai/gpt-image-2');
 assert.equal(PLATE_MODEL,'xai/grok-imagine-image');
 assert.equal(IMAGE_MODEL,STILL_MODEL);
 assert.equal(imageModelForRole('opening-first'),STILL_MODEL);
 assert.equal(imageModelForRole('hero-still'),STILL_MODEL);
 assert.equal(imageModelForRole('plate1'),PLATE_MODEL);
 assert.equal(OPENING_SECONDS,12);
 assert.match(p.lastRegen,/ABSOLUTELY NO TEXT/);
 assert.deepEqual(p.params,DEFAULT_PARAMS);
});

test('BASE prompts keep slots; style-card fill + Astra JSON parse work',()=>{
 assert.equal(BASE_PROMPTS.first.startsWith(DOOR_STILL_PREFIX),true);
 assert.match(BASE_PROMPTS.first,/\{DOOR_MATERIAL\}/);
 assert.match(BASE_PROMPTS.first,/\{DOOR_HANDLE\}/);
 assert.match(BASE_PROMPTS.first,/FILL the entire 9:16 frame/);
 assert.equal(BASE_PROMPTS.opening.startsWith(OPENING_MOTION_PREFIX),true);
 assert.equal(BASE_PROMPTS.opening.endsWith(OPENING_MOTION_SUFFIX),true);
 assert.ok(BASE_PROMPTS.opening.includes(OPENING_SAVE_THE_DATE));
 assert.match(BASE_PROMPTS.opening,/\{WORLD_SETTING\}/);
 assert.match(BASE_PROMPTS.heroVideo,/\{AMBIENT_MOTION\}/);
 const {styleCard,prompts}=fillBasePrompts(DEFAULT_STYLE_CARD);
 assert.equal(styleCard.PALETTE,'magenta + sage washes');
 assert.equal(prompts.first.startsWith(DOOR_STILL_PREFIX),true);
 assert.match(prompts.first,/modern 2D watercolor paper-texture/);
 assert.match(prompts.first,/magenta \+ sage washes/);
 assert.equal(prompts.first.includes('{'),false);
 assert.equal(prompts.opening.startsWith(OPENING_MOTION_PREFIX),true);
 assert.equal(prompts.opening.endsWith(OPENING_MOTION_SUFFIX),true);
 assert.ok(prompts.opening.includes(OPENING_SAVE_THE_DATE));
 assert.match(prompts.heroStill,/delicate magenta–sage watercolor filigree/);
 assert.match(prompts.opening,/romantic garden/);
 const parsed=parsePromptWriterJson(JSON.stringify({
  styleCard:DEFAULT_STYLE_CARD,
  prompts:{
   first:'Edit pin into FIRST FRAME: closed doors. Soft non-IP. 9:16.',
   last:'last',
   lastRegen:'lastRegen',
   heroStill:'heroStill',
   plate1:'plate1',
   plate2:'plate2',
   heroVideo:'heroVideo',
   opening:'opening'
  }
 }));
 assert.equal(parsed.source,'astra');
 assert.equal(parsed.prompts.first,ensurePromptAffixes('first','Edit pin into FIRST FRAME: closed doors. Soft non-IP. 9:16.'));
 assert.equal(parsed.prompts.opening,ensurePromptAffixes('opening','opening'));
 assert.ok(parsed.prompts.opening.includes(OPENING_SAVE_THE_DATE));
 assert.equal(DEFAULT_PROMPT_MODEL,'gpt-6-astra');
});

test('opening wrap injects SAVE THE DATE after the doors open if Astra drops it',()=>{
 const out=ensurePromptAffixes('opening','Vertical 9:16. FIRST: doors FILL the entire frame, hold ~1s → doors open from the handle, glide through garden.');
 assert.ok(out.includes(OPENING_SAVE_THE_DATE));
 assert.match(out,/doors open from the handle, when the door opens show a bullet time/);
 assert.equal(out.startsWith(OPENING_MOTION_PREFIX),true);
 assert.equal(out.endsWith(OPENING_MOTION_SUFFIX),true);
});

test('Astra Light prompt writer reads the pin and returns filled prompts',async()=>{
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,1,2,3]);
 const calls=[];
 const openaiClient={
  responses:{
   create:async(payload)=>{
    calls.push(payload);
    return {output_text:JSON.stringify({
     styleCard:DEFAULT_STYLE_CARD,
     prompts:{
      first:'FIRST filled from pin',
      last:'LAST filled',
      lastRegen:'LAST regen',
      heroStill:'HERO still',
      plate1:'PLATE1',
      plate2:'PLATE2',
      heroVideo:'HERO video',
      opening:'OPENING video'
     }
    })};
   }
  }
 };
 const out=await writeTemplate1PromptsFromPin({
  image:{buffer:jpeg,contentType:'image/jpeg'},
  env:{OPENAI_API_KEY:'sk-test'},
  openaiClient
 });
 assert.equal(out.source,'astra');
 assert.equal(out.prompts.first,ensurePromptAffixes('first','FIRST filled from pin'));
 assert.equal(out.prompts.opening,ensurePromptAffixes('opening','OPENING video'));
 assert.equal(out.styleCard.STYLE_MEDIUM,'modern 2D watercolor paper-texture');
 assert.equal(calls[0].model,'gpt-6-astra');
 assert.equal(calls[0].input[0].content.some(c=>c.type==='input_image'),true);
 assert.match(calls[0].input[0].content.find(c=>c.type==='input_text').text,/BASE templates/);
 const override=await writeTemplate1PromptsFromPin({promptParams:{paletteA:'wine',paletteB:'peacock'},env:{}});
 assert.match(override.first,/wine \+ peacock/);
 assert.equal(override.source,'defaults');
});

test('prompt params substitute and soft non-IP strips franchise words',()=>{
 assert.equal(softNonIp('Spider-Man neon Disney garden, ghibli mood'),'neon garden, mood');
 const p=buildPrompts({paletteA:'wine',paletteB:'peacock',motifA:'Marvel jasmine buds, gold leaf'});
 assert.match(p.first,/wine \+ peacock washes/);
 assert.match(p.plate1,/wine–peacock watercolor filigree, jasmine buds, gold leaf matching/);
 assert.equal(p.plate1.includes('Marvel'),false);
 const ignored=buildPrompts({notAParam:'x',paletteA:''});
 assert.equal(ignored.first,buildPrompts().first);
});

test('spend ledger charges, refuses over budget, and estimates match the packs',()=>{
 assert.equal(estimateCost('still'),0.08);
 assert.equal(estimateCost('opening-first'),0.08);
 assert.equal(estimateCost('plate1'),0.02);
 assert.equal(estimateCost('hero-video'),0.48);
 assert.equal(estimateCost('opening-video'),1.68);
 const ledger=createLedger(4);
 ledger.reserve('opening-first',0.08);
 ledger.charge('opening-first',0.08,{predictionId:'p1'});
 ledger.charge('opening-video',1.7,{ticks:17000000000});
 assert.equal(ledger.used,1.78);
 assert.equal(ledger.remaining,2.22);
 assert.equal(ledger.canAfford(2.22),true);
 assert.equal(ledger.canAfford(2.23),false);
 assert.throws(()=>ledger.reserve('hero-video',3),/Budget stop/);
 assert.equal(ledger.snapshot().entries.length,2);
});

test('runReplicateImage posts Door-First to openai/gpt-image-2 and downloads output',async()=>{
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,1,2,3]);
 const fetchImpl=async(url,opts={})=>{
  if(url==='https://api.replicate.com/v1/models/openai/gpt-image-2/predictions'){
   const body=JSON.parse(opts.body);
   assert.deepEqual(Object.keys(body.input).sort(),['aspect_ratio','input_images','number_of_images','output_format','prompt','quality']);
   assert.equal(body.input.aspect_ratio,'9:16');
   assert.deepEqual(body.input.input_images,['https://i.pinimg.com/originals/x.jpg']);
   assert.equal(body.input.quality,'high');
   return {ok:true,status:201,json:async()=>({id:'pred1',status:'starting'})};
  }
  if(url==='https://api.replicate.com/v1/predictions/pred1')return {ok:true,status:200,json:async()=>({id:'pred1',status:'succeeded',output:'https://replicate.delivery/out.jpg'})};
  if(url==='https://replicate.delivery/out.jpg')return {ok:true,status:200,arrayBuffer:async()=>jpeg};
  throw new Error('unexpected '+url);
 };
 const result=await runReplicateImage({prompt:buildPrompts().first,image:'https://i.pinimg.com/originals/x.jpg',env:{REPLICATE_API_TOKEN:'r8'},fetchImpl,sleepImpl:async()=>{},role:'opening-first'});
 assert.equal(result.predictionId,'pred1');
 assert.equal(result.url,'https://replicate.delivery/out.jpg');
 assert.equal(Buffer.compare(result.buffer,jpeg),0);
 assert.equal(result.costUsd,0.08);
 assert.equal(result.model,'openai/gpt-image-2');
});

test('runReplicateImage keeps section plates on xai/grok-imagine-image',async()=>{
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,1,2,3]);
 const fetchImpl=async(url,opts={})=>{
  if(url==='https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions'){
   const body=JSON.parse(opts.body);
   assert.deepEqual(Object.keys(body.input).sort(),['aspect_ratio','image','prompt']);
   assert.equal(body.input.aspect_ratio,'9:16');
   assert.equal(body.input.image,'https://i.pinimg.com/originals/x.jpg');
   return {ok:true,status:201,json:async()=>({id:'pred-plate',status:'starting'})};
  }
  if(url==='https://api.replicate.com/v1/predictions/pred-plate')return {ok:true,status:200,json:async()=>({id:'pred-plate',status:'succeeded',output:'https://replicate.delivery/plate.jpg'})};
  if(url==='https://replicate.delivery/plate.jpg')return {ok:true,status:200,arrayBuffer:async()=>jpeg};
  throw new Error('unexpected '+url);
 };
 assert.equal(imageModelForRole('plate1'),PLATE_MODEL);
 const result=await runReplicateImage({prompt:'plate bg',image:'https://i.pinimg.com/originals/x.jpg',env:{REPLICATE_API_TOKEN:'r8'},fetchImpl,sleepImpl:async()=>{},role:'plate1'});
 assert.equal(result.predictionId,'pred-plate');
 assert.equal(result.model,'xai/grok-imagine-image');
 assert.equal(result.costUsd,0.02);
});

test('runReplicateImage surfaces provider HTTP detail when create fails',async()=>{
 const fetchImpl=async()=>({
  ok:false,
  status:422,
  json:async()=>({detail:'Invalid input: image could not be downloaded from URL'})
 });
 await assert.rejects(
  ()=>runReplicateImage({prompt:'x',image:'https://i.pinimg.com/a.jpg',env:{REPLICATE_API_TOKEN:'t'},fetchImpl,sleepImpl:async()=>{},role:'opening-first'}),
  err=>/opening-first image generation failed to start:/.test(err.message)&&/HTTP 422/.test(err.message)&&/could not be downloaded/.test(err.message)
 );
});

test('moderation on Replicate or xAI becomes a ModerationError (stop, no retry)',async()=>{
 const modFetch=async(url)=>{
  if(url.endsWith('/predictions'))return {ok:true,status:201,json:async()=>({id:'m1',status:'processing'})};
  return {ok:true,status:200,json:async()=>({id:'m1',status:'failed',error:'Content flagged as sensitive by moderation'})};
 };
 await assert.rejects(()=>runReplicateImage({prompt:'x',image:'https://i.pinimg.com/a.jpg',env:{REPLICATE_API_TOKEN:'t'},fetchImpl:modFetch,sleepImpl:async()=>{}}),err=>err instanceof ModerationError&&err.role==='still');
 await assert.rejects(()=>runHeroVideo({imageUrl:'https://replicate.delivery/h.jpg',prompt:'x',env:{REPLICATE_API_TOKEN:'t'},fetchImpl:async(url)=>{
  if(url.endsWith('/predictions'))return {ok:true,status:201,json:async()=>({id:'v1',status:'failed',error:'NSFW content detected'})};
  throw new Error('unexpected');
 }}),err=>isModerationError(err)&&err.role==='hero-video');
 const xaiFetch=async(url)=>{
  if(url.includes('/generations'))return {ok:true,status:200,json:async()=>({request_id:'r1'})};
  return {ok:true,status:200,json:async()=>({status:'done',video:{url:'',respect_moderation:false}})};
 };
 await assert.rejects(()=>runOpeningVideo({firstDataUrl:'data:image/jpeg;base64,AA==',lastDataUrl:'data:image/jpeg;base64,BB==',prompt:'x',env:{XAI_API_KEY:'k'},fetchImpl:xaiFetch,sleepImpl:async()=>{}}),err=>isModerationError(err)&&err.role==='opening-video');
});

test('runOpeningVideo sends image + last_frame at 12s and reads cost ticks',async()=>{
 const mp4=Buffer.from('mp4');
 let posted=null;
 const fetchImpl=async(url,opts={})=>{
  if(url==='https://api.x.ai/v1/videos/generations'){
   posted=JSON.parse(opts.body);
   return {ok:true,status:200,json:async()=>({request_id:'req-12'})};
  }
  if(url==='https://api.x.ai/v1/videos/req-12')return {ok:true,status:200,json:async()=>({status:'done',video:{url:'https://vidgen.x.ai/o.mp4',respect_moderation:true},usage:{cost_in_usd_ticks:17000000000}})};
  if(url==='https://vidgen.x.ai/o.mp4')return {ok:true,status:200,arrayBuffer:async()=>mp4};
  throw new Error('unexpected '+url);
 };
 const result=await runOpeningVideo({firstDataUrl:'data:image/jpeg;base64,FIRST',lastDataUrl:'data:image/jpeg;base64,LAST',prompt:WIRE.opening,env:{XAI_API_KEY:'k'},fetchImpl,sleepImpl:async()=>{}});
 assert.deepEqual(posted.image,{url:'data:image/jpeg;base64,FIRST'});
 assert.deepEqual(posted.last_frame,{url:'data:image/jpeg;base64,LAST'});
 assert.equal(posted.duration,12);
 assert.equal(posted.resolution,'720p');
 assert.equal(posted.model,'grok-imagine-video-1.5');
 assert.equal(result.costUsd,1.7);
 assert.equal(result.respectModeration,true);
 assert.equal(result.provider,'xai');
});

test('runOpeningVideo surfaces an xAI credit alert and does not fall back to Replicate',async()=>{
 let replicateHit=false;
 const fetchImpl=async(url)=>{
  if(url==='https://api.x.ai/v1/videos/generations'){
   return {ok:false,status:403,json:async()=>({error:'Your team has either used all available credits or reached its monthly spending limit.'})};
  }
  if(String(url).includes('replicate.com')){replicateHit=true;throw new Error('replicate fallback is not allowed');}
  throw new Error('unexpected '+url);
 };
 await assert.rejects(
  ()=>runOpeningVideo({firstDataUrl:'data:image/jpeg;base64,FIRST',lastDataUrl:'data:image/jpeg;base64,LAST',prompt:'x',env:{XAI_API_KEY:'k',REPLICATE_API_TOKEN:'r8'},fetchImpl,sleepImpl:async()=>{}}),
  err=>/out of credits/i.test(err.message)&&err.status===403
 );
 assert.equal(replicateHit,false);
});

test('palette extraction picks a saturated primary, contrasting secondary, and light paper',()=>{
 const px=[];
 const push=(rgb,n)=>{for(let i=0;i<n;i++)px.push(...rgb);};
 push([0x9B,0x21,0x58],400);
 push([0x3F,0x5C,0x55],200);
 push([0xF7,0xF1,0xE8],1000);
 push([0x30,0x20,0x24],60);
 const pal=paletteFromPixels(Buffer.from(px));
 assert.equal(pal.primary,'#9B2158');
 assert.match(pal.secondary,/^#[0-9A-F]{6}$/);
 assert.notEqual(pal.secondary,pal.primary);
 assert.match(pal.cream,/^#F/);
 assert.equal(hex([155,33,88]),'#9B2158');
 const fallback=paletteFromPixels(Buffer.from([0xF7,0xF1,0xE8]));
 assert.equal(fallback.primary,'#9B2158');
 assert.equal(fallback.secondary,'#3F5C55');
});

test('themeCss keeps standing placement rules and patchers are idempotent',async()=>{
 const css=themeCss('royal-heritage-99',{primary:'#9B2158',secondary:'#3F5C55',cream:'#F7F1E8'},{displayName:'Test'});
 assert.match(css,/\.invitation-page\.theme-royal-heritage-99 \.couple-overlay\{[^}]*padding:4svh 13% 50svh 13%/);
 assert.match(css,/--t1-scrim:linear-gradient\(180deg,rgba\(0,0,0,\.08\) 0%,rgba\(0,0,0,0\) 10%/);
 assert.match(css,/\.invite-cluster\{[^}]*royal-heritage-99-section-4\.jpg/);
 assert.match(css,/\.invite-cluster \.invite-section\{[^}]*padding:40px max\(28px,12%\)/);
 assert.match(css,/\.invite-welcome\{[^}]*background-image:none/);
 assert.equal(/invite-credit\{[^}]*section-/.test(css),false);
 const source=await readFile(new URL('../src/invitation3.css',import.meta.url),'utf8');
 const once=patchThemeCss(source,'royal-heritage-99',{});
 assert.equal(patchThemeCss(once,'royal-heritage-99',{}),once);
 assert.equal(once.includes('.invitation-page.theme-royal-heritage-7{'),false);

 const inv=await readFile(new URL('../src/Invitation.tsx',import.meta.url),'utf8');
 const inv1=patchPreviewDefaults(inv,'royal-heritage-99',{groom:'Ashok',bride:'Supriya',groomDetails:'Son',brideDetails:'Daughter'});
 assert.match(inv1,/'royal-heritage-99':\{groom:'Ashok',bride:'Supriya'/);
 assert.equal(patchPreviewDefaults(inv1,'royal-heritage-99',{}),inv1);

 const core=await readFile(new URL('../server/core.mjs',import.meta.url),'utf8');
 const core1=patchMusicTracks(core,'/assets/new-track.mp3');
 assert.match(core1,/'\/assets\/new-track\.mp3'\]\);/);
 assert.equal(patchMusicTracks(core1,'/assets/new-track.mp3'),core1);

 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 const data1=patchDataRow(data,'royal-heritage-4',{music:'vazhithunaiye.mp3',musicName:'Vazhithunaiye',color:'#930E5D'});
 assert.match(data1,/id:'royal-heritage-4'[^}]*music:'vazhithunaiye\.mp3',musicName:'Vazhithunaiye'[^}]*color:'#930E5D'/);
 assert.equal(data1.includes("id:'royal-heritage-7'"),true);

 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 const app1=patchAppMusicOption(app,'royal-heritage-99','/assets/vazhithunaiye.mp3','Vazhithunaiye');
 assert.match(app1,/data\.template==='royal-heritage-99'\|\|/);
 assert.equal(patchAppMusicOption(app1,'royal-heritage-99','/assets/vazhithunaiye.mp3','Vazhithunaiye'),app1);
 const app2=patchAppMusicOption(app,'royal-heritage-98','/assets/other.mp3','Other <Song>');
 assert.match(app2,/<option value="\/assets\/other\.mp3">Other &lt;Song&gt;<\/option>/);
 assert.match(app2,/'\/assets\/other\.mp3'\]\.includes\(data\.music\)/);
});

test('music library lists Vazhithunaiye from cms/music-library.json',async()=>{
 const tracks=await listMusicLibrary();
 const v=tracks.find(t=>t.id==='vazhithunaiye');
 assert.ok(v);
 assert.equal(v.displayName,'Vazhithunaiye');
 assert.equal(v.url,'/assets/vazhithunaiye.mp3');
});

test('validateTemplate1Input enforces pin, name, music, budget and defaults the couple',()=>{
 assert.throws(()=>validateTemplate1Input({}),/Pinterest/);
 assert.throws(()=>validateTemplate1Input({pinUrl:'https://pin.it/x'}),/display name/);
 assert.throws(()=>validateTemplate1Input({pinUrl:'https://pin.it/x',displayName:'K'}),/music library/);
 assert.throws(()=>validateTemplate1Input({pinUrl:'https://pin.it/x',displayName:'K',musicId:'v',budgetUsd:0}),/Budget/);
 const ok=validateTemplate1Input({pinUrl:'https://pin.it/330nC70it',displayName:'Kaatrukulle',musicId:'vazhithunaiye'});
 assert.equal(ok.parentId,'royal-prestige-4');
 assert.equal(ok.budgetUsd,4);
 assert.deepEqual([ok.couple.groom,ok.couple.bride],['Ashok','Supriya']);
 assert.equal(slugify('Kaatrukulle Two!'),'kaatrukulle-two');
});

test('startTemplate1Job requires keys and local writes; API gates + 404s',async()=>{
 assert.throws(()=>startTemplate1Job({pinUrl:'https://pin.it/x',displayName:'K',musicId:'vazhithunaiye'},{env:{ASSEMBLY_FS:'1',REPLICATE_API_TOKEN:'r',OPENAI_API_KEY:'o'},run:false}),/XAI_API_KEY/);
 assert.throws(()=>startTemplate1Job({pinUrl:'https://pin.it/x',displayName:'K',musicId:'vazhithunaiye'},{env:{ASSEMBLY_FS:'1',XAI_API_KEY:'x',OPENAI_API_KEY:'o'},run:false}),/REPLICATE_API_TOKEN/);
 assert.throws(()=>startTemplate1Job({pinUrl:'https://pin.it/x',displayName:'K',musicId:'vazhithunaiye'},{env:{ASSEMBLY_FS:'1',XAI_API_KEY:'x',REPLICATE_API_TOKEN:'r'},run:false}),/OPENAI_API_KEY/);
 assert.throws(()=>startTemplate1Job({pinUrl:'https://pin.it/x',displayName:'K',musicId:'vazhithunaiye'},{env:{VERCEL:'1',XAI_API_KEY:'x',REPLICATE_API_TOKEN:'r',OPENAI_API_KEY:'o'},run:false}),/locally/);
 const started=startTemplate1Job({pinUrl:'https://pin.it/x',displayName:'K',musicId:'vazhithunaiye'},{env:{ASSEMBLY_FS:'1',XAI_API_KEY:'x',REPLICATE_API_TOKEN:'r',OPENAI_API_KEY:'o'},run:false});
 assert.equal(started.prompts,null);
 assert.equal(getTemplate1Job(started.jobId).status,'running');
 assert.equal(getTemplate1Job(started.jobId).spend.budget,4);

 const denied=await request('/api/assembly?action=template1-start',{method:'POST',cookie:'',body:JSON.stringify({}),headers:{'Content-Type':'application/json'}});
 assert.equal(denied.statusCode,401);
 const missing=await request('/api/assembly?action=template1-status&jobId=nope');
 assert.equal(missing.statusCode,404);
 const list=await request('/api/assembly?action=template1-status');
 assert.equal(list.statusCode,200);
 assert.equal(Array.isArray(list.body.jobs),true);
 const music=await request('/api/assembly?action=music-library');
 assert.equal(music.statusCode,200);
 assert.equal(music.body.tracks.some(t=>t.id==='vazhithunaiye'),true);
 await assert.rejects(()=>proceedTemplate1Job('missing'),/not found/i);
 const early=await request('/api/assembly?action=template1-proceed',{method:'POST',body:JSON.stringify({jobId:'deadbeefdead'}),headers:{'Content-Type':'application/json'}});
 assert.equal(early.statusCode,404);
});

test('hydrateLiveJob rebuilds stillsWave from a review manifest',async()=>{
 const root=join(tmpdir(),'fmi-t1-'+Date.now());
 const id='aabbccddeeff';
 const workdir=join(root,'work','assembly-jobs',id);
 const firstJpg=join(workdir,'gen','opening-first-720.jpg');
 const lastJpg=join(workdir,'gen','opening-last-720.jpg');
 await mkdir(join(workdir,'gen'),{recursive:true});
 await writeFile(firstJpg,Buffer.from([0xff,0xd8,0xff]));
 await writeFile(lastJpg,Buffer.from([0xff,0xd8,0xff]));
 await writeFile(join(workdir,'manifest.json'),JSON.stringify({
  jobId:id,
  status:'review',
  phase:'review',
  input:{pinUrl:'https://pin.it/x',displayName:'K',parentId:'royal-heritage-12',musicId:'vazhithunaiye',budgetUsd:4},
  assets:{'opening-first':{jpg:firstJpg},'opening-last':{jpg:lastJpg}},
  spend:{budget:4,used:0.04,remaining:3.96,entries:[{role:'opening-first',usd:0.02},{role:'opening-last',usd:0.02}]}
 }));
 const job=await hydrateLiveJob(id,root);
 assert.equal(job.status,'review');
 assert.equal(job.stillsWave.first.jpg,firstJpg);
 assert.equal(job.stillsWave.last.jpg,lastJpg);
 assert.equal(job.ledger.used,0.04);
});
