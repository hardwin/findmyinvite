// Strict modern painterly 2D prompts for the Anbil Avan character profile.
// Deliberately independent of the Temple 3D cartoon prompts.
export const CHARACTER_SET_PROMPT_REVISION='anbil-avan-full-character-v4';
const style='a modern painterly 2D illustration: flat 2D shapes with soft gouache-like texture, gentle hand-painted shading, clean simplified features and the same line quality and colour palette. It must stay clearly 2D: no 3D render, no CGI, no glossy toy or animated-movie look and no photographic skin';
const likeness='Identity comes first: keep their recognisable face shape, eyes, eyebrows, nose, lips and smile, skin tone, facial hair exactly as they have it, spectacles only if worn on the face, and their hairstyle and hairline';
const role=person=>person==='bride'?'the bride (the woman)':'the groom (the man)';
const alpha='Output a PNG with a REAL transparent background (alpha channel). No added scenery, floor, text, names, watermark, border or grey-and-white checkerboard. Preserve any existing framed print in the target artwork.';
export function identityPrompt(person,tracking=''){
 return [`Picture 1 is a real photo of ${role(person)}. Picture 2 is the approved illustrated ${person} from our wedding film.`,
  `Draw ONE character reference of the person in picture 1 as ${style}, exactly matching picture 2's art style.`,
  `${likeness}. Dress them in picture 2's outfit, jewellery and colours; ignore the clothes, background, pose, headwear and accessories in picture 1.`,
  'Front-facing head-to-waist portrait, centred, relaxed friendly expression. '+alpha,
  tracking?`Tracking reference ${tracking}; never draw this reference.`:''].filter(Boolean).join('\n\n');
}
// Directions are screen-relative and describe the character layer used in the film.
const sceneActing={
 openingCouple:'The bride in rose stands on the left in front of the taller groom in teal. Both look at the camera with their heads leaning together. Keep their original shoulder overlap.',
 heartCouple:'Keep the bride on the left and groom on the right, turned toward each other in three-quarter view. Their eyes meet. Preserve the complete heart made by their fingers between their chests.',
 umbrellaBride:'Keep the solo bride facing the viewer beneath the open yellow umbrella. Retain the tilt of the canopy and the position of her hand wrapped around the shaft.',
 bridePortrait:'Keep the solo bride in pale yellow facing the viewer, with her relaxed shoulders and long hair falling over the shoulder on screen left.',
 groomPrint:'Inside the photographic print the groom faces the viewer, one hand at his hip, the other arm down. Preserve the white paper border and the full original crop.',
 groomPortrait:'The solo groom in the open teal shirt faces the viewer. Keep his slight head tilt, smile, shoulder line and the jacket silhouette.',
 weddingCouple:'The bride in lavender stands on the left facing the groom. Her hand rests on his arm. Their eyes meet as he inclines his head toward her. Keep both three-quarter profiles.',
 receptionCouple:'The bride on the left stands upright in her coral dress. Her inside arm reaches naturally up and her relaxed hand rests on the near shoulder of the groom in indigo. Her outside arm hangs down. Keep the visible wrist and fingers where they meet his shoulder. They turn gently toward each other, smiling and meeting each other’s eyes. Preserve the open space between their heads.',
 closingCouple:'The bride in rose is in front on the left, with the groom in sage behind her right shoulder. Both smile at the viewer. Preserve their overlapping bodies and the distinct head tilts of this closing portrait.'
};
function legacyPosePrompt(pose,tracking=''){
 const people=pose.people,count=people.length;
 const refs=people.map((person,i)=>`Picture ${i+2} is the approved illustrated identity reference of ${role(person)}.`).join(' ');
 const target='Picture 1';
 return [`EDIT ${target.toUpperCase()}; do not redesign it. ${target} is the approved "${pose.label}" artwork from our 2D wedding film. ${refs}`,
  count>1?`In ${target.toLowerCase()} the woman is the bride and the man is the groom. Give each of them only their own identity reference.`:'',
  sceneActing[pose.slot],
  `Identity references describe WHO they are, never their head orientation. Picture 1 sets the eyeline, nose direction, foreshortening, mouth angle and the pitch and roll of each head. Rotate their recognisable faces into ${target.toLowerCase()}'s existing head angles; do not copy a frontal identity-reference pose. Preserve the target's warm directional rim highlights on hair, cheek and clothing, without flattening its lighting.`,
  `Replace ONLY the face and hair of ${people.map(role).join(' and ')} in ${target.toLowerCase()} with the matching identity reference, drawn in ${target.toLowerCase()}'s exact style: ${style}. ${likeness}.`,
  `Keep EVERYTHING else in ${target.toLowerCase()} exactly the same: pose, hands, gaze direction, body proportions, head size and position, outfits, jewellery, colours, lighting, line style, silhouette, size and placement on the canvas.`,
  pose.print?`${target} is a hanging photo print: keep the print's border/frame, paper, edges and clip exactly as they are; only the groom's face and hair inside the print change.`:'',
  `Do not add or remove people, props, text or scenery. ${alpha}`,
  tracking?`Tracking reference ${tracking}; never draw this reference.`:''].filter(Boolean).join('\n\n');
}
export function posePrompt(pose,tracking='',revision=CHARACTER_SET_PROMPT_REVISION,hasCoupleReference=false){
 if(revision!==CHARACTER_SET_PROMPT_REVISION)return legacyPosePrompt(pose,tracking);
 const descriptions=pose.people.map((person,i)=>`Picture ${2+i*2} is the customer photo for the ${person}. Picture ${3+i*2} is their saved illustrated identity for likeness continuity.`);
 return [
  `Redraw the complete character layer for "${pose.label}" in the exact painterly 2D style, lighting, crop, and composition of Picture 1. Generate the people from head through every visible part of their body, including their hands and feet when visible.`,
  ...descriptions,hasCoupleReference?`Picture ${2+pose.people.length*2} is the shared couple reference for their relative height, posture, gaze and interaction.`:'',
  'Picture 1 alone supplies every garment, cut, neckline, sleeve, drape, print, shoe, piece of jewellery, prop and colour. Dress each person entirely in their corresponding scene outfit. Ignore all clothing and accessories from the reference photos and saved portraits.',
  'Use the customer photos for each person’s likeness, natural build, head-to-body proportions, skin tone, hair texture, hairline, facial hair and precise direction of gaze. Keep their shoulders, arms and torso anatomically consistent with that build. Use only visible evidence. When the photos show only faces, use natural proportions for the scene.',
  pose.people.length>1?'Stage the same couple action and screen positions as Picture 1. Where the customer photos show them together, follow their relative proportions, posture, head angles, gaze and interaction within that composition. With separate portraits, follow their individual features and use the scene for relationship cues missing from the photos.':'Follow the scene action, framing and props while using the customer’s head angle and gaze.',
  pose.print?'Retain the complete hanging print, clip and paper border around the newly drawn character.':'',
  `Exactly ${pose.people.length} ${pose.people.length===1?'person':'people'} in the supplied scene crop. Keep all visible fabric and hair within the layer. ${alpha}`,
  tracking?`Tracking reference ${tracking}; never draw this reference.`:''
 ].filter(Boolean).join('\n\n');
}
// Same Replicate transport fields as the existing character provider; portrait canvas.
export const characterSetInput=(prompt,images,aspectRatio='2:3')=>({prompt,input_images:images,aspect_ratio:aspectRatio,quality:'high',complexity:'low',output_format:'png',background:'transparent',number_of_images:1});
