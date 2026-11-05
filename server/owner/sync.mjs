import {randomBytes} from 'node:crypto';
import {HttpError} from '../core.mjs';
import {get,save,list} from './store.mjs';
import {hashToken} from './auth.mjs';
import {providerJson,providerAccess,providerDay,providers} from './integrations.mjs';

// Commit complete replacement datasets only after pagination succeeds.
export async function searchDay(connection,date,token,request=providerJson){
 const url='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(connection.account)+'/searchAnalytics/query';
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const query=body=>request(url,{method:'POST',headers,body:JSON.stringify({startDate:date,endDate:date,dataState:'all',type:'web',...body})});
 const summary=await query({dimensions:['date'],rowLimit:25000});let rows=[],startRow=0,limited=false;
 for(let p=0;p<4;p++){const batch=await query({dimensions:['query','page','device','country'],rowLimit:25000,startRow});rows.push(...(batch.rows||[]));if((batch.rows||[]).length<25000)break;startRow+=25000;if(p===3)limited=true;}
 const first=summary.metadata?.first_incomplete_date;
 return {provider:'Search Console',account:connection.account,date,timezone:'America/Los_Angeles',complete:!!summary.rows?.length&&(!first||date<first),limited,totals:summary.rows?.[0]||null,rows:rows.map(r=>({query:r.keys[0],page:r.keys[1],device:r.keys[2],country:r.keys[3],clicks:r.clicks,impressions:r.impressions,position:r.position})),note:'Provider top query rows; anonymized queries can be omitted. Totals are fetched separately.'};
}
export async function adsDay(connection,date,token,request=providerJson){
 const {provider,account}=connection,scale=10**new Intl.NumberFormat('en',{style:'currency',currency:connection.currency}).resolvedOptions().maximumFractionDigits;let rows=[];
 if(provider==='Meta'){
  let after='';
  for(let p=0;p<100;p++){
   const u=new URL('https://graph.facebook.com/'+(process.env.FMI_META_API_VERSION||'v26.0')+'/'+account+'/insights');
   u.search=new URLSearchParams({fields:'campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,purchase_roas',level:'campaign',time_range:JSON.stringify({since:date,until:date}),limit:'500',...(after?{after}:{})}).toString();
   const result=await request(u,{headers:{Authorization:'Bearer '+token}});
   rows.push(...(result.data||[]).map(r=>({campaignId:r.campaign_id,name:r.campaign_name,spend:Math.round(Number(r.spend)*scale),impressions:Number(r.impressions),clicks:Number(r.clicks),conversions:Number(r.actions?.find(a=>a.action_type==='purchase')?.value||0),conversionValue:Math.round(Number(r.action_values?.find(a=>a.action_type==='purchase')?.value||0)*scale),roas:Number(r.purchase_roas?.find(a=>a.action_type==='omni_purchase')?.value||0)})));
   if(!result.paging?.next)break;after=result.paging?.cursors?.after;if(!after||p===99)throw new HttpError(502,'Provider pagination was incomplete. Previous data retained.');
  }
 }else{
  if(!/^\d+$/.test(account))throw new HttpError(400,'Invalid ad account.');
  const headers={Authorization:'Bearer '+token,'developer-token':process.env.FMI_GOOGLE_ADS_DEVELOPER_TOKEN,'Content-Type':'application/json',...(process.env.FMI_GOOGLE_ADS_MANAGER_ID?{'login-customer-id':process.env.FMI_GOOGLE_ADS_MANAGER_ID}:{})};
  let pageToken='';
  for(let p=0;p<100;p++){
   const result=await request('https://googleads.googleapis.com/'+(process.env.FMI_GOOGLE_ADS_API_VERSION||'v26')+'/customers/'+account+'/googleAds:search',{method:'POST',headers,body:JSON.stringify({query:`SELECT campaign.id,campaign.name,metrics.cost_micros,metrics.impressions,metrics.clicks,metrics.conversions,metrics.conversions_value FROM campaign WHERE segments.date = '${date}'`,...(pageToken?{pageToken}:{})})});
   rows.push(...(result.results||[]).map(r=>({campaignId:r.campaign.id,name:r.campaign.name,spend:Math.round(Number(r.metrics.costMicros)/1000000*scale),impressions:Number(r.metrics.impressions),clicks:Number(r.metrics.clicks),conversions:Number(r.metrics.conversions),conversionValue:Math.round(Number(r.metrics.conversionsValue)*scale)})));
   if(!result.nextPageToken)break;pageToken=result.nextPageToken;if(p===99)throw new HttpError(502,'Provider pagination was incomplete. Previous data retained.');
  }
 }
 return {provider,account,date,currency:connection.currency,timezone:connection.timezone,complete:date<providerDay(Date.now(),connection.timezone),rows,totals:rows.reduce((s,r)=>{for(const key of ['spend','impressions','clicks','conversions','conversionValue'])s[key]=(s[key]||0)+r[key];return s;},{})};
}
export async function syncProvider(provider,requester='owner'){
 if(!providers.includes(provider))throw new HttpError(400,'Unknown provider.');
 const connection=await get('connection',provider);if(connection?.status!=='Configured')throw new HttpError(409,'Choose an authorized account first.');
 const active=(await list('sync')).find(r=>r.provider===provider&&r.status==='Running'&&Date.parse(r.startedAt)>Date.now()-600000);if(active)throw new HttpError(409,'This connection is already syncing.');
 const runId=randomBytes(16).toString('hex'),run=await save('sync',runId,{provider,status:'Running',startedAt:new Date().toISOString()},0,requester,'sync.started');
 try{
  const token=await providerAccess(provider);
  for(let i=0;i<(connection.lastSuccess?7:28);i++){
   const date=providerDay(Date.now()-i*86400000,connection.timezone),data=provider==='Search Console'?await searchDay(connection,date,token):await adsDay(connection,date,token);
   const id=hashToken(provider+'|'+connection.account+'|'+date),kind=provider==='Search Console'?'search-day':'ad-day',old=await get(kind,id);
   await save(kind,id,{...data,provenance:'Provider API',receivedAt:new Date().toISOString()},old?.revision||0,requester,'sync.dataset');
  }
  const fresh=await get('connection',provider);await save('connection',provider,{...fresh,lastSuccess:new Date().toISOString(),error:''},fresh.revision,requester,'sync.success');
  await save('sync',runId,{...run,status:'Complete',finishedAt:new Date().toISOString()},run.revision,requester,'sync.complete');return {ok:true};
 }catch(e){await save('sync',runId,{...run,status:'Failed',error:e.message,finishedAt:new Date().toISOString()},run.revision,requester,'sync.failed');throw e;}
}
