import {formErrors} from './template-forms.mjs';
import {TEMPLE_ID,TEMPLE_FORM,TEMPLE_DEFAULTS} from './temple-video.mjs';
import {catalogVideo} from './video-catalog.mjs';

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
export function videoDefinition(id=DEFAULT_VIDEO_ID){
 const catalog=catalogVideo(id);if(catalog)return catalog;
 if(id===TEMPLE_ID)return {id,form:TEMPLE_FORM,defaults:TEMPLE_DEFAULTS,name:'Temple Wedding',collection:'THE TEMPLE COLLECTION',description:'A golden temple, your favourite people, and words that are entirely yours.',filename:'temple-wedding.mp4'};
 if(id===VIDEO_ID)return {id,form:VIDEO_FORM,defaults:VIDEO_DEFAULTS,name:'Kerala Christian Wedding',collection:'THE KERALA CHRISTIAN COLLECTION',description:'A sunlit church, your favourite people, and words that are entirely yours.',filename:'christian-wedding.mp4'};
 throw Error('This video template is unavailable.');
}
export const MUSIC={canon:{path:'/assets/music-library/canon-in-d.mp3',label:'Canon in D',credit:'Canon in D Major — Kevin MacLeod (incompetech.com). CC BY 4.0. Trimmed and faded for this invitation.',license:'https://creativecommons.org/licenses/by/4.0/'},heartwarming:{path:'/assets/music-library/heartwarming.mp3',label:'Heartwarming',credit:'Heartwarming — Kevin MacLeod (incompetech.com). CC BY 4.0. Trimmed and faded for this invitation.',license:'https://creativecommons.org/licenses/by/4.0/'}};
export function normalizeVideoContent(input,{complete=false,templateId=VIDEO_ID}={}){
 const {form,defaults}=videoDefinition(templateId);
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
 const catalog=catalogVideo(templateId);
 for(const slot of catalog?catalog.photoSlots.map(p=>p.slot):PHOTO_SLOTS){const p=input.photos?.[slot];if(!p)continue;if(!/^[a-f0-9-]{36}$/.test(p.id||'')||!(catalog?['frame']:['cutout','frame','prepared']).includes(p.mode)||p.confirmed!==true)throw Error('Confirm the '+slot+' photo presentation.');out.photos[slot]={id:p.id,mode:p.mode,confirmed:true};}
 const music=input.music||{mode:'none'};
 if(!['none','library','upload'].includes(music.mode))throw Error('Choose music or silence.');
 out.music={mode:music.mode};
 if(music.mode==='library'){if(typeof music.id!=='string'||!Object.hasOwn(MUSIC,music.id))throw Error('Choose an available music track.');out.music.id=music.id;}
 if(music.mode==='upload'){if(!/^[a-f0-9-]{36}$/.test(music.id||''))throw Error('Choose a song file.');out.music.id=music.id;}
 const errors=formErrors(form,out);
 // Partial drafts may omit required answers, but never accept malformed date/time values.
 // Scene designs validate language-dependent required fields in their versioned
 // schema, after this shared type/length/date validation.
 for(const field of form.steps.flatMap(s=>s.questions))if(errors[field.path]&&(complete&&!catalog||out[field.path]))throw Error(errors[field.path]);
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
 if(m?.rendererVersion==='scene-film-v1'){
  const definition=catalogVideo(m.id),o=m.output;
  if(!definition||definition.design!==m.sceneDesign||m.version!==1||o?.width!==720||o.height!==1280||o.fps!==24||!Number.isSafeInteger(o.frames)||o.frames<24||o.frames>14400||Math.abs(o.duration-o.frames/o.fps)>0.00001)throw Error('Unsupported scene master.');
  if(!m.scenes?.length||m.scenes.some(s=>!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.end<=s.start||s.end>o.frames))throw Error('Invalid scene timeline.');
  if(released&&(!m.release?.approved||!['default','personalized'].every(k=>/^[a-f0-9]{64}$/.test(m.release?.proofs?.[k]||''))||m.release.rendererVersion!==m.rendererVersion||!/^\/assets\/video-masters\/film-[a-z]+-v1\/asset-index\.json$/.test(m.assets?.sceneBundle?.path||'')||!/^[a-f0-9]{64}$/.test(m.assets?.sceneBundle?.sha256||'')))throw Error('This template is still being prepared.');
  return m;
 }
 if(![VIDEO_ID,TEMPLE_ID].includes(m?.id)||m.version!==1||JSON.stringify(m.layerOrder)!==JSON.stringify(LAYER_ORDER)||JSON.stringify(m.output)!==JSON.stringify(VIDEO_OUTPUT))throw Error('Unsupported video master.');
 if(!Array.isArray(m.scenes)||m.scenes.length!==(m.id===TEMPLE_ID?10:12))throw Error('Master scene sequence is incomplete.');
 let end=0;for(const s of m.scenes){if(s.start!==end||!Number.isInteger(s.end)||s.end<=s.start)throw Error('Invalid scene timeline.');end=s.end;for(const layer of s.layers){if(!['characters','boards','text'].includes(layer.type))throw Error('Invalid layer.');for(const k of layer.track||[]){if(!Number.isFinite(k.frame)||!Array.isArray(k.corners)||k.corners.length!==4||k.corners.flat().some(v=>!Number.isFinite(v)))throw Error('Invalid movement track.');}if(!layer.track?.length)throw Error('Missing movement track.');}}
 if(end!==1296)throw Error('Invalid master duration.');
 for(const a of Object.values(m.assets)){if(!a.path?.startsWith('/assets/video-masters/'+m.id+'/')||a.path.includes('..'))throw Error('Invalid master asset path.');if(released&&!/^[a-f0-9]{64}$/.test(a.sha256||''))throw Error('Master asset is not locked.');}
 if(m.id===TEMPLE_ID){for(const id of ['background','motion','foregroundMask','petals','groom','bride','closing','ATM-378','ATM-344'])if(!m.assets[id])throw Error('Temple master asset missing.');for(const s of m.scenes)if(!m.text?.[s.id]?.length)throw Error('Temple text bindings missing.');}
 if(released&&(!m.release?.approved||!m.release?.proofs?.default||!m.release?.proofs?.personalized||!m.release?.backgroundReviewed||!m.release?.tracksReviewed))throw Error('This template is still being prepared.');
 if(released&&m.id===TEMPLE_ID&&(!['default','personalized'].every(k=>/^[a-f0-9]{64}$/.test(m.release.proofs[k]))||m.release.verification?.rendererVersion!==m.rendererVersion))throw Error('This renderer revision has not been verified.');
 return m;
}
