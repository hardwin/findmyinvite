// Read-only invitation scan; the public endpoint warms private generated-image storage.
import {loadEnv} from 'vite';
import {db} from '../server/core.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
let offset=0,count=0,failed=0;
for(;;){
 const rows=await db('invitations?published=eq.true&deleted_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=slug&order=id&limit=100&offset='+offset);
 for(const {slug} of rows){
  try{const response=await fetch('https://findmyinvite.com/api/share-image?slug='+encodeURIComponent(slug),{signal:AbortSignal.timeout(65000)});await response.arrayBuffer();if(!response.ok)throw Error('HTTP '+response.status);count++;console.log('Ready',slug);}
  catch(error){failed++;console.error('Retry needed',slug,error.message);}
 }
 if(rows.length<100)break;offset+=rows.length;
}
console.log(JSON.stringify({ready:count,failed}));if(failed)process.exitCode=1;
