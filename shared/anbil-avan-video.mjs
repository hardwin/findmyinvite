import {MAZHAVILLAYE_SOUNDTRACK} from './mazhavillaye-soundtrack.mjs';
// Anbil Avan: the owner-approved v8 layered 2D film. It stays hidden from the
// public catalogue until its release evidence is qualified (see video-visibility).
// Standalone on purpose: the catalogue, normaliser and version modules import it.
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};

export const ANBIL_AVAN_ID='film-anbil-avan-v1';
export const ANBIL_AVAN_DESIGN='anbil-avan';
export const ANBIL_AVAN_VERSION=1;
export const ANBIL_AVAN_RENDER_PROFILE='layered-2d-v1';
export const ANBIL_AVAN_SCENE_FRAME='/assets/video-scenes/anbil-avan-v1/frame.html';
export const ANBIL_AVAN_MUSIC_ID=MAZHAVILLAYE_SOUNDTRACK.id;
// The excerpt is already cropped, gain-matched and faded from the approved film.
// Preview and export must play it once at unity gain: no second fade or loop.
export const ANBIL_AVAN_MUSIC=freeze({mode:'library',id:ANBIL_AVAN_MUSIC_ID});
export const ANBIL_AVAN_OUTPUT=freeze({width:720,height:1280,fps:25,frames:876,duration:35.04});
export const ANBIL_AVAN_CUTS=freeze([0,68,152,236,303,387,454,606,758,876]);
export const ANBIL_AVAN_SCENES=freeze(['opening','celebration','meetBride','bride','meetGroom','groom','wedding','reception','invitation']);
export const ANBIL_AVAN_FIELDS=freeze(['bride','groom','weddingDate','weddingTime','weddingVenue','receptionDate','receptionTime','receptionVenue']);
// Dates are event-local ISO dates and times are HH:MM, never browser timestamps.
export const ANBIL_AVAN_EXAMPLE=freeze({bride:'Priya',groom:'Arun',weddingDate:'2026-12-10',weddingTime:'08:00',weddingVenue:'Manipal',receptionDate:'2026-12-09',receptionTime:'18:00',receptionVenue:'Manipal'});

// One shared character profile: two reusable identity references (bride, groom)
// and nine approved poses. Pose artwork paths/hashes are the runtime inventory in
// /assets/video-scenes/anbil-avan-v1/character-poses.json (Codex-owned, hash-locked
// through the master asset index). Every pose is a {mode:'prepared'} photo slot.
export const ANBIL_AVAN_CHARACTER_PROFILE=freeze({
 id:'anbil-avan-2d-v1',
 style:'strict-2d-modern',
 identities:['bride','groom'],
 // Approved solo art used as the style anchor for each identity reference.
 identityStyle:{bride:'bridePortrait',groom:'groomPortrait'},
 inventory:'/assets/video-scenes/anbil-avan-v1/character-poses.json',
 // minSilhouette: alpha-mask agreement (IoU) with the approved pose after placement.
 // Provisional quality gates; tune only from real provider proofs.
 poses:[
  {slot:'openingCouple',scene:'opening',people:['bride','groom'],label:'Opening couple',minSilhouette:.6},
  {slot:'heartCouple',scene:'celebration',people:['bride','groom'],label:'Shared heart',minSilhouette:.6},
  {slot:'umbrellaBride',scene:'meetBride',people:['bride'],label:'Bride with umbrella',minSilhouette:.6},
  {slot:'bridePortrait',scene:'bride',people:['bride'],label:'Bride portrait',minSilhouette:.6},
  {slot:'groomPrint',scene:'meetGroom',people:['groom'],label:'Groom photo print',minSilhouette:.8,print:true},
  {slot:'groomPortrait',scene:'groom',people:['groom'],label:'Groom portrait',minSilhouette:.6},
  {slot:'weddingCouple',scene:'wedding',people:['bride','groom'],label:'Wedding couple',minSilhouette:.6},
  {slot:'receptionCouple',scene:'reception',people:['bride','groom'],label:'Reception couple',minSilhouette:.6},
  {slot:'closingCouple',scene:'invitation',people:['bride','groom'],label:'Closing couple',minSilhouette:.6}
 ]
});
export const ANBIL_AVAN_POSE_SLOTS=freeze(ANBIL_AVAN_CHARACTER_PROFILE.poses.map(p=>p.slot));
/** Poses that must be regenerated when one identity changes (solo and joint scenes). */
export const posesForIdentity=identity=>ANBIL_AVAN_CHARACTER_PROFILE.poses.filter(p=>p.people.includes(identity)).map(p=>p.slot);

const question=(path,label,maxLength,type='text',scene)=>({path,label,type,required:true,maxLength,...(scene?{scene}:{})});
export const ANBIL_AVAN_DEFINITION=freeze({
 id:ANBIL_AVAN_ID,design:ANBIL_AVAN_DESIGN,name:'Mazhavillaye',collection:'INVITATION VIDEOS',
 description:'Your illustrated love story, with your names, wedding and reception.',filename:'mazhavillaye-invitation.mp4',
 form:{version:1,title:'Personalise Mazhavillaye',steps:[
  {id:'couple',title:'The couple',scene:'bride',questions:[question('bride','Bride’s name',32,'text','bride'),question('groom','Groom’s name',32,'text','groom')]},
  {id:'wedding',title:'Wedding',scene:'wedding',questions:[question('weddingDate','Wedding date',10,'date'),question('weddingTime','Wedding starts',5,'time'),question('weddingVenue','Wedding venue',60)]},
  {id:'reception',title:'Reception',scene:'reception',questions:[question('receptionDate','Reception date',10,'date'),question('receptionTime','Reception starts',5,'time'),question('receptionVenue','Reception venue',60)]},
  // Two photos -> one approved character set; or the original illustrations, chosen explicitly.
  {id:'characters',title:'Photos',scene:'opening',questions:[]},
  {id:'review',title:'Review & download',questions:[]}
 ]},
 defaults:{...Object.fromEntries(ANBIL_AVAN_FIELDS.map(key=>[key,''])),photos:{},music:ANBIL_AVAN_MUSIC},
 example:{...ANBIL_AVAN_EXAMPLE,photos:{},music:ANBIL_AVAN_MUSIC},
 fieldScene:{bride:'bride',groom:'groom',weddingDate:'wedding',weddingTime:'wedding',weddingVenue:'wedding',receptionDate:'reception',receptionTime:'reception',receptionVenue:'reception'},
 // Nine server-prepared character layers; never raw customer uploads.
 photoSlots:ANBIL_AVAN_CHARACTER_PROFILE.poses.map(({slot,label,scene})=>({slot,label,scene,mode:'prepared'})),
 characterProfile:ANBIL_AVAN_CHARACTER_PROFILE,
 lockedMusic:ANBIL_AVAN_MUSIC,musicLabel:'Mazhavillaye · Instagram soundtrack',
 duration:ANBIL_AVAN_OUTPUT.duration,kind:'page'
});

/** Exact approved timeline/profile binding for raw or scene-prepared masters. */
export function isAnbilAvanMaster(m){
 const o=m?.output;
 return m?.id===ANBIL_AVAN_ID&&m.version===ANBIL_AVAN_VERSION&&m.rendererVersion==='scene-film-v1'&&m.renderProfile===ANBIL_AVAN_RENDER_PROFILE
  &&m.sceneDesign===ANBIL_AVAN_DESIGN&&m.sceneFrame===ANBIL_AVAN_SCENE_FRAME&&!!o&&Object.entries(ANBIL_AVAN_OUTPUT).every(([key,value])=>o[key]===value)
  &&Array.isArray(m.scenes)&&m.scenes.length===ANBIL_AVAN_SCENES.length&&m.scenes.every((s,i)=>s?.id===ANBIL_AVAN_SCENES[i]&&s.start===ANBIL_AVAN_CUTS[i]&&s.end===ANBIL_AVAN_CUTS[i+1])
  &&/^[a-f0-9]{64}$/.test(m.source?.audioSha256||'');
}
