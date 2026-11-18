import {db,HttpError} from '../core.mjs';
import {audits,list} from './store.mjs';

const commerce=['orders','legacyPayments','videoOrders','videoCatalog','identities','templates','versions'];
const orderRecords=['order-date','order-context'];
const financeRecords=[...orderRecords,'sale','receipt','expense','ad-day','run','time'];
const kinds='project resource ticket comment time sale receipt expense goal campaign feedback lead daily observation benchmark article run connection report preferences finding ad-day search-day sync customer milestone lead-merge order-date product-event order-context'.split(' ');
const plans={
 overview:[[...commerce,'invitations'],[...financeRecords,'ticket','daily','goal','product-event'],true],
 sales:[[...commerce,'invitations'],[...orderRecords,'sale','receipt','daily']],
 visitors:[['traffic','invitations'],[]],
 finance:[[...commerce,'legacyCosts','invitations'],financeRecords],
 customers:[[...commerce,'invitations'],[...orderRecords,'sale','receipt','customer','lead']],
 templates:[['identities','templates'],[]],music:[[],[]],
 'template-insights':[commerce,[...orderRecords,'product-event']],
 traffic:[[...commerce,'traffic','invitations'],[...orderRecords,'product-event']],
 organic:[[...commerce,'traffic','invitations'],[...orderRecords,'daily','lead','lead-merge','receipt','sale']],
 projects:[[],['ticket','project','resource','comment','milestone']],
 team:[[],['resource','run','ticket']],calendar:[['invitations'],['ticket','project','resource','milestone','campaign','article','time']],
 marketing:[[],['campaign','ad-day','sync']],search:[['traffic','invitations'],['search-day','finding','observation','benchmark','article']],
 production:[['jobs','clients'],[]],research:[[],[]],feedback:[[],['feedback','project']],
 insights:[commerce,[...financeRecords,'goal','ticket','daily']],
 settings:[[],['resource','project','sync']],activity:[[],[],true],
 'saved-reports':[[],['report']], 'record-options':[[],['project','resource','comment','sale']],
 'record-search':[[],['ticket','project','resource','sale','customer','article','lead']]
};

function planFor(section,view,definitions){
 if(section==='all'||section==='activity'&&view==='Data sources')return [Object.keys(definitions),kinds,true];
 if(section==='reports'){
  if(view==='orders'||view==='Overview')return [commerce,orderRecords];
  if(view==='audit')return [[],[],true];
  if(['expense','lead','article','ticket'].includes(view))return [[],[view]];
  throw new HttpError(400,'Unknown report.');
 }
 if(section==='sales'&&['Custom sales','Payments','Manual receipts'].includes(view))return [[],['sale','receipt']];
 if(section==='search'&&view!=='Blogs'){
  const searchRecords={'Overview':['search-day'],'AEO':['observation','benchmark'],'Competitors':['observation'],'Technical health':['finding']};
  return [[],searchRecords[view]||[]];
 }
 if(section==='marketing'&&view==='Link builder')return [[],[]];
 if(section==='marketing'&&view==='Campaign plans')return [[],['campaign']];
 if(section==='production'&&view!=='Overview')return [[],[]];
 if(section==='traffic'&&view!=='Overview')return [['traffic','invitations'],[]];
 if(!Object.hasOwn(plans,section))throw new HttpError(400,'Unknown dashboard section.');
 return plans[section];
}

// One deadline covers every page of a source. Cache keys include its actual query bounds.
const cache=new Map(),pending=new Map();
const cacheTtl=60000,deadlineMs=8000;
async function readSource(key,fetchRows,{force=false,reuse=false}={}){
 const last=cache.get(key);
 if(!force&&reuse&&last?.status==='Connected'&&Date.now()-Date.parse(last.updatedAt)<cacheTtl)return {...last,cached:true};
 if(pending.has(key))return pending.get(key);
 const signal=AbortSignal.timeout(deadlineMs);
 const task=(async()=>{
  try{
   const rows=await fetchRows(signal);
   const success={rows,status:'Connected',updatedAt:new Date().toISOString(),cached:false};
   cache.delete(key);cache.set(key,success);
   if(cache.size>96)cache.delete(cache.keys().next().value);
   return success;
  }catch{
   const error=signal.aborted?'Timed out after 8 seconds':'Read failed';
   if(last){
    const stale={...last,cached:true,status:'Stale',error};
    cache.set(key,stale);return stale;
   }
   return {rows:[],status:'Unavailable',updatedAt:null,cached:false,error};
  }finally{pending.delete(key);}
 })();
 pending.set(key,task);return task;
}
async function tableRows(path,signal){
 const rows=[];
 for(let offset=0;offset<=1000000;offset+=1000){
  const page='&limit=1000&offset='+offset;
  const batch=await db(path+page,{signal});
  rows.push(...batch);
  if(batch.length<1000)return rows;
 }
 throw Error('Source exceeds the reporting scan limit.');
}
const skipped={status:'Not requested',updatedAt:null,rows:[]};
function windowFilter(field,range){
 if(!range)return '';
 const midnight=date=>Date.parse(date+'T00:00:00+05:30');
 const iso=ms=>encodeURIComponent(new Date(ms).toISOString());
 return '&'+field+'=gte.'+iso(midnight(range.start))+'&'+field+'=lt.'+iso(midnight(range.end)+86400000);
}
const transactionDates={orders:['created_at','captured_at','refunded_at','applied_at'],legacyPayments:['created_at','captured_at','refunded_at'],videoOrders:['created_at','unlocked_at','refunded_at']};
function transactionFilter(fields,range){
 if(!range)return '';
 const start=new Date(Date.parse(range.previousStart+'T00:00:00+05:30')).toISOString(),end=new Date(Date.parse(range.end+'T00:00:00+05:30')+86400000).toISOString();
 return '&or='+encodeURIComponent('('+fields.map(field=>'and('+field+'.gte.'+start+','+field+'.lt.'+end+')').join(',')+')');
}
async function transactions(key,path,range,reconciliations,signal){
 let fields=transactionDates[key],rows;
 try{rows=await tableRows(path+transactionFilter(fields,range),signal);}
 catch(error){
  if(!['orders','legacyPayments'].includes(key)||!['42703','PGRST204'].includes(error.databaseCode))throw error;
  path=path.replace(',captured_at,refunded_at','');
  if(key==='legacyPayments')path=path.replace(',tax_paise','');
  fields=fields.filter(field=>field!=='captured_at'&&field!=='refunded_at');
  rows=await tableRows(path+transactionFilter(fields,range),signal);
 }
 if(!range)return rows;
 // A historic order may have only an owner-verified capture or refund in this window.
 const known=new Set(rows.map(row=>row.id)),start=Date.parse(range.previousStart+'T00:00:00+05:30'),end=Date.parse(range.end+'T00:00:00+05:30')+86400000;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const ids=[...new Set((await reconciliations).filter(r=>[r.capturedAt,r.refundedAt].some(at=>Date.parse(at)>=start&&Date.parse(at)<end)).map(r=>r.orderId).filter(id=>uuid.test(id)&&!known.has(id)))];
 for(let i=0;i<ids.length;i+=50){
  const values=ids.slice(i,i+50).map(id=>JSON.stringify(id)).join(',');
  rows.push(...await tableRows(path+'&id=in.'+encodeURIComponent('('+values+')'),signal));
 }
 return rows;
}
export async function readTables(definitions,keys,range,force,boundedSales=false,reconciliations=[]){
 const source=Object.fromEntries(Object.keys(definitions).map(key=>[key,skipped]));
 await Promise.all(keys.map(async key=>{
  if(!definitions[key])return;
  const path=definitions[key]+(key==='traffic'?windowFilter('occurred_at',range):'');
  const orderRange=boundedSales?range:null,fields=transactionDates[key];
  const cacheKey=path+(fields?transactionFilter(fields,orderRange):'');
  source[key]=await readSource(cacheKey,signal=>fields?transactions(key,path,orderRange,reconciliations,signal):tableRows(path,signal),{force,reuse:true});
 }));
 return source;
}
export async function sectionData(definitions,section,view,range,force){
 const [tables,recordKinds,needsAudit]=planFor(section,view,definitions);
 const records=Object.fromEntries(kinds.map(kind=>[kind,[]])),health={};
 let logs=[];
 const readKind=async kind=>{
  const filter=kind==='product-event'?windowFilter('data->>at',range):'';
  const result=await readSource('records:'+kind+filter,signal=>list(kind,{signal,filter}));
  records[kind]=result.rows;health['records.'+kind]=result;
  return result.rows;
 };
 const reconciliations=recordKinds.includes('order-date')?readKind('order-date'):Promise.resolve([]);
 const includePrefs=!['visitors','saved-reports','record-options','record-search'].includes(section);
 const jobs=[...new Set([...(includePrefs?['preferences']:[]),...recordKinds.filter(k=>k!=='order-date')])].map(readKind);
 jobs.push(reconciliations);
 if(needsAudit)jobs.push((async()=>{
  const limit=section==='overview'?5:Infinity;
  const result=await readSource('audit:'+range.start+':'+range.end+':'+limit,signal=>audits(signal,range,limit));
  logs=result.rows;health.audit=result;
 })());
 const boundedSales=['sales','reports','template-insights','traffic','overview'].includes(section);
 const [source]=await Promise.all([readTables(definitions,tables,range,force,boundedSales,reconciliations),...jobs]);
 for(const key of tables)if(source[key])health[key]=source[key];
 return {source,records,logs,health};
}
export function sourceMetadata(health){
 return Object.fromEntries(Object.entries(health).map(([name,{rows,...info}])=>[name,{...info,count:rows.length}]));
}
