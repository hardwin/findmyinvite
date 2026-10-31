// Recover and verify an uploaded checkpoint independently of a changing working tree.
import {loadEnv} from 'vite';import {list} from '@vercel/blob';
import {createHash} from 'node:crypto';import {createReadStream} from 'node:fs';
import {mkdir,stat,writeFile,readFile} from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';
Object.assign(process.env,loadEnv('development',process.cwd(),''));const {db}=await import('../server/core.mjs');
const root=path.resolve('work/template-cms-v2');const archive=path.join(root,'legacy-complete.tar.gz'),download=path.join(root,'legacy-restored.tar.gz');
async function hash(p){const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');}
const sha256=await hash(archive);if(await hash(download)!==sha256)throw Error('Uploaded archive checksum mismatch');
const stored=(await list({prefix:'template-archives/',limit:1000})).blobs.filter(b=>b.pathname.endsWith('/legacy-complete.tar.gz')).sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt))[0];if(!stored)throw Error('No uploaded archive');
const entries=execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:10000000}).split(/\r?\n/).filter(Boolean);
if(entries.some(p=>p.startsWith('/')||p.includes(':')||p.split(/[\\/]/).includes('..')))throw Error('Unsafe archive entry');
const original=path.join(root,'legacy-original');await mkdir(original,{recursive:true});execFileSync('tar',['-xzf',archive,'-C',original]);
const restored=path.join(root,'legacy-restore');const manifest=[];
for(const p of entries){if(p.endsWith('/'))continue;const expected=await hash(path.join(original,p));if(await hash(path.join(restored,p))!==expected)throw Error('Restoration mismatch: '+p);manifest.push({path:p,sha256:expected,bytes:(await stat(path.join(original,p))).size});}
const report={objectPath:stored.pathname,sha256,files:manifest,verifiedAt:new Date().toISOString(),assetsArchived:true,removalSafe:true,compatibility:'User confirmed these are POC links with no customers.'};
await writeFile(path.join(root,'legacy-archive-report.json'),JSON.stringify(report,null,2));
const catalog=JSON.parse(await readFile(path.join(restored,'work/template-cms-v2/legacy-catalog.json'),'utf8'));
for(const t of catalog){const exists=await db('template_archives?template_id=eq.'+t.id+'&object_path=eq.'+encodeURIComponent(stored.pathname)+'&select=id');if(!exists.length)await db('template_archives',{method:'POST',body:{template_id:t.id,object_path:stored.pathname,sha256,manifest:report,verified_at:report.verifiedAt}});}
await db('template_catalog?generation=eq.1',{method:'PATCH',body:{isactive:false,published:false}});
console.log(JSON.stringify({verified:true,files:manifest.length,templates:catalog.length,sha256}));
