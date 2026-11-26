import {readFile} from 'node:fs/promises';
import {HttpError} from './core.mjs';
import {hash} from './video-personalise-store.mjs';
import {replicateProvider} from './video-character-provider.mjs';
import {photoCutout} from './video-photo-cutout.mjs';
import {loadVideoMaster} from './video-personalise.mjs';
import {isVersionedVideo,videoDraftVersion} from '../shared/video-master-version.mjs';
import {videoDefinition} from '../shared/video-personalization.mjs';
import {sceneReferencePath} from '../shared/scene-photo-art.mjs';
import {toPng} from './video-character-images.mjs';

export async function prepareIllustratedPhoto({store,media,draft,slot,optionId,onStart,provider=replicateProvider()}){
 if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(optionId||'')||optionId===media.id||media.owner!==draft.owner_id||media.invitationId!==draft.id||media.kind!=='image'||media.status!=='ready'||!media.durable||media.sceneOption||media.characterSetId||media.characterJobId)throw new HttpError(400,'Choose a reference photo for this invitation.');
 const version=isVersionedVideo(draft.template_id)?videoDraftVersion(draft.template_id,draft.payload):1,definition=videoDefinition(draft.template_id,version),path=sceneReferencePath(definition,slot);
 if(!path)throw new HttpError(400,'Choose a scene with an existing character layer.');
 const key='media/'+optionId+'.json';
 let derived=(await store.read(key))?.value;
 if(!derived){
  const record={id:optionId,owner:media.owner,invitationId:draft.id,kind:'image',status:'ready',durable:true,expiresAt:null,key:media.key,bytes:media.bytes,sha256:media.sha256,contentType:media.contentType,sceneOption:{source:media.id,slot,version,template:definition.id}};
  try{await store.save(key,record,{create:true});derived=record;}catch{derived=(await store.read(key))?.value;}
 }
 if(derived?.owner!==media.owner||derived.invitationId!==draft.id||derived.sceneOption?.source!==media.id||derived.sceneOption.slot!==slot||derived.sceneOption.version!==version||derived.sceneOption.template!==definition.id)throw new HttpError(409,'Choose the reference again.');
 const createPrediction=async(image,hook)=>{
  const master=await loadVideoMaster(definition.id,version),bundle=master.assets.sceneBundle;
  let file=path,checksum;
  if(path.startsWith('master:')){const target=master.assets[path.slice(7)];file=target.path;checksum=target.sha256;}
  else{const index=await readFile('public'+bundle.path);if(hash(index)!==bundle.sha256)throw Error('Scene index checksum mismatch.');checksum=JSON.parse(index).files[path];}
  const art=await readFile('public'+file);
  if(hash(art)!==checksum)throw Error('Scene artwork checksum mismatch.');
  const prompt='Redraw all visible people from Picture 1 as complete characters in the illustration style and scene composition of Picture 2. Picture 2 supplies every garment, colour, prop, and accessory. Picture 1 supplies their faces, build, relative heights, proportions, hair, expression and gaze. For a couple, use their interaction and posture within the template action. Draw every visible body part and hand. Fit the original crop and the full character group on a true transparent canvas. No scenery, lettering or border.';
  return provider.create({prompt,input_images:[image,'data:image/png;base64,'+(await toPng(art)).toString('base64')],aspect_ratio:'2:3',quality:'high',complexity:'low',output_format:'png',background:'transparent',number_of_images:1},hook,false);
 };
 const result=await photoCutout(store,derived,{start:true,provider,onStart,createPrediction});
 return {...result,id:optionId};
}
