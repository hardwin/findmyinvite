import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot} from '../server/owner/reporting.mjs';
import {orderReference} from '../shared/order-display.mjs';

function fixtureDatabase(t){
 const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','FMI_OWNER_LOCAL'],before=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 process.env.SUPABASE_URL='https://fmi-fixture.invalid';
 process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';
 delete process.env.FMI_OWNER_LOCAL;
 t.after(()=>{for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}});
}
test('a stalled traffic source leaves Reports and Settings available and retains the last successful source time',{timeout:15000},async t=>{
 fixtureDatabase(t);
 let stallTraffic=false,stalled;
 const pending=new Promise(resolve=>{stalled=resolve});
 const calls=[];
 t.mock.method(globalThis,'fetch',async(value,{signal,method})=>{
  const url=new URL(value);calls.push({url,method});
  if(url.pathname.endsWith('/analytics_events')&&stallTraffic){
   stalled();
   await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));
  }
  return Response.json([]);
 });
 const range={period:'custom',from:'2024-01-01',to:'2024-01-02'};
 const active=await snapshot(range,true,'traffic','Journeys');
 assert.equal(active.sources.traffic.status,'Connected');
 const lastSuccess=active.sources.traffic.updatedAt;
 const query=calls.find(c=>c.url.pathname.endsWith('/analytics_events')).url.searchParams;
 assert.deepEqual(query.getAll('occurred_at'),['gte.2023-12-31T18:30:00.000Z','lt.2024-01-02T18:30:00.000Z']);
 stallTraffic=true;
 const pendingTraffic=snapshot(range,true,'traffic','Journeys');
 await pending;
 calls.length=0;
 const [settings,report]=await Promise.all([snapshot(range,true,'settings'),snapshot(range,true,'reports','expense')]);
 assert.equal(settings.sources['records.preferences'].status,'Connected');
 assert.equal(report.sources['records.expense'].status,'Connected');
 assert.deepEqual(new Set(calls.map(c=>c.url.pathname)),new Set(['/rest/v1/owner_records']));
 // Keep a timer active while Node's unref'ed AbortSignal deadline runs in this mocked environment.
 const timeout=setTimeout(()=>{},10000);
 try{
  const stale=await pendingTraffic;
  assert.equal(stale.sources.traffic.status,'Stale');
  assert.equal(stale.sources.traffic.updatedAt,lastSuccess);
  assert.equal(stale.sources.traffic.cached,true);
  assert.match(stale.sources.traffic.error,/timed out/i);
 }finally{clearTimeout(timeout);}
 stallTraffic=false;
 const recovered=await snapshot(range,true,'traffic','Journeys');
 assert.equal(recovered.sources.traffic.status,'Connected');
 assert.equal(recovered.sources.traffic.cached,false);
 assert(recovered.sources.traffic.updatedAt>lastSuccess);
});

test('sales exports use date-bounded lifecycle reads and never allocate order numbers',async t=>{
 fixtureDatabase(t);
 const calls=[];
 t.mock.method(globalThis,'fetch',async(value,{method})=>{
  const url=new URL(value);calls.push({url,method});
  return Response.json(url.pathname.endsWith('/website_orders')?[{id:'fmi-order',amount:118,tax_paise:18,currency:'INR',status:'captured',purpose:'publish',created_at:'2024-03-01T02:00:00Z',captured_at:'2024-03-01T03:00:00Z'}]:[]);
 });
 const report=await snapshot({period:'custom',from:'2024-03-01',to:'2024-03-01'},true,'reports','orders');
 assert.deepEqual(report.orders.map(row=>row.id),['fmi-order']);
 assert(calls.every(c=>c.method==='GET'));
 const paymentRead=calls.find(c=>c.url.pathname.endsWith('/website_orders')).url.searchParams.get('or');
 assert.match(paymentRead,/captured_at.gte.2024-02-28T18:30:00.000Z/);
 assert.match(paymentRead,/refunded_at.lt.2024-03-01T18:30:00.000Z/);
 assert(!calls.some(c=>c.url.pathname.endsWith('/analytics_events')));
});

test('Sales retains the capture and original ID when display numbering is unavailable',async t=>{
 fixtureDatabase(t);
 const id='f23f0869-2669-4654-af8e-49a311e667f6',capture='2024-04-28T06:30:00Z';
 let failNumbers=true;
 t.mock.method(globalThis,'fetch',async value=>{
  const url=new URL(value);
  if(url.pathname.endsWith('/rpc/owner_order_numbers')){
   if(failNumbers)throw Error('Numbering service unavailable');
   return Response.json({[id]:17});
  }
  return Response.json(url.pathname.endsWith('/website_orders')?[{id,amount:118,tax_paise:18,currency:'INR',status:'captured',purpose:'publish',created_at:capture,captured_at:capture}]:[]);
 });
 const range={period:'custom',from:'2024-04-28',to:'2024-04-28'};
 const initial=await snapshot(range,true,'sales','Overview');
 assert.equal(initial.sources.orderNumbers.status,'Unavailable');
 assert.equal(initial.totals.gross,118);
 assert.equal(orderReference(initial.orders[0]),id);
 failNumbers=false;
 const retry=await snapshot(range,true,'sales','Overview');
 assert.equal(retry.sources.orderNumbers.status,'Connected');
 assert.equal(retry.totals.gross,118);
 assert.equal(orderReference(retry.orders[0]),'#0017');
});
