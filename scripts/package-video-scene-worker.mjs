// Offline, credential-free bundle for a scene worker seeded from the existing
// video snapshot. Never includes .env files, customer uploads or QA fixtures.
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
const directory='work/video-scene-provisioning';
await fs.mkdir(directory,{recursive:true});
const files=['public/assets/video-scenes/v1','public/assets/video-scenes/tiles-v2','server','shared',
 'scripts/render-personalized-video.mjs','scripts/render-scene-video.mjs',
 'scripts/video-personalise-worker.mjs','scripts/video-scene-preflight.mjs',
 'dist/video-render.html',...VIDEO_CATALOG.flatMap(d=>[
  'public/assets/video-masters/'+d.id+'/manifest.json',
  'public/assets/video-masters/'+d.id+'/asset-index.json']),
 'public/assets/video-masters/film-tiles-v1/asset-index-v2.json',
 'public/assets/video-masters/film-tiles-v1/manifest-v1.json'];
for(const name of await fs.readdir('dist/assets'))if(/\.(?:js|css)$/.test(name))files.push('dist/assets/'+name);
await fs.writeFile(directory+'/files.txt',files.join('\n')+'\n');
const archive=directory+'/worker.tar.gz';
if(spawnSync('tar',['-czf',archive,'-T',directory+'/files.txt'],{windowsHide:true,stdio:'inherit'}).status!==0)throw Error('Worker archive failed.');
const hash=createHash('sha256');for await(const chunk of createReadStream(archive))hash.update(chunk);
const record={archive,sha256:hash.digest('hex'),createdAt:new Date().toISOString(),
 browser:{version:'157.0.8103.78',archiveSha256:'f90329720fb61e5a76da9b6b509b6ad12a484c9c5df0359403e935177c6d153a',
 url:'https://storage.googleapis.com/chrome-for-testing-public/157.0.8103.78/linux64/chrome-headless-shell-linux64.zip'},
 designs:VIDEO_CATALOG.map(d=>d.id)};
await fs.writeFile(directory+'/bundle.json',JSON.stringify(record,null,2));
console.log(JSON.stringify(record,null,2));
