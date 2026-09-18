const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5174';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const result=[];try{for(const width of [390,1440])for(const motion of [false,true]){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:motion?'no-preference':'reduce'});
 const cdp=await p.context().newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:500000,uploadThroughput:125000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.route('**/api/analytics**',r=>r.fulfill({status:204}));
 await p.addInitScript(()=>{window.vitals={lcp:0,cls:0,events:[]};new PerformanceObserver(l=>{for(const e of l.getEntries())window.vitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.interactionId)window.vitals.events.push(e.duration);}).observe({type:'event',buffered:true,durationThreshold:16});});
 await p.goto(origin+'/templates');await p.waitForSelector('.template-card');await p.waitForTimeout(6000);await p.getByRole('button',{name:/Use This Design/i}).first().click();await p.waitForTimeout(250);
 result.push({width,motion,...await p.evaluate(()=>({...vitals,mediaRequests:performance.getEntriesByType('resource').filter(r=>r.name.includes('/catalogue/')&&r.name.endsWith('.mp4')).length}))});await p.close();
}}finally{await browser.close();}fs.writeFileSync(path.resolve('../../work/catalogue-verification/performance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));})().catch(e=>{console.error(e);process.exitCode=1;});
