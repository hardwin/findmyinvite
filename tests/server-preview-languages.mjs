import test from 'node:test';
import assert from 'node:assert/strict';
import versions from './fixtures/template-preview-content.json' with {type:'json'};
import {previewContent} from '../shared/preview-profiles.mjs';
import {previewDictionary} from '../shared/preview-translations.mjs';
import {previewCopy} from '../shared/preview-copy.mjs';
import {appendInvitationScript} from '../shared/invitation-document.mjs';

function leaves(value,path='',out=[]){if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))leaves(v,path?path+'.'+k:k,out);else out.push([path,value]);return out;}
test('preview document preserves dollar sequences in translations and embedded regular expressions',()=>{
 const code='const example = '+JSON.stringify("$& $` $' ")+"; const escape = value => value.replace(/\\./g, '\\\\$&');";
 const doc=appendInvitationScript('<html><body>Original invitation</body></html>',code);
 assert.equal(doc,'<html><body>Original invitation<script>'+code+'</script></body></html>');
 assert.ok(appendInvitationScript('<body></body>','const s="</script><p>text</p>"').includes('<\\/script>'));
});
for(const language of ['ml','ta','te','kn','hi']){
 test(language+' has complete authored strings and RSVP controls',()=>{
  for(const [key,values] of Object.entries(previewCopy))assert.equal(typeof values[language],'string',key);
  const dictionary=previewDictionary(language);for(const [key,value] of Object.entries(dictionary))assert.ok(value,key);
  for(const key of ['scratch to reveal','send rsvp','visit website','your name','your family','return to library'])assert.ok(dictionary[key]);
 });
 for(const version of versions)test(version.template_id+' catalog preview in '+language,()=>{
  const before=structuredClone(version.defaults),content=previewContent(version,language),original=new Map(leaves(version.defaults));
  assert.deepEqual(version.defaults,before,'Original release content must stay immutable');
  assert.equal(content.language,language);assert.equal(content._catalogPreview,true);assert.ok(content.previewGuest);
  for(const [path,value] of leaves(content)){
   if(typeof value!=='string')continue;
   if(/^(https?:|\/)/.test(value)||/(?:^|\.)(?:date|time|utcOffset|icon)$/.test(path))assert.equal(value,original.get(path),path+' keeps its functional value');
   if(/(?:icon|language|utcOffset)$/.test(path)||/^(https?:|\/|#)/.test(value)||/^\d[\d:\s]*(AM|PM)$/i.test(value))continue;
   assert.ok(!/[A-Za-z]/.test(value),path+' still has untranslated sample text: '+value);
  }
 });
}
test('English preview replaces French demo wording and invalid language falls back to English',()=>{
 const version=versions.find(v=>v.template_id==='embroidered-garden');
 assert.equal(previewContent(version,'en').section1.text0,'Welcome to our wedding');
 assert.equal(previewContent(version,'unknown').language,'en');
});
