import {weddingBellsVersion,weddingBellsNewOrSavedVersion,pinWeddingBellsVersion} from './wedding-bells-version.mjs';

export const isVersionedVideo=id=>id==='wedding-bells-v1'||id==='temple-v1'||id==='film-oonjal-v1';
export function videoMasterVersion(id,value){
 if(id==='wedding-bells-v1')return weddingBellsVersion(value);
 if(id==='film-oonjal-v1'){
  if(![1,3].includes(value))throw Error('This Maapla Veetla Double okay :P version is unavailable.');
  return value;
 }
 if(id!=='temple-v1'||![1,2,3].includes(value))throw Error('This Temple Wedding version is unavailable.');
 return value;
}
// Unversioned saved invitations belong to their original public release.
export const videoDraftVersion=(id,payload)=>videoMasterVersion(id,payload?.masterVersion??1);
export function videoNewOrSavedVersion(id,payload){
 if(id==='wedding-bells-v1')return weddingBellsNewOrSavedVersion(payload);
 if((id==='film-oonjal-v1'||id==='temple-v1')&&!payload)return 3;
 return payload?videoDraftVersion(id,payload):videoMasterVersion(id,2);
}
export function pinVideoMasterVersion(id,incoming,existing){
 if(id==='wedding-bells-v1')return pinWeddingBellsVersion(incoming,existing);
 const requested=id==='temple-v1'&&!existing&&incoming?.masterVersion===undefined
  ?videoNewOrSavedVersion(id,null):videoDraftVersion(id,incoming);
 if(existing&&requested!==videoDraftVersion(id,existing.payload)){
  const title=id==='film-oonjal-v1'?'Maapla Veetla Double okay :P':'Temple Wedding';
  throw Error('This draft belongs to a different '+title+' version. Reload it before continuing.');
 }
 return requested;
}
