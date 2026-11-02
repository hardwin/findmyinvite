// Explicit local catalog publication: this script performs no remote writes.
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {loadEnv} from 'vite';
import {validateSchema,validateContent} from '../shared/template-contract.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {version}=await import('../server/template-cms.mjs');
const {readLocalReleaseIds,localReleaseFile}=await import('../server/local-template-catalog.mjs');
const v=await version(process.argv[2]);
validateSchema(v.field_schema);validateContent(v.field_schema,v.defaults,{complete:true});
const old=await Promise.all((await readLocalReleaseIds()).map(version));
const ids=[...old.filter(row=>row.template_id!==v.template_id).map(row=>row.id),v.id];
await mkdir(new URL('.',localReleaseFile),{recursive:true});
const temporary=new URL('./releases.pending.json',localReleaseFile);
await writeFile(temporary,JSON.stringify({versionIds:ids},null,2)+'\n');
await rename(temporary,localReleaseFile);
console.log(JSON.stringify({scope:'local Vite catalog only',template:v.template_id,version:v.id,renderer:v.renderer,library:'http://127.0.0.1:5173/templates',preview:'http://127.0.0.1:5173/template-preview?version='+v.id},null,2));
