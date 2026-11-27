import inventory from '../public/assets/video-scenes/anbil-avan-v1/character-poses.json' with {type:'json'};
import {ANBIL_AVAN_DEFAULT_ART} from './anbil-avan-video.mjs';
import {sceneReferencePath} from './scene-photo-art.mjs';
import {PHOTO_SLOTS} from './video-personalization.mjs';

export const SCENE_UPLOAD_WORKFLOW='scene-uploads';

export function uploadScenes(definition){
 return definition?.photoSlots??PHOTO_SLOTS.map(slot=>({slot,label:slot==='couple'?'The two of you':'The '+slot}));
}

export const keralaCoupleSample={path:'/assets/video-masters/kerala-christian-v1/couple-sample.png',sha256:'ce163be5f3678940f539ccaa91a73a3abeb4bdc6141e39fddb55e28390fa6a2d'};
export function studioCoupleLayer(templateId,master){
 if(templateId==='kerala-christian-v1')return keralaCoupleSample;
 if(templateId==='temple-v1')return master?.assets?.closing;
}
export function uploadReference(definition,slot,master){
 if(slot==='couple'&&definition.id==='kerala-christian-v1')return keralaCoupleSample.path;
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
 const subject=sceneSubject(definition,scene,names),couple=sceneRoles(definition,scene).length===2;
 return [
  'Create one illustration for the “'+scene.label+'” scene of '+definition.name+'. Show only the '+subject+'.',
  'Image 1 is my personal '+(couple?'couple photo':'photo')+'. Use it for facial likeness, natural body proportions, relative height, gaze, expression and hair.'+(couple?' Preserve which person is which and their interaction within the template couple pose.':' Keep the same person throughout.'),
  hasReference?'Image 2 is the style sample. Match its complete character pose, exact outfit, colours, accessories, illustration style, lighting and framing. Use only its wardrobe.':'Match the invitation illustration style and scene framing.',
  'Draw every visible body part and held prop within the sample crop. Preserve the aspect ratio. Return a single PNG with a transparent background, without lettering, scenery or a watermark.'
 ].join('\n\n');
}

export function sceneChoiceReady(photo,choice){
 return photo?photo.confirmed===true&&!!photo.id&&choice===photo.id:choice==='studio';
}

export function uploadedEveryScene(definition,photos,checks){
 const scenes=uploadScenes(definition);
 return scenes.length>0&&scenes.every(({slot})=>sceneChoiceReady(photos?.[slot],checks?.[slot]));
}
