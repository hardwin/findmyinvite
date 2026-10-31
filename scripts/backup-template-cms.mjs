import {loadEnv} from 'vite';
import {put,get} from '@vercel/blob';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const hash=b=>createHash('sha256').update(b).digest('hex');
const rows={};for(const table of ['template_catalog','template_variations','invitations','payments']){rows[table]=[];for(let offset=0;;offset+=500){const page=await db(table+'?select=*&limit=500&offset='+offset);rows[table].push(...page);if(page.length<500)break;}}
const backup=gzipSync(JSON.stringify({stamp,tables:rows}));const backupPath='cms-backups/'+stamp+'.json.gz';
await put(backupPath,backup,{access:'private',addRandomSuffix:false,contentType:'application/gzip'});
const stored=await get(backupPath,{access:'private',useCache:false});if(!stored||stored.statusCode!==200)throw Error('Backup read failed');const restored=Buffer.from(await new Response(stored.stream).arrayBuffer());if(hash(backup)!==hash(restored))throw Error('Backup checksum failed');JSON.parse(gunzipSync(restored).toString());
const paths=execFileSync('git',['ls-files','src','public/studio','cms'],{encoding:'utf8',maxBuffer:10*1024*1024}).trim().split(/\r?\n/).filter(Boolean);
const files=[];for(const path of paths){const bytes=await readFile(path);files.push({path,sha256:hash(bytes),base64:bytes.toString('base64')});}
const archive=gzipSync(JSON.stringify({format:'fmi-source-archive-v1',files}));const objectPath='template-archives/'+stamp+'/source.json.gz';await put(objectPath,archive,{access:'private',addRandomSuffix:false,contentType:'application/gzip'});
const check=await get(objectPath,{access:'private',useCache:false});const bytes=Buffer.from(await new Response(check.stream).arrayBuffer());if(hash(bytes)!==hash(archive))throw Error('Source verification failed');const decoded=JSON.parse(gunzipSync(bytes).toString());for(const f of decoded.files)if(hash(Buffer.from(f.base64,'base64'))!==f.sha256)throw Error('Restore verification failed');
await mkdir('work/template-cms-v2',{recursive:true});const report={backupPath,backupSha256:hash(backup),sourcePath:objectPath,sourceSha256:hash(archive),sourceFiles:files.length,counts:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.length])),verifiedAt:new Date().toISOString(),note:'Source-only checkpoint. Media archive and legacy runtime extraction must complete before source deletion.'};await writeFile('work/template-cms-v2/backup-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
