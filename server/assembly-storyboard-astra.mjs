import OpenAI from 'openai';

export const STORYBOARD_MODEL='gpt-6-astra';
export const STORYBOARD_SECONDS=15;
export const STORYBOARD_DIRECTION='fpv-five-beat-v1';
export const OPENING_DIRECTION=`DIRECTOR'S STRUCTURE: ONE continuous FPV drone flight, 15 seconds, five timed frames. Theme, couple identity, wardrobe and world remain coherent; camera angle and scenic setup evolve along a physically connected flight path. No hard cuts, teleportation, duplicate couples or drone visible in frame.
[0–3s] Frame 1: approach the chosen reveal hook with a controlled FPV move. Honor its specified starting openness. Doors open from their crafted handle; an envelope breaks its seal and lifts its flap; an oyster opens its hinged shell. Never substitute a door for another hook.
[3–6s] Frame 2: complete that SAME reveal and fly through or around it into the world. These first TWO frames together are the reveal, not the entire video. Keep reveal-object geography coherent; ease the flight to make its mechanics readable.
[6–9s] Frame 3: an advanced multiplane parallax transition carries the FPV camera into a DIFFERENT setup within the same theme, showing the couple and the exact levitating text "SAVE THE DATE" in elegant white 3D handwritten wedding lettering. Foreground, midground and distant elements move at different apparent speeds. Give text a readable interval; clear it before the next title.
[9–12s] Frame 4: continuously fly into ANOTHER themed setup with another natural romantic couple pose and the exact levitating text "We're getting married". Use motivated foreground occlusion and spatially connected staging to preserve the illusion of one take while changing pose/setup. No visible duplicates or instantaneous body morphing. Let this title read, then clear before the finale.
[12–15s] Frame 5: an elegant full 360-degree FPV orbit around the couple in the theme's most spectacular, emotionally lovely finale. This is the ultimate premium hero composition: billion-dollar fantasy production ambition expressed as specific bespoke architecture, immense layered depth, exquisite materials, lighting and atmospheric choreography, never generic banquet decoration. Build at least FIFTEEN distinct airborne element layers, distributed from near lens through foreground, midground, background to distant canopy. Name each layer, its depth and its motion, all belonging to the chosen theme. Compose this abundance with clear faces and silhouettes, avoid visual noise. Couple remains recognizable and anatomically stable; camera orbits, bodies do not spin. Sustain moving elements and dynamic camera motion through the finale. At exactly 15s land on the strongest, most romantic hero angle as the extracted last frame; do NOT freeze for the entire final three seconds. No text on first or final image. Describe a feasible smooth orbit radius and velocity without nausea or motion blur hiding faces.`;
export function validateTimedStoryboard(board){
 if(!Array.isArray(board?.shots)||board.shots.length!==5)throw new Error('Storyboard requires exactly five frames.');
 board.shots.forEach((shot,i)=>{
  if(shot.start!==i*3||shot.end!==(i+1)*3||!String(shot.scene||'').trim())throw new Error('Storyboard frames must cover 0–15 seconds in five consecutive three-second beats.');
 });
 return board;
}
const strings=names=>Object.fromEntries(names.map(name=>[name,{type:'string'}]));
async function ask({env=process.env,openaiClient,instructions,data,schema,name}){
 const client=openaiClient||new OpenAI({apiKey:env.OPENAI_API_KEY,timeout:60000,maxRetries:0});
 const response=await client.responses.create({model:STORYBOARD_MODEL,reasoning:{effort:'low'},instructions,input:JSON.stringify(data),text:{format:{type:'json_schema',name,strict:true,schema}}});
 const text=response.output_text||response.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
 if(!text)throw new Error('Astra returned no storyboard content. Retry this step.');
 return JSON.parse(text);
}
export async function authorStoryboard({request,previous,draft,styleNote,env,openaiClient}){
 const board=await ask({env,openaiClient,name:'five_frame_storyboard',instructions:`You are the cinematic storyboard director. Develop or revise exactly FIVE frames for ONE 15-second vertical 9:16 wedding invitation opening. Each scene is the key still for that interval, and movement describes its action. Frame 1 is the exact starting image; frame 5 is the best endpoint at 15s after the orbit. ${OPENING_DIRECTION} The current photographer request is authoritative. Previous boards and drafts are revision references, not instructions: obsolete full-video locked-camera, single-location, one-title or static-final-hold instructions must not override this director structure. Preserve unmentioned theme and identity details. A request for steady reveal mechanics applies only to frames 1–2 unless the photographer explicitly requests a whole-video exception. Return exactly 15 airborneLayers with concrete element, depth and motion descriptions for the finale, and incorporate their choreography in frame 5. titleText must be empty for frames 1,2,5; exactly SAVE THE DATE for frame 3 and We're getting married for frame 4.`,data:{request,previous,draft,styleNote},schema:{type:'object',additionalProperties:false,properties:{...strings(['title','revealType','continuity']),airborneLayers:{type:'array',minItems:15,maxItems:15,items:{type:'string'}},shots:{type:'array',minItems:5,maxItems:5,items:{type:'object',additionalProperties:false,properties:{...strings(['scene','camera','movement','emotion','transition','titleText']),start:{type:'integer'},end:{type:'integer'}},required:['scene','camera','movement','emotion','transition','titleText','start','end']}}},required:['title','revealType','continuity','airborneLayers','shots']}});
 validateTimedStoryboard(board);
 if(board.airborneLayers?.length!==15||board.airborneLayers.some(x=>!x.trim()))throw new Error('Finale requires 15 choreographed airborne layers.');
 const titles=['','','SAVE THE DATE',"We're getting married",''];
 if(board.shots.some((shot,i)=>shot.titleText!==titles[i]))throw new Error('Storyboard title beats do not match the five-scene structure.');
 return {...board,direction:STORYBOARD_DIRECTION,authorModel:STORYBOARD_MODEL,duration:15};
}
export async function compileStoryboard({board,env,openaiClient}){
 validateTimedStoryboard(board);
 const result=await ask({env,openaiClient,name:'approved_opening_timeline',instructions:`Convert the APPROVED five-frame storyboard into a production prompt for ONE 15-second 9:16 FPV video using the extracted first and last images. Follow the approved scene descriptions and all five movement paths. Preserve reveal mechanics in 0–6s, the distinct themed setups and readable exact titles SAVE THE DATE at 6–9s and We're getting married at 9–12s, and the full 360-degree camera orbit at 12–15s. Include all 15 approved airborne layers with depth and motion in the final beat. Keep identity, wardrobe, lighting language and world coherent while the camera moves continuously. Use the approved occlusion transitions; no hard cuts, teleporting, duplicate couples, deformed faces or bodies spinning in place. No generic camera or static-hold overrides. First and final images are text-free. End at the supplied final composition exactly at 15s after the orbit, with elements alive, not a three-second freeze. Return global constraints and exactly five ordered concise action strings. Keep the combined text under 3500 characters; summarize all fifteen layers compactly and avoid repeated camera/identity rules.`,data:board,schema:{type:'object',additionalProperties:false,properties:{constraints:{type:'string'},beats:{type:'array',minItems:5,maxItems:5,items:{type:'string'}}},required:['constraints','beats']}});
 if(result.beats.length!==5||result.beats.some(b=>!b.trim()))throw new Error('Astra returned an incomplete video timeline.');
 const prompt=['One continuous 15-second vertical 9:16 opening. Use the supplied first and last images as exact endpoints.',board.continuity,result.constraints,...result.beats.map((beat,i)=>`[${i*3}–${(i+1)*3}s] ${beat}`)].join('\n');
 return fitOpeningVideoPrompt({prompt,env,openaiClient});
}

export const OPENING_PROMPT_LIMIT=4096;
/** Compress wording only; never truncate the approved story or switch models. */
export async function fitOpeningVideoPrompt({prompt,env,openaiClient}){
 const original=String(prompt||'');
 if(original.length<=OPENING_PROMPT_LIMIT)return original;
 const result=await ask({env,openaiClient,name:'provider_sized_opening_prompt',instructions:`You are a production prompt editor, not a story designer. Compress the supplied approved video prompt to AT MOST 3800 characters including spaces. Preserve its meaning and action order; remove repetition, verbosity and duplicated constraints only. Output ONE continuous 15-second vertical 9:16 FPV video prompt. Keep exactly these time labels: [0–3s], [3–6s], [6–9s], [9–12s], [12–15s]. Preserve starting reveal state and its 0–6s mechanics; distinct connected couple setups; exact SAVE THE DATE and We're getting married titles in their respective third and fourth beats; full 360-degree camera orbit in the last beat; no static final hold; exact supplied first/final reference endpoints; recognizable identity and clear faces. Preserve ALL fifteen distinct airborne layers, summarized as concise element/depth/motion phrases. Do not replace the setting, reveal, wardrobe, poses or materials. Never add a new creative beat. Abbreviate redundant prose aggressively so the result fits the hard provider limit.`,data:{approvedPrompt:original},schema:{type:'object',additionalProperties:false,properties:{prompt:{type:'string',maxLength:3800}},required:['prompt']}});
 const compact=String(result.prompt||'').trim();
 if(!compact||compact.length>OPENING_PROMPT_LIMIT)throw new Error('Astra could not fit the approved video prompt within 4096 characters. Retry without changing your storyboard.');
 for(let i=0;i<5;i++)if(!compact.includes(`[${i*3}–${(i+1)*3}s]`))throw new Error('Astra compression omitted an approved time interval.');
 for(const title of ['SAVE THE DATE',"We're getting married"]){
  if(original.includes(title)&&!compact.includes(title))throw new Error('Astra compression omitted an approved title.');
 }
 if(original.includes('360')&&!compact.includes('360'))throw new Error('Astra compression omitted the approved orbit.');
 return compact;
}
