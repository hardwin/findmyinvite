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

export const REVEAL_TYPES=Object.freeze([
 'door',
 'envelope',
 'building_frame',
 'arches',
 'windows'
]);

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
 building_frame:'Make an aesthetic architectural building frame / portal FILL the entire 9:16 frame — closed or fully blocking the view beyond, pin-true material and ornament. Extreme close-up reveal hook. No people, no faces, no text, no watermark.',
 arches:'Make aesthetic closed arches FILL the entire 9:16 frame — monumental, ornate, pin-true palette and craftsmanship, nothing beyond visible yet. Extreme close-up reveal hook. No people, no faces, no text, no watermark.',
 windows:'Make artistic closed windows FILL the entire 9:16 frame — panes closed, light and motif pin-true, the window IS the shot. Extreme close-up reveal hook. No people, no faces, no text, no watermark.'
});

const REVEAL_OPEN_BEATS=Object.freeze({
 door:'doors open from the handle',
 envelope:'the envelope seal breaks and the flap opens',
 building_frame:'the building frame reveals the path beyond',
 arches:'the arches part and reveal the path beyond',
 windows:'the windows open and reveal the world beyond'
});

export function normalizeSellStage(value){
 const stage=String(value||'').trim().toLowerCase();
 return SELL_STAGES.includes(stage)?stage:'welcome';
}

export function normalizeRevealType(value){
 const raw=String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
 if(REVEAL_TYPES.includes(raw))return raw;
 if(/envelope|letter|seal/i.test(raw))return 'envelope';
 if(/build|portal|gate|facade/i.test(raw))return 'building_frame';
 if(/arch/i.test(raw))return 'arches';
 if(/window/i.test(raw))return 'windows';
 return 'door';
}

export function pinterestSearchUrl(query=''){
 const q=String(query||'indian wedding invitation cinematic couple').trim().slice(0,120)||'indian wedding invitation cinematic';
 return 'https://www.pinterest.com/search/pins/?q='+encodeURIComponent(q)+'&rs=typed';
}

export function revealPrefix(revealType='door'){
 return REVEAL_PREFIXES[normalizeRevealType(revealType)]||REVEAL_PREFIXES.door;
}

export function revealOpenBeat(revealType='door'){
 return REVEAL_OPEN_BEATS[normalizeRevealType(revealType)]||REVEAL_OPEN_BEATS.door;
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
  revealPrefix(type),
  'Edit pin into FIRST FRAME reveal hook — vertical 9:16. The reveal fills the frame. No people, no faces, no text, no watermark.',
  'Reveal type: '+type+'.',
  note?('Storyboard first brief: '+note):'',
  style?('Style from theme: '+style):''
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
  case 'building_frame':return 'aesthetic architectural building frame / portal that FILLS the entire 9:16 frame, closed reveal';
  case 'arches':return 'aesthetic closed arches that FILL the entire 9:16 frame';
  case 'windows':return 'artistic closed windows that FILL the entire 9:16 frame';
  default:return 'monumental FULLY CLOSED heirloom double doors that FILL the entire 9:16 frame, panels meet with no gap';
 }
}

function defaultOpeningFirst(revealType){
 switch(revealType){
  case 'envelope':return 'monumental closed luxury envelope FILLS the entire frame (no people)';
  case 'building_frame':return 'closed building frame / portal FILLS the entire frame (no people)';
  case 'arches':return 'closed aesthetic arches FILL the entire frame (no people)';
  case 'windows':return 'closed artistic windows FILL the entire frame (no people)';
  default:return 'monumental closed doors FILL the entire frame (no people)';
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
  }else if(!out.includes(prefix.slice(0,48))){
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
