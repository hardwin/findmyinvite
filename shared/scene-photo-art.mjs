// These files are the existing replacement slots and original studio assets in the pinned masters.
const artwork={
 kondattam:{couple:'couple.png'},jannal:{bride:'bride.png',groom:'groom.png',couple:'couple.png'},
 kalyana:{couple:'couple.png'},oonjal:{bride:'c_bride.png',groom:'c_groom.png',swing:'c_swing_solo.png'},
 rajakumari:{child:'baby.jpg'},rajakumaran:{child:'blue/baby.jpg'},
 'were-next':{opening:'couple-opening.webp',reveal:'couple-reveal.webp'}
};
export function sceneReferencePath(definition,slot){
 if(definition?.id==='temple-v1'&&['groom','bride','couple'].includes(slot)||definition?.id==='kerala-christian-v1'&&['groom','bride'].includes(slot))return 'master:'+ (slot==='couple'?'closing':slot);
 const design=definition?.design,file=artwork[design]?.[slot];
 if(typeof file!=='string'||!definition.photoSlots?.some(p=>p.slot===slot))return null;
 return design==='were-next'?'/assets/video-scenes/were-next-v1/assets/'+file:'/assets/video-scenes/v1/web/'+design+'/page/assets/img/'+file;
}
