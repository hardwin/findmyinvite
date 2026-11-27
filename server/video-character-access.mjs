import {SCENE_UPLOAD_WORKFLOW,uploadScenes,uploadedEveryScene} from '../shared/scene-uploads.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {db,HttpError} from './core.mjs';
import {catalogVideo} from '../shared/video-catalog.mjs';
import {videoDraftVersion,isVersionedVideo} from '../shared/video-master-version.mjs';
export function characterEnabled(owner,env=process.env){return env.VIDEO_CHARACTERS_ENABLED==='1'||String(env.VIDEO_CHARACTER_QA_OWNERS||'').split(',').includes(owner);}
// Character sets have their own gate: Temple's flag never enables billable generation
// for a design whose real provider proof has not been qualified. 'qa' = QA owners only.
export function characterSetsEnabled(owner,env=process.env){return env.VIDEO_CHARACTER_SETS_ENABLED==='1'||env.VIDEO_CHARACTER_SETS_ENABLED==='qa'&&String(env.VIDEO_CHARACTER_QA_OWNERS||'').split(',').includes(owner);}
export const characterSetsRecoverable=(env=process.env)=>['1','qa'].includes(env.VIDEO_CHARACTER_SETS_ENABLED);
async function validateCharacterSet(owner,invitationId,photos,{templateId,draft,query,profile}){
 // The customer's saved choice is authoritative: never substitute the demo couple.
 if(!draft)throw new HttpError(409,'Save your invitation before creating the video.');
 const selected=Object.entries(photos||{});
 if(!selected.length){
  if(draft.payload?.personalPhotosEnabled===true)throw new HttpError(409,'Approve your matching characters, or choose the original illustrations.');
  if(draft.payload?.charactersChoice!=='original')throw new HttpError(409,'Choose matching characters from your photos, or the original illustrations.');
  return;
 }
 if(draft.payload?.personalPhotosEnabled!==true)throw new HttpError(409,'Choose matching characters from your photos to use them.');
 const pending=await query('video_character_sets?invitation_id=eq.'+invitationId+'&owner_id=eq.'+owner+'&status=in.(identities,identity_review,poses,review)&select=id&limit=1');
 if(pending.length)throw new HttpError(409,'Review your new illustrations before creating the video.');
 const [set]=await query('video_character_sets?invitation_id=eq.'+invitationId+'&owner_id=eq.'+owner+'&approved_current=eq.true&select=*');
 if(!set||set.status!=='approved'||set.template_id!==templateId||set.profile!==profile.id||set.master_version!==videoDraftVersion(templateId,draft.payload))throw new HttpError(409,'Approve your matching characters for this invitation before exporting.');
 if(draft.payload.references&&profile.identities.some(person=>draft.payload.references[person]?.id!==set.photos?.[person]?.id))throw new HttpError(409,'Your reference photos changed. Create and approve the matching characters before exporting.');
 const assets=await query('video_character_assets?set_id=eq.'+set.id+'&status=eq.ready&select=asset,output_media_id');
 if(selected.length!==profile.poses.length||profile.poses.some(pose=>{const p=photos[pose.slot];return p?.mode!=='prepared'||!p.id||assets.find(a=>a.asset==='pose:'+pose.slot)?.output_media_id!==p.id;}))throw new HttpError(409,'Your characters changed. Review and approve the latest set before exporting.');
}
export async function validatePreparedCharacters(owner,invitationId,photos,query=db,{templateId,draft}={}){
 if(draft?.payload?.photoWorkflow===SCENE_UPLOAD_WORKFLOW){
  const payload=draft.payload,definition=videoDefinition(templateId,isVersionedVideo(templateId)?videoDraftVersion(templateId,payload):undefined);
  if(payload.personalPhotosEnabled){
   if(!uploadedEveryScene(definition,photos,payload.sceneChecks)||uploadScenes(definition).some(({slot})=>{const saved=payload.content?.photos?.[slot];return saved?.id!==photos[slot].id||saved?.mode!==photos[slot].mode||!saved?.confirmed;}))throw new HttpError(409,'Review and confirm each scene image first.');
   if(definition.characterProfile&&Object.values(photos).some(p=>!['prepared','cutout'].includes(p.mode)))throw new HttpError(409,'Choose a finished scene image.');
  }else if(Object.keys(photos||{}).length)throw new HttpError(409,'Choose personal images to include them in the video.');
  if(definition.characterProfile){
   const retained=Object.entries(photos||{}).filter(([,p])=>p.mode==='prepared');
   if(retained.length){
    const [approved]=await query('video_character_sets?invitation_id=eq.'+invitationId+'&owner_id=eq.'+owner+'&approved_current=eq.true&status=eq.approved&select=id');
    const assets=approved?await query('video_character_assets?set_id=eq.'+approved.id+'&status=eq.ready&select=asset,output_media_id'):[];
    if(retained.some(([slot,p])=>!assets.some(a=>a.asset==='pose:'+slot&&a.output_media_id===p.id)))throw new HttpError(409,'Upload the finished image for each scene before continuing.');
   }
   return;
  }
 }
 const profile=catalogVideo(templateId)?.characterProfile;
 if(profile)return validateCharacterSet(owner,invitationId,photos,{templateId,draft,query,profile});
 const selected=Object.entries(photos||{}).filter(([,p])=>p.mode==='prepared');if(!selected.length)return;
 const jobs=await query('video_character_jobs?invitation_id=eq.'+invitationId+'&owner_id=eq.'+owner+'&approved_current=eq.true&select=*');
 for(const [slot,p] of selected){const j=jobs.find(j=>j.slot===slot&&j.output_media_id===p.id);if(!j)throw new HttpError(409,'Approve the '+slot+' character for this invitation before exporting.');if(slot==='couple'&&['groom','bride'].some(s=>j.basis[s]!==jobs.find(v=>v.slot===s)?.id))throw new HttpError(409,'Update and approve the couple character to match the latest groom and bride.');}
}
