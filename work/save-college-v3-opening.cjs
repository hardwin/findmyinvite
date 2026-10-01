const fs=require('fs');
const file='Theme_Wedding_SocialMedia_CollegeAnime.json',root=process.env.V1_ROOT||'output/socialmedia-college-anime-v3',t=JSON.parse(fs.readFileSync(file));
for(const n of [1,2]){
 const base=`${root}/image-${n}-take-1`;
 fs.copyFileSync(base+'.jpg',`${root}/image-${n}.jpg`);
 Object.assign(t.scenes[n-1],{status:'awaiting-user-approval',selected_take:1,image_path:`image-${n}.jpg`,request_metadata:JSON.parse(fs.readFileSync(base+'-request.json')),review_note:root.endsWith('-v7')?'Contemporary university opening pair visually reviewed; text animation specified in video prompts, not yet generated; user approval pending.':root.endsWith('-v6')?'Monumental university entrance and lecture-theatre reveal with levitating foreground academic objects visually reviewed; user approval pending.':root.endsWith('-v5')?'College entrance and classroom Save The Date chalkboard reviewed in watercolor illustration style; user approval pending.':root.endsWith('-v4')?'Closed-door and Save The Date reveal images visually reviewed; user approval pending.':'Opening concept reviewed; independent text-only generations retain minor architecture and bench-spacing differences.'});
}
t.status='awaiting-opening-image-approval';t.costs={imageRequests:2,videoRequests:0,xaiCompletedCostUsd:0,replicateCostUsd:null};
fs.writeFileSync(file,JSON.stringify(t,null,2));fs.writeFileSync(root+'/'+file,JSON.stringify(t,null,2));
console.log(JSON.stringify({images:2,videos:0,status:t.status}));


