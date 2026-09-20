import {createHash,randomUUID} from 'node:crypto';
import OpenAI from 'openai';
import {HttpError,configured} from './core.mjs';
import {keywordOpportunity,hasSearchInterest,dataforseoConfigured} from './dataforseo.mjs';
import {pagePreview} from './akay-preview.mjs';

export const SIGNAL_LANES=['occasion','tamil_cinema','songs','celebrity','entertainment','news'];
export const PULSE_SLOTS={
 morning:{primary:['occasion','news'],supporting:['entertainment']},
 afternoon:{primary:['tamil_cinema','songs'],supporting:['celebrity']},
 evening:{primary:['celebrity','entertainment'],supporting:['occasion','news']}
};
const STOP=new Set(['the','and','for','with','from','that','this','into','your','our','how','why','what','when','who','a','an','in','on','to','of','is','are','be','as','at','by','or','it']);
const JACCARD_REJECT=0.55;

export function istParts(now=new Date()){
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
 const parts=Object.fromEntries(fmt.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,hour:Number(parts.hour)};
}

export function pulseSlotFor(now=new Date()){
 const {hour}=istParts(now);
 if(hour<12)return 'morning';
 if(hour<18)return 'afternoon';
 return 'evening';
}

export function laneMix(slot){
 const plan=PULSE_SLOTS[slot]||PULSE_SLOTS.morning;
 return [...plan.primary,...plan.supporting];
}

export function normalizeTitle(value){
 return String(value||'').toLowerCase().replace(/[''`]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

export function titleFingerprint(title){
 return createHash('sha256').update(normalizeTitle(title)).digest('hex');
}

export function titleTokens(title){
 return normalizeTitle(title).split(' ').filter(t=>t.length>2&&!STOP.has(t));
}

export function jaccardTokens(a,b){
 const A=new Set(titleTokens(a)),B=new Set(titleTokens(b));
 if(!A.size&&!B.size)return 1;
 let inter=0;
 for(const t of A)if(B.has(t))inter+=1;
 return inter/(A.size+B.size-inter||1);
}

export function isNearParaphrase(candidate,existingTitles,{threshold=JACCARD_REJECT}={}){
 const norm=normalizeTitle(candidate);
 if(!norm)return true;
 for(const title of existingTitles){
  if(normalizeTitle(title)===norm)return true;
  if(jaccardTokens(candidate,title)>=threshold)return true;
 }
 return false;
}

export function slugHint(title){
 return normalizeTitle(title).replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,72)||'topic';
}

async function rest(path,{method='GET',body,prefer,conflict}={}){
 if(!configured())throw new HttpError(503,'Publishing is not configured yet.');
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{
  method,
  headers:{
   apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,
   Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,
   'Content-Type':'application/json',
   Prefer:prefer||'return=representation'
  },
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const raw=await response.text();
 let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
 if(!response.ok){
  if(response.status===409)throw new HttpError(409,conflict||'Conflict.');
  console.error('Blog queue REST failed',response.status,path);
  throw new HttpError(503,'Could not reach the blog queue.');
 }
 return data;
}

export async function loadNoveltyCorpus(){
 const [queue,posts]=await Promise.all([
  rest('blog_topic_queue?select=id,title,status&status=in.(queued,approved,published)&limit=500'),
  rest('blog_posts?select=slug,title&limit=200')
 ]);
 const rows=Array.isArray(queue)?queue:[];
 const blogRows=Array.isArray(posts)?posts:[];
 return {
  titles:[...rows.map(r=>r.title),...blogRows.map(r=>r.title)].filter(Boolean),
  queued:rows
 };
}

function parseModelJson(text){
 const raw=String(text||'').trim();
 const fence=raw.match(/```(?:json)?\s*([\s\S]*?)```/);
 const body=fence?fence[1].trim():raw;
 try{return JSON.parse(body);}catch{return null;}
}

function extractOutputText(response){
 if(!response)return '';
 if(typeof response.output_text==='string'&&response.output_text)return response.output_text;
 const chunks=[];
 for(const item of response.output||[]){
  for(const part of item.content||[]){
   if(part.type==='output_text'&&part.text)chunks.push(part.text);
   if(part.type==='text'&&part.text)chunks.push(part.text);
  }
 }
 return chunks.join('\n').trim();
}

export function buildPulsePrompt({slot,date,lanes,existingTitles}){
 const avoid=existingTitles.slice(0,40).map((t,i)=>`${i+1}. ${t}`).join('\n')||'(queue empty)';
 return [
  'You are South Pulse for FindMyInvite — evidence-aware blog topic research for SOUTH INDIA ONLY.',
  'Geography lock: Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Kerala and their metros. Never Worldwide or North-India-only angles.',
  `Pulse slot: ${slot}. IST date: ${date}.`,
  `Signal lanes to cover this run: ${lanes.join(', ')}.`,
  'Business niche: digital wedding invitations + South Indian wedding / celebration culture for FindMyInvite hosts.',
  'Return STRICT JSON only with shape:',
  '{"limitations":string[],"topics":[{"title":string,"primary_keyword":string,"lanes":string[],"angle":string,"evidence_summary":string,"source_urls":string[],"supports_existing_title":string|null,"validation":"SUPPORTED"|"REVISE"|"INSUFFICIENT_DATA"}]}',
  'Rules:',
  '- 6 to 8 topics max.',
  '- Topics must be NEW — not duplicates or paraphrases of existing queue/blog titles listed below.',
  '- If a topic extends an existing title, set supports_existing_title to that exact title and explain the NEW supporting angle in "angle" (never a rephrase).',
  '- Prefer live South Indian signals: wedding occasions, Tamil cinema, songs, celebrities, entertainment, regional news.',
  '- source_urls must be real http(s) URLs from research; if unknown use [] and validation INSUFFICIENT_DATA.',
  '- Never invent metrics, follower counts, or rankings.',
  '',
  'Existing titles to avoid / only support (not rephrase):',
  avoid
 ].join('\n');
}

export async function researchTopics({slot,date,lanes,existingTitles,openaiClient}){
 if(!process.env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured.');
 const client=openaiClient||new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:90000,maxRetries:1});
 const prompt=buildPulsePrompt({slot,date,lanes,existingTitles});
 let response;
 try{
  response=await client.responses.create({
   model:process.env.BLOG_PULSE_MODEL||'gpt-4.1-mini',
   tools:[{type:'web_search_preview'}],
   input:prompt
  });
 }catch(error){
  console.error('South Pulse OpenAI failed',error?.message||error);
  throw new HttpError(502,'Trend research service failed.');
 }
 const parsed=parseModelJson(extractOutputText(response));
 if(!parsed||!Array.isArray(parsed.topics))throw new HttpError(502,'Trend research returned unusable JSON.');
 const limitations=Array.isArray(parsed.limitations)?parsed.limitations.map(String).slice(0,20):[];
 const topics=parsed.topics.slice(0,8).map(row=>({
  title:String(row.title||'').trim().slice(0,160),
  primary_keyword:String(row.primary_keyword||'').trim().slice(0,80),
  lanes:(Array.isArray(row.lanes)?row.lanes:[]).map(String).filter(l=>SIGNAL_LANES.includes(l)).slice(0,4),
  angle:String(row.angle||'').trim().slice(0,400),
  evidence_summary:String(row.evidence_summary||'').trim().slice(0,600),
  source_urls:(Array.isArray(row.source_urls)?row.source_urls:[]).map(u=>String(u||'').trim()).filter(u=>/^https?:\/\//i.test(u)).slice(0,5),
  supports_existing_title:row.supports_existing_title?String(row.supports_existing_title).trim().slice(0,160):null,
  validation:['SUPPORTED','REVISE','INSUFFICIENT_DATA'].includes(row.validation)?row.validation:'INSUFFICIENT_DATA'
 })).filter(t=>t.title&&t.primary_keyword);
 return {topics,limitations};
}

export function filterNovelTopics(topics,existingTitles){
 const accepted=[];
 const skipped=[];
 const seen=[...existingTitles];
 for(const topic of topics){
  if(topic.validation==='INSUFFICIENT_DATA'){skipped.push({title:topic.title,reason:'insufficient_evidence'});continue;}
  if(isNearParaphrase(topic.title,seen)){skipped.push({title:topic.title,reason:'near_paraphrase'});continue;}
  seen.push(topic.title);
  accepted.push(topic);
 }
 return {accepted,skipped};
}

export async function enrichWithSeo(topics,{fetchImpl=fetch,env=process.env}={}){
 if(!topics.length)return {topics:[],limitations:[]};
 if(!dataforseoConfigured(env)){
  return {topics:topics.map(t=>({...t,seo:null})),limitations:['DATAFORSEO_NOT_CONFIGURED — SEO gate soft-skipped; topics kept with seo null.']};
 }
 try{
  const map=await keywordOpportunity(topics.map(t=>t.primary_keyword),{fetchImpl,env});
  const enriched=[];
  const limitations=[];
  for(const topic of topics){
   const seo=map.get(topic.primary_keyword.toLowerCase())||null;
   if(seo&&!hasSearchInterest(seo)){
    limitations.push('Rejected SEO: '+topic.primary_keyword+' (no South India search interest).');
    continue;
   }
   if(!seo)limitations.push('INSUFFICIENT_DATA SEO for keyword: '+topic.primary_keyword);
   enriched.push({...topic,seo});
  }
  return {topics:enriched,limitations};
 }catch(error){
  return {
   topics:topics.map(t=>({...t,seo:null})),
   limitations:['SEO_GATE_SOFT_FAIL: '+(error instanceof HttpError?error.message:'DataForSEO unavailable')]
  };
 }
}

function resolveSupportsId(topic,queued){
 if(!topic.supports_existing_title)return null;
 const hit=queued.find(row=>normalizeTitle(row.title)===normalizeTitle(topic.supports_existing_title));
 return hit?.id||null;
}

export async function runSouthPulse({now=new Date(),openaiClient,fetchImpl=fetch,env=process.env,forceSlot}={}){
 const {date}=istParts(now);
 const slot=forceSlot&&PULSE_SLOTS[forceSlot]?forceSlot:pulseSlotFor(now);
 const lanes=laneMix(slot);
 const limitations=[];

 let run;
 try{
  run=await rest('blog_pulse_runs',{
   method:'POST',
   body:{pulse_slot:slot,pulse_date:date,started_at:new Date().toISOString()},
   conflict:'This pulse slot already ran today.'
  });
 }catch(error){
  if(error instanceof HttpError&&error.status===409){
   return {ok:true,slot,date,inserted:0,skipped:0,limitations:['Pulse already completed for this IST slot.'],duplicate:true};
  }
  throw error;
 }
 const runRow=Array.isArray(run)?run[0]:run;
 const runId=runRow?.id||randomUUID();

 try{
  const corpus=await loadNoveltyCorpus();
  const researched=await researchTopics({slot,date,lanes,existingTitles:corpus.titles,openaiClient});
  limitations.push(...researched.limitations);
  const novel=filterNovelTopics(researched.topics,corpus.titles);
  const seo=await enrichWithSeo(novel.accepted,{fetchImpl,env});
  limitations.push(...seo.limitations);
  limitations.push(...novel.skipped.map(s=>'Skipped '+s.title+': '+s.reason));

  let inserted=0;
  const skippedRows=[...novel.skipped];
  for(const topic of seo.topics){
   const row={
    title:topic.title,
    slug_hint:slugHint(topic.title),
    primary_keyword:topic.primary_keyword,
    signal_lanes:topic.lanes.length?topic.lanes:lanes.slice(0,2),
    supports_topic_id:resolveSupportsId(topic,corpus.queued),
    angle:topic.angle||'Supporting South India invitation angle.',
    evidence_summary:topic.evidence_summary||'',
    source_urls:topic.source_urls,
    seo_volume:topic.seo?.volume??null,
    seo_competition:topic.seo?.competition??null,
    seo_locale:'south_india',
    pulse_slot:slot,
    pulse_date:date,
    fingerprint:titleFingerprint(topic.title),
    status:'queued',
    run_id:runId
   };
   try{
    await rest('blog_topic_queue',{method:'POST',body:row,conflict:'duplicate fingerprint'});
    inserted+=1;
   }catch(error){
    if(error instanceof HttpError&&error.status===409){
     skippedRows.push({title:row.title,reason:'duplicate_fingerprint'});
     continue;
    }
    throw error;
   }
  }

  const skipped=skippedRows.length;
  await rest('blog_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),inserted_count:inserted,skipped_count:skipped,limitations}
  });

  return {ok:true,slot,date,runId,inserted,skipped,limitations,duplicate:false};
 }catch(error){
  await rest('blog_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),error:error instanceof Error?error.message:'Pulse failed',limitations}
  }).catch(()=>{});
  throw error;
 }
}

export function mapQueueItem(row){
 const urls=Array.isArray(row.source_urls)?row.source_urls.filter(u=>/^https?:\/\//i.test(String(u||''))):[];
 return {
  id:row.id,
  title:row.title||'',
  slug_hint:row.slug_hint||'',
  primary_keyword:row.primary_keyword||'',
  signal_lanes:Array.isArray(row.signal_lanes)?row.signal_lanes:[],
  supports_topic_id:row.supports_topic_id||null,
  angle:row.angle||'',
  evidence_summary:row.evidence_summary||'',
  source_urls:urls,
  preview:pagePreview(urls[0]||''),
  seo_volume:row.seo_volume??null,
  seo_competition:row.seo_competition??null,
  seo_locale:row.seo_locale||'south_india',
  pulse_slot:row.pulse_slot||'',
  pulse_date:row.pulse_date||'',
  fingerprint:row.fingerprint||'',
  status:row.status||'queued',
  run_id:row.run_id||null,
  created_at:row.created_at,
  updated_at:row.updated_at
 };
}
