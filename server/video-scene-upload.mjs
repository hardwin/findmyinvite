import {HttpError} from './core.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {sceneRoles,uploadScenes} from '../shared/scene-uploads.mjs';

export async function validateSceneUpload(media,draft,readMedia){
 const upload=media.sceneUpload;
 if(media.invitationId!==draft.id||upload.templateId!==draft.template_id)throw new HttpError(409,'Choose the image saved to this invitation.');
 const definition=videoDefinition(upload.templateId,upload.masterVersion);
 const scenes=uploadScenes(definition),scene=scenes.find(s=>s.slot===upload.slot);
 if(!scene)throw new HttpError(409,'Choose an editable scene.');
 const roles=sceneRoles(definition,scene).join(',');
 for(const other of scenes){
  const selected=draft.payload?.content?.photos?.[other.slot];
  if(!roles||!selected?.id||other.slot===scene.slot||sceneRoles(definition,other).join(',')===roles)continue;
  const existing=await readMedia(selected.id);
  if(media.id===existing.id||media.sha256&&media.sha256===existing.sha256)throw new HttpError(409,'This image is already used for '+other.label+'. Upload the correct person for '+scene.label+'.');
 }
}
