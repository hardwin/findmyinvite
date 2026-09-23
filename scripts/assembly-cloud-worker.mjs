#!/usr/bin/env node
// Runs inside a Vercel Sandbox. Reuses Template 1, then pushes assembly/{id} only.
import {startTemplate1Job,getTemplate1Job,cancelTemplate1Job,proceedTemplate1Job} from '../server/assembly-template1.mjs';
import {attachLineage} from '../server/assembly-cloud.mjs';
import {spawn} from 'node:child_process';

const env=process.env;
const jobId=String(env.ASSEMBLY_JOB_ID||'');
const secret=String(env.ASSEMBLY_CALLBACK_SECRET||'');
const callback=String(env.ASSEMBLY_CALLBACK_URL||'').replace(/\/$/,'');
if(!jobId||!secret||!callback){
 console.error('ASSEMBLY_JOB_ID, ASSEMBLY_CALLBACK_SECRET, ASSEMBLY_CALLBACK_URL required.');
 process.exit(1);
}

let input;
try{input=JSON.parse(env.ASSEMBLY_INPUT||'{}');}
catch{
 console.error('ASSEMBLY_INPUT is not JSON.');
 process.exit(1);
}

function run(cmd,args,opts={}){
 return new Promise((ok,fail)=>{
  const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],windowsHide:true,...opts});
  let stdout='',stderr='';
  child.stdout.on('data',d=>{stdout+=d;});
  child.stderr.on('data',d=>{stderr+=d;});
  child.on('error',fail);
  child.on('close',code=>code===0?ok({stdout,stderr}):fail(new Error((stderr||stdout||cmd+' failed').slice(0,800))));
 });
}

async function report(patch){
 const res=await fetch(callback+'?action=template1-progress',{
  method:'POST',
  headers:{
   'Content-Type':'application/json',
   'X-Assembly-Job-Id':jobId,
   'X-Assembly-Job-Secret':secret
  },
  body:JSON.stringify(patch)
 });
 if(!res.ok)console.error('progress callback',res.status,await res.text().catch(()=>''));
}

async function sync(){
 const res=await fetch(callback+'?action=template1-sync',{
  headers:{
   'X-Assembly-Job-Id':jobId,
   'X-Assembly-Job-Secret':secret
  }
 });
 if(!res.ok)return {cancelRequested:false};
 return res.json();
}

async function pushBranch(cloneId,written){
 const lineage=attachLineage(cloneId,env);
 const token=env.ASSEMBLY_GITHUB_TOKEN;
 const repo=env.ASSEMBLY_GITHUB_REPO||'hardwin/findmyinvite';
 if(!token)throw new Error('ASSEMBLY_GITHUB_TOKEN missing inside sandbox.');
 await run('git',['config','user.email','akay-assembly@findmyinvite.com']);
 await run('git',['config','user.name','Akay Assembly']);
 await run('git',['checkout','-B',lineage.branch]);
 const files=(written||[]).filter(path=>path&&!path.startsWith('work/')&&!path.includes('.env'));
 if(files.length)await run('git',['add','--',...files]);
 await run('git',['status','--short']);
 try{
  await run('git',['commit','-m','Assemble '+cloneId+' (Template 1 cloud preview)']);
 }catch(error){
  if(!/nothing to commit/.test(String(error.message||error)))throw error;
 }
 const remote='https://x-access-token:'+token+'@github.com/'+repo+'.git';
 await run('git',['push','-u',remote,lineage.branch]);
 return lineage;
}

const workerEnv={...env,ASSEMBLY_FS:'1'};
delete workerEnv.VERCEL;
const started=startTemplate1Job(input,{env:workerEnv,run:true,onUpdate:job=>{
 void report({
  status:job.status==='review'?'running':job.status,
  phase:job.phase==='review'?'gen':job.phase,
  percent:job.percent,
  label:job.label,
  detail:job.detail,
  spend:job.spend,
  palette:job.palette,
  cloneId:job.cloneId,
  demo:job.demo,
  written:job.written,
  moderationStop:job.moderationStop,
  error:job.error
 });
}});

const cancelTimer=setInterval(()=>{
 void (async()=>{
  const state=await sync();
  if(state.cancelRequested){
   try{cancelTemplate1Job(started.jobId);}catch{/* already stopped */}
  }
 });
},4000);

while(true){
 const job=getTemplate1Job(started.jobId);
 if(job.status==='review'){
  try{
   await proceedTemplate1Job(started.jobId,{env:workerEnv});
   await report({status:'running',phase:'gen',percent:40,label:'Stills approved — generating videos…',detail:'Cloud auto-continue past stills review'});
  }catch(error){
   const message=error instanceof Error?error.message:'Could not continue past stills.';
   await report({status:'failed',phase:'failed',error:message,detail:message});
   clearInterval(cancelTimer);
   process.exit(2);
  }
  await new Promise(r=>setTimeout(r,2000));
  continue;
 }
 if(job.status!=='running'){
  clearInterval(cancelTimer);
  if(job.status==='preview'&&job.cloneId){
   try{
    const lineage=await pushBranch(job.cloneId,job.written);
    await report({
     status:'preview',
     phase:'preview',
     percent:100,
     label:'Preview ready — say notes / regen / Publish',
     detail:'Clone '+job.cloneId+' on '+lineage.branch,
     cloneId:job.cloneId,
     demo:lineage.demo,
     branch:lineage.branch,
     githubUrl:lineage.githubUrl,
     previewUrl:lineage.previewUrl,
     written:job.written,
     spend:job.spend,
     palette:job.palette,
     error:null
    });
    process.exit(0);
   }catch(error){
    const message=error instanceof Error?error.message:'git push failed';
    await report({status:'failed',phase:'failed',error:message,detail:message});
    process.exit(2);
   }
  }
  await report({
   status:job.status,
   phase:job.phase,
   percent:job.percent,
   label:job.label,
   detail:job.detail,
   spend:job.spend,
   moderationStop:job.moderationStop,
   error:job.error
  });
  process.exit(job.status==='preview'?0:2);
 }
 await new Promise(r=>setTimeout(r,2000));
}
