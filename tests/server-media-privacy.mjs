import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/media.mjs';
test('removed photo slots are denied before contacting Blob storage',async()=>{
 const oldFetch=global.fetch,env={...process.env};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test',RATE_LIMIT_SECRET:'012345678901234567890123456789012345',BLOB_READ_WRITE_TOKEN:'test-only'});
 let calls=0;
 global.fetch=async url=>{calls++;assert.ok(String(url).startsWith('https://example.supabase.co/rest/v1/invitations?'));return new Response(JSON.stringify([{id:'test-id',slug:'test-couple',published:true,expires_at:'2099-01-01T00:00:00Z',data:{photos:['/api/media?slug=test-couple&slot=1']}}]));};
 const res={setHeader(){},status(n){this.code=n;return this;},json(body){this.body=body;}};
 try{await handler({url:'/api/media?slug=test-couple&slot=0',method:'GET',headers:{}},res);assert.equal(res.code,404);assert.equal(calls,1);assert.equal(res.body.error,'Photo not found.');}
 finally{global.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
