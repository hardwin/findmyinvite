import {createServer,build,loadEnv} from 'vite';
import {localApi} from './server/local-api.mjs';
import {rm} from 'node:fs/promises';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const config={plugins:[localApi()],configFile:false,resolve:{preserveSymlinks:true},root:process.cwd(),esbuild:{jsx:'automatic'},server:{host:'127.0.0.1',port:5173},optimizeDeps:{noDiscovery:true,include:[]}};
if(process.argv.includes('--build')){await build(config);await rm(new URL('./dist/review',import.meta.url),{recursive:true,force:true});}else{const server=await createServer(config);await server.listen();server.printUrls();}

