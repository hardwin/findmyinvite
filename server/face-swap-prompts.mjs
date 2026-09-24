// Face Swap prompt pack for openai/gpt-image-2.5-flare (same Assembly stills pipeline).
// Multi-image edits: Image 1 = scene, Image 2+ = identity refs. Iterate here without touching orchestration.

import {STILL_MODEL} from './assembly-template1-prompts.mjs';

export const FACE_SWAP_MODEL=STILL_MODEL;

/** Couple pin edit — replace only faces; lock pose / wardrobe / scene. */
export const COUPLE_SWAP_PROMPT=[
 'Image 1 is the template couple scene. Pose, body proportions, wardrobe, hands, jewelry, background, camera angle, art style, lighting, and 9:16 framing are LOCKED.',
 'Image 2 is the bride face reference — use it as the identity source for the woman in Image 1.',
 'Image 3 is the groom face reference — use it as the identity source for the man in Image 1.',
 'Replace ONLY the faces of the couple in Image 1 with the identities from Images 2 and 3.',
 'Preserve skin-tone lighting that matches the scene. Keep expressions natural and photoreal / matching the pin style.',
 'Do not change clothes, hair length dramatically, body shape, pose, or background.',
 'No text, letters, watermark, logo, extra people, or cropped heads.'
].join(' ');

/** Solo bride portrait for Bride chapter (photos[0]). */
export const BRIDE_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap.',
 'Image 2 is the bride face reference (identity source).',
 'Create a clean 9:16 portrait of ONLY the bride from Image 1, matching Image 2 identity closely.',
 'Soft romantic invitation portrait, centered, chest-up or waist-up, matching the palette and art style of Image 1.',
 'Single person only — no groom, no second face, no text, no watermark.'
].join(' ');

/** Solo groom portrait for Groom chapter (photos[1]). */
export const GROOM_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap.',
 'Image 2 is the groom face reference (identity source).',
 'Create a clean 9:16 portrait of ONLY the groom from Image 1, matching Image 2 identity closely.',
 'Soft romantic invitation portrait, centered, chest-up or waist-up, matching the palette and art style of Image 1.',
 'Single person only — no bride, no second face, no text, no watermark.'
].join(' ');

export function coupleSwapPrompt(){return COUPLE_SWAP_PROMPT;}
export function brideSoloPrompt(){return BRIDE_SOLO_PROMPT;}
export function groomSoloPrompt(){return GROOM_SOLO_PROMPT;}
