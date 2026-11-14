import sharp from 'sharp';
import {prepareVideoPhoto} from './video-personalise-cloud.mjs';
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
