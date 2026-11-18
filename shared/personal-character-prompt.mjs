// Base prompts supplied by the product owner on 2026-11-18.
export const PERSONAL_CHARACTER_PROMPT_REVISION='temple-cartoon-face-edit-v2';
export const PERSONAL_CHARACTER_BASE_PROMPTS={
 groom:`I've attached two pictures. Picture 1 is a photo of the groom. Picture 2 is your drawing of a groom.

EDIT PICTURE 2. Replace ONLY the face and hair of the man in picture 2 with the groom's face and hair from picture 1, drawn in picture 2's cartoon style (a warm 3D animated movie look, big expressive eyes, smooth simplified features, NOT a photo-realistic face). Keep his face shape, eyes, nose, smile, beard or moustache (as he has it), spectacles (only if he is wearing them on his face), skin tone and hairstyle so people can clearly recognise him.

Keep EVERYTHING ELSE in picture 2 exactly the same: the same head size (do not make the head bigger), the same slim, tall body and long legs, the same height and width, the same pose (standing, FULL BODY from head to feet, front view), the same cream silk shirt with rolled sleeves, cream veshti with a broad gold border, cream-and-gold angavastram over his left shoulder, thin gold chain and brown sandals, the same size and place in the picture. Ignore his body, clothes, background and pose in picture 1.

OUTPUT: a PNG image with a REAL TRANSPARENT BACKGROUND (alpha channel). Use the transparent background option of the image tool. Do NOT draw a white, coloured or grey-and-white checkerboard background, no scenery, no floor, no shadow, no white outline around the person, no text, no watermark. Only the groom, head to feet, cut out cleanly. Portrait 2:3.`,
 bride:`I've attached two pictures. Picture 1 is a photo of the bride. Picture 2 is your drawing of a bride.

EDIT PICTURE 2. Replace ONLY the face and hair of the woman in picture 2 with the bride's face and hairline from picture 1, drawn in picture 2's cartoon style (a warm 3D animated movie look, big expressive eyes, smooth simplified features, NOT a photo-realistic face). Keep her face shape, eyes, nose, smile, spectacles (only if she is wearing them on her face) and skin tone so people can clearly recognise her. Keep picture 2's long braid with white jasmine.

Keep EVERYTHING ELSE in picture 2 exactly the same: the same head size (do not make the head bigger), the same slim, tall body, the same height and width, the same pose (standing, FULL BODY from head to feet, front view, hands folded gently in front), the same cream silk saree with a pink-and-gold border and pleats, pink blouse, gold maang tikka, jhumka earrings, gold bangles and layered gold necklaces with plain round pendants (no figures or faces on any jewellery), and the same size and place in the picture. Give her gold flat sandals. Ignore her body, clothes, background and pose in picture 1.

OUTPUT: a PNG image with a REAL TRANSPARENT BACKGROUND (alpha channel). Use the transparent background option of the image tool. Do NOT draw a white, coloured or grey-and-white checkerboard background, no scenery, no floor, no shadow, no white outline around the person, no text, no watermark. Only the bride, head to feet, cut out cleanly. Portrait 2:3.`,
 couple:`I've attached two pictures. Picture 1 is a photo of us (the couple). Picture 2 is your drawing of a couple.

EDIT PICTURE 2. Replace ONLY the faces and hair of the two people in picture 2 with our faces and hair from picture 1 (groom on the left, bride on the right), drawn in picture 2's cartoon style (a warm 3D animated movie look, big expressive eyes, smooth simplified features, NOT photo-realistic faces). Keep each face shape, eyes, nose, smile, facial hair, spectacles (only if worn on the face), skin tone and hairstyle so people can clearly recognise us.

Keep EVERYTHING ELSE in picture 2 exactly the same: the same head sizes (do not make the heads bigger), the same slim, tall bodies, the same heights and widths, the same pose (standing side by side holding hands, FULL BODY from head to feet, front view), the same clothes and jewellery (the groom's cream silk shirt, cream veshti with a broad gold border, angavastram, gold chain and brown sandals; the bride's cream silk saree with a pink-and-gold border, pink blouse, long braid with white jasmine, maang tikka, jhumkas, bangles, layered gold necklaces with plain round pendants, no figures or faces on any jewellery) and the same size and place in the picture. Give the bride gold flat sandals. Ignore our bodies, clothes, background and pose in picture 1.

OUTPUT: a PNG image with a REAL TRANSPARENT BACKGROUND (alpha channel). Use the transparent background option of the image tool. Do NOT draw a white, coloured or grey-and-white checkerboard background, no scenery, no floor, no shadow, no white outline around the people, no text, no watermark. Only the two of us, head to feet, cut out cleanly. Portrait 2:3.`
};
export function personalCharacterPrompt(slot,identity='single',tracking=''){
 const base=PERSONAL_CHARACTER_BASE_PROMPTS[slot];
 if(!base)throw Error('Unsupported character slot.');
 // The existing couple flow supplies the two approved individual characters.
 // They are combined into one identity reference, in groom/bride order.
 const context=slot==='couple'&&identity==='groom'?'Picture 1 is a combined reference of the approved groom on the left and approved bride on the right, rather than an original photograph. Use their approved facial identities in picture 2\'s cartoon style.':slot!=='couple'&&identity!=='single'?(identity==='auto'?`Picture 1 includes both people. Identify the ${slot} in picture 1 and use only that person's face; ignore the other person.`:`Picture 1 includes both people. Use only the person on the ${identity} side as viewed in picture 1 for the ${slot}; ignore the other person.`):'';
 return [base,context,tracking?`Tracking reference ${tracking}; never draw this reference.`:''].filter(Boolean).join('\n\n');
}
