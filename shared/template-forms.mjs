import {validateContent} from './template-contract.mjs';
import {INVITATION_LANGUAGES} from './invitation-languages.mjs';

// Language is a platform capability, explicitly enabled by each stored form.
// Extend only this selector; all other immutable template content constraints remain intact.
function formContentSchema(form,schema){const language=allQuestions(form).find(q=>q.path==='language');return language?{...schema,fields:schema.fields.map(f=>f.key==='language'?{...f,options:language.options}:f)}:schema;}

const unsafe=new Set(['__proto__','prototype','constructor']);
const pathOK=p=>typeof p==='string'&&/^[a-zA-Z_][\w]*(\.[a-zA-Z_][\w]*)*$/.test(p)&&p.split('.').every(k=>!unsafe.has(k));
export function formValue(content,path){return path.split('.').reduce((value,key)=>value?.[key],content);}
export function setFormValue(content,path,value){if(!pathOK(path))throw Error('Invalid field path.');const next=structuredClone(content);let target=next;const keys=path.split('.');for(const key of keys.slice(0,-1))target=target[key]??={};target[keys.at(-1)]=value;return next;}
export function questionVisible(question,content){return !question.when||formValue(content,question.when)===true;}
export function allQuestions(form){return form.steps.flatMap(step=>step.questions);}
// Copy constraints from the immutable content contract during authoring, never generate questions.
export function compileTemplateForm(definition,schema){
 const form=structuredClone(definition);
 for(const q of allQuestions(form)){
  if(q.path.startsWith('_form.'))continue;
  let fields=schema.fields,field;for(const key of q.path.split('.')){field=fields.find(f=>f.key===key);if(!field)throw Error('Invalid content binding: '+q.path);fields=field.fields||[];}
  const limit=(question,f)=>{if(['text','textarea','url'].includes(f.type))question.maxLength=Math.min(question.maxLength||4000,f.maxLength||4000);};
  limit(q,field);if(q.type==='repeater')for(const child of q.fields)limit(child,field.fields.find(f=>f.key===child.path));
 }
 return validateFormDefinition(form,schema);
}
export function validateFormDefinition(form,schema){
 if(!form||form.version!==1||typeof form.title!=='string'||!Array.isArray(form.steps)||form.steps.length<2||form.steps.length>16||!form.initialContent||typeof form.initialContent!=='object')throw Error('Invalid form definition.');
 const ids=new Set(),paths=new Set();let count=0;
 const types=['text','textarea','date','time','url','select','image','audio','video','boolean','repeater'];
 const only=(obj,allowed)=>{if(Object.keys(obj).some(key=>!allowed.includes(key)))throw Error('Invalid declarative form property.');};
 only(form,['version','title','name','thumbnail','steps','initialContent']);
 function question(q){only(q,['path','label','type','required','when','help','options','maxItems','maxLength','fields','format']);if(typeof q.label!=='string'||q.label.length>200||q.required!==undefined&&typeof q.required!=='boolean'||q.maxLength!==undefined&&(!Number.isInteger(q.maxLength)||q.maxLength<1||q.maxLength>4000)||q.format!==undefined&&q.format!=='phone')throw Error('Invalid question constraints.');if(q.type==='select'&&(!Array.isArray(q.options)||!q.options.length||q.options.some(x=>typeof x!=='string')))throw Error('Invalid choices.');}
 function schemaField(path,fields=schema.fields){let field;for(const key of path.split('.')){field=fields.find(f=>f.key===key);if(!field)return null;fields=field.fields||[];}return field;}
 for(const step of form.steps){only(step,['id','title','description','questions']);if(!/^[a-z][a-z0-9-]*$/.test(step.id)||ids.has(step.id)||typeof step.title!=='string'||!Array.isArray(step.questions))throw Error('Invalid form step.');ids.add(step.id);
  for(const q of step.questions){if(++count>180||!pathOK(q.path)||paths.has(q.path)||!types.includes(q.type)||typeof q.label!=='string')throw Error('Invalid form question.');paths.add(q.path);
   question(q);if(q.path==='language'&&(q.type!=='select'||q.options.some(code=>!INVITATION_LANGUAGES.includes(code))))throw Error('Invalid invitation language.');if(q.path.startsWith('_form.')){if(q.type!=='boolean'||q.path==='_form.authored'||!/^_form\.[a-z][a-zA-Z]+$/.test(q.path))throw Error('Invalid section switch.');}
   else {const f=schemaField(q.path);if(!f||!(q.type===f.type||['text','textarea','time'].includes(q.type)&&['text','textarea'].includes(f.type)))throw Error('Invalid content binding: '+q.path);
    if(q.type==='repeater'){if(!Number.isInteger(q.maxItems)||q.maxItems<1||q.maxItems>f.maxItems||!Array.isArray(q.fields))throw Error('Invalid repeated questions.');for(const child of q.fields){const field=(f.fields||[]).find(x=>x.key===child.path);if(!field||!pathOK(child.path)||child.path.includes('.')||!types.includes(child.type)||child.type==='repeater'||!(child.type===field.type||['text','textarea'].includes(child.type)&&['text','textarea'].includes(field.type)))throw Error('Invalid repeated field.');}}
   }
   if(q.fields){const childPaths=new Set();for(const child of q.fields){question(child);if(child.when||childPaths.has(child.path))throw Error('Invalid repeated question.');childPaths.add(child.path);}}
  }
 }
 for(const q of allQuestions(form))if(q.when&&(!pathOK(q.when)||!allQuestions(form).some(x=>x.path===q.when&&x.type==='boolean')))throw Error('Invalid question condition.');
 if(form.steps.at(-1).id!=='review')throw Error('Invalid form: final review required.');
 validateContent(formContentSchema(form,schema),form.initialContent);
 return form;
}
export function formErrors(form,content,stepId){
 /** @type {Record<string,string>} */
 const errors={};
 const check=(q,value,path)=>{
  const empty=value===undefined||value===null||value==='';
  if(q.required&&(empty||q.type==='repeater'&&(!Array.isArray(value)||!value.length))){errors[path]='Please enter '+q.label.toLowerCase()+'.';return;}
  if(empty)return;
  if(q.type==='boolean'){if(typeof value!=='boolean')errors[path]='Choose an option.';return;}
  if(q.type==='repeater'){if(!Array.isArray(value)||value.length>q.maxItems||value.some(item=>!item||typeof item!=='object'||Array.isArray(item))){errors[path]='Check the number of items.';return;}value.forEach((item,i)=>q.fields.forEach(f=>check(f,item[f.path],path+'.'+i+'.'+f.path)));return;}
  if(typeof value!=='string'||value.length>(q.maxLength||4000)){errors[path]='Please shorten this answer.';return;}
  if(q.required&&!value.trim())errors[path]='Please enter '+q.label.toLowerCase()+'.';
  if(q.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))errors[path]='Choose a valid date.';
  if(q.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))errors[path]='Choose a valid time.';
  if(q.type==='select'&&!q.options.includes(value))errors[path]='Choose an available option.';
  if(q.type==='url'){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw Error();}catch{errors[path]='Enter a secure https:// link.';}}
  if(q.format==='phone'&&!/^\+?\d{10,15}$/.test(value))errors[path]='Include the country code and 10–15 digits.';
 };
 for(const step of form.steps)if(!stepId||step.id===stepId)for(const q of step.questions)if(questionVisible(q,content))check(q,formValue(content,q.path),q.path);
 return errors;
}
export function validateFormContent(form,schema,input,{complete=false,stepId}={}){
 validateFormDefinition(form,schema);
 if(stepId&&!form.steps.some(s=>s.id===stepId))throw Error('Invalid form step.');
 const clean=validateContent(formContentSchema(form,schema),input,{complete});
 const flags={authored:true};for(const q of allQuestions(form).filter(q=>q.type==='boolean'&&q.path.startsWith('_form.'))){const value=formValue(input,q.path);if(value!==undefined&&typeof value!=='boolean')throw Error('Invalid section choice.');flags[q.path.slice(6)]=value===true;}
 if(input._form?.shareArtwork!==undefined&&typeof input._form.shareArtwork!=='boolean')throw Error('Invalid share artwork choice.');
 flags.shareArtwork=input._form?.shareArtwork===true;
 clean._form=flags;
 if(complete){const errors=formErrors(form,clean);if(Object.keys(errors).length)throw Error(Object.values(errors)[0]);}
 return clean;
}
