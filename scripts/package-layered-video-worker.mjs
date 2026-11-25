// Reproducible, credential-free worker inputs. Outputs belong in ignored local work.
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
const directory=resolve(process.argv[2]||'work/anbil-avan-worker');
await fs.mkdir(directory,{recursive:true});
const files=['server','shared','scripts/render-layered-video.mjs','scripts/render-layered-scene-worker.mjs','scripts/render-personalized-video.mjs','scripts/render-scene-video.mjs','scripts/video-personalise-worker.mjs','public/assets/video-scenes/anbil-avan-v1','public/assets/video-scenes/v1/editor/details-anbil-avan.js','public/assets/video-masters/film-anbil-avan-v1','public/assets/music-library/anbil-avan-original.m4a'];
const archive=join(directory,'runtime.tar.gz');
if(spawnSync('tar',['-czf',archive,...files],{windowsHide:true,stdio:'inherit'}).status!==0)throw Error('Worker archive failed');
for(const [from,to]of [['scripts/video-worker-package.json','package.json'],['scripts/video-worker-package-lock.json','package-lock.json']])await fs.copyFile(from,join(directory,to));
const sha=createHash('sha256');for await(const chunk of createReadStream(archive))sha.update(chunk);
const bundle=JSON.parse(await fs.readFile('public/assets/video-masters/film-anbil-avan-v1/manifest-v1.json'));
const record={templateId:bundle.id,version:bundle.version,renderProfile:bundle.renderProfile,assetIndexSha256:bundle.assets.sceneBundle.sha256,archiveSha256:sha.digest('hex'),browser:{version:'131.0.6778.33',url:'https://storage.googleapis.com/chrome-for-testing-public/131.0.6778.33/linux64/chrome-headless-shell-linux64.zip',sha256:'467927ea92db6e6fda45a338731857ee2983f98ead9006cb55582e3306895e32'},resources:{vcpus:8,parallelScenes:3},createdAt:new Date().toISOString()};
await fs.writeFile(join(directory,'bundle.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
