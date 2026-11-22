// This fixed film has three server-validated text answers, no editable photos,
// and deterministic text fitting. A phone's media decoder is not an export gate.
export const videoRequiresLocalPreview=master=>!(master?.id==='film-oonjal-v1'&&master.version===3&&master.assetRevision===2);
