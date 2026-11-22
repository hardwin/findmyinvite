// This fixed film has three server-validated text answers, no editable photos,
// and deterministic text fitting. A phone's media decoder is not an export gate.
export const videoRequiresLocalPreview=master=>!(master?.id==='film-oonjal-v1'&&master.version===3&&master.assetRevision===2);
export function validateMaaplaDetails(content,schema){
 const errors=schema.validateFields({...schema.SAMPLE_FIELDS,...content,music:'none'}).errors;
 const field=['brideEn','groomEn','weddingDate'].find(key=>errors[key]);
 if(field)throw Object.assign(Error(errors[field]),{code:'TEXT_FIT',field});
}
