import {createHash,randomUUID} from 'node:crypto';
import OpenAI from 'openai';
import {HttpError,configured} from './core.mjs';
import {keywordOpportunity,hasSearchInterest,dataforseoConfigured} from './dataforseo.mjs';
import {pagePreview} from './akay-preview.mjs';
import {istParts,pulseSlotFor,normalizeTitle,isNearParaphrase,slugHint as baseSlug} from './south-pulse.mjs';

export const STYLE_LANES=[
 'hindu_traditional',
 'spiritual_ritual',
 'regional_culture',
 'romantic_ai_couple',
 'movie_poster_couple',
 'creative_ai',
 'modern_minimal'
];
export const STYLE_PULSE_SLOTS={
 morning:{primary:['hindu_traditional','spiritual_ritual'],supporting:['regional_culture']},
 afternoon:{primary:['romantic_ai_couple','movie_poster_couple'],supporting:['creative_ai']},
 evening:{primary:['creative_ai','modern_minimal'],supporting:['regional_culture','hindu_traditional']}
};
export const STYLE_TARGET_MIN=25;
export const STYLE_BATCH_SIZE=15;
export const STYLE_MAX_BATCHES=3;
const JACCARD_REJECT=0.55;

export function styleLaneMix(slot){
 const plan=STYLE_PULSE_SLOTS[slot]||STYLE_PULSE_SLOTS.morning;
 return [...plan.primary,...plan.supporting];
}

export function styleFingerprint(styleName,lane){
 return createHash('sha256').update(normalizeTitle(styleName)+'|'+String(lane||'')).digest('hex');
}

export function styleSlugHint(name){
 return baseSlug(name);
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
  console.error('Inspiration queue REST failed',response.status,path);
  throw new HttpError(503,'Could not reach the inspiration queue.');
 }
 return data;
}

export async function loadBlogSeeds({limit=40}={}){
 const rows=await rest('blog_topic_queue?select=title,primary_keyword,status&status=in.(queued,approved)&order=updated_at.desc&limit='+limit);
 const list=Array.isArray(rows)?rows:[];
 const keywords=[];
 const titles=[];
 for(const row of list){
  if(row.primary_keyword)keywords.push(String(row.primary_keyword).trim());
  if(row.title)titles.push(String(row.title).trim());
 }
 return {
  keywords:[...new Set(keywords.filter(Boolean))].slice(0,40),
  titles:titles.slice(0,40),
  count:list.length
 };
}

export async function loadStyleNoveltyCorpus(){
 const [queue]=await Promise.all([
  rest('inspiration_queue?select=id,style_name,status&status=in.(queued,approved,published)&limit=800')
 ]);
 const rows=Array.isArray(queue)?queue:[];
 return {names:rows.map(r=>r.style_name).filter(Boolean),queued:rows};
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

export function buildStylePulsePrompt({slot,date,lanes,existingNames,blogKeywords,blogTitles,targetCount=STYLE_BATCH_SIZE,batchIndex=1,batchTotal=1}){
 const avoid=existingNames.slice(0,60).map((t,i)=>`${i+1}. ${t}`).join('\n')||'(queue empty)';
 const seeds=(blogKeywords.length?blogKeywords:blogTitles).slice(0,30).map((t,i)=>`${i+1}. ${t}`).join('\n')||'(no blog seeds yet — invent from South Indian culture)';
 return [
  'You are Style Pulse for FindMyInvite — South India invitation DESIGN STYLE research for SKU variations.',
  'Geography lock: Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Kerala and metros. Never Worldwide or North-India-only.',
  `Pulse slot: ${slot}. IST date: ${date}. Invent batch ${batchIndex}/${batchTotal}.`,
  `Style lanes to cover: ${lanes.join(', ')}.`,
  'Goal: identify trending visual styles so FMI templates can be restyled into multiple SKUs.',
  'Lanes mean: hindu_traditional, spiritual_ritual, regional_culture, romantic_ai_couple, movie_poster_couple, creative_ai, modern_minimal.',
  'Return STRICT JSON only:',
  '{"limitations":string[],"styles":[{"style_name":string,"primary_keyword":string,"lanes":string[],"angle":string,"evidence_summary":string,"reference_urls":string[],"ai_prompt":string,"sku_hint":string,"blog_seed_keywords":string[],"validation":"SUPPORTED"|"REVISE"|"INSUFFICIENT_DATA"}]}',
  'Rules:',
  `- Return exactly ${targetCount} styles in this batch (not fewer).`,
  '- style_name must be NEW — not duplicates/paraphrases of existing names below.',
  '- Use blog seed keywords/titles when possible; set blog_seed_keywords to the seeds you used.',
  '- primary_keyword: short 2–5 word search phrase for the visual style (hosts / designers might type).',
  '- ai_prompt: a concrete image-generation prompt for a South Indian wedding couple / invitation moodboard in that style (no celebrity real names).',
  '- sku_hint: short catalogue SKU label e.g. "temple-gold-kanjivaram-v1".',
  '- reference_urls: 3–6 real http(s) URLs to public mood/reference pages when known (Pinterest pin, Unsplash, Wikimedia); else [] and validation REVISE.',
  '- Prefer REVISE over INSUFFICIENT_DATA when the style is usable but refs are thin.',
  '- Never invent metrics, follower counts, or rankings.',
  '- Soft note: Pinterest Trends API is unavailable; do not claim live Pinterest ranks.',
  '',
  'Blog seeds (titles/keywords from South Pulse queue):',
  seeds,
  '',
  'Existing style names to avoid:',
  avoid
 ].join('\n');
}

export async function researchStyles({slot,date,lanes,existingNames,blogKeywords,blogTitles,openaiClient,targetCount=STYLE_BATCH_SIZE,batchIndex=1,batchTotal=1}){
 if(!process.env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured.');
 const client=openaiClient||new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:90000,maxRetries:1});
 const prompt=buildStylePulsePrompt({slot,date,lanes,existingNames,blogKeywords,blogTitles,targetCount,batchIndex,batchTotal});
 let response;
 try{
  response=await client.responses.create({
   model:process.env.STYLE_PULSE_MODEL||process.env.BLOG_PULSE_MODEL||'gpt-4.1-mini',
   input:prompt
  });
 }catch(error){
  console.error('Style Pulse OpenAI failed',error?.message||error);
  throw new HttpError(502,'Style research service failed.');
 }
 const parsed=parseModelJson(extractOutputText(response));
 if(!parsed||!Array.isArray(parsed.styles))throw new HttpError(502,'Style research returned unusable JSON.');
 const limitations=Array.isArray(parsed.limitations)?parsed.limitations.map(String).slice(0,20):[];
 const cap=Math.max(targetCount,STYLE_BATCH_SIZE);
 const styles=parsed.styles.slice(0,cap).map(row=>({
  style_name:String(row.style_name||'').trim().slice(0,160),
  primary_keyword:String(row.primary_keyword||'').trim().slice(0,80),
  lanes:(Array.isArray(row.lanes)?row.lanes:[]).map(String).filter(l=>STYLE_LANES.includes(l)).slice(0,4),
  angle:String(row.angle||'').trim().slice(0,400),
  evidence_summary:String(row.evidence_summary||'').trim().slice(0,600),
  reference_urls:(Array.isArray(row.reference_urls)?row.reference_urls:[]).map(u=>String(u||'').trim()).filter(u=>/^https?:\/\//i.test(u)).slice(0,6),
  ai_prompt:String(row.ai_prompt||'').trim().slice(0,1200),
  sku_hint:String(row.sku_hint||'').trim().slice(0,80),
  blog_seed_keywords:(Array.isArray(row.blog_seed_keywords)?row.blog_seed_keywords:[]).map(String).map(s=>s.trim()).filter(Boolean).slice(0,6),
  validation:['SUPPORTED','REVISE','INSUFFICIENT_DATA'].includes(row.validation)?row.validation:'REVISE'
 })).filter(t=>t.style_name&&t.primary_keyword&&t.ai_prompt);
 return {styles,limitations};
}

export function filterNovelStyles(styles,existingNames,{softEvidence=true}={}){
 const accepted=[];
 const skipped=[];
 const seen=[...existingNames];
 for(const style of styles){
  if(!softEvidence&&style.validation==='INSUFFICIENT_DATA'){
   skipped.push({title:style.style_name,reason:'insufficient_evidence'});
   continue;
  }
  if(isNearParaphrase(style.style_name,seen,{threshold:JACCARD_REJECT})){
   skipped.push({title:style.style_name,reason:'near_paraphrase'});
   continue;
  }
  seen.push(style.style_name);
  accepted.push(style);
 }
 return {accepted,skipped};
}

export async function enrichStylesWithSeo(styles,{fetchImpl=fetch,env=process.env}={}){
 if(!styles.length)return {styles:[],limitations:[]};
 if(!dataforseoConfigured(env)){
  return {styles:styles.map(t=>({...t,seo:null})),limitations:['DATAFORSEO_NOT_CONFIGURED — SEO soft-skipped.']};
 }
 try{
  const map=await keywordOpportunity(styles.map(t=>t.primary_keyword),{fetchImpl,env});
  const enriched=[];
  let lowVolume=0;
  let missingSeo=0;
  for(const style of styles){
   const seo=map.get(style.primary_keyword.toLowerCase())||null;
   if(seo&&!hasSearchInterest(seo)){lowVolume+=1;enriched.push({...style,seo});continue;}
   if(!seo)missingSeo+=1;
   enriched.push({...style,seo});
  }
  const limitations=[];
  if(lowVolume)limitations.push('Low/zero Ads volume (kept): '+lowVolume+' style keywords');
  if(missingSeo)limitations.push('INSUFFICIENT_DATA SEO (kept): '+missingSeo+' style keywords');
  return {styles:enriched,limitations};
 }catch(error){
  return {
   styles:styles.map(t=>({...t,seo:null})),
   limitations:['SEO_GATE_SOFT_FAIL: '+(error instanceof HttpError?error.message:'DataForSEO unavailable')]
  };
 }
}

/** Soft Pinterest gate — partner Trends API not affordable; always note and continue. */
export function applyPinterestSoftGate(env=process.env){
 if(env.PINTEREST_ACCESS_TOKEN){
  return {limitations:['PINTEREST_TOKEN_PRESENT but Trends partner access not wired in v1 — soft-skipped.']};
 }
 return {limitations:['PINTEREST_TRENDS_SOFT_SKIP — no partner token; styles seeded from blog queue + DataForSEO + South India culture invent.']};
}

export async function collectStyleCandidates({slot,date,lanes,existingNames,blogKeywords,blogTitles,openaiClient,target=STYLE_TARGET_MIN,batchSize=STYLE_BATCH_SIZE,maxBatches=STYLE_MAX_BATCHES}){
 const pool=[];
 const skipped=[];
 const limitations=[];
 const avoid=[...existingNames];
 let batches=0;
 while(pool.length<target&&batches<maxBatches){
  batches+=1;
  const remaining=target-pool.length;
  const need=Math.min(batchSize,Math.max(remaining+3,10));
  const researched=await researchStyles({
   slot,date,lanes,existingNames:avoid,blogKeywords,blogTitles,openaiClient,
   targetCount:need,batchIndex:batches,batchTotal:maxBatches
  });
  limitations.push(...researched.limitations);
  if(researched.styles.length<need)limitations.push('Batch '+batches+' returned '+researched.styles.length+'/'+need+' styles.');
  const novel=filterNovelStyles(researched.styles,avoid,{softEvidence:true});
  skipped.push(...novel.skipped);
  for(const style of novel.accepted){
   pool.push(style);
   avoid.push(style.style_name);
   if(pool.length>=target)break;
  }
 }
 if(pool.length<target)limitations.push('Below invent target after '+batches+' batches: '+pool.length+'/'+target+' novel styles.');
 else limitations.push('Invent complete: '+pool.length+' novel styles across '+batches+' batch(es); target '+target+'.');
 return {styles:pool,skipped,limitations,batches};
}

export async function runStylePulse({now=new Date(),openaiClient,fetchImpl=fetch,env=process.env,forceSlot,force=false,targetMin=STYLE_TARGET_MIN}={}){
 const {date}=istParts(now);
 const slot=forceSlot&&STYLE_PULSE_SLOTS[forceSlot]?forceSlot:pulseSlotFor(now);
 const lanes=styleLaneMix(slot);
 const limitations=[];

 if(force){
  await rest('inspiration_pulse_runs?pulse_date=eq.'+encodeURIComponent(date)+'&pulse_slot=eq.'+encodeURIComponent(slot),{
   method:'DELETE',prefer:'return=minimal'
  });
  limitations.push('Forced re-run: cleared prior '+slot+' style pulse for '+date+'.');
 }

 let run;
 try{
  run=await rest('inspiration_pulse_runs',{
   method:'POST',
   body:{pulse_slot:slot,pulse_date:date,started_at:new Date().toISOString()},
   conflict:'This style pulse slot already ran today.'
  });
 }catch(error){
  if(error instanceof HttpError&&error.status===409){
   return {ok:true,slot,date,inserted:0,skipped:0,limitations:['Style pulse already completed for this IST slot. Use Force re-run.'],duplicate:true};
  }
  throw error;
 }
 const runRow=Array.isArray(run)?run[0]:run;
 const runId=runRow?.id||randomUUID();

 try{
  const seeds=await loadBlogSeeds();
  if(!seeds.count)limitations.push('No blog queue seeds yet — inventing from South India culture only.');
  else limitations.push('Blog seeds loaded: '+seeds.count+' topics ('+seeds.keywords.length+' keywords).');
  limitations.push(...applyPinterestSoftGate(env).limitations);
  limitations.push('No worldwide or North-India-only styles; South India culture / spiritual / romantic / creative AI only.');

  const corpus=await loadStyleNoveltyCorpus();
  const collected=await collectStyleCandidates({
   slot,date,lanes,
   existingNames:corpus.names,
   blogKeywords:seeds.keywords,
   blogTitles:seeds.titles,
   openaiClient,
   target:targetMin
  });
  limitations.push(...collected.limitations);
  const seo=await enrichStylesWithSeo(collected.styles,{fetchImpl,env});
  limitations.push(...seo.limitations);
  limitations.push(...collected.skipped.slice(0,12).map(s=>'Skipped '+s.title+': '+s.reason));
  if(collected.skipped.length>12)limitations.push('…and '+(collected.skipped.length-12)+' more novelty skips.');

  let inserted=0;
  const skippedRows=[...collected.skipped];
  for(const style of seo.styles){
   const primaryLane=style.lanes[0]||lanes[0];
   const row={
    style_name:style.style_name,
    slug_hint:styleSlugHint(style.style_name),
    primary_keyword:style.primary_keyword,
    style_lanes:style.lanes.length?style.lanes:lanes.slice(0,2),
    angle:style.angle||'South India invitation style variation.',
    evidence_summary:style.evidence_summary||'',
    reference_urls:style.reference_urls,
    ai_prompt:style.ai_prompt,
    sku_hint:style.sku_hint||styleSlugHint(style.style_name),
    blog_seed_keywords:style.blog_seed_keywords.length?style.blog_seed_keywords:seeds.keywords.slice(0,3),
    seo_volume:style.seo?.volume??null,
    seo_competition:style.seo?.competition??null,
    seo_locale:'south_india',
    pulse_slot:slot,
    pulse_date:date,
    fingerprint:styleFingerprint(style.style_name,primaryLane),
    status:'queued',
    run_id:runId
   };
   try{
    await rest('inspiration_queue',{method:'POST',body:row,conflict:'duplicate fingerprint'});
    inserted+=1;
   }catch(error){
    if(error instanceof HttpError&&error.status===409){
     skippedRows.push({title:row.style_name,reason:'duplicate_fingerprint'});
     continue;
    }
    throw error;
   }
  }

  const skipped=skippedRows.length;
  if(inserted<targetMin)limitations.push('Below insert target: '+inserted+'/'+targetMin+' inspirations this pulse.');
  else limitations.push('Insert target met: '+inserted+'/'+targetMin+'.');

  await rest('inspiration_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),inserted_count:inserted,skipped_count:skipped,limitations}
  });
  return {ok:true,slot,date,runId,inserted,skipped,limitations,target:targetMin,duplicate:false};
 }catch(error){
  await rest('inspiration_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),error:error instanceof Error?error.message:'Style pulse failed',limitations}
  }).catch(()=>{});
  throw error;
 }
}

export function mapInspirationItem(row){
 const urls=Array.isArray(row.reference_urls)?row.reference_urls.filter(u=>/^https?:\/\//i.test(String(u||''))):[];
 return {
  id:row.id,
  style_name:row.style_name||'',
  slug_hint:row.slug_hint||'',
  primary_keyword:row.primary_keyword||'',
  style_lanes:Array.isArray(row.style_lanes)?row.style_lanes:[],
  angle:row.angle||'',
  evidence_summary:row.evidence_summary||'',
  reference_urls:urls,
  preview:pagePreview(urls[0]||''),
  ai_prompt:row.ai_prompt||'',
  sku_hint:row.sku_hint||'',
  blog_seed_keywords:Array.isArray(row.blog_seed_keywords)?row.blog_seed_keywords:[],
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
