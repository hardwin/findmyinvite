import sharp from 'sharp';
import {prepareVideoPhoto} from './video-personalise-cloud.mjs';
export async function coupleIdentityReference(groom,bride){
 const background={r:0,g:0,b:0,alpha:0};
 const panels=await Promise.all([groom,bride].map(bytes=>sharp(bytes,{limitInputPixels:16000000}).rotate().resize(720,1280,{fit:'contain',background}).png().toBuffer()));
 return sharp({create:{width:1440,height:1280,channels:4,background}}).composite(panels.map((input,i)=>({input,left:i*720,top:0}))).png().toBuffer();
}
export async function characterBounds(bytes){
 const {data,info}=await sharp(bytes,{limitInputPixels:16000000}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1,clear=0,solid=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a<20)clear++;if(a>20){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);solid++;}}
 return {width:info.width,height:info.height,clear:clear/(info.width*info.height),solid:solid/(info.width*info.height),box:{left,top,width:right-left+1,height:bottom-top+1}};
}
export async function alignCharacter(bytes,reference,{removeBackground=prepareVideoPhoto}={}){
 let source=await characterBounds(bytes);
 if(source.clear<.08){bytes=await removeBackground(bytes);source=await characterBounds(bytes);}
 if(source.clear<.08||source.solid<.025||source.solid>.9||source.box.width<40||source.box.height<100)throw Error('The character did not have a usable transparent outline. Please retry.');
 const target=await characterBounds(reference),b=target.box,s=source.box;
 const scale=Math.min(b.width/s.width,b.height/s.height),width=Math.max(1,Math.round(s.width*scale)),height=Math.max(1,Math.round(s.height*scale));
 const cut=await sharp(bytes).ensureAlpha().extract(s).resize(width,height,{kernel:'lanczos3'}).png().toBuffer();
 const left=Math.round(b.left+(b.width-width)/2),top=b.top+b.height-height;
 const output=await sharp({create:{width:720,height:1280,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left,top}]).png().toBuffer();
 const result=await characterBounds(output);if(result.width!==720||result.height!==1280||Math.abs(result.box.top+result.box.height-b.top-b.height)>2)throw Error('Character alignment could not be verified.');
 return {bytes:output,alignment:{source:source.box,target:b,placed:result.box,width:720,height:1280}};
}
// Character-set profiles: a rejected generation is a quality failure (retried with a
// fresh bounded attempt), not a transfer failure.
const qualityError=message=>Object.assign(Error(message),{code:'CHARACTER_QUALITY'});
export const toPng=bytes=>sharp(bytes,{limitInputPixels:16000000}).rotate().png().toBuffer();
// Private browser derivatives keep the exact canvas aspect ratio. Full-resolution
// prepared PNGs remain the immutable inputs for the exported film.
export async function characterPreview(bytes){
 const {width,height}=await sharp(bytes,{limitInputPixels:16000000}).metadata();
 const gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(width,height),w=width/g,h=height/g,k=Math.max(1,Math.min(g,Math.floor(Math.min(720/w,1280/h))));
 return sharp(bytes,{limitInputPixels:16000000}).resize(w*k,h*k).webp({quality:85,alphaQuality:100}).toBuffer();
}
/** Alpha-mask agreement (intersection over union) at a small common resolution. */
export async function silhouetteAgreement(a,b,{width=96,height=120}={}){
 const mask=async bytes=>(await sharp(bytes,{limitInputPixels:16000000}).ensureAlpha().extractChannel(3).resize(width,height,{fit:'fill'}).raw().toBuffer());
 const [x,y]=await Promise.all([mask(a),mask(b)]);let inter=0,union=0;
 for(let i=0;i<x.length;i++){const p=x[i]>32,q=y[i]>32;if(p&&q)inter++;if(p||q)union++;}
 return union?inter/union:0;
}
// In the approved Reception illustration the heads are separated above the raised
// forearm. In the old over-the-shoulder pose this same window contains a head.
// Check alpha on the aligned canvas so hair colour and skin tone do not affect it.
export async function verifyReceptionSilhouette(bytes){
 const mask=await sharp(bytes).ensureAlpha().extractChannel(3).resize(112,140,{fit:'fill'}).raw().toBuffer();
 let clear=0,total=0;
 for(let y=21;y<38;y++)for(let x=46;x<52;x++){if(mask[y*112+x]<48)clear++;total++;}
 if(clear/total<.5)throw qualityError('The Reception couple must keep their heads apart above the raised arm.');
}
/** Place a generated pose onto the exact approved canvas: same size, footprint and baseline. */
export async function alignToReference(bytes,reference,{minSilhouette=.6}={}){
 const source=await characterBounds(bytes),target=await characterBounds(reference);
 if(source.clear<.04||source.solid<.02||source.box.width<40||source.box.height<60)throw qualityError('The character did not have a usable transparent outline.');
 const b=target.box,s=source.box,scale=Math.min(b.width/s.width,b.height/s.height),width=Math.max(1,Math.round(s.width*scale)),height=Math.max(1,Math.round(s.height*scale));
 const cut=await sharp(bytes,{limitInputPixels:16000000}).ensureAlpha().extract(s).resize(width,height,{kernel:'lanczos3'}).png().toBuffer();
 const left=Math.round(b.left+(b.width-width)/2),top=b.top+b.height-height;
 const output=await sharp({create:{width:target.width,height:target.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left,top}]).png().toBuffer();
 const silhouette=await silhouetteAgreement(output,reference);
 if(silhouette<minSilhouette)throw qualityError('The character moved away from the approved pose.');
 return {bytes:output,alignment:{source:s,target:b,placed:{left,top,width,height},width:target.width,height:target.height,silhouette:Math.round(silhouette*10000)/10000}};
}
/** Identity references are generation inputs only: decodable, bounded, PNG. */
export async function normalizeIdentity(bytes){
 const meta=await sharp(bytes,{limitInputPixels:16000000}).metadata();
 if(!meta.width||!meta.height||meta.width<128||meta.height<128)throw qualityError('The character reference was not usable.');
 const output=await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(1024,1536,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const info=await sharp(output).metadata();
 return {bytes:output,alignment:{width:info.width,height:info.height}};
}
