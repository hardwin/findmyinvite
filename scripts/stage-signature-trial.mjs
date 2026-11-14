import {loadEnv} from 'vite';
import fs from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {SIGNATURE_VARIANTS} from '../shared/signature-variants.mjs';
import {validateFormDefinition} from '../shared/template-forms.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const {rpc}=await import('../server/template-cms.mjs');
await fs.mkdir('work/signature-trial',{recursive:true});
const snapshotPath='work/signature-trial/rollback.json';
let snapshot;
try{snapshot=JSON.parse(await fs.readFile(snapshotPath,'utf8'));}catch{
 snapshot=[];
 for(const variant of Object.values(SIGNATURE_VARIANTS)){
  const [catalog]=await db('template_catalog?id=eq.'+variant.template+'&select=*');
  const [version]=await db('template_versions?id=eq.'+catalog.current_version_id+'&select=*');
  const [form]=await db('template_forms?template_id=eq.'+variant.template+'&select=*');
  if(version.renderer!==variant.baseRenderer||form.template_version_id!==version.id||form.staged_template_version_id)throw Error('Unexpected baseline or existing staged work: '+variant.template);
  snapshot.push({catalog,version,form});
 }
 await fs.writeFile(snapshotPath,JSON.stringify(snapshot,null,2),{flag:'wx'});
}
// Public form definitions only. No invitation/customer data is copied.
const archived=Object.fromEntries(snapshot.map(({version,form})=>[version.id,{template_id:version.template_id,template_version_id:version.id,revision:form.revision,definition:form.definition}]));
await fs.writeFile('server/signature-form-archive.json',JSON.stringify(archived,null,2)+'\n');
const [operator]=await db('cms_operators?active=eq.true&select=user_id&limit=1');
if(!operator)throw Error('Catalog operator required');
const releases=[];
for(const [renderer,variant] of Object.entries(SIGNATURE_VARIANTS)){
 const old=snapshot.find(s=>s.catalog.id===variant.template);
 const versions=await db('template_versions?template_id=eq.'+variant.template+'&select=*&order=revision.desc');
 let v=versions.find(v=>v.renderer===renderer&&isDeepStrictEqual(v.defaults,old.version.defaults)&&isDeepStrictEqual(v.field_schema,old.version.field_schema));
 if(!v)[v]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:variant.template,revision:versions[0].revision+1,renderer,field_schema:old.version.field_schema,defaults:old.version.defaults}});
 const definition={...old.form.definition,thumbnail:variant.poster};
 validateFormDefinition(definition,v.field_schema);
 const [row]=await db('template_forms?template_id=eq.'+variant.template+'&select=*');
 const existing=row.staged_template_version_id===v.id?{revision:row.staged_revision,definition:row.staged_definition}:row.template_version_id===v.id?row:null;
 const form=existing&&isDeepStrictEqual(existing.definition,definition)?existing:await rpc('fmi_save_template_form',{p_template:variant.template,p_version:v.id,p_revision:existing?.revision||0,p_definition:definition,p_actor:operator.user_id});
 releases.push({template:variant.template,version:v,form:{template_id:variant.template,template_version_id:v.id,revision:form.revision,definition},thumbnail:variant.poster});
 console.log('Staged '+variant.template+' '+v.id);
}
await fs.writeFile('work/signature-trial/releases.json',JSON.stringify(releases,null,2));
// Also preserve trial forms so an independent rollback cannot strand its drafts.
for(const release of releases)archived[release.version.id]=release.form;
await fs.writeFile('server/signature-form-archive.json',JSON.stringify(archived,null,2)+'\n');
await fs.mkdir('work/local-template-catalog',{recursive:true});
let local={versionIds:[]};try{local=JSON.parse(await fs.readFile('work/local-template-catalog/releases.json','utf8'));}catch{}
await fs.writeFile('work/local-template-catalog/releases.json',JSON.stringify({versionIds:[...new Set([...local.versionIds,...releases.map(r=>r.version.id)])]},null,2));
