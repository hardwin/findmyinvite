// Review artifact only. Align reference chapters to the editable 54-second
// master without changing its customer timeline, schema, or renderer output.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {command} from './render-personalized-video.mjs';
import ffmpeg from 'ffmpeg-static';
const [reference,trial,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: node scripts/compare-temple-reference.mjs reference.mp4 trial.mp4 output-directory');
const directory=resolve(destination);await mkdir(directory,{recursive:true});
const svg=(w,h,body)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#f5eee4"/>${body}</svg>`);
await sharp(svg(960,44,'<g font-family="Arial" font-size="18" fill="#392b2b" text-anchor="middle"><text x="240" y="28">REFERENCE · aligned by scene</text><text x="720" y="28">REVISED · existing Temple layers</text></g>')).png().toFile(resolve(directory,'comparison-header.png'));
await sharp(svg(480,854,'<g font-family="Arial" font-size="22" fill="#392b2b" text-anchor="middle"><text x="240" y="380">The reference has no</text><text x="240" y="415">separate venue scene.</text><text x="240" y="465" font-size="17">Existing form content is retained.</text></g>')).png().toFile(resolve(directory,'venue-note.png'));
const chapters=[[0,2.9,5],[2.9,7.8,5],[7.8,11.8,5],[11.8,15.8,5],[15.8,20,5],[20,24.8,5],null,[24.8,32.6,5],[32.6,38.8,5],[38.8,43.9,9]];
const filters=['[0:v]split=9'+chapters.flatMap((s,i)=>s?[`[r${i}]`]:[]).join('')];
for(const [i,s] of chapters.entries())filters.push(s?`[r${i}]trim=start=${s[0]}:end=${s[1]},setpts=(PTS-STARTPTS)*${s[2]/(s[1]-s[0])},fps=24,scale=480:854,setsar=1,tpad=stop_mode=clone:stop_duration=1,trim=duration=${s[2]}[c${i}]`:'[3:v]fps=24,setsar=1,trim=duration=5,setpts=PTS-STARTPTS[c6]');
filters.push(chapters.map((_,i)=>`[c${i}]`).join('')+'concat=n=10:v=1:a=0[left]','[1:v]scale=480:854,setsar=1[right]','[left][right]hstack=inputs=2,pad=960:898:0:44[body]','[body][2:v]overlay=0:0:shortest=1[result]');
await command(ffmpeg,['-v','error','-y','-i',resolve(reference),'-i',resolve(trial),'-loop','1','-i',resolve(directory,'comparison-header.png'),'-loop','1','-i',resolve(directory,'venue-note.png'),'-filter_complex',filters.join(';'),'-map','[result]','-an','-t','54','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',resolve(directory,'temple-reference-comparison.mp4')]);
await writeFile(resolve(directory,'comparison-timeline.json'),JSON.stringify({purpose:'Scene-aligned visual comparison, not a replacement customer export',referenceDuration:43.9,trialDuration:54,referenceRetimed:true,audio:false,chapters},null,2));
console.log(resolve(directory,'temple-reference-comparison.mp4'));
