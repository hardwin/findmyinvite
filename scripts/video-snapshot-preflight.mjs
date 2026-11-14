// Executed inside the provisioned image before it can become a render snapshot.
import {readFile} from 'node:fs/promises';
import {renderPersonalizedVideo} from './render-personalized-video.mjs';
import {videoDefinition,VIDEO_EXAMPLE} from '../shared/video-personalization.mjs';
const id=process.argv[2];
if(!['temple-v1','kerala-christian-v1'].includes(id))throw Error('Unknown video master.');
const master=JSON.parse(await readFile('public/assets/video-masters/'+id+'/manifest.json'));
await renderPersonalizedVideo({master,content:id==='temple-v1'?videoDefinition(id).defaults:VIDEO_EXAMPLE,reviewFrames:[102,330,1248],output:'preflight-frames'});
console.log('Immutable assets, fonts, Chromium WebGL and FFmpeg preflight passed.');
