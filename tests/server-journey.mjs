import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/invitations.mjs';
import {templates,bodyJson,configured,validateRsvp} from '../server/core.mjs';
const token='ab'.repeat(32),other='cd'.repeat(32),jwt='eyJhbGciOiJub25lIn0.e30.one',otherJwt='eyJhbGciOiJub25lIn0.e30.two';
const data={template:'royal-prestige',type:'wedding',bride:'Bride',groom:'Groom',date:'2099-12-01',time:'10:00',venue:'Venue',address:'Address',welcome:'Welcome',groomDetails:'',brideDetails:'',dressWomen:'',dressMen:'',transport:'',accommodation:'',gifts:'',music:'/assets/track1.mp3',photos:[],sections:Object.fromEntries(['welcome','scratch','gallery','countdown','timeline','venue','dress','preEvents','transport','accommodation','gifts','rsvp'].map(k=>[k,true])),timeline:[],preEvents:[]};
async function request(action,{method='GET',body,secret,slug='test-couple'}={}){const res={setHeader(){},status(n){this.code=n;return this;},json(b){this.body=b;}};await handler({url:'/api/invitations?action='+action+'&slug='+slug,method,body,headers:secret?{authorization:'Bearer '+secret}:{},socket:{remoteAddress:'127.0.0.1'}},res);return res;}
test('guest lifecycle is durable, private, idempotent and template gated',async()=>{const originalFetch=global.fetch,env={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345',PROMOTION_START_AT:'2020-01-01T00:00:00Z',PROMOTION_END_AT:'2099-01-01T00:00:00Z'});delete process.env.BLOB_READ_WRITE_TOKEN;delete process.env.VERCEL;let row=null,responses=[],available=true;
 global.fetch=async(url,options={})=>{const parsed=new URL(url),path=parsed.pathname.replace('/rest/v1/',''),payload=options.body?JSON.parse(options.body):null,method=options.method||'GET';let value=null,status=200;
 if(parsed.pathname==='/auth/v1/user'){const header=options.headers?.Authorization||options.headers?.authorization||'';if(header==='Bearer '+jwt)return new Response(JSON.stringify({id:'user-1',email:'host@example.com'}),{status:200});if(header==='Bearer '+otherJwt)return new Response(JSON.stringify({id:'user-2',email:'other@example.com'}),{status:200});return new Response('{}',{status:401});}
 if(path==='rpc/consume_rate_limit')value=true;
 else if(path==='template_catalog')value=available?[{id:'royal-prestige'}]:[];
 else if(path==='invitations'){if(method==='GET')value=row?[structuredClone(row)]:[];else if(method==='POST'){if(row)return new Response('{}',{status:409});row={id:'00000000-0000-0000-0000-000000000001',created_at:new Date().toISOString(),...payload};value=[structuredClone(row)];status=201;}else if(method==='PATCH'){row={...row,...payload};value=[structuredClone(row)];}else if(method==='DELETE'){row=null;responses=[];status=204;}}
 else if(path==='responses'){if(method==='POST'){responses.push({id:'response1',created_at:new Date().toISOString(),...payload});status=201;}else value=structuredClone(responses);}
 else throw new Error('Unexpected mock path '+path);return new Response(value===null?null:JSON.stringify(value),{status});};
 try{
 const create=()=>request('create',{method:'POST',body:{slug:'test-couple',data,managementToken:token},secret:jwt});
 assert.equal((await request('create',{method:'POST',body:{slug:'test-couple',data,managementToken:token}})).code,401);
 available=false;assert.equal((await create()).code,403);assert.equal(row,null);available=true;
 assert.equal((await create()).code,201);assert.equal(row.published,false);assert.equal(row.data._host,'user-1');assert.equal((await request('read')).code,404);
 const firstId=row.id;assert.equal((await create()).code,200);assert.equal(row.id,firstId);
 assert.equal((await request('create',{method:'POST',body:{slug:'test-couple',data,managementToken:other},secret:otherJwt})).code,409);
 assert.equal((await request('update',{method:'POST',secret:other,body:{data,published:true}})).code,403);
 assert.equal((await request('update',{method:'POST',secret:otherJwt,body:{data,published:true}})).code,403);
 assert.equal((await request('update',{method:'POST',secret:token,body:{data:{...data,photos:['/api/media?slug=test-couple&slot=0']},published:true}})).code,503);
 assert.equal((await request('update',{method:'POST',secret:jwt,body:{data,published:true}})).code,200);
 const read=await request('read');assert.equal(read.code,200);assert.equal(read.body.invitation.bride,'Bride');assert.equal(JSON.stringify(read.body).includes('management'),false);assert.equal(JSON.stringify(read.body).includes('_host'),false);assert.equal(JSON.stringify(read.body).includes('user-1'),false);
 const mine=await request('mine',{secret:jwt});assert.equal(mine.code,200);assert.equal(mine.body.invitations[0].slug,'test-couple');assert.equal(JSON.stringify(mine.body).includes('_host'),false);
 assert.equal((await request('manage',{secret:jwt})).code,200);
 assert.equal((await request('rsvp',{method:'POST',body:{name:'Guest',email:'guest@example.com',attendance:'yes',guests:2,message:'See you'}})).code,201);
 assert.equal((await request('responses',{})).code,401);assert.equal((await request('responses',{secret:other})).code,403);
 const inbox=await request('responses',{secret:token});assert.equal(inbox.body.responses.length,1);assert.equal(inbox.body.responses[0].guests,2);
 available=false;assert.equal((await request('update',{method:'POST',secret:token,body:{data:{...data,template:'emerald-noir'}}})).code,403);
 row.expires_at='2020-01-01T00:00:00Z';assert.equal((await request('read')).code,404);assert.equal((await request('rsvp',{method:'POST',body:{}})).code,404);
 assert.equal((await request('delete',{method:'DELETE',secret:other})).code,403);assert.equal((await request('delete',{method:'DELETE',secret:token})).code,200);assert.equal(row,null);assert.equal(responses.length,0);
 }finally{global.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
test('malformed parsed bodies and weak secrets rejected; attending requires at least one guest',async()=>{await assert.rejects(bodyJson({headers:{},body:'invalid'}),e=>e.status===400);await assert.rejects(bodyJson({headers:{},body:null}),e=>e.status===400);assert.equal(configured({SUPABASE_URL:'https://example.com',SUPABASE_SERVICE_ROLE_KEY:'key',RATE_LIMIT_SECRET:'short'}),false);for(const guests of [0,'0',-1])assert.throws(()=>validateRsvp({name:'A',email:'a@b.com',attendance:'yes',guests}));});
test('API template IDs match the frontend catalogue',async()=>{const source=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');const section=source.split('export const templates = [')[1].split('];')[0];const ids=[...section.matchAll(/id:'([^']+)'/g)].map(m=>m[1]);assert.deepEqual([...templates].sort(),ids.sort());});
