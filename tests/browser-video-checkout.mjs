import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {chromium} from 'playwright-core';
const source=await readFile('src/payments.ts','utf8'),start=source.indexOf('let checkoutScript:'),end=source.indexOf('\nfunction rememberedPayment');
const js=ts.transpileModule(source.slice(start,end).replace('export function','function')+'\nwindow.loadRazorpay=loadRazorpay;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const browser=await chromium.launch({executablePath:process.env.VIDEO_CHROMIUM_PATH||undefined});
try{const page=await browser.newPage();let requests=0;
 await page.route('https://checkout.razorpay.com/v1/checkout.js',route=>{requests++;return requests===1?route.abort():route.fulfill({contentType:'application/javascript',body:'window.Razorpay=function(){};'});});
 await page.setContent('<!doctype html><title>Checkout loader regression</title>');await page.addScriptTag({content:js});
 const failure=await page.evaluate(()=>window.loadRazorpay().then(()=>'',e=>e.message));assert.match(failure,/draft is saved/);
 assert.equal(await page.locator('script[src*="checkout.razorpay.com"]').count(),0);
 assert.equal(await page.evaluate(async()=>{await Promise.all([window.loadRazorpay(),window.loadRazorpay()]);return typeof window.Razorpay;}),'function');assert.equal(requests,2);
 console.log('A failed checkout script can retry; concurrent retries load one script.');
}finally{await browser.close();}
