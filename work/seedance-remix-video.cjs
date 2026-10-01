const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto');
const root='output/car-roadtrip-beach-remix-v1',file='Template_Wedding_CarRoadTrip_Beach.json',n=Number(process.env.V1_CLIP),take=Number(process.env.V1_TAKE||1),action=process.env.V1_ACTION,provider=process.env.V1_VIDEO_PROVIDER==='pruna'?'pruna':'seedance',model=provider==='pruna'?'prunaai/p-video':'bytedance/seedance-2.0',base=root+'/clip-'+n+(provider==='pruna'?'-pruna':'')+'-take-'+take;
if(n<1||n>11)throw Error('Invalid clip');if(!Number.isInteger(take)||take<1||take>3)throw Error('Three total attempts maximum');
const read=p=>JSON.parse(fs.readFileSync(p)),save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));
const ff=path.join(process.env.TEMP,'fmi-ffmpeg.exe'),run=a=>cp.execFileSync(ff,['-hide_banner','-loglevel','error',...a],{windowsHide:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function update(fields){const t=read(file);Object.assign(t.clips[n-1],fields);save(file,t);save(root+'/'+file,t);}
function ledger(){
 const requests=fs.readdirSync(root).filter(x=>/^clip-\d+-(?:pruna-)?take-\d+-request\.json$/.test(x)).map(x=>({file:x,...read(root+'/'+x)}));
 const b={scope:'Road-trip Replicate video iteration; clips 1-2 Seedance, remaining clips Pruna',imageRequests:fs.readdirSync(root).filter(x=>/^image-\d+-take-1-request\.json$/.test(x)).length,videoRequests:requests.length,videoProvider:'replicate',videoModels:['bytedance/seedance-2.0','prunaai/p-video'],xaiCompletedCostUsd:0,replicateCostUsd:null,replicateCostNote:'Actual charges are not exposed in prediction responses.',pendingVideos:requests.filter(x=>!['succeeded','failed','canceled'].includes(x.status)).map(x=>({file:x.file,status:x.status})),failedVideos:requests.filter(x=>x.status==='failed').map(x=>({file:x.file,status:x.status,error:x.error}))};save(root+'/budget-actual.json',b);return b;
}
async function get(url,options={}){
 for(let i=0;i<3;i++){try{return await fetch(url,{...options,signal:AbortSignal.timeout(60000)});}catch(e){if(i===2)throw e;await new Promise(r=>setTimeout(r,3000));}}
}
async function record(p){
 const m={id:p.id,requestId:p.id,status:p.status,model,version:p.version,metrics:p.metrics,error:p.error,created_at:p.created_at,started_at:p.started_at,completed_at:p.completed_at,data_removed:p.data_removed};
 save(base+'-request.json',m);
 if(p.status==='succeeded'&&p.output){
  const url=typeof p.output==='string'?p.output:Array.isArray(p.output)?p.output[0]:p.output.url;
  const response=await get(url);if(!response.ok)throw Error('Download HTTP '+response.status);
  fs.writeFileSync(base+'-raw.mp4',Buffer.from(await response.arrayBuffer()));m.outputUrl=url;save(base+'-request.json',m);
 }
 update({status:m.status==='succeeded'?'generated':m.status,request_metadata:m});
 console.log(JSON.stringify({clip:n,attempt:take,status:m.status,requestId:m.id,error:m.error,budget:ledger()}));return m;
}
(async()=>{
 const t=read(file),c=t.clips[n-1];
 if(action==='submit'){
  if(fs.existsSync(base+'-request.json')||fs.existsSync(base+'-submission-started.json'))throw Error('Existing submission; poll, never duplicate.');
  if(ledger().videoRequests>=33)throw Error('Maximum request cap reached.');
  for(let i=1;i<take;i++){const previous=read(root+'/clip-'+n+(provider==='pruna'?'-pruna':'')+'-take-'+i+'-request.json');if(previous.status!=='failed')throw Error('Retry requires a confirmed failed previous attempt.');}
  if(c.video_prompt.length>4000)throw Error('Prompt limit');
  const first=n===1?root+'/image-1.jpg':root+'/clip-'+(n-1)+'-handoff.jpg';
  if(take===1){
   run(['-i',first,'-vf','scale=720:1280','-frames:v','1','-q:v','2','-y',base+'-first.jpg']);
   if(c.anchors.last)run(['-i',root+'/image-'+c.to+'.jpg','-vf','scale=720:1280','-frames:v','1','-q:v','2','-y',base+'-last.jpg']);
  }else{
   const original=root+'/clip-'+n+(provider==='pruna'?'-pruna':'')+'-take-1',saved=read(original+'-inputs.json');
   if(c.video_prompt!==saved.prompt||c.duration!==saved.duration)throw Error('Retry inputs changed; stopping.');
   fs.copyFileSync(original+'-first.jpg',base+'-first.jpg');
   if(c.anchors.last)fs.copyFileSync(original+'-last.jpg',base+'-last.jpg');
   if(hash(base+'-first.jpg')!==saved.firstImageSha256||(c.anchors.last&&hash(base+'-last.jpg')!==saved.lastImageSha256))throw Error('Retry image hash mismatch');
  }
  const data=p=>'data:image/jpeg;base64,'+fs.readFileSync(p).toString('base64');
  const input={prompt:c.video_prompt,image:data(base+'-first.jpg'),...(c.anchors.last?{last_frame_image:data(base+'-last.jpg')}:{}),duration:c.duration,resolution:'720p',aspect_ratio:'9:16',...(provider==='pruna'?{fps:24,prompt_upsampling:false,save_audio:false}:{generate_audio:false})};
  fs.writeFileSync(base+'-prompt.txt',c.video_prompt);
  save(base+'-inputs.json',{model,prompt:c.video_prompt,duration:c.duration,resolution:'720p',aspect_ratio:'9:16',...(provider==='pruna'?{fps:24,prompt_upsampling:false,save_audio:false}:{generate_audio:false}),firstImage:base+'-first.jpg',lastImage:c.anchors.last?base+'-last.jpg':null,firstImageSha256:hash(base+'-first.jpg'),lastImageSha256:c.anchors.last?hash(base+'-last.jpg'):null,sourceVideoFramesSent:false});
  save(base+'-submission-started.json',{at:new Date().toISOString(),note:'No POST retries; recover existing prediction after ambiguous response.'});
  const response=await fetch('https://api.replicate.com/v1/models/'+model+'/predictions',{method:'POST',headers:{Authorization:'Bearer '+process.env.REPLICATE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({input}),signal:AbortSignal.timeout(60000)});
  const b=await response.json();if(!response.ok){save(base+'-submission-error.json',{httpStatus:response.status,error:b.detail||b.error||b});throw Error('Seedance submit HTTP '+response.status+': '+JSON.stringify(b.detail||b.error||b));}
  await record(b);
 }else if(action==='poll'){
  const m=read(base+'-request.json');if(fs.existsSync(base+'-raw.mp4')){console.log(JSON.stringify({clip:n,status:m.status,saved:true}));return;}
  const response=await get('https://api.replicate.com/v1/predictions/'+m.id,{headers:{Authorization:'Bearer '+process.env.REPLICATE_API_TOKEN}});
  if(!response.ok)throw Error('Seedance poll HTTP '+response.status);
  const b=await response.json();await record(b);
  if(['failed','canceled'].includes(b.status))throw Error('Seedance '+b.status+': '+b.error);
  if(b.data_removed)throw Error('Expired output; do not regenerate automatically.');
 }else if(action==='normalize'){
  run(['-i',base+'-raw.mp4','-vf','scale=720:1280,fps=24','-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart','-y',base+'.mp4']);
  const info=JSON.parse(cp.execFileSync(require('ffprobe-static').path,['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_read_frames:format=duration','-of','json',base+'.mp4'],{windowsHide:true}).toString());
  const count=Number(info.streams[0].nb_read_frames);
  run(['-i',base+'.mp4','-vf','select=eq(n\\,'+(count-1)+')','-frames:v','1','-q:v','2','-y',base+'-handoff.jpg']);
  save(base+'-media.json',info);console.log(JSON.stringify({clip:n,normalized:true,duration:info.format.duration}));
 }else throw Error('Unknown action');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
