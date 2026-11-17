import sharp from 'sharp';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError} from './core.mjs';
import {readPublicBytes} from './template-share.mjs';
import {templateShareCardHtml} from '../shared/template-share-card.mjs';

const images=new Map();let assetsPromise,renderQueue=Promise.resolve();
async function embeddedAssets(){
 assetsPromise??=Promise.all([
  ['logo','/assets/findmyinvite-logo-transparent.png','image/png'],
  ['regular','/assets/fonts/discovery/montserrat-static-400.woff2','font/woff2'],
  ['bold','/assets/fonts/discovery/montserrat-static-700.woff2','font/woff2']
 ].map(async([key,path,type])=>[key,'data:'+type+';base64,'+(await readFile(join(process.cwd(),'public',path))).toString('base64')])).then(Object.fromEntries).catch(error=>{assetsPromise=undefined;throw error;});
 return assetsPromise;
}
export async function renderTemplateShareImage(entry,poster){
 const assets=await embeddedAssets();
 const thumbnail=await sharp(poster,{limitInputPixels:40000000}).rotate().resize({width:660,withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
 const html=templateShareCardHtml(entry,{...assets,poster:'data:image/jpeg;base64,'+thumbnail.toString('base64')});
 const executablePath=process.env.SHARE_CHROMIUM_PATH||(process.platform==='win32'?(await import('playwright-core')).chromium.executablePath().replace('chromium-','chromium_headless_shell-').replace(/chrome\.exe$/,'headless_shell.exe'):await chromium.executablePath());
 const browser=await puppeteer.launch({executablePath,args:process.platform==='win32'?[]:chromium.args,headless:true});
 try{
  const page=await browser.newPage();await page.setViewport({width:1200,height:630,deviceScaleFactor:1});await page.setJavaScriptEnabled(false);
  // Only controlled HTML and embedded assets; no remote requests or scripts.
  await page.setRequestInterception(true);page.on('request',request=>request.url().startsWith('data:')?request.continue():request.abort());
  await page.setContent(html,{waitUntil:'load',timeout:15000});
  await page.evaluate(async()=>{
   await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));
   const title=document.querySelector('h1');let size=44;
   const copy=document.querySelector('.copy');
   while((title.scrollHeight>100||copy.scrollHeight>580)&&size>24)title.style.fontSize=--size+'px';
  });
  let bytes=Buffer.from(await page.screenshot({type:'jpeg',quality:84}));
  if(bytes.length>500000)bytes=Buffer.from(await page.screenshot({type:'jpeg',quality:65}));
  return bytes;
 }finally{await browser.close();}
}
export async function templateShareImage(entry,origin){
 const key=origin+':'+entry.revision,hit=images.get(key);if(hit&&hit.until>Date.now())return hit.promise;
 const promise=(async()=>{
  const response=await fetch(origin+entry.poster,{redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!/^image\/(jpeg|png|webp|avif)(?:;|$)/i.test(response.headers.get('content-type')||''))throw new HttpError(503,'Template artwork unavailable.');
  const poster=await readPublicBytes(response,8000000);
  const task=renderQueue.then(()=>renderTemplateShareImage(entry,poster));renderQueue=task.catch(()=>{});return task;
 })().catch(error=>{images.delete(key);throw error;});
 if(images.size>=48)images.delete(images.keys().next().value);images.set(key,{promise,until:Date.now()+300000});return promise;
}
