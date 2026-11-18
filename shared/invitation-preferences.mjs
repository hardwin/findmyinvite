import {INVITATION_LANGUAGES} from './invitation-languages.mjs';
import {discoveryMetadata} from './discovery-taxonomy.mjs';

export const INVITATION_TRADITIONS=[['christian','Christian'],['hindu','Hindu'],['muslim','Islam']];
// These are explicitly chosen invitation preferences, never inferred personal attributes.
export function normalizeInvitationPreferences(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 if(!INVITATION_LANGUAGES.includes(value.language)||!INVITATION_TRADITIONS.some(([id])=>id===value.tradition))return null;
 return {language:value.language,tradition:value.tradition};
}

/** Matching designs first, then unclassified/interfaith designs, without hiding results.
 * Explicit searches and filters run before this stable ranking.
 * @template {{id:string,tradition?:string}} T
 * @param {T[]} items
 * @param {{tradition:string}|null} preferences
 * @returns {T[]}
 */
export function recommendInvitations(items,preferences){
 if(!preferences)return items;
 const score=item=>{const tradition=discoveryMetadata(item).tradition;return tradition===preferences.tradition?2:!tradition||tradition==='interfaith'?1:0;};
 return [...items].sort((a,b)=>score(b)-score(a));
}
