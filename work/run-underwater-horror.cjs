const fs=require('fs'),cp=require('child_process'),path=require('path');
const root='output/underwater-sea-horror-v1',file='Template_Wedding_UnderWaterSea_Horror.json',ff=path.join(process.env.TEMP,'fmi-ffmpeg.exe');
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)),read=p=>JSON.parse(fs.readFileSync(p));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function log(s){console.log(new Date().toISOString()+' '+s);}
function run(script,env){return new Promise((resolve,reject)=>{cp.execFile(process.execPath,['--use-system-ca',script],{env:{...process.env,...env},windowsHide:true,maxBuffer:4*1024*1024},(e,out,err)=>{if(out.trim())log(out.trim());if(e)reject(new Error(err||e.message));else resolve();});});}
function update(kind,index,fields){const t=read(file);Object.assign(t[kind][index-1],fields);save(file,t);save(root+'/'+file,t);}
async function images(start){
 for(let n=start;n<=11;n+=2){
  const base=root+'/image-'+n+'-take-1';
  if(!fs.existsSync(base+'.jpg')){
   log('Image '+n+' of 11: text-only Flare first take');
   await run('work/underwater-images.cjs',{V1_SCENE:String(n),V1_TAKE:'1',V1_ACTION:fs.existsSync(base+'-request.json')?'poll':'submit'});
   while(!fs.existsSync(base+'.jpg')){await pause(10000);await run('work/underwater-images.cjs',{V1_SCENE:String(n),V1_TAKE:'1',V1_ACTION:'poll'});}
  }
  fs.copyFileSync(base+'.jpg',root+'/image-'+n+'.jpg');
  update('scenes',n,{status:'generated-first-take',selected_take:1,image_path:'image-'+n+'.jpg',review_note:'No visual review or retake, as requested.'});
 }
}
async function videos(){
 for(let n=1;n<=11;n++){
  while(!fs.existsSync(root+'/image-'+n+'.jpg')||(n<11&&!fs.existsSync(root+'/image-'+(n+1)+'.jpg')))await pause(3000);
  const base=root+'/clip-'+n+'-take-1';
  if(!fs.existsSync(base+'-raw.mp4')){
   if(!fs.existsSync(base+'-request.json')){log('Clip '+n+' of 11: Grok first take');await run('work/underwater-video.cjs',{V1_CLIP:String(n),V1_TAKE:'1',V1_ACTION:'submit'});}
   while(!fs.existsSync(base+'-raw.mp4')){
    await pause(25000);await run('work/underwater-video.cjs',{V1_CLIP:String(n),V1_TAKE:'1',V1_ACTION:'poll'});
    const m=read(base+'-request.json');if(['failed','expired','canceled'].includes(m.status))throw Error('Clip '+n+' status '+m.status+'; no automatic retake.');
   }
  }
  if(!fs.existsSync(base+'-handoff.jpg'))await run('work/underwater-video.cjs',{V1_CLIP:String(n),V1_TAKE:'1',V1_ACTION:'normalize'});
  fs.copyFileSync(base+'.mp4',root+'/clip-'+n+'.mp4');fs.copyFileSync(base+'-handoff.jpg',root+'/clip-'+n+'-handoff.jpg');
  update('clips',n,{status:'generated-first-take',selected_take:1,media:read(base+'-media.json'),actual_input:read(base+'-inputs.json'),review_note:'No visual review, testing or retake, as requested.'});
 }
}
function stitch(){
 const t=read(file);fs.writeFileSync(root+'/concat.txt',t.clips.map(c=>"file '"+c.video_path+"'").join('\n')+'\n');
 cp.execFileSync(ff,['-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',root+'/concat.txt','-c','copy','-movflags','+faststart','-y',root+'/'+t.output.video],{windowsHide:true});
 fs.copyFileSync(root+'/clip-11-handoff.jpg',root+'/image-12.jpg');
 t.scenes[11].status='video-derived-first-take';
 let frames=0;for(const c of t.clips){const n=Number(c.media.streams[0].nb_read_frames);c.timeline={start_seconds:frames/24,end_seconds:(frames+n)/24};frames+=n;}
 t.output.actual_duration_seconds=frames/24;t.output.frame_count=frames;t.status='complete-first-version';t.completed_at=new Date().toISOString();t.costs=read(root+'/budget-actual.json');t.costs.scope='Underwater Sea Horror first version only';t.review_policy='No visual review, video tests or retakes performed, as requested.';
 save(file,t);save(root+'/'+file,t);log('COMPLETE '+root+'/'+t.output.video+' duration '+t.output.actual_duration_seconds+' xAI USD '+t.costs.xaiCompletedCostUsd);
}
(async()=>{await Promise.all([images(1),images(2),videos()]);stitch();})().catch(e=>{log('STOPPED '+e.message);process.exitCode=1;});
