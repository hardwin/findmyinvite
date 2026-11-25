// Strict modern painterly 2D prompts for the Anbil Avan character profile.
// Deliberately independent of the Temple 3D cartoon prompts.
export const CHARACTER_SET_PROMPT_REVISION='anbil-avan-2d-identity-v2';
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
export function posePrompt(pose,tracking=''){
 const people=pose.people,count=people.length;
 const refs=people.map((person,i)=>`Picture ${i+1} is the approved illustrated identity reference of ${role(person)}.`).join(' ');
 const target=`Picture ${count+1}`;
 return [`EDIT ${target.toUpperCase()}; do not redesign it. ${target} is the approved "${pose.label}" artwork from our 2D wedding film. ${refs}`,
  count>1?`In ${target.toLowerCase()} the woman is the bride and the man is the groom. Give each of them only their own identity reference.`:'',
  ({heartCouple:'Mandatory acting: the bride and groom turn their heads inward and look into each other’s eyes while their hands form the heart. Both faces are three-quarter views, with noses pointing toward their partner. Neither looks at the camera.',weddingCouple:'Mandatory acting: the bride turns her head toward the groom on her right and looks up into his eyes; the groom turns down toward her on his left and returns her gaze. Keep the original three-quarter head angles. Neither looks at the camera.',receptionCouple:'Mandatory acting: the bride looks toward the camera with her original tilted head. The groom tilts his head down toward the bride and looks at her, never at the camera.'})[pose.slot]||'',
  `Identity references describe WHO they are, never their head orientation. Rotate their recognisable faces into ${target.toLowerCase()}'s existing head angles; do not copy a frontal identity-reference pose. Preserve the target's warm directional rim highlights on hair, cheek and clothing, without flattening its lighting.`,
  `Replace ONLY the face and hair of ${people.map(role).join(' and ')} in ${target.toLowerCase()} with the matching identity reference, drawn in ${target.toLowerCase()}'s exact style: ${style}. ${likeness}.`,
  `Keep EVERYTHING else in ${target.toLowerCase()} exactly the same: pose, hands, gaze direction, body proportions, head size and position, outfits, jewellery, colours, lighting, line style, silhouette, size and placement on the canvas.`,
  pose.print?`${target} is a hanging photo print: keep the print's border/frame, paper, edges and clip exactly as they are; only the groom's face and hair inside the print change.`:'',
  `Do not add or remove people, props, text or scenery. ${alpha}`,
  tracking?`Tracking reference ${tracking}; never draw this reference.`:''].filter(Boolean).join('\n\n');
}
// Same Replicate transport fields as the existing character provider; portrait canvas.
export const characterSetInput=(prompt,images)=>({prompt,input_images:images,aspect_ratio:'2:3',quality:'high',complexity:'low',output_format:'png',background:'transparent',number_of_images:1});
