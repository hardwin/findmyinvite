import fs from 'node:fs/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import sharp from 'sharp';
import {previewContent} from '../shared/preview-profiles.mjs';

const origin=process.env.CAPTURE_ORIGIN||'http://127.0.0.1:5177';
const catalog=await fetch(origin+'/api/templates?action=public').then(r=>r.json());
const selected=new Set(process.argv.slice(2));
const directory='public/assets/catalog-previews/names-v1/websites';
mkdirSync(directory,{recursive:true});mkdirSync('work/preview-names/websites',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});let result={};
try{result=JSON.parse(await fs.readFile('work/preview-names/website-media.json','utf8'));}catch{}
try{
 for(const template of catalog.templates){
  if(selected.size&&!selected.has(template.id))continue;
  const {version}=await fetch(origin+'/api/templates?action=version&id='+template.current_version_id).then(r=>r.json());
  const content=previewContent(version,'en');
  const page=await browser.newPage({viewport:{width:400,height:560},deviceScaleFactor:2,reducedMotion:'reduce'});
  try{
   await page.goto(origin+'/template-preview?version='+template.current_version_id+'&lang=en&thumbnail=1',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!document.querySelector('.invitation-reveal')&&!document.querySelector('.invitation-loading'));
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe')).every(frame=>frame.contentDocument?.readyState==='complete'));
   for(const frame of page.frames())await frame.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(1200);
   const texts=[];for(const frame of page.frames())texts.push(await frame.locator('body').innerText());
   const namesPresent=texts.join(' ').includes(content.groom)&&texts.join(' ').includes(content.bride);
   const image=await page.screenshot({path:`work/preview-names/websites/${template.id}.png`});
   const posters={};for(const width of [320,640,960]){const path=`${directory}/${template.id}-${width}.webp`;await sharp(image).resize(width).webp({quality:82}).toFile(path);posters[width]='/'+path.replace(/^public\//,'');}
   result[template.id]={poster:posters[640],posters,version:template.current_version_id,groom:content.groom,bride:content.bride,namesPresent};
   console.log(JSON.stringify({id:template.id,groom:content.groom,bride:content.bride,namesPresent}));
   await fs.writeFile('work/preview-names/website-media.json',JSON.stringify(result,null,2)+'\n');
  }finally{await page.close();}
 }
}finally{await browser.close();}
