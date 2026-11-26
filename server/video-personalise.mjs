import {bindMazhavillayeSoundtrack} from '../shared/mazhavillaye-soundtrack.mjs';
import {isVersionedVideo,videoMasterVersion} from '../shared/video-master-version.mjs';
import {prepareSceneMaster} from './video-scene-details.mjs';
import {videoMusicCatalog,videoDefaultMusic,pinVideoLibraryMusic} from './video-music.mjs';
import {videoRenderLease} from '../shared/video-render-limits.mjs';
import {readFile} from 'node:fs/promises';
import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {DEFAULT_VIDEO_ID,videoDefinition,MUSIC,normalizeVideoContent,assertMaster,RENDERER_VERSION} from '../shared/video-personalization.mjs';
import {videoStore,hash,VIDEO_TTL} from './video-personalise-store.mjs';
import {HttpError} from './core.mjs';
export async function loadVideoMaster(id=DEFAULT_VIDEO_ID,masterVersion){try{videoDefinition(id);}catch{throw new HttpError(404,'This video template is unavailable.');}return bindMazhavillayeSoundtrack(assertMaster(JSON.parse(await readFile(new URL('../public/assets/video-masters/'+id+(isVersionedVideo(id)&&masterVersion!==undefined?'/manifest-v'+videoMasterVersion(id,masterVersion)+'.json':'/manifest.json'),import.meta.url),'utf8'))));}
export async function videoConfig(env=process.env,id=DEFAULT_VIDEO_ID,catalog,masterVersion){const master=await loadVideoMaster(id,masterVersion),definition=videoDefinition(id,master.version);let ready=false;try{requireVideoRelease(master,env);ready=true;}catch{}const library=catalog||await videoMusicCatalog();return {master,...definition,defaults:{...definition.defaults,music:videoDefaultMusic(id,library,master.version)},music:MUSIC,musicTracks:library.tracks,ready,localUploads:env.VIDEO_LOCAL_STORE==='1'&&!env.VERCEL};}
export function requireVideoRelease(master,env){try{assertMaster(master,{released:true});}catch{throw new HttpError(503,'This video template is still being prepared.');}if(env.VIDEO_PERSONALISE_ENABLED!=='1')throw new HttpError(503,'This video template is still being prepared.');if(env.VERCEL&&(!(master.id==='film-anbil-avan-v1'?env.VIDEO_ANBIL_AVAN_SNAPSHOT_ID:master.id==='film-were-next-v1'?env.VIDEO_WERE_NEXT_SNAPSHOT_ID:master.id==='film-oonjal-v1'&&master.version===3?env.VIDEO_OONJAL_SNAPSHOT_ID:master.id==='temple-v1'&&master.version===3?env.VIDEO_TEMPLE_V3_SNAPSHOT_ID:master.id==='temple-v1'&&master.version===2?env.VIDEO_TEMPLE_SNAPSHOT_ID:master.rendererVersion==='tracked-film-v1'?env.VIDEO_TRACKED_SNAPSHOT_ID:master.rendererVersion==='scene-film-v1'?env.VIDEO_SCENE_SNAPSHOT_ID:env.VIDEO_RENDER_SNAPSHOT_ID)||!env.BLOB_READ_WRITE_TOKEN))throw new HttpError(503,'The private video renderer is not configured yet.');}
export function ownedRecord(record,owner,now=Date.now()){if(!record||record.owner!==owner)throw new HttpError(404,'File or render not found.');if(Date.parse(record.expiresAt)<=now)throw new HttpError(410,'This file has expired. Please upload or render it again.');return record;}
export function publicJob(job){return {id:job.id,status:job.status,progress:job.progress,error:job.error,expiresAt:job.expiresAt,contentRevision:job.contentRevision,download:job.status==='ready'?'/api/video-personalise?action=download&id='+job.id:undefined};}
export function renderDigest(owner,master,content,media){return hash({owner,master:hash(master),renderer:master.rendererVersion||RENDERER_VERSION,content,media:media.map(m=>({id:m.id,slot:m.slot,hash:m.mode==='cutout'?m.cutoutSha256:m.sha256,mode:m.mode,...(m.library?{credit:m.credit}:{} )})).sort((a,b)=>(a.slot||a.id).localeCompare(b.slot||b.id))});}
export function videoService({store=videoStore(),env=process.env,now=()=>Date.now(),launch,masterLoader=loadVideoMaster,libraryMusic=pinVideoLibraryMusic}={}){
 const read=async key=>(await store.read(key))?.value;
 async function media(owner,id){if(!/^[a-f0-9-]{36}$/.test(id||''))throw new HttpError(400,'Invalid media reference.');return ownedRecord(await read('media/'+id+'.json'),owner,now());}
 async function job(owner,id){if(!/^[a-f0-9]{64}$/.test(id||''))throw new HttpError(400,'Invalid render reference.');const j=ownedRecord(await read('jobs/'+id+'.json'),owner,now());return stale(j)?{...j,status:'failed',error:'The render was interrupted. Your details are saved; please retry.'}:j;}
 const stale=j=>['queued','running'].includes(j.status)&&now()-Date.parse(j.createdAt)>=videoRenderLease(j.master);
 async function start(owner,input,templateId=DEFAULT_VIDEO_ID,invitationId,masterVersion){
  let master=await masterLoader(templateId,masterVersion);requireVideoRelease(master,env);let content;try{content=normalizeVideoContent(input,{complete:true,templateId:master.id,masterVersion:master.version});}catch(e){throw new HttpError(400,e.message);}try{master=await prepareSceneMaster(master,content);}catch(e){throw new HttpError(400,e.message);}const refs=[];
  // Character-profile designs bind generated layers to one owner-scoped character set.
  const profile=videoDefinition(master.id,master.version).characterProfile;
  for(const [slot,p] of Object.entries(content.photos)){const m=await media(owner,p.id);if(m.kind!=='image'||m.status!=='ready'||p.mode==='cutout'&&!m.cutoutKey||p.mode==='prepared'&&((profile?m.characterProfile!==profile.id||m.characterMasterVersion!==master.version||!/^[a-f0-9-]{36}$/.test(m.characterSetId||''):!m.characterJobId)||m.characterSlot!==slot||m.invitationId!==invitationId))throw new HttpError(400,'Prepare and confirm the '+slot+' photo.');refs.push({...m,slot,mode:p.mode});}
  if(profile&&new Set(refs.map(r=>r.characterSetId)).size>1)throw new HttpError(409,'Use every character from one approved set.');
  if(content.music.mode==='library')refs.push(await libraryMusic(content.music.id,store));
  if(content.music.mode==='upload'){const m=await media(owner,content.music.id);if(m.kind!=='audio'||m.status!=='ready')throw new HttpError(400,'Music is not ready.');refs.push(m);}
  const id=renderDigest(owner,master,content,refs),existing=await read('jobs/'+id+'.json');
  if(existing&&Date.parse(existing.expiresAt)>now()&&!stale(existing)&&['ready','running','queued'].includes(existing.status))return publicJob(existing);
  const lockKey='locks/'+hash(owner)+'.json',lock=await store.read(lockKey);
  if(lock?.value.until>now())throw new HttpError(409,'Your previous video is still rendering.');
  const attempt=randomUUID();try{await store.save(lockKey,{jobId:id,attempt,until:now()+videoRenderLease(master)},lock?{etag:lock.etag}:{create:true});}catch{throw new HttpError(409,'A render is already starting.');}
  const secret=randomBytes(32).toString('hex');const record={id,owner,attempt,invitationId,templateId:master.id,master,masterHash:hash(master),content,contentRevision:hash(content),media:refs,secretHash:hash(secret),status:'queued',progress:0,createdAt:new Date(now()).toISOString(),expiresAt:new Date(now()+VIDEO_TTL).toISOString()};
  try{await store.save('jobs/'+id+'.json',record);if(!launch)throw Error('Video rendering is not configured.');await launch(record,secret);}catch(e){try{await finish(id,secret,{status:'failed'});}catch(cleanup){console.error('Video failed-state update:',cleanup.name);}throw e;}
  return publicJob(record);
 }
 async function finish(id,secret,patch){
  if(!/^[a-f0-9]{64}$/.test(id||''))throw new HttpError(400,'Invalid render reference.');const stored=await store.read('jobs/'+id+'.json');const j=stored?.value;
  if(!j||typeof secret!=='string'||!timingSafeEqual(Buffer.from(hash(secret)),Buffer.from(j.secretHash)))throw new HttpError(403,'Invalid render callback.');
  if(['ready','failed'].includes(j.status))return publicJob(j);
  if(!['running','ready','failed'].includes(patch.status))throw new HttpError(400,'Invalid render status.');
  const next={...j,status:patch.status,progress:patch.status==='ready'?100:Math.max(j.progress,Math.min(99,Math.max(0,Number(patch.progress)||0))),error:patch.status==='failed'?'The video could not be completed. Your details are saved; please retry.':undefined};
  if(patch.status==='failed'){
   if(patch.errorCode==='TEXT_FIT'){const field=({weddingVenueLine:'church',ceremonyAddressLine:'address',brideName:'bride'})[patch.errorField]||patch.errorField;const question=videoDefinition(j.templateId).form.steps.flatMap(s=>s.questions).find(q=>q.path===field);next.error=question?`The ${question.label.toLowerCase()} is too long for its board. Please shorten it and try again.`:'Some wording is too long for its board. Please shorten it and try again.';next.errorCode='TEXT_FIT';next.errorField=question?.path;}
   // Retain a bounded private diagnostic before the ephemeral worker is stopped.
   next.diagnostic=String(patch.diagnostic||'').replace(/https?:\/\/\S+/g,'[service URL]').replace(/[A-Za-z0-9_=-]{40,}/g,'[redacted]').slice(0,800);
  }
  if(patch.status==='ready'){const expected='results/'+j.owner+'/'+id+'/'+j.attempt+'.mp4';if(patch.resultKey!==expected||patch.frames!==j.master.output.frames||patch.width!==j.master.output.width||patch.height!==j.master.output.height||patch.backgroundSha256!==(j.master.assets.sceneBundle||j.master.assets.background).sha256||!/^[a-f0-9]{64}$/.test(patch.resultSha256||'')||!Number.isSafeInteger(patch.bytes)||patch.bytes<1||patch.bytes>200*1048576)throw new HttpError(400,'Render verification failed.');next.resultKey=expected;next.resultSha256=patch.resultSha256;next.bytes=patch.bytes;}
  await store.save('jobs/'+id+'.json',next,{etag:stored.etag});
  if(['ready','failed'].includes(next.status)){const k='locks/'+hash(j.owner)+'.json',l=await store.read(k);if(l?.value.attempt===j.attempt)await store.save(k,{...l.value,until:0},{etag:l.etag});}
  return publicJob(next);
 }
 return {media,job,start,finish};
}
