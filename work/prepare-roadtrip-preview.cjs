const fs=require('fs'),crypto=require('crypto'),file='Template_Wedding_CarRoadTrip_Beach.json',root='output/car-roadtrip-beach-v1';
const t=JSON.parse(fs.readFileSync(file)),master=JSON.parse(fs.readFileSync('master_template_v1.json'));
fs.mkdirSync(root,{recursive:true});
if(!fs.existsSync(root+'/before-corrections.json'))fs.copyFileSync(file,root+'/before-corrections.json');
t.iteration='car-roadtrip-beach-v1';t.name='Mountain-to-Beach Wedding Road Trip';t.status='five-scene-preview-ready';t.assets_root=root;
t.locked_baseline={path:'master_template_v1.json',sha256:crypto.createHash('sha256').update(fs.readFileSync('master_template_v1.json')).digest('hex'),snapshot:root+'/locked-master-template-v1.json',policy:'Keep completed source templates and earlier outputs unchanged.'};
fs.copyFileSync('master_template_v1.json',root+'/locked-master-template-v1.json');
t.style=t.scenes[2].image_prompt_template.split('\n\n')[0];
t.characters.groom=master.characters.groom.slice(0,master.characters.groom.indexOf('Ivory silk dhoti'))+'Keep face, skin tone, age, body proportions and swept quiff consistent. Scenes 1-6: olive travel jacket, ivory shirt, dark trousers and tan shoes. Scene 7: ivory gold-bordered dhoti and angavastram. Scenes 9-12: ivory linen shirt, sand-colored trousers and bare feet. Wardrobe changes occur only between stages while he is offscreen; never morph clothes during a shot.';
t.characters.bride='Adult Indian bride with warm medium-brown skin, graceful oval face, dark-brown almond eyes, gently arched eyebrows, small red bindi, reserved smile and center-parted dark hair in a low bun. Keep face, age, skin tone and natural adult body proportions consistent. Scenes 1-6: teal windbreaker, cream top, maroon skirt and tan shoes. Scene 7: vermilion-red gold-bordered sari, gold jewelry and jasmine bun. Scenes 9-12: maroon evening dress, cream shawl, red-and-gold bangles and bare feet. Wardrobe changes occur only between stages while she is offscreen; never morph clothes during a shot.';
t.particle_motion='Location-specific natural motion only: breeze in mountain grass and clothing, mist near the waterfall, sea spray and foam by the coast, a few loose petals only near wedding decor. No repeated particle shower across the route. Gold title highlights and reflections change with camera angle; lettering emits no smoke or liquid. Decor, cards and parked vehicles remain grounded.';
t.copy_assumptions[3]='Both families share the blessing-card scene at the open valley viewpoint, preserving twelve planned scenes.';
t.generation_policy={...t.generation_policy,initial_new_image_requests:5,initial_new_video_requests:4,planned_xai_usd:2.74,automatic_paid_retries:false,visual_review:false,video_tests:false,retakes:false,scope:'Generate only scenes 1-5 and clips 1-4 now; scenes 6-12 and clips 5-11 are deferred.'};
t.output.video='car-roadtrip-beach-first-5-scenes.mp4';
for(const k of ['actual_duration_seconds','frame_count','sha256'])t.output[k]=null;
t.completed_at=null;
t.costs={scope:'Road-trip first five scenes only',imageRequests:0,videoRequests:0,xaiCompletedCostUsd:0,pendingVideos:[],replicateCostUsd:null,replicateCostNote:'Provider prediction responses do not include monetary charges.'};
t.verification={full_decode:'not-run',baseline_template_unchanged:true,opening_clip_unchanged:false,text_only_new_images:0,selected_new_videos:0,final_clip_uses_single_first_frame:null,application_code_changed:false};
const names=['Mountain-road aerial departure','Outdoor waterfall devotional moment','Waterfall-side invitation viewpoint','Groom at mountain-road pullout','Bride at high-altitude photo spot','Valley family blessing and selfie','Open daylight beach ceremony','Coastal headland venue details','Night beach-shack reception outside','Hosts welcome guests on the beach path','Couple and date board at the waterline','Intimate shoulder-rest on the night shoreline'];
const stale=['source_metadata','source_asset','sha256','image_request_id','selected_take','review_note','actual_input_path','request_metadata','media','timeline','actual_input'];
for(const s of t.scenes){
 s.name=names[s.index-1];s.status=s.index<=5?'pending-new-generation':'deferred';s.image_path='image-'+s.index+'.jpg';
 for(const k of stale)if(k in s)s[k]=null;
 for(const k of ['image_prompt','image_prompt_template'])if(typeof s[k]==='string')s[k]=s[k].replaceAll('scene.A ','scene. A ');
}
const camera=['High aerial advance, fast forward-down road flight, continuing devotional push','Left-banking fast lateral flight across the waterfall pool','Right-banking fast ascent along the mountain road to the groom','Left-banking pullback and rising flight to the high photo spot','Rightward down-slope flight to the valley family viewpoint','Left-banking fast descent through switchbacks to the daylight beach','Rightward coastal pullback and climb to the headland','Fast rightward coastal travel time-lapse to night reception','Leftward travel along the outdoor deck to the hosts','Fast backward beach travel and reveal of one couple','Gentle backward shoreline glide and slight rise, intimate shoulder-rest'];
for(const c of t.clips){c.status=c.index<=4?'pending-new-generation':'deferred';c.camera=camera[c.index-1];for(const k of stale)if(k in c)c[k]=null;}
if(JSON.stringify(t.parameters)!==JSON.stringify(master.parameters))throw Error('Wedding copy changed');
for(const s of t.scenes)for(const k of ['image_prompt','image_prompt_template'])if(typeof s[k]==='string'&&s[k].length>master.scenes[s.index-1][k].length)throw Error('Prompt exceeds master length');
fs.writeFileSync(file,JSON.stringify(t,null,2));fs.writeFileSync(root+'/'+file,JSON.stringify(t,null,2));
console.log(JSON.stringify({fixed:file,assets_root:root,newImages:5,newVideos:4,estimatedXaiUsd:2.74,remainingScenes:'deferred'}));

