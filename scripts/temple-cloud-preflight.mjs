// Qualification uses public sample details only; it does not create orders or drafts.
import fs from 'node:fs/promises';
import {renderPersonalizedVideo,command} from './render-personalized-video.mjs';
import ffmpeg from 'ffmpeg-static';
import {TEMPLE_DEFAULTS} from '../shared/temple-video.mjs';
import {videoPreviewContent} from '../shared/video-preview-content.mjs';
const root='/tmp/temple-v2-qa';await fs.mkdir(root,{recursive:true});
const master=JSON.parse(await fs.readFile('public/assets/video-masters/temple-v1/manifest-v2.json'));
const renders={};
for(const [name,content] of Object.entries({default:TEMPLE_DEFAULTS,personalized:videoPreviewContent('temple-v1')})){
 const start=Date.now();renders[name]=await renderPersonalizedVideo({master,content,requireRelease:false,output:root+'/'+name+'.mp4',onProgress:p=>{if(p%10===0)console.log(name+' '+p+'%');}});
 renders[name].elapsedSeconds=(Date.now()-start)/1000;
 await command(ffmpeg,['-v','error','-i',root+'/'+name+'.mp4','-f','null','-']);
 await command(ffmpeg,['-v','error','-y','-i',root+'/'+name+'.mp4','-vf',"select='"+master.scenes.map(s=>'eq(n,'+s.reviewFrame+')').join('+')+"',scale=180:320,tile=5x2",'-frames:v','1',root+'/'+name+'-scenes.jpg']);
 await fs.writeFile(root+'/verification.json',JSON.stringify({renders,completeDecodePassed:true,masterVersion:master.version,rendererVersion:master.rendererVersion},null,2));
}
console.log('Both full Temple exports passed.');
