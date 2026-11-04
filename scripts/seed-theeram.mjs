import {loadEnv} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {theeramTemplate as t,theeramForm} from '../shared/theeram-template.mjs';
import {validateSchema,validateContent} from '../shared/template-contract.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const {rpc}=await import('../server/template-cms.mjs');
validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});
let [catalog]=await db('template_catalog?id=eq.theeram&select=id');
if(!catalog)await db('template_catalog',{method:'POST',body:{id:t.id,name:t.name,description:t.description,tradition:t.tradition,thumbnail:t.thumbnail,collection:'classic',generation:2,sort_order:10,isactive:false,published:false}});
let [v]=await db('template_versions?template_id=eq.theeram&revision=eq.1&select=*');
if(!v)[v]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:t.id,revision:t.revision,renderer:t.renderer,field_schema:t.field_schema,defaults:t.defaults}});
const [operator]=await db('cms_operators?active=eq.true&select=user_id&limit=1');if(!operator)throw Error('An active operator is required.');
let [form]=await db('template_forms?template_id=eq.theeram&select=revision,definition');
if(!form||!isDeepStrictEqual(form.definition,theeramForm))form=await rpc('fmi_save_template_form',{p_template:t.id,p_version:v.id,p_revision:form?.revision||0,p_definition:theeramForm,p_actor:operator.user_id});
if(process.argv.includes('--release')){await rpc('fmi_catalog_release',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'approve'});await rpc('fmi_release_with_form',{p_template:t.id,p_version:v.id,p_actor:operator.user_id,p_action:'publish',p_form_revision:form?.revision||1});}
await mkdir('work/theeram',{recursive:true});await writeFile('work/theeram/version.json',JSON.stringify(v,null,2));console.log(JSON.stringify({id:v.id,renderer:v.renderer,released:process.argv.includes('--release')}));
