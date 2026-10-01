const fs=require('fs'),cp=require('child_process'),path=require('path');
const root='output/car-roadtrip-beach-remix-v1',file='Template_Wedding_CarRoadTrip_Beach.json',ff=path.join(process.env.TEMP,'fmi-ffmpeg.exe');
const read=p=>JSON.parse(fs.readFileSync(p)),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function log(s){console.log(new Date().toISOString()+' '+s);}
function run(n,take,action){return new Promise((resolve,reject)=>cp.execFile(process.execPath,['--use-system-ca','work/seedance-remix-video.cjs'],{env:{...process.env,V1_CLIP:String(n),V1_TAKE:String(take),V1_ACTION:action,V1_VIDEO_PROVIDER:'pruna'},windowsHide:true,maxBuffer:4*1024*1024},(e,out,err)=>{if(out.trim())log(out.trim());if(e)reject(new Error(err||e.message));else resolve();}));}
function update(n,fields){const t=read(file);Object.assign(t.clips[n-1],fields);save(file,t);save(root+'/'+file,t);}
async function videos(){
 for(let n=3;n<=11;n++){
  if(fs.existsSync(root+'/clip-'+n+'.mp4')&&fs.existsSync(root+'/clip-'+n+'-handoff.jpg')){log('Clip '+n+' already selected');continue;}
  let take=1,base;
  for(;take<=3;take++){
   base=root+'/clip-'+n+'-pruna-take-'+take;
   if(fs.existsSync(base+'-raw.mp4'))break;
   if(fs.existsSync(base+'-submission-started.json')&&!fs.existsSync(base+'-request.json'))throw Error('Clip '+n+' attempt '+take+' submission outcome unknown; no duplicate sent.');
   if(!fs.existsSync(base+'-request.json')){log('Clip '+n+' of 11: Pruna attempt '+take+' of 3');await run(n,take,'submit');}
   let m=read(base+'-request.json');
   while(!fs.existsSync(base+'-raw.mp4')&&!['failed','canceled'].includes(m.status)){
    await pause(12000);
    try{await run(n,take,'poll');}catch(e){m=read(base+'-request.json');if(!['failed','canceled'].includes(m.status))throw e;}
    m=read(base+'-request.json');
   }
   if(fs.existsSync(base+'-raw.mp4'))break;
   if(m.status!=='failed')throw Error('Clip '+n+' status '+m.status+'; retry requires confirmed failure.');
   log('Clip '+n+' attempt '+take+' failed: '+String(m.error).slice(0,240));
  }
  if(take>3)throw Error('Clip '+n+' failed three total Pruna attempts; stopped.');
  if(!fs.existsSync(base+'-handoff.jpg'))await run(n,take,'normalize');
  fs.copyFileSync(base+'.mp4',root+'/clip-'+n+'.mp4');fs.copyFileSync(base+'-handoff.jpg',root+'/clip-'+n+'-handoff.jpg');
  update(n,{status:'generated',selected_take:take,selected_model:'prunaai/p-video',media:read(base+'-media.json'),actual_input:read(base+'-inputs.json'),review_note:'No visual review or creative retake; confirmed failures may receive at most three identical-input attempts.'});
  log('Clip '+n+' selected');
 }
}
function stitch(){
 const t=read(file),video='car-roadtrip-beach-remix-v1-pruna-final.mp4';
 fs.writeFileSync(root+'/concat-pruna.txt',t.clips.map(c=>"file '"+c.video_path+"'").join('\n')+'\n');
 cp.execFileSync(ff,['-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',root+'/concat-pruna.txt','-c','copy','-movflags','+faststart','-y',root+'/'+video],{windowsHide:true});
 fs.copyFileSync(root+'/clip-11-handoff.jpg',root+'/image-12.jpg');
 t.scenes[11].status='video-derived';let frames=0;
 for(const c of t.clips){const count=Number(c.media.streams[0].nb_read_frames);c.timeline={start_seconds:frames/24,end_seconds:(frames+count)/24};frames+=count;}
 t.output.video=video;t.output.actual_duration_seconds=frames/24;t.output.frame_count=frames;t.status='complete';t.completed_at=new Date().toISOString();t.costs=read(root+'/budget-actual.json');
 t.review_policy='No visual review or video tests. Confirmed failed clips could be retried with identical inputs, capped at three total attempts per model.';
 t.verification.text_only_new_images=11;t.verification.selected_new_videos=11;
 save(file,t);save(root+'/'+file,t);log('COMPLETE '+root+'/'+video+' duration '+t.output.actual_duration_seconds);
}
(async()=>{await videos();stitch();})().catch(e=>{const t=read(file);t.status='blocked';t.generation_policy.blocker=e.message;save(file,t);save(root+'/'+file,t);log('STOPPED '+e.message);process.exitCode=1;});
