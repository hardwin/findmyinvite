import test from 'node:test';
import assert from 'node:assert/strict';
import {previewContent} from '../shared/preview-profiles.mjs';
import {previewCouple} from '../shared/preview-identities.mjs';
import {videoPreviewContent} from '../shared/video-preview-content.mjs';
import {flagshipTemplates} from '../shared/flagship-templates.mjs';
import {cinorevTemplates} from '../shared/cinorev-templates.mjs';
import {theeramTemplate} from '../shared/theeram-template.mjs';
import {thiruvarulTemplate} from '../shared/thiruvarul-template.mjs';
import {payanamTemplate} from '../shared/kalyana-payanam-template.mjs';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {normalizeVideoContent,VIDEO_EXAMPLE} from '../shared/video-personalization.mjs';
import {TEMPLE_DEFAULTS} from '../shared/temple-video.mjs';
import {sceneSchema} from '../server/video-scene-details.mjs';

test('every website uses the requested demo couple without modifying its released defaults',()=>{
 const templates=[...flagshipTemplates,...cinorevTemplates.map(t=>t.template),theeramTemplate,thiruvarulTemplate,payanamTemplate];
 assert.equal(templates.length,28);
 for(const template of templates){
  const before=structuredClone(template.defaults);
  for(const language of ['en','ml','ta','te','kn','hi']){
   const version={...template,template_id:template.id},content=previewContent(version,language),pair=previewCouple(template.tradition,language);
   assert.equal(content.groom,pair.groom,template.id+' '+language);
   assert.equal(content.bride,pair.bride,template.id+' '+language);
   if(content.motherName)assert.equal(content.motherName,pair.bride);
   if(content.fatherName)assert.equal(content.fatherName,pair.groom);
  }
  assert.deepEqual(template.defaults,before);
 }
});
test('catalog video identities fit every authored form and preserve customer defaults',async()=>{
 for(const definition of VIDEO_CATALOG){
  const before=structuredClone(definition),content=videoPreviewContent(definition.id);
  normalizeVideoContent(content,{complete:true,templateId:definition.id});
  const schema=await sceneSchema(definition.id),result=schema.validateFields({...content,music:'none'});
  assert.deepEqual(Object.entries(result.errors||{}).filter(([key])=>!/^photo|^song|^music/.test(key)),[],definition.id);
  for(const [suffix,language] of [['En','en'],['Ta','ta'],['Ml','ml']])for(const role of ['groom','bride'])if(role+suffix in content)assert.equal(content[role+suffix],previewCouple('hindu',language)[role]);
  assert.deepEqual(definition,before);
 }
 const originalChristian=structuredClone(VIDEO_EXAMPLE),originalTemple=structuredClone(TEMPLE_DEFAULTS);
 assert.equal(videoPreviewContent('kerala-christian-v1').groom,'Alex');
 assert.equal(videoPreviewContent('kerala-christian-v1').bride,'Anna Thomas');
 assert.equal(videoPreviewContent('temple-v1').groom,'கார்த்திக்');
 assert.equal(videoPreviewContent('temple-v1').bride,'பிரியா');
 assert.deepEqual(VIDEO_EXAMPLE,originalChristian);assert.deepEqual(TEMPLE_DEFAULTS,originalTemple);
});
test('demo family and hashtag copy follows the couple while links remain unchanged',()=>{
 const t=flagshipTemplates.find(t=>t.id==='kerala-lanterns');
 const content=previewContent({...t,template_id:t.id},'en');
 assert.equal(content.groomFamily,'Karthik’s family');assert.equal(content.brideFamily,'Priya’s family');
 assert.equal(content.hashtag,'KarthikWedsPriya');
 const palace=cinorevTemplates.find(t=>t.template.id==='palace-of-lights').template;
 assert.match(JSON.stringify(previewContent({...palace,template_id:palace.id},'en')),/#KarthikWedsPriya/);
 const stained=flagshipTemplates.find(t=>t.id==='stained-glass');
 assert.equal(previewContent({...stained,template_id:stained.id},'en').section8.text9,'ANNATHOMASALEX27');
 assert.equal(videoPreviewContent('film-rajakumari-v1').childName,'Aadhya');
 assert.equal(videoPreviewContent('film-rajakumari-v1').rsvp1,'Karthik & Priya');
 assert.equal(videoPreviewContent('film-velicham-v1').hosts,'Karthik & Priya');
});
