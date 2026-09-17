import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/studio.mjs';
import {tokenHash} from '../server/core.mjs';
import {teamCookie} from '../server/studio-auth.mjs';
import {draftData} from '../server/studio-policy.mjs';

test('prepare is ownership protected and reuses the workspace without a model turn',async t=>{
 await harness(t,{},async({request,calls,row})=>{
  assert.equal((await request('prepare',{}, {token:'cd'.repeat(32)})).code,403);
  assert.ok(!calls.some(c=>c.url.hostname==='api.openai.com'));
  assert.equal((await request('prepare')).body.ready,false);
  assert.equal((await request('prepare')).body.ready,true);
  assert.equal(row().workspace_id,'session-warm');
  const creates=calls.filter(c=>c.url.pathname.endsWith('/sessions')&&c.method==='POST');
  assert.equal(creates.length,1);assert.equal(creates[0].body.input,undefined);
  assert.equal(creates[0].body.agent.model,'gpt-5.6-luna');
  assert.ok(!calls.some(c=>c.url.pathname.endsWith('/events')));
 },{agent:true});
});

test('two edits reuse one workspace and save versions without Git calls',async t=>{
 const html=readFileSync(new URL('../public/studio/templates/emerald-noir.html',import.meta.url),'utf8');
 await harness(t,{html,git_sha:null},async({request,calls,row})=>{
  await request('prepare');
  for(const revision of [2,3]){
   const run=await request('run',{message:'Change groom name',section:'hero',revision});assert.equal(run.code,202);
   const result=await request('poll');assert.equal(result.code,200);assert.equal(result.body.done,true);assert.equal(result.body.data.groom,'Updated Groom');
   assert.equal(row().workspace_revision,revision+1);assert.equal(row().workspace_id,'session-warm');
  }
  assert.equal(calls.filter(c=>c.url.pathname.endsWith('/sessions')&&c.method==='POST').length,1);
  assert.equal(calls.filter(c=>c.url.pathname.endsWith('/events')).length,2);
  assert.ok(!calls.some(c=>c.url.hostname==='api.github.com'||c.method==='DELETE'));
 },{agent:true});
});

test('expired and out-of-sync workspaces rebuild from the saved draft',async t=>{
 for(const initial of [{workspace_id:'session-expired',workspace_revision:2},{workspace_id:'session-stale',workspace_revision:1}]){
  await harness(t,initial,async({request,calls,row})=>{
   assert.equal((await request('prepare')).code,200);assert.equal(row().workspace_revision,2);
   const created=calls.find(c=>c.url.pathname.endsWith('/sessions')&&c.method==='POST');assert.ok(created);
   const data=created.body.environment.files.find(f=>f.path.endsWith('/content.json'));
   assert.equal(JSON.parse(Buffer.from(data.data,'base64')).groom,'Groom');
  },{agent:true,expired:true});
 }
});

const id='11111111-2222-4333-8444-555555555555', token='ab'.repeat(32), gitSha='c'.repeat(40);
const original=()=>({id,template_id:'emerald-noir',owner_hash:tokenHash(token),revision:2,git_sha:gitSha,
  data:draftData({bride:'Bride',groom:'Groom',date:'2099-12-12',time:'18:00',venue:'Garden',address:'Mumbai, India'},'emerald-noir'),
  html:'<html><body>Stored verified template</body></html>',session_id:null,lock_until:null,published_slug:null});

async function harness(t, changes, run, controls={}) {
  const env={...process.env}, calls=[];let row={...original(),...changes}, acquiredLease;
  Object.assign(process.env,{SUPABASE_URL:'https://studio-test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'mock-service',RATE_LIMIT_SECRET:'mock-rate-secret-01234567890123456789',STUDIO_TEAM_KEY:'mock-team-key',STUDIO_GITHUB_TOKEN:'mock-github',OPENAI_API_KEY:'mock-openai',PROMOTION_START_AT:'2020-01-01T00:00:00Z',PROMOTION_END_AT:'2099-01-01T00:00:00Z'});
  const json=(body,status=200)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  t.mock.method(globalThis,'fetch',async (url,options={})=>{
    const parsed=new URL(String(url)),body=options.body?JSON.parse(options.body):undefined,method=options.method||'GET';
    calls.push({url:parsed,body,method});
    if(parsed.hostname==='api.openai.com') {
      if(controls.agent){
        if(parsed.pathname.includes('/environments/'))return json({status:'connected'});
        if(parsed.pathname.endsWith('/sessions')&&method==='POST')return json({id:'session-warm',status:'idle',environment:{id:'env-warm'}});
        if(method==='DELETE')return json({deleted:true});
        if(parsed.pathname.endsWith('/events'))return json({});
        if(parsed.pathname.endsWith('/turns'))return json({data:[{status:'completed'}]});
        if(parsed.pathname.endsWith('/artifacts'))return json({data:[{id:'artifact-current',path:`/workspace/outputs/result-${row.run_revision}.json`,size_bytes:1000}]});
        if(parsed.pathname.includes('/artifacts/artifact-current/content'))return json({html:row.html,data:{...row.data,groom:'Updated Groom'},revision:row.run_revision,message:'Name updated.'});
        if(controls.expired&&parsed.pathname.endsWith('/session-expired'))return json({error:{message:'Gone'}},404);
        return json({status:'idle',environment:{id:'env-warm'}});
      }

      assert.match(parsed.pathname,/\/agents\/sessions\/session-test(?:\/events)?$/);
      if(method==='POST')return json({error:{message:'Upstream cancellation unavailable',type:'invalid_request_error'}},403);
      assert.equal(method,'DELETE');return json({deleted:true});
    }
    if(parsed.hostname==='api.github.com') {
      if(method==='DELETE')return json(null,204);
      assert.equal(method,'GET');return json({object:{sha:gitSha}});
    }
    assert.equal(parsed.hostname,'studio-test.supabase.co','Unexpected provider request');
    if(parsed.pathname.endsWith('/rpc/consume_rate_limit'))return json(true);
    if(parsed.pathname.endsWith('/rpc/studio_publish')) {
      assert.equal(body.p_lock_until,acquiredLease);
      assert.equal(body.p_revision,row.revision);
      return json(true);
    }
    if(parsed.pathname.endsWith('/rpc/studio_checkpoint')) {
      assert.equal(body.p_lock_until,acquiredLease);assert.equal(body.p_revision,row.revision);
      row={...row,data:body.p_data,html:body.p_html,git_sha:body.p_sha,revision:row.revision+1,session_id:null};
      return json([row]);
    }
    if(parsed.pathname.endsWith('/studio_versions'))return json([]);
    assert.ok(parsed.pathname.endsWith('/studio_projects'));
    if(method==='GET')return json([row]);
    assert.equal(method,'PATCH');
    if(parsed.searchParams.has('or')) {
      if(controls.lockBusy)return json([]);
      assert.ok(Date.parse(body.lock_until)-Date.now()<=75000,'A killed function must not leave a five-minute lease');row={...row,...body};acquiredLease=row.lock_until;return json([row]);
    }
    const leaseFilters=parsed.searchParams.getAll('lock_until');
    assert.ok(leaseFilters.includes('eq.'+acquiredLease),'Every update/release must target its own lease');
    if(body.lock_until===null&&controls.replacementLease)row={...row,lock_until:controls.replacementLease};
    if(row.lock_until!==acquiredLease)return json([]);
    row={...row,...body};return json([row]);
  });
  async function request(action,body={},options={}) {
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){if(this.code>=200&&this.code<300&&options.method!=='GET')assert.equal(row.lock_until,null,'Release the lease before responding');this.body=data;}};
    const headers={cookie:options.anonymous?'':teamCookie().split(';')[0],authorization:'Bearer '+(options.token||token),origin:'https://findmyinvite.com',host:'findmyinvite.com'};
    await handler({url:`/api/studio?action=${action}&id=${id}`,method:options.method||'POST',headers,body},res);return res;
  }
  try{await run({request,calls,row:()=>row});}
  finally{t.mock.restoreAll();for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
}

test('read DTO hides team/owner secrets and enforces the draft management key',async t=>{
  await harness(t,{},async({request})=>{
    const result=await request('read',{}, {method:'GET'});assert.equal(result.code,200);assert.equal(result.body.revision,2);
    assert.doesNotMatch(JSON.stringify(result.body),/owner_hash|mock-team|mock-service/);
    assert.equal((await request('read',{}, {method:'GET',token:'cd'.repeat(32)})).code,403);
  });
});

test('a competing lock rejects mutation without attempting to release that lease',async t=>{
  await harness(t,{},async({request,calls})=>{
    assert.equal((await request('save',{revision:2})).code,423);
    assert.equal(calls.filter(c=>c.method==='PATCH').length,1);
  },{lockBusy:true});
});

test('save and publish require an explicit current revision before any external work',async t=>{
  for(const action of ['save','publish'])await harness(t,{},async({request,calls,row})=>{
    assert.equal((await request(action,{})).code,400);assert.equal(row().lock_until,null);
    assert.ok(calls.every(c=>c.url.hostname==='studio-test.supabase.co'));
    assert.ok(!calls.some(c=>c.url.pathname.includes('/rpc/')));
  });
});

test('stale saves preserve current state and release only the acquired lease',async t=>{
  await harness(t,{},async({request,row})=>{
    const result=await request('save',{revision:1,data:{bride:'Stale'}});
    assert.equal(result.code,409);assert.equal(row().data.bride,'Bride');assert.equal(row().lock_until,null);
  });
});

test('an expired request cannot release a replacement operation lease',async t=>{
  const newer='2099-01-01T00:00:00.000Z';
  await harness(t,{},async({request,row})=>{
    assert.equal((await request('save',{revision:1})).code,409);
    assert.equal(row().lock_until,newer);
  },{replacementLease:newer});
});

test('invalid run input consumes no rate allowance and starts no agent',async t=>{
  await harness(t,{},async({request,calls})=>{
    assert.equal((await request('run',{revision:2,message:' ',section:'hero'})).code,400);
    assert.ok(!calls.some(c=>c.url.pathname.includes('/rpc/')||c.url.hostname==='api.openai.com'));
  });
});

test('an active agent blocks manual saves without changing its state',async t=>{
  await harness(t,{session_id:'session-test'},async({request,row})=>{
    assert.equal((await request('save',{revision:2})).code,409);assert.equal(row().session_id,'session-test');
  });
});

test('expired and malformed run timestamps clear busy state even when cancellation fails',async t=>{
  for(const run_started_at of ['2000-01-01T00:00:00Z','invalid'])await harness(t,{session_id:'session-test',run_revision:2,run_started_at},async({request,row,calls})=>{
    assert.equal((await request('poll')).code,408);assert.equal(row().session_id,null);assert.equal(row().run_revision,null);
    assert.ok(calls.some(c=>c.url.hostname==='api.openai.com'&&c.method==='DELETE'));
  });
});

test('stale agent target never downloads or applies generated content',async t=>{
  await harness(t,{session_id:'session-test',run_revision:1,run_started_at:new Date().toISOString()},async({request,calls,row})=>{
    assert.equal((await request('poll')).code,409);assert.equal(row().revision,2);assert.equal(row().session_id,null);
    assert.ok(!calls.some(c=>c.url.hostname==='api.openai.com'&&c.method==='GET'));
    assert.ok(!calls.some(c=>c.url.hostname==='api.github.com'));
  });
});

test('cancel clears the tracked run even if provider cancellation fails',async t=>{
  await harness(t,{session_id:'session-test',run_revision:2},async({request,row})=>{
    assert.equal((await request('cancel')).code,200);assert.equal(row().session_id,null);assert.equal(row().lock_until,null);
  });
});

test('null restore target cannot silently select original version zero',async t=>{
  await harness(t,{},async({request,calls})=>{
    assert.equal((await request('restore',{revision:2,target:null})).code,400);
    assert.ok(!calls.some(c=>c.url.pathname.endsWith('/studio_versions')));
  });
});

test('publishing passes the operation lease and preserves the current revision',async t=>{
  await harness(t,{},async({request,row,calls})=>{
    const result=await request('publish',{revision:2,slug:'test-couple',managementToken:token});
    assert.equal(result.code,200);assert.equal(result.body.publishedSlug,'test-couple');assert.equal(result.body.archivePending,false);
    assert.equal(row().revision,2);assert.equal(row().lock_until,null);
    const publish=calls.find(c=>c.url.pathname.endsWith('/rpc/studio_publish'));assert.equal(publish.body.p_data.studioId,id);
  });
});

test('published address changes fail before any publication or Git operation',async t=>{
  await harness(t,{published_slug:'existing-couple'},async({request,calls})=>{
    assert.equal((await request('publish',{revision:2,slug:'new-couple',managementToken:token})).code,409);
    assert.ok(!calls.some(c=>c.url.pathname.endsWith('/rpc/studio_publish')||c.url.hostname==='api.github.com'));
  });
});

test('details-only save keeps code SHA but creates an atomic database revision',async t=>{
  const html=readFileSync(new URL('../public/studio/templates/royal-temple.html',import.meta.url),'utf8');
  const data=draftData({bride:'Bride',groom:'Groom',date:'2099-12-12',time:'18:00',venue:'Garden',address:'Mumbai, India'},'royal-temple');
  await harness(t,{html,data,template_id:'royal-temple'},async({request,row,calls})=>{
    const result=await request('save',{revision:2,data:{...data,bride:'Aarohi'}});
    assert.equal(result.code,200);assert.equal(result.body.revision,3);assert.equal(row().data.bride,'Aarohi');
    assert.equal(row().git_sha,gitSha);assert.ok(!calls.some(c=>c.url.hostname==='api.github.com'));
    assert.equal(calls.filter(c=>c.url.pathname.endsWith('/rpc/studio_checkpoint')).length,1);
  });
});

test('publishing requires the schema venue and address even when every other field is complete',async t=>{
  for(const template of ['royal-temple','emerald-noir'])for(const field of ['venue','address'])for(const missing of ['', '   ']){
    const data={...original().data,template,[field]:missing};
    await harness(t,{template_id:template,data},async({request,row,calls})=>{
      const result=await request('publish',{revision:2,slug:'test-couple',managementToken:token});
      assert.equal(result.code,400,`${template} must reject an empty ${field}`);
      assert.match(result.body.error,/Complete .* in Details before publishing/);
      assert.equal(row().revision,2);assert.equal(row().lock_until,null);
      assert.ok(!calls.some(call=>call.url.pathname.endsWith('/rpc/studio_publish')||call.url.hostname==='api.github.com'));
    });
  }
});

test('Studio access needs no team cookie but still requires the private draft token',async t=>{
 await harness(t,{},async({request})=>{
  const config=await request('config',{}, {method:'GET',anonymous:true});assert.equal(config.body.authenticated,true);
  assert.equal((await request('read',{}, {method:'GET',anonymous:true})).code,200);
  assert.equal((await request('read',{}, {method:'GET',anonymous:true,token:'cd'.repeat(32)})).code,403);
 });
});
