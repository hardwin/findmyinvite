/** @typedef {{loaded:number,total:number,percent:number|null,secondsRemaining:number|null}} DownloadProgress */
/** Authenticated, bounded parallel ranges with live byte progress and range-local retry.
 * @param {string} url
 * @param {{getToken:()=>Promise<string|undefined>,fetcher?:typeof fetch,onProgress?:(progress:DownloadProgress)=>void,chunkSize?:number,concurrency?:number}} options
 * @returns {Promise<Blob>}
 */
export async function downloadPrivateFile(url,{getToken,fetcher=globalThis.fetch,onProgress,chunkSize=3*1048576,concurrency=3}){
 const started=Date.now(),received=new Map(),controllers=new Set();let total=0,type='',lastEmit=0,highWater=0,failed=false;
 const report=(force=false)=>{const now=Date.now();if(!force&&now-lastEmit<100)return;lastEmit=now;
  highWater=Math.max(highWater,[...received.values()].reduce((a,b)=>a+b,0));const loaded=Math.min(highWater,total||highWater),elapsed=(now-started)/1000;
  onProgress?.({loaded,total,percent:total?Math.min(100,Math.floor(loaded/total*100)):null,secondsRemaining:total&&loaded&&elapsed>1?Math.ceil((total-loaded)/(loaded/elapsed)):null});
 };
 report(true);
 async function part(start,end){
  for(let attempt=0;attempt<2;attempt++){
   if(failed)throw Error('Download stopped');
   const controller=new AbortController();controllers.add(controller);const timer=setTimeout(()=>controller.abort(),90000);
   try{
    const token=await getToken(),response=await fetcher(url,{headers:{Authorization:'Bearer '+token,Range:`bytes=${start}-${end}`},cache:'no-store',signal:controller.signal});
    if(!response.ok){if([401,403,404,410].includes(response.status))throw Object.assign(Error('Your file is unavailable. Please sign in and try again.'),{final:true});throw Error('Download interrupted');}
    const match=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range')||'');
    const invalid=()=>Object.assign(Error('Your download was incomplete. Please try again.'),{final:true});
    if(match){const length=+match[3];if(response.status!==206||+match[1]!==start||+match[2]<start||+match[2]>end||+match[2]>=length||length>200*1048576||total&&total!==length)throw invalid();total=length;}
    else if(start||response.status!==200)throw invalid();
    else total=Number(response.headers.get('content-length'))||0;
    if(total>200*1048576)throw invalid();
    type=response.headers.get('content-type')||type;received.set(start,0);report(true);
    const chunks=[];let length=0;const reader=response.body?.getReader();if(!reader)throw invalid();
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>200*1048576||match&&length>+match[2]-start+1){await reader.cancel();throw invalid();}chunks.push(value);received.set(start,length);report();}
    if(match&&length!==+match[2]-start+1||!match&&total&&length!==total)throw Error('Download interrupted');
    if(!match)total=length;report(true);return {blob:new Blob(chunks,{type}),end:match?+match[2]:length-1,whole:!match};
   }catch(error){if(error.final)throw error;if(attempt===1||failed)throw Error('Your download was interrupted. Please try again.');await new Promise(resolve=>setTimeout(resolve,500));}
   finally{clearTimeout(timer);controllers.delete(controller);}
  }
  throw Error('Your download was interrupted. Please try again.');
 }
 try{
  const first=await part(0,chunkSize-1);if(first.whole)return first.blob;
  const chunks=[first.blob],tasks=[];for(let start=first.end+1;start<total;start+=chunkSize)tasks.push({start,end:Math.min(total-1,start+chunkSize-1)});
  let cursor=0;await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),3,tasks.length)},async()=>{while(cursor<tasks.length){const index=cursor++,task=tasks[index],r=await part(task.start,task.end);if(r.end!==task.end)throw Error('Your download was incomplete. Please try again.');chunks[index+1]=r.blob;}}));
  report(true);return new Blob(chunks,{type});
 }catch(error){failed=true;controllers.forEach(c=>c.abort());throw error;}
}
