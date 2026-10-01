const fs=require('fs'),file='Template_Wedding_CarRoadTrip_Beach.json',r='output/car-roadtrip-beach-v1',t=JSON.parse(fs.readFileSync(file));
if(!fs.existsSync(r+'/approved-five-scene-template.json'))fs.copyFileSync(file,r+'/approved-five-scene-template.json');
t.status='continuing-full-version';t.output.video='car-roadtrip-beach-v1-final.mp4';t.output.actual_duration_seconds=null;t.output.frame_count=null;t.completed_at=null;
t.generation_policy.initial_new_image_requests=11;t.generation_policy.initial_new_video_requests=11;t.generation_policy.planned_xai_usd=7.77;t.generation_policy.scope='Full 12-scene version: reuse approved scenes 1-5 and clips 1-4; generate only scenes 6-11 and clips 5-11. Scene 12 is derived from the ending. Additional planned xAI cost: USD 5.03.';
for(const s of t.scenes)if(s.index>=6)s.status=s.index===12?'video-derived-pending':'pending-new-generation';
for(const c of t.clips)if(c.index>=5)c.status='pending-new-generation';
fs.writeFileSync(file,JSON.stringify(t,null,2));fs.writeFileSync(r+'/'+file,JSON.stringify(t,null,2));console.log('Ready: six new images, seven new clips; approved preview retained.');
