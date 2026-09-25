// Face Swap prompt pack for openai/gpt-image-2.5-flare (same Assembly stills pipeline).
// Pipeline: split GIRL + BOY from the couple still → single-face swap onto each body →
// then dual-face couple edit. Gender words are locked: Bride = girl/woman, Groom = boy/man.
// Iterate prompts here without touching orchestration.

import {STILL_MODEL} from './assembly-template1-prompts.mjs';

export const FACE_SWAP_MODEL=STILL_MODEL;

/** Isolate the girl/woman (bride body) from the couple still — no face upload yet. */
export const SPLIT_GIRL_PROMPT=[
 'Image 1 is a romantic wedding couple still with exactly one girl/woman and one boy/man.',
 'Create a clean vertical 9:16 invitation portrait of ONLY the girl/woman from Image 1.',
 'Keep her exact body, pose, wardrobe, jewelry, hair silhouette, skin tone, lighting, art style, and background mood from Image 1.',
 'Completely remove the boy/man — no second person, no male face, no extra limbs.',
 'Soft romantic chest-up or waist-up framing. No text, letters, watermark, or logo.'
].join(' ');

/** Isolate the boy/man (groom body) from the couple still — no face upload yet. */
export const SPLIT_BOY_PROMPT=[
 'Image 1 is a romantic wedding couple still with exactly one girl/woman and one boy/man.',
 'Create a clean vertical 9:16 invitation portrait of ONLY the boy/man from Image 1.',
 'Keep his exact body, pose, wardrobe, jewelry, hair silhouette, skin tone, lighting, art style, and background mood from Image 1.',
 'Completely remove the girl/woman — no second person, no female face, no extra limbs.',
 'Soft romantic chest-up or waist-up framing. No text, letters, watermark, or logo.'
].join(' ');

/**
 * Classic single-person face swap (Ashok standard form).
 * Image 1 = body/scene to keep. Image 2 = face identity to place.
 * role: 'girl' (bride) | 'boy' (groom)
 */
export function singleFaceSwapPrompt(role='girl'){
 const who=String(role||'girl').toLowerCase()==='boy'?'boy':'girl';
 if(who==='boy'){
  return [
   'Take the face of the boy/man from the second image and seamlessly place it onto the head of the boy/man in the first image.',
   'Your output has to be the first image, but with the face from the second image.',
   'Image 1 is the groom body — keep the exact same pose, body position, posture, clothing details, background, and environment from the first image unchanged.',
   'Image 2 is ONLY the groom face identity reference (the uploaded boy/man photo). Copy his face identity onto the boy/man in Image 1.',
   'Do NOT use any girl/woman face. Do NOT turn the person into a woman. The result must remain a boy/man portrait.',
   'Keep the original pose, tone, and atmosphere from Image 1, and gently match expression to Image 1 head orientation.',
   'Make sure the lighting, shadows, skin tone consistency, and angle alignment blend naturally so the result looks like a real, single photograph.',
   'No text, letters, watermark, logo, or second person.'
  ].join(' ');
 }
 return [
  'Take the face of the girl/woman from the second image and seamlessly place it onto the head of the girl/woman in the first image.',
  'Your output has to be the first image, but with the face from the second image.',
  'Image 1 is the bride body — keep the exact same pose, body position, posture, clothing details, background, and environment from the first image unchanged.',
  'Image 2 is ONLY the bride face identity reference (the uploaded girl/woman photo). Copy her face identity onto the girl/woman in Image 1.',
  'Do NOT use any boy/man face. Do NOT turn the person into a man. The result must remain a girl/woman portrait.',
  'Keep the original pose, tone, and atmosphere from Image 1, and gently match expression to Image 1 head orientation.',
  'Make sure the lighting, shadows, skin tone consistency, and angle alignment blend naturally so the result looks like a real, single photograph.',
  'No text, letters, watermark, logo, or second person.'
 ].join(' ');
}

/**
 * Couple pin edit — Image 1 scene locked; Image 2 = bride (girl) face; Image 3 = groom (boy) face.
 * Explicit girl↔Image2 / boy↔Image3 mapping to stop cross-swaps.
 */
export const COUPLE_SWAP_PROMPT=[
 'Image 1 is the wedding couple scene. Your output must be Image 1 with only the two faces replaced.',
 'Keep the exact same pose, body position, posture, clothing details, background, environment, camera angle, art style, lighting, and 9:16 framing from Image 1 unchanged.',
 'Image 2 is the BRIDE face reference — a girl/woman photo. Take the face of the girl/woman from Image 2 and seamlessly place it onto the girl/woman (bride) in Image 1. Never put Image 2 onto the boy/man.',
 'Image 3 is the GROOM face reference — a boy/man photo. Take the face of the boy/man from Image 3 and seamlessly place it onto the boy/man (groom) in Image 1. Never put Image 3 onto the girl/woman.',
 'Do not swap genders. Do not cross the faces. Bride stays the girl/woman body; Groom stays the boy/man body.',
 'Make sure lighting, shadows, skin tone consistency, and angle alignment blend naturally so the result looks like a real, single photograph.',
 'No text, letters, watermark, logo, extra people, or cropped heads.'
].join(' ');

/** Solo bride portrait for Bride chapter (photos[0]) — girl/woman only. */
export const BRIDE_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap (one girl/woman + one boy/man).',
 'Image 2 is the bride identity reference — a girl/woman face photo.',
 'Create a clean 9:16 portrait of ONLY the girl/woman (bride) from Image 1, with the face identity from Image 2.',
 'Remove the boy/man completely. Do not show a male face. Soft romantic invitation portrait, centered, chest-up or waist-up.',
 'No text, letters, watermark, or second person.'
].join(' ');

/** Solo groom portrait for Groom chapter (photos[1]) — boy/man only. */
export const GROOM_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap (one girl/woman + one boy/man).',
 'Image 2 is the groom identity reference — a boy/man face photo.',
 'Create a clean 9:16 portrait of ONLY the boy/man (groom) from Image 1, with the face identity from Image 2.',
 'Remove the girl/woman completely. Do not show a female face. Soft romantic invitation portrait, centered, chest-up or waist-up.',
 'No text, letters, watermark, or second person.'
].join(' ');

export function splitGirlPrompt(){return SPLIT_GIRL_PROMPT;}
export function splitBoyPrompt(){return SPLIT_BOY_PROMPT;}
export function coupleSwapPrompt(){return COUPLE_SWAP_PROMPT;}
export function brideSoloPrompt(){return BRIDE_SOLO_PROMPT;}
export function groomSoloPrompt(){return GROOM_SOLO_PROMPT;}
export function brideFaceSwapPrompt(){return singleFaceSwapPrompt('girl');}
export function groomFaceSwapPrompt(){return singleFaceSwapPrompt('boy');}
