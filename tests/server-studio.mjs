import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/studio.mjs';
import {bindHtml,snapshotHtml,studioTemplateIds,applyStudioMessage} from '../server/studio-html.mjs';
import {reserved,slugValue} from '../server/core.mjs';
import {passwordOk} from '../server/akay-gate.mjs';
const token='a'.repeat(64);
const id='11111111-1111-4111-8111-111111111111';
const data={
 template:'emerald-noir',type:'wedding',bride:'Ananya',groom:'Rohan',date:'2026-12-01',time:'18:00',
 venue:'Venue',address:'Address',welcome:'Welcome',groomDetails:'',brideDetails:'',dressWomen:'',dressMen:'',
 transport:'',accommodation:'',gifts:'',music:'/assets/track1.mp3',photos:[],
 sections:Object.fromEntries(['welcome','scratch','gallery','countdown','timeline','venue','dress','preEvents','transport','accommodation','gifts','rsvp'].map(k=>[k,true])),
 timeline:[],preEvents:[]
};
function store(){
 const projects=[];
 const versions=[];
 const publications=[];
 return {projects,versions,publications};
}
async function request(url,{method='GET',body,secret}={}){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await handler({url,method,body,headers:secret?{authorization:'Bearer '+secret}:{},socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}
test('studio snapshots exist and bind couple names into template HTML',()=>{
 const ids=studioTemplateIds();
 assert.ok(ids.includes('royal-temple'));
 assert.ok(ids.includes('emerald-noir'));
 const html=bindHtml(snapshotHtml('royal-temple'),{...data,template:'royal-temple',bride:'Supriya',groom:'Ashok'});
 assert.match(html,/Supriya/);
 assert.match(html,/Ashok/);
 assert.match(html,/window\.fmiData=/);
});
test('/studio is reserved, open, and never shares the /akay gate',async()=>{
 assert.equal(reserved.has('studio'),true);
 assert.throws(()=>slugValue('studio'));
 assert.equal(passwordOk('1414'),true);
 const source=await readFile(new URL('../src/Studio.tsx',import.meta.url),'utf8');
 const api=await readFile(new URL('../server/studio.mjs',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 for(const hay of [source,api,app]){
  assert.equal(hay.includes('Enter the studio'),false);
  assert.equal(hay.includes('Team access key'),false);
  assert.equal(hay.includes('PRIVATE PILOT'),false);
  assert.equal(hay.includes('That team access key is not valid'),false);
 }
 assert.match(app,/path==='\/studio'/);
 assert.equal(source.includes('1414'),false);
 assert.equal(api.includes('1414'),false);
});
test('studio config is open and create/read/save/publish do not ask for a team key',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 const db=store();
 global.fetch=async(url,options={})=>{
  const parsed=new URL(url),path=parsed.pathname.replace('/rest/v1/',''),method=options.method||'GET',payload=options.body?JSON.parse(options.body):null;
  if(path==='rpc/consume_rate_limit')return new Response('true',{status:200});
  if(path==='studio_projects'&&method==='POST'){db.projects.push(payload);return new Response(JSON.stringify([payload]),{status:201});}
  if(path.startsWith('studio_projects')&&method==='GET')return new Response(JSON.stringify(db.projects),{status:200});
  if(path.startsWith('studio_projects')&&method==='PATCH'){Object.assign(db.projects[0],payload);return new Response(JSON.stringify([db.projects[0]]),{status:200});}
  if(path==='studio_versions'&&method==='POST'){db.versions.push(payload);return new Response(null,{status:201});}
  if(path.startsWith('studio_versions'))return new Response(JSON.stringify(db.versions),{status:200});
  if(path==='rpc/studio_publish'){db.publications.push(payload);db.projects[0].published_slug=payload.p_slug;return new Response('true',{status:200});}
  throw new Error('Unexpected '+path+' '+method);
 };
 try{
  const config=await request('/api/studio?action=config');
  assert.equal(config.code,200);
  assert.equal(config.body.authenticated,true);
  assert.equal(config.body.templates.includes('royal-temple'),true);
  const login=await request('/api/studio?action=login',{method:'POST',body:{key:'definitely-not-a-team-key'}});
  assert.equal(login.code,200);
  assert.equal(login.body.authenticated,true);
  assert.equal(JSON.stringify(login.body).includes('not valid'),false);
  const created=await request('/api/studio?action=create',{method:'POST',body:{template:'emerald-noir',token,data}});
  assert.equal(created.code,201);
  assert.equal(created.body.template,'emerald-noir');
  assert.equal(created.body.data.bride,'Ananya');
  db.projects[0].id=created.body.id||id;
  if(!created.body.id)created.body.id=id;
  const read=await request('/api/studio?action=read&id='+db.projects[0].id,{secret:token});
  assert.equal(read.code,200);
  const saved=await request('/api/studio?action=save&id='+db.projects[0].id,{method:'POST',secret:token,body:{revision:db.projects[0].revision,data:{...data,bride:'Zara'}}});
  assert.equal(saved.code,200);
  assert.equal(saved.body.data.bride,'Zara');
  const published=await request('/api/studio?action=publish&id='+db.projects[0].id,{method:'POST',secret:token,body:{revision:db.projects[0].revision,slug:'ashok-supriya',managementToken:token}});
  assert.equal(published.code,200);
  assert.equal(published.body.publishedSlug,'ashok-supriya');
  assert.equal((await request('/api/studio?action=read&id='+db.projects[0].id)).code,401);
 }finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
});
test('Lovebot messages update invitation fields without a team key',()=>{
 const next=applyStudioMessage(data,'Our names are Ashok and Supriya','hero');
 assert.equal(next.data.groom,'Ashok');
 assert.equal(next.data.bride,'Supriya');
 assert.match(next.reply,/names/);
});
