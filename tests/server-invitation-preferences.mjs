import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/auth.mjs';
import {sessionFrom} from '../server/auth-account.mjs';
import {normalizeInvitationPreferences,recommendInvitations} from '../shared/invitation-preferences.mjs';
import {matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';

async function request({method='GET',body,token}={}){
 const response={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;}};
 await handler({url:'/api/auth?action=invitation-preferences',method,body,headers:token?{authorization:'Bearer '+token}:{}},response);return response;
}
function setup(t,fetch){
 const previous=global.fetch,env={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,RATE_LIMIT_SECRET:process.env.RATE_LIMIT_SECRET};
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only-key',RATE_LIMIT_SECRET:'test-preferences-01234567890123456789'});global.fetch=fetch;
 t.after(()=>{global.fetch=previous;for(const [key,value] of Object.entries(env)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
}
test('only supported, explicitly selected language and invitation tradition are stored',()=>{
 for(const value of [null,[],{}, {language:'en'},{language:'ur',tradition:'muslim'},{language:'ta',tradition:'other'}])assert.equal(normalizeInvitationPreferences(value),null);
 assert.deepEqual(normalizeInvitationPreferences({language:'ml',tradition:'christian',userId:'someone-else',admin:true}),{language:'ml',tradition:'christian'});
});
test('preferences require a customer session and cannot use management tokens or arbitrary methods',async t=>{
 setup(t,()=>{throw Error('Unauthenticated request must not reach storage');});
 assert.equal((await request()).code,401);
 assert.equal((await request({token:'a'.repeat(64)})).code,401);
 assert.equal((await request({method:'POST',token:'customer'})).code,405);
 assert.equal((await request({method:'PUT',token:'customer',body:{language:'en'}})).code,400);
});
test('a customer can update only their own allowlisted metadata and read it back',async t=>{
 const metadata={display_name:'Host',other_setting:true};let writes=0;
 setup(t,async(url,options)=>{
  assert.equal(url,'https://example.supabase.co/auth/v1/user');assert.equal(options.headers.Authorization,'Bearer customer-jwt');
  if(options.method==='PUT'){writes++;const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body),['data']);assert.deepEqual(Object.keys(body.data),['invitation_preferences']);Object.assign(metadata,body.data);}
  return Response.json({id:'customer-1',email:'private@example.test',user_metadata:metadata});
 });
 const saved=await request({method:'PUT',token:'customer-jwt',body:{language:'ta',tradition:'hindu',userId:'victim',app_metadata:{role:'admin'}}});
 assert.equal(saved.code,200);assert.equal(writes,1);assert.equal(metadata.display_name,'Host');
 assert.deepEqual(saved.body,{userId:'customer-1',preferences:{language:'ta',tradition:'hindu'}});
 const read=await request({token:'customer-jwt'});assert.deepEqual(read.body,saved.body);assert.equal(read.headers['Cache-Control'],'no-store');
 assert.equal(JSON.stringify(read.body).includes('private@example'),false);
 const session=sessionFrom({access_token:'customer-jwt',user:{id:'customer-1',user_metadata:metadata}});
 assert.deepEqual(session.user.invitationPreferences,saved.body.preferences);assert.equal(session.user.other_setting,undefined);
});
test('expired tokens and upstream failures never report a successful account save',async t=>{
 setup(t,async()=>Response.json({error:'expired'},{status:401}));
 assert.equal((await request({method:'PUT',token:'expired',body:{language:'en',tradition:'muslim'}})).code,401);
 global.fetch=async()=>Response.json({error:'unavailable'},{status:500});
 assert.equal((await request({token:'customer'})).code,503);
});
test('recommendations use authored tradition, preserve all items and obey explicit search intent',()=>{
 const cards=[{id:'temple-doors',name:'Temple'},{id:'unclassified',name:'Christian flowers'},{id:'moonlit-nikah',name:'Moonlit Nikah'},{id:'christian-bells',name:'Bells'},{id:'royal',name:'Royal'}];
 const ranked=recommendInvitations(cards,{language:'ta',tradition:'christian'});
 assert.deepEqual(ranked.map(c=>c.id),['christian-bells','royal','unclassified','temple-doors','moonlit-nikah']);
 assert.equal(ranked.length,cards.length);assert.equal(cards[0].id,'temple-doors');
 assert.deepEqual(recommendInvitations(cards.filter(c=>matchesDiscoverySearch(c,'Islam')),{tradition:'christian'}).map(c=>c.id),['moonlit-nikah']);
 assert.equal(recommendInvitations(cards,null),cards);
});
