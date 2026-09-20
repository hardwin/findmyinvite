// Run against the local FMI demo: node scripts/capture-catalogue.cjs
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const origin=process.env.CAPTURE_ORIGIN||'http://127.0.0.1:5173';
const out=path.resolve('public/assets/catalogue/v1'),raw=path.resolve('../../work/catalogue-capture');
const ids=['royal-sanctuary','royal-heritage-wedding','royal-temple','rose-gold-blush-royal','royal-majesty','modern-minimal-royal','royal-prestige','royal-heritage','royal-heritage-1','royal-heritage-2','royal-heritage-3','royal-grace','royal-crest','royal-legacy'];
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(raw,{recursive:true});
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const manifest={};try{for(const id of ids){
 const context=await browser.newContext({viewport:{width:480,height:854},deviceScaleFactor:1,recordVideo:{dir:raw,size:{width:480,height:854}},reducedMotion:'no-preference'});
 const page=await context.newPage();await page.route('**/api/analytics**',r=>r.fulfill({status:204}));
 await page.goto(origin+'/invite/demo?template='+id,{waitUntil:'networkidle'});
 await page.addStyleTag({content:'.sound-toggle,.language-toggle,.use-design,.skip-opening{visibility:hidden!important}body>div>div>a[style]{visibility:hidden!important}'});
 const embedded=['royal-sanctuary','royal-heritage-wedding','royal-temple'].includes(id);
 if(embedded)await page.locator('iframe').waitFor({timeout:15000});
 const frame=embedded?await page.locator('iframe').elementHandle().then(h=>h.contentFrame()):page.mainFrame();
 await frame.evaluate(()=>document.fonts.ready);
 await frame.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.readyState>=2),{},{timeout:20000});
 await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>{v.muted=true;}));
 // Trim loading time from the recording using its wall-clock offset.
 await page.screenshot({path:path.join(raw,id+'-closed.png')});
 const captureStart=Date.now();
 await page.waitForTimeout(250);
 let duration=8;
 if(id==='royal-sanctuary')await frame.locator('#open-invitation').click({force:true});
 else if(id==='royal-heritage-wedding')await frame.locator('#open').click({force:true});
 else if(id==='royal-temple'){
  await frame.evaluate(()=>{window.scrollTo({top:Math.round(innerWidth*0.7),behavior:'smooth'});});
 }else{
  const seconds=await frame.locator('video').first().evaluate(v=>v.duration);
  duration=Math.min(15,seconds+2.25);
  await page.getByRole('button',{name:'Open invitation',exact:true}).click();
 }
 await page.waitForTimeout((duration-.25)*1000);
 await page.screenshot({path:path.join(raw,id+'-revealed.png')});
 const video=page.video();await context.close();const input=await video.path();
 const total=Number(probe(input).format.duration),elapsed=(Date.now()-captureStart)/1000;
 const offset=Math.max(0,total-elapsed);
 const output=path.join(out,id+'.mp4');
 const args=['-y','-ss',String(offset),'-i',input,'-t',String(duration),'-an','-vf','scale=480:854,fps=24','-c:v','libx264','-preset','medium','-pix_fmt','yuv420p','-crf','27','-maxrate','650k','-bufsize','1300k','-movflags','+faststart',output];
 execFileSync('ffmpeg',args,{stdio:'ignore'});
 if(fs.statSync(output).size>1200000){args[args.indexOf('27')]='30';args[args.indexOf('650k')]='550k';execFileSync('ffmpeg',args,{stdio:'ignore'});}
 if(fs.statSync(output).size>1200000)throw Error(id+' exceeds preview size ceiling');
 execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,duration-1)),'-i',output,'-frames:v','1','-quality','78',path.join(out,id+'.webp')],{stdio:'ignore'});
 const info=probe(output);if(info.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected audio');
 manifest[id]={src:'/assets/catalogue/v1/'+id+'.mp4',poster:'/assets/catalogue/v1/'+id+'.webp',width:480,height:854,duration:Number(info.format.duration),bytes:fs.statSync(output).size,version:1};
 console.log(id,manifest[id].bytes,manifest[id].duration);
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
