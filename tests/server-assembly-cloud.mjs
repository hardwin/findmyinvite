import test from 'node:test';
import assert from 'node:assert/strict';
import {
 sandboxLaunchError,
 applyWorkerPatch,
 attachLineage,
 cloudAssemblyEnabled,
 cloudMissing,
 flushCloudLaunches,
 reportCloudProgress,
 startCloudTemplate1Job,
 retryCloudTemplate1Job,
 syncCloudJob,
 workerBootCommand
} from '../server/assembly-cloud.mjs';
import {
 assemblyBranchName,
 githubCompareUrl,
 hashSecret,
 secretsMatch,
 vercelPreviewUrl
} from '../server/assembly-jobs.mjs';
import handler from '../api/assembly.mjs';
import {issueSession} from '../server/akay-gate.mjs';

function cookie(){return 'fmi_akay='+issueSession();}

function mockRes(){
 const res={statusCode:200,headers:{},body:null};
 res.status=code=>{res.statusCode=code;return res;};
 res.setHeader=(k,v)=>{res.headers[k]=v;};
 res.json=value=>{res.body=value;return res;};
 return res;
}

async function request(url,opts={}){
 const req={
  method:opts.method||'GET',
  url,
  headers:{cookie:opts.cookie===undefined?cookie():opts.cookie,...(opts.headers||{})},
  body:opts.body
 };
 const res=mockRes();
 await handler(req,res);
 return res;
}

function memoryStore(){
 const rows=new Map();
 const fetchImpl=async(url,opts={})=>{
  const u=new URL(url);
  const method=(opts.method||'GET').toUpperCase();
  const body=opts.body?JSON.parse(opts.body):null;
  if(method==='POST'){
   rows.set(body.id,body);
   return {ok:true,status:201,text:async()=>JSON.stringify([body])};
  }
  const idParam=String(u.searchParams.get('id')||'').replace(/^eq\./,'');
  if(method==='PATCH'){
   const current=rows.get(idParam);
   if(!current)return {ok:false,status:404,text:async()=>''};
   Object.assign(current,body);
   rows.set(idParam,current);
   return {ok:true,status:200,text:async()=>JSON.stringify([current])};
  }
  if(idParam){
   const row=rows.get(idParam);
   return {ok:true,status:200,text:async()=>JSON.stringify(row?[row]:[])};
  }
  return {ok:true,status:200,text:async()=>JSON.stringify([...rows.values()])};
 };
 return {rows,fetchImpl};
}

const cloudEnv={
 ASSEMBLY_CLOUD:'1',
 XAI_API_KEY:'x',
 REPLICATE_API_TOKEN:'r',
 OPENAI_API_KEY:'o',
 ASSEMBLY_GITHUB_TOKEN:'g',
 SUPABASE_URL:'https://qqvcptjkfcjkwbkookcm.supabase.co',
 SUPABASE_SERVICE_ROLE_KEY:'service',
 VERCEL_TOKEN:'t',
 VERCEL_TEAM_ID:'team',
 VERCEL_PROJECT_ID:'proj'
};

test('cloud assembly is off until every required key is present',()=>{
 assert.equal(cloudAssemblyEnabled({}),false);
 assert.ok(cloudMissing({}).includes('ASSEMBLY_CLOUD=1'));
 assert.equal(cloudAssemblyEnabled(cloudEnv),true);
 assert.deepEqual(cloudMissing(cloudEnv),[]);
});

test('GitHub lineage names stay on assembly/{cloneId}',()=>{
 assert.equal(assemblyBranchName('royal-heritage-13'),'assembly/royal-heritage-13');
 assert.equal(githubCompareUrl('royal-heritage-13'),'https://github.com/hardwin/findmyinvite/compare/main...assembly/royal-heritage-13');
 assert.equal(vercelPreviewUrl('royal-heritage-13',{}),'https://findmyinvite-git-assembly-royal-heritage-13-hardwins-projects.vercel.app');
 const lineage=attachLineage('royal-heritage-13',{});
 assert.equal(lineage.branch,'assembly/royal-heritage-13');
 assert.match(lineage.previewUrl,/assembly-royal-heritage-13/);
 assert.equal(lineage.demo,'/invite/demo?template=royal-heritage-13');
 assert.throws(()=>assemblyBranchName('../etc'),/Invalid clone/);
});

test('worker boot installs ffmpeg then detaches the Template 1 worker',()=>{
 const cmd=workerBootCommand();
 assert.match(cmd,/ffmpeg-static/);
 assert.match(cmd,/ffprobe-static/);
 assert.match(cmd,/npm ci --omit=dev/);
 assert.match(cmd,/assembly-cloud-worker/);
 assert.match(cmd,/nohup/);
 assert.match(cmd,/heartbeat/);
 assert.match(cmd,/Worker alive/);
});

test('callback secret is hashed and worker patches stay narrow',()=>{
 const secret='abc123secret';
 const hashed=hashSecret(secret);
 assert.equal(secretsMatch(secret,hashed),true);
 assert.equal(secretsMatch('nope',hashed),false);
 const patch=applyWorkerPatch({status:'preview',phase:'preview',percent:200,label:'x'.repeat(400),cloneId:'royal-heritage-13',evil:true});
 assert.equal(patch.percent,100);
 assert.equal(patch.label.length,200);
 assert.equal(patch.cloneId,'royal-heritage-13');
 assert.equal(patch.evil,undefined);
});

test('startCloudTemplate1Job inserts a row then launches the sandbox',async()=>{
 const {rows,fetchImpl}=memoryStore();
 const launched=[];
 const started=await startCloudTemplate1Job({
  pinUrl:'https://pin.it/330nC70it',
  displayName:'Cloud Prove',
  musicId:'vazhithunaiye'
 },{
  env:cloudEnv,
  fetchImpl,
  launchImpl:async({jobId,secret,input})=>{
   launched.push({jobId,secret:Boolean(secret),input});
   return 'sbx_test';
  }
 });
 await flushCloudLaunches();
 assert.equal(typeof started.jobId,'string');
 assert.equal(launched[0].jobId,started.jobId);
 assert.equal(launched[0].input.displayName,'Cloud Prove');
 const row=rows.get(started.jobId);
 assert.equal(row.sandbox_id,'sbx_test');
 assert.equal(row.status,'running');
});

test('retryCloudTemplate1Job reuses jobId and relaunches from saved input',async()=>{
 const {rows,fetchImpl}=memoryStore();
 const started=await startCloudTemplate1Job({
  pinUrl:'https://pin.it/330nC70it',
  displayName:'Melliname',
  musicId:'vazhithunaiye'
 },{env:cloudEnv,fetchImpl,launchImpl:async()=>'sbx_old'});
 await flushCloudLaunches();
 const jobId=started.jobId;
 rows.get(jobId).status='failed';
 rows.get(jobId).error='429 You have no credits remaining.';
 rows.get(jobId).phase='failed';
 rows.get(jobId).percent=0;
 const launched=[];
 const retried=await retryCloudTemplate1Job(jobId,{
  env:cloudEnv,
  fetchImpl,
  launchImpl:async({jobId:id,secret,input})=>{
   launched.push({jobId:id,secret:Boolean(secret),displayName:input.displayName});
   return 'sbx_retry';
  }
 });
 await flushCloudLaunches();
 assert.equal(retried.jobId,jobId);
 assert.equal(retried.retried,true);
 assert.equal(launched[0].jobId,jobId);
 assert.equal(launched[0].displayName,'Melliname');
 assert.equal(launched[0].secret,true);
 const row=rows.get(jobId);
 assert.equal(row.status,'running');
 assert.equal(row.sandbox_id,'sbx_retry');
 assert.equal(row.error,null);
 assert.equal(row.percent,0);
});

test('progress and sync require the job secret',async()=>{
 const {fetchImpl}=memoryStore();
 const started=await startCloudTemplate1Job({
  pinUrl:'https://pin.it/330nC70it',
  displayName:'Cloud Prove',
  musicId:'vazhithunaiye'
 },{env:cloudEnv,fetchImpl,launchImpl:async()=>'sbx'});
 await flushCloudLaunches();
 const secret='wrong';
 await assert.rejects(()=>reportCloudProgress(started.jobId,secret,{status:'preview'},{env:cloudEnv,fetchImpl}),/Invalid Assembly job secret/);
 await assert.rejects(()=>syncCloudJob(started.jobId,secret,{env:cloudEnv,fetchImpl}),/Invalid Assembly job secret/);
});

test('progress callback writes lineage URLs from clone id',async()=>{
 const {rows,fetchImpl}=memoryStore();
 let secret='';
 const started=await startCloudTemplate1Job({
  pinUrl:'https://pin.it/330nC70it',
  displayName:'Cloud Prove',
  musicId:'vazhithunaiye'
 },{
  env:cloudEnv,
  fetchImpl,
  launchImpl:async(opts)=>{secret=opts.secret;return 'sbx';}
 });
 await flushCloudLaunches();
 const view=await reportCloudProgress(started.jobId,secret,{
  status:'preview',
  phase:'preview',
  percent:100,
  cloneId:'royal-heritage-13',
  demo:'/invite/demo?template=royal-heritage-13'
 },{env:cloudEnv,fetchImpl});
 assert.equal(view.branch,'assembly/royal-heritage-13');
 assert.match(view.githubUrl,/assembly\/royal-heritage-13/);
 assert.match(view.previewUrl,/royal-heritage-13/);
 assert.equal(rows.get(started.jobId).clone_id,'royal-heritage-13');
 const sync=await syncCloudJob(started.jobId,secret,{env:cloudEnv,fetchImpl});
 assert.equal(sync.cancelRequested,false);
});

test('API progress is unauthenticated but secret-gated; status reports cloud off by default',async()=>{
 const denied=await request('/api/assembly?action=template1-progress',{
  method:'POST',
  cookie:'',
  headers:{'Content-Type':'application/json','X-Assembly-Job-Id':'deadbeef','X-Assembly-Job-Secret':'x'},
  body:JSON.stringify({status:'preview'})
 });
 assert.ok([401,404,503].includes(denied.statusCode));
 const status=await request('/api/assembly?action=status');
 assert.equal(status.statusCode,200);
 assert.equal(status.body.cloud,false);
 assert.equal(status.body.local,true);
 assert.equal(status.body.writable,true);
});

test('sandbox startup errors retain the provider reason and redact secrets',()=>{
 const message=sandboxLaunchError({message:'Status code 400 is not ok',response:{status:400},json:{error:{code:'bad_request',message:'runtime cannot be used with snapshot token-123'}}},{VERCEL_TOKEN:'token-123'});
 assert.match(message,/HTTP 400/);assert.match(message,/runtime cannot be used with snapshot/);assert.doesNotMatch(message,/token-123/);
});
