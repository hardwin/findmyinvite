import {handleUpload} from '@vercel/blob/client';
import {get as blobGet,head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {requireOwner} from '../server/owner/auth.mjs';
import {list,get,save} from '../server/owner/store.mjs';
import {musicTracks,musicTrack,publicTrack,musicId} from '../server/website-music.mjs';
import {matchesMediaType} from '../server/template-file-validation.mjs';
import {db,bodyJson,respond,fail,method,HttpError} from '../server/core.mjs';
const types=['audio/mpeg','audio/mp4','audio/ogg'],limit=20*1048576;
const text=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';
const link=v=>{if(!v)return '';try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}throw new HttpError(400,'Use HTTPS source and licence links.');};
export default async function handler(req,res){try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'list';
 if(action==='upload'){method(req,['POST']);const body=await bodyJson(req);return respond(res,200,await handleUpload({request:req,body,onBeforeGenerateToken:async pathname=>{await requireOwner(req);const id=pathname.split('/').pop(),row=await musicTrack(id);if(row?.status!=='pending'||row.objectPath!==pathname)throw new HttpError(403,'Upload not reserved.');return {allowedContentTypes:types,maximumSizeInBytes:limit,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+600000};},onUploadCompleted:async()=>{}}));}
 await requireOwner(req);
 if(action==='list'){method(req,['GET']);return respond(res,200,{tracks:(await musicTracks()).map(t=>({...publicTrack(t),revision:t.revision,status:t.status,archived:t.archived})),assignments:await list('music-assignment'),templates:await db('template_catalog?generation=eq.2&select=id,name,current_version_id&order=sort_order.asc')});}
 method(req,['POST']);const b=await bodyJson(req,20000);
 if(action==='reserve'){const id=randomUUID(),row=await save('music-track',id,{title:'New track',artist:'',mood:'',credit:'',license:'',licenseUrl:'',sourceUrl:'',duration:0,status:'pending',archived:false,objectPath:'website-music/'+id},0,'owner','music.reserved');return respond(res,201,{id,pathname:row.objectPath});}
 if(action==='assign'){if(!musicId.test(b.templateId||'')||!(await db('template_catalog?id=eq.'+encodeURIComponent(b.templateId)+'&select=id'))[0])throw new HttpError(400,'Unknown template.');if(b.trackId){const t=await musicTrack(b.trackId);if(t?.status!=='ready'||t.archived)throw new HttpError(400,'Choose an active track.');}return respond(res,200,{assignment:await save('music-assignment',b.templateId,{trackId:b.trackId||''},b.revision||0,'owner','music.assigned')});}
 const old=await musicTrack(b.id);if(!old)throw new HttpError(404,'Track not found.');
 if(action==='complete'){if(old.status!=='pending')throw new HttpError(409,'Upload already completed.');const info=await head(old.objectPath);if(!types.includes(info.contentType)||info.size<12||info.size>limit)throw new HttpError(400,'Use an MP3, M4A or OGG under 20 MB.');const file=await blobGet(old.objectPath,{access:'private'});if(!file?.stream)throw new HttpError(400,'Upload missing.');const reader=file.stream.getReader();const chunks=[];let size=0;try{while(size<32){const {value,done}=await reader.read();if(done)break;chunks.push(value);size+=value.length;}}finally{await reader.cancel();}if(!matchesMediaType(Buffer.concat(chunks).subarray(0,32),info.contentType))throw new HttpError(400,'Invalid audio file.');if(!text(b.title)||!text(b.license)||b.rightsConfirmed!==true)throw new HttpError(400,'Add a title, licence and confirm permission to use this music.');const row=await save('music-track',b.id,{...old,status:'ready',bytes:info.size,contentType:info.contentType,title:text(b.title),artist:text(b.artist),mood:text(b.mood),license:text(b.license),licenseUrl:link(b.licenseUrl),sourceUrl:link(b.sourceUrl),credit:text(b.credit,1000),rightsConfirmed:true},old.revision,'owner','music.uploaded');return respond(res,200,{track:publicTrack(row)});}
 if(action==='save'){if(!text(b.title))throw new HttpError(400,'A title is required.');const row=await save('music-track',b.id,{...old,title:text(b.title),mood:text(b.mood),archived:!!b.archived},b.revision,'owner','music.updated');return respond(res,200,{track:publicTrack(row)});}
 throw new HttpError(404,'Unknown music action.');
 }catch(e){fail(res,e);}}
