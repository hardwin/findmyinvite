import {respond,fail,method,HttpError,bodyJson} from '../server/core.mjs';
import {sessionOk} from '../server/akay-gate.mjs';
import {
 assemblePremium,
 fsWritesAllowed,
 listInbox,
 loadPremiumParents,
 planClones,
 knownTemplateIds,
 stageInboxFile,
 INBOX_DIR,
 ROOT
} from '../server/assembly.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

async function rawBody(req,max=120*1024*1024){
 if(Number(req.headers['content-length']||0)>max)throw new HttpError(413,'Video too large.');
 if(Buffer.isBuffer(req.body)){
  if(req.body.length>max)throw new HttpError(413,'Video too large.');
  return req.body;
 }
 if(typeof req.body==='string'){
  const buf=Buffer.from(req.body);
  if(buf.length>max)throw new HttpError(413,'Video too large.');
  return buf;
 }
 let size=0;
 const chunks=[];
 for await(const chunk of req){
  size+=chunk.length;
  if(size>max)throw new HttpError(413,'Video too large.');
  chunks.push(chunk);
 }
 return Buffer.concat(chunks);
}

export default async function handler(req,res){
 try{
  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'';

  if(action==='status'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   return respond(res,200,{
    ok:true,
    writable:fsWritesAllowed(),
    inbox:INBOX_DIR.slice(ROOT.length).replace(/^[\\/]/,''),
    note:fsWritesAllowed()
     ?'Local Assembly can write assets and registries into this repo.'
     :'This host cannot write the git tree. Run Assembly on your Cursor machine.'
   });
  }

  if(action==='parents'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   return respond(res,200,{parents:await loadPremiumParents()});
  }

  if(action==='inbox'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'Inbox listing is local-only.');
   return respond(res,200,{
    inbox:await listInbox(),
    path:INBOX_DIR.slice(ROOT.length).replace(/^[\\/]/,'')
   });
  }

  if(action==='plan'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const body=await bodyJson(req,8192);
   const parentId=String(body.parentId||'');
   const count=Math.min(12,Math.max(1,Number(body.count)||1));
   const parents=await loadPremiumParents();
   const parent=parents.find(item=>item.id===parentId);
   if(!parent)throw new HttpError(400,'Pick a Premium cinematic parent.');
   const existing=knownTemplateIds(await readFile(join(ROOT,'src','data.ts'),'utf8'));
   return respond(res,200,{parent,clones:planClones(parent,count,existing)});
  }

  if(action==='stage'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'Staging videos is local-only.');
   const filename=String(req.headers['x-assembly-filename']||url.searchParams.get('filename')||'');
   const buffer=await rawBody(req);
   if(!buffer.length)throw new HttpError(400,'Empty upload.');
   return respond(res,200,{ok:true,file:await stageInboxFile(filename,buffer)});
  }

  if(action==='assemble'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'Assemble writes are local-only. Use this desk on your Cursor machine.');
   const body=await bodyJson(req,65536);
   const parentId=String(body.parentId||'');
   const videos=Array.isArray(body.videos)?body.videos.map(v=>String(v||'').trim()).filter(Boolean):[];
   const dryRun=Boolean(body.dryRun);
   return respond(res,200,await assemblePremium({parentId,videos,dryRun}));
  }

  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
