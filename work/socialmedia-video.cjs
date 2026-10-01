
const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto');
const root=process.env.V1_ROOT||'output/socialmedia-college-anime-v1',file=process.env.V1_FILE||'Theme_Wedding_SocialMedia_CollegeAnime.json',n=Number(process.env.V1_CLIP),action=process.env.V1_ACTION,take=process.env.V1_TAKE||'1',base=root+'/clip-'+n+'-take-'+take;
if(n<1||n>11)throw Error('Only new v1 clips 2–11 allowed');
const ff=path.join(process.env.TEMP,'fmi-ffmpeg.exe');
const run=a=>cp.execFileSync(ff,['-hide_banner','-loglevel','error',...a],{windowsHide:true});
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function ledger(){
 const videos=fs.readdirSync(root).filter(f=>/^clip-\d+-take-\d+-request\.json$/.test(f)).map(f=>({file:f,...JSON.parse(fs.readFileSync(root+'/'+f))}));
 const b={scope:'New extension only; locked prototype costs excluded',imageRequests:fs.readdirSync(root).filter(f=>/^image-\d+-take-\d+-request\.json$/.test(f)).length,videoRequests:videos.length,xaiCompletedCostUsd:Math.round(videos.reduce((a,v)=>a+Number(v.usage?.cost_in_usd_ticks||0)/1e10,0)*100)/100,pendingVideos:videos.filter(v=>v.status!=='done').map(v=>({file:v.file,status:v.status})),replicateCostUsd:null,replicateCostNote:'Provider prediction responses do not include monetary charges.'};
 save(root+'/budget-actual.json',b);return b;
}
function update(fields){const t=JSON.parse(fs.readFileSync(file));Object.assign(t.clips[n-1],fields);save(file,t);save(root+'/'+file,t);}
(async()=>{
 const t=JSON.parse(fs.readFileSync(file)),clip=t.clips[n-1];
 if(action==='submit'){
  if(t.generation_policy?.approval_status==='pending')throw Error('Opening image approval is pending; video generation is paused.');
  if(fs.existsSync(base+'-request.json')||fs.existsSync(base+'-submission-started.json'))throw Error('Submission already recorded; poll, never duplicate.');
  if(ledger().videoRequests>=12)throw Error('Twelve-request cap reached.');
  const first=n===1?root+'/image-1.jpg':root+'/clip-'+(n-1)+'-handoff.jpg',last=root+'/image-'+clip.to+'-720.jpg';
  if(!fs.existsSync(first))throw Error('Prior reviewed clip handoff missing');
  if(clip.anchors.last)run(['-i',root+'/image-'+clip.to+'.jpg','-vf','scale=720:1280','-frames:v','1','-q:v','2','-y',last]);
  fs.copyFileSync(first,base+'-first.jpg');if(clip.anchors.last)fs.copyFileSync(last,base+'-last.jpg');
  const data=f=>({url:'data:image/jpeg;base64,'+fs.readFileSync(f).toString('base64')});
  const body={model:t.models.video.id,prompt:clip.video_prompt,duration:clip.duration,aspect_ratio:'9:16',resolution:'720p',generate_audio:false,image:data(base+'-first.jpg'),...(clip.anchors.last?{last_frame:data(base+'-last.jpg')}:{})};
  fs.writeFileSync(base+'-prompt.txt',body.prompt);
  save(base+'-inputs.json',{model:body.model,duration:body.duration,aspect_ratio:body.aspect_ratio,resolution:body.resolution,firstImage:base+'-first.jpg',lastImage:clip.anchors.last?base+'-last.jpg':null,firstImageSha256:hash(base+'-first.jpg'),lastImageSha256:clip.anchors.last?hash(base+'-last.jpg'):null,keyframes:[],sourceVideoFramesSent:false});
  save(base+'-submission-started.json',{at:new Date().toISOString(),note:'Never retry a timeout automatically'});
  const r=await fetch('https://api.x.ai/v1/videos/generations',{method:'POST',headers:{Authorization:'Bearer '+process.env.XAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const b=await r.json();if(!r.ok){save(base+'-submission-error.json',{httpStatus:r.status,error:b.error||b.message||b});throw Error('xAI submit HTTP '+r.status);}
  const m={requestId:b.request_id||b.id,status:b.status||'pending',model:body.model,duration:clip.duration};
  save(base+'-request.json',m);update({status:'submitted',request_metadata:m});
  console.log(JSON.stringify({clip:n,...m,budget:ledger()}));
 }else if(action==='poll'){
  const m=JSON.parse(fs.readFileSync(base+'-request.json'));
  if(!fs.existsSync(base+'-raw.mp4')){
   const r=await fetch('https://api.x.ai/v1/videos/'+encodeURIComponent(m.requestId),{headers:{Authorization:'Bearer '+process.env.XAI_API_KEY}});
   const b=await r.json();if(!r.ok)throw Error('xAI poll HTTP '+r.status+': '+JSON.stringify(b.error||b.message||b));
   m.status=b.status;m.usage=b.usage;m.error=b.error;save(base+'-request.json',m);
   if(b.status==='done'){
    if(b.video?.respect_moderation===false)throw Error('Provider moderation rejection');
    const url=b.video?.url||b.url,d=await fetch(url);if(!d.ok)throw Error('Download HTTP '+d.status);
    fs.writeFileSync(base+'-raw.mp4',Buffer.from(await d.arrayBuffer()));m.outputUrl=url;save(base+'-request.json',m);
   }
   update({status:m.status==='done'?'generated-first-take':m.status,request_metadata:m});
  }
  console.log(JSON.stringify({clip:n,status:m.status,usage:m.usage,budget:ledger()}));
 }else if(action==='normalize'){
  run(['-i',base+'-raw.mp4','-vf','scale=720:1280,fps=24','-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart','-y',base+'.mp4']);
  const info=JSON.parse(cp.execFileSync(require('ffprobe-static').path,['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_read_frames:format=duration','-of','json',base+'.mp4'],{windowsHide:true}).toString());
  const count=Number(info.streams[0].nb_read_frames);
  run(['-i',base+'.mp4','-vf','select=eq(n\\,'+(count-1)+')','-frames:v','1','-q:v','2','-y',base+'-handoff.jpg']);
  save(base+'-media.json',info);console.log(JSON.stringify({clip:n,...info}));
 }else throw Error('Unknown action');
})().catch(e=>{console.error(e.message);process.exitCode=1});
