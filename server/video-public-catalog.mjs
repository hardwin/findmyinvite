import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {PUBLIC_VIDEO_IDS} from '../shared/video-visibility.mjs';
import previewMedia from '../shared/catalog-preview-media.mjs';
import {catalogPreviewPlayback} from '../shared/catalog-preview-playback.mjs';
import {withCatalogIdentity} from './catalog-identity.mjs';
import {videoMusicCatalog} from './video-music.mjs';
import {videoConfig} from './video-personalise.mjs';
import {videoPrice} from './video-payments.mjs';

// Details/share pages and the storefront must resolve the same deployed catalog,
// including a newly staged design that has not reached the production alias yet.
export async function videoPublicCatalog({includeHidden=false,env=process.env,musicLoader=videoMusicCatalog,configLoader=videoConfig,identify=withCatalogIdentity}={}){
 const ids=includeHidden?['wedding-bells-v1','temple-v1','kerala-christian-v1',...VIDEO_CATALOG.map(d=>d.id)]:PUBLIC_VIDEO_IDS;
 let musicUnavailable=false;
 const catalog=await musicLoader().catch(()=>{musicUnavailable=true;return {tracks:[],assignments:[]};});
 const results=await Promise.allSettled(ids.map(async id=>{
  const c=await configLoader(env,id,catalog);if(!c.ready)return null;
  const music=c.defaults.music.mode==='library'?c.musicTracks.find(t=>t.id===c.defaults.music.id):null,base='/assets/video-masters/'+id+'/';
  const preview=previewMedia.videos[id]?.preview||base+(c.master.catalog?.preview||'catalog-preview-v2.mp4');
  return {id,name:c.name,music,duration:c.master.output.duration,poster:base+(c.master.catalog?.poster||'poster.jpg'),preview,...(c.master.catalog?.posters?{posters:Object.fromEntries(Object.entries(c.master.catalog.posters).map(([w,file])=>[w,base+file]))}:{}),...previewMedia.videos[id],...catalogPreviewPlayback(id,preview,music),...videoPrice(env,id)};
 }));
 const templates=results.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);
 return {templates:await identify(templates,'video'),musicUnavailable};
}
