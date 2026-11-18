import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/owner.mjs';
import {videoNames} from '../server/catalog-identity.mjs';
import {orderedFunnel} from '../shared/owner-metrics.mjs';

const day='2020-11-18';
const first={id:'first',owner_id:'private-customer',template_id:'wedding-bells-v1',currency:'INR',
 status:'captured',total_paise:82482,tax_paise:12582,created_at:'2020-11-17T15:42:14Z',unlocked_at:'2020-11-18T02:46:29Z'};
const second={...first,id:'second',created_at:'2020-11-18T06:30:56Z',unlocked_at:'2020-11-18T06:32:00Z'};
const fixtures={
 video_invitation_orders:[first,second,{...first,id:'free',status:'complimentary'}, {...first,id:'pending',status:'pending',unlocked_at:null}],
 catalog_identity:[{kind:'video',template_id:'wedding-bells-v1',template_number:109}],
};

test('existing agent keys retrieve a scoped, read-only sales report and cannot write using sales:read',async t=>{
 process.env.SUPABASE_URL='https://fixture.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';delete process.env.FMI_OWNER_LOCAL;
 const key='Bearer fmi_'+'f'.repeat(64);
 let scopes=['sales:read'],revoked=false,failVideo=false;
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const u=new URL(url),name=u.pathname.split('/').pop();
  calls.push({name,method:options.method||'GET'});
  if(name==='owner_records'&&u.searchParams.get('kind')==='eq.key')return Response.json([{id:'key',data:{scopes,revoked}}]);
  if(name==='video_invitation_orders'&&failVideo)return Response.json({message:'read failed'},{status:503});
  return Response.json(fixtures[name]||[]);
 });
 async function call(action,method='GET',body){
  const res={setHeader(){},status(code){this.code=code;return this},json(data){this.body=data}};
  await handler({url:'/api/owner?action='+action,method,headers:{authorization:key},body},res);
  return res;
 }
 const action='sales-report&period=custom&from='+day+'&to='+day;
 const captures=await call(action);
 assert.equal(captures.code,200);assert.equal(captures.body.range.start,day);
 assert.deepEqual(captures.body.sales.map(o=>o.orderId),['second','first']);
 assert(captures.body.sales.every(o=>o.productName==='Wedding Bells'&&o.templateCode==='FMI#0109'&&o.amount===82482&&o.dateBasis==='Video unlocked after payment confirmation'));
 assert.equal(JSON.stringify(captures.body).includes('private-customer'),false);
 const performance=await call(action+'&view=templates');
 const bells=performance.body.templates.find(t=>t.id==='wedding-bells-v1');
 assert.equal(bells.purchases,2);assert.equal(bells.revenue,139800);assert.equal(bells.checkouts,0);
 assert(calls.every(c=>c.method==='GET'&&c.name!=='owner_order_numbers'));
 assert.equal((await call('ingest','POST',{kind:'daily',records:[]})).code,403);
 assert.equal((await call(action,'POST',{})).code,405);
 failVideo=true;
 const unavailable=await call(action);assert.equal(unavailable.code,503);assert.match(unavailable.body.error,/videoOrders/);
 revoked=true;assert.equal((await call(action)).code,403);
 revoked=false;scopes=['organic:write'];assert.equal((await call(action)).code,403);
});

test('historic videos use the customer-facing name, and DIY videos use the storefront definition',()=>{
 const names=videoNames([{id:'historic',name:'Internal title',customer_name:'Customer title'},{id:'wedding-bells-v1',name:'Retired title'}]);
 assert.equal(names.get('historic'),'Customer title');assert.equal(names.get('wedding-bells-v1'),'Wedding Bells');
});

test('a prior payment in the same session cannot complete a later discovery journey',()=>{
 const events=['template_selected','preview','form_start','checkout'].map((type,i)=>({type,session:'one',at:'2020-11-18T01:0'+i+':00Z'}));
 const order={status:'captured',analyticsSession:'one',reporting_at:'2020-11-18T00:59:59Z'};
 assert.equal(orderedFunnel(events,[order]).at(-1).sessions,0);
 assert.equal(orderedFunnel(events,[{...order,reporting_at:'2020-11-18T01:04:00Z'}]).at(-1).sessions,1);
});
