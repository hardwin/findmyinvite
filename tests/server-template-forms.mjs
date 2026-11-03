import test from 'node:test';
import assert from 'node:assert/strict';
import schemas from './fixtures/template-form-schemas.json' with {type:'json'};
import {definitions} from '../scripts/template-form-definitions.mjs';
import {compileTemplateForm,validateFormDefinition,validateFormContent,formErrors,formValue,setFormValue,allQuestions} from '../shared/template-forms.mjs';
import {formPresentation} from '../shared/form-presentation.mjs';
import {selectedForm} from '../server/template-forms.mjs';
import templates from '../api/templates.mjs';
import invitations from '../api/invitations.mjs';
import payments from '../api/payments.mjs';
import {uploadTemplateMedia} from '../shared/template-upload.mjs';
import {INVITATION_LANGUAGES,invitationText,languageLocale} from '../shared/invitation-languages.mjs';

const expected={
 'christian-bells':['couple','date','ceremonies','wording','story','media','rsvp','review'],
 'moonlit-nikah':['couple','date','celebrations','blessing','information','media','rsvp','review'],
 'kerala-lanterns':['couple','date','ceremonies','invitation','guests','media','rsvp','review'],
 'ivory-lace':['couple','date','venue','programme','dress','travel','replies','media','review'],
 'embroidered-garden':['couple','date','venue','story','programme','recovery','replies','media','review'],
 'mother-of-pearl':['couple','date','location','programme','travel','replies','media','review'],
 'fresco':['couple','date','venue','story','programme','welcome','guests','media','review'],
 'stained-glass':['couple','date','venue','programme','dress','travel','replies','media','review'],
 'royal':['couple','date','venue','programme','gatherings','travel','replies','media','review']
};
function answer(q){return q.type==='date'?'2028-08-20':q.type==='time'?'18:30':q.type==='select'?q.options[0]:q.format==='phone'?'919876543210':q.type==='repeater'?[Object.fromEntries(q.fields.filter(f=>f.required).map(f=>[f.path,answer(f)]))]:'Our celebration';}
function completed(form,enabled=false){let c=structuredClone(form.initialContent);for(const q of allQuestions(form)){if(q.type==='boolean')c=setFormValue(c,q.path,enabled);else if(q.required&&(!q.when||enabled))c=setFormValue(c,q.path,answer(q));}return c;}
for(const version of schemas){const id=version.template_id,form=compileTemplateForm(definitions[id],version.field_schema);
 for(const language of ['ta','te','kn','hi'])test(id+' saves and reopens '+language+' without changing personal text',()=>{
  const content={...completed(form),language,groom:'அருண்',bride:'ಮಾಯಾ'};
  const clean=validateFormContent(form,version.field_schema,content,{complete:true});
  assert.equal(clean.language,language);assert.equal(clean.groom,content.groom);assert.equal(clean.bride,content.bride);
  assert.deepEqual(validateFormContent(form,version.field_schema,clean,{complete:true}),clean);
  assert.deepEqual(allQuestions(form).find(q=>q.path==='language').options,INVITATION_LANGUAGES);
  assert.notEqual(invitationText(language,'Wedding invitation'),'Wedding invitation');
  assert.equal(invitationText(language,'My own invitation wording'),'My own invitation wording');
  assert.ok(new Intl.DateTimeFormat(languageLocale(language),{month:'long'}).format(new Date('2028-08-20')));
 });
 test(id+' rejects unsupported invitation languages',()=>{
  assert.throws(()=>validateFormContent(form,version.field_schema,{...completed(form),language:'xx'},{complete:true}));
  const invalid=structuredClone(form);allQuestions(invalid).find(q=>q.path==='language').options.push('xx');
  assert.throws(()=>validateFormDefinition(invalid,version.field_schema),/language/);
 });
 test(id+' owns its exact steps, blank personal details and optional media',()=>{
  assert.deepEqual(form.steps.map(s=>s.id),expected[id]);
  for(const path of ['bride','groom','date','time','venue','address','whatsapp','giftDetails','groomFamily','brideFamily','rsvpDeadline'])assert.ok(!formValue(form.initialContent,path),path);
  for(const q of allQuestions(form)){if(['image','audio'].includes(q.type))assert.ok(!q.required);assert.notEqual(q.label,'YouTube URL');}
  assert.throws(()=>validateFormContent(form,version.field_schema,form.initialContent,{complete:true}));
 });
 test(id+' validates every step and both optional-section choices',()=>{
  for(const enabled of [false,true]){const content=completed(form,enabled);assert.deepEqual(formErrors(form,content),{});const clean=validateFormContent(form,version.field_schema,content,{complete:true});assert.equal(clean._form.authored,true);
   for(const step of form.steps)assert.deepEqual(formErrors(form,clean,step.id),{});
   for(const q of allQuestions(form).filter(q=>q.required&&(!q.when||enabled))){const changed=setFormValue(content,q.path,'');assert.ok(formErrors(form,changed)[q.path],q.path);}
  }
 });
 test(id+' prevents invalid dates, times, contacts and arbitrary bindings',()=>{
  let content=completed(form);content.date='2028-02-30';content.time='27:90';content.whatsapp='123';assert.equal(Object.keys(formErrors(form,content)).length,3);
  const broken=structuredClone(form);broken.steps[0].questions[0].path='missing.personalField';assert.throws(()=>validateFormDefinition(broken,version.field_schema),/binding/);
  assert.throws(()=>validateFormContent(form,version.field_schema,completed(form),{stepId:'invented'}),/step/);
 });
}
test('optional sections are absent from native presentation and existing guests remain unchanged',()=>{
 const old={groom:'Existing',verse:'Original'};assert.equal(formPresentation('christian-bells',old),old);
 assert.deepEqual(formPresentation('christian-bells',{_form:{authored:true},story:[{title:'Demo'}],verse:'Demo',groomFamily:'Demo'}).story,[]);
 const lace=formPresentation('ivory-lace',{_form:{authored:true},hotels:[{name:'Demo'}],gifts:'Demo',transport:'Demo'});assert.deepEqual(lace.hotels,[]);assert.equal(lace.gifts,'');assert.equal(lace.transport,'');
});
test('future forms cannot replace active customer forms before release',()=>{const row={template_id:'t',template_version_id:'live',revision:2,definition:{live:true},staged_template_version_id:'next',staged_revision:1,staged_definition:{next:true}};assert.equal(selectedForm(row,'next'),null);assert.deepEqual(selectedForm(row,'live').definition,{live:true});assert.equal(selectedForm(row,'next',true).staged,true);});
test('malformed repeated answers and prototype paths are rejected safely',()=>{assert.throws(()=>setFormValue({},'__proto__.polluted',true));assert.throws(()=>setFormValue({},'constructor.foo',true));const form=definitions['ivory-lace'];assert.ok(formErrors(form,{events:[null]},'programme').events);});

const user='4744ee35-ed37-4127-b529-a19db8f2132a';
const v={...schemas.find(v=>v.template_id==='royal'),approved_at:'2026-11-01',defaults:{}};
const form={template_id:v.template_id,template_version_id:v.id,revision:1,definition:compileTemplateForm(definitions.royal,v.field_schema)};
const row={id:'fixture',slug:'form-test',owner_id:user,template_version_id:v.id,draft_revision:1,draft_content:completed(form.definition),form_step_id:'travel',form_revision:1,deleted_at:null};
async function request(fn,url,body,auth=true){const res={setHeader(){},status(n){this.code=n;return this;},json(body){this.body=body;}};await fn({url,method:body===undefined?'GET':'POST',body,headers:auth?{authorization:'Bearer fixture'}:{},socket:{remoteAddress:'local'}},res);return res;}
function fixture(t,override=()=>undefined){const env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture',RATE_LIMIT_SECRET:'test-012345678901234567890123456789',RAZORPAY_KEY_ID:'rzp_test_fixture',RAZORPAY_KEY_SECRET:'fixture-secret'});const calls=[];t.after(()=>{t.mock.restoreAll();for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);});t.mock.method(globalThis,'fetch',async(url,o={})=>{const u=new URL(url);calls.push({path:u.pathname,body:o.body&&JSON.parse(o.body)});let data=override(u,o);if(data===undefined)data=u.pathname==='/auth/v1/user'?{id:user}:u.pathname.endsWith('/template_versions')?[v]:u.pathname.endsWith('/template_catalog')?[{current_version_id:v.id}]:u.pathname.endsWith('/template_forms')?[form]:u.pathname.endsWith('/invitations')?[row]:u.pathname.endsWith('/consume_rate_limit')?true:u.pathname.endsWith('/website_offer')?[{tax_bps:1800,tax_label:'GST'}]:[];return data instanceof Response?data:new Response(JSON.stringify(data));});return calls;}
test('anonymous editor returns the selected dedicated form',async t=>{fixture(t);const r=await request(templates,'/api/templates?action=editor&id='+v.id,undefined,false);assert.equal(r.code,200);assert.equal(r.body.form.template_version_id,v.id);});
test('missing and mismatched forms prevent personalisation, without a fallback',async t=>{fixture(t,u=>u.pathname.endsWith('/template_forms')?[]:undefined);const r=await request(templates,'/api/templates?action=editor&id='+v.id,undefined,false);assert.equal(r.code,409);assert.match(r.body.error,/form is not available/);});
test('ordinary customers cannot edit stored form definitions',async t=>{const calls=fixture(t);const r=await request(templates,'/api/templates?action=save-form',{versionId:v.id,definition:form.definition,revision:1});assert.equal(r.code,403);assert.ok(!calls.some(c=>c.path.endsWith('/fmi_save_template_form')));});
test('CMS refuses release without a valid matching form',async t=>{const calls=fixture(t,u=>u.pathname.endsWith('/cms_operators')?[{user_id:user}]:u.pathname.endsWith('/template_forms')?[]:undefined);const r=await request(templates,'/api/templates?action=publish',{template_id:v.template_id,version_id:v.id});assert.equal(r.code,409);assert.ok(!calls.some(c=>c.path.endsWith('/fmi_catalog_release')||c.path.endsWith('/fmi_release_with_form')));});
test('CMS rejects executable properties in definitions',async t=>{fixture(t,u=>u.pathname.endsWith('/cms_operators')?[{user_id:user}]:undefined);const r=await request(templates,'/api/templates?action=save-form',{versionId:v.id,revision:1,definition:{...form.definition,script:'alert(1)'}});assert.equal(r.code,400);});
test('saving requires sign in and loading a draft returns its saved step',async t=>{fixture(t);assert.equal((await request(invitations,'/api/invitations?action=v2-create',{versionId:v.id},false)).code,401);const r=await request(invitations,'/api/invitations?action=v2-manage&slug=form-test');assert.equal(r.code,200);assert.equal(r.body.invitation.formStepId,'travel');});
test('create assigns a unique address and keeps submitted answers and step',async t=>{const calls=fixture(t,(u,o)=>u.pathname.endsWith('/invitations')&&o.method==='POST'?[{...row,...JSON.parse(o.body)}]:undefined);const r=await request(invitations,'/api/invitations?action=v2-create',{versionId:v.id,content:row.draft_content,formStepId:'travel',formRevision:1});assert.equal(r.code,201);assert.match(r.body.invitation.slug,/^celebration-[a-f0-9]{16}$/);assert.equal(r.body.invitation.formStepId,'travel');assert.equal(calls.filter(c=>c.path.endsWith('/invitations')).length,1);});
test('stale form revision is rejected before saving',async t=>{const calls=fixture(t);const r=await request(invitations,'/api/invitations?action=v2-save&slug=form-test',{revision:1,formRevision:9,content:row.draft_content});assert.equal(r.code,409);assert.ok(!calls.some(c=>c.path.includes('fmi_save_form_draft')));});
test('conflicting saves keep a useful conflict message',async t=>{fixture(t,u=>u.pathname.endsWith('/fmi_save_form_draft')?new Response(JSON.stringify({code:'PT409',message:'Draft changed; reload before saving.'}),{status:409}):undefined);const r=await request(invitations,'/api/invitations?action=v2-save&slug=form-test',{revision:1,content:row.draft_content,formStepId:'travel',formRevision:1});assert.equal(r.code,409);assert.match(r.body.error,/Draft changed/);});
test('foreign or unfinished uploads cannot be saved',async t=>{fixture(t);const r=await request(invitations,'/api/invitations?action=v2-save&slug=form-test',{revision:1,content:{...row.draft_content,cover:'/api/template-media?id=11111111-1111-4111-8111-111111111111'}});assert.equal(r.code,400);assert.match(r.body.error,/media files/);});
test('published addresses cannot change',async t=>{fixture(t,u=>u.pathname.endsWith('/invitations')?[{...row,first_published_at:new Date().toISOString(),expires_at:'2030-01-01'}]:undefined);const r=await request(invitations,'/api/invitations?action=v2-save&slug=form-test',{revision:1,content:row.draft_content,newSlug:'changed-address'});assert.equal(r.code,409);});
test('incomplete content cannot publish or create a payment order',async t=>{const calls=fixture(t,u=>u.pathname.endsWith('/invitations')?[{...row,draft_content:form.definition.initialContent}]:undefined);const r=await request(invitations,'/api/invitations?action=v2-publish&slug=form-test',{revision:1});assert.equal(r.code,400);assert.ok(!calls.some(c=>c.path.endsWith('/fmi_publish_invitation')));});
test('payment configuration still quotes 100 + 18 paise',async t=>{fixture(t);const r=await request(payments,'/api/payments?action=v2-config',undefined,false);assert.equal(r.body.quote.basePaise,100);assert.equal(r.body.quote.taxPaise,18);assert.equal(r.body.quote.totalPaise,118);});
test('upload failure keeps the previous answer and retry returns only verified media',async()=>{let fail=true,reservations=0,completions=0;const options={file:{size:12,type:'audio/mpeg'},kind:'audio',slug:'private-draft',optimise:async f=>f,token:async()=>'refreshed-token',api:async(path,body)=>{if(path.includes('reserve')){assert.equal(body.slug,'private-draft');return {id:++reservations,pathname:'private/file',url:'/api/template-media?id='+reservations};}completions++;},upload:async(path,file,options)=>{assert.equal(options.access,'private');assert.equal(options.headers.Authorization,'Bearer refreshed-token');if(fail)throw Error('Connection lost');}};await assert.rejects(()=>uploadTemplateMedia(options),/Connection lost/);assert.equal(completions,0);fail=false;assert.equal(await uploadTemplateMedia(options),'/api/template-media?id=2');assert.equal(completions,1);});
test('failed upload verification never becomes a form answer',async()=>{await assert.rejects(()=>uploadTemplateMedia({file:{size:12},kind:'image',slug:'draft',optimise:async f=>f,token:async()=>'token',upload:async()=>{},api:async path=>{if(path.includes('reserve'))return {id:'one',pathname:'private/file',url:'unverified'};throw Error('Media verification failed');}}),/verification failed/);});
test('publish and renewal order requests both retain the ₹1.18 quote',async t=>{let renewal=false;fixture(t,u=>{if(u.pathname.endsWith('/invitations'))return [{...row,first_published_at:renewal?'2026-11-01':null,expires_at:'2030-01-01',draft_content:renewal?{}:row.draft_content}];if(u.pathname.endsWith('/fmi_reserve_website_order'))return {created:true,order:{id:'order-fixture',razorpay_order_id:'rzp_order_fixture',amount:118,base_paise:100,tax_bps:1800,tax_paise:18,status:'created'}};});for(const purpose of ['publish','renew']){renewal=purpose==='renew';const r=await request(payments,'/api/payments?action=v2-order',{slug:row.slug,purpose});assert.equal(r.code,200);assert.equal(r.body.amount,118);assert.equal(r.body.quote.totalPaise,118);}});
