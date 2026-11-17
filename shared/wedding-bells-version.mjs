// Existing unversioned drafts belong to the original public release.
export const WEDDING_BELLS_CURRENT_VERSION=2;
export function weddingBellsVersion(value){
 if(value!==1&&value!==2)throw Error('This Wedding Bells version is unavailable.');
 return value;
}
export function weddingBellsDraftVersion(payload){
 return weddingBellsVersion(payload?.masterVersion??1);
}
export function weddingBellsNewOrSavedVersion(payload){
 return payload?weddingBellsDraftVersion(payload):WEDDING_BELLS_CURRENT_VERSION;
}
export function pinWeddingBellsVersion(incoming,existing){
 const requested=weddingBellsDraftVersion(incoming);
 if(!existing)return requested;
 const pinned=weddingBellsDraftVersion(existing.payload);
 if(requested!==pinned)throw Error('This draft belongs to a different Wedding Bells version. Reload it before continuing.');
 return pinned;
}
