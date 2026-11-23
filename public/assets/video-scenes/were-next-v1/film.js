import {canvas,images,loadImage,setWords,render as draw,setExportScale} from './composition.js';
import {loadPlate,seekPlate} from './media.js';
import {CHAPTERS,FIELD_KEYS,dateParts,validateFields} from '../v1/editor/details-were-next.js';
const video=document.querySelector('#clock'),controller=new AbortController();
const rules={duration:10,chapters:CHAPTERS,visible:Object.fromEntries(FIELD_KEYS.map(k=>[k,true])),required:FIELD_KEYS};
let content={},destroyed=false,offline=false,clockURL;
function openingLines(value){
 const text=String(value||'').trim(),explicit=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(explicit.length===2)return explicit;
 const words=text.replace(/\s+/g,' ').split(' ');if(words.length<2)return [text,''];
 let best=1,delta=Infinity;for(let i=1;i<words.length;i++){const d=Math.abs(words.slice(0,i).join(' ').length-words.slice(i).join(' ').length);if(d<delta){delta=d;best=i;}}
 return [words.slice(0,best).join(' '),words.slice(best).join(' ')];
}
function setContent(input){content=input;const [day='',ordinal='',monthYear='']=dateParts(input.weddingDate);setWords({opening:openingLines(input.opening),reveal:input.reveal||'',heading:input.dateHeading||'',day,ordinal,monthYear});}
window.fmiFilmReady=Promise.resolve({kind:'canvas',video,canvas,
 async init(input,photos={},exporting=false){
  offline=exporting;
  setContent(input);
  const ext=video.canPlayType('video/mp4; codecs="avc1.42E01E"')?'mp4':'webm';
  const response=await fetch('./clock.'+ext,{signal:controller.signal});if(!response.ok)throw Error('The preview clock could not load.');clockURL=URL.createObjectURL(await response.blob());
  await Promise.all([loadPlate(video,clockURL,{signal:controller.signal}),document.fonts.load('700 84px Hand'),document.fonts.load('500 26px Sans'),document.fonts.load('700 35px Sans'),
   ...Object.entries({background:'checker-paper.svg',ticket:'date-ticket.svg',opening:'couple-opening.webp',reveal:'couple-reveal.webp'}).map(async([key,file])=>{images[key]=await loadImage('./assets/'+file);}),
   ...['opening','reveal'].filter(slot=>photos[slot]?.url).map(async slot=>{images[slot+'Photo']=await loadImage(photos[slot].url);})]);
  if(destroyed)throw new DOMException('Preview closed','AbortError');draw(0);return rules;
 },setContent,
 async render(frame,{live=false}={}){frame=Math.max(0,Math.min(299,Math.floor(frame)));if(!live&&!offline)await seekPlate(video,frame,{signal:controller.signal});draw(frame);return rules;},
 async activateMedia(){await video.play();video.pause();},
 async setPlayback(play,frame){if(!play){video.pause();return;}await seekPlate(video,Math.max(0,Math.min(299,frame)),{signal:controller.signal});await video.play();},
 validate(){const error=Object.entries(validateFields(content).errors)[0];if(error)throw Object.assign(Error(error[1]),{code:'TEXT_FIT',field:error[0]});},
 snapshot(format='image/png'){return canvas.toDataURL(format,.97).split(',')[1];},
 setExportScale,
 destroy(){destroyed=true;controller.abort();if(clockURL)URL.revokeObjectURL(clockURL);video.pause();video.removeAttribute('src');video.load();for(const key of Object.keys(images))delete images[key];}
});
