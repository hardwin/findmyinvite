// Template 1 (Kaatrukulle) prompt pack. Defaults reproduce the wire-proven iteration-1 strings bit for bit.
// Source: KT_Assembly/docs/TEMPLATE1-GEN-PROMPTS-AND-IMAGE-MODEL.md (PR #27).

export const IMAGE_MODEL='xai/grok-imagine-image';
export const HERO_VIDEO_MODEL='xai/grok-imagine-video-1.5';
export const OPENING_VIDEO_MODEL='grok-imagine-video-1.5';
export const OPENING_SECONDS=12;
export const HERO_SECONDS=6;
export const HOLD_SECONDS=3;

export const DEFAULT_PARAMS=Object.freeze({
 style:'modern 2D watercolor paper-texture',
 paper:'cream handmade paper',
 paperColor:'cream',
 paletteA:'magenta',
 paletteB:'sage',
 firstScene:'FULLY CLOSED opaque carved wooden double garden doors, panels meet with no gap',
 firstProps:'floral vines on an arch, trees behind',
 coupleDesc:'man in white shirt, woman in magenta dress with purple flower in hair',
 coupleShort:'Man white shirt, woman magenta dress + purple flower in hair',
 lastPose:'Facing each other, holding both hands, CLEAR eye contact',
 motifA:'tiny blossoms, paper-edge pigment',
 motifB:'tiny blossom clusters, soft paper-edge pigment drips',
 pinPalette:'romantic garden pin palette',
 openingFirst:'closed grand watercolor garden doors (no people)',
 openingRoute:'glide through watercolor forest (sage trees, magenta wildflowers, cream paper)',
 openingLast:'arrive at couple facing, holding hands, CLEAR eye contact'
});

// Soft non-IP: strip brand / franchise words from operator-supplied hints before they reach any API.
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

export function buildPrompts(overrides={}){
 const p=resolveParams(overrides);
 const plus=p.paletteA+' + '+p.paletteB;
 const and=p.paletteA+' and '+p.paletteB;
 const dash=p.paletteA+'–'+p.paletteB;
 return {
  first:'Edit pin into FIRST FRAME: '+p.firstScene+'. 9:16. Same '+p.style+', '+p.paper+', '+plus+' washes, '+p.firstProps+'. Door fills frame. No people/faces/text/watermark.',
  last:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.',
  lastRegen:'Edit this pin into a romantic closing frame: same two people ('+p.coupleDesc+'), '+p.style+'. '+p.lastPose+'. '+cap(p.paper)+', '+and+' washes. Soft non-IP. ABSOLUTELY NO TEXT of any kind: no words, no letters, no captions, no labels, no titles, no watermark, no signage, blank surfaces only.',
  heroStill:'Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. '+p.coupleShort+'. CENTER and UPPER ~70% EMPTY '+p.paperColor+' watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.',
  plate1:'Thin ornamental watercolor borders only 8–12% inset. Empty '+p.paper+' center for text. Delicate '+dash+' watercolor filigree, '+p.motifA+' matching '+p.pinPalette+'. '+cap(p.style)+'. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
  plate2:'Thin ornamental watercolor borders only 8–12% inset. Empty '+p.paper+' center for text. Different unique arrangement: delicate '+dash+' watercolor filigree corners, '+p.motifB+' matching same romantic pin palette. '+cap(p.style)+'. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.',
  heroVideo:'static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only',
  opening:'Vertical 9:16 cinematic watercolor invitation opening, '+OPENING_SECONDS+' seconds. FIRST: '+p.openingFirst+', hold ~1s → doors open, '+p.openingRoute+' → '+p.openingLast+'. LAST ~'+HOLD_SECONDS+'s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no text.',
  params:p
 };
}

export const TEXT_QA_PROMPT='Look at this image. Does it contain any readable text, letters, words, captions, labels, titles, signage or watermark? Answer with exactly one word: YES or NO.';
