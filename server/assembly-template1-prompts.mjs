// Template 1 prompt pack: BASE templates (any pin) + optional Kaatrukulle defaults + Astra Light pin filler.
// Recipe source of truth: documents/template1-base-prompts.md (from Example.md / wire-proven Kaatrukulle).

import {normalizeRevealType,revealOpenBeat} from './assembly-sell-path.mjs';

/** Door-First, last, and hero stills — Replicate OpenAI. */
export const STILL_MODEL='openai/gpt-image-2.5-flare';
/** Section frame / plate backgrounds — Replicate xAI Imagine. */
export const PLATE_MODEL='xai/grok-imagine-image';
/** @deprecated Prefer STILL_MODEL / PLATE_MODEL. Kept as the primary still default. */
export const IMAGE_MODEL=STILL_MODEL;
export const HERO_VIDEO_MODEL='xai/grok-imagine-video-1.5';
export const OPENING_VIDEO_MODEL='grok-imagine-video-1.5';
export const OPENING_SECONDS=12;
export const HERO_SECONDS=6;
export const HOLD_SECONDS=3;
export const DEFAULT_PROMPT_MODEL='gpt-6-astra';

export const DOOR_STILL_PREFIX='Make the door as a 10ft-tall, opaque solid-gold double door with an elegant arched top, intricate gold carvings, colorful gemstones, diamonds, and sparkling reflections. Build a seamless ivory textured marble wall around it, with a larger decorative marble arch supported by ornate pillars, gold accents, and flowering vines. Replace the floor with a lush green lawn, stepping stones, and rose petals. Add multiple layers of warm glowing lanterns, from blurred foreground standing lamps to midground and background lights, creating cinematic depth. Frame the scene with softly blurred trees and flowers. Symmetrical composition, magical golden-hour lighting, photorealistic luxury fantasy aesthetic, no humans.';

export const OPENING_MOTION_PREFIX='8k high quality, Cinematic motion graphics with Parallax camera movement, 2.5D scene setup, Planes at different long Z-depths with camera animation, always there is Ethereal atmospheric scene with organic ambient motion, floating natural motifs like butterflies, leaves, and petals drifting in layered parallax, soft lighting, depth-rich composition, cinematic fast glide camera movement, 2.5D multiplane effect, minimal and modern aesthetic.';

export const OPENING_MOTION_SUFFIX='Overall vibe should be Ethereal atmospheric scene with organic ambient motion, floating natural motifs like butterflies, leaves, and petals drifting in layered parallax, soft lighting, depth-rich composition, cinematic fast and ease camera movement, 2.5D multiplane effect, minimal and modern aesthetic.';

export const OPENING_SAVE_THE_DATE='when the door opens show a bullet time camera ultra slowmo at the levitating bold big white text in wedding stylish 3d handwritten font which says "SAVE THE DATE" in the middle';

export function ensurePromptAffixes(key,text,revealType='door'){
 let out=String(text||'').trim();
 const reveal=String(revealType||'door').toLowerCase();
 // Non-door reveals: do not force the solid-gold door prefix — sell-path storyboard owns the hook.
 if(key==='first'){
  if(reveal==='door'||reveal===''||!reveal){
   if(!out.includes('10ft-tall, opaque solid-gold double door'))out=DOOR_STILL_PREFIX+' '+out;
  }
 }
 if(key==='opening'){
  if(!out.includes('8k high quality, Cinematic motion graphics'))out=OPENING_MOTION_PREFIX+' '+out;
  if(!out.includes('SAVE THE DATE')){
   const revealOpen=out.search(/doors open(?: from the handle)?|envelope seal breaks|building frame reveals|arches part|windows open|clouds part|parts and reveals/i);
   if(revealOpen>=0){
    const cut=out.indexOf(',',revealOpen);
    const at=cut>=0?cut+1:revealOpen;
    // Keep SAVE THE DATE beat; for non-door, soften "when the door opens" wording later in sell-path.
    const saveBeat=reveal==='door'||!reveal
     ?OPENING_SAVE_THE_DATE
     :OPENING_SAVE_THE_DATE.replace(/when the door opens/i,'when the reveal opens');
    out=out.slice(0,at)+' '+saveBeat+','+out.slice(at);
   }else out=out.replace(OPENING_MOTION_SUFFIX, OPENING_SAVE_THE_DATE+'. '+OPENING_MOTION_SUFFIX);
   if(!out.includes('SAVE THE DATE'))out=out+' '+OPENING_SAVE_THE_DATE;
  }
  if(!out.includes('Overall vibe should be Ethereal atmospheric scene'))out=out+' '+OPENING_MOTION_SUFFIX;
 }
 return out.replace(/\s{2,}/g,' ').trim();
}

export const STYLE_CARD_KEYS=Object.freeze([
 'STYLE_MEDIUM','PAPER_GROUND','PALETTE','MOTIF_ORNAMENT','WORLD_SETTING','COUPLE_LOOKS','AMBIENT_MOTION',
 'DOOR_MATERIAL','DOOR_HANDLE','DOOR_CHARMS'
]);

/** BASE prompts — slots only; never bake a fixed palette/style into these. */
export const BASE_PROMPTS=Object.freeze({
 first:DOOR_STILL_PREFIX+' Edit pin into FIRST FRAME: monumental FULLY CLOSED double doors FILL the entire 9:16 frame edge-to-edge (90%+ of the picture — the door IS the shot, not a tiny cabinet in a room, no empty sky above). Panels meet with no gap. Unique {STYLE_MEDIUM} craftsmanship in {PALETTE} that would cost a fortune to commission: {DOOR_MATERIAL}. Handle is the MAIN FOCUS — unique oversized {DOOR_HANDLE} at center, detailed and lit. Adorn with {DOOR_CHARMS} and {MOTIF_ORNAMENT} from {WORLD_SETTING}. {PAPER_GROUND} ambience only at extreme edges. Extreme close-up, camera almost touching the door. No people/faces/text/watermark.',
 last:'Edit this pin into a romantic closing frame: same two people ({COUPLE_LOOKS}), {STYLE_MEDIUM}. Facing each other, holding both hands, CLEAR eye contact. {PAPER_GROUND}, {PALETTE}. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
 lastRegen:'Edit this pin into a romantic closing frame: same two people ({COUPLE_LOOKS}), {STYLE_MEDIUM}. Facing each other, holding both hands, CLEAR eye contact. {PAPER_GROUND}, {PALETTE}. Soft non-IP. ABSOLUTELY NO TEXT of any kind: no words, no letters, no captions, no labels, no titles, no watermark, no signage, blank surfaces only.',
 heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. {COUPLE_LOOKS}. CENTER and UPPER ~70% EMPTY {PAPER_GROUND} sky for text. Thin ornamental borders 8–12% inset only — no thick curtains or pillars. {MOTIF_ORNAMENT}. Paper texture, pigment drips under couple. Soft romantic {STYLE_MEDIUM}. Soft non-IP. 9:16.',
 plate1:'Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: interpret the pin’s decoration as an exceptionally fine elegant border with restrained detail concentrated at the outer edges and corners — {MOTIF_ORNAMENT} in {PALETTE}; preserve the pin’s distinctive colors and artistic character. Avoid thick frames, oversized flowers, or heavy ornament. Any metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform {PAPER_GROUND} with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. Do not create a separate white panel or inset box. Carry the pin’s richer colors into the fine border and corner details; use a pale warm variation of its background color for the writing surface. Output: full-bleed high-resolution background only, 9:16, edge-to-edge paper viewed straight on — not a card photographed on a table. Fine material detail without sharpening halos or repetitive texture patterns. {STYLE_MEDIUM}. Unique plate A. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area. Tactile richness at the edges; effortless readability in the center.',
 plate2:'Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: different unique arrangement of an exceptionally fine elegant border with restrained detail at outer edges and corners (vary corners / clusters vs plate A) — {MOTIF_ORNAMENT} in {PALETTE}; preserve the pin’s distinctive colors and artistic character. Avoid thick frames, oversized flowers, or heavy ornament. Any metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform {PAPER_GROUND} with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. Do not create a separate white panel or inset box. Carry the pin’s richer colors into the fine border and corner details; use a pale warm variation of its background color for the writing surface. Output: full-bleed high-resolution background only, 9:16, edge-to-edge paper viewed straight on — not a card photographed on a table. Fine material detail without sharpening halos or repetitive texture patterns. {STYLE_MEDIUM}. Unique plate B. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area. Tactile richness at the edges; effortless readability in the center.',
 heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, {AMBIENT_MOTION}, no body/hand acting, no zoom, ambient flicker only',
 opening:OPENING_MOTION_PREFIX+' Vertical 9:16 cinematic invitation opening, '+OPENING_SECONDS+' seconds. FIRST: monumental closed doors FILL the entire frame (no people), hold ~1s → doors open from the handle, '+OPENING_SAVE_THE_DATE+' → glide through {WORLD_SETTING} ({PALETTE}, {PAPER_GROUND}) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~'+HOLD_SECONDS+'s hold on eye contact. Static on that beat; {AMBIENT_MOTION} only. No zoom, no new poses, no extra titles besides SAVE THE DATE. '+OPENING_MOTION_SUFFIX
});

/** Kaatrukulle wire-proven defaults — fallback / tests only. Live jobs prefer Astra Light from the pin. */
export const DEFAULT_PARAMS=Object.freeze({
 style:'modern 2D watercolor paper-texture',
 paper:'cream handmade paper',
 paperColor:'cream',
 paletteA:'magenta',
 paletteB:'sage',
 firstScene:'monumental FULLY CLOSED heirloom double doors that FILL the entire 9:16 frame, panels meet with no gap',
 firstProps:'oversized unique pin-true handle at center, fortune-cost carved material, hanging charms',
 coupleDesc:'man in white shirt, woman in magenta dress with purple flower in hair',
 coupleShort:'Man white shirt, woman magenta dress + purple flower in hair',
 lastPose:'Facing each other, holding both hands, CLEAR eye contact',
 motifA:'tiny blossoms, paper-edge pigment',
 motifB:'tiny blossom clusters, soft paper-edge pigment drips',
 pinPalette:'romantic garden pin palette',
 openingFirst:'monumental closed doors FILL the entire frame (no people)',
 openingRoute:'glide through watercolor forest (sage trees, magenta wildflowers, cream paper)',
 openingLast:'arrive at couple facing, holding hands, CLEAR eye contact'
});

export const DEFAULT_STYLE_CARD=Object.freeze({
 STYLE_MEDIUM:'modern 2D watercolor paper-texture',
 PAPER_GROUND:'cream handmade paper',
 PALETTE:'magenta + sage washes',
 MOTIF_ORNAMENT:'delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment drips',
 WORLD_SETTING:'romantic garden — carved wooden doors, floral arch, trees behind, forest path',
 COUPLE_LOOKS:'man in white shirt, woman in magenta dress with purple flower in hair',
 AMBIENT_MOTION:'petals fall; watercolor paper ambient flicker',
 DOOR_MATERIAL:'carved heirloom garden doors in watercolor wood-grain with floral inlay and pigment-gold leaf — a fortune to commission',
 DOOR_HANDLE:'oversized sculpted blossom-and-vine handle in magenta-sage pigment metal',
 DOOR_CHARMS:'tiny hanging blossoms, paper charms, pigment drips, heart-petal tokens'
});

const IP_BLOCKLIST=[
 'disney','pixar','marvel','dc comics','spider-man','spiderman','spiderverse','batman','superman','avengers',
 'ghibli','studio ghibli','totoro','naruto','one piece','dragon ball','pokemon','pokémon','hello kitty',
 'barbie','lego','harry potter','hogwarts','star wars','frozen','elsa','mickey','minnie','nintendo','mario','zelda',
 'ktm','coca-cola','nike','adidas','gucci','louis vuitton','chanel'
];

export function softNonIp(text){
 let out=String(text||'');
 for(const word of IP_BLOCKLIST){
  const re=new RegExp('\\b'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi');
  out=out.replace(re,'');
 }
 return out.replace(/\s{2,}/g,' ').replace(/\s+([,.;])/g,'$1').trim();
}

function cap(text){
 const s=String(text||'');
 return s?s[0].toUpperCase()+s.slice(1):s;
}

export function resolveParams(overrides={}){
 const merged={...DEFAULT_PARAMS};
 for(const [key,value] of Object.entries(overrides||{})){
  if(!(key in DEFAULT_PARAMS))continue;
  const text=softNonIp(value);
  if(text)merged[key]=text;
 }
 return merged;
}

/** Legacy slot filler used by tests / operator promptParams overrides (incl. sell-path storyboard). */
export function buildPrompts(overrides={}){
 const p=resolveParams(overrides);
 const revealType=normalizeRevealType(overrides.revealType||overrides.reveal_type||p.revealType||'door');
 const plus=p.paletteA+' + '+p.paletteB;
 const and=p.paletteA+' and '+p.paletteB;
 const dash=p.paletteA+'–'+p.paletteB;
 const openBeat=revealOpenBeat(revealType);
 const firstBody=revealType==='door'
  ?('Edit pin into FIRST FRAME: '+p.firstScene+'. Unique '+p.style+' craftsmanship in '+plus+' washes that would cost a fortune to commission. Handle is the MAIN FOCUS — '+p.firstProps+'. '+p.paper+' ambience only at extreme edges. Extreme close-up. No people/faces/text/watermark.')
  :('Edit pin into FIRST FRAME reveal hook ('+revealType+'): '+p.firstScene+'. Unique '+p.style+' craftsmanship in '+plus+' washes. '+p.firstProps+'. '+p.paper+' ambience only at extreme edges. Extreme close-up. No people/faces/text/watermark.');
 return {
  first:ensurePromptAffixes('first',firstBody,revealType),
  last:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
  lastRegen:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. ABSOLUTELY NO TEXT of any kind: no words, no letters, no captions, no labels, no titles, no watermark, no signage, blank surfaces only.',
  heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. '+p.coupleShort+'. CENTER and UPPER ~70% EMPTY '+p.paperColor+' watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.',
  plate1:'Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: interpret the pin’s decoration as an exceptionally fine elegant border with restrained detail at outer edges and corners — delicate '+dash+' watercolor filigree, '+p.motifA+' matching '+p.pinPalette+'. Avoid thick frames, oversized flowers, or heavy ornament. Metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform '+p.paper+' with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. No separate white panel or inset box. Carry richer pin colors into the fine border and corners; pale warm writing surface. Full-bleed 9:16, edge-to-edge paper straight on — not a card on a table. Fine material detail without sharpening halos or repetitive texture patterns. '+cap(p.style)+'. Unique plate A. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area.',
  plate2:'Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: different unique arrangement of an exceptionally fine elegant border at outer edges and corners (vary corners / clusters vs plate A) — delicate '+dash+' watercolor filigree corners, '+p.motifB+' matching same romantic pin palette. Avoid thick frames, oversized flowers, or heavy ornament. Metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform '+p.paper+' with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. No separate white panel or inset box. Carry richer pin colors into the fine border and corners; pale warm writing surface. Full-bleed 9:16, edge-to-edge paper straight on — not a card on a table. Fine material detail without sharpening halos or repetitive texture patterns. '+cap(p.style)+'. Unique plate B. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area.',
  heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only',
  opening:ensurePromptAffixes('opening','Vertical 9:16 cinematic watercolor invitation opening, '+OPENING_SECONDS+' seconds. FIRST: '+p.openingFirst+', hold ~1s → '+openBeat+', '+OPENING_SAVE_THE_DATE+' → '+p.openingRoute+' → '+p.openingLast+'. LAST ~'+HOLD_SECONDS+'s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no extra titles besides SAVE THE DATE.',revealType),
  params:{...p,revealType},
  source:'defaults'
 };
}

export function fillBasePrompts(styleCard={}){
 const card={};
 for(const key of STYLE_CARD_KEYS){
  const value=softNonIp(styleCard[key]||DEFAULT_STYLE_CARD[key]||'');
  if(!value)throw new Error('Style card missing '+key);
  card[key]=value;
 }
 const fill=(tpl)=>softNonIp(String(tpl).replace(/\{([A-Z_]+)\}/g,(_,key)=>{
  if(!(key in card))throw new Error('Unknown prompt slot {'+key+'}');
  return card[key];
 }));
  const prompts={};
 for(const [key,tpl] of Object.entries(BASE_PROMPTS))prompts[key]=ensurePromptAffixes(key,fill(tpl));
 return {styleCard:card,prompts,source:'style-card'};
}

export const TEXT_QA_PROMPT='Look at this image. Does it contain any readable text, letters, words, captions, labels, titles, signage or watermark? Answer with exactly one word: YES or NO.';

export function promptWriterInstructions(){
 return [
  'You write FindMyInvite Template 1 image/video prompts from ONE pin image.',
  'Follow the BASE templates exactly: substitute {SLOTS} from what you see in the pin. Do NOT invent MAIN/NEGATIVE fields — one prompt string per asset only.',
  'Extract a style card from the pin (do NOT guess a default magenta/sage kit unless the pin actually looks like that):',
  '- STYLE_MEDIUM  e.g. modern 2D watercolor paper-texture / neon ink / oil paint / etc.',
  '- PAPER_GROUND  e.g. cream handmade paper / charcoal ground / …',
  '- PALETTE       short wash phrase matching the pin',
  '- MOTIF_ORNAMENT fine border/corner motifs from the pin (exceptionally restrained filigree — NOT thick frames, oversized flowers, or generic vines unless the pin shows them)',
  '- WORLD_SETTING  place/world of the pin',
  '- COUPLE_LOOKS   clothes + hair props from the pin (short)',
  '- AMBIENT_MOTION soft motion that matches the medium',
  '- DOOR_MATERIAL  unique fortune-cost door material invented FROM the pin (not a mediocre wardrobe)',
  '- DOOR_HANDLE    unique handle material/shape that is the visual hero of FIRST',
  '- DOOR_CHARMS    hanging charms / tokens / ornaments that belong to the pin world',
  'Hard rules that must remain in every filled prompt:',
  '- Soft non-IP (no franchise/brand names)',
  '- 9:16 where the BASE says so',
  '- FIRST door PREFIX is locked verbatim (10ft-tall opaque solid-gold double door, marble arch, lawn, lanterns). Do not drop or rewrite it.',
  '- FIRST door FILLS the entire visible frame (90%+). Handle is the main focus. No tiny cabinet.',
  '- OPENING PREFIX and SUFFIX are locked verbatim (8k / 2.5D parallax / ethereal overall vibe). Keep them exactly; fill only the middle BASE.',
  '- OPENING middle beat is locked verbatim: when the door opens, bullet-time ultra slowmo on levitating bold big white 3D handwritten wedding text that says SAVE THE DATE. Stills stay text-free.',
  '- No people on FIRST / plates',
  '- No text / letters / watermark / labels on stills and plates. Opening video keeps only the locked SAVE THE DATE title — nothing else.',
  '- Plates: luxurious cotton-rag stationery backgrounds — fine embossed border at edges/corners only; central 75–80% quiet text-safe writing surface; no thick curtains, pillars, chunky frames, or decoration behind text',
  '- Hero: couple ~20% bottom; upper ~70% empty for text',
  'BASE templates:',
  JSON.stringify(BASE_PROMPTS,null,2),
  'Return ONLY valid JSON (no markdown fences) shaped as:',
  '{"styleCard":{"STYLE_MEDIUM":"…","PAPER_GROUND":"…","PALETTE":"…","MOTIF_ORNAMENT":"…","WORLD_SETTING":"…","COUPLE_LOOKS":"…","AMBIENT_MOTION":"…","DOOR_MATERIAL":"…","DOOR_HANDLE":"…","DOOR_CHARMS":"…"},"prompts":{"first":"…","last":"…","lastRegen":"…","heroStill":"…","plate1":"…","plate2":"…","heroVideo":"…","opening":"…"}}',
  'Each prompts.* value must be the BASE with slots filled from your styleCard (you may lightly polish grammar but keep structure and hard rules).'
 ].join('\n');
}

function extractOutputText(response){
 if(!response)return '';
 if(typeof response.output_text==='string'&&response.output_text.trim())return response.output_text.trim();
 const parts=[];
 for(const item of response.output||[]){
  for(const content of item.content||[]){
   if(typeof content.text==='string')parts.push(content.text);
   else if(typeof content?.output_text==='string')parts.push(content.output_text);
  }
 }
 return parts.join('\n').trim();
}

export function parsePromptWriterJson(text){
 let raw=String(text||'').trim();
 const fence=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
 if(fence)raw=fence[1].trim();
 const start=raw.indexOf('{');
 const end=raw.lastIndexOf('}');
 if(start<0||end<=start)throw new Error('Prompt writer returned no JSON object.');
 const parsed=JSON.parse(raw.slice(start,end+1));
 const styleCard=parsed.styleCard||parsed.style_card||{};
 const prompts=parsed.prompts||{};
 for(const key of STYLE_CARD_KEYS){
  if(!String(styleCard[key]||'').trim())throw new Error('Prompt writer missing styleCard.'+key);
 }
 for(const key of Object.keys(BASE_PROMPTS)){
  if(!String(prompts[key]||'').trim())throw new Error('Prompt writer missing prompts.'+key);
 }
 const filled=fillBasePrompts(styleCard);
 // Prefer model-authored filled strings when present; still soft-non-IP them.
 const out={};
 for(const key of Object.keys(BASE_PROMPTS))out[key]=ensurePromptAffixes(key,softNonIp(prompts[key])||filled.prompts[key]);
 return {styleCard:filled.styleCard,prompts:out,source:'astra',raw};
}

function imageToDataUrl(image){
 if(image?.dataUrl)return image.dataUrl;
 if(image?.buffer){
  const mime=(image.contentType||'image/jpeg').split(';')[0]||'image/jpeg';
  return 'data:'+mime+';base64,'+Buffer.from(image.buffer).toString('base64');
 }
 if(image?.url&&/^https?:\/\//i.test(image.url))return image.url;
 throw new Error('Reference image missing for Template 1 prompt writer.');
}

/**
 * Fresh Astra Light call every Template 1 run: read the pin, fill BASE prompts.
 * Operator promptParams (legacy slot overrides) skip the LLM and use buildPrompts.
 */
export async function writeTemplate1PromptsFromPin({image,env=process.env,openaiClient,promptParams}={}){
 if(promptParams&&typeof promptParams==='object'&&Object.keys(promptParams).length){
  return buildPrompts(promptParams);
 }
 if(!env.OPENAI_API_KEY&&!openaiClient)throw new Error('OpenAI is not configured (OPENAI_API_KEY).');
 let client=openaiClient;
 if(!client){
  const {default:OpenAI}=await import('openai');
  client=new OpenAI({apiKey:env.OPENAI_API_KEY,timeout:120000,maxRetries:1});
 }
 const model=env.ASSEMBLY_T1_PROMPT_MODEL||env.ASSEMBLY_PROMPT_MODEL||DEFAULT_PROMPT_MODEL;
 const imageUrl=imageToDataUrl(image);
 const input=[{
  role:'user',
  content:[
   {type:'input_text',text:promptWriterInstructions()},
   {type:'input_image',image_url:imageUrl}
  ]
 }];
 let response;
 try{
  response=await client.responses.create({model,reasoning:{effort:'low'},input});
 }catch(error){
  const msg=String(error?.message||'').toLowerCase();
  if(msg.includes('reasoning')||error?.status===400){
   response=await client.responses.create({model,input});
  }else{
   console.error('Template 1 Astra prompt writer failed',error?.message||error);
   if(env.ASSEMBLY_T1_PROMPT_FALLBACK==='1')return {...buildPrompts(),source:'fallback-defaults'};
   throw error;
  }
 }
 try{
  return parsePromptWriterJson(extractOutputText(response));
 }catch(error){
  console.error('Template 1 prompt parse failed',error?.message||error);
  if(env.ASSEMBLY_T1_PROMPT_FALLBACK==='1')return {...buildPrompts(),source:'fallback-defaults'};
  throw error;
 }
}

export function styleCardToParams(styleCard={}){
 const card=fillBasePrompts(styleCard).styleCard;
 const palette=String(card.PALETTE||'');
 const [paletteA,...rest]=palette.split(/[+–—,/]| and /i).map(s=>s.replace(/\bwashes?\b/gi,'').trim()).filter(Boolean);
 return {
  style:card.STYLE_MEDIUM,
  paper:card.PAPER_GROUND,
  paperColor:card.PAPER_GROUND.split(/\s+/)[0]||'cream',
  paletteA:paletteA||'accent',
  paletteB:rest.join(' ')||'secondary',
  coupleDesc:card.COUPLE_LOOKS,
  coupleShort:cap(card.COUPLE_LOOKS),
  motifA:card.MOTIF_ORNAMENT,
  motifB:card.MOTIF_ORNAMENT,
  pinPalette:card.WORLD_SETTING,
  openingFirst:'monumental closed doors FILL the entire frame (no people)',
  openingRoute:'glide through '+card.WORLD_SETTING+' ('+card.PALETTE+', '+card.PAPER_GROUND+')',
  openingLast:'arrive at couple facing, holding hands, CLEAR eye contact'
 };
}
