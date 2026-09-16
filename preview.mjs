import {preview,loadEnv} from 'vite';
import {localApi} from './server/local-api.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const server=await preview({plugins:[localApi()],configFile:false,base:'/',appType:'spa',resolve:{preserveSymlinks:true},preview:{host:'127.0.0.1',port:5173}});server.printUrls();
