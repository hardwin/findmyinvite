// Explicit offline provisioning, run after master approval and npm run build.
// The snapshot contains only compositing dependencies; no provider SDKs or credentials.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {Sandbox} from '@vercel/sandbox';
import {assertMaster} from '../shared/video-personalization.mjs';
const template=process.argv[2]||'temple-v1';if(!['temple-v1','kerala-christian-v1'].includes(template))throw Error('Unsupported template.');
const master=assertMaster(JSON.parse(await readFile('public/assets/video-masters/'+template+'/manifest.json')),{released:true});
const files=['scripts/render-personalized-video.mjs','scripts/video-snapshot-preflight.mjs','scripts/video-personalise-worker.mjs','scripts/video-cutout.py','scripts/video-cutout-requirements.txt','server/video-personalise-store.mjs','server/video-personalise.mjs','server/core.mjs','shared/video-personalization.mjs','shared/temple-video.mjs','shared/template-forms.mjs','shared/template-contract.mjs','shared/pricing.mjs','shared/invitation-languages.mjs','dist/video-render.html'];
// The bundled render entry uses only its own transitive chunks, not the main website.
const html=await readFile('dist/video-render.html','utf8'),pending=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+\.js)"/g)].map(m=>'dist'+m[1]),seen=new Set();
while(pending.length){const path=pending.pop();if(seen.has(path))continue;seen.add(path);files.push(path);const source=await readFile(path,'utf8');for(const match of source.matchAll(/(?:from|import)\s*['"]\.\/([^'"]+\.js)['"]/g))pending.push('dist/assets/'+match[1]);}
for(const a of Object.values(master.assets))files.push('public'+a.path);
files.push('public/assets/video-masters/'+template+'/manifest.json');
for(const f of await readdir('public/assets/music-library'))if(f.endsWith('.mp3'))files.push('public/assets/music-library/'+f);
const credentials=process.env.VERCEL_TOKEN?{token:process.env.VERCEL_TOKEN,teamId:process.env.VERCEL_TEAM_ID,projectId:process.env.VERCEL_PROJECT_ID}:{};
const box=await Sandbox.create({...credentials,runtime:'node24',timeout:25*60000,resources:{vcpus:4}});
await mkdir('work/temple-cloud-release',{recursive:true});
await writeFile('work/temple-cloud-release/provision-session.json',JSON.stringify({sandboxId:box.sandboxId,template,startedAt:new Date().toISOString()}));
console.log('Created compositor provisioning sandbox: '+box.sandboxId);
try{
 // Bound request memory when shipping the immutable background and overlays.
 for(const path of new Set(files)){await box.writeFiles([{path,content:await readFile(path)}]);console.log('Copied '+path);}
 await box.writeFiles([{path:'package.json',content:await readFile('scripts/video-worker-package.json')},{path:'package-lock.json',content:await readFile('scripts/video-worker-package-lock.json')}]);
 const setup=[
  'set -euo pipefail',
  'npm ci --omit=dev',
  'if command -v apt-get >/dev/null; then sudo apt-get update; sudo apt-get install -y python3-pip libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libasound2t64; python3 -m pip install --user --break-system-packages uv; "$HOME/.local/bin/uv" venv --python 3.12 --seed venv; else sudo dnf install -y python3.13 python3.13-pip nss atk at-spi2-atk cups-libs libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib; python3.13 -m venv venv; fi',
  'venv/bin/pip install -r scripts/video-cutout-requirements.txt',
  'U2NET_HOME=/vercel/sandbox/models venv/bin/python -c "from rembg import new_session; new_session(\'u2net\')"',
  'mkdir -p /vercel/sandbox/bin',
  'node --input-type=module -e "import chromium from \'@sparticuz/chromium\'; import {cp,readdir} from \'node:fs/promises\'; const path=await chromium.executablePath(); await cp(path,\'/vercel/sandbox/bin/chromium\'); for(const name of await readdir(\'/tmp\'))if(name.endsWith(\'.so\')||name.includes(\'.so.\')||name===\'vk_swiftshader_icd.json\')await cp(\'/tmp/\'+name,\'/vercel/sandbox/bin/\'+name);"',
  'node -e "require(\'child_process\').execFileSync(\'node\',[\'--check\',\'scripts/video-personalise-worker.mjs\'],{stdio:\'inherit\'})"',
  'VIDEO_CHROMIUM_PATH=/vercel/sandbox/bin/chromium node scripts/video-snapshot-preflight.mjs '+template
 ].join('\n');
 const result=await box.runCommand({cmd:'bash',args:['-lc',setup],cwd:'/vercel/sandbox',stdout:process.stdout,stderr:process.stderr});if(result.exitCode!==0)throw Error('Video snapshot provisioning failed.');
 const snapshot=await box.snapshot({expiration:0});const record={snapshotId:snapshot.snapshotId,template:master.id,masterVersion:master.version,rendererVersion:master.rendererVersion,createdAt:new Date().toISOString()};await writeFile('work/temple-cloud-release/snapshot.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
}finally{await box.stop().catch(()=>{});}
