import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {cinorevTemplates,cinorevDesigns} from '../shared/cinorev-templates.mjs';
import {CINOREV_RENDERERS} from '../shared/cinorev-renderers.mjs';
import {resolveCinorevEvents} from '../shared/cinorev-events.mjs';
import {validateSchema,validateContent} from '../shared/template-contract.mjs';
import {validateFormDefinition,validateFormContent,allQuestions,setFormValue,formErrors} from '../shared/template-forms.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';

function filled(form){let content=structuredClone(form.initialContent);for(const q of allQuestions(form).filter(q=>q.required)){const answer=q.type==='date'?'2028-04-10':q.type==='time'?'10:30':q.type==='select'?q.options[0]:'അരുൺ Chandrasekharan & family';content=setFormValue(content,q.path,answer);}return content;}
test('exactly the 16 requested additions, with no excluded variants',()=>{
 assert.equal(cinorevTemplates.length,16);assert.equal(new Set(cinorevDesigns.map(d=>d.id)).size,16);
 for(const id of ['church-journey','moonlit-nikah','sky-lanterns','gowtham-pavithra'])assert.ok(!cinorevDesigns.some(d=>d.id===id));
 assert.deepEqual(CINOREV_RENDERERS,cinorevTemplates.map(({template:t})=>t.renderer));assert.equal(INVITATION_BASE_PAISE,19900);
});
for(const {template:t,form,design} of cinorevTemplates){
 test(t.id+' has a valid dedicated form and preserves edited content',()=>{
  validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});validateFormDefinition(form,t.field_schema);
  assert.equal(form.name,t.name);assert.ok(!form.initialContent.groom);assert.throws(()=>validateFormContent(form,t.field_schema,form.initialContent,{complete:true}));
  const content=filled(form);assert.deepEqual(formErrors(form,content),{});
  const clean=validateFormContent(form,t.field_schema,content,{complete:true});assert.equal(clean.groom,content.groom);assert.deepEqual(validateFormContent(form,t.field_schema,clean,{complete:true}),clean);
  for(const event of design.events){assert.ok(form.steps.some(s=>s.id===event.key));for(const key of ['date','time','venue','address']){const path=event.key+'.'+key;assert.ok(allQuestions(form).some(q=>q.path===path&&q.required));assert.ok(formErrors(form,setFormValue(content,path,''))[path]);}}
  for(const q of allQuestions(form).filter(q=>['image','audio','video'].includes(q.type)))assert.ok(!q.required);
 });
 test(t.id+' release and editable media use available local assets',()=>{
  const root='public/assets/cinorev/'+t.id,release=JSON.parse(fs.readFileSync(root+'/document.json'));
  assert.equal(release.id,t.id);assert.equal(release.design.id,t.id);new vm.Script(release.program);
  const serial=JSON.stringify(t.defaults)+JSON.stringify(release)+fs.readFileSync(root+'/design.css','utf8');
  for(const match of serial.matchAll(/\/assets\/cinorev\/[a-z0-9/-]+\.(?:webp|png|jpg|mp4|woff2)/gi))assert.ok(fs.existsSync('public'+match[0]),match[0]);
  assert.ok(!release.html.includes('static.cloudflareinsights'));assert.ok(!release.html.includes('<script'));assert.ok(!/\bfetch\(/.test(release.program));
  assert.ok(fs.existsSync('public'+t.thumbnail));
 });
}
test('independent events drive timezone-safe calendars, including overnight end times',()=>{
 const design=cinorevDesigns.find(d=>d.id==='midnight-stage');
 const es=resolveCinorevEvents(design,{groom:'A & B',bride:'C',utcOffset:'+05:30',wedding:{date:'2028-04-10',time:'10:30',end:'12:30',venue:'First hall',address:'Kochi'},reception:{date:'2028-04-11',time:'23:30',end:'01:00',venue:'Second hall',address:'Thrissur',mapUrl:'https://maps.google.com/?q=Second'}});
 assert.equal(es[0].dates,'20280410T050000Z/20280410T070000Z');assert.equal(es[1].dates,'20280411T180000Z/20280411T193000Z');
 assert.equal(new URL(es[1].calendar).searchParams.get('location'),'Second hall, Thrissur');assert.equal(es[1].maps,'https://maps.google.com/?q=Second');assert.equal(es[0].venue,'First hall');
});
test('birthday and baby shower forms require the actual honourees',()=>{
 for(const [id,paths] of [['up-and-away',['childName','age']],['little-blessing',['motherName','fatherName']]])for(const path of paths)assert.ok(allQuestions(cinorevTemplates.find(x=>x.template.id===id).form).find(q=>q.path===path).required);
});
test('curtain canvas keeps its tieback image rather than adapting it as translations',()=>{
 const {program}=JSON.parse(fs.readFileSync('public/assets/cinorev/garden-curtains/document.json'));
 assert.match(program,/T = IMG\.tieback/);
 assert.doesNotMatch(program,/FMI\.dictionary\(IMG/);
 assert.match(program,/FMI\.dictionary\(\{/);
});
