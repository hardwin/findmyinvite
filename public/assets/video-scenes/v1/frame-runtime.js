// Bridge between the versioned artwork and FindMyInvite's existing editor.
// No account, upload, payment or third-party network code runs in this frame.
import {createPreview} from './editor/preview.js';
const base='/assets/video-scenes/v1/';
export async function createFilm(design,manifest){
 // The original MP4 remains the first choice. Headless Chromium and browsers
 // without H.264 use a versioned WebM copy with the identical scene timeline.
 if(manifest.kind==='plate'&&!document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"')){
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,options)=>{const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;return /\/plate(?:-(?:full|after|none))?\.mp4(?:\?|$)/.test(url)?originalFetch(url.replace('.mp4','.webm'),options):originalFetch(input,options);};
 }
 const schema=await import('./editor/'+(design==='temple'?'details.js':'details-'+design+'.js'));
 let preview,content,photos={},pending=Promise.resolve(),failure,revision=0;
 const preparedPhotos=new Map();
 const fields=input=>{
  for(const key of schema.FIELD_KEYS)if(typeof input[key]==='string'&&/[<>]/.test(input[key]))throw Object.assign(Error('Please use plain text without angle brackets.'),{code:'TEXT_FIT',field:key});
  return {...input,music:'none',songId:'',songName:'',songStart:'',songSeconds:'',songOk:''};
 };
 const rules=input=>{
  const raw=fields(input),details=schema.buildDetails(raw),chapters=schema.chaptersFor?.(details)||schema.CHAPTERS;
  const duration=schema.durationOf?.(details)||manifest.duration;
  return {duration,chapters,visible:Object.fromEntries(schema.FIELD_KEYS.map(k=>[k,schema.keyShown?.(k,raw)??true])),required:schema.requiredKeys?.(raw)||schema.FIELD_KEYS.filter(k=>!schema.OPTIONAL_KEYS.includes(k))};
 };
 async function photoDetails(input){
  const details=schema.buildDetails(fields(input),{mark:'findmyinvite.com'});
  if(design==='drive')details.brand='findmyinvite.com';
  for(const [slot,photo] of Object.entries(photos)){
   const geometry=schema.PHOTO?.slots?.[slot]?.fit||schema.PHOTO?.frame||schema.PHOTO?.heart;
   if(!geometry)continue;
   const key=slot+':'+photo.url;
   if(!preparedPhotos.has(key))preparedPhotos.set(key,(async()=>{
    const image=new Image();image.src=photo.url;await image.decode();
    if(schema.PHOTO.fit){
     // The swing artwork includes a transparent extension above the portrait.
     // Fit uploads to that source geometry so a normal photo keeps its face in view.
     const area=schema.PHOTO.slots[slot].view||geometry,scale=Math.min(area.w/image.naturalWidth,area.h/image.naturalHeight);
     const width=image.naturalWidth*scale,height=image.naturalHeight*scale,canvas=document.createElement('canvas');canvas.width=geometry.w;canvas.height=geometry.h;
     canvas.getContext('2d').drawImage(image,(geometry.w-width)/2,geometry.extend==='top'?geometry.h-height:(geometry.h-height)/2,width,height);
     return {src:canvas.toDataURL('image/png'),mode:'fit'};
    }
    const ratio=image.naturalHeight/image.naturalWidth,w=Math.max(geometry.w,geometry.h/ratio);
    return {src:photo.url,left:(geometry.w-w)/2,top:(geometry.h-w*ratio)/2,w,h:ratio};
   })());
   const placement=await preparedPhotos.get(key);
   if(schema.PHOTO.slots){details.photos||={};details.photos[slot]=placement;}
   else details.photo=placement;
  }
  return details;
 }
 const api={
  async init(input,media={},exporting=false){globalThis.__fmiSoftwareExport=exporting&&new URLSearchParams(location.search).get("software")==="1";content=input;photos=media;preview=await createPreview({canvas:document.getElementById('film'),webBase:base+'web/',design,tier:exporting?'hd':'sd',scale:exporting?720/1080:0.4,details:await photoDetails(input),watermark:exporting?'':'FindMyInvite',test:true});preview.sound?.setMuted(true);preview.pause();preview.on('error',e=>{failure=e instanceof Error?e:Error('The invitation could not update.');});return rules(input);},
  setContent(input){content=input;const request=++revision;pending=(async()=>{const details=await photoDetails(input);if(request!==revision)return;failure=null;await preview.setDetails(details);if(failure)throw failure;})();return pending;},
  async render(frame){await pending;if(failure)throw failure;await preview.renderStill(frame/24);return rules(content);},
  validate(){const result=schema.validateFields(fields(content));if(!result.ok){const [field,message]=Object.entries(result.errors).find(([k])=>!/^photo|^song|^music/.test(k))||[];if(field)throw Object.assign(Error(message),{code:'TEXT_FIT',field});}},
  rules,
  get canvas(){return document.getElementById('film');},
  snapshot(format='image/png'){if(manifest.kind==='page'||manifest.engine==='words')return null;const surface=manifest.kind==='plate'?document.querySelector('#film+div canvas'):document.getElementById('film');if(surface.width===720&&surface.height===1280)return surface.toDataURL(format,0.95).split(',')[1];const output=document.createElement('canvas');output.width=720;output.height=1280;output.getContext('2d').drawImage(surface,0,0,720,1280);return output.toDataURL(format,0.95).split(',')[1];},
  get kind(){return manifest.kind||'webgl';},
  destroy(){preview?.destroy();preparedPhotos.clear();}
 };
 return api;
}
