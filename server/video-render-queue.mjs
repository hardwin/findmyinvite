// Return the persisted job immediately; cloud cold-start continues within the
// function lifetime. A failed launch must settle that same job and owner lease.
export function queueVideoRender(job,secret,{launch,finish,waitUntil}){
 waitUntil(Promise.resolve().then(()=>launch(job,secret)).catch(async error=>{
  console.error('Video worker startup failed:',error.name);
  await finish(job.id,secret,{status:'failed'});
 }));
}
