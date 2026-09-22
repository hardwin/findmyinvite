// Template 1 prompt pack: BASE templates (any pin) + optional Kaatrukulle defaults + Astra Light pin filler.
// Recipe source of truth: documents/template1-base-prompts.md (from Example.md / wire-proven Kaatrukulle).

export const IMAGE_MODEL='xai/grok-imagine-image';
export const HERO_VIDEO_MODEL='xai/grok-imagine-video-1.5';
export const OPENING_VIDEO_MODEL='grok-imagine-video-1.5';
export const OPENING_SECONDS=12;
export const HERO_SECONDS=6;
export const HOLD_SECONDS=3;
export const DEFAULT_PROMPT_MODEL='gpt-6-astra';

export const STYLE_CARD_KEYS=Object.freeze([
 'STYLE_MEDIUM','PAPER_GROUND','PALETTE','MOTIF_ORNAMENT','WORLD_SETTING','COUPLE_LOOKS','AMBIENT_MOTION',
 'DOOR_MATERIAL','DOOR_HANDLE','DOOR_CHARMS'
]);

/** BASE prompts — slots only; never bake a fixed palette/style into these. */
export const BASE_PROMPTS=Object.freeze({
 first:'Edit pin into FIRST FRAME: monumental FULLY CLOSED double doors FILL the entire 9:16 frame edge-to-edge (90%+ of the picture — the door IS the shot, not a tiny cabinet in a room, no empty sky above). Panels meet with no gap. Unique {STYLE_MEDIUM} craftsmanship in {PALETTE} that would cost a fortune to commission: {DOOR_MATERIAL}. Handle is the MAIN FOCUS — unique oversized {DOOR_HANDLE} at center, detailed and lit. Adorn with {DOOR_CHARMS} and {MOTIF_ORNAMENT} from {WORLD_SETTING}. {PAPER_GROUND} ambience only at extreme edges. Extreme close-up, camera almost touching the door. No people/faces/text/watermark.',
 last:'Edit this pin into a romantic closing frame: same two people ({COUPLE_LOOKS}), {STYLE_MEDIUM}. Facing each other, holding both hands, CLEAR eye contact. {PAPER_GROUND}, {PALETTE}. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
 lastRegen:'Edit this pin into a romantic closing frame: same two people ({COUPLE_LOOKS}), {STYLE_MEDIUM}. Facing each other, holding both hands, CLEAR eye contact. {PAPER_GROUND}, {PALETTE}. Soft non-IP. ABSOLUTELY NO TEXT of any kind: no words, no letters, no captions, no labels, no titles, no watermark, no signage, blank surfaces only.',
 heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. {COUPLE_LOOKS}. CENTER and UPPER ~70% EMPTY {PAPER_GROUND} sky for text. Thin ornamental borders 8–12% inset only — no thick curtains or pillars. {MOTIF_ORNAMENT}. Paper texture, pigment drips under couple. Soft romantic {STYLE_MEDIUM}. Soft non-IP. 9:16.',
 plate1:'Thin ornamental borders only 8–12% inset. Empty {PAPER_GROUND} center for text. {MOTIF_ORNAMENT} matching pin palette. {STYLE_MEDIUM}. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
 plate2:'Thin ornamental borders only 8–12% inset. Empty {PAPER_GROUND} center for text. Different unique arrangement: {MOTIF_ORNAMENT} (vary corners / clusters / drips vs plate A). {STYLE_MEDIUM}. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
 heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, {AMBIENT_MOTION}, no body/hand acting, no zoom, ambient flicker only',
 opening:'Vertical 9:16 cinematic invitation opening, '+OPENING_SECONDS+' seconds. FIRST: monumental closed doors FILL the entire frame (no people), hold ~1s → doors open from the handle, glide through {WORLD_SETTING} ({PALETTE}, {PAPER_GROUND}) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~'+HOLD_SECONDS+'s hold on eye contact. Static on that beat; {AMBIENT_MOTION} only. No zoom, no new poses, no text.'
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

/** Legacy slot filler used by tests / operator promptParams overrides. */
export function buildPrompts(overrides={}){
 const p=resolveParams(overrides);
 const plus=p.paletteA+' + '+p.paletteB;
 const and=p.paletteA+' and '+p.paletteB;
 const dash=p.paletteA+'–'+p.paletteB;
 return {
  first:'Edit pin into FIRST FRAME: '+p.firstScene+'. Unique '+p.style+' craftsmanship in '+plus+' washes that would cost a fortune to commission. Handle is the MAIN FOCUS — '+p.firstProps+'. '+p.paper+' ambience only at extreme edges. Extreme close-up. No people/faces/text/watermark.',
  last:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
  lastRegen:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. ABSOLUTELY NO TEXT of any kind: no words, no letters, no captions, no labels, no titles, no watermark, no signage, blank surfaces only.',
  heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. '+p.coupleShort+'. CENTER and UPPER ~70% EMPTY '+p.paperColor+' watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.',
  plate1:'Thin ornamental watercolor borders only 8–12% inset. Empty '+p.paper+' center for text. Delicate '+dash+' watercolor filigree, '+p.motifA+' matching '+p.pinPalette+'. '+cap(p.style)+'. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
  plate2:'Thin ornamental watercolor borders only 8–12% inset. Empty '+p.paper+' center for text. Different unique arrangement: delicate '+dash+' watercolor filigree corners, '+p.motifB+' matching same romantic pin palette. '+cap(p.style)+'. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
  heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only',
  opening:'Vertical 9:16 cinematic watercolor invitation opening, '+OPENING_SECONDS+' seconds. FIRST: '+p.openingFirst+', hold ~1s → doors open, '+p.openingRoute+' → '+p.openingLast+'. LAST ~'+HOLD_SECONDS+'s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no text.',
  params:p,
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
 for(const [key,tpl] of Object.entries(BASE_PROMPTS))prompts[key]=fill(tpl);
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
  '- MOTIF_ORNAMENT what borders/props look like (NOT generic vines unless the pin shows them)',
  '- WORLD_SETTING  place/world of the pin',
  '- COUPLE_LOOKS   clothes + hair props from the pin (short)',
  '- AMBIENT_MOTION soft motion that matches the medium',
  '- DOOR_MATERIAL  unique fortune-cost door material invented FROM the pin (not a mediocre wardrobe)',
  '- DOOR_HANDLE    unique handle material/shape that is the visual hero of FIRST',
  '- DOOR_CHARMS    hanging charms / tokens / ornaments that belong to the pin world',
  'Hard rules that must remain in every filled prompt:',
  '- Soft non-IP (no franchise/brand names)',
  '- 9:16 where the BASE says so',
  '- FIRST door FILLS the entire visible frame (90%+). Handle is the main focus. No tiny cabinet.',
  '- No people on FIRST / plates',
  '- No text / letters / watermark / labels',
  '- Thin borders 8–12% only; empty center; no thick curtains or pillars',
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
 for(const key of Object.keys(BASE_PROMPTS))out[key]=softNonIp(prompts[key])||filled.prompts[key];
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
