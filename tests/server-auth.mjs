import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/auth.mjs';
import {credentials,sessionFrom} from '../server/auth-account.mjs';
import {publicData,hostId} from '../server/core.mjs';
async function request(url,{method='GET',body,secret}={}){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;}};
 await handler({url,method,body,headers:secret?{authorization:'Bearer '+secret}:{},socket:{remoteAddress:'127.0.0.1'}},res);
 return res;
}
test('signup and signin go through Supabase Auth and never invent a password store',async()=>{
 const oldFetch=global.fetch,oldEnv={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service',RATE_LIMIT_SECRET:'012345678901234567890123456789012345'});
 const users=[];
 global.fetch=async(url,options={})=>{
  const parsed=new URL(url),payload=options.body?JSON.parse(options.body):null;
  if(parsed.pathname.endsWith('/rpc/consume_rate_limit'))return new Response('true',{status:200});
  if(parsed.pathname==='/auth/v1/admin/users'){
   if(users.some(u=>u.email===payload.email))return new Response(JSON.stringify({msg:'User already registered'}),{status:422});
   users.push({id:'user-1',email:payload.email,email_confirm:payload.email_confirm});
   return new Response(JSON.stringify(users.at(-1)),{status:200});
  }
  if(parsed.pathname==='/auth/v1/token'){
   const user=users.find(u=>u.email===payload.email);
   if(!user)return new Response(JSON.stringify({error_description:'Invalid login credentials'}),{status:400});
   return new Response(JSON.stringify({access_token:'jwt-host',refresh_token:'refresh-host',expires_in:3600,user:{id:user.id,email:user.email}}),{status:200});
  }
  if(parsed.pathname==='/auth/v1/user'){
   if((options.headers.Authorization||options.headers.authorization)==='Bearer jwt-host')return new Response(JSON.stringify({id:'user-1',email:'host@example.com'}),{status:200});
   return new Response('{}',{status:401});
  }
  throw new Error('Unexpected '+parsed.pathname);
 };
 try{
  assert.equal((await request('/api/auth?action=signup',{method:'POST',body:{email:'bad',password:'password1'}})).code,400);
  const created=await request('/api/auth?action=signup',{method:'POST',body:{email:'Host@Example.com',password:'password1'}});
  assert.equal(created.code,201);
  assert.equal(users[0].email_confirm,true);
  assert.equal(created.body.user.email,'host@example.com');
  assert.equal(created.body.access_token,'jwt-host');
  assert.equal((await request('/api/auth?action=signup',{method:'POST',body:{email:'host@example.com',password:'password1'}})).code,409);
  const signed=await request('/api/auth?action=signin',{method:'POST',body:{email:'host@example.com',password:'password1'}});
  assert.equal(signed.code,200);
  const me=await request('/api/auth?action=me',{secret:'jwt-host'});
  assert.equal(me.code,200);
  assert.equal(me.body.user.id,'user-1');
  assert.equal((await request('/api/auth?action=me')).code,401);
 }finally{
  global.fetch=oldFetch;
  for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
  Object.assign(process.env,oldEnv);
 }
});
test('host id stays off the public invitation DTO and credentials reject short passwords',()=>{
 assert.equal(hostId({_host:'user-1',bride:'Zara'}),'user-1');
 assert.equal(JSON.stringify(publicData({_host:'user-1',bride:'Zara'})).includes('_host'),false);
 assert.equal(publicData({_host:'user-1',bride:'Zara'}).bride,'Zara');
 assert.throws(()=>credentials({email:'a@b.com',password:'short'}));
 assert.deepEqual(credentials({email:' A@B.com ',password:'password1'}),{email:'a@b.com',password:'password1'});
 assert.equal(sessionFrom({access_token:'jwt',refresh_token:'r',expires_in:9,user:{id:'1',email:'a@b.com'}}).user.id,'1');
});
test('navbar and save/publish copy require accounts; forgot password stays out of the UI',async()=>{
 const header=await readFile(new URL('../src/components.tsx',import.meta.url),'utf8');
 assert.match(header,/Sign in/);
 assert.match(header,/My Templates/);
 assert.match(header,/<\/nav>\{authMode&&<AuthModal/);
 const modal=await readFile(new URL('../src/AuthModal.tsx',import.meta.url),'utf8');
 assert.equal(modal.toLowerCase().includes('forgot'),false);
 const editor=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(editor,/Sign in with email and password to save a draft or publish/);
 assert.match(editor,/Save draft/);
 const guestApi=await readFile(new URL('../src/guest-api.ts',import.meta.url),'utf8');
 assert.match(guestApi,/newGuestKey/);
 assert.match(guestApi,/Sign in to save or publish/);
});
