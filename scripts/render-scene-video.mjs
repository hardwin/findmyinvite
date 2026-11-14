import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import puppeteer from 'puppeteer-core';
import ffmpegStatic from 'ffmpeg-static';
import {assertMaster,normalizeVideoContent,MUSIC} from '../shared/video-personalization.mjs';
import {prepareSceneMaster} from '../server/video-scene-details.mjs';
import {browserPath,serve,verifyVideo,digest} from './render-personalized-video.mjs';
const publicRoot=resolve(import.meta.dirname,'../public');
function assetPath(path){const target=resolve(publicRoot,'.'+path);if(!target.startsWith(publicRoot+sep))throw Error('Invalid scene asset path.');return target;}
async function sceneDisplay(){
 if(process.platform!=='linux')return {};
 const processHandle=spawn('Xvfb',['-displayfd','1','-screen','0','720x1280x24','-nolisten','tcp'],{stdio:['ignore','pipe','ignore']});
 try{const display=await new Promise((yes,no)=>{let output='';const timer=setTimeout(()=>no(Error('The video display did not start.')),10000);processHandle.once('error',e=>{clearTimeout(timer);no(e);});processHandle.once('exit',()=>{clearTimeout(timer);no(Error('The video display stopped.'));});processHandle.stdout.on('data',b=>{output+=b;if(/^\d+\n/.test(output)){clearTimeout(timer);yes(':'+output.trim());}});});return {processHandle,display};}catch(e){processHandle.kill();throw e;}
}
async function closeSceneBrowser(browser){
 if(!browser)return;
 let timer;
 try{await Promise.race([browser.close().catch(()=>{}),new Promise(resolve=>{timer=setTimeout(()=>{const child=browser.process();try{if(process.platform==='linux'&&child?.pid)process.kill(-child.pid,'SIGKILL');else child?.kill('SIGKILL');}catch{}resolve();},5000);})]);}finally{clearTimeout(timer);}
}
export async function renderSceneVideo({master,content,photos={},audioFile,output,reviewFrames,onProgress=()=>{},requireRelease=true,browserBatchFrames}){
 assertMaster(master,{released:requireRelease});
 content=normalizeVideoContent(content,{complete:true,templateId:master.id});
 master=await prepareSceneMaster(master,content);
 const indexBytes=await readFile(assetPath(master.assets.sceneBundle.path));
 if(digest(indexBytes)!==master.assets.sceneBundle.sha256)throw Error('Scene asset index checksum mismatch.');
 const index=JSON.parse(indexBytes);for(const [path,hash] of Object.entries(index.files)){if(digest(await readFile(assetPath(path)))!==hash)throw Error('Scene asset checksum mismatch: '+path);}
 const temp=await mkdtemp(join(tmpdir(),'fmi-scene-'));let browser,server,encoder,displayProcess;
 try{
  const hosted=await serve(temp,photos);server=hosted.server;const {origin}=hosted;
  const display=await sceneDisplay();displayProcess=display.processHandle;
  const graphics=process.platform==='linux'?['--use-gl=angle','--use-angle=gl','--ozone-platform=x11','--disable-gpu-rasterization','--disable-accelerated-2d-canvas']:['--use-angle=d3d11'];
  const software3d=process.platform==='linux'&&(master.kind==='webgl'||master.sceneDesign==='velicham');
  const batch=browserBatchFrames??(software3d?120:0);
  if(!Number.isSafeInteger(batch)||batch<0)throw Error('Invalid render batch size.');
  const failures=[],urls=Object.fromEntries(Object.entries(photos).map(([slot,p])=>[slot,{mode:p.mode,url:origin+'/_media/'+slot}]));
  let page;
  const startBrowser=async()=>{
  // Mesa 24's anisotropic sampler stalls on particular texture derivatives.
  // Standard mipmap filtering keeps exact frame times and avoids that path.
  browser=await puppeteer.launch({executablePath:await browserPath(),headless:true,protocolTimeout:120000,env:{...process.env,...(display.display?{DISPLAY:display.display,LIBGL_ALWAYS_SOFTWARE:'1',GALLIUM_DRIVER:'llvmpipe',LP_NUM_THREADS:'8',MESA_EXTENSION_OVERRIDE:'-GL_EXT_texture_filter_anisotropic -GL_ARB_texture_filter_anisotropic'}:{})},args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none','--enable-webgl',...graphics,'--ignore-gpu-blocklist']});
  if(process.platform==='linux'){const session=await browser.target().createCDPSession();try{const info=await session.send('SystemInfo.getInfo');if(!/llvmpipe/i.test(info.gpu.auxAttributes.glRenderer||''))throw Error('The scene graphics driver is unavailable.');}finally{await session.detach();}}
  page=await browser.newPage();page.setDefaultTimeout(90000);await page.setViewport({width:720,height:1280,deviceScaleFactor:1});
  // Page-based films can own a nested WebGL frame. Set the export profile in
  // every document before its renderer initializes, not only the outer bridge.
  if(process.platform==='linux')await page.evaluateOnNewDocument(()=>{globalThis.__fmiSoftwareExport=true;});
  await page.setRequestInterception(true);page.on('request',req=>{if(req.url().startsWith(origin+'/')||/^(data:|blob:)/.test(req.url()))void req.continue();else{failures.push('External request blocked');void req.abort();}});page.on('response',r=>{if(r.status()>=400)failures.push('Missing scene asset: '+new URL(r.url()).pathname);});
  await page.goto(origin+'/video-render.html',{waitUntil:'networkidle0'});await page.waitForFunction(()=>!!window.videoRender);
  await page.evaluate(async({master,content,urls,software})=>window.videoRender.init(master,content,urls,{software}),{master,content,urls,software:process.platform==='linux'});
  };
  await startBrowser();
  await onProgress(5);let done;
  const audio=audioFile||(content.music.mode==='library'?assetPath(MUSIC[content.music.id].path):null),{frames,duration,fps}=master.output;
  if(content.music.mode==='upload'&&!audio)throw Error('Selected audio asset missing.');
  if(reviewFrames)await mkdir(output,{recursive:true});else{
   await mkdir(resolve(output,'..'),{recursive:true});
   const args=['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','pipe:0'];
   if(audio)args.push('-i',audio,'-map','0:v','-map','1:a:0','-af',`apad,atrim=0:${duration},afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0,duration-3)}:d=3`,'-c:a','aac','-b:a','160k');else args.push('-an');
   args.push('-c:v','libx264','-threads','2','-preset','fast','-crf','20','-pix_fmt','yuv420p','-r',String(fps),'-frames:v',String(frames),'-t',String(duration),'-movflags','+faststart');
   if(content.music.mode==='library')args.push('-metadata','comment='+MUSIC[content.music.id].credit+' '+MUSIC[content.music.id].license);
   args.push('-f','mp4',output);encoder=spawn(process.env.FFMPEG_PATH||ffmpegStatic,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});let errors='';encoder.stderr.on('data',b=>errors=(errors+b).slice(-4000));done=new Promise((yes,no)=>{encoder.once('error',no);encoder.stdin.on('error',no);encoder.once('close',code=>code===0?yes():no(Error('Encoding failed: '+errors)));});done.catch(()=>{});
  }
  const sequence=reviewFrames||Array.from({length:frames},(_,i)=>i);
  for(const [i,frame] of sequence.entries()){
   // Software graphics drivers retain resources across readbacks. Recreate the
   // browser at a bounded interval; each scene seeks to the same absolute frame.
   if(batch&&i&&i%batch===0){await closeSceneBrowser(browser);browser=null;await startBrowser();}
   // Lossless review stills; high-quality JPEG transport for the already-lossy
   // H.264 export avoids spending most render time compressing temporary PNGs.
   const format=reviewFrames?'image/png':'image/jpeg';
   let bytes;
   try{
    const encoded=await page.evaluate(({frame,format})=>window.videoRender.frame(frame,undefined,undefined,undefined,undefined,true,format),{frame,format});
    bytes=encoded?Buffer.from(encoded,'base64'):Buffer.from(await page.screenshot({type:reviewFrames?'png':'jpeg',...(reviewFrames?{}:{quality:95}),clip:{x:0,y:0,width:720,height:1280},captureBeyondViewport:false}));
   }catch(cause){throw Error('Frame '+frame+': '+cause.message,{cause});}
   if(failures.length)throw Error(failures[0]);
   if(reviewFrames)await writeFile(join(output,String(frame).padStart(5,'0')+'.png'),bytes);else if(!encoder.stdin.write(bytes))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Video encoder stopped before the final frame.');})]);
   if(i%24===0)await onProgress(Math.round(5+92*(i+1)/sequence.length));
  }
  if(reviewFrames)return {directory:output};encoder.stdin.end();await done;
  return {...await verifyVideo(output,{audio:!!audio,output:master.output}),backgroundSha256:master.assets.sceneBundle.sha256,graphicsProfile:process.platform==='linux'?'mesa-mipmap-v1':'native'};
 }finally{encoder?.stdin.destroy();encoder?.kill('SIGKILL');await closeSceneBrowser(browser);displayProcess?.kill();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await rm(temp,{recursive:true,force:true});}
}
