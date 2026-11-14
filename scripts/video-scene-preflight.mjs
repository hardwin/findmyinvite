// Offline verification only: never approves a master or writes customer records.
import fs from 'node:fs/promises';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {prepareSceneMaster} from '../server/video-scene-details.mjs';
import {renderSceneVideo} from './render-scene-video.mjs';
const full=process.argv.includes('--full'),selected=new Set(process.argv.slice(2).filter(a=>a!=='--full'));
for(const name of selected)if(!VIDEO_CATALOG.some(d=>d.design===name||d.id===name))throw Error('Unknown design: '+name);
const directory='work/video-scene-preflight';await fs.mkdir(directory,{recursive:true});
let failures=0;
for(const definition of VIDEO_CATALOG){
 if(selected.size&&!selected.has(definition.design)&&!selected.has(definition.id))continue;
 const content=structuredClone(definition.example);
 for(const [key,value] of Object.entries(content))if(typeof value==='string'&&/^\d{4}-\d\d-\d\d$/.test(value)&&Number(value.slice(0,4))<=new Date().getFullYear())content[key]=String(new Date().getFullYear()+1)+value.slice(4);
 const master=await prepareSceneMaster(JSON.parse(await fs.readFile('public/assets/video-masters/'+definition.id+'/manifest.json')),content);
 const reviewFrames=[...new Set([0,...master.scenes.map(s=>s.reviewFrame),master.output.frames-1])];
 const started=Date.now();
 try{
  const result=await renderSceneVideo({master,content,output:directory+'/'+definition.design+(full?'.mp4':''),...(full?{}:{reviewFrames}),requireRelease:false,onProgress:value=>console.log(definition.design,value+'%')});
  await fs.writeFile(directory+'/'+definition.design+'.json',JSON.stringify({id:definition.id,full,sceneBundleSha256:master.assets.sceneBundle.sha256,seconds:(Date.now()-started)/1000,result},null,2));
  console.log('PASS',definition.design);
 }catch(error){failures++;console.error('FAIL',definition.design,error.message);}
}
if(failures)process.exitCode=1;
