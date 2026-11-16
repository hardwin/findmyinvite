// Keep existing video drafts that stored `canon` playable after unifying the library.
export const canonicalMusicId=id=>id==='canon'?'canon-in-d':id;
export const validMusicId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(id)&&!['constructor','prototype','__proto__'].includes(id);
export const libraryMusicUrl=id=>'/api/music?id='+encodeURIComponent(canonicalMusicId(id));
// These original previews have no background recording (Bells retains its interactive bell).
export const defaultWebsiteMusicId=id=>['christian-bells','theeram','thiruvarul'].includes(id)?'':['ivory-lace','stained-glass','royal'].includes(id)?'canon-in-d':'heartwarming';
