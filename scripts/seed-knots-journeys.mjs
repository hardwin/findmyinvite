import {loadEnv} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {thiruvarulTemplate,thiruvarulForm} from '../shared/thiruvarul-template.mjs';
import {payanamTemplate,payanamForm} from '../shared/kalyana-payanam-template.mjs';
import {validateSchema,validateContent} from '../shared/template-contract.mjs';
import {validateFormDefinition} from '../shared/template-forms.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const {rpc}=await import('../server/template-cms.mjs');
const [operator]=await db('cms_operators?active=eq.true&select=user_id&limit=1');
if(!operator)throw Error('An active catalog operator is required.');
const releases=[];
for(const [t,definition,order] of [[thiruvarulTemplate,thiruvarulForm,11],[payanamTemplate,payanamForm,12]]){
 validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});validateFormDefinition(definition,t.field_schema);
 const [catalog]=await db('template_catalog?id=eq.'+t.id+'&select=id');
 if(!catalog)await db('template_catalog',{method:'POST',body:{id:t.id,name:t.name,description:t.description,tradition:t.tradition,thumbnail:t.thumbnail,collection:'classic',generation:2,sort_order:order,isactive:false,published:false}});
 let [v]=await db('template_versions?template_id=eq.'+t.id+'&revision=eq.'+t.revision+'&select=*');
 if(v&&(!isDeepStrictEqual(v.field_schema,t.field_schema)||!isDeepStrictEqual(v.defaults,t.defaults)||v.renderer!==t.renderer))throw Error('Existing immutable version differs; author a new revision.');
 if(!v)[v]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:t.id,revision:t.revision,renderer:t.renderer,field_schema:t.field_schema,defaults:t.defaults}});
 let [form]=await db('template_forms?template_id=eq.'+t.id+'&select=*');
 if(!form||!isDeepStrictEqual(form.definition,definition)||form.template_version_id!==v.id)form=await rpc('fmi_save_template_form',{p_template:t.id,p_version:v.id,p_revision:form?.revision||0,p_definition:definition,p_actor:operator.user_id});
 if(process.argv.includes('--release')){
  await rpc('fmi_catalog_release',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'approve'});
  await rpc('fmi_release_with_form',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'publish',p_form_revision:form?.revision||1});
 }
 await mkdir('work/knots',{recursive:true});await writeFile('work/knots/'+t.id+'-version.json',JSON.stringify(v,null,2));
 releases.push({template:t.id,version:v.id,renderer:v.renderer,released:process.argv.includes('--release')});
}
console.log(JSON.stringify(releases,null,2));
