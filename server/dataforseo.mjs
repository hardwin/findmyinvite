import {HttpError} from './core.mjs';

/** DataForSEO location codes — South India metros (OpenSEO-style keyword research, no OpenSEO host). */
export const SOUTH_INDIA_LOCATIONS=[
 {location_code:1007745,location_name:'Chennai,Tamil Nadu,India'},
 {location_code:1007748,location_name:'Bengaluru,Karnataka,India'},
 {location_code:1007753,location_name:'Hyderabad,Telangana,India'},
 {location_code:9040243,location_name:'Kochi,Kerala,India'},
 {location_code:9040166,location_name:'Coimbatore,Tamil Nadu,India'}
];
const INDIA_FALLBACK=2356;

export function dataforseoConfigured(env=process.env){
 return Boolean(env.DATAFORSEO_LOGIN&&env.DATAFORSEO_PASSWORD);
}

function authHeader(env=process.env){
 return 'Basic '+Buffer.from(env.DATAFORSEO_LOGIN+':'+env.DATAFORSEO_PASSWORD).toString('base64');
}

/**
 * Search volume for keywords, preferring South India metro locations.
 * Returns Map(keyword -> {volume, competition, location}) or empty on soft failure.
 * Never invents metrics — missing data stays null / omitted.
 */
const ADS_KEYWORD_CHUNK=20;

async function keywordOpportunityChunk(list,{fetchImpl,env,locationCode}){
 const body=[{
  keywords:list,
  location_code:locationCode||INDIA_FALLBACK,
  language_code:'en',
  search_partners:false
 }];

 let response;
 try{
  response=await fetchImpl('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',{
   method:'POST',
   headers:{Authorization:authHeader(env),'Content-Type':'application/json'},
   body:JSON.stringify(body)
  });
 }catch{
  throw new HttpError(502,'DataForSEO request failed.');
 }

 const payload=await response.json().catch(()=>null);
 if(!response.ok||!payload||payload.status_code>=40000){
  console.error('DataForSEO search_volume failed',response.status,payload?.status_message||'');
  throw new HttpError(502,'DataForSEO search volume unavailable.');
 }

 const out=new Map();
 const tasks=Array.isArray(payload.tasks)?payload.tasks:[];
 for(const task of tasks){
  const results=Array.isArray(task?.result)?task.result:[];
  for(const row of results){
   const key=String(row?.keyword||'').trim().toLowerCase();
   if(!key)continue;
   const volume=Number.isFinite(Number(row.search_volume))?Number(row.search_volume):null;
   const competition=Number.isFinite(Number(row.competition))?Number(row.competition):null;
   out.set(key,{
    volume,
    competition,
    location:locationCode||INDIA_FALLBACK,
    status:volume===null?'INSUFFICIENT_DATA':'VERIFIED'
   });
  }
 }
 return out;
}

export async function keywordOpportunity(keywords,{fetchImpl=fetch,env=process.env,locationCode=SOUTH_INDIA_LOCATIONS[0].location_code}={}){
 const list=[...new Set((keywords||[]).map(k=>String(k||'').trim().toLowerCase()).filter(k=>k.length>=3))];
 if(!list.length)return new Map();
 if(!dataforseoConfigured(env))throw new HttpError(503,'DataForSEO is not configured.');

 const out=new Map();
 for(let i=0;i<list.length;i+=ADS_KEYWORD_CHUNK){
  const chunk=list.slice(i,i+ADS_KEYWORD_CHUNK);
  const part=await keywordOpportunityChunk(chunk,{fetchImpl,env,locationCode});
  for(const [key,value] of part)out.set(key,value);
 }
 return out;
}

/** True when volume is known and > 0 (usable opportunity for South India content). */
export function hasSearchInterest(seo){
 return Boolean(seo&&seo.status==='VERIFIED'&&Number(seo.volume)>0);
}
