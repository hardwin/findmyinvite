import {loadEnv} from 'vite';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {cinorevTemplates} from '../shared/cinorev-templates.mjs';
import {validateSchema,validateContent} from '../shared/template-contract.mjs';
import {validateFormDefinition} from '../shared/template-forms.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const {rpc}=await import('../server/template-cms.mjs');
for(const {template:t,form} of cinorevTemplates){validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});validateFormDefinition(form,t.field_schema);}
const [operator]=await db('cms_operators?active=eq.true&select=user_id&limit=1');
if(!operator)throw Error('An active catalog operator is required.');
const releases=[];
for(const [index,{template:t,form:definition}] of cinorevTemplates.entries()){
 const [catalog]=await db('template_catalog?id=eq.'+t.id+'&select=id');
 if(!catalog)await db('template_catalog',{method:'POST',body:{id:t.id,name:t.name,description:t.description,tradition:t.tradition,thumbnail:t.thumbnail,collection:'classic',generation:2,sort_order:13+index,isactive:false,published:false}});
 const versions=await db('template_versions?template_id=eq.'+t.id+'&select=*&order=revision.desc');
 let v=versions.find(v=>isDeepStrictEqual(v.field_schema,t.field_schema)&&isDeepStrictEqual(v.defaults,t.defaults)&&v.renderer===t.renderer);
 if(!v)[v]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:t.id,revision:(versions[0]?.revision||0)+1,renderer:t.renderer,field_schema:t.field_schema,defaults:t.defaults}});
 let [form]=await db('template_forms?template_id=eq.'+t.id+'&select=*');
 const selected=form?.staged_template_version_id===v.id?{template_version_id:v.id,revision:form.staged_revision,definition:form.staged_definition}:form?.template_version_id===v.id?form:null;
 if(!selected||!isDeepStrictEqual(selected.definition,definition))form=await rpc('fmi_save_template_form',{p_template:t.id,p_version:v.id,p_revision:selected?.revision||0,p_definition:definition,p_actor:operator.user_id});else form=selected;
 if(process.argv.includes('--release')){
  const report=JSON.parse(await readFile('work/cinorev/release-verification.json','utf8'));
  if(report.passed!==true||!report.versions?.includes(v.id))throw Error('A passing verification report for this exact version is required.');
  await rpc('fmi_catalog_release',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'approve'});
  await rpc('fmi_release_with_form',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'publish',p_form_revision:form?.revision||1});
 }
 releases.push({template:t.id,version:v.id,renderer:v.renderer,released:process.argv.includes('--release')});
 console.log(t.id+' '+v.id);
}
await mkdir('work/local-template-catalog',{recursive:true});await mkdir('work/cinorev',{recursive:true});
await writeFile('work/cinorev/releases.json',JSON.stringify(releases,null,2));
let registry={versionIds:[]};try{registry=JSON.parse(await readFile('work/local-template-catalog/releases.json','utf8'));}catch{}
await writeFile('work/local-template-catalog/releases.json',JSON.stringify({versionIds:[...new Set([...registry.versionIds,...releases.map(r=>r.version)])]},null,2));
