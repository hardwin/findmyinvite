// Persist paid opening media before ending the worker; resume without another inference.
import {put,get} from '@vercel/blob';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {blobImageProxyUrl} from './assembly-ai.mjs';

async function readBlob(url,env){
 const result=await get(url,{access:'private',token:env.BLOB_READ_WRITE_TOKEN});
 if(!result||result.statusCode!==200)throw new Error('Saved opening media is unavailable. Nothing was regenerated.');
 return Buffer.from(await new Response(result.stream).arrayBuffer());
}
export async function saveOpeningCheckpoint(checkpoint,cloudId,env=process.env){
 if(!env.BLOB_READ_WRITE_TOKEN)throw new Error('Opening review storage is not configured.');
 const assets={};
 for(const role of ['opening-first','opening-last','opening-video']){
  const asset=checkpoint.assets[role];
  if(!asset)throw new Error('Missing checkpoint asset: '+role);
  const files={};
  for(const key of ['jpg','png','path']){
   if(!asset[key])continue;
   const ext=key==='path'?'mp4':key;
   const blob=await put('assembly-openings/'+cloudId+'/'+role+'.'+ext,await readFile(asset[key]),{
    access:'private',addRandomSuffix:true,token:env.BLOB_READ_WRITE_TOKEN,contentType:ext==='mp4'?'video/mp4':'image/'+(ext==='jpg'?'jpeg':ext)
   });
   files[key]=blob.url;
  }
  const {path,jpg,png,...metadata}=asset;
  assets[role]={...metadata,files};
 }
 const saved={...checkpoint,assets};
 const blob=await put('assembly-openings/'+cloudId+'/checkpoint.json',JSON.stringify(saved),{
  access:'private',addRandomSuffix:true,token:env.BLOB_READ_WRITE_TOKEN,contentType:'application/json'
 });
 return {checkpointUrl:blob.url,openingBlobUrl:assets['opening-video'].files.path};
}
export async function readOpeningCheckpoint(url,env=process.env){
 return JSON.parse((await readBlob(url,env)).toString('utf8'));
}
export async function restoreCheckpointAssets(checkpoint,workdir,env){
 const dir=join(workdir,'gen');
 await mkdir(dir,{recursive:true});
 const assets={};
 for(const role of ['opening-first','opening-last','opening-video']){
  const {files,...metadata}=checkpoint.assets[role];
  const asset={...metadata};
  for(const [key,url] of Object.entries(files)){
   const path=join(dir,role+'.'+(key==='path'?'mp4':key));
   await writeFile(path,await readBlob(url,env));
   asset[key]=path;
  }
  if(files.jpg)asset.url=blobImageProxyUrl(files.jpg,env.SITE_ORIGIN||'https://findmyinvite.com');
  assets[role]=asset;
 }
 return assets;
}
