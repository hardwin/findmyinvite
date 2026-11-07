import {cachedShareImage,storeShareImage,shareImagePath} from './share-image-store.mjs';
import {readFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {get} from '@vercel/blob';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {db} from './core.mjs';
import {shareCardHtml,shareFont,sharePhoto,SHARE_STYLES} from '../shared/share-preview.mjs';

const assets=new Set([...Object.values(SHARE_STYLES).map(s=>s.art).filter(Boolean),...['en','ml','ta','te','kn','hi'].map(shareFont)]);
async function asset(path){
 if(!assets.has(path))throw Error('Unapproved card asset');
 const bytes=await readFile(join(process.cwd(),'public',path));
 const type={'.webp':'image/webp','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2'}[extname(path)];
 return 'data:'+type+';base64,'+bytes.toString('base64');
}
async function blobBytes(blob,limit){
 if(!blob||blob.statusCode!==200)throw Error('Image unavailable');
 const reader=blob.stream.getReader(),chunks=[];let length=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('Image too large');chunks.push(Buffer.from(value));}}finally{await reader.cancel();}
 return Buffer.concat(chunks);
}
export async function ownedSharePhoto(share){
 const ref=sharePhoto(share.content);if(!ref)return '';
 if(!share.row.template_version_id){const match=ref.match(/^\/api\/media\?slug=([a-z0-9-]{3,48})&slot=([0-7])$/);if(match&&match[1]===share.row.slug&&share.content.photos?.[0]===ref){const stored=await get('invitations/'+share.row.id+'/'+match[2],{access:'private',useCache:false});const type=stored?.blob?.contentType;if(!['image/jpeg','image/png','image/webp'].includes(type))throw Error('Unverified photo');return 'data:'+type+';base64,'+(await blobBytes(stored,1048576)).toString('base64');}}
 const id=ref.match(/^\/api\/template-media\?id=([a-f0-9-]{36})$/)?.[1];
 if(!id)throw Error('Unverified photo');
 const rows=await db('template_media?id=eq.'+id+'&select=*&limit=1'),media=rows[0];
 if(!media||media.invitation_id!==share.row.id||media.owner_id!==share.row.owner_id||media.kind!=='image'||media.status!=='ready'||!['image/jpeg','image/png','image/webp'].includes(media.content_type))throw Error('Unverified photo');
 const bytes=await blobBytes(await get(media.object_path,{access:'private',useCache:false}),1048576);
 return 'data:'+media.content_type+';base64,'+bytes.toString('base64');
}
export async function renderShareImage(details,photo=''){
 const font=await asset(shareFont(details.language)),art=details.style.art?await asset(details.style.art):'';
 const executablePath=process.env.SHARE_CHROMIUM_PATH||(process.platform==='win32'?(await import('playwright-core')).chromium.executablePath().replace('chromium-','chromium_headless_shell-').replace(/chrome\.exe$/,'headless_shell.exe'):await chromium.executablePath());
 const browser=await puppeteer.launch({executablePath,args:process.platform==='win32'?[]:chromium.args,headless:true});
 try{
  const page=await browser.newPage();await page.setViewport({width:1200,height:630,deviceScaleFactor:1});await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);page.on('request',request=>request.url().startsWith('data:')?request.continue():request.abort());
  await page.setContent(shareCardHtml(details,{font,art,photo}),{waitUntil:'load',timeout:15000});
  // Evaluate only our controlled layout, never customer code.
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));const heading=document.querySelector('h1');let size=parseFloat(getComputedStyle(heading).fontSize);while(heading.scrollHeight>246&&size>22){heading.style.fontSize=--size+'px';}});
  let bytes=Buffer.from(await page.screenshot({type:'jpeg',quality:82}));
  if(bytes.length>500000)bytes=Buffer.from(await page.screenshot({type:'jpeg',quality:60}));
  return bytes;
 }finally{await browser.close();}
}
export async function buildShareImage(share,{loadPhoto=ownedSharePhoto,render=renderShareImage,report=async()=>{await db('cms_audit',{method:'POST',body:{actor_id:share.row.owner_id,action:'share.photo_retry_needed',target:share.row.id,detail:{revision:share.revision}}});}}={}){
 try{return {bytes:await render(share.details,await loadPhoto(share)),fallback:false};}
 catch(error){if(!sharePhoto(share.content))throw error;console.error('Share photo fallback',share.row.id);const bytes=await render(share.details);await report().catch(()=>{});return {bytes,fallback:true};}
}
const pending=new Map();
export async function generatedShareImage(share){
 const cached=await cachedShareImage(share);if(cached)return {bytes:cached,rendered:false};
 const path=shareImagePath(share);if(pending.has(path))return pending.get(path);
 const task=(async()=>{const {bytes,fallback}=await buildShareImage(share);if(!fallback)await storeShareImage(share,bytes);return {bytes,rendered:true};})();pending.set(path,task);try{return await task;}finally{pending.delete(path);}
}
