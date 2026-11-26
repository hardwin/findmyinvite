// Run against a production build with BROWSER_PATH pointing to an H.264/AAC-capable Chrome.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit,devices} from 'playwright-core';
import {preview} from 'vite';
import {videoPublicCatalog} from '../server/video-public-catalog.mjs';

const catalog=await videoPublicCatalog({
 env:{VIDEO_PERSONALISE_ENABLED:'1'},identify:async rows=>rows,
 musicLoader:async()=>({tracks:[{id:'wedding-bells-original'}],assignments:[]}),
});
assert.equal(catalog.templates.length,4);
const wedding=catalog.templates[0];
const weddingBytes=await readFile('dist'+wedding.mobilePreview);
let interrupt=false,restored=false;
// Deliver the opening frames, then hold the TCP response open until the simulated network recovers.
function serveInterruptedClip(req,res){
 const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 const start=range?Number(range[1]):0,end=range?.[2]?Number(range[2]):weddingBytes.length-1;
 res.writeHead(range?206:200,{'Content-Type':'video/mp4','Cache-Control':'no-store','Accept-Ranges':'bytes',
  'Content-Length':end-start+1,...(range?{'Content-Range':`bytes ${start}-${end}/${weddingBytes.length}`}:{})});
 const cut=restored?end+1:Math.min(end+1,Math.max(start,190000));
 res.write(weddingBytes.subarray(start,cut));
 if(cut>end){res.end();return;}
 const timer=setInterval(()=>{if(restored){clearInterval(timer);res.end(weddingBytes.subarray(cut,end+1));}},50);
 res.once('close',()=>clearInterval(timer));
}
const site=await preview({configFile:false,logLevel:'error',preview:{port:0,host:'127.0.0.1'},
 plugins:[{name:'local-playback-fixtures',configurePreviewServer(server){
  server.middlewares.use((req,res,next)=>{
   if(req.url.startsWith('/api/')){
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify(req.url.startsWith('/api/video-personalise?')?catalog:{templates:[]}));return;
   }
   if(interrupt&&req.url===wedding.mobilePreview){serveInterruptedClip(req,res);return;}
   next();
  });
 }}]});
const origin='http://127.0.0.1:'+site.httpServer.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
async function newPage(options=devices['Pixel 5'],engine=browser){
 const page=await engine.newPage(options);
 await page.addInitScript(()=>sessionStorage.setItem('fmi-invitation-preferences-dismissed-v1','1'));
 await page.goto(origin,{waitUntil:'domcontentloaded'});
 await page.locator('.di-video-featured .di-video-card').first().waitFor();
 return page;
}
const play=(page,entry)=>page.getByRole('button',{name:'Play preview for '+entry.name,exact:true});
const cardFor=(page,entry)=>page.locator('.di-video-card').filter({has:page.getByRole('button',{name:'Expand '+entry.name,exact:true})});
async function throughLoop(entry,kbps){
 const page=await newPage();
 try{
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:kbps*1000/8,uploadThroughput:125000});
  await play(page,entry).scrollIntoViewIfNeeded();
  assert.equal(await page.locator('video').count(),0);
  await page.evaluate(()=>{
   window.audit={last:0,maxGap:0,gapAt:0,previous:0,looped:false};
   document.addEventListener('timeupdate',e=>{
    const video=e.target;if(!(video instanceof HTMLVideoElement)||video.paused)return;
    const a=window.audit,now=performance.now();
    if(video.currentTime===a.previous)return;
    if(a.previous>video.duration-1&&video.currentTime<1)a.looped=true;
    const advance=(video.currentTime-a.previous+video.duration)%video.duration;
    const gap=now-a.last-advance*1000;
    if(a.last&&gap>a.maxGap){a.maxGap=gap;a.gapAt=a.previous;}
    a.previous=video.currentTime;a.last=now;
   },true);
  });
  await play(page,entry).tap();
  await page.waitForFunction(()=>window.audit.looped&&window.audit.previous>0.75,null,{timeout:65000});
  const stats=await cardFor(page,entry).locator('video').evaluate(v=>({
   path:new URL(v.currentSrc).pathname,muted:v.muted,audioBytes:v.webkitAudioDecodedByteCount,...window.audit,
  }));
  assert.equal(stats.path,entry.mobilePreview);assert.equal(stats.muted,false);assert.ok(stats.audioBytes>0);
  assert.ok(stats.maxGap<1000,`${entry.name} at ${kbps} kbps froze at ${stats.gapAt.toFixed(2)}s for ${stats.maxGap.toFixed()} ms`);
  console.log(`${entry.name}, ${kbps} kbps: first loop with audio, longest playback delay ${stats.maxGap.toFixed()} ms`);
 }finally{await page.close();}
}
async function interruption(retry){
 const page=await newPage();interrupt=true;restored=false;
 try{
  const card=cardFor(page,wedding),video=card.locator('video');
  await play(page,wedding).tap();
  await card.getByRole('status',{name:'Buffering preview for '+wedding.name}).waitFor({timeout:20000});
  const before=await video.evaluate(v=>({pos:v.currentTime,opacity:getComputedStyle(v).opacity}));
  assert.ok(before.pos>0);assert.equal(before.opacity,'1');
  const retryButton=card.getByRole('button',{name:'Retry preview for '+wedding.name});
  if(retry){
   await retryButton.waitFor({timeout:10000});
   await video.evaluate(v=>v.addEventListener('playing',()=>{v.dataset.restartedAt=String(v.currentTime);},{once:true}));
   await retryButton.tap();
  }
  restored=true;
  await page.waitForFunction(pos=>document.querySelector('.di-video-card video')?.currentTime>pos+.5,before.pos,{timeout:15000});
  if(retry)assert.ok(Number(await video.getAttribute('data-restarted-at'))>=before.pos-.2,'Retry resumes from the stalled frame');
  assert.equal(await card.locator('.di-preview-loading').count(),0);assert.equal(await retryButton.count(),0);
  await video.evaluate(v=>v.pause());await card.getByRole('button',{name:'Resume preview for '+wedding.name}).tap();
  assert.equal(await video.evaluate(v=>v.paused),false);
  await play(page,catalog.templates[1]).tap();
  await page.waitForFunction(()=>{const vs=document.querySelectorAll('.di-video-card video');return vs.length===1&&vs[0].currentTime>.25&&!vs[0].muted;});
  assert.equal(await video.count(),0);
  console.log((retry?'Retry':'Automatic recovery')+', Resume and card switching passed');
 }finally{restored=true;interrupt=false;await page.close();}
}
async function webkitLoop(){
 const engine=await webkit.launch();
 try{
  const page=await newPage(devices['iPhone 13'],engine),entry=catalog.templates.find(row=>row.id==='film-were-next-v1');
  const card=cardFor(page,entry);
  await play(page,entry).tap();
  await page.waitForFunction(()=>document.querySelector('.di-video-card video')?.currentTime>8);
  await page.waitForFunction(()=>document.querySelector('.di-video-card video')?.currentTime<2);
  if(await card.locator('video').evaluate(v=>v.paused)){
   await card.getByRole('button',{name:'Resume preview for '+entry.name}).tap();
  }
  await page.waitForFunction(()=>document.querySelector('.di-video-card video')?.currentTime>2);
  console.log('WebKit advanced into the second loop with inline playback controls');
 }finally{await engine.close();}
}
try{
 for(const kbps of [1000,500])await Promise.all(catalog.templates.map(entry=>throughLoop(entry,kbps)));
 await interruption(false);await interruption(true);
 const desktop=await newPage({viewport:{width:1280,height:800}});await play(desktop,wedding).click();
 assert.equal(await cardFor(desktop,wedding).locator('video').getAttribute('src'),wedding.preview);
 await desktop.close();
 await webkitLoop();
}finally{await browser.close();await site.close();}
