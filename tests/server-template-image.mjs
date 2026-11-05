import test from 'node:test';
import assert from 'node:assert/strict';
import {optimise,IMAGE_UPLOAD_BYTES,IMAGE_SOURCE_BYTES} from '../shared/template-image.mjs';
import {uploadTemplateMedia} from '../shared/template-upload.mjs';
import {matchesMediaType} from '../server/template-file-validation.mjs';

const signatures={
 'image/png':Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]),
 'image/jpeg':Buffer.from([255,216,255,224,0,0,0,0,0,0,0,0]),
 'image/webp':Buffer.from('RIFF0000WEBP')
};
function encoded(type,size=100){return new Blob([signatures[type],new Uint8Array(Math.max(0,size-12))],{type});}
const photo=(type='image/jpeg',size=100)=>new File([encoded(type,size)],'phone.photo.jpg',{type,lastModified:12345});
function browser(encode,{width=4032,height=3024,bitmapFails=false,imageFails=false}={}){
 const calls=[],cleaned={bitmap:0,urls:0},sources=[];
 const canvas={width:0,height:0,getContext:()=>({clearRect(){},fillRect(){},drawImage(){}}),toBlob(callback,type,quality){calls.push({type,quality,width:canvas.width,height:canvas.height});callback(encode(type,quality,canvas));}};
 const env={document:{createElement:()=>canvas},createImageBitmap:async file=>{sources.push(file);if(bitmapFails)throw Error('Decoder unavailable');return {width,height,close:()=>cleaned.bitmap++};},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>cleaned.urls++},Image:class {naturalWidth=width;naturalHeight=height;set src(value){if(value)queueMicrotask(()=>imageFails?this.onerror():this.onload());}}};
 return {env,calls,cleaned,canvas,sources};
}
async function valid(file){assert.ok(file.size>0&&file.size<=IMAGE_UPLOAD_BYTES);assert.ok(matchesMediaType(await file.arrayBuffer(),file.type));assert.ok(file.name.endsWith({['image/jpeg']:'.jpg',['image/png']:'.png',['image/webp']:'.webp'}[file.type]));}

test('Safari PNG fallback keeps its actual MIME and extension',async()=>{
 const b=browser(()=>encoded('image/png'));const result=await optimise(photo(),'image',b.env);
 await valid(result);assert.equal(result.type,'image/png');assert.equal(result.name,'phone.photo.png');assert.equal(result.lastModified,12345);assert.equal(b.cleaned.bitmap,1);assert.equal(b.canvas.width,0);
});
test('large Safari PNG fallback switches to compressed JPEG',async()=>{
 const b=browser(type=>encoded(type==='image/webp'?'image/png':type,type==='image/webp'?4*IMAGE_UPLOAD_BYTES:400000));
 const result=await optimise(photo('image/jpeg',8*IMAGE_UPLOAD_BYTES),'image',b.env);
 await valid(result);assert.equal(result.type,'image/jpeg');assert.deepEqual(b.calls.map(c=>c.type),['image/webp','image/jpeg']);assert.equal(b.calls[1].width,1800);assert.equal(b.calls[1].height,1350);
});
test('large phone photos reduce quality before reducing dimensions',async()=>{
 const b=browser((type,quality)=>encoded(type,quality>.76?1500000:700000));
 await valid(await optimise(photo(),'image',b.env));assert.deepEqual(b.calls.map(c=>c.quality),[.86,.76]);assert.ok(b.calls.every(c=>c.width===1800));
});
test('very detailed photos reduce dimensions if quality adjustments are insufficient',async()=>{
 const b=browser((type,quality,canvas)=>encoded(type,canvas.width>=1800?1500000:900000));
 await valid(await optimise(photo(),'image',b.env));assert.deepEqual(b.calls.map(c=>c.width),[1800,1800,1800,1350]);
});
test('PNG-only browsers reduce dimensions instead of relying on ineffective quality',async()=>{
 const b=browser((type,quality,canvas)=>encoded('image/png',canvas.width>=1800?1500000:800000));
 const result=await optimise(photo(),'image',b.env);await valid(result);assert.equal(result.type,'image/png');assert.equal(b.calls.at(-1).width,1350);
});
test('missing MIME and older incorrectly labelled staged files are sniffed before decoding',async()=>{
 for(const type of ['', 'image/webp']){
  const b=browser(()=>encoded('image/webp'));
  await valid(await optimise(new File([encoded('image/png')],'old.webp',{type}),'image',b.env));
  assert.equal(b.sources[0].type,'image/png');
 }
});
test('small photos are not enlarged',async()=>{
 const b=browser(()=>encoded('image/webp'),{width:200,height:100});await valid(await optimise(photo(),'image',b.env));assert.equal(b.calls[0].width,200);assert.equal(b.calls[0].height,100);
});
test('portrait orientation and aspect ratio are retained',async()=>{
 const b=browser(()=>encoded('image/webp'),{width:3024,height:4032});await valid(await optimise(photo(),'image',b.env));assert.equal(b.calls[0].width,1350);assert.equal(b.calls[0].height,1800);
});
test('image element fallback works when ImageBitmap cannot decode',async()=>{
 const b=browser(()=>encoded('image/jpeg'),{bitmapFails:true});await valid(await optimise(photo(),'image',b.env));assert.equal(b.cleaned.urls,1);
});
test('failed decoding gives actionable guidance and releases its object URL',async()=>{
 const b=browser(()=>encoded('image/jpeg'),{bitmapFails:true,imageFails:true});await assert.rejects(optimise(photo(),'image',b.env),/JPG, PNG or WebP/);assert.equal(b.cleaned.urls,1);assert.equal(b.calls.length,0);
});
test('empty and over-50MB files fail before allocating a decoder',async()=>{
 const b=browser(()=>encoded('image/jpeg'));
 await assert.rejects(optimise(new File([],'empty.jpg'),'image',b.env),/empty/);
 await assert.rejects(optimise({size:IMAGE_SOURCE_BYTES+1},'image',b.env),/50 MB/);assert.equal(b.sources.length,0);
});
test('failed encoding releases resources and has bounded retries',async()=>{
 const b=browser(()=>null);await assert.rejects(optimise(photo(),'image',b.env),/reopen this page/);assert.equal(b.cleaned.bitmap,1);assert.equal(b.canvas.width,0);assert.ok(b.calls.length<=25);
});
test('audio and video bypass photo conversion',async()=>{
 for(const kind of ['audio','video']){const file=photo();assert.equal(await optimise(file,kind,{}),file);}
});
test('corrected browser output passes the existing storage verification before becoming an answer',async()=>{
 const b=browser(type=>encoded(type==='image/webp'?'image/png':type,type==='image/webp'?1500000:200000));let stored,complete=false;
 const result=await uploadTemplateMedia({file:photo(),kind:'image',slug:'test-draft',optimise:(file,kind)=>optimise(file,kind,b.env),token:async()=> 'test-token',upload:async(path,file,options)=>{stored=file;assert.equal(options.contentType,file.type);},api:async path=>{if(path.includes('reserve'))return {id:'test',pathname:'private/test',url:'verified-url'};await valid(stored);complete=true;}});
 assert.equal(result,'verified-url');assert.ok(complete);
});
