// Internal bounded scene worker. It uses the same immutable renderer and private
// cache as the parent. There is no generation provider and no public entry point.
import {parentPort,workerData} from 'node:worker_threads';
import {videoStore} from '../server/video-personalise-store.mjs';
import {renderLayeredVideo} from './render-layered-video.mjs';
try{const {cacheOwner,...options}=workerData;const proof=await renderLayeredVideo({...options,cache:{owner:cacheOwner,store:videoStore()},onProgress:progress=>parentPort.postMessage({progress})});parentPort.postMessage({done:true,proof});}
catch(error){parentPort.postMessage({error:error.message});}
