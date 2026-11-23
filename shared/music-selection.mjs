// Keep existing video drafts that stored `canon` playable after unifying the library.
export const canonicalMusicId=id=>id==='canon'?'canon-in-d':id;
export const oonjalRecordingId='3c57fe85-cc2a-48e8-ae42-4f6779efebf4';
export const usesOriginalOonjalAudio=(master,music)=>master?.id==='film-oonjal-v1'&&master.version===3&&music?.mode==='library'&&music.id===oonjalRecordingId;
export const usesOriginalWereNextAudio=(master,music)=>master?.id==='film-were-next-v1'&&master.version===1&&music?.mode==='library'&&music.id==='were-next-original';
export const validMusicId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{2,63}$/.test(id)&&!['constructor','prototype','__proto__'].includes(id);
export const libraryMusicUrl=id=>'/api/music?id='+encodeURIComponent(canonicalMusicId(id));
// These original previews have no background recording (Bells retains its interactive bell).
export const defaultWebsiteMusicId=id=>['christian-bells','theeram','thiruvarul'].includes(id)?'':['ivory-lace','stained-glass','royal'].includes(id)?'canon-in-d':'heartwarming';
