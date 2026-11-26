import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {chromium,webkit} from 'playwright-core';
import handler from '../api/video-personalise.mjs';
import {videoStore} from '../server/video-personalise-store.mjs';
import {deliveryLink} from '../server/video-delivery.mjs';

process.env.VIDEO_LOCAL_STORE='1';process.env.RATE_LIMIT_SECRET='test-delivery-secret-for-browser-verification';
const store=videoStore(),owner=randomUUID(),id='b'.repeat(64),attempt=randomUUID(),resultKey=`results/${owner}/${id}/${attempt}.mp4`,bytes=Buffer.from('ftyp-high-quality-test-file');
const {path}=deliveryLink({id,owner,attempt,resultKey,status:'ready'});
const {outputFiles}=await build({stdin:{loader:'tsx',resolveDir:process.cwd(),contents:`
import {createRoot} from 'react-dom/client';
import Page,{VideoDelivery} from './src/video/VideoDelivery';
import VideoOrderActions from './src/owner/VideoOrderActions';
createRoot(document.querySelector('main')).render(location.pathname==='/download/video'?<Page/>:location.pathname==='/admin'?<VideoOrderActions id="test-order"/>:<VideoDelivery jobId="test-job"/>);`},bundle:true,write:false,jsx:'automatic',outfile:'fixture.js',define:{'process.env.NODE_ENV':'"production"'}});
const script=outputFiles.find(x=>x.path.endsWith('.js')).text;
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');res.status=n=>{res.statusCode=n;return res;};res.json=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));};
 if(u.searchParams.get('action')==='assist-status')return res.json({templateId:'film-anbil-avan-v1',step:'review',job:{id,status:'ready'}});
 if(u.searchParams.get('action')==='delivery-link')return res.json({path});
 if(u.pathname==='/api/video-personalise')return handler(req,res);
 if(u.pathname==='/fixture.js'){res.setHeader('Content-Type','text/javascript');return res.end(script);}
 res.setHeader('Content-Type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><main></main><script src="/fixture.js"></script>');
});
await store.putBytes(resultKey,bytes,'video/mp4');await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const engine of [webkit,chromium]){
  const browser=await engine.launch();
  try{
   const inside=await browser.newContext({userAgent:engine===webkit?'Mozilla/5.0 (iPhone) Instagram 370':'Mozilla/5.0 (Linux; Android 14) Instagram 370',viewport:{width:390,height:844},isMobile:true});
   for(const denied of [false,true]){
    const page=await inside.newPage();await page.addInitScript(({denied})=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{if(denied)throw Error();window.copied=text;}}}),{denied});
    await page.goto(origin);await page.getByText('Open your video in Safari or Chrome').waitFor();await page.getByRole('button',{name:'Copy download link'}).click();
    if(denied){await page.getByText('Press and hold the selected link to copy it.').waitFor();assert.equal(await page.locator('input').evaluate(e=>e.selectionEnd-e.selectionStart),(origin+path).length);}
    else{await page.getByText('Link copied',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.copied),origin+path);}
    assert.equal(await page.getByRole('button',{name:'Download HD MP4'}).count(),0);await page.close();
   }
   await inside.close();const external=await browser.newContext({acceptDownloads:true});const page=await external.newPage();await page.goto(origin+path);
   await page.clock.install();await page.clock.fastForward('20:00');
   const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download HD MP4'}).click();assert.deepEqual(await readFile(await (await event).path()),bytes);
   await page.goto(origin+'/admin');await page.getByRole('link',{name:'Complete for customer'}).waitFor();assert.match(await page.getByRole('link',{name:'Complete for customer'}).getAttribute('href'),/assist=1/);await page.getByRole('button',{name:'Download HD MP4'}).waitFor();
   await page.goto(origin+'/download/video#invalid');await page.getByRole('heading',{name:'This video is no longer available'}).waitFor();
   console.log(engine.name()+' passed Instagram copy, manual copy, external save, admin controls and unavailable file');
  }finally{await browser.close();}
 }
}finally{server.close();await store.remove(resultKey);}
