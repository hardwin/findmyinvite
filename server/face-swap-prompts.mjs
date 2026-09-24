// Face Swap prompt pack for openai/gpt-image-2.5-flare (same Assembly stills pipeline).
// Multi-image edits: Image 1 = scene + pose geometry. Image 2+ = identity refs only
// (face details / shape / skin — NOT their head angle or neck). Iterate here without
// touching orchestration.

import {STILL_MODEL} from './assembly-template1-prompts.mjs';

export const FACE_SWAP_MODEL=STILL_MODEL;

/**
 * Couple pin edit — identity from refs; head pose + neck physics from Image 1.
 * Pasting the ref's face angle onto Image 1's body stretches necks ("swan neck").
 */
export const COUPLE_SWAP_PROMPT=[
 'Image 1 is the template couple scene. Body pose, head pose (yaw/pitch/roll), neck length and attachment, shoulder line, body proportions, hands, wardrobe, jewelry, hair silhouette, background, camera angle, art style, lighting, and 9:16 framing are LOCKED from Image 1.',
 'Image 2 is the bride identity reference — copy her facial features, face shape, eyes, brows, nose, lips, and skin tone onto the woman in Image 1. Do NOT copy Image 2 head angle, neck length, shoulder pose, or camera angle.',
 'Image 3 is the groom identity reference — copy his facial features, face shape, eyes, brows, nose, lips, facial hair, and skin tone onto the man in Image 1. Do NOT copy Image 3 head angle, neck length, shoulder pose, or camera angle.',
 'Re-render each swapped face so it sits in Image 1\'s exact head orientation and expression geometry. Neck must keep Image 1\'s natural length and muscle attachment — no elongated, thin, or floating necks.',
 'Preserve identity likeness strongly. You may subtly improve skin tone clarity and evenness to match Image 1 lighting, without whitening or changing ethnicity.',
 'Do not change clothes, hair length dramatically, body shape, pose, neck geometry, or background.',
 'No text, letters, watermark, logo, extra people, or cropped heads.'
].join(' ');

/** Solo bride portrait for Bride chapter (photos[0]). */
export const BRIDE_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap.',
 'Image 2 is the bride identity reference (face details / shape / skin only — not her pose).',
 'Create a clean 9:16 portrait of ONLY the bride from Image 1, matching Image 2 identity closely while keeping Image 1 head pose and natural neck proportions.',
 'Soft romantic invitation portrait, centered, chest-up or waist-up, matching the palette and art style of Image 1.',
 'Single person only — no groom, no second face, no elongated neck, no text, no watermark.'
].join(' ');

/** Solo groom portrait for Groom chapter (photos[1]). */
export const GROOM_SOLO_PROMPT=[
 'Image 1 is a couple invitation still after face swap.',
 'Image 2 is the groom identity reference (face details / shape / skin only — not his pose).',
 'Create a clean 9:16 portrait of ONLY the groom from Image 1, matching Image 2 identity closely while keeping Image 1 head pose and natural neck proportions.',
 'Soft romantic invitation portrait, centered, chest-up or waist-up, matching the palette and art style of Image 1.',
 'Single person only — no bride, no second face, no elongated neck, no text, no watermark.'
].join(' ');

export function coupleSwapPrompt(){return COUPLE_SWAP_PROMPT;}
export function brideSoloPrompt(){return BRIDE_SOLO_PROMPT;}
export function groomSoloPrompt(){return GROOM_SOLO_PROMPT;}
