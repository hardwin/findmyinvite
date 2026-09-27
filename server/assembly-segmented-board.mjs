import {put} from '@vercel/blob';
import ffmpegPath from 'ffmpeg-static';
import {run} from './assembly-template1-craft.mjs';
import {randomUUID} from 'node:crypto';
import {resolveReferenceImage,normalizeReferenceImage,resolveReplicateImageUrl,blobImageProxyUrl} from './assembly-ai.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';
import {STILL_MODEL} from './assembly-template1-prompts.mjs';
import {digest,readPrivate,SEGMENTED_VERSION} from './assembly-story-session.mjs';
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export async function storeEndpoint(url,{env=process.env,fetchImpl=fetch,source='generated'}={}){
 const image=normalizeReferenceImage(await resolveReferenceImage(url,{fetchImpl}));
 const sha256=digest(image.buffer);
 const blob=await put('assembly-endpoints/'+randomUUID()+'.jpg',image.buffer,{access:'private',contentType:image.contentType,token:env.BLOB_READ_WRITE_TOKEN});
 return {id:randomUUID(),blobUrl:blob.url,url:blobImageProxyUrl(blob.url,env.SITE_ORIGIN||'https://findmyinvite.com'),sha256,contentType:image.contentType,source,revision:randomUUID()};
}
export function isSingleStillScene(scene){
 return Boolean(scene?.first&&scene?.last&&scene.first.sha256&&scene.first.sha256===scene.last.sha256);
}
export async function renderBoardSheet(board,env=process.env){
 // Compose the actual endpoint bytes. No model is allowed to redraw this sheet.
 const rows=[];
 let y=80;
 for(let i=0;i<board.scenes.length;i++){
  const scene=board.scenes[i];
  const single=i>0||isSingleStillScene(scene);
  const assets=single?[scene.first||scene.last]:[scene.first,scene.last];
  const thumbs=[];
  for(const asset of assets){
   const {stdout}=await run(ffmpegPath||'ffmpeg',['-v','error','-i','pipe:0','-vf','scale=300:534:force_original_aspect_ratio=decrease,pad=300:534:(ow-iw)/2:(oh-ih)/2','-frames:v','1','-f','image2pipe','-vcodec','mjpeg','-q:v','4','pipe:1'],{input:await readPrivate(asset.blobUrl,env)});
   thumbs.push('data:image/jpeg;base64,'+stdout.toString('base64'));
  }
  const label=single
   ?`Scene ${i+1} · ${i*3}–${(i+1)*3}s · Bullet-time still`
   :`Scene ${i+1} · ${i*3}–${(i+1)*3}s · Start → End`;
  const images=single
   ?`<image x="180" y="${y+45}" width="300" height="534" href="${thumbs[0]}"/>`
   :`<image x="20" y="${y+45}" width="300" height="534" href="${thumbs[0]}"/><image x="340" y="${y+45}" width="300" height="534" href="${thumbs[1]}"/>`;
  rows.push(`<text x="20" y="${y+25}" font-size="22">${escape(label)}</text>${images}<text x="20" y="${y+610}" font-size="16">${escape(scene.titleText||'No text')}</text>`);
  y+=635;
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="660" height="${y+40}" viewBox="0 0 660 ${y+40}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#171717"><text x="20" y="40" font-size="26">${escape(String(board.title||'').slice(0,100))}</text>${rows.join('')}</g></svg>`;
 const blob=await put('assembly-storyboards/'+randomUUID()+'.svg',svg,{access:'private',contentType:'image/svg+xml',token:env.BLOB_READ_WRITE_TOKEN});
 return blobImageProxyUrl(blob.url,env.SITE_ORIGIN||'https://findmyinvite.com');
}
export function buildEndpointPrompt(board,index,side){
 const scene=board.scenes[index];
 const brief=side==='first'?scene.firstBrief:scene.lastBrief;
 // Scenes 2–5: one editorial still with floating elements already in-frame for bullet-time.
 if(index>=1){
  const people=index===1
   ?'Macro accessory/embroidery/ring or fabric detail only; no full faces required. Match the couple reference materials when relevant.'
   :'Preserve the supplied couple reference: ONE bride and ONE groom with clear recognizable faces, neat editorial high-budget photoshoot poses, individual gender, outfit, shoes and anatomy; no extra person. NO walking.';
  return [
   'Render ONE standalone vertical 9:16 editorial still, no sheet/borders/labels.',
   'Exact approved scene: '+brief+'.',
   board.continuity||'',
   people,
   'MANDATORY: fill the air with highly detailed floating/airborne elements already frozen mid-air in this still (petals, foil scraps, blossoms, fabric wisps, sparkles, dust motes, pin-true motifs). Bullet-time video will orbit this frame — particles must be visible now.',
   'Big-budget editorial quality, crisp focus, dramatic rim light catching airborne elements, pin medium retained.',
   'Text: '+(scene.titleText||'NONE')+'. Exact spelling, no extra letters. No costume transformations.'
  ].filter(Boolean).join(' ');
 }
 const people='This endpoint contains no people, human body parts, shadows or reflections. No humans or hands.';
 const camera=side==='first'
  ?'Fully closed reveal at 0s; sealed/opaque, no gap.'
  :'Opened reveal state after automatic open; names readable; continuous from the closed Start — not a reverse close.';
 return `Render ONE standalone vertical 9:16 endpoint, no sheet/borders/labels. Exact approved scene: ${brief}. ${board.continuity}. ${people} ${camera} Text: ${side==='first'?'NONE; fully closed reveal at 0s':scene.titleText||'NONE'}. Exact spelling, no extra letters. Retain pin medium and theme. No costume transformations.`;
}
export async function paintEndpoints(board,{env=process.env,fetchImpl=fetch,imageRunner=runReplicateImage,save,identity,previous}={}){
 const persist=save;let saveQueue=Promise.resolve();
 save=b=>(saveQueue=saveQueue.then(()=>persist(b)));
 board.version=SEGMENTED_VERSION;
 board.scenes=board.scenes||[];
 const referenceCache=new Map();
 const providerReference=url=>{
  if(!referenceCache.has(url))referenceCache.set(url,(async()=>{
   const image=normalizeReferenceImage(await resolveReferenceImage(url,{fetchImpl}));
   return resolveReplicateImageUrl(image,{env,fetchImpl});
  })());
  return referenceCache.get(url);
 };
 const paintOnce=async(index,side,reference)=>{
  const scene=board.scenes[index];
  const prompt=buildEndpointPrompt(board,index,side);
  const result=await imageRunner({prompt,image:await providerReference(reference),model:STILL_MODEL,role:'storyboard-endpoint',env,fetchImpl});
  scene[side]=await storeEndpoint(result.url,{env,fetchImpl,source:'scene-'+(index+1)+'-'+side});
  await save(board);
 };
 // Scene 5 still is the shared identity master (or Face Swap asset).
 if(identity){
  board.scenes[4].first=identity;
  board.scenes[4].last=identity;
 }else{
  await paintOnce(4,'first',board.pinUrl);
  board.scenes[4].last=board.scenes[4].first;
  await save(board);
 }
 const master=board.scenes[4].first.url;
 // Scene 1: closed Start + opened End.
 await paintOnce(0,'first',board.pinUrl);
 await paintOnce(0,'last',board.scenes[0].first.url);
 // Scenes 2–4: one still each, duplicate as last for manifest compatibility.
 const tasks=[1,2,3].map(i=>async()=>{
  if(board.scenes[i].first){board.scenes[i].last=board.scenes[i].first;return;}
  await paintOnce(i,'first',master);
  board.scenes[i].last=board.scenes[i].first;
  await save(board);
 });
 let cursor=0,failed=false;
 const worker=async()=>{while(!failed){const task=tasks[cursor++];if(!task)return;try{await task();}catch(error){failed=true;throw error;}}};
 const results=await Promise.allSettled([worker(),worker()]);
 const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
 board.sheetUrl=await renderBoardSheet(board,env);
 board.firstImageUrl=board.scenes[0].first.url;
 board.lastImageUrl=board.scenes[4].first.url;
 board.firstBrief=board.scenes[0].firstBrief;
 board.lastBrief=board.scenes[4].firstBrief||board.scenes[4].lastBrief;
 board.middleBeats=board.scenes.slice(1,4).map(s=>s.scene);
 board.shots=board.scenes.map((s,i)=>({...s,start:i*3,end:(i+1)*3,movement:s.prompt}));
 board.locked=false;board.revisionPending=false;
 await save(board);
 return board;
}
