// Deterministic export of the same tracked-film compositor used by the editor.
// There are no image-generation calls in text-only previews or MP4 exports.
import {spawn} from 'node:child_process';
import {readFile,writeFile,readdir,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import {assertMaster,normalizeVideoContent,MUSIC} from '../shared/video-personalization.mjs';
import {browserPath,serve,digest,verifyVideo,command} from './render-personalized-video.mjs';
const publicRoot=resolve(import.meta.dirname,'../public');
function asset(path){const file=resolve(publicRoot,'.'+path);if(!file.startsWith(publicRoot+sep))throw Error('Invalid film asset path.');return file;}
export async function renderTrackedVideo({master,content,photos={},audioFile,output,reviewFrames,requireRelease=true,onProgress=()=>{}}){
 assertMaster(master,{released:requireRelease});content=normalizeVideoContent(content,{complete:true,templateId:master.id});
 if(Object.keys(photos).length)throw Error('Wedding Bells preserves the original moving characters.');
 for(const a of Object.values(master.assets))if(digest(await readFile(asset(a.path)))!==a.sha256)throw Error('Tracked film asset checksum mismatch.');
 const temp=await mkdtemp(join(tmpdir(),'fmi-tracked-'));let browser,server,encoder;
 try{
  await mkdir(join(temp,'source'));await mkdir(join(temp,'restoration'));
  // Both locked films already have exactly 832 source frames at 30 fps. An fps
  // filter can discard a frame when this AI film changes colour metadata mid-shot.
  // Decode by frame index and keep the filter counter stable across that change.
  const select=reviewFrames?`select='${reviewFrames.map(f=>`eq(n,${f})`).join('+')}'`:'null';
  const expected=reviewFrames?.length||master.output.frames;
  await Promise.all(['source','restoration'].map(async(name,i)=>{
   await command(process.env.FFMPEG_PATH||ffmpeg,['-hide_banner','-loglevel','error','-reinit_filter','0','-i',asset(master.assets[i?'restoration':'background'].path),'-vf',select,'-fps_mode','passthrough','-frames:v',String(expected),'-q:v','1',join(temp,name,'%05d.jpg')]);
   if((await readdir(join(temp,name))).filter(f=>f.endsWith('.jpg')).length!==expected)throw Error('The '+name+' film did not decode every required frame.');
  }));
  const hosted=await serve(temp,{});server=hosted.server;
  browser=await puppeteer.launch({executablePath:await browserPath(),headless:true,protocolTimeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();page.setDefaultTimeout(90000);await page.setViewport({width:720,height:1280,deviceScaleFactor:1});const failures=[];
  await page.setRequestInterception(true);page.on('request',req=>{if(req.url().startsWith(hosted.origin+'/')||/^(blob:|data:)/.test(req.url()))void req.continue();else{failures.push('External renderer request blocked.');void req.abort();}});
  page.on('response',res=>{if(res.status()>=400)failures.push('Missing renderer asset: '+new URL(res.url()).pathname);});
  await page.goto(hosted.origin+'/video-render.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.videoRender);
  const initialized=await page.evaluate(async({master,content})=>{try{await window.videoRender.init(master,content);return {ok:true};}catch(e){return {ok:false,message:e.message,code:e.code,field:e.field};}},{master,content});
  if(!initialized.ok)throw Object.assign(Error(initialized.message),initialized);
  const {fps,frames,duration}=master.output,audio=audioFile||(content.music.mode==='library'&&MUSIC[content.music.id]?asset(MUSIC[content.music.id].path):null);
  if(content.music.mode!=='none'&&!audio)throw Error('Selected music is unavailable.');
  const original=!!audio&&content.music.mode==='library'&&content.music.id==='wedding-bells-original';
  const encodedVideo=original?join(temp,'silent-film.mp4'):output;
  let done;
  if(reviewFrames)await mkdir(output,{recursive:true});else{
   await mkdir(resolve(output,'..'),{recursive:true});
   const args=['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','pipe:0'];
   if(audio&&!original){
    if(content.music.mode==='library')args.push('-stream_loop','-1');
    args.push('-i',audio,'-map','0:v:0','-map','1:a:0');
    args.push('-af',`apad,atrim=0:${duration},afade=t=in:st=0:d=1,afade=t=out:st=${duration-3}:d=3`,'-c:a','aac','-b:a','160k');
   }else args.push('-an');
   args.push('-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r',String(fps),'-frames:v',String(frames),'-movflags','+faststart','-f','mp4',encodedVideo);
   encoder=spawn(process.env.FFMPEG_PATH||ffmpeg,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});let error='';encoder.stderr.on('data',b=>error=(error+b).slice(-4000));
   done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.stdin.on('error',reject);encoder.once('close',code=>code===0?resolve():reject(Error('Video encoding failed: '+error)));});done.catch(()=>{});
  }
  const sequence=reviewFrames||Array.from({length:frames},(_,i)=>i);
  for(const [i,frame] of sequence.entries()){
   if(!Number.isInteger(frame)||frame<0||frame>=frames)throw Error('Invalid review frame.');
   const n=String(i+1).padStart(5,'0');
   const base64=await page.evaluate(({frame,format,source,restoration})=>window.videoRender.frame(frame,source,undefined,undefined,restoration,false,format),{frame,format:reviewFrames?'image/png':'image/jpeg',source:hosted.origin+'/_frames/source/'+n+'.jpg',restoration:hosted.origin+'/_frames/restoration/'+n+'.jpg'});
   if(failures.length)throw Error(failures[0]);if(!base64)throw Error('The film renderer returned no frame.');const bytes=Buffer.from(base64,'base64');
   if(reviewFrames)await writeFile(join(output,String(frame).padStart(5,'0')+'.png'),bytes);
   else if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder stopped before the last frame.');})]);
   if(i%30===0)await onProgress(Math.round((i+1)/sequence.length*99));
  }
  if(reviewFrames)return {directory:output};encoder.stdin.end();await done;
  // Mux after frame-limited encoding: otherwise FFmpeg truncates the recording
  // when it receives the final video frame, even with audio stream-copy enabled.
  if(original)await command(process.env.FFMPEG_PATH||ffmpeg,['-hide_banner','-loglevel','error','-y','-i',encodedVideo,'-i',audio,'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',output]);
  return {...await verifyVideo(output,{audio:!!audio,output:master.output}),backgroundSha256:master.assets.background.sha256};
 }finally{encoder?.stdin.destroy();encoder?.kill('SIGKILL');await browser?.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await rm(temp,{recursive:true,force:true});}
}
