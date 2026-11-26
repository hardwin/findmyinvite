import {formErrors} from './template-forms.mjs';
import seeds from './music-seeds.json' with {type:'json'};
import {validMusicId,oonjalRecordingId} from './music-selection.mjs';
import {TEMPLE_ID,TEMPLE_FORM,TEMPLE_DEFAULTS} from './temple-video.mjs';
import {catalogVideo} from './video-catalog.mjs';
import {WEDDING_BELLS_ID,WEDDING_BELLS_DEFINITION,WEDDING_BELLS_OUTPUT} from './wedding-bells-video.mjs';
import {ANBIL_AVAN_ID,ANBIL_AVAN_MUSIC_ID,isAnbilAvanMaster} from './anbil-avan-video.mjs';

export const VIDEO_ID='kerala-christian-v1';
export const LAYER_ORDER=Object.freeze(['background','characters','boards','text','petals']);
export const RENDERER_VERSION='five-layer-v1';
export const VIDEO_OUTPUT=Object.freeze({width:720,height:1280,fps:24,frames:1296,duration:54});
const q=(path,label,required=false,maxLength=80,type='text')=>({path,label,required,maxLength,type});
export const VIDEO_FORM={version:2,title:'Make this celebration yours',steps:[
 {id:'title',title:'Title',questions:[q('blessing1','First blessing line',true,70),q('blessing2','Second blessing line',true,70),q('invitationHeading','Invitation heading',true,70)]},
 {id:'names',title:'Names',questions:[q('groom','Groom’s name',true),q('groomTitle','Groom’s honorific',false,20),q('groomLabel','Groom’s label',false,30),q('bride','Bride’s name',true),q('brideTitle','Bride’s honorific',false,20),q('brideLabel','Bride’s label',false,30),q('greeting','Greeting',false,180,'textarea')]},
 {id:'parents',title:'Parents',questions:[q('familyHeading','Family blessing heading',true,70),q('groomParentsLabel','Groom’s family heading',true,50),q('groomFather','Groom’s father / first parent',true),q('groomMother','Groom’s mother / second parent'),q('brideParentsLabel','Bride’s family heading',true,50),q('brideFather','Bride’s father / first parent',true),q('brideMother','Bride’s mother / second parent')]},
 {id:'events',title:'Events',questions:[q('ceremonyHeading','Ceremony heading',true,50),q('weddingDate','Wedding date',true,10,'date'),q('weddingTime','Ceremony starts',true,5,'time'),q('weddingEnd','Ceremony ends',false,5,'time'),q('venueHeading','Venue heading',true,50),q('church','Church name',true,100),q('address','Church address',true,140,'textarea'),q('receptionHeading','Reception heading',true,50),q('receptionDate','Reception date',true,10,'date'),q('receptionTime','Reception starts',true,5,'time'),q('receptionEnd','Reception ends',false,5,'time'),q('receptionVenue','Reception venue',true,100),q('receptionAddress','Reception address',true,140,'textarea')]},
 {id:'closing',title:'Closing',questions:[q('hostHeading','Invited by heading',true,60),q('host1','First inviting family',true,100),q('host2','Second inviting family',false,100),q('closing1','First closing line',true,70),q('closing2','Second closing line',false,70),q('saveDateHeading','Save the date heading',true,40)]},
 {id:'music',title:'Music',questions:[]},
 {id:'review',title:'Review & download',questions:[]}
]};
export const VIDEO_DEFAULTS={blessing1:'With God’s Grace',blessing2:'We Invite You',invitationHeading:'The Wedding of',groom:'',groomTitle:'Mr.',groomLabel:'The Groom',bride:'',brideTitle:'Ms.',brideLabel:'The Bride',greeting:'Together with our families, we invite you to celebrate our wedding.',familyHeading:'With the Blessings of',groomParentsLabel:'Groom’s Parents',groomFather:'',groomMother:'',brideParentsLabel:'Bride’s Parents',brideFather:'',brideMother:'',ceremonyHeading:'Holy Matrimony',weddingDate:'',weddingTime:'',weddingEnd:'',venueHeading:'Wedding Venue',church:'',address:'',receptionHeading:'Reception',receptionDate:'',receptionTime:'',receptionEnd:'',receptionVenue:'',receptionAddress:'',hostHeading:'Invited By',host1:'',host2:'',closing1:'With Love & Blessings',closing2:'We look forward to celebrating with you',saveDateHeading:'SAVE THE DATE',photos:{},music:{mode:'none'}};
export const VIDEO_EXAMPLE={...VIDEO_DEFAULTS,groom:'Alex John',bride:'Anna Thomas',groomFather:'John Mathew',groomMother:'Elsy John',brideFather:'Thomas George',brideMother:'Mercy Thomas',weddingDate:'2027-02-15',weddingTime:'10:00',church:'St. Mary’s Forane Church',address:'Alappuzha, Kerala',receptionDate:'2027-02-14',receptionTime:'19:00',receptionVenue:'Parish Hall Garden',receptionAddress:'Alappuzha, Kerala',host1:'Kurien & Lizzy Abraham',host2:'Nia, Noel & family'};
export const PHOTO_SLOTS=['groom','bride','couple'];
export const DEFAULT_VIDEO_ID=TEMPLE_ID;
const baseOonjal=catalogVideo('film-oonjal-v1');
if(!baseOonjal)throw Error('The Oonjal template definition is missing.');
const editableOonjalFields=['brideEn','groomEn','weddingDate'];
const fixedRecording={mode:'library',id:oonjalRecordingId};
const oonjalDetails=source=>({...Object.fromEntries(editableOonjalFields.map(key=>[key,source[key]])),photos:{},music:fixedRecording});
const designerOonjal={...baseOonjal,photoSlots:[],defaults:oonjalDetails(baseOonjal.defaults),example:oonjalDetails(baseOonjal.example),
 form:{...baseOonjal.form,steps:baseOonjal.form.steps.map(step=>({...step,questions:step.questions.filter(q=>editableOonjalFields.includes(q.path))})).filter(step=>step.questions.length||step.id==='review')}};
export function videoDefinition(id=DEFAULT_VIDEO_ID,masterVersion){
 if(id===designerOonjal.id&&masterVersion===3)return designerOonjal;
 if(id===WEDDING_BELLS_ID)return WEDDING_BELLS_DEFINITION;
 const catalog=catalogVideo(id);if(catalog)return catalog;
 if(id===TEMPLE_ID)return {id,form:TEMPLE_FORM,defaults:TEMPLE_DEFAULTS,name:'Temple Wedding',collection:'THE TEMPLE COLLECTION',description:'A golden temple, your favourite people, and words that are entirely yours.',filename:'temple-wedding.mp4'};
 if(id===VIDEO_ID)return {id,form:VIDEO_FORM,defaults:VIDEO_DEFAULTS,name:'Kerala Christian Wedding',collection:'THE KERALA CHRISTIAN COLLECTION',description:'A sunlit church, your favourite people, and words that are entirely yours.',filename:'christian-wedding.mp4'};
 throw Error('This video template is unavailable.');
}
const seedMusic=Object.fromEntries(seeds.map(t=>[t.id,{path:t.asset,label:t.title,credit:t.credit+(['wedding-bells-original',ANBIL_AVAN_MUSIC_ID].includes(t.id)?'':' Trimmed and faded for this invitation.'),license:t.licenseUrl}]));
export const MUSIC={...seedMusic,canon:seedMusic['canon-in-d']};
/** @param {object} input @param {{complete?:boolean,templateId?:string,masterVersion?:number}} options */
export function normalizeVideoContent(input,{complete=false,templateId=VIDEO_ID,masterVersion}={}){
 const definition=videoDefinition(templateId,masterVersion),{form,defaults}=definition;
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid invitation details.');
 const out={};
 // Form display order may change; retain the content order used by render caches.
 const contentOrder=Object.keys(defaults);
 for(const question of form.steps.flatMap(s=>s.questions).sort((a,b)=>contentOrder.indexOf(a.path)-contentOrder.indexOf(b.path))){
  const v=input[question.path]??defaults[question.path]??'';
  if(typeof v!=='string'||v.length>question.maxLength||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)||(catalogVideo(templateId)&&/[<>]/.test(v)))throw Error('Check '+question.label.toLowerCase()+'.');
  out[question.path]=v.trim().normalize('NFC');
 }
 out.photos={};
 if(templateId===WEDDING_BELLS_ID&&Object.keys(input.photos||{}).length)throw Error('Wedding Bells currently preserves the original characters.');
 const catalog=catalogVideo(templateId),characterSet=!!definition.characterProfile;
 // Character-profile designs accept only server-prepared layers, never raw uploads.
 const modes=characterSet?['prepared']:catalog?['frame']:['cutout','frame','prepared'];
 for(const slot of catalog?definition.photoSlots.map(p=>p.slot):PHOTO_SLOTS){const p=input.photos?.[slot];if(!p)continue;if(!/^[a-f0-9-]{36}$/.test(p.id||'')||!modes.includes(p.mode)||p.confirmed!==true)throw Error('Confirm the '+slot+' photo presentation.');out.photos[slot]={id:p.id,mode:p.mode,confirmed:true};}
 // One approved set covers every scene; otherwise the original illustrations remain.
 if(characterSet&&Object.keys(out.photos).length&&Object.keys(out.photos).length!==definition.photoSlots.length)throw Error('Use every character from one approved set, or the original illustrations.');
 const music=definition===designerOonjal?fixedRecording:definition.lockedMusic||input.music||{mode:'none'};
 if(!['none','library','upload'].includes(music.mode))throw Error('Choose music or silence.');
 out.music={mode:music.mode};
 if(music.mode==='library'){if(!validMusicId(music.id))throw Error('Choose an available music track.');out.music.id=music.id;}
 if(music.mode==='upload'){if(!/^[a-f0-9-]{36}$/.test(music.id||''))throw Error('Choose a song file.');out.music.id=music.id;}
 const errors=formErrors(form,out);
 // Partial drafts may omit required answers, but never accept malformed date/time values.
 // Scene designs validate language-dependent required fields in their versioned
 // schema, after this shared type/length/date validation.
 for(const field of form.steps.flatMap(s=>s.questions))if(errors[field.path]&&(complete&&(!catalog||definition===designerOonjal)||out[field.path]))throw Error(errors[field.path]);
 for(const prefix of ['wedding','reception'])if(out[prefix+'End']&&out[prefix+'End']<=out[prefix+'Time'])throw Error('The '+prefix+' end time must be after its start time.');
 return out;
}
export function dateLabel(value){if(!value)return '';return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}
const timeLabel=t=>{if(!t)return '';const [h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'a.m.':'p.m.'}`;};
const lines=(...v)=>v.filter(Boolean).join('\n');
export function videoText(c){
 const dates=[...new Set([c.weddingDate,c.receptionDate].filter(Boolean))].sort();
 return {blessing:lines(c.blessing1,c.blessing2),invitation:lines(c.invitationHeading,lines(c.groom&&`${c.groom} &`,c.bride),c.greeting),groom:lines(c.groomLabel,[c.groomTitle,c.groom].filter(Boolean).join(' ')),bride:lines(c.brideLabel,[c.brideTitle,c.bride].filter(Boolean).join(' ')),parents:lines(c.familyHeading,'',c.groomParentsLabel,c.groomFather,c.groomMother,'',c.brideParentsLabel,c.brideFather,c.brideMother),ceremony:lines(c.ceremonyHeading,dateLabel(c.weddingDate),lines(timeLabel(c.weddingTime)+(c.weddingEnd?' – '+timeLabel(c.weddingEnd):c.weddingTime?' onwards':''))),venue:lines(c.venueHeading,c.church,c.address),reception:lines(c.receptionHeading,dateLabel(c.receptionDate),timeLabel(c.receptionTime)+(c.receptionEnd?' – '+timeLabel(c.receptionEnd):c.receptionTime?' onwards':''),c.receptionVenue,c.receptionAddress),hosts:lines(c.hostHeading,c.host1,c.host2,c.closing1),date:lines(c.saveDateHeading,...dates.map(dateLabel)),closing:lines(c.closing1,c.closing2)};
}
export function sceneAt(master,frame){return master.scenes.find(s=>frame>=s.start&&frame<s.end)||master.scenes.at(-1);}
export function trackAt(track,frame){
 if(!track?.length)throw Error('Missing layer movement track.');
 const right=track.findIndex(k=>k.frame>frame);
 if(right===0)return track[0];if(right<0)return track.at(-1);
 const a=track[right-1],b=track[right],t=(frame-a.frame)/(b.frame-a.frame);
 const mix=(x,y)=>x+(y-x)*t;
 return {frame,opacity:mix(a.opacity??1,b.opacity??1),corners:a.corners.map((p,i)=>p.map((v,j)=>mix(v,b.corners[i][j])))};
}
export function assertMaster(m,{released=false}={}){
 if(m?.rendererVersion==='tracked-film-v1'){
  if(m.id!==WEDDING_BELLS_ID||![1,2].includes(m.version)||Object.entries(WEDDING_BELLS_OUTPUT).some(([k,v])=>m.output?.[k]!==v))throw Error('Unsupported tracked film master.');
  if(m.scenes?.length!==9||m.scenes[0].start!==0||m.scenes.at(-1).end!==832||m.scenes.some((s,i)=>!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start>=s.end||(i&&s.start!==m.scenes[i-1].end)))throw Error('Invalid tracked film timeline.');
  if(m.cleanTextRanges!==undefined&&(!Array.isArray(m.cleanTextRanges)||m.cleanTextRanges.some((r,i)=>!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end>m.output.frames||r.start>=r.end||(i&&r.start<m.cleanTextRanges[i-1].end))))throw Error('Invalid text-free frame range.');
  for(const id of ['background','restoration','surfaces'])if(!m.assets?.[id])throw Error('Missing tracked film asset.');
  for(const a of Object.values(m.assets))if(!a.path?.startsWith('/assets/video-masters/'+WEDDING_BELLS_ID+'/')||a.path.includes('..')||!/^[a-f0-9]{64}$/.test(a.sha256||''))throw Error('Invalid tracked film asset.');
  if(m.version===2&&(m.assets.surfaces.path!=='/assets/video-masters/wedding-bells-v1/surfaces-tracked-v1.json'||m.assets.restoration.path!=='/assets/video-masters/wedding-bells-v1/tracked-visibility-v1.mp4'))throw Error('Unsupported tracked film revision.');
  // Owner-approved public trial: immutable render proofs and a qualified cloud worker.
  if(released&&(!m.release?.approved||m.release.rendererVersion!==m.rendererVersion||!['default','personalized'].every(k=>/^[a-f0-9]{64}$/.test(m.release?.proofs?.[k]||''))||!m.release.cloudVerified))throw Error('Wedding Bells is still being prepared.');
  return m;
 }
 if(m?.rendererVersion==='scene-film-v1'){
  const definition=catalogVideo(m.id),o=m.output;
  const correctedOonjal=m.assetRevision===2;
  const wereNext=m.id==='film-were-next-v1'&&m.version===1&&m.sceneFrame==='/assets/video-scenes/were-next-v1/frame.html'&&o?.fps===30&&o.frames===300&&o.duration===10;
  if(m.id==='film-were-next-v1'&&!wereNext)throw Error('Unsupported We\u2019re Next master.');
  // The layered 2D profile is bound to this approved film's exact timeline.
  if(m.renderProfile!==undefined&&m.id!==ANBIL_AVAN_ID)throw Error('Unsupported render profile.');
  const anbilAvan=isAnbilAvanMaster(m);
  if(m.id===ANBIL_AVAN_ID&&!anbilAvan)throw Error('Unsupported Anbil Avan master.');
  const designerPlate=m.id==='film-oonjal-v1'&&m.version===3&&m.sceneFrame===('/assets/video-scenes/oonjal-v3/'+(correctedOonjal?'frame-r2.html':'frame.html'))&&o?.frames===828;
  if(!definition||definition.design!==m.sceneDesign||(m.version!==1&&!designerPlate)||o?.width!==720||o.height!==1280||(!wereNext&&!anbilAvan&&o.fps!==24)||!Number.isSafeInteger(o.frames)||o.frames<24||o.frames>14400||Math.abs(o.duration-o.frames/o.fps)>0.00001)throw Error('Unsupported scene master.');
  if(!m.scenes?.length||m.scenes.some(s=>!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.end<=s.start||s.end>o.frames))throw Error('Invalid scene timeline.');
  const revisedTiles=m.id==='film-tiles-v1'&&m.assetRevision===2&&m.sceneFrame==='/assets/video-scenes/tiles-v2/frame.html';
  const expectedIndex='/assets/video-masters/'+m.id+'/asset-index'+(designerPlate?(correctedOonjal?'-v3-r2':'-v3'):revisedTiles?'-v2':'')+'.json';
  if(m.sceneFrame&&!revisedTiles&&!designerPlate&&!wereNext&&!anbilAvan)throw Error('Unsupported scene frame.');
  if(released&&(!m.release?.approved||!['default','personalized'].every(k=>/^[a-f0-9]{64}$/.test(m.release?.proofs?.[k]||''))||m.release.rendererVersion!==m.rendererVersion||m.assets?.sceneBundle?.path!==expectedIndex||!/^[a-f0-9]{64}$/.test(m.assets?.sceneBundle?.sha256||'')))throw Error('This template is still being prepared.');
  // A new render profile additionally requires a qualified cloud worker proof.
  if(released&&anbilAvan&&m.release.cloudVerified!==true)throw Error('This template is still being prepared.');
  return m;
 }
 if(![VIDEO_ID,TEMPLE_ID].includes(m?.id)||(m.id===TEMPLE_ID?![1,2,3].includes(m.version):m.version!==1)||JSON.stringify(m.layerOrder)!==JSON.stringify(LAYER_ORDER)||JSON.stringify(m.output)!==JSON.stringify(VIDEO_OUTPUT))throw Error('Unsupported video master.');
 if(!Array.isArray(m.scenes)||m.scenes.length!==(m.id===TEMPLE_ID?10:12))throw Error('Master scene sequence is incomplete.');
 let end=0;for(const s of m.scenes){if(s.start!==end||!Number.isInteger(s.end)||s.end<=s.start)throw Error('Invalid scene timeline.');end=s.end;for(const layer of s.layers){if(!['characters','boards','text'].includes(layer.type))throw Error('Invalid layer.');for(const k of layer.track||[]){if(!Number.isFinite(k.frame)||!Array.isArray(k.corners)||k.corners.length!==4||k.corners.flat().some(v=>!Number.isFinite(v)))throw Error('Invalid movement track.');}if(!layer.track?.length)throw Error('Missing movement track.');}}
 if(end!==1296)throw Error('Invalid master duration.');
 for(const a of Object.values(m.assets)){if(!a.path?.startsWith('/assets/video-masters/'+m.id+'/')||a.path.includes('..'))throw Error('Invalid master asset path.');if(released&&!/^[a-f0-9]{64}$/.test(a.sha256||''))throw Error('Master asset is not locked.');}
 if(m.id===TEMPLE_ID){for(const id of ['background','motion','foregroundMask','petals','groom','bride','closing','ATM-378','ATM-344'])if(!m.assets[id])throw Error('Temple master asset missing.');for(const s of m.scenes)if(!m.text?.[s.id]?.length)throw Error('Temple text bindings missing.');}
 if(released&&(!m.release?.approved||!m.release?.proofs?.default||!m.release?.proofs?.personalized||!m.release?.backgroundReviewed||!m.release?.tracksReviewed))throw Error('This template is still being prepared.');
 if(released&&m.id===TEMPLE_ID&&(!['default','personalized'].every(k=>/^[a-f0-9]{64}$/.test(m.release.proofs[k]))||m.release.verification?.rendererVersion!==m.rendererVersion))throw Error('This renderer revision has not been verified.');
 return m;
}
