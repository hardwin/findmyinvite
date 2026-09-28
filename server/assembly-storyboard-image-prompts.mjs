export function buildEndpointPrompt(board,index,side){
 // Image edits rely on the supplied reference, never on video direction or
 // verbose scene/continuity descriptions. Keep the approved finale verbatim.
 if(index===4)return SAVE_THE_DATE_IMAGE_PROMPT;
 const scene=board.scenes[index];
 if(index===0){
  if(side==='first')return DOOR_IMAGE_PROMPT;
  return `Change to the same double-door fully open, with levitating 3d text ${JSON.stringify(scene.titleText||'')} visible inside. Use the supplied image as the visual reference. Human-free, no people, human body parts, shadows or reflections. No humans or hands. GLOSSY and cinematic rim lights. No additional wording.`;
 }
 if(index===1)return 'Change to an editorial high quality macro of one accessory or embroidery detail from the supplied image. Crisp focus, dramatic rim light catching a few levitating motifs, some very close to the camera creating depth of field. Use the supplied image as the visual reference. No faces or text. Shallow depth of field focusing the detail, rest heavily gaussian blurred.';
 const change=index===2
  ?'Change the couple to a relaxed editorial pose from a three-quarter camera angle. No text.'
  :'Change the couple to a close editorial embrace from a side camera angle, both faces visible. Add levitating 3d text "We\'re getting married", partially behind the couple to show depth, without covering faces. No additional wording.';
 return `${change} High-fashion editorial quality, crisp focus, dramatic rim light catching a few levitating motifs, some very close to the camera creating depth of field. Use the supplied image as the visual reference. Preserve exact facial identities and wardrobe, hair and shoes: ONE bride and ONE groom. Shallow depth of field focusing couple and text, rest heavily gaussian blurred.`;
}
export const DOOR_IMAGE_PROMPT='Human-free Ultra-realistic shining, reflective, cinematic invitation Door within the reference reference style. A fully closed, opaque rich double-door with multicoloured artistry elements occupy the full frame, Its doors meet flush beneath an intact Intricate artistic knob; no interior or names visible. Use the supplied image as the visual reference, but no people, human body parts, shadows or reflections. No humans or hands. GLOSSY and cinematic rim lights';
export const SAVE_THE_DATE_IMAGE_PROMPT='Change to editorial high quality  GlamBOT / high-fashion editorial quality, crisp focus, dramatic rim light catching few airborne motifs which are levitating some very close to the camera creating depth of field, without covering faces. A levitating 3d text SAVE THE DATE angled towards and facing slightly left and also coverd behind the couple a small portion to show depth and layers of the space . No invented date or additional wording.. Use the supplied image as the visual reference, Preserve exact facial identities and wardrobe , Preserve the supplied couple IDENTITY (who they are, wardrobe, hair, shoes): ONE bride and ONE groom. Shallow depth of field focusing couple and text, Rest all heavily gaussian blurred';
