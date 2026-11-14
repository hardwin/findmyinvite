// Deterministic compositor. This module has no generation provider or fallback.
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,mkdtemp,rm,stat,access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import {assertMaster,normalizeVideoContent,MUSIC} from '../shared/video-personalization.mjs';

const root=resolve(import.meta.dirname,'..');
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const ffmpeg=process.env.FFMPEG_PATH||ffmpegStatic;
const ffprobe=process.env.FFPROBE_PATH||ffprobeStatic.path;
export function command(bin,args,{onOutput}={}){
 return new Promise((yes,no)=>{const p=spawn(bin,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',errors='';p.stdout.on('data',b=>{output+=b;onOutput?.(b);});p.stderr.on('data',b=>{errors=(errors+b).slice(-8000);});p.once('error',no);p.once('close',code=>code===0?yes(output):no(Error(`${bin} failed (${code}): ${errors}`)));});
}
export async function probe(file){return JSON.parse(await command(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file]));}
export async function verifyVideo(file,{audio=false,output={width:720,height:1280,fps:24,frames:1296,duration:54}}={}){
 const result=await probe(file),v=result.streams.find(s=>s.codec_type==='video');
 if(!v||v.codec_name!=='h264'||v.width!==output.width||v.height!==output.height||v.avg_frame_rate!==output.fps+'/1'||Number(v.nb_frames)!==output.frames||Math.abs(Number(v.duration)-output.duration)>1/output.fps+.001)throw Error('Video output does not match the master.');
 if(result.streams.some(s=>s.codec_type==='audio')!==audio)throw Error('Unexpected audio output.');
 return {frames:output.frames,width:output.width,height:output.height,duration:output.duration,bytes:(await stat(file)).size,resultSha256:digest(await readFile(file))};
}
export async function browserPath(){for(const p of [process.env.VIDEO_CHROMIUM_PATH,'/usr/bin/chromium','/usr/bin/chromium-browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'])if(p){try{await access(p);return p;}catch{}}throw Error('Set VIDEO_CHROMIUM_PATH to a pinned Chromium executable.');}
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.webm':'video/webm','.mp4':'video/mp4','.mov':'video/quicktime','.webp':'image/webp','.otf':'font/otf','.woff':'font/woff','.svg':'image/svg+xml','.m4a':'audio/mp4','.mp3':'audio/mpeg'};
function inside(base,path){const result=resolve(base,path);if(result!==base&&!result.startsWith(base+sep))throw Error('Invalid asset path.');return result;}
export async function serve(temp,photos){
 const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;
  if(path.startsWith('/_frames/'))file=inside(temp,path.slice(9));
  else if(path.startsWith('/_media/'))file=photos[path.slice(8)]?.file;
  else if(path.startsWith('/assets/video-masters/')||path.startsWith('/assets/video-scenes/'))file=inside(join(root,'public'),path.slice(1));
  else file=inside(join(root,'dist'),path==='/'?'video-render.html':path.slice(1));
  if(!file)throw Error('Not found');const size=(await stat(file)).size;res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':size,'Cache-Control':'no-store','Content-Security-Policy':"connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:"});createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,origin:`http://127.0.0.1:${server.address().port}`};
}
export async function renderPersonalizedVideo({master,content,photos={},audioFile,output,reviewFrames,onlyLayer,onProgress=()=>{},requireRelease=true,frameTransport='png'}){
 if(master.rendererVersion==='scene-film-v1'){const {renderSceneVideo}=await import('./render-scene-video.mjs');return renderSceneVideo({master,content,photos,audioFile,output,reviewFrames,onProgress,requireRelease});}
 assertMaster(master,{released:requireRelease});content=normalizeVideoContent(content,{complete:true,templateId:master.id});
 for(const asset of Object.values(master.assets)){const file=inside(join(root,'public'),asset.path.slice(1));const checksum=digest(await readFile(file));if(asset.sha256!==checksum)throw Error('Master asset checksum mismatch: '+asset.path);}
 const temp=await mkdtemp(join(tmpdir(),'fmi-video-'));let browser,server,encoder;
 try{
  await mkdir(join(temp,'bg'));await mkdir(join(temp,'petals'));await mkdir(join(temp,'mask'));
  const bg=inside(join(root,'public'),master.assets.background.path.slice(1)),petals=inside(join(root,'public'),master.assets[master.petals.asset].path.slice(1));
  const overlay=master.petals;
  const selection=reviewFrames?`,select='${reviewFrames.map(f=>`eq(n,${f})`).join('+')}'`:'',count=String(reviewFrames?.length||1296);
  await Promise.all([
   command(ffmpeg,['-hide_banner','-loglevel','error','-i',bg,'-vf','fps=24'+selection,'-fps_mode','vfr','-frames:v',count,'-q:v','2',join(temp,'bg/%05d.jpg')]),
   command(ffmpeg,['-hide_banner','-loglevel','error','-stream_loop','-1','-i',petals,'-vf',`setpts=(PTS-STARTPTS-${overlay.offset}/TB)/${overlay.playbackRate},fps=24`+selection,'-fps_mode','vfr','-frames:v',count,join(temp,'petals/%05d.png')]),
   ...(master.assets.foregroundMask?[command(ffmpeg,['-hide_banner','-loglevel','error','-i',inside(join(root,'public'),master.assets.foregroundMask.path.slice(1)),'-vf','fps=24'+selection,'-fps_mode','vfr','-frames:v',count,join(temp,'mask/%05d.png')])]:[])
  ]);await onProgress(12);
  const hosted=await serve(temp,photos);server=hosted.server;const {origin}=hosted;
  browser=await puppeteer.launch({executablePath:await browserPath(),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();page.setDefaultTimeout(60000);await page.setViewport({width:720,height:1280,deviceScaleFactor:1});
  await page.setRequestInterception(true);page.on('request',req=>{if(req.url().startsWith(origin+'/')||req.url().startsWith('data:')||req.url().startsWith('blob:'))void req.continue();else void req.abort();});
  await page.goto(origin+'/video-render.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.videoRender);
  const urls=Object.fromEntries(Object.entries(photos).map(([slot,p])=>[slot,{mode:p.mode,url:origin+'/_media/'+slot}]));
  const init=await page.evaluate(async({master,content,urls})=>{try{await window.videoRender.init(master,content,urls);return {ok:true};}catch(e){return {ok:false,message:e.message,code:e.code,field:e.field};}},{master,content,urls});
  if(!init.ok)throw Object.assign(Error(init.message),{code:init.code,field:init.field});
  let done,encoderErrors='';
  if(!reviewFrames){
   const audio=audioFile||(content.music.mode==='library'?inside(join(root,'public'),MUSIC[content.music.id].path.slice(1)):null);
   if(content.music.mode==='upload'&&!audio)throw Error('Selected audio asset missing.');
   await mkdir(resolve(output,'..'),{recursive:true});
   const args=['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','24','-i','pipe:0'];
   if(audio)args.push('-i',audio,'-map','0:v','-map','1:a:0','-af','apad,atrim=0:54,afade=t=in:st=0:d=1,afade=t=out:st=51:d=3','-c:a','aac','-b:a','160k');else args.push('-an');
   args.push('-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-r','24','-frames:v','1296','-t','54','-movflags','+faststart');
   if(content.music.mode==='library')args.push('-metadata','comment='+MUSIC[content.music.id].credit+' '+MUSIC[content.music.id].license);
   args.push(output);encoder=spawn(ffmpeg,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});encoder.stderr.on('data',b=>{encoderErrors=(encoderErrors+b).slice(-8000);});done=new Promise((yes,no)=>{encoder.once('error',no);encoder.once('close',code=>code===0?yes():no(Error('Encoding failed: '+encoderErrors)));});done.catch(()=>{});
  }else await mkdir(output,{recursive:true});
  const frames=reviewFrames||Array.from({length:1296},(_,i)=>i);
  for(const [index,frame] of frames.entries()){
   const n=String(reviewFrames?index+1:frame+1).padStart(5,'0');const png=await page.evaluate(async({frame,bg,petals,mask,onlyLayer,directSurface})=>window.videoRender.frame(frame,bg,petals,onlyLayer,mask,directSurface),{frame,directSurface:frameTransport!=='legacy',bg:origin+'/_frames/bg/'+n+'.jpg',petals:origin+'/_frames/petals/'+n+'.png',mask:master.assets.foregroundMask?origin+'/_frames/mask/'+n+'.png':undefined,onlyLayer});
   if(png){const bytes=Buffer.from(png,'base64');if(reviewFrames)await writeFile(join(output,String(frame).padStart(5,'0')+'.png'),bytes);else if(!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');}
   if(index%24===0)await onProgress(Math.round(12+85*(index+1)/frames.length));
  }
  if(reviewFrames)return {directory:output};encoder.stdin.end();await done;
  return {...await verifyVideo(output,{audio:content.music.mode!=='none'}),backgroundSha256:master.assets.background.sha256};
 }finally{encoder?.kill();await browser?.close();if(server)await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const config=JSON.parse(await readFile(process.argv[2],'utf8'));if(typeof config.master==='string')config.master=JSON.parse(await readFile(config.master,'utf8'));console.log(await renderPersonalizedVideo({...config,onProgress:p=>console.log('Render '+p+'%')}));
}
