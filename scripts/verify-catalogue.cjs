const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
const out=path.resolve('../../work/catalogue-verification');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const counts=p=>p.evaluate(()=>({attached:document.querySelectorAll('video[src]').length,playing:[...document.querySelectorAll('video')].filter(v=>!v.paused).length}));
(async()=>{const browser=await chromium.launch({channel:process.env.TEST_BROWSER||'msedge',headless:true});const report={checks:[],samples:[]};try{
 if(process.argv.includes('--stress')){
  const p=await browser.newPage({viewport:{width:390,height:844}});
  await p.route('**/catalogue-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}</style></head><body></body></html>'}));
  await p.goto(origin+'/catalogue-fixture');
  await p.evaluate(async()=>{const {CataloguePlayback}=await import('/src/catalogue/playback.ts');const manifest=await fetch('/assets/catalogue/v1/manifest.json').then(r=>r.json());const media=Object.values(manifest)[0];document.body.style.cssText='margin:0;display:grid;grid-template-columns:1fr 1fr;gap:12px';window.controller=new CataloguePlayback();window.entries=[];for(let i=0;i<200;i++){const node=document.createElement('div');node.style.cssText='height:320px;position:relative;background:#ddd';const v=document.createElement('video');v.style.cssText='width:100%;height:100%;object-fit:cover';v.muted=true;v.loop=true;v.playsInline=true;document.body.append(node);window.entries.push(controller.register(node,media,()=>{}));}});
  const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');const system=await browser.newBrowserCDPSession();
  for(let i=0;i<=60;i++){
   if(i===20||i===40){await p.evaluate(()=>controller.configure(false,false));await sleep(100);assert.equal((await counts(p)).attached,0);await p.evaluate(()=>controller.configure(true,false));}
   await p.evaluate(i=>scrollTo(0,Math.floor((i%20<=10?i%20:20-i%20)*document.body.scrollHeight/10)),i);
   await sleep(5000);const c=await counts(p);assert.ok(c.attached<=6&&c.playing<=4,JSON.stringify(c));
   if(i%6===0){await cdp.send('HeapProfiler.collectGarbage');const metrics=await cdp.send('Performance.getMetrics');const processes=await system.send('SystemInfo.getProcessInfo');const ids=processes.processInfo.map(x=>x.id);const rss=Number(execFileSync('powershell.exe',['-NoProfile','-Command',`(Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum`],{encoding:'utf8'}).trim());const sample={seconds:i*5,...c,heap:metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value,browserWorkingSet:rss};report.samples.push(sample);console.log(JSON.stringify(sample));}
  }
  await p.evaluate(()=>{controller.destroy();document.body.replaceChildren();window.entries=[];window.controller=null;});await sleep(1000);assert.equal((await counts(p)).attached,0);report.checks.push('200 cards / five-minute scroll / bounded players / disposal');
  const settled=report.samples.find(s=>s.seconds>=120),last=report.samples.at(-1);report.memoryGate=last.browserWorkingSet<=settled.browserWorkingSet*1.1;assert.ok(report.memoryGate,'Browser process memory grew >10% after warm-up; hold production rollout and investigate.');
 }else{
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
   const p=await browser.newPage({viewport});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/templates');await p.waitForSelector('.template-card');await sleep(2500);
   await p.screenshot({path:path.join(out,viewport.width+'-catalogue.png')});let c=await counts(p);assert.ok(c.attached<=(viewport.width===390?6:8));assert.ok(c.playing>0);
   await p.waitForFunction(()=>document.querySelector('video').readyState>=3);await p.locator('video').first().evaluate(v=>v.currentTime=2);await sleep(100);const before=await p.locator('video').first().evaluate(v=>v.currentTime);await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await sleep(800);const far=await p.locator('.catalogue-media').first().evaluate(e=>e.getBoundingClientRect().bottom < -innerHeight);if(far)assert.equal(await p.locator('.catalogue-media').first().locator('video').count(),0);
   await p.evaluate(()=>scrollTo(0,0));await p.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=3&&!v.paused;});const resumed=await p.locator('video').first().evaluate(v=>v.currentTime);assert.ok(resumed>=before-.2,JSON.stringify({before,resumed}));report.checks.push('offscreen unloading and resume '+viewport.width);
   await p.getByRole('button',{name:'Pause previews',exact:false}).click();await sleep(150);assert.equal((await counts(p)).attached,0);
   await p.getByRole('button',{name:'Play previews',exact:false}).click();await sleep(500);
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal((await counts(p)).attached,0);
   await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await sleep(300);report.checks.push('Page Visibility pause and resume '+viewport.width);
   await p.getByRole('button',{name:'Use This Design',exact:false}).first().click();await sleep(100);assert.equal((await counts(p)).playing,0);assert.ok(await p.getByRole('link',{name:/Fill a Form/}).isVisible());assert.ok(await p.getByRole('link',{name:/Use the Editor/}).isVisible());await p.getByRole('button',{name:'Close editing options'}).click();
   await p.getByRole('tab',{name:'FindMyInvite Classics'}).click();await sleep(100);assert.equal((await counts(p)).attached,0);
   assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);report.checks.push('pause, modal, navigation, Classics, overflow, errors '+viewport.width);await p.close();
  }
  const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(origin+'/templates');await reduced.waitForSelector('.template-card');await sleep(300);assert.equal((await counts(reduced)).attached,0);report.checks.push('reduced motion');await reduced.close();
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked','NotAllowedError'));};});await blocked.goto(origin+'/templates');await blocked.waitForSelector('.catalogue-retry');assert.equal((await counts(blocked)).playing,0);report.checks.push('autoplay rejection poster fallback');await blocked.close();
  const failed=await browser.newPage();await failed.route('**/assets/catalogue/**/*.mp4',r=>r.abort());await failed.goto(origin+'/templates');await failed.waitForSelector('.catalogue-retry');assert.ok(await failed.locator('.catalogue-poster').first().isVisible());report.checks.push('failed media retains poster');await failed.close();
  const saver=await browser.newPage();await saver.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));await saver.goto(origin+'/templates');await saver.waitForSelector('.template-card');await sleep(250);assert.equal((await counts(saver)).attached,0);report.checks.push('Save-Data disables autoplay');await saver.close();
  const growth=await browser.newPage();await growth.route('**/api/content?kind=templates',r=>r.fulfill({json:{templates:Array.from({length:200},(_,i)=>({id:'sku-fixture-'+i,base_id:'royal-temple',name:'Variation '+i,collection:'royal',thumbnail:'/assets/temple/bg3.webp'}))}}));await growth.goto(origin+'/templates');await growth.getByRole('heading',{name:'Variation 0',exact:true}).waitFor();assert.equal(await growth.locator('.template-card').count(),24);assert.equal((await counts(growth)).attached,0);await growth.getByRole('button',{name:'Load more designs'}).click();assert.equal(await growth.locator('.template-card').count(),48);report.checks.push('24-card batches and SKU poster fallback');await growth.close();
 }
}finally{fs.writeFileSync(path.join(out,process.argv.includes('--stress')?'stress.json':'ui.json'),JSON.stringify(report,null,2));await browser.close();}console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exitCode=1;});
