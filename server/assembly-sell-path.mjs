// Photographer Sell Path — storyboard + theme helpers for Assembly Chat.
// First = reveal hook · Middle = opening-video journey · Last = couple freeze.

export const SELL_STAGES=Object.freeze([
 'welcome',
 'theme',
 'storyboard',
 'face_swap',
 'lock',
 'details',
 'generate',
 'ready'
]);

/** Suggested hooks only — photographer may name any First reveal. */
export const REVEAL_PRESETS=Object.freeze([
 'door',
 'envelope',
 'clouds',
 'building_frame',
 'arches',
 'windows'
]);
export const REVEAL_TYPES=REVEAL_PRESETS;

export const STAGE_LABELS=Object.freeze({
 welcome:'Welcome',
 theme:'Theme planning',
 storyboard:'Storyboarding',
 face_swap:'Face Swap',
 lock:'Lock hero',
 details:'Invite details',
 generate:'Generate',
 ready:'Invitation ready'
});

const REVEAL_PREFIXES=Object.freeze({
 door:'Make the door as a 10ft-tall, opaque solid-gold double door with an elegant arched top, intricate gold carvings, colorful gemstones, diamonds, and sparkling reflections. Build a seamless ivory textured marble wall around it, with a larger decorative marble arch supported by ornate pillars, gold accents, and flowering vines. Replace the floor with a lush green lawn, stepping stones, and rose petals. Add multiple layers of warm glowing lanterns, from blurred foreground standing lamps to midground and background lights, creating cinematic depth. Frame the scene with softly blurred trees and flowers. Symmetrical composition, magical golden-hour lighting, photorealistic luxury fantasy aesthetic, no humans.',
 envelope:'Make a monumental closed luxury wedding envelope FILL the entire 9:16 frame edge-to-edge — sealed, unopened, heirloom paper with pin-true wax seal and motif. Extreme close-up, the envelope IS the shot. No people, no faces, no text, no watermark.',
 clouds:'Make a wall of cinematic clouds FILL the entire 9:16 frame — dense, pin-true sky, nothing beyond visible yet. The clouds ARE the reveal hook. No stone arch, no building frame, no door unless the brief asks. Extreme close-up. No people, no faces, no text, no watermark.',
 building_frame:'Make an aesthetic architectural building frame / portal FILL the entire 9:16 frame — closed or fully blocking the view beyond, pin-true material and ornament. Extreme close-up reveal hook. No people, no faces, no text, no watermark.',
 arches:'Make aesthetic closed arches FILL the entire 9:16 frame — monumental, ornate, pin-true palette and craftsmanship, nothing beyond visible yet. Extreme close-up reveal hook. No people, no faces, no text, no watermark.',
 windows:'Make artistic closed windows FILL the entire 9:16 frame — panes closed, light and motif pin-true, the window IS the shot. Extreme close-up reveal hook. No people, no faces, no text, no watermark.'
});

const REVEAL_OPEN_BEATS=Object.freeze({
 door:'doors open from the handle',
 envelope:'the envelope seal breaks and the flap opens',
 clouds:'the clouds part and reveal the world beyond',
 building_frame:'the building frame reveals the path beyond',
 arches:'the arches part and reveal the path beyond',
 windows:'the windows open and reveal the world beyond'
});

function revealSlug(value){
 return String(value||'').trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/[^a-z0-9_]/g,'').slice(0,40);
}

function revealLabel(type){
 return String(type||'reveal').replace(/_/g,' ');
}

export function normalizeSellStage(value){
 const stage=String(value||'').trim().toLowerCase();
 return SELL_STAGES.includes(stage)?stage:'welcome';
}

export function normalizeRevealType(value){
 const raw=revealSlug(value);
 if(!raw)return 'door';
 if(REVEAL_PRESETS.includes(raw))return raw;
 if(/cloud|sky|mist|fog|nimbus/.test(raw))return 'clouds';
 if(/envelope|letter|wax_seal|seal/.test(raw)&&!/clouds/.test(raw))return 'envelope';
 if(/window/.test(raw))return 'windows';
 if(/arch/.test(raw)&&!/clouds/.test(raw))return 'arches';
 if(/^doors?$|double_door|gold_door/.test(raw))return 'door';
 if(/building_frame|portal|gate|facade/.test(raw)&&!/cloud/.test(raw))return 'building_frame';
 return raw;
}

export function pinterestSearchUrl(query=''){
 const q=String(query||'indian wedding invitation cinematic couple').trim().slice(0,120)||'indian wedding invitation cinematic';
 // Note: pinterest.com / in.pinterest.com set X-Frame-Options and refuse iframes.
 // Keep the search URL for "open externally" only — Theme desk uses themeSuggestionsForQuery.
 return 'https://www.pinterest.com/search/pins/?q='+encodeURIComponent(q)+'&rs=typed';
}

/**
 * Curated invitation-theme pins shown inside our Theme desk (Pinterest blocks site iframes).
 * Tags drive filtering as Akay updates the search query from conversation.
 */
export const THEME_BANK=Object.freeze([
 {id:'velicha',label:'Ethereal watercolor',tags:['watercolor','garden','romantic','magenta','ethereal','couple'],pinUrl:'https://pin.it/330nC70it',thumb:'https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg'},
 {id:'kaatrukulle',label:'Garden door romance',tags:['garden','door','watercolor','romantic','sage','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/4cfcddd6f8996fe3.png'},
 {id:'temple-gold',label:'Temple gold glam',tags:['temple','gold','royal','regal','traditional','hindu'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/4cfcddd6f8996fe3.png'},
 {id:'royal-cream',label:'Royal cream couple',tags:['royal','cream','elegant','regal','couple','cinematic'],pinUrl:'https://www.pinterest.com/pin/567488040032279278/',thumb:'/assets/ad64264e60445499.jpg'},
 {id:'modern-glam',label:'Modern glam night',tags:['modern','glam','night','city','sleek','couple'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/e4e5ca7a8c0c7b74.jpg'},
 {id:'meadow',label:'Soft meadow light',tags:['meadow','outdoor','soft','pastel','garden','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/15cbf1df9056e121.jpg'},
 {id:'floral-arch',label:'Floral arch ceremony',tags:['floral','arch','ceremony','flowers','romantic'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/3c934c61dec8899c.jpg'},
 {id:'palace',label:'Palace grandeur',tags:['palace','heritage','royal','dramatic','cinematic'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/50122aee9f7395c4.jpg'},
 {id:'pastel-invite',label:'Pastel invitation art',tags:['pastel','invitation','art','paper','watercolor'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/863e1b3374bb313a.jpg'},
 {id:'sunset',label:'Golden hour sunset',tags:['sunset','golden','hour','warm','cinematic','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/9b73577a4b10e8db.jpg'},
 {id:'minimal',label:'Minimal modern paper',tags:['minimal','modern','paper','clean','simple'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/ea523b0f4336159d.jpg'},
 {id:'south-indian',label:'South Indian festive',tags:['south','indian','tamil','festive','temple','traditional'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/e4e5ca7a8c0c7b74.jpg'}
]);

export function themeSuggestionsForQuery(query='',limit=9){
 const q=String(query||'').toLowerCase();
 const tokens=q.split(/[^a-z0-9]+/).filter(t=>t.length>2);
 const scored=THEME_BANK.map(item=>{
  let score=0;
  for(const tag of item.tags){
   if(q.includes(tag))score+=3;
   for(const t of tokens)if(tag.includes(t)||t.includes(tag))score+=2;
  }
  if(!tokens.length)score=1;
  return {...item,score};
 });
 scored.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
 const top=scored.filter(s=>s.score>0).slice(0,limit);
 return (top.length?top:scored.slice(0,limit)).map(({score,...rest})=>rest);
}

export function revealPrefix(revealType='door',brief=''){
 const type=normalizeRevealType(revealType);
 if(REVEAL_PREFIXES[type])return REVEAL_PREFIXES[type];
 const hook=String(brief||revealLabel(type)).trim().slice(0,160)||revealLabel(type);
 return 'Make a cinematic first-frame reveal of '+hook+' FILL the entire 9:16 frame — the reveal IS the shot, nothing beyond visible yet. Do not substitute a door, arch, or building frame unless the brief asks. Extreme close-up. No people, no faces, no text, no watermark.';
}

export function revealOpenBeat(revealType='door'){
 const type=normalizeRevealType(revealType);
 if(REVEAL_OPEN_BEATS[type])return REVEAL_OPEN_BEATS[type];
 return 'the '+revealLabel(type)+' parts and reveals the world beyond';
}

export function shotsToStoryboard(revealType='door',shots=[]){
 const rows=(Array.isArray(shots)?shots:[]).map((shot,i)=>{
  if(typeof shot==='string')return {n:i+1,scene:shot.trim(),camera:'',movement:'',emotion:'',transition:''};
  return {
   n:i+1,
   scene:String(shot.scene||shot.description||'').trim(),
   camera:String(shot.camera||'').trim(),
   movement:String(shot.movement||'').trim(),
   emotion:String(shot.emotion||'').trim(),
   transition:String(shot.transition||'').trim()
  };
 }).filter(row=>row.scene);
 const first=rows[0]||{scene:''};
 const last=rows.length?rows[rows.length-1]:{scene:''};
 const middle=rows.slice(1,-1).map(row=>row.scene);
 return {
  revealType:normalizeRevealType(revealType),
  firstBrief:first.scene,
  middleBeats:middle,
  lastBrief:last.scene,
  shots:rows
 };
}

/** One production sheet — numbered rows like a film storyboard, not three loose stills. */
export function buildStoryboardSheetPrompt({
 title='Wedding invitation opening',
 revealType='door',
 shots=[],
 pinStyleNote='',
 brief=''
}={}){
 const type=normalizeRevealType(revealType);
 const rows=shotsToStoryboard(type,shots).shots;
 const lines=rows.map(row=>{
  return [
   'Panel '+row.n+':',
   row.camera?('camera: '+row.camera):'',
   row.movement?('movement: '+row.movement):'',
   'scene: '+row.scene,
   row.emotion?('emotion: '+row.emotion):'',
   row.transition?('transition: '+row.transition):''
  ].filter(Boolean).join(' ');
 });
 return [
  'Redraw as ONE professional film STORYBOARD SHEET — a single document image, not one photo.',
  'Layout like a production board: title bar "STORYBOARD – '+String(title||'Opening').slice(0,80)+'".',
  'Then '+Math.max(3,rows.length||5)+' stacked numbered rows (1 at top). Each row: LEFT column (camera angle, camera movement, scene, emotion), CENTER a cinematic still of that beat, RIGHT transition to next.',
  'Footer director notes. Clean white paper, black hairline rules, readable production typography.',
  'Panel 1 is the FIRST REVEAL ('+type+') — honor that hook. Do not swap it for a door, arch, or building frame unless the brief is that hook.',
  'Last panel is the couple freeze (people allowed only here). Middle panels are the journey — no extra architecture unless the scenes ask.',
  'Pin-true palette and costume. Vertical or tall page. Photoreal cinematic stills inside the frames.',
  lines.join(' | '),
  brief?('Director notes: '+String(brief).slice(0,400)):'',
  pinStyleNote?('Style from locked theme: '+pinStyleNote):'',
  'No watermark, no brand logos, no extra titles besides the storyboard header and panel labels.'
 ].filter(Boolean).join(' ');
}

/** Build Flare edit prompt for storyboard First or Last still. */
export function buildStoryboardStillPrompt({
 which='first',
 revealType='door',
 brief='',
 pinStyleNote=''
}={}){
 const note=String(brief||'').trim().slice(0,800);
 const style=String(pinStyleNote||'').trim().slice(0,400);
 if(which==='last'){
  return [
   'Edit this pin into the LAST FRAME of a cinematic wedding invitation opening — vertical 9:16.',
   'Both people in frame, happy, romantic, dramatic freeze moment — soft eye contact, invitation-poster quality.',
   'Cinematic lighting, pin-true wardrobe and palette.',
   note?('Storyboard last brief: '+note):'Happy couple romantic freeze.',
   style?('Style from theme: '+style):'',
   'Absolutely no readable text, letters, watermark, or labels.'
  ].filter(Boolean).join(' ');
 }
 const type=normalizeRevealType(revealType);
 return [
  revealPrefix(type,note),
  'Edit pin into FIRST FRAME reveal hook — vertical 9:16. The reveal fills the frame. No people, no faces, no text, no watermark.',
  'Reveal type: '+type+'. Honor this type — do not swap it for a door, arch, or building frame.',
  note?('Storyboard first brief: '+note):'',
  style?('Style from theme: '+style):''
 ].filter(Boolean).join(' ');
}

/** Bride / Groom chapter solos from the locked Last couple still. */
export function buildSoloStillPrompt({which='bride',brief='',pinStyleNote=''}={}){
 const role=String(which||'bride').toLowerCase()==='groom'?'groom':'bride';
 const note=String(brief||'').trim().slice(0,400);
 const style=String(pinStyleNote||'').trim().slice(0,300);
 if(role==='groom'){
  return [
   'Edit this couple still into a vertical 9:16 GROOM solo portrait for a wedding invitation chapter.',
   'Image has one girl/woman and one boy/man — keep ONLY the boy/man (groom). Completely remove the girl/woman.',
   'Same boy/man, same wardrobe, face, and palette as the couple still. Do not show a female face.',
   'Elegant standing portrait, soft eye contact toward camera, cinematic invitation quality.',
   note?('Note: '+note):'',
   style?('Style: '+style):'',
   'Absolutely no readable text, letters, watermark, or labels.'
  ].filter(Boolean).join(' ');
 }
 return [
  'Edit this couple still into a vertical 9:16 BRIDE solo portrait for a wedding invitation chapter.',
  'Image has one girl/woman and one boy/man — keep ONLY the girl/woman (bride). Completely remove the boy/man.',
  'Same girl/woman, same wardrobe, face, and palette as the couple still. Do not show a male face.',
  'Elegant standing portrait, soft eye contact toward camera, cinematic invitation quality.',
  note?('Note: '+note):'',
  style?('Style: '+style):'',
  'Absolutely no readable text, letters, watermark, or labels.'
 ].filter(Boolean).join(' ');
}

/**
 * Map locked storyboard → Template 1 promptParams overrides
 * (firstScene / openingRoute / lastPose / openingFirst / openingLast / revealType).
 */
export function storyboardToPromptParams(storyboard={}){
 const revealType=normalizeRevealType(storyboard.revealType||storyboard.reveal_type||'door');
 const firstBrief=String(storyboard.firstBrief||storyboard.first_brief||'').trim().slice(0,300);
 const lastBrief=String(storyboard.lastBrief||storyboard.last_brief||'').trim().slice(0,300);
 const middles=Array.isArray(storyboard.middleBeats||storyboard.middle_beats)
  ?(storyboard.middleBeats||storyboard.middle_beats)
  :String(storyboard.middleBeats||'').split(/\n|;/).map(s=>s.trim()).filter(Boolean);
 const middleText=middles.map(s=>String(s).trim()).filter(Boolean).slice(0,6).join(' → ').slice(0,300);
 const openBeat=revealOpenBeat(revealType);

 return {
  revealType,
  firstScene:firstBrief||defaultFirstScene(revealType),
  firstProps:revealType==='door'
   ?'oversized unique pin-true handle at center, fortune-cost carved material, hanging charms'
   :'pin-true reveal craftsmanship fills the frame',
  openingFirst:firstBrief||defaultOpeningFirst(revealType),
  openingRoute:middleText
   ?('after reveal: '+openBeat+', then '+middleText)
   :('after reveal: '+openBeat+', glide through the pin world toward the couple'),
  lastPose:lastBrief||'Happy couple, romantic cinematic dramatic freeze, clear eye contact',
  openingLast:lastBrief
   ?('arrive at '+lastBrief)
   :'arrive at couple happy romantic dramatic freeze, clear eye contact',
  coupleDesc:lastBrief||'romantic wedding couple matching the pin',
  coupleShort:lastBrief?String(lastBrief).slice(0,80):'romantic wedding couple'
 };
}

function defaultFirstScene(revealType){
 switch(revealType){
  case 'envelope':return 'monumental FULLY CLOSED luxury wedding envelope that FILLS the entire 9:16 frame, sealed';
  case 'clouds':return 'a wall of cinematic clouds that FILLS the entire 9:16 frame, nothing beyond visible yet';
  case 'building_frame':return 'aesthetic architectural building frame / portal that FILLS the entire 9:16 frame, closed reveal';
  case 'arches':return 'aesthetic closed arches that FILL the entire 9:16 frame';
  case 'windows':return 'artistic closed windows that FILL the entire 9:16 frame';
  case 'door':return 'monumental FULLY CLOSED heirloom double doors that FILL the entire 9:16 frame, panels meet with no gap';
  default:return revealLabel(revealType)+' FILLS the entire 9:16 frame as the closed reveal hook (no people)';
 }
}

function defaultOpeningFirst(revealType){
 switch(revealType){
  case 'envelope':return 'monumental closed luxury envelope FILLS the entire frame (no people)';
  case 'clouds':return 'dense cinematic clouds FILL the entire frame (no people)';
  case 'building_frame':return 'closed building frame / portal FILLS the entire frame (no people)';
  case 'arches':return 'closed aesthetic arches FILL the entire frame (no people)';
  case 'windows':return 'closed artistic windows FILL the entire frame (no people)';
  case 'door':return 'monumental closed doors FILL the entire frame (no people)';
  default:return revealLabel(revealType)+' FILLS the entire frame as the closed reveal (no people)';
 }
}

/** Patch ensurePromptAffixes-style first/opening text for non-door reveals. */
export function applyRevealAffixes(key,text,revealType='door'){
 let out=String(text||'').trim();
 const type=normalizeRevealType(revealType);
 if(key==='first'){
  const prefix=revealPrefix(type);
  if(type==='door'){
   if(!out.includes('10ft-tall, opaque solid-gold double door'))out=prefix+' '+out;
  }else if(!out.includes(prefix.slice(0,40))){
   out=prefix+' '+out;
  }
 }
 if(key==='opening'&&type!=='door'){
  const beat=revealOpenBeat(type);
  out=out.replace(/doors open(?: from the handle)?/gi,beat);
  out=out.replace(/when the door opens/gi,'when the reveal opens');
 }
 return out.replace(/\s{2,}/g,' ').trim();
}
