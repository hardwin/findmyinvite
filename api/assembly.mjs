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
 resolveInboxPreview,
 INBOX_DIR,
 ROOT
} from '../server/assembly.mjs';
import {startGeneratePair,getGenerateJob} from '../server/assembly-ai.mjs';
import {startTemplate1Job,listTemplate1JobsResolved,loadTemplate1Job,cancelTemplate1Job,proceedTemplate1Job,jobsDir} from '../server/assembly-template1.mjs';
import {listMusicLibrary} from '../server/music-library.mjs';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
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

  if(action==='preview'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'Inbox preview is local-only.');
   const file=String(url.searchParams.get('file')||'');
   const info=await resolveInboxPreview(file);
   const size=info.bytes;
   const range=String(req.headers.range||'');
   res.setHeader('Accept-Ranges','bytes');
   res.setHeader('Content-Type',info.type);
   res.setHeader('Cache-Control','no-store');
   if(range.startsWith('bytes=')){
    const part=range.replace(/bytes=/,'').split('-');
    const start=Number(part[0])||0;
    const end=part[1]?Number(part[1]):size-1;
    if(start>=size||end>=size||start>end){
     res.statusCode=416;
     res.setHeader('Content-Range',`bytes */${size}`);
     return res.end();
    }
    res.statusCode=206;
    res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length',String(end-start+1));
    return createReadStream(info.path,{start,end}).pipe(res);
   }
   res.statusCode=200;
   res.setHeader('Content-Length',String(size));
   return createReadStream(info.path).pipe(res);
  }

  if(action==='plan'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const body=await bodyJson(req,8192);
   const parentId=String(body.parentId||'');
   const count=Math.min(12,Math.max(1,Number(body.count)||1));
   const names=Array.isArray(body.names)?body.names.map(v=>String(v??'')):[] ;
   const parents=await loadPremiumParents();
   const parent=parents.find(item=>item.id===parentId);
   if(!parent)throw new HttpError(400,'Pick a Premium cinematic parent.');
   const existing=knownTemplateIds(await readFile(join(ROOT,'src','data.ts'),'utf8'));
   return respond(res,200,{parent,clones:planClones(parent,count,existing,names)});
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
   const names=Array.isArray(body.names)?body.names.map(v=>String(v??'')):[];
   const opening=String(body.opening||'');
   const hero=String(body.hero||'');
   const dryRun=Boolean(body.dryRun);
   return respond(res,200,await assemblePremium({parentId,videos,names,opening,hero,dryRun}));
  }

  if(action==='generate-pair'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'AI generate is local-only. Use this desk on your Cursor machine.');
   const body=await bodyJson(req,8192);
   const imageUrl=String(body.imageUrl||body.url||'').trim();
   if(!imageUrl)throw new HttpError(400,'Paste a Pinterest or image URL.');
   return respond(res,200,startGeneratePair({imageUrl}));
  }

  if(action==='generate-status'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'AI generate status is local-only.');
   const jobId=String(url.searchParams.get('jobId')||'');
   const job=getGenerateJob(jobId);
   if(!job)throw new HttpError(404,'Generate job not found.');
   return respond(res,200,job);
  }

  if(action==='music-library'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   return respond(res,200,{tracks:await listMusicLibrary()});
  }

  if(action==='template1-start'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   if(!fsWritesAllowed())throw new HttpError(503,'Template 1 runs locally only. Use this desk on your Cursor machine or CloudAgent.');
   const body=await bodyJson(req,16384);
   return respond(res,200,startTemplate1Job(body));
  }

  if(action==='template1-status'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const jobId=String(url.searchParams.get('jobId')||'');
   if(!jobId)return respond(res,200,{jobs:await listTemplate1JobsResolved()});
   const job=await loadTemplate1Job(jobId);
   if(!job)throw new HttpError(404,'Template 1 job not found.');
   return respond(res,200,job);
  }

  if(action==='template1-cancel'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const body=await bodyJson(req,4096);
   return respond(res,200,cancelTemplate1Job(String(body.jobId||'')));
  }

  if(action==='template1-proceed'){
   method(req,['POST']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const body=await bodyJson(req,4096);
   return respond(res,200,await proceedTemplate1Job(String(body.jobId||'')));
  }

  if(action==='template1-asset'){
   method(req,['GET']);
   if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
   const jobId=String(url.searchParams.get('jobId')||'');
   const role=String(url.searchParams.get('role')||'');
   if(!/^[a-f0-9]{8,16}$/.test(jobId))throw new HttpError(400,'Invalid job.');
   if(role!=='opening-first'&&role!=='opening-last')throw new HttpError(400,'Unknown still.');
   const path=join(jobsDir(),jobId,'gen',role+'-720.jpg');
   let info;
   try{info=await stat(path);}catch{throw new HttpError(404,'Still not ready.');}
   res.statusCode=200;
   res.setHeader('Content-Type','image/jpeg');
   res.setHeader('Cache-Control','no-store');
   res.setHeader('Content-Length',String(info.size));
   return createReadStream(path).pipe(res);
  }

  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
