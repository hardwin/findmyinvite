import {loadEnv} from 'vite';
import {put,get} from '@vercel/blob';
import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const dir=path.resolve('work/template-cms-v2');await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const catalog=await db('template_catalog?generation=eq.1&select=*');
await writeFile(path.join(dir,'legacy-catalog.json'),JSON.stringify(catalog,null,2));
const roots=['src','public/assets','public/studio','cms','server','api','shared','package.json','package-lock.json','run.mjs','tsconfig.json','vercel.json','work/template-cms-v2/legacy-catalog.json'];
async function checksum(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
const archive=path.join(dir,'legacy-complete.tar.gz');
execFileSync('tar',['-czf',archive,...roots],{stdio:'inherit'});
// Hash the immutable snapshot, never a working tree that may change during upload.
const snapshot=path.join(dir,'archive-snapshot-'+stamp);await mkdir(snapshot,{recursive:true});
execFileSync('tar',['-xzf',archive,'-C',snapshot],{stdio:'inherit'});
const files=execFileSync('rg',['--files','--hidden','.'],{cwd:snapshot,encoding:'utf8',maxBuffer:10000000}).trim().split(/\r?\n/).filter(Boolean);
const manifest=[];for(const f of files){const source=path.join(snapshot,f);manifest.push({path:f.replaceAll('\\','/').replace(/^\.\//,''),bytes:(await stat(source)).size,sha256:await checksum(source)});}
const objectPath='template-archives/'+stamp+'/legacy-complete.tar.gz';
console.log('Uploading complete archive ('+Math.round((await stat(archive)).size/1048576)+' MB).');
await put(objectPath,createReadStream(archive),{access:'private',addRandomSuffix:false,contentType:'application/gzip',multipart:true});
const fetched=await get(objectPath,{access:'private',useCache:false});if(!fetched||fetched.statusCode!==200)throw Error('Archive download failed');
const downloaded=path.join(dir,'legacy-restored.tar.gz');await pipeline(Readable.fromWeb(fetched.stream),createWriteStream(downloaded));
const sha256=await checksum(archive);if(await checksum(downloaded)!==sha256)throw Error('Archive checksum mismatch');
const entries=execFileSync('tar',['-tzf',downloaded],{encoding:'utf8',maxBuffer:10000000}).split(/\r?\n/).filter(Boolean);
if(entries.some(p=>p.startsWith('/')||p.includes(':')||p.split(/[\\/]/).includes('..')))throw Error('Unsafe archive path');
const restored=path.join(dir,'legacy-restore');await mkdir(restored,{recursive:true});execFileSync('tar',['-xzf',downloaded,'-C',restored],{stdio:'inherit'});
for(const f of manifest)if(await checksum(path.join(restored,f.path))!==f.sha256)throw Error('Restored file differs: '+f.path);
const report={objectPath,sha256,files:manifest,verifiedAt:new Date().toISOString(),assetsArchived:true,removalSafe:true,compatibility:'User confirmed old links have no customers; POC routes may be retired.'};
await writeFile(path.join(dir,'legacy-archive-report.json'),JSON.stringify(report,null,2));
for(const t of catalog)await db('template_archives',{method:'POST',body:{template_id:t.id,object_path:objectPath,sha256,manifest:report,verified_at:report.verifiedAt}});
await db('template_catalog?generation=eq.1',{method:'PATCH',body:{isactive:false,published:false}});
console.log(JSON.stringify({verified:true,files:manifest.length,templates:catalog.length,objectPath,sha256}));
