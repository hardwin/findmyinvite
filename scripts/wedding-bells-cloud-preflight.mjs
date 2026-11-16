// Reproducible qualification of the immutable tracked-film worker. No customer data.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {renderPersonalizedVideo,command,probe,digest,verifyVideo} from './render-personalized-video.mjs';
import {referenceContent} from '../shared/wedding-bells-video.mjs';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
const master=JSON.parse(await readFile('public/assets/video-masters/wedding-bells-v1/manifest.json'));
const directory='/tmp/wedding-bells-qa';await mkdir(directory,{recursive:true});
const personal={...referenceContent,groom:'Daniel Joseph',bride:'Maria Mathew',groomShort:'Daniel',brideShort:'Maria',groomFather:'Joseph Daniel',groomMother:'Susan Joseph',brideFather:'Mathew Thomas',brideMother:'Mary Mathew',receptionDate:'2027-02-14',weddingDate:'2027-02-15'};
const result={rendererVersion:master.rendererVersion,createdAt:new Date().toISOString(),vcpus:4,renders:{}};
async function packets(file){return JSON.parse(await command(ffprobe.path,['-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=pts_time,duration_time,size,data_hash','-of','json',file])).packets;}
const originalPackets=await packets('public/assets/music-library/wedding-bells-original.m4a');
for(const [name,details] of Object.entries({default:referenceContent,personalized:personal})){
 const content={...details,music:{mode:'library',id:'wedding-bells-original'}};
 const output=directory+'/'+name+'.mp4',start=Date.now();let last=-1;
 const resumed=name==='default'&&process.argv.includes('--resume-default');
 const verification=resumed?await verifyVideo(output,{audio:true,output:master.output}):await renderPersonalizedVideo({master,content,output,requireRelease:false,onProgress:p=>{const n=Math.floor(p/20);if(n!==last){last=n;console.log(name+': '+p+'%');}}});
 const info=await probe(output),audio=info.streams.find(s=>s.codec_type==='audio');if(audio?.codec_name!=='aac')throw Error('Missing original audio');
 // ADTS container bytes differ across FFmpeg versions. Compare every original
 // packet payload and timestamp directly, including priming and the complete tail.
 const audioPackets=await packets(output);if(JSON.stringify(audioPackets)!==JSON.stringify(originalPackets))throw Error('Original audio changed');
 result.renders[name]={...verification,elapsedSeconds:resumed?null:(Date.now()-start)/1000,resumedCompletedRender:resumed,audioPackets:audioPackets.length,audioPacketPayloadHash:digest(Buffer.from(audioPackets.map(p=>p.data_hash).join('|')))};
 await command(ffmpeg,['-v','error','-y','-ss','1.9','-i',output,'-frames:v','1',directory+'/'+name+'-board.jpg']);
 await writeFile(directory+'/verification.json',JSON.stringify(result,null,2));console.log(name+' passed');
}
console.log(JSON.stringify(result));
