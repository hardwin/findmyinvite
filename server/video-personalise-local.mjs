// Local development uses the same private jobs and renderer, in a clean process.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {HttpError} from './core.mjs';
export function localWorkerEnvironment(env){const out={VIDEO_LOCAL_STORE:'1',NODE_ENV:'development'};for(const key of ['PATH','Path','SystemRoot','TEMP','TMP','HOME','USERPROFILE','VIDEO_CHROMIUM_PATH','FFMPEG_PATH','FFPROBE_PATH','PYTHON_BIN','U2NET_HOME'])if(env[key])out[key]=env[key];return out;}
export async function launchLocalVideo(job,secret,env){
 const dir=resolve('work/video-personalise/worker-input');await mkdir(dir,{recursive:true});const path=join(dir,job.attempt+'.json');await writeFile(path,JSON.stringify({id:job.id,secret}));
 const child=spawn(process.execPath,['scripts/video-personalise-worker.mjs',path],{cwd:process.cwd(),env:localWorkerEnvironment(env),windowsHide:true,stdio:'ignore'});
 await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();
}
export async function prepareLocalVideoPhoto(bytes,env){
 const dir=await mkdtemp(join(tmpdir(),'fmi-cutout-'));try{const input=join(dir,'input'),output=join(dir,'cutout.png');await writeFile(input,bytes);const child=spawn(env.PYTHON_BIN||'python',['scripts/video-cutout.py',input,output],{cwd:process.cwd(),env:localWorkerEnvironment(env),windowsHide:true,stdio:'ignore'});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(Error('Cutout timed out'));},180000);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Cutout failed'));});});const result=await readFile(output);if(result.length>4*1048576)throw Error('Cutout too large');return result;}catch{throw new HttpError(422,'We could not prepare a clean cutout. Please use the framed-photo option.');}finally{await rm(dir,{recursive:true,force:true});}
}
