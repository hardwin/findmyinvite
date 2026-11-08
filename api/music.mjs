import {get} from '@vercel/blob';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {musicTrack,musicTracks,publicTrack} from '../server/website-music.mjs';
import {mediaRange} from '../server/template-media-range.mjs';
import {method,respond,fail,HttpError} from '../server/core.mjs';
export default async function handler(req,res){try{
 method(req,['GET','HEAD']);const q=new URL(req.url,'https://findmyinvite.com').searchParams,id=q.get('id');
 if(!id)return respond(res,200,{tracks:(await musicTracks()).filter(t=>t.status==='ready'&&!t.archived).map(publicTrack)});
 const track=await musicTrack(id);if(track?.status!=='ready')throw new HttpError(404,'Track unavailable.');
 if(q.get('info')==='1')return respond(res,200,{track:publicTrack(track)});
 // Archiving hides a selection; existing invitations retain their licensed music.
 if(track.asset){res.statusCode=307;res.setHeader('Location',track.asset);return res.end();}
 let range;try{range=mediaRange(String(req.headers.range||''),track.bytes);}catch{res.setHeader('Content-Range','bytes */'+track.bytes);throw new HttpError(416,'Unsupported byte range.');}
 res.setHeader('Content-Type',track.contentType);res.setHeader('Accept-Ranges','bytes');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public,max-age=3600');res.setHeader('Content-Length',range?range.end-range.start+1:track.bytes);
 if(range){res.statusCode=206;res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${track.bytes}`);}if(req.method==='HEAD')return res.end();
 const blob=await get(track.objectPath,{access:'private',headers:range?{Range:`bytes=${range.start}-${range.end}`}:undefined});if(!blob?.stream)throw new HttpError(503,'Music temporarily unavailable.');if(range&&blob.headers.get('content-range')!==`bytes ${range.start}-${range.end}/${track.bytes}`){await blob.stream.cancel();throw new HttpError(503,'Music range unavailable.');}await pipeline(Readable.fromWeb(blob.stream),res);
 }catch(e){if(res.headersSent)res.destroy();else {res.removeHeader('Content-Length');res.removeHeader('Content-Type');res.removeHeader('Cache-Control');fail(res,e);}}}
