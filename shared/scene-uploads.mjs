import inventory from '../public/assets/video-scenes/anbil-avan-v1/character-poses.json' with {type:'json'};
import {ANBIL_AVAN_DEFAULT_ART} from './anbil-avan-video.mjs';
import {sceneReferencePath} from './scene-photo-art.mjs';
import {PHOTO_SLOTS} from './video-personalization.mjs';

export const SCENE_UPLOAD_WORKFLOW='scene-uploads';

export function uploadScenes(definition){
 return definition?.photoSlots??PHOTO_SLOTS.map(slot=>({slot,label:slot==='couple'?'The two of you':'The '+slot}));
}

export function uploadReference(definition,slot,master){
 if(definition.characterProfile&&Object.hasOwn(inventory,slot))return (ANBIL_AVAN_DEFAULT_ART[slot]||inventory[slot]).path;
 const path=sceneReferencePath(definition,slot);
 return path?.startsWith('master:')?master?.assets[path.slice(7)]?.path:path;
}

export function sceneRoles(definition,scene){
 const people=definition.characterProfile?.poses.find(p=>p.slot===scene.slot)?.people;
 if(people)return people;
 if(['bride','groom','child'].includes(scene.slot))return [scene.slot];
 if(['couple','opening','reveal'].includes(scene.slot))return ['bride','groom'];
 return [];
}
export function sceneSubject(definition,scene,names={}){
 return sceneRoles(definition,scene).map(role=>names[role]?role+' ('+names[role]+')':role).join(' and ')||scene.label;
}
export function sceneUploadPrompt(definition,scene,hasReference,names={}){
 const subject=sceneSubject(definition,scene,names);
 return [
  'Create one invitation illustration for the “'+scene.label+'” scene of '+definition.name+'. Show '+subject+'.',
  hasReference?'Image 1 is the template scene. Match its exact outfit, colours, accessories, illustration style, pose, framing and arrangement of people. The remaining images are my personal references.':'Use the attached personal reference photos to illustrate the people in this scene.',
  sceneRoles(definition,scene).length?'Use the personal reference photos in this order: '+sceneRoles(definition,scene).map((role,i)=>'image '+(i+(hasReference?2:1))+' is the '+role+(names[role]?' ('+names[role]+')':'')).join(', ')+'. Show only '+subject+'.':'Show only the person or people in the supplied personal reference.',
  'Use my photos for facial likeness, natural body proportions, relative height, gaze, expression and hair. For a couple, fit our posture and interaction into the template pose. Use only the template wardrobe.',
  'Draw each complete character visible in the reference, including hands, feet and any held props within its crop. Preserve the original aspect ratio. Return one PNG of the subject on a transparent background, with no lettering, watermark or scenery.'
 ].join('\n\n');
}

export function uploadedEveryScene(definition,photos,checks){
 const scenes=uploadScenes(definition);
 return scenes.length>0&&scenes.every(({slot})=>photos?.[slot]?.id&&photos[slot].confirmed===true&&checks?.[slot]===photos[slot].id);
}
