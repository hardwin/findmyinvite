import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {BLACK_FRIDAY_START,BLACK_FRIDAY_END,videoOffer} from '../shared/video-pricing.mjs';

// Exercise the three customer surfaces against a deliberately stale catalog row.
const {outputFiles}=await build({
 stdin:{loader:'tsx',resolveDir:process.cwd(),contents:`
  import {createRoot} from 'react-dom/client';
  import {VideoCard} from './src/video/VideoCollection';
  import VideoTemplateDetails from './src/video/VideoTemplateDetails';
  import {VideoCheckout} from './src/video/VideoCheckout';
  const entry={id:'film-anbil-avan-v1',name:'Anbil Avan',poster:'/poster.jpg',preview:'/demo.mp4',duration:35,amount:35282,quote:{basePaise:29900},originalPaise:0,offerLabel:''};
  createRoot(document.querySelector('main')).render(<><VideoCard entry={entry}/><VideoTemplateDetails entry={entry}/><VideoCheckout templateId={entry.id} purchase={null} busy={false} onApply={async()=>{}}/></>);
 `},
 bundle:true,write:false,jsx:'automatic',outfile:'fixture.js',external:['/assets/*'],define:{'process.env.NODE_ENV':'"production"'}
});
const script=outputFiles.find(file=>file.path.endsWith('.js')).text;
const css=await readFile(new URL('../src/discovery.css',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH});
try{
 for(const [width,timezoneId] of [[390,'Asia/Kolkata'],[1280,'America/New_York']]){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId});
  const page=await context.newPage();
  await page.clock.install({time:new Date(BLACK_FRIDAY_START-10000)});
  await page.clock.pauseAt(new Date(BLACK_FRIDAY_START-1000));
  await page.route('https://offer.test/**',route=>route.fulfill(route.request().resourceType()==='document'
   ?{contentType:'text/html',body:'<link rel="stylesheet" href="/discovery.css"><main></main><script src="/fixture.js"></script>'}
   :route.request().resourceType()==='stylesheet'?{contentType:'text/css',body:css}
   :route.request().resourceType()==='script'?{contentType:'text/javascript',body:script}:{status:404}));
  await page.goto('https://offer.test');
  const timers=page.getByRole('timer');
  await page.getByLabel('Payment options').waitFor();
  assert.equal(await timers.count(),0);
  await page.clock.fastForward(1000);
  await timers.first().waitFor();
  assert.deepEqual(await timers.allTextContents(),Array(3).fill('Ends in 48h 00m 00s'));
  assert.deepEqual(await page.locator('del').allTextContents(),Array(3).fill('₹699'));
  await page.clock.fastForward(125000);
  await page.reload();
  await timers.first().waitFor();
  assert.deepEqual(await timers.allTextContents(),Array(3).fill('Ends in 47h 57m 55s'));
  await page.clock.fastForward(BLACK_FRIDAY_END-BLACK_FRIDAY_START-126000);
  assert.deepEqual(await timers.allTextContents(),Array(3).fill('Ends in 00h 00m 01s'));
  await page.clock.fastForward(1000);
  await timers.first().waitFor({state:'detached'});
  assert.equal(await page.locator('del').count(),0);
  assert.equal(await page.getByText('Black Friday offer',{exact:true}).count(),0);
  const endPrice=videoOffer('film-anbil-avan-v1',BLACK_FRIDAY_END).basePaise/100;
  assert.equal(await page.getByLabel('Price ₹'+endPrice,{exact:true}).count(),3);
  await context.close();
 }
 console.log('Black Friday card, detail and checkout timers passed across refresh, time zones and expiry.');
}finally{await browser.close();}
