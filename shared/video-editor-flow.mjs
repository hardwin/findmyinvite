import {TEMPLE_FORM} from './temple-video.mjs';
export const VIDEO_FORM_VERSION=3;
export const VIDEO_STEP_IDS=TEMPLE_FORM.steps.map(step=>step.id);
const versionTwoSteps=['title','names','parents','events','closing','music','review'];
const oldSteps=['title','names','photos','parents','events','closing','music','review'];
/** @param {any} payload @param {string|null} requested @param {string[]} stepIds @returns {string} */
export function videoStepId(payload={},requested=null,stepIds=VIDEO_STEP_IDS){
 let id=requested;
 const numeric=id!=null&&/^\d+$/.test(String(id));
 if(numeric)id=oldSteps[Number(id)];
 if(!id)id=payload.formStepId||(payload.formVersion===2?versionTwoSteps:oldSteps)[payload.step??0];
 if(id==='photos')id='review';
 if(stepIds.includes('groom')){
  if(id==='names')id='groom';
  if(id==='events')id='ceremony';
  // The old Closing section started with inviting families (scene 9).
  if(id==='closing'&&(numeric||!requested&&!(payload.formVersion>=3)))id='hosts';
 }
 return stepIds.includes(String(id))?String(id):stepIds[0];
}
// Keep the legacy ordinal for already-open clients; new clients use formStepId.
export const legacyVideoStep=id=>oldSteps.indexOf(({invitation:'title',groom:'names',bride:'names',ceremony:'events',venue:'events',reception:'events',hosts:'closing'})[id]||id);
export function personalPhotosSelected(payload={}){
 if(typeof payload.personalPhotosEnabled==='boolean')return payload.personalPhotosEnabled;
 return Object.keys(payload.content?.photos||{}).length>0||Object.keys(payload.references||{}).length>0||Object.keys(payload.pending||{}).some(k=>k!=='__music');
}
export const hasLegacyPhotos=payload=>Object.values(payload.content?.photos||{}).some(p=>['frame','cutout'].includes(p?.mode))||Object.keys(payload.pending||{}).some(k=>k!=='__music');
export function selectedReferenceMode(payload={}){return payload.photoReferenceMode==='couple'?'couple':payload.photoReferenceMode==='separate'?'separate':payload.references?.couple&&!payload.references?.groom&&!payload.references?.bride?'couple':'separate';}
export function activeVideoContent(content,enabled,originalSlots=[]){
 if(!enabled)return {...content,photos:{}};
 if(!originalSlots.length)return content;
 const excluded=new Set(originalSlots);
 // Joint scenes use the selected individual layers when either person is reverted.
 if(excluded.has('groom')||excluded.has('bride'))excluded.add('couple');
 return {...content,photos:Object.fromEntries(Object.entries(content.photos||{}).filter(([slot])=>!excluded.has(slot)))};
}
export function activePending(pending,enabled){return Object.fromEntries(Object.entries(pending).filter(([slot])=>enabled||slot==='__music'));}
// Account recovery can reorder JSON object keys. Only changed values make a
// completed render stale; this also accepts fingerprints saved by older forms.
function orderedContent(value){return Array.isArray(value)?value.map(orderedContent):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,orderedContent(value[key])])):value;}
export function videoRenderChanged(savedContent,content){
 if(!savedContent)return false;
 try{return JSON.stringify(orderedContent(JSON.parse(savedContent)))!==JSON.stringify(orderedContent(content));}catch{return true;}
}
