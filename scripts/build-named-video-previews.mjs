// Regenerate public catalog media without changing released masters or customer data.
import fs from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {videoPreviewContent} from '../shared/video-preview-content.mjs';
import {prepareSceneMaster} from '../server/video-scene-details.mjs';
import {browserPath,serve,verifyVideo,command,renderPersonalizedVideo} from './render-personalized-video.mjs';

const postersOnly=process.argv.includes('--posters-only');
const selected=new Set(process.argv.slice(2).filter(arg=>arg!=='--posters-only'));
const ids=['temple-v1',...VIDEO_CATALOG.map(d=>d.id)].filter(id=>!selected.size||selected.has(id));
const directory='public/assets/catalog-previews/names-v1/videos';
mkdirSync(directory,{recursive:true});mkdirSync('work/preview-names',{recursive:true});
const manifestPath=process.env.PREVIEW_MANIFEST_PATH||'work/preview-names/video-media.json';
let results={};try{results=JSON.parse(await fs.readFile(manifestPath,'utf8'));}catch{}
let saving=Promise.resolve();
const save=()=>saving=saving.then(()=>fs.writeFile(manifestPath,JSON.stringify(results,null,2)+'\n'));

async function render(id){
 const content=videoPreviewContent(id),original=JSON.parse(await fs.readFile(`public/assets/video-masters/${id}/manifest.json`,'utf8'));
 const master=await prepareSceneMaster(original,content),output=`${directory}/${id}.mp4`;
 if(results[id]&&!postersOnly){await verifyVideo(output,{output:{...master.output,width:360,height:640}});return;}
 const started=Date.now();console.log(JSON.stringify({id,status:'started',duration:master.output.duration}));
 if(postersOnly){
  await verifyVideo(output,{output:{...master.output,width:360,height:640}});
 }else if(master.rendererVersion!=='scene-film-v1'){
  const full=`work/preview-names/${id}-full.mp4`;
  await renderPersonalizedVideo({master,content,output:full});
  await command(ffmpeg,['-y','-i',full,'-an','-vf','scale=360:640','-c:v','libx264','-preset','fast','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',output]);
 }else{
  const hosted=await serve(resolve('work/preview-names'),{});let browser,encoder;
  try{
   browser=await puppeteer.launch({executablePath:await browserPath(),headless:true,protocolTimeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none','--enable-webgl','--use-angle=d3d11','--ignore-gpu-blocklist']});
   const page=await browser.newPage();await page.setViewport({width:360,height:640,deviceScaleFactor:1});
   const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failures.push('Missing asset: '+new URL(r.url()).pathname);});
   await page.goto(hosted.origin+'/video-render.html',{waitUntil:'networkidle0'});
   await page.evaluate(async({master,content})=>{
    document.getElementById('film').style.cssText='width:360px;height:640px';
    await window.videoRender.init(master,content);
    const iframe=document.querySelector('iframe');const film=await iframe.contentWindow.fmiFilmReady;
    // Preserve the exact renderer/timeline and reduce only the catalog readback size.
    if(film.kind!=='page'){
     const nativeSnapshot=film.snapshot('image/jpeg'),canvas=document.createElement('canvas');canvas.width=360;canvas.height=640;
     film.snapshot=(format)=>{
      if(nativeSnapshot===null)return null;
      const source=film.kind==='plate'?iframe.contentDocument.querySelector('#film+div canvas'):film.canvas;
      canvas.getContext('2d').drawImage(source,0,0,360,640);
      return canvas.toDataURL(format,0.9).split(',')[1];
     };
    }
   },{master,content});
   let encoderError='';
   encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','27','-maxrate','700k','-bufsize','1400k','-pix_fmt','yuv420p','-movflags','+faststart',output],{windowsHide:true,stdio:['pipe','ignore','pipe']});
   encoder.stderr.on('data',b=>encoderError=(encoderError+b).slice(-2000));
   const done=new Promise((yes,no)=>{encoder.on('error',no);encoder.stdin.on('error',no);encoder.on('exit',code=>code===0?yes():no(Error(encoderError)));});done.catch(()=>{});
   for(let frame=0;frame<master.output.frames;frame++){
    const encoded=await page.evaluate(frame=>window.videoRender.frame(frame,undefined,undefined,undefined,undefined,true,'image/jpeg'),frame);
    const bytes=encoded?Buffer.from(encoded,'base64'):Buffer.from(await page.screenshot({type:'jpeg',quality:90,clip:{x:0,y:0,width:360,height:640},captureBeyondViewport:false}));
    if(failures.length)throw Error(failures[0]);
    if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder stopped early');})]);
   }
   encoder.stdin.end();await done;
  }finally{encoder?.stdin.destroy();encoder?.kill();await browser?.close();hosted.server.closeAllConnections();await new Promise(r=>hosted.server.close(r));}
 }
 await verifyVideo(output,{output:{...master.output,width:360,height:640}});
 const preferred={'temple-v1':'closing','film-drive-v1':'details','film-walk-v1':'welcome','film-hopon-v1':'wall','film-oonjal-v1':'closing','film-rajakumari-v1':'photo','film-rajakumaran-v1':'photo','film-ilavarasi-v1':'invite'}[id];
 const scene=master.scenes.find(s=>s.id===preferred)||master.scenes.find(s=>s.id==='couple')||master.scenes.find(s=>/names|invitation/.test(s.id))||master.scenes[0];
 const still=`work/preview-names/${id}-poster.png`;
 await command(ffmpeg,['-y','-ss',String(scene.reviewFrame/24),'-i',output,'-frames:v','1',still]);
 const posters={};for(const width of [320,640,960]){const path=`${directory}/${id}-${width}.webp`;await sharp(still).resize(width).webp({quality:82}).toFile(path);posters[width]='/'+path.replace(/^public\//,'');}
 results[id]={preview:'/'+output.replace(/^public\//,''),poster:posters[640],posters,duration:master.output.duration};
 await save();
 console.log(JSON.stringify({id,status:'complete',seconds:Math.round((Date.now()-started)/1000)}));
}
const errors=[];let cursor=0;
async function worker(){while(cursor<ids.length){const id=ids[cursor++];try{await render(id);}catch(error){errors.push({id,error:error.message});console.log(JSON.stringify(errors.at(-1)));}}}
await Promise.all([worker(),worker()]);
await save();
if(errors.length){await fs.writeFile('work/preview-names/video-errors.json',JSON.stringify(errors,null,2));process.exitCode=1;}
