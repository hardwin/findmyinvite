import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewAudio} from '../shared/preview-audio.mjs';
import {catalogPreviewPlayback} from '../shared/catalog-preview-playback.mjs';
import {templateDetailsPath,templateShareUrl,whatsappTemplateUrl} from '../shared/template-sharing.mjs';
import {filterVideoCatalog} from '../shared/discovery-taxonomy.mjs';

function fixture(){
 let stamp=0,time=2,buffering=false,position=0,seeks=0,plays=0;
 const audio=new EventTarget();Object.assign(audio,{paused:true,readyState:4,duration:28,seeking:false,playbackRate:1,volume:1,play(){plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;}});
 Object.defineProperty(audio,'currentTime',{get:()=>position,set:value=>{position=value;seeks++;}});
 const player=createPreviewAudio(audio,{clock:()=>({time,running:true,buffering}),duration:28,now:()=>stamp});
 return {audio,player,get seeks(){return seeks;},get plays(){return plays;},advance(delta=.1){stamp+=delta*1000;time+=delta;if(!audio.paused)position+=delta;player.sync();},stall(){buffering=true;stamp+=400;player.sync();},resume(){buffering=false;time+=.1;stamp+=100;player.sync();},jump(value){time=value;stamp+=1500;player.sync();}};
}
test('initial playback aligns once and never restarts or seeks on every frame',async()=>{
 const f=fixture();try{f.player.start();await Promise.resolve();for(let i=0;i<100;i++)f.advance();assert.equal(f.seeks,1);assert.equal(f.plays,1);assert.equal(f.audio.paused,false);}finally{f.player.dispose();}
});
test('buffering pauses audio without repeated rewind chatter; playback recovers',async()=>{
 const f=fixture();try{f.player.start();await new Promise(r=>setImmediate(r));f.stall();const before=f.seeks;for(let i=0;i<40;i++)f.player.sync();assert.equal(f.audio.paused,true);assert.equal(f.seeks,before);f.resume();f.advance();await new Promise(r=>setImmediate(r));assert.equal(f.audio.paused,false);assert.ok(f.seeks<=before+1);}finally{f.player.dispose();}
});
test('scene jumps and loops realign once, and disposal stops audio',async()=>{
 const f=fixture();f.player.start();await new Promise(r=>setImmediate(r));f.jump(0);f.advance();assert.ok(f.seeks<=2);f.player.stop();assert.equal(f.audio.paused,true);f.player.dispose();assert.equal(f.audio.paused,true);
});
test('a pending play promise is not repeated and cannot outlive cleanup',async()=>{
 const f=fixture();let resolve;f.audio.play=function(){this.paused=true;return new Promise(done=>{resolve=()=>{this.paused=false;done();};});};f.player.start();for(let i=0;i<15;i++)f.advance();f.player.dispose();resolve();await new Promise(r=>setImmediate(r));assert.equal(f.audio.paused,true);
});
test('Wedding Bells uses either embedded original audio or a silent film with selected music',()=>{
 const preview='/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-v1.mp4';
 assert.deepEqual(catalogPreviewPlayback('wedding-bells-v1',preview,{id:'wedding-bells-original'}),{preview,embeddedMusic:true});
 for(const music of [null,{id:'different-track'}]){const p=catalogPreviewPlayback('wedding-bells-v1',preview,music);assert.equal(p.embeddedMusic,false);assert.match(p.preview,/silent/);}
 assert.equal(catalogPreviewPlayback('temple-v1','/silent.mp4',{id:'track'}).embeddedMusic,false);
});
test('shared links are public details pages for each kind, never draft or editor routes',()=>{
 for(const kind of ['video','website']){const path=templateDetailsPath('a & b',kind,'ta'),url=templateShareUrl(path+'&draft=secret&version=private');assert.ok(url.startsWith('https://findmyinvite.com/templates?'));assert.equal(new URL(url).searchParams.get('product'),'a & b');assert.equal(new URL(url).searchParams.get('lang'),'ta');assert.ok(!url.includes('secret'));assert.equal(new URL(whatsappTemplateUrl('Wedding Bells',url)).searchParams.get('text'),'Wedding Bells · FindMyInvite\n'+url);}
 assert.throws(()=>templateShareUrl('/video-personalise?draft=private'));
});
test('Wedding Bells is first by default; explicit price/name sorting still works',()=>{
 const entries=[{id:'temple-v1',name:'Temple',amount:58882,tier:'standard'},{id:'wedding-bells-v1',name:'Wedding Bells',amount:82482,tier:'premium'}];
 assert.equal(filterVideoCatalog(entries)[0].id,'wedding-bells-v1');
 assert.equal(filterVideoCatalog(entries,{sort:'price'})[0].id,'temple-v1');
 assert.equal(filterVideoCatalog(entries,{sort:'name'})[0].id,'temple-v1');
 assert.equal(filterVideoCatalog(entries,{collection:'premium'}).length,1);
});
