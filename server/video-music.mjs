import {get as getBlob} from '@vercel/blob';
import {readFile} from 'node:fs/promises';
import {musicTrack,musicTracks,publicTrack} from './website-music.mjs';
import {list} from './owner/store.mjs';
import {canonicalMusicId} from '../shared/music-selection.mjs';
import {hash} from './video-personalise-store.mjs';
import {HttpError} from './core.mjs';

export async function videoMusicCatalog(){
 const [tracks,assignments]=await Promise.all([musicTracks(),list('music-assignment')]);
 return {tracks:tracks.filter(t=>t.status==='ready'&&!t.archived).map(publicTrack),assignments};
}

export function videoDefaultMusic(id,catalog){
 const assignment=catalog.assignments.find(a=>a.id===id);
 const track=catalog.tracks.find(t=>t.id===assignment?.trackId);
 return track?{mode:'library',id:track.id}:{mode:'none'};
}

// Resolve through the approved library, never a URL/path submitted by the customer.
// A content-addressed copy pins the exact recording for the private render worker.
export async function pinVideoLibraryMusic(id,store,{lookup=musicTrack,readAsset=readFile,blob=getBlob}={}){
 const track=await lookup(canonicalMusicId(id));
 if(track?.status!=='ready')throw new HttpError(400,'Choose an available music track.');
 let bytes;
 if(track.asset){
  if(!/^\/assets\/music-library\/[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(mp3|m4a|ogg)$/.test(track.asset)||track.asset.includes('..'))throw new HttpError(400,'Music is unavailable.');
  bytes=await readAsset(new URL('../public'+track.asset,import.meta.url));
 }else{
  if(!/^website-music\/[a-f0-9-]{36}$/.test(track.objectPath||''))throw new HttpError(400,'Music is unavailable.');
  const result=await blob(track.objectPath,{access:'private'});
  if(!result?.stream)throw new HttpError(503,'Music is temporarily unavailable.');
  // Bound the read even when storage metadata is incorrect.
  const chunks=[];let size=0;
  for await(const chunk of result.stream){size+=chunk.length;if(size>20*1048576)throw new HttpError(400,'Music file exceeds the limit.');chunks.push(chunk);}
  bytes=Buffer.concat(chunks);
 }
 if(bytes.length<12||bytes.length>20*1048576)throw new HttpError(400,'Music file is unavailable.');
 const sha256=hash(bytes),key='library/'+track.id+'/'+sha256+'.audio';
 try{await store.putBytes(key,bytes,track.contentType||'application/octet-stream');}
 catch(error){const existing=await store.bytes(key).catch(()=>null);if(!existing||hash(existing)!==sha256)throw error;}
 return {id:'library-'+track.id,kind:'audio',key,sha256,bytes:bytes.length,library:true,trackId:track.id,credit:[track.credit,'Trimmed and faded for this invitation.',track.licenseUrl].filter(Boolean).join(' ')};
}
