import {db,HttpError} from './core.mjs';
export function characterEnabled(owner,env=process.env){return env.VIDEO_CHARACTERS_ENABLED==='1'||String(env.VIDEO_CHARACTER_QA_OWNERS||'').split(',').includes(owner);}
export async function validatePreparedCharacters(owner,invitationId,photos,query=db){
 const selected=Object.entries(photos||{}).filter(([,p])=>p.mode==='prepared');if(!selected.length)return;
 const jobs=await query('video_character_jobs?invitation_id=eq.'+invitationId+'&owner_id=eq.'+owner+'&approved_current=eq.true&select=*');
 for(const [slot,p] of selected){const j=jobs.find(j=>j.slot===slot&&j.output_media_id===p.id);if(!j)throw new HttpError(409,'Approve the '+slot+' character for this invitation before exporting.');if(slot==='couple'&&['groom','bride'].some(s=>j.basis[s]!==jobs.find(v=>v.slot===s)?.id))throw new HttpError(409,'Update and approve the couple character to match the latest groom and bride.');}
}
