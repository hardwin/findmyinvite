// Repo-backed tap-music library for Template 1. Files live under public/assets; no database.
import {access,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError} from './core.mjs';
import {ROOT} from './assembly.mjs';

const SAFE_ID=/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const SAFE_FILE=/^[a-zA-Z0-9_-]+\.mp3$/;

export async function listMusicLibrary(root=ROOT){
 const raw=await readFile(join(root,'cms','music-library.json'),'utf8');
 const list=JSON.parse(raw);
 if(!Array.isArray(list))throw new HttpError(500,'music-library.json must be an array.');
 return list
  .filter(item=>item&&SAFE_ID.test(String(item.id||''))&&SAFE_FILE.test(String(item.file||''))&&item.active!==false)
  .map(item=>({
   id:String(item.id),
   displayName:String(item.displayName||item.id).trim().slice(0,80),
   file:String(item.file),
   url:'/assets/'+String(item.file),
   durationS:Number(item.durationS)||0,
   source:String(item.source||'library')
  }));
}

export async function getMusicTrack(id,root=ROOT){
 const track=(await listMusicLibrary(root)).find(item=>item.id===String(id||''));
 if(!track)throw new HttpError(400,'Pick a track from the music library.');
 const path=join(root,'public','assets',track.file);
 try{await access(path);}catch{throw new HttpError(500,'Library track file is missing: public/assets/'+track.file);}
 return {...track,path};
}
