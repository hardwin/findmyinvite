// Template 1 craft: ffmpeg mute / +3s hold / stills → 720x1280 / plates → section jpgs / palette extraction.
// Recipe source: KT_Assembly/docs/TEMPLATE1-CRAFTER-MACHINE-PACK.md (PR #27).
import {spawn} from 'node:child_process';
import {copyFile,mkdir,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError} from './core.mjs';
import {HOLD_SECONDS} from './assembly-template1-prompts.mjs';

export const FIT_9_16='scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2';

export function run(cmd,args,{input}={}){
 return new Promise((ok,fail)=>{
  const child=spawn(cmd,args,{stdio:[input?'pipe':'ignore','pipe','pipe'],windowsHide:true});
  const out=[];let stderr='';
  child.stdout.on('data',d=>out.push(d));
  child.stderr.on('data',d=>{stderr+=d;});
  child.on('error',fail);
  child.on('close',code=>code===0?ok({stdout:Buffer.concat(out),stderr}):fail(new Error((stderr||cmd+' failed').slice(-800))));
  if(input){child.stdin.end(input);}
 });
}

export async function probeMedia(path){
 const {stdout}=await run('ffprobe',['-v','error','-show_entries','stream=index,codec_type,codec_name,width,height,duration','-show_entries','format=duration','-of','json',path]);
 const data=JSON.parse(stdout.toString('utf8')||'{}');
 const streams=data.streams||[];
 const video=streams.find(s=>s.codec_type==='video')||{};
 return {
  width:Number(video.width)||0,
  height:Number(video.height)||0,
  duration:Number(video.duration||data.format?.duration||0)||0,
  audioStreams:streams.filter(s=>s.codec_type==='audio').length,
  videoStreams:streams.filter(s=>s.codec_type==='video').length
 };
}

export async function assertMuted(path,label='video'){
 const info=await probeMedia(path);
 if(info.videoStreams<1)throw new HttpError(500,label+' has no video stream.');
 if(info.audioStreams!==0)throw new HttpError(500,label+' still carries '+info.audioStreams+' audio stream(s). Craft must fail closed.');
 return info;
}

/** Raw provider still → 720x1280 PNG (+ optional JPEG for xAI data URIs). */
export async function toStill720({input,outPng,outJpg}){
 await run('ffmpeg',['-hide_banner','-y','-i',input,'-vf',FIT_9_16,'-frames:v','1','-update','1',outPng]);
 if(outJpg)await run('ffmpeg',['-hide_banner','-y','-i',outPng,'-frames:v','1','-update','1','-q:v','2',outJpg]);
 return {png:outPng,jpg:outJpg||''};
}

/** Opening: mute body → last frame → 3.0s hold @24fps → concat → opening.mp4. Intermediates removed. */
export async function craftOpening({sourceVideo,outDir,holdSeconds=HOLD_SECONDS}){
 await mkdir(outDir,{recursive:true});
 const body=join(outDir,'opening-body.mp4');
 const frame=join(outDir,'opening-last-frame.png');
 const hold=join(outDir,'opening-hold.mp4');
 const list=join(outDir,'opening-concat.txt');
 const out=join(outDir,'opening.mp4');
 try{
  await run('ffmpeg',['-hide_banner','-y','-i',sourceVideo,'-map','0:v:0','-an','-c:v','libx264','-pix_fmt','yuv420p','-r','24',body]);
  if(holdSeconds<=0){await copyFile(body,out);return {path:out,...await assertMuted(out,'opening.mp4')};}
  await run('ffmpeg',['-hide_banner','-y','-sseof','-0.05','-i',body,'-map','0:v:0','-frames:v','1','-update','1',frame]);
  await run('ffmpeg',['-hide_banner','-y','-loop','1','-i',frame,'-t',String(holdSeconds),'-r','24','-an','-c:v','libx264','-pix_fmt','yuv420p',hold]);
  await writeFile(list,"file '"+body.replace(/'/g,"'\\''")+"'\nfile '"+hold.replace(/'/g,"'\\''")+"'\n");
  await run('ffmpeg',['-hide_banner','-y','-f','concat','-safe','0','-i',list,'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out]);
 }finally{
  await Promise.all([body,frame,hold,list].map(p=>rm(p,{force:true})));
 }
 const info=await assertMuted(out,'opening.mp4');
 return {path:out,...info};
}

/** Hero: strip audio, keep native geometry (assemble pads to 720x1280). */
export async function craftHero({sourceVideo,outDir}){
 await mkdir(outDir,{recursive:true});
 const out=join(outDir,'hero.mp4');
 await run('ffmpeg',['-hide_banner','-y','-i',sourceVideo,'-map','0:v:0','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out]);
 const info=await assertMuted(out,'hero.mp4');
 return {path:out,...info};
}

/** plate1 → sections 1/2/3/5 (Scratch, Countdown, Venue, Pre-Wedding); plate2 → shared TAG plate-4. */
export async function stagePlates({plate1,plate2,id,root}){
 const assets=join(root,'public','assets');
 await mkdir(assets,{recursive:true});
 const written=[];
 for(const n of [1,2,3,5]){
  const out=join(assets,id+'-section-'+n+'.jpg');
  await run('ffmpeg',['-hide_banner','-y','-i',plate1,'-vf',FIT_9_16,'-frames:v','1','-update','1','-q:v','2',out]);
  written.push('public/assets/'+id+'-section-'+n+'.jpg');
 }
 const tag=join(assets,id+'-section-4.jpg');
 await run('ffmpeg',['-hide_banner','-y','-i',plate2,'-vf',FIT_9_16,'-frames:v','1','-update','1','-q:v','2',tag]);
 written.push('public/assets/'+id+'-section-4.jpg');
 return written;
}

export async function copyInto(src,dir,name){
 await mkdir(dir,{recursive:true});
 const out=join(dir,name);
 await copyFile(src,out);
 return out;
}

/* ---------- Palette ("font color") extraction ---------- */

function rgbToHsl(r,g,b){
 r/=255;g/=255;b/=255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b);
 const l=(max+min)/2;
 if(max===min)return {h:0,s:0,l};
 const d=max-min;
 const s=l>0.5?d/(2-max-min):d/(max+min);
 let h;
 if(max===r)h=((g-b)/d+(g<b?6:0))/6;
 else if(max===g)h=((b-r)/d+2)/6;
 else h=((r-g)/d+4)/6;
 return {h:h*360,s,l};
}

export function hex([r,g,b]){
 return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
}
export function mix(a,b,t){return [0,1,2].map(i=>a[i]*(1-t)+b[i]*t);}
export function darken(c,t){return mix(c,[0,0,0],t);}
export function lighten(c,t){return mix(c,[255,255,255],t);}

function hueDistance(a,b){const d=Math.abs(a-b)%360;return d>180?360-d:d;}

/** Pure-JS palette from RGB24 pixels: primary saturated hue, contrasting secondary, paper, ink. */
export function paletteFromPixels(pixels){
 const buckets=new Map();
 const light=[];const dark=[];
 for(let i=0;i+2<pixels.length;i+=3){
  const rgb=[pixels[i],pixels[i+1],pixels[i+2]];
  const {h,s,l}=rgbToHsl(...rgb);
  if(l>0.86&&s<0.25)light.push(rgb);
  if(l<0.28)dark.push(rgb);
  if(s<0.28||l<0.15||l>0.82)continue;
  const key=Math.round(h/20)*20%360;
  const b=buckets.get(key)||{h:key,w:0,px:[]};
  b.w+=s*s;
  b.px.push({rgb,s});
  buckets.set(key,b);
 }
 const ranked=[...buckets.values()].sort((a,b)=>b.w-a.w);
 // Represent a hue by its most saturated third so washes and shadows do not mud the swatch.
 const avg=b=>{
  const top=b.px.slice().sort((x,y)=>y.s-x.s).slice(0,Math.max(1,Math.ceil(b.px.length*0.3)));
  const sum=top.reduce((acc,p)=>[acc[0]+p.rgb[0],acc[1]+p.rgb[1],acc[2]+p.rgb[2]],[0,0,0]);
  return sum.map(v=>v/top.length);
 };
 const fallbackPrimary=[0x9B,0x21,0x58];
 const fallbackSecondary=[0x3F,0x5C,0x55];
 const primary=ranked[0]?avg(ranked[0]):fallbackPrimary;
 const contrast=ranked.find(b=>hueDistance(b.h,ranked[0]?.h??0)>=70);
 let secondary=contrast?avg(contrast):fallbackSecondary;
 // Secondary is body/subtitle ink: keep it deep enough to read on cream paper.
 const secL=rgbToHsl(...secondary).l;
 if(secL>0.45)secondary=darken(secondary,(secL-0.4)*1.4);
 const priL=rgbToHsl(...primary).l;
 const primaryInk=priL>0.5?darken(primary,(priL-0.42)*1.3):primary;
 const cream=light.length?light.reduce((a,c)=>mix(a,c,0.5),light[0]):[0xF7,0xF1,0xE8];
 const creamSafe=lighten(cream,0.35);
 const ink=dark.length?darken(mix(dark.reduce((a,c)=>mix(a,c,0.5),dark[0]),primaryInk,0.35),0.2):[0x3A,0x24,0x28];
 return {
  primary:hex(primaryInk),
  primaryDeep:hex(darken(primaryInk,0.28)),
  bloom:hex(lighten(primaryInk,0.28)),
  secondary:hex(secondary),
  secondaryDeep:hex(darken(secondary,0.28)),
  cream:hex(creamSafe),
  primaryWash:hex(mix(creamSafe,primaryInk,0.12)),
  secondaryWash:hex(mix(creamSafe,secondary,0.12)),
  ink:hex(ink)
 };
}

export async function extractPalette(imagePath){
 const {stdout}=await run('ffmpeg',['-hide_banner','-v','error','-i',imagePath,'-vf','scale=96:96:flags=area','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']);
 return paletteFromPixels(stdout);
}
