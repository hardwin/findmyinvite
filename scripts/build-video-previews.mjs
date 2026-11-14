import {spawn} from 'node:child_process';
import {readFile,stat,writeFile} from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
const entries=['temple-v1',...VIDEO_CATALOG.map(d=>d.id)],report=[];
for(const id of entries){
 const root=`public/assets/video-masters/${id}/`,master=JSON.parse(await readFile(root+'manifest.json','utf8'));
 const input=root+(master.catalog?.preview||'demo-v1.mp4'),output=root+'catalog-preview-v2.mp4';
 const args=['-y','-i',input,'-an','-vf','scale=360:640:force_original_aspect_ratio=decrease,pad=360:640:(ow-iw)/2:(oh-ih)/2,fps=24','-c:v','libx264','-threads','2','-profile:v','baseline','-level','3.0','-preset','fast','-crf','27','-maxrate','700k','-bufsize','1400k','-pix_fmt','yuv420p','-movflags','+faststart',output];
 await new Promise((resolve,reject)=>{const p=spawn(ffmpeg,args,{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',b=>error=(error+b).slice(-2000));p.on('error',reject);p.on('exit',code=>code?reject(Error(error)):resolve());});
 const row={id,sourceBytes:(await stat(input)).size,previewBytes:(await stat(output)).size};report.push(row);console.log(JSON.stringify(row));
}
await writeFile('work/video-catalog/preview-delivery-v2.json',JSON.stringify(report,null,2));
