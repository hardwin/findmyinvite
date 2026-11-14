import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
const root='public/assets/video-scenes/v1',hash=b=>createHash('sha256').update(b).digest('hex');
async function list(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await list(p));else out.push(p);}return out;}
const common=[...await list(root+'/editor'),...await list(root+'/web/vendor'),root+'/frame.html',root+'/frame-runtime.js'];
let total=0;for(const d of VIDEO_CATALOG){const files={};for(const p of [...common,...await list(root+'/web/'+d.design)].sort()){const bytes=await fs.readFile(p);files['/'+p.replaceAll('\\','/').replace(/^public\//,'')]=hash(bytes);total+=bytes.length;}
 const dir='public/assets/video-masters/'+d.id;const existing=JSON.parse(await fs.readFile(dir+'/manifest.json'));if(existing.release.approved)throw Error('Released scene assets are immutable: '+d.id);const index=JSON.stringify({version:1,design:d.design,files},null,2)+'\n';await fs.writeFile(dir+'/asset-index.json',index);
 const master=JSON.parse(await fs.readFile(dir+'/manifest.json'));master.assets.sceneBundle={path:'/assets/video-masters/'+d.id+'/asset-index.json',sha256:hash(index)};await fs.writeFile(dir+'/manifest.json',JSON.stringify(master,null,2)+'\n');
}console.log('Locked 38 asset indexes; combined indexed MB',Math.round(total/1048576));
