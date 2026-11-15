import {catalogVideo} from './video-catalog.mjs';
import {VIDEO_EXAMPLE} from './video-personalization.mjs';
import {TEMPLE_DEFAULTS} from './temple-video.mjs';
import {previewCouple} from './preview-identities.mjs';

// Separate from form defaults and release proofs: only catalog media uses this data.
export function videoPreviewContent(id){
 const definition=catalogVideo(id);
 const content=structuredClone(definition?.example||(id==='temple-v1'?TEMPLE_DEFAULTS:VIDEO_EXAMPLE));
 const tradition=id==='kerala-christian-v1'?'christian':'hindu';
 const english=previewCouple(tradition);
 for(const [suffix,language] of [['En','en'],['Ta','ta'],['Ml','ml']]){
  const pair=previewCouple(tradition,language);
  for(const role of ['groom','bride'])if(Object.hasOwn(content,role+suffix))content[role+suffix]=pair[role];
 }
 if(!definition){const pair=previewCouple(tradition,id==='temple-v1'?'ta':'en');content.groom=pair.groom;content.bride=pair.bride;}
 if(Object.hasOwn(content,'hashtag'))content.hashtag='#'+english.groom+'Weds'+english.bride.replaceAll(' ','');
 for(const key of ['rsvp1','rsvpName'])if(Object.hasOwn(content,key))content[key]=english.groom+' & '+english.bride;
 if(id==='film-velicham-v1'){content.hosts='Karthik & Priya';content.family='Karthik & Priya';}
 for(const question of definition?.form.steps.flatMap(step=>step.questions)||[])if(question.type==='date'&&/^202[0-6]-/.test(content[question.path]||''))content[question.path]='2027'+content[question.path].slice(4);
 content.music={mode:'none'};
 return content;
}
