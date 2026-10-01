const fs=require('fs'),crypto=require('crypto');
const source='master_template_v1.json',file='Template_Wedding_MysorePalace_Royal.json',root='output/mysore-palace-royal-v1';
if(fs.existsSync(file))throw Error('Royal template already exists; resume it.');
const t=JSON.parse(fs.readFileSync(source)),old=structuredClone(t);
const king="Adult Indian king-groom, visibly polished storybook 3D animation, warm medium-brown skin, dignified adult angular face, large dark-brown almond eyes, thick dark eyebrows, smooth clean-shaven cheeks and chin, swept black hair beneath a jeweled ivory Mysore peta with raised ornament, small relaxed smile. No moustache or beard. Natural adult proportions, not a child. Ivory brocade royal achkan with a broad antique-gold border, covered upper chest and an ivory gold-embroidered sash over his left shoulder crossing his torso, two fine pearl necklaces. Keep this face, headdress, body and outfit consistent in every couple scene.";
const queen="Adult Indian queen-bride, visibly polished storybook 3D animation, warm medium-brown skin, regal heart-shaped face, large dark-brown almond eyes, gently arched black eyebrows, small red bindi, warm reserved smile. Center-parted dark hair swept into a low bun beneath a jeweled gold tiara, antique-gold maang tikka, ruby jhumka earrings, layered pearl necklaces, stacks of ruby-and-gold bangles and a slender gold waist belt. Deep ruby-red Mysore silk sari with fine gold brocade and a broad antique-gold border, matching short-sleeved ruby blouse. Natural adult proportions and a consistent face, headdress, jewelry and sari in every later scene.";
const replacements=[
[old.characters.groom,king],[old.characters.bride,queen],
["His ivory dhoti and diagonal gold-bordered angavastram leave the chest bare; no kurta or jacket.","His ivory achkan and diagonal gold-embroidered royal sash cover the chest fully; jeweled Mysore peta."],
["their exact sari, dhoti, diagonal angavastram, hair, jewelry","their exact sari, achkan, diagonal royal sash, headdresses, jewelry"],
["same vermilion-gold sari and jasmine bun","same ruby-gold sari and tiara bun"],
["South Indian temple","Mysore Palace"],["South Indian wedding","Mysore Palace royal wedding"],
["one nine-tier gopuram","one domed palace clock-tower"],
["ONE dominant nine-tier sandstone gopuram with seven small finials","ONE dominant domed Mysore Palace clock-tower with gilded finials"],
["Honey-beige intricately carved sandstone","Ivory-granite intricately gilded palace stone"],
["Honey-beige aged sandstone with dark brown carved recesses","Ivory-granite palace stone with dark teal gilded recesses"],
["Warm honey sandstone with intricate hand-carved dark recesses","Warm ivory granite with intricate turquoise-gold carved recesses"],
["carved sandstone","gilded palace stone"],["carved-stone hall","turquoise-gold Durbar hall"],
["dark stone sanctum-side mandap","turquoise-gold Kalyana Mantapa"],
["a stepped roof cap","a small domed roof"],
["a shallow stone roof with a low stepped pyramidal cap","a shallow gilded roof with a low scalloped domed cap"],
["lotus front beam","peacock front beam"],["lotus relief","peacock relief"],["lotus beam","peacock beam"],
["lotus-carved","peacock-carved"],["red-yellow","ruby-ivory"],["red and golden-yellow draped cloth","ruby and ivory-gold draped cloth"],
["gopuram","domed clock-tower"],["temple emblem","Gandabherunda emblem"],
["temple complex","Mysore Palace complex"],["temple compound","palace compound"],
["temple's","palace's"],["temple wing","palace wing"],["temple garden","palace garden"],
["temple","palace"],
["INNER lamp hall","INNER Durbar hall"],
["sacred lamp emblem","royal peacock emblem"],
["Gold floral border","Gold peacock border"],["Thin embossed floral gold border","Thin embossed peacock gold border"],
["dark red patterned ceremonial rug","ruby-red patterned royal rug"],
["orange marigolds","ruby roses"],["Orange marigolds","Ruby roses"],
["orange marigold petals","ruby rose petals"],["orange marigold garlands","ruby rose garlands"],
["white, pale yellow and orange petals","white, pale gold and ruby petals"],
["white-orange","ivory-ruby"],["orange-white-red","ruby-ivory-gold"],["orange-white","ruby-ivory"],
["red-white-green","ruby-ivory-gold"],
["vermilion silk","ruby brocade"],["green mango leaves","emerald foliage"],
["brass lamps","gilded lamps"],["Brass lamps","Gilded lamps"],["brass lamp","gilded lamp"],
["brass highlights","gilded highlights"],["brass offerings","gilded offerings"],
["worn stone","inlaid marble"],["polished stone","inlaid marble"],
["dark mahogany","dark rosewood"],["dark-mahogany","dark-rosewood"],["mahogany board","rosewood board"],
["gold drapes","ruby velvet"],["sculpted expressive faces","regal expressive faces"]
];
function theme(s){if(typeof s!=='string')return s;for(const[a,b]of replacements)s=s.split(a).join(b);return s;}
function render(s){return s.replace(/\{\{([^}]+)\}\}/g,(_,k)=>t.parameters[k]);}
t.iteration='mysore-palace-royal-v1';t.name='Mysore Palace Royal Wedding';t.status='ready-to-generate';t.assets_root=root;
t.locked_baseline={path:source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),snapshot:'locked-master-template-v1.json'};
t.style=theme(t.style);t.characters={groom:king,bride:queen};t.particle_motion=theme(t.particle_motion);
t.generation_policy={...t.generation_policy,initial_new_image_requests:11,initial_new_video_requests:11,planned_xai_usd:7.77,automatic_paid_retries:false,visual_review:false,video_tests:false,retakes:false};
t.copy_assumptions=[...(t.copy_assumptions||[]),'Mysore Palace is the visual theme; the supplied Leela Channaiah Kalyana Mandapa venue and all wedding details remain unchanged.'];
t.output.video='mysore-palace-royal-v1-final.mp4';
for(const k of ['actual_duration_seconds','frame_count','sha256'])delete t.output[k];
for(const k of ['completed_at','costs','verification'])delete t[k];
for(const s of t.scenes){
 for(const k of ['source_metadata','source_asset','sha256','image_request_id','selected_take','review_note','actual_input_path','request_metadata'])delete s[k];
 s.status=s.index===12?'video-derived-pending':'pending';s.image_path='image-'+s.index+'.jpg';
 if(s.image_prompt_template){s.image_prompt_template=theme(s.image_prompt_template);s.image_prompt=render(s.image_prompt_template);}
}
for(const c of t.clips){
 for(const k of ['source_asset','sha256','request_metadata','media','timeline','selected_take','review_note','actual_input'])delete c[k];
 c.status='pending';c.video_prompt_template=theme(c.video_prompt_template);c.video_prompt=render(c.video_prompt_template);if(c.prompt)c.prompt=theme(c.prompt);
}
fs.mkdirSync(root,{recursive:true});
fs.copyFileSync(source,root+'/locked-master-template-v1.json');
fs.writeFileSync(file,JSON.stringify(t,null,2));fs.writeFileSync(root+'/'+file,JSON.stringify(t,null,2));
console.log(JSON.stringify({file,scenes:t.scenes.length,clips:t.clips.length,imagePromptWordRatios:t.scenes.filter(s=>s.image_prompt).map(s=>+(s.image_prompt.split(/\s+/).length/old.scenes[s.index-1].image_prompt.split(/\s+/).length).toFixed(3)),motionFieldsUnchanged:t.clips.every((c,i)=>c.camera===old.clips[i].camera&&c.duration===old.clips[i].duration),copyUnchanged:JSON.stringify(t.parameters)===JSON.stringify(old.parameters)}));

