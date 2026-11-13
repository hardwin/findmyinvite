import {createHash} from 'node:crypto';
export const ownerToken='b'.repeat(64);
export const ownerCookie='fmi_owner='+ownerToken;
export const ownerHeaders={host:'findmyinvite.com',origin:'https://findmyinvite.com','x-owner-csrf':'fixture-csrf'};
export function ownerFixture(handler){return async(req,res)=>{
 const previous=globalThis.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL||='https://fixture.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY||='fixture';
 globalThis.fetch=async(url,options)=>{const u=new URL(url);if(u.pathname==='/rest/v1/owner_records'){
  const kind=u.searchParams.get('kind'),id=u.searchParams.get('id');
  const value=kind==='eq.identity'?[{kind:'identity',id:'owner',revision:1,data:{epoch:1,actorId:'4744ee35-ed37-4127-b529-a19db8f2132a'}}]:kind==='eq.session'&&id==='eq.'+createHash('sha256').update(ownerToken).digest('hex')?[{kind:'session',id:id.slice(3),revision:1,data:{epoch:1,csrf:'fixture-csrf',actorId:'4744ee35-ed37-4127-b529-a19db8f2132a',expiresAt:'2099-01-01T00:00:00Z',revoked:false}}]:[];
  return new Response(JSON.stringify(value));
 }return previous(url,options);};
 try{return await handler(req,res)}finally{globalThis.fetch=previous;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
};}
