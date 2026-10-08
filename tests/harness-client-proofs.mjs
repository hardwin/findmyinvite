// Local UI harness for the client approval desk: Vite dev server + in-memory PostgREST + in-memory Blob,
// seeded with a production folder's stills. Not used in production.
// usage: node tests/harness-client-proofs.mjs <production-dir> [couple]
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {localApi} from '../server/local-api.mjs';
import {createJob,sendForApproval,setProofStore,uploadStill} from '../server/client-proofs.mjs';
import {postgrestMock,memoryStore} from './helpers/postgrest-mock.mjs';

const [dir,couple='Blessing & Stephy']=process.argv.slice(2);
if(!dir)throw new Error('usage: node tests/harness-client-proofs.mjs <production-dir> [couple]');
Object.assign(process.env,{SUPABASE_URL:'http://mock.supabase.local',SUPABASE_SERVICE_ROLE_KEY:'harness',RATE_LIMIT_SECRET:'harness-rate-limit-secret-0123456789abcdef'});
const pg=postgrestMock(),realFetch=global.fetch;
global.fetch=(url,options)=>String(url).startsWith('http://mock.supabase.local')?pg.handler(url,options):realFetch(url,options);
setProofStore(memoryStore());

const origin='http://127.0.0.1:5173',gate={kind:'akay',user:null};
const titles=['Aerial church','Blessing','Invitation','Groom','Bride','Families','Holy Matrimony','Venue','Reception','Hosts','Save the Date'];
const job=await createJob(gate,{couple,clientName:'Stephy',clientPhone:'+919876543210',template:'kerala-christian-v1',notes:'Harness seed'},origin);
for(let i=1;i<=11;i++){
 const bytes=await readFile(join(dir,'assets/output/kerala-christian-v1',`image-${i}.jpg`));
 await uploadStill(gate,job.id,i,{dataUrl:'data:image/jpeg;base64,'+bytes.toString('base64'),title:titles[i-1]});
}
await sendForApproval(gate,job.id,origin);

const srcRoot=fileURLToPath(new URL('../src',import.meta.url));
const server=await createServer({plugins:[react(),tailwindcss(),localApi()],configFile:false,appType:'spa',root:fileURLToPath(new URL('..',import.meta.url)),
 resolve:{preserveSymlinks:true,alias:{'@':srcRoot}},esbuild:{jsx:'automatic'},server:{host:'127.0.0.1',port:5173,watch:{ignored:['**/FindMyInvite_Cursor_Handoff*/**','**/node_modules/**']}}});
await server.listen();
console.log('CLIENT_LINK',job.proofUrl);
console.log('DESK',origin+'/manager/clients?id='+job.id,'(access code 1414)');
