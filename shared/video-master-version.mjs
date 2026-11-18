import {weddingBellsVersion,weddingBellsNewOrSavedVersion,pinWeddingBellsVersion} from './wedding-bells-version.mjs';

export const isVersionedVideo=id=>id==='wedding-bells-v1'||id==='temple-v1';
export function videoMasterVersion(id,value){
 if(id==='wedding-bells-v1')return weddingBellsVersion(value);
 if(id!=='temple-v1'||(value!==1&&value!==2))throw Error('This Temple Wedding version is unavailable.');
 return value;
}
// Unversioned saved invitations belong to their original public release.
export const videoDraftVersion=(id,payload)=>videoMasterVersion(id,payload?.masterVersion??1);
export function videoNewOrSavedVersion(id,payload){
 if(id==='wedding-bells-v1')return weddingBellsNewOrSavedVersion(payload);
 return payload?videoDraftVersion(id,payload):videoMasterVersion(id,2);
}
export function pinVideoMasterVersion(id,incoming,existing){
 if(id==='wedding-bells-v1')return pinWeddingBellsVersion(incoming,existing);
 const requested=videoDraftVersion(id,incoming);
 if(existing&&requested!==videoDraftVersion(id,existing.payload))throw Error('This draft belongs to a different Temple Wedding version. Reload it before continuing.');
 return requested;
}
