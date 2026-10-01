const fs=require('fs'),crypto=require('crypto');
const source='master_template_v1.json',file='Template_Wedding_UnderWaterSea_Horror.json',root='output/underwater-sea-horror-v1';
if(fs.existsSync(file))throw Error('Underwater template already exists; resume it.');
const t=JSON.parse(fs.readFileSync(source)),old=structuredClone(t);
const king="Adult spectral sea groom, visibly polished storybook 3D animation, pale blue-grey skin, slender adult angular face, large luminous sea-green almond eyes, thick dark eyebrows, smooth clean-shaven cheeks and chin, swept wavy blue-black hair with a prominent side part and coral crown, small restrained smile. No moustache or beard. Natural adult proportions, not a child. Ivory sea-silk dhoti with a broad tarnished-gold border, bare upper chest and an ivory kelp-bordered angavastram over his left shoulder crossing his torso, two aged pearl necklaces. Keep this face, crown, body and outfit consistent in every couple scene.";
const queen="Adult spectral sea bride, visibly polished storybook 3D animation, pale blue-grey skin, haunting heart-shaped face, large luminous sea-green almond eyes, gently arched dark eyebrows, small crimson bindi, warm reserved smile. Center-parted blue-black hair swept into a low bun ringed with ivory coral, tarnished-gold coral tiara, pearl jhumka earrings, layered pearl necklaces, stacks of crimson-and-gold bangles and a slender gold waist belt. Deep midnight-teal sea-silk sari with fine silver brocade and a broad tarnished-gold border, matching short-sleeved teal blouse. Natural adult proportions and a consistent face, hairstyle, jewelry and sari in every later scene.";
const replacements=[
[old.characters.groom,king],[old.characters.bride,queen],
["His ivory dhoti and diagonal gold-bordered angavastram leave the chest bare; no kurta or jacket.","His ivory dhoti and diagonal kelp-bordered angavastram leave the chest bare; bleached branching coral crown."],
["same vermilion-gold sari and jasmine bun","same midnight-teal sari and coral bun"],
["dimensional storybook-animation South Indian wedding invitation","dimensional storybook-animation underwater sea-horror wedding invitation"],
["South Indian wedding invitation film","submerged sea-horror wedding invitation film"],
["South Indian temple","haunted sunken sea-palace"],
["one nine-tier gopuram","one nine-tier coral spire"],
["ONE dominant nine-tier sandstone gopuram with seven small finials","ONE dominant nine-tier basalt coral-spire with seven jagged finials"],
["Warm honey sandstone with intricate hand-carved dark recesses, deep amber shadows, vermilion silk, ivory, aged gold, orange marigolds, white jasmine and green mango leaves.","Drowned basalt ruins with intricate skull-carved dark recesses, deep abyssal shadows, midnight silk, ivory, tarnished gold, crimson anemones, white coral and black kelp fronds."],
["Honey-beige intricately carved sandstone","Blue-black intricately eroded basalt"],
["Honey-beige aged sandstone with dark brown carved recesses; ivory, deep red and antique gold accents.","Blue-black eroded basalt with dark abyssal carved recesses; ivory, midnight teal and tarnished gold accents."],
["carved sandstone","drowned basalt"],["carved-stone hall","coral-encrusted vaulted hall"],
["dark stone sanctum-side mandap","dark drowned crypt-side mandap"],
["a stepped roof cap","a ribbed coral cap"],
["lotus front beam","ribbed coral beam"],["lotus relief","nautilus relief"],["lotus beam","nautilus beam"],["lotus-carved","nautilus-carved"],
["warm peach-toned elephant face and hands","pale jade-toned elephant face and hands"],
["warm sunlight reveals the same peach face, gold crown and red-yellow cloth","cold caustics reveal the same jade face, gold crown and teal-ivory cloth"],
["red-yellow","teal-ivory"],["red and golden-yellow draped cloth","teal and pearl-ivory draped cloth"],
["gopuram","coral-spire"],
["a lavender-peach sunrise sky","a turquoise-lit rippling surface"],
["A lavender-peach sunrise sky","A turquoise-lit rippling surface"],
["low sun at left","surface glow at left"],["distant misty palm horizon","distant murky reef horizon"],
["sunrise sky","surface water"],["BLUE HOUR sky","DEEP INDIGO water"],
["sky around its finials","water around its finials"],["Keep the sky and horizon","Keep the surface and horizon"],
["temple emblem","nautilus emblem"],["sacred lamp emblem","skeletal shell emblem"],
["temple complex","sunken palace complex"],["temple compound","sunken palace compound"],
["temple's","sea-palace's"],["temple wing","sunken wing"],["temple garden","coral garden"],["temple","sea-palace"],
["DRONE","SUBMERSIBLE"],["flying drone","gliding submersible"],
["water tank","sunken pool"],["floating flower bowls on the water","anchored shell bowls in the pool"],
["Warm sunrise","Cold surface-light"],["warm sunrise","cold surface-light"],["sunrise","surface-light"],
["strong warm back-and-side sunlight","strong cyan back-and-side caustics"],
["Strong sunrays","Strong caustics"],["sunlight","surface-light"],
["SUNRAYS","CAUSTICS"],["sunrays","caustics"],["sunbeams","lightshafts"],
["Daylight","Surface-light"],["daylight","surface-light"],
["incense haze","suspended silt"],["incense wisps","silt wisps"],["incense bowl","silt bowl"],
["incense vessel","silt vessel"],["Existing incense","Existing silt"],
["dust motes","silt motes"],["dusty air","murky water"],["open air","open water"],["air resistance","water resistance"],
["fine dust","fine silt"],["atmospheric depth","submerged depth"],["atmospheric perspective","submerged perspective"],
["atmospheric incense","submerged silt"],["atmospheric","subaquatic"],
["deep amber shadows","deep abyssal shadows"],["deep warm shade","deep cyan shade"],
["dark red patterned ceremonial rug","midnight-teal patterned ceremonial rug"],
["red-white-green","teal-ivory-crimson"],["orange-white-red","crimson-ivory-teal"],["orange-white","crimson-ivory"],
["white-orange","ivory-crimson"],["white, pale yellow and orange petals","ivory, pale cyan and crimson petals"],
["orange marigolds","crimson anemones"],["Orange marigolds","Crimson anemones"],["white jasmine","ivory sea-lilies"],
["orange marigold","crimson anemone"],["green mango leaves","black kelp fronds"],["mango leaves","kelp fronds"],
["Gold floral border","Gold nautilus border"],["Thin embossed floral gold border","Thin embossed nautilus gold border"],
["brass lamps","caged jellyfish-lamps"],["Brass lamps","Caged jellyfish-lamps"],
["brass-lamp pools","jellyfish-lamp pools"],["brass oil lamps","caged jellyfish lamps"],["brass lamp","jellyfish lamp"],
["brass diyas","shell lanterns"],["brass highlights","shell highlights"],["brass offerings","pearl offerings"],
["copper ritual fire","cyan ritual glow"],["warm firelight","cold bioluminescence"],
["Gold lettering","Gold lettering"],["champagne-gold","phosphorescent-gold"],
["gold-brown","patinated-gold"],["antique-gold","tarnished-gold"],["antique gold","tarnished gold"],
["amber bloom","cyan bloom"],["amber halos","cyan halos"],["amber halo","cyan halo"],
["warm restrained emissive bloom","cold restrained emissive bloom"],
["warm lights","cyan lights"],["Warm shafts","Cold shafts"],["Warm brass","Cold shell"],
["warm gold rim","cold gold rim"],["warm diagonal","cold diagonal"],["strong warm angled","strong cyan angled"],
["warm pools","cyan pools"],["warm directional reflections","cold caustic reflections"],
["warm dust","cold silt"],["warm floor reflection","cold floor reflection"],
["warm side","cold side"],["warm back","cold back"],["Warm honey","Cold basalt"],
["warmly","eerily"],["warm shade","abyssal shade"],["warm gold","cold gold"],
["warm rim","cold rim"],["warm amber","cold cyan"],
["gold drapes","tattered teal drapes"],
["worn stone","silted basalt"],["polished stone","wet obsidian"],
["dark mahogany","black driftwood"],["dark-mahogany","black-driftwood"],["mahogany board","driftwood board"],
["sculpted expressive faces","haunting expressive faces"],
["small hanging brass","small hanging shell"],
["falling petals","sinking petals"],["independently. Release","independently. Release"]
];
function theme(s){if(typeof s!=='string')return s;for(const[a,b]of replacements)s=s.split(a).join(b);return s;}
function render(s){return s.replace(/\{\{([^}]+)\}\}/g,(_,k)=>t.parameters[k]);}
t.iteration='underwater-sea-horror-v1';t.name='Underwater Sea Horror Wedding';t.status='ready-to-generate';t.assets_root=root;
t.locked_baseline={path:source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),snapshot:'locked-master-template-v1.json'};
t.style=theme(t.style);t.characters={groom:king,bride:queen};t.particle_motion=theme(t.particle_motion);
t.generation_policy={...t.generation_policy,initial_new_image_requests:11,initial_new_video_requests:11,planned_xai_usd:7.77,automatic_paid_retries:false,visual_review:false,video_tests:false,retakes:false};
t.copy_assumptions=[...(t.copy_assumptions||[]),'Underwater Sea Horror is the visual theme; the supplied Leela Channaiah Kalyana Mandapa venue and all wedding details remain unchanged.'];
t.output.video='underwater-sea-horror-v1-final.mp4';
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
