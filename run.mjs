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
const config={
 plugins:[react(),tailwindcss(),localApi()],
 configFile:false,
 base:'/',
 appType:'spa',
 resolve:{
  preserveSymlinks:true,
  alias:{'@':srcRoot}
 },
 root:process.cwd(),
 esbuild:{jsx:'automatic'},
 server:{host:'127.0.0.1',port:5173},
 optimizeDeps:{
  esbuildOptions:{preserveSymlinks:true},
  include:['react','react-dom/client','react/jsx-runtime','lucide-react','three','recharts','class-variance-authority','clsx','tailwind-merge']
 }
};
if(process.argv.includes('--build')){await build(config);await rm(new URL('./dist/review',import.meta.url),{recursive:true,force:true});}else{const server=await createServer(config);await server.listen();server.printUrls();}
