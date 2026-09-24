import {readFile,writeFile,rm} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath,URL as NodeURL} from 'node:url';
await writeFile(new URL('./public/vendor/grapesjs/grapes.min.js',import.meta.url),gunzipSync(await readFile(new URL('./public/vendor/grapesjs/grapes.min.js.gz',import.meta.url))));
import {createServer,build,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {localApi} from './server/local-api.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const srcRoot=fileURLToPath(new NodeURL('./src',import.meta.url));

/** Assembly / Template 1 writes these paths at the end of a job. Suppress Vite full-reload so /assembly keeps the preview card. */
function assemblyQuietWatch(){
 const quiet=/(^|\/)(cms|supabase|work|job_engine)(\/|$)|\/public\/assets\/|\/(data\.ts|invitation3\.css|Invitation\.tsx|App\.tsx|core\.mjs|share-card\.mjs|templates\.json|seed-templates\.sql|manifest\.json)$/;
 return {
  name:'assembly-quiet-watch',
  handleHotUpdate({file}){
   const norm=String(file||'').replace(/\\/g,'/');
   if(quiet.test(norm))return [];
  }
 };
}

const config={
 plugins:[react(),tailwindcss(),localApi(),assemblyQuietWatch()],
 configFile:false,
 base:'/',
 appType:'spa',
 resolve:{
  preserveSymlinks:true,
  alias:{'@':srcRoot}
 },
 root:process.cwd(),
 esbuild:{jsx:'automatic'},
 server:{
  host:'127.0.0.1',
  port:5173,
  // Keep /assembly stable. Do NOT ignore public/assets — Vite then misses files written mid-session and SPA-falls-back HTML for new mp4s.
  watch:{ignored:[
   '**/job_engine/**',
   '**/work/**',
   '**/cms/**',
   '**/supabase/**',
   '**/.git/**',
   '**/node_modules/**',
   '**/dist/**'
  ]}
 },
 optimizeDeps:{
  esbuildOptions:{preserveSymlinks:true},
  include:['react','react-dom/client','react/jsx-runtime','lucide-react','three','swiper','recharts','class-variance-authority','clsx','tailwind-merge']
 }
};
if(process.argv.includes('--build')){await build(config);await rm(new URL('./dist/review',import.meta.url),{recursive:true,force:true});}else{const server=await createServer(config);await server.listen();server.printUrls();}
