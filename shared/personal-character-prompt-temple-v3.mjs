import {personalCharacterPrompt} from './personal-character-prompt.mjs';

// Keep the owner's face-edit instructions; only the v3 wardrobe changes.
// Historical prompt revisions remain intact for retries and older invitations.
export const TEMPLE_V3_CHARACTER_PROMPT_REVISION='temple-teal-face-edit-v3';
export function templeV3CharacterPrompt(slot,identity='single',tracking=''){
 return personalCharacterPrompt(slot,identity,tracking)
  .replaceAll('cream silk shirt','peacock-teal silk shirt')
  .replaceAll('cream silk saree with a pink-and-gold border and pleats, pink blouse','peacock-teal silk saree with antique-gold motifs, an antique-brass and copper border with narrow deep-rose trim and pleats, peacock-teal blouse')
  .replaceAll('cream silk saree with a pink-and-gold border, pink blouse','peacock-teal silk saree with antique-gold motifs, an antique-brass and copper border with narrow deep-rose trim, peacock-teal blouse');
}
