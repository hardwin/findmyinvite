// Encode review artifacts from the fully verified compositor PNGs. No publishing.
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import ffmpeg from 'ffmpeg-static';
import {command,verifyVideo} from './render-personalized-video.mjs';
const dir=resolve(process.argv[2]||'work/temple-alltracker-full');
const checks=JSON.parse(await readFile(resolve(dir,'verification.json'),'utf8'));
if(checks.frames!==1296||checks.outsideChangedPixels!==0||checks.approvedInvitationFramesIdentical!==98)throw Error('Full motion verification is incomplete');
for(const [input,output] of [['revised-frames/%05d.png','temple-revised-full.mp4'],['pairs/%05d.jpg','temple-full-comparison.mp4']]){
 await command(ffmpeg,['-y','-v','error','-framerate','24','-start_number','0','-i',resolve(dir,input),'-frames:v','1296','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',resolve(dir,output)]);
 await command(ffmpeg,['-v','error','-i',resolve(dir,output),'-f','null','-']);
}
const revised=await verifyVideo(resolve(dir,'temple-revised-full.mp4'));
const comparison=await verifyVideo(resolve(dir,'temple-full-comparison.mp4'),{output:{width:1080,height:712,fps:24,frames:1296,duration:54}});
await writeFile(resolve(dir,'encoded-verification.json'),JSON.stringify({revised,comparison,completeDecodePassed:true,comparisonSilent:true,sourceTimelineUnchanged:true},null,2));
console.log(JSON.stringify({revised,comparison},null,2));
