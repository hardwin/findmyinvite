// Versioned layered DOM renderer. No AI calls: prepared character layers and text
// are deterministic inputs. Preserve approved temporal sampling and continuous audio.
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {Worker} from 'node:worker_threads';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import ffmpegStatic from 'ffmpeg-static';
import {assertMaster,normalizeVideoContent,MUSIC} from '../shared/video-personalization.mjs';
import {browserPath,serve,digest,command,verifyVideo,probe} from './render-personalized-video.mjs';
const publicRoot=resolve(import.meta.dirname,'../public');
const dependencies=[
 {fields:[],poses:['openingCouple']},{fields:[],poses:['heartCouple']},{fields:[],poses:['umbrellaBride']},
 {fields:['bride'],poses:['bridePortrait']},{fields:[],poses:['groomPrint']},{fields:['groom'],poses:['groomPortrait']},
 {fields:['weddingDate','weddingTime','weddingVenue'],poses:['weddingCouple']},
 {fields:['receptionDate','receptionTime','receptionVenue'],poses:['receptionCouple']},{fields:[],poses:['closingCouple']}
];
function asset(path){const p=resolve(publicRoot,'.'+path);if(!p.startsWith(publicRoot+sep))throw Error('Invalid layered asset path');return p;}
export function temporalSamples(time,scene,index){
 const fast=time>=scene.end/25-.24||(index===3&&time-scene.start/25>=.2&&time-scene.start/25<=.96);
 return fast?Array.from({length:9},(_,i)=>({offset:(i-4)*.0025,weight:[1,2,3,4,5,4,3,2,1][i]})):
 [{offset:-.006,weight:1},{offset:0,weight:2},{offset:.006,weight:1}];
}
export function sceneCacheKey({master,index,content,photoHashes,profile='layered-2d-v1-720-temporal-3-9-'+process.platform+'-chromium-131.0.6778.33'}) {
 const d=dependencies[index];if(!d)throw Error('Unknown layered scene');
 return digest(JSON.stringify({bundle:master.assets.sceneBundle.sha256,version:master.version,output:master.output,index,profile,
 fields:Object.fromEntries(d.fields.map(k=>[k,content[k]])),photos:Object.fromEntries(d.poses.map(k=>[k,photoHashes[k]||null]))}));
}
export function partitionLayeredScenes(scenes,count=3){const groups=Array.from({length:Math.min(count,scenes.length)},()=>({frames:0,indices:[]}));for(const {scene,index}of scenes.map((scene,index)=>({scene,index})).sort((a,b)=>(b.scene.end-b.scene.start)-(a.scene.end-a.scene.start))){const group=groups.reduce((best,g)=>g.frames<best.frames?g:best);group.frames+=scene.end-scene.start;group.indices.push(index);}return groups.map(g=>g.indices.sort((a,b)=>a-b));}
async function warmParallel(options,onProgress){
 const {master,cache}=options,groups=partitionLayeredScenes(master.scenes),progress=groups.map(()=>0),workers=[];let reported=-1,report=Promise.resolve(),progressError;
 const results=await Promise.allSettled(groups.map((warmScenes,index)=>new Promise((yes,no)=>{
  const w=new Worker(new URL('./render-layered-scene-worker.mjs',import.meta.url),{workerData:{...options,cache:undefined,cacheOwner:cache.owner,warmScenes}});workers.push(w);let completed=false;
  w.on('message',message=>{if(message.error){completed=true;no(Error(message.error));}else if(message.done){completed=true;yes(message.proof);}else if(typeof message.progress==='number'){progress[index]=message.progress;const next=Math.round(progress.reduce((sum,p,i)=>sum+p*groups[i].reduce((n,j)=>n+master.scenes[j].end-master.scenes[j].start,0),0)/master.output.frames);if(next>reported){reported=next;report=report.then(()=>onProgress(next)).catch(e=>{progressError=e;});}}});
  w.once('error',no);w.once('exit',code=>{if(!completed)no(Error('Layered scene worker stopped ('+code+')'));});
 })));
 for(const w of workers)await w.terminate();await report;if(progressError)throw progressError;const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
 return results.flatMap(r=>r.value.checkpoints);
}
export async function renderLayeredVideo({master,content,photos={},audioFile,output,reviewFrames,onProgress=()=>{},requireRelease=true,cache,warmScenes}){
 assertMaster(master,{released:requireRelease});if(master.id!=='film-anbil-avan-v1'||master.renderProfile!=='layered-2d-v1')throw Error('Unsupported layered film');
 content=normalizeVideoContent(content,{complete:true,templateId:master.id,masterVersion:master.version});
 const indexBytes=await readFile(asset(master.assets.sceneBundle.path));if(digest(indexBytes)!==master.assets.sceneBundle.sha256)throw Error('Layered bundle checksum mismatch');
 const index=JSON.parse(indexBytes);for(const [path,sha]of Object.entries(index.files))if(digest(await readFile(asset(path)))!==sha)throw Error('Layered asset checksum mismatch: '+path);
 const photoHashes={};for(const [slot,p] of Object.entries(photos))photoHashes[slot]=digest(await readFile(p.file));
 const temp=await mkdtemp(join(tmpdir(),'fmi-layered-')),ff=process.env.FFMPEG_PATH||ffmpegStatic;
 if(warmScenes&&(!cache||!Array.isArray(warmScenes)||warmScenes.some(i=>!Number.isInteger(i)||!master.scenes[i])))throw Error('Invalid layered scene warmup');
 let browser,server,encoder,warmCheckpoints;const checkpoints=[];
 try{
 if(cache?.worker&&!warmScenes&&!reviewFrames)warmCheckpoints=await warmParallel({master,content,photos,audioFile,output:join(temp,'warm.mp4'),requireRelease,cache},onProgress);
 const hosted=await serve(temp,photos);server=hosted.server;const origin=hosted.origin;
 const urls=Object.fromEntries(Object.entries(photos).map(([slot,p])=>[slot,{mode:p.mode,url:origin+'/_media/'+slot}]));
 const failures=[];let page;
 async function open(){browser=await puppeteer.launch({executablePath:await browserPath(),headless:true,protocolTimeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--font-render-hinting=none','--hide-scrollbars','--mute-audio','--no-first-run','--disable-extensions','--force-color-profile=srgb','--disable-lcd-text']});
 page=await browser.newPage();await page.setViewport({width:720,height:1280,deviceScaleFactor:1});page.setDefaultTimeout(90000);
 await page.setRequestInterception(true);page.on('request',r=>{if(r.url().startsWith(origin+'/')||/^(data:|blob:)/.test(r.url()))void r.continue();else{failures.push('External render request blocked');void r.abort();}});page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push('Missing layered asset '+new URL(r.url()).pathname);});
 await page.goto(origin+master.sceneFrame,{waitUntil:'networkidle0'});await page.evaluate(async({content,urls})=>{window.film=await window.fmiFilmReady;await window.film.init(content,urls,true);window.film.validate();},{content,urls});
 }
 async function capture(t,format='jpeg'){await page.evaluate(t=>window.film.renderTime(t),t);const bytes=await page.screenshot({type:format,...(format==='jpeg'?{quality:95}:{}),clip:{x:0,y:0,width:720,height:1280}});if(failures.length)throw Error(failures[0]);return Buffer.from(bytes);}
 if(reviewFrames){await mkdir(output,{recursive:true});await open();for(const frame of reviewFrames){if(!Number.isInteger(frame)||frame<0||frame>=876)throw Error('Invalid review frame');await writeFile(join(output,String(frame).padStart(5,'0')+'.png'),await capture(frame/25,'png'));}return {directory:output};}
 await mkdir(resolve(output,'..'),{recursive:true});const chunks=[];
 let warmedFrames=0;const warmTotal=warmScenes?.reduce((n,i)=>n+master.scenes[i].end-master.scenes[i].start,0);
 for(let i=0;i<master.scenes.length;i++){
 if(warmScenes&&!warmScenes.includes(i))continue;
 const scene=master.scenes[i],chunk=join(temp,'scene-'+i+'.mp4'),key=sceneCacheKey({master,index:i,content,photoHashes});
 const cacheBase=cache&&/^[a-zA-Z0-9-]+$/.test(cache.owner||'')?'chunks/'+cache.owner+'/'+key:null;
 let reused=false;if(cacheBase){try{const record=await cache.store.read(cacheBase+'.json');if(record?.value?.sha256){const b=await cache.store.bytes(cacheBase+'.mp4');if(digest(b)===record.value.sha256){await writeFile(chunk,b);const p=await probe(chunk),v=p.streams.find(s=>s.codec_type==='video');reused=v?.codec_name==='h264'&&+v.nb_frames===scene.end-scene.start&&v.width===720&&v.height===1280&&v.avg_frame_rate==='25/1';}}}catch{reused=false;}}
 if(!reused){if(browser){await browser.close();browser=null;}await open();
 encoder=spawn(ff,['-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','25','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-threads','3','-pix_fmt','yuv420p','-movflags','+faststart',chunk],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-4000));const done=new Promise((yes,no)=>{encoder.once('error',no);encoder.stdin.once('error',no);encoder.once('close',code=>code?no(Error('Layered encoding failed: '+errors)):yes());});done.catch(()=>{});
 for(let frame=scene.start;frame<scene.end;frame++){const t=frame/25,samples=temporalSamples(t,scene,i),raw=[];for(const s of samples){const at=Math.max(scene.start/25,Math.min(scene.end/25-.001,t+s.offset));raw.push(await sharp(await capture(at)).removeAlpha().raw().toBuffer());}
 const blend=Buffer.allocUnsafe(720*1280*3),weight=samples.reduce((n,s)=>n+s.weight,0);for(let j=0;j<blend.length;j++){let sum=0;for(let k=0;k<raw.length;k++)sum+=raw[k][j]*samples[k].weight;blend[j]=Math.round(sum/weight);}
 if(!encoder.stdin.write(blend))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder stopped before final frame');})]);
 if(frame%25===0)await onProgress(warmScenes?Math.round(5+90*(warmedFrames+frame-scene.start+1)/warmTotal):Math.round(5+90*(frame+1)/876));}
 encoder.stdin.end();await done;encoder=null;
 if(cacheBase){const bytes=await readFile(chunk),sha256=digest(bytes);try{await cache.store.putBytes(cacheBase+'.mp4',bytes,'video/mp4');}catch(e){const old=await cache.store.bytes(cacheBase+'.mp4').catch(()=>null);if(!old||digest(old)!==sha256)throw e;}await cache.store.save(cacheBase+'.json',{sha256,frames:scene.end-scene.start,createdAt:new Date().toISOString()});}
 }
 chunks.push(chunk);checkpoints.push({scene:scene.id,key,reused});warmedFrames+=scene.end-scene.start;await onProgress(warmScenes?Math.round(5+90*warmedFrames/warmTotal):Math.round(5+90*scene.end/876));
 }
 if(warmScenes)return {checkpoints};
 const list=join(temp,'concat.txt');await writeFile(list,chunks.map(p=>"file '"+p.replaceAll('\\','/')+"'").join('\n'));
 const picture=join(temp,'picture.mp4');await command(ff,['-y','-v','error','-f','concat','-safe','0','-i',list,'-c','copy','-an',picture]);
 const audio=audioFile||(content.music?.mode==='library'&&MUSIC[content.music.id]?asset(MUSIC[content.music.id].path):null);
 if(!audio||digest(await readFile(audio))!==master.source?.audioSha256)throw Error('The approved Anbil Avan audio does not match this template');
 await command(ff,['-y','-v','error','-i',picture,'-i',audio,'-map','0:v:0','-map','1:a:0','-c','copy','-t','35.04','-movflags','+faststart',output]);
 return {...await verifyVideo(output,{audio:true,output:master.output}),backgroundSha256:master.assets.sceneBundle.sha256,renderProfile:master.renderProfile,checkpoints,...(warmCheckpoints?{warmCheckpoints}: {})};
 }finally{encoder?.stdin.destroy();encoder?.kill();await browser?.close().catch(()=>{});if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await rm(temp,{recursive:true,force:true});}
}

