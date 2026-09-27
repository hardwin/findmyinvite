import {put} from '@vercel/blob';
import ffmpegPath from 'ffmpeg-static';
import {run} from './assembly-template1-craft.mjs';
import {randomUUID} from 'node:crypto';
import {resolveReferenceImage,normalizeReferenceImage,blobImageProxyUrl} from './assembly-ai.mjs';
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
export async function renderBoardSheet(board,env=process.env){
 // Compose the actual endpoint bytes. No model is allowed to redraw this sheet.
 const images=[];
 for(const asset of board.scenes.flatMap(scene=>[scene.first,scene.last])){
  const {stdout}=await run(ffmpegPath||'ffmpeg',['-v','error','-i','pipe:0','-vf','scale=300:534:force_original_aspect_ratio=decrease,pad=300:534:(ow-iw)/2:(oh-ih)/2','-frames:v','1','-f','image2pipe','-vcodec','mjpeg','-q:v','4','pipe:1'],{input:await readPrivate(asset.blobUrl,env)});
  images.push('data:image/jpeg;base64,'+stdout.toString('base64'));
 }
 const rows=board.scenes.map((scene,i)=>{const y=80+i*635;return `<text x="20" y="${y+25}" font-size="22">Scene ${i+1} · ${i*3}–${(i+1)*3}s · Start → End</text><image x="20" y="${y+45}" width="300" height="534" href="${images[i*2]}"/><image x="340" y="${y+45}" width="300" height="534" href="${images[i*2+1]}"/><text x="20" y="${y+610}" font-size="16">${escape(scene.titleText||'No text')}</text>`;}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="660" height="3280" viewBox="0 0 660 3280"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#171717"><text x="20" y="40" font-size="26">${escape(String(board.title||'').slice(0,100))}</text>${rows}</g></svg>`;
 const blob=await put('assembly-storyboards/'+randomUUID()+'.svg',svg,{access:'private',contentType:'image/svg+xml',token:env.BLOB_READ_WRITE_TOKEN});
 return blobImageProxyUrl(blob.url,env.SITE_ORIGIN||'https://findmyinvite.com');
}
export async function paintEndpoints(board,{env=process.env,fetchImpl=fetch,imageRunner=runReplicateImage,save,identity,previous}={}){
 const persist=save;let saveQueue=Promise.resolve();
 save=b=>(saveQueue=saveQueue.then(()=>persist(b)));
 board.version=SEGMENTED_VERSION;
 board.scenes=board.scenes||[];
 const make=async(index,side,reference)=>{
  const scene=board.scenes[index];
  if(scene[side])return;
  const brief=side==='first'?scene.firstBrief:scene.lastBrief;
  const prompt=`Render ONE standalone vertical 9:16 endpoint, no sheet/borders/labels. Exact approved scene: ${brief}. ${board.continuity}. ${index===0?'This endpoint contains no people, human body parts, shadows or reflections.':index===1?'Match the reference accessory and clothing detail only; no full person in this macro.':'Preserve the supplied couple reference: ONE bride and ONE groom, their individual gender, outfit, shoes and anatomy; no extra person.'} ${index===0?'No humans or hands.':index===1?'Macro detail already physically present, no faces or loose floating garment.':index<4?'Wide 90-degree overhead, crowns only, no faces; fixed side-by-side stance.':'Gentle hero framing, natural stable pose, preserve reference identities.'} Text: ${index===0&&side==='first'?'NONE; fully closed reveal at 0s':scene.titleText||'NONE'}. Exact spelling, no extra letters. Retain pin medium and theme. No new objects or costume transformations.`;
  const result=await imageRunner({prompt,image:reference,model:STILL_MODEL,role:'storyboard-endpoint',env,fetchImpl});
  scene[side]=await storeEndpoint(result.url,{env,fetchImpl,source:'scene-'+(index+1)+'-'+side});
  await save(board);
 };
 // Final hero is the shared identity source. On face swap it is copied, never repainted.
 if(identity)board.scenes[4].last=identity;
 await make(4,'last',board.pinUrl);
 const master=board.scenes[4].last.url;
 await make(0,'first',board.pinUrl);
 const tasks=[];
 for(let i=0;i<5;i++)tasks.push(async()=>{await make(i,'first',i===0?board.pinUrl:master);await make(i,'last',board.scenes[i].first.url);});
 let cursor=0,failed=false;
 const worker=async()=>{while(!failed){const task=tasks[cursor++];if(!task)return;try{await task();}catch(error){failed=true;throw error;}}};
 const results=await Promise.allSettled([worker(),worker()]);
 const failure=results.find(r=>r.status==='rejected');if(failure)throw failure.reason;
 board.sheetUrl=await renderBoardSheet(board,env);
 board.firstImageUrl=board.scenes[0].first.url;
 board.lastImageUrl=board.scenes[4].last.url;
 board.firstBrief=board.scenes[0].firstBrief;
 board.lastBrief=board.scenes[4].lastBrief;
 board.middleBeats=board.scenes.slice(1,4).map(s=>s.scene);
 board.shots=board.scenes.map((s,i)=>({...s,start:i*3,end:(i+1)*3,movement:s.prompt}));
 board.locked=false;board.revisionPending=false;
 await save(board);
 return board;
}
