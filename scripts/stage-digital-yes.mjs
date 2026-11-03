// Create immutable inactive versions and make their IDs visible only to the local dev catalog.
import {loadEnv} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validateContent,validateSchema} from '../shared/template-contract.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const {localReleaseFile,readLocalReleaseIds}=await import('../server/local-template-catalog.mjs');
const templates=JSON.parse(await readFile('shared/digital-yes-templates.json','utf8'));
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const releases=[];
for(const [index,t] of templates.entries()){
 validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});
 const [catalog]=await db('template_catalog?id=eq.'+t.id+'&select=id,isactive,published,current_version_id');
 if(!catalog)await db('template_catalog',{method:'POST',body:{id:t.id,name:t.name,description:t.description,tradition:t.tradition,thumbnail:t.thumbnail,sort_order:5+index,collection:'classic',generation:2,isactive:false,published:false}});
 let [version]=await db('template_versions?template_id=eq.'+t.id+'&revision=eq.'+t.revision+'&select=*');
 if(!version)[version]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:t.id,revision:t.revision,renderer:t.renderer,field_schema:t.field_schema,defaults:t.defaults}});
 if(canonical(version.defaults)!==canonical(t.defaults)||canonical(version.field_schema)!==canonical(t.field_schema)||version.renderer!==t.renderer)throw Error('Immutable version differs for '+t.id+'. Increment its revision before staging.');
 if(version.approved_at)throw Error('Use normal published catalog for approved versions.');
 releases.push({template:t.id,version:version.id,renderer:t.renderer,scope:'local',preview:'http://127.0.0.1:5173/template-preview?version='+version.id,personalise:'http://127.0.0.1:5173/personalise?version='+version.id});
}
const existing=await readLocalReleaseIds();const other=[];
for(const id of existing){const [row]=await db('template_versions?id=eq.'+id+'&select=template_id');if(row&&!templates.some(t=>t.id===row.template_id))other.push(id);}
await mkdir(new URL('.',localReleaseFile),{recursive:true});await writeFile(localReleaseFile,JSON.stringify({versionIds:[...other,...releases.map(r=>r.version)]},null,2)+'\n');
await writeFile('work/digital-yes-batch-1/local-releases.json',JSON.stringify(releases,null,2)+'\n');console.log(JSON.stringify(releases,null,2));
