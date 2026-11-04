import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {thiruvarulTemplate,thiruvarulForm} from '../shared/thiruvarul-template.mjs';
import {payanamTemplate,payanamForm} from '../shared/kalyana-payanam-template.mjs';
import {journeyData} from '../shared/journey-fields.mjs';
import {validateFormDefinition,validateFormContent} from '../shared/template-forms.mjs';
import {websiteQuote} from '../shared/template-contract.mjs';
import {readInvite as templeModel} from '../public/assets/thiruvarul/invite.js';
import {readInvite as payanamModel} from '../public/assets/kalyana-payanam/invite.js';
import {previewContent} from '../shared/preview-profiles.mjs';
for(const [t,f,read] of [[thiruvarulTemplate,thiruvarulForm,templeModel],[payanamTemplate,payanamForm,payanamModel]]){
 test(t.id+' owns a blank, validated nine-step form',()=>{validateFormDefinition(f,t.field_schema);assert.equal(f.steps.length,9);for(const k of ['bride','groom','date','time','venue','address','whatsapp'])assert.equal(f.initialContent[k],undefined);assert.throws(()=>validateFormContent(f,t.field_schema,f.initialContent,{complete:true}));assert.equal(f.steps.flatMap(s=>s.questions).some(q=>q.type==='image'),false);});
 test(t.id+' keeps its own scene order and removes skipped rooms',()=>{assert.deepEqual(read(journeyData(t.id,{...t.defaults,_form:{authored:true}})).scenes,['welcome','wedding','end']);assert.deepEqual(read(journeyData(t.id,t.defaults)).scenes,t.id==='thiruvarul'?['welcome','story','engagement','wedding','reception','end','wishes']:['welcome','engagement','story','wedding','reception','end']);});
 test(t.id+' validates all authored steps with optional sections included and skipped',()=>{
  for(const include of [false,true]){
   const answers={...structuredClone(t.defaults),_form:{authored:true,story:include,engagement:include,reception:include,rsvp:include,...(t.id==='thiruvarul'?{wishes:include}:{})}};
   for(const s of f.steps)validateFormContent(f,t.field_schema,answers,{stepId:s.id});
   const saved=validateFormContent(f,t.field_schema,answers,{complete:true}),model=read(journeyData(t.id,saved));
   assert.equal(model.events.length,include?3:1);assert.equal(!!model.rsvpPhone,include);assert.equal(model.scenes.includes('story'),include);
   assert.equal(saved.date,answers.date);assert.equal(saved.engagement.venue,answers.engagement.venue);
  }
  const incomplete={...t.defaults,_form:{authored:true,engagement:true},engagement:{}};
  assert.throws(()=>validateFormContent(f,t.field_schema,incomplete,{complete:true}));
  assert.throws(()=>validateFormContent(f,t.field_schema,{...t.defaults,_form:{authored:true,story:true},story:'x'.repeat(601)},{complete:true}));
 });
 test(t.id+' edited details reach events, calendars, maps, names and replies',()=>{const c={...t.defaults,bride:'An exceptionally long first partner name that remains complete',groom:'Vikram',date:'2028-01-02',time:'23:30',end:'01:30',venue:'Lotus Hall',address:'Kochi',whatsapp:'919123456789',_form:{authored:true,rsvp:true}},validated=validateFormContent(f,t.field_schema,c,{complete:true}),m=read(journeyData(t.id,validated)),text=m.text('en');assert.ok(text.names.includes(c.bride));assert.equal(m.main.cal[0],'20280102T180000Z');assert.equal(m.main.cal[1],'20280102T200000Z');assert.match(text.venue,/Lotus Hall.*Kochi/);assert.match(text.main.map,/Lotus%20Hall/);assert.equal(m.rsvpPhone,'919123456789');assert.equal(m.rsvpSite,null);});
 for(const l of ['en','ml','ta','te','kn','hi'])test(t.id+' '+l+' language reaches the actual renderer model',()=>{const c=previewContent({template_id:t.id,defaults:t.defaults},l),m=read(journeyData(t.id,c)),text=m.text(l);assert.equal(m.language,l);assert.ok(text.names);assert.ok(text.wedDate);assert.ok(text.btn.open);if(l!=='en')assert.doesNotMatch(text.names,/Nandhini|Bharath|Aarthi|Karthik/);if(t.id==='kalyana-payanam')assert.ok(text.sign);});
 test(t.id+' has all local artwork and no source-service bootstrap',async()=>{const manifest=JSON.parse(await readFile(new URL('../docs/templates/'+t.id+'-assets.json',import.meta.url)));await Promise.all(manifest.assets.map(a=>access(new URL('../public/assets/'+t.id+'/'+a.file,import.meta.url))));const html=await readFile(new URL('../src/templates/'+t.id+'/document.html',import.meta.url),'utf8'),app=await readFile(new URL('../public/assets/'+t.id+'/app.js',import.meta.url),'utf8');assert.doesNotMatch(html,/facebook|cfk-site-beacon|__PINV__|wp-json|cardsforknots\.in/);assert.doesNotMatch(app,/fromSite\(|return SAMPLE|fetch\(M.rsvpSite/);assert.match(app,/window.FMI_PREVIEW/);});
}
test('design-specific controls are not shared accidentally',()=>{const paths=f=>f.steps.flatMap(s=>s.questions.map(q=>q.path));assert.ok(paths(thiruvarulForm).includes('_form.wishes'));assert.ok(!paths(payanamForm).includes('_form.wishes'));assert.ok(paths(payanamForm).includes('carSign'));assert.ok(!paths(thiruvarulForm).includes('carSign'));const m=payanamModel(journeyData('kalyana-payanam',{...payanamTemplate.defaults,carSign:'Our next adventure'}));assert.equal(m.text('en').sign,'Our next adventure');});
test('both journeys use the collection price',()=>{assert.deepEqual(websiteQuote(1800),{basePaise:100,taxPaise:18,taxBps:1800,totalPaise:118,currency:'INR',months:6});});
