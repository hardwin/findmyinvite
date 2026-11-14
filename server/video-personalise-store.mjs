import {get,put,list,del} from '@vercel/blob';
import {readFile,writeFile,mkdir,rename,unlink,readdir,stat} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export const VIDEO_TTL=7*86400000;
const prefix='video-personalise/';
export const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
function safe(key){if(!/^[a-zA-Z0-9_./-]+$/.test(key)||key.includes('..')||key.startsWith('/'))throw Error('Invalid storage key');return key;}
export function videoStore(env=process.env){
 const local=env.VIDEO_LOCAL_STORE==='1'&&!env.VERCEL;
 const root=resolve('work/video-personalise');
 return {
  // Compressed JSON responses carry weak ETags, which Blob correctly rejects
  // for conditional writes. Read identity bytes to retain the strong write ETag.
  async read(key){safe(key);if(local){try{const b=await readFile(join(root,key));return {value:JSON.parse(b),etag:hash(b)};}catch(e){if(e.code==='ENOENT')return null;throw e;}}const r=await get(prefix+key,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'},token:env.BLOB_READ_WRITE_TOKEN});if(!r||r.statusCode!==200)return null;return {value:JSON.parse(await new Response(r.stream).text()),etag:r.blob.etag};},
  async save(key,value,{etag,create=false}={}){safe(key);const data=JSON.stringify(value);if(local){const p=join(root,key);await mkdir(resolve(p,'..'),{recursive:true});if(create){await writeFile(p,data,{flag:'wx'});return;}const lock=p+'.lock';let h;try{const {open}=await import('node:fs/promises');h=await open(lock,'wx');if(etag){const old=await readFile(p);if(hash(old)!==etag)throw Error('State changed; retry.');}const tmp=p+'.'+randomUUID();await writeFile(tmp,data);await rename(tmp,p);}finally{if(h){await h.close();await unlink(lock).catch(()=>{});}}return;}
   return put(prefix+key,data,{access:'private',contentType:'application/json',addRandomSuffix:false,token:env.BLOB_READ_WRITE_TOKEN,...(etag?{ifMatch:etag}:create?{allowOverwrite:false}:{allowOverwrite:true})});},
  async bytes(key){safe(key);if(local)return readFile(join(root,key));const r=await get(prefix+key,{access:'private',useCache:false,token:env.BLOB_READ_WRITE_TOKEN});if(!r||r.statusCode!==200)throw Error('File unavailable');return Buffer.from(await new Response(r.stream).arrayBuffer());},
  async putBytes(key,data,type){safe(key);if(local){const p=join(root,key);await mkdir(resolve(p,'..'),{recursive:true});await writeFile(p,data);return key;}await put(prefix+key,data,{access:'private',contentType:type,addRandomSuffix:false,allowOverwrite:false,token:env.BLOB_READ_WRITE_TOKEN});return key;},
  async remove(key){safe(key);if(local){await unlink(join(root,key)).catch(e=>{if(e.code!=='ENOENT')throw e;});}else await del(prefix+key,{token:env.BLOB_READ_WRITE_TOKEN});},
  async list(start=''){
   if(start)safe(start);
   if(local){const walk=async dir=>{let found=[];for(const e of await readdir(dir,{withFileTypes:true}).catch(()=>[])){const p=join(dir,e.name);if(e.isDirectory())found.push(...await walk(p));else found.push(relative(root,p).replaceAll('\\','/'));}return found;};return (await walk(root)).filter(k=>k.startsWith(start)&&!k.endsWith('.lock'));}
   let cursor,keys=[];do{const r=await list({prefix:prefix+start,limit:1000,cursor,token:env.BLOB_READ_WRITE_TOKEN});keys.push(...r.blobs.map(b=>b.pathname.slice(prefix.length)));cursor=r.hasMore?r.cursor:undefined;}while(cursor);return keys;
  },
  async expired(now=Date.now()){
   const persistent=async key=>key.startsWith('persistent/')||key.startsWith('media/')&&(await this.read(key))?.value?.durable===true;
   if(local){for(const key of await this.list()){if(!await persistent(key)&&(await stat(join(root,key))).mtimeMs<now-VIDEO_TTL)await this.remove(key);}return;}
   let cursor;do{const r=await list({prefix,limit:1000,cursor,token:env.BLOB_READ_WRITE_TOKEN});const stale=[];for(const b of r.blobs)if(new Date(b.uploadedAt).getTime()<now-VIDEO_TTL&&!await persistent(b.pathname.slice(prefix.length)))stale.push(b.pathname);if(stale.length)await del(stale,{token:env.BLOB_READ_WRITE_TOKEN});cursor=r.hasMore?r.cursor:undefined;}while(cursor);
  },local,prefix
 };
}
