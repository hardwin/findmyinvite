import {createHash,randomUUID} from 'node:crypto';
import OpenAI from 'openai';
import {HttpError,configured} from './core.mjs';
import {keywordOpportunity,hasSearchInterest,dataforseoConfigured} from './dataforseo.mjs';
import {istParts,pulseSlotFor,normalizeTitle,isNearParaphrase,slugHint as baseSlug} from './south-pulse.mjs';

export const STYLE_LANES=[
 'hindu_traditional',
 'spiritual_ritual',
 'regional_culture',
 'romantic_ai_couple',
 'movie_poster_couple'
];
/** Kept only when romantic/cute-couple OR traditional — skip creative/modern/food noise. */
export const STYLE_LANES_ALLOWED=new Set(STYLE_LANES);
export const STYLE_PULSE_SLOTS={
 morning:{primary:['hindu_traditional','spiritual_ritual'],supporting:['regional_culture']},
 afternoon:{primary:['romantic_ai_couple','movie_poster_couple'],supporting:['hindu_traditional']},
 evening:{primary:['romantic_ai_couple','regional_culture'],supporting:['spiritual_ritual','hindu_traditional']}
};
export const STYLE_TARGET_MIN=25;
export const STYLE_BATCH_SIZE=15;
export const STYLE_MAX_BATCHES=3;
const JACCARD_REJECT=0.55;
const HALLUCINATED_PIN=/pinterest\.com\/pin\/\d+/i;
const SKIP_STYLE_WORDS=/\b(food|culinary|biryani|feast|recipe|menu|dessert|cafe|restaurant)\b/i;

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

/** Collapse duplicated "wedding invitation" and build a single clean search phrase. */
export function buildStyleSearchQuery({primary_keyword,style_name}={}){
 let q=String(primary_keyword||style_name||'south indian wedding').trim().replace(/\s+/g,' ');
 if(!q)return 'south indian wedding';
 // Collapse consecutive "wedding invitation(s)" → one phrase (fixes Yakshagana wedding invitation wedding invitation …)
 q=q.replace(/(?:\bwedding\s+invitations?\b\s*)+/gi,'wedding invitation ').replace(/\s+/g,' ').trim();
 // Drop filler SEO fluff that bloated older Pinterest URLs
 q=q.replace(/\b(aesthetic|moodboard|vibes?|inspo)\b/gi,' ').replace(/\s+/g,' ').trim();
 if(!/\b(wedding|invite|invitation|couple|bride|groom|mandap|temple|mehendi|sangeet)\b/i.test(q)){
  q=q+' wedding invite';
 }
 return q.slice(0,80);
}

/** Deterministic Pinterest search only — never invent /pin/{id}; no Unsplash (bot-blocked). */
export function buildStyleReferenceUrls({primary_keyword,style_name}={}){
 const q=buildStyleSearchQuery({primary_keyword,style_name});
 if(!q)return [];
 return ['https://www.pinterest.com/search/pins/?q='+encodeURIComponent(q)];
}

export function isEligibleStyleLane(lanes){
 const list=Array.isArray(lanes)?lanes:[];
 return list.some(l=>STYLE_LANES_ALLOWED.has(l));
}

export function isEligibleStyleContent(style){
 const blob=[style?.style_name,style?.primary_keyword,style?.angle,style?.sku_hint].filter(Boolean).join(' ');
 if(SKIP_STYLE_WORDS.test(blob))return false;
 return isEligibleStyleLane(style?.lanes||style?.style_lanes);
}

export function sanitizeReferenceUrls(urls){
 return (Array.isArray(urls)?urls:[])
  .map(u=>String(u||'').trim())
  .filter(u=>/^https?:\/\//i.test(u))
  .filter(u=>!HALLUCINATED_PIN.test(u))
  .slice(0,6);
}

export function resolveBlogSeed(style,seeds){
 const list=Array.isArray(seeds)?seeds:[];
 const wanted=normalizeTitle(style.blog_title||'');
 if(wanted){
  const exact=list.find(s=>normalizeTitle(s.title)===wanted);
  if(exact)return exact;
 }
 const kw=(style.blog_seed_keywords||[]).map(k=>normalizeTitle(k)).filter(Boolean);
 for(const seed of list){
  const titleN=normalizeTitle(seed.title);
  const keyN=normalizeTitle(seed.primary_keyword);
  if(kw.some(k=>k&&(titleN.includes(k)||keyN.includes(k)||k.includes(keyN))))return seed;
 }
 return null;
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

export async function loadBlogSeeds({limit=50}={}){
 const rows=await rest('blog_topic_queue?select=id,title,primary_keyword,status&status=in.(queued,approved)&order=updated_at.desc&limit='+limit);
 const list=(Array.isArray(rows)?rows:[]).map(row=>({
  id:row.id,
  title:String(row.title||'').trim(),
  primary_keyword:String(row.primary_keyword||'').trim()
 })).filter(r=>r.id&&r.title);
 return {
  topics:list,
  keywords:[...new Set(list.map(r=>r.primary_keyword).filter(Boolean))].slice(0,50),
  titles:list.map(r=>r.title),
  count:list.length
 };
}

export async function loadStyleNoveltyCorpus(){
 const queue=await rest('inspiration_queue?select=id,style_name,status&status=in.(queued,approved,published)&limit=800');
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

export function buildStylePulsePrompt({slot,date,lanes,existingNames,blogTopics,targetCount=STYLE_BATCH_SIZE,batchIndex=1,batchTotal=1}){
 const avoid=existingNames.slice(0,60).map((t,i)=>`${i+1}. ${t}`).join('\n')||'(queue empty)';
 const seeds=blogTopics.slice(0,40).map((t,i)=>`${i+1}. [${t.id}] ${t.title} · keyword: ${t.primary_keyword||'—'}`).join('\n')||'(no blog seeds — STOP and return empty styles with a limitation)';
 return [
  'You are Style Pulse for FindMyInvite — South India invitation DESIGN STYLE research for SKU variations.',
  'Geography lock: Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Kerala and metros. Never Worldwide or North-India-only.',
  `Pulse slot: ${slot}. IST date: ${date}. Invent batch ${batchIndex}/${batchTotal}.`,
  `Style lanes to cover: ${lanes.join(', ')}.`,
  'Goal: one INVITATION visual style per blog seed — ONLY romantic/cute couple looks OR traditional South Indian wedding looks.',
  'ALLOWED lanes only: hindu_traditional, spiritual_ritual, regional_culture, romantic_ai_couple, movie_poster_couple.',
  'SKIP / never invent: creative_ai, modern_minimal, food, culinary, biryani, feast, festival-only, abstract art — unless romantic couple OR traditional wedding invite.',
  'Return STRICT JSON only:',
  '{"limitations":string[],"styles":[{"style_name":string,"primary_keyword":string,"lanes":string[],"angle":string,"evidence_summary":string,"ai_prompt":string,"sku_hint":string,"blog_title":string,"blog_seed_keywords":string[],"validation":"SUPPORTED"|"REVISE"|"INSUFFICIENT_DATA"}]}',
  'Rules:',
  `- Return exactly ${targetCount} styles (or fewer only if fewer unused blog seeds remain).`,
  '- EVERY style MUST set blog_title to the EXACT title string from the blog seed list below (copy-paste exact).',
  '- Prefer one style per blog seed; do not reuse the same blog_title twice in this batch.',
  '- style_name must describe an INVITATION / couple visual style derived from that blog title — romantic couple OR traditional ritual/temple/silk.',
  '- primary_keyword: short 2–5 word phrase; include "wedding invitation" at most once; never append "aesthetic".',
  '- ai_prompt: concrete image-gen prompt for South Indian wedding couple OR traditional invitation look (no real celebrity names).',
  '- sku_hint: short catalogue label e.g. "iyengar-kanjivaram-v1".',
  '- Do NOT invent reference_urls or Pinterest pin IDs — the server attaches search URLs.',
  '- Never invent metrics, follower counts, or rankings.',
  '- Soft note: Pinterest Trends API is unavailable; do not claim live Pinterest ranks.',
  '',
  'Blog seeds (must backlink via blog_title):',
  seeds,
  '',
  'Existing style names to avoid:',
  avoid
 ].join('\n');
}

export async function researchStyles({slot,date,lanes,existingNames,blogTopics,openaiClient,targetCount=STYLE_BATCH_SIZE,batchIndex=1,batchTotal=1}){
 if(!process.env.OPENAI_API_KEY)throw new HttpError(503,'OpenAI is not configured.');
 if(!blogTopics?.length)return {styles:[],limitations:['No blog queue seeds — Style Pulse requires blog titles to backlink.']};
 const client=openaiClient||new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:90000,maxRetries:1});
 const prompt=buildStylePulsePrompt({slot,date,lanes,existingNames,blogTopics,targetCount,batchIndex,batchTotal});
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
  reference_urls:[],
  ai_prompt:String(row.ai_prompt||'').trim().slice(0,1200),
  sku_hint:String(row.sku_hint||'').trim().slice(0,80),
  blog_title:String(row.blog_title||'').trim().slice(0,200),
  blog_seed_keywords:(Array.isArray(row.blog_seed_keywords)?row.blog_seed_keywords:[]).map(String).map(s=>s.trim()).filter(Boolean).slice(0,6),
  validation:['SUPPORTED','REVISE','INSUFFICIENT_DATA'].includes(row.validation)?row.validation:'REVISE'
 })).filter(t=>t.style_name&&t.primary_keyword&&t.ai_prompt&&t.blog_title);
 return {styles,limitations};
}

export function filterNovelStyles(styles,existingNames,{softEvidence=true}={}){
 const accepted=[];
 const skipped=[];
 const seen=[...existingNames];
 const seenBlog=new Set();
 for(const style of styles){
  if(!isEligibleStyleContent(style)){
   skipped.push({title:style.style_name,reason:'not_romantic_or_traditional'});
   continue;
  }
  if(!softEvidence&&style.validation==='INSUFFICIENT_DATA'){
   skipped.push({title:style.style_name,reason:'insufficient_evidence'});
   continue;
  }
  if(isNearParaphrase(style.style_name,seen,{threshold:JACCARD_REJECT})){
   skipped.push({title:style.style_name,reason:'near_paraphrase'});
   continue;
  }
  const blogKey=normalizeTitle(style.blog_title||'');
  if(blogKey&&seenBlog.has(blogKey)){
   skipped.push({title:style.style_name,reason:'duplicate_blog_backlink'});
   continue;
  }
  if(blogKey)seenBlog.add(blogKey);
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

export function applyPinterestSoftGate(env=process.env){
 if(env.PINTEREST_ACCESS_TOKEN){
  return {limitations:['PINTEREST_TOKEN_PRESENT but Trends partner access not wired — using search URLs only (no invented pin IDs).']};
 }
 return {limitations:['PINTEREST_TRENDS_SOFT_SKIP — attaching deterministic Pinterest search URLs; never invent /pin/{id}.']};
}

export async function collectStyleCandidates({slot,date,lanes,existingNames,blogTopics,openaiClient,target=STYLE_TARGET_MIN,batchSize=STYLE_BATCH_SIZE,maxBatches=STYLE_MAX_BATCHES}){
 const pool=[];
 const skipped=[];
 const limitations=[];
 const avoid=[...existingNames];
 const usedBlog=new Set();
 let batches=0;
 const hardTarget=Math.min(target,Math.max(blogTopics.length,1));
 while(pool.length<hardTarget&&batches<maxBatches){
  batches+=1;
  const remaining=hardTarget-pool.length;
  const need=Math.min(batchSize,Math.max(remaining+2,8));
  const openSeeds=blogTopics.filter(t=>!usedBlog.has(normalizeTitle(t.title)));
  if(!openSeeds.length){
   limitations.push('All blog seeds already backlinked in this pulse.');
   break;
  }
  const researched=await researchStyles({
   slot,date,lanes,existingNames:avoid,blogTopics:openSeeds,openaiClient,
   targetCount:Math.min(need,openSeeds.length),batchIndex:batches,batchTotal:maxBatches
  });
  limitations.push(...researched.limitations);
  const novel=filterNovelStyles(researched.styles,avoid,{softEvidence:true});
  skipped.push(...novel.skipped);
  for(const style of novel.accepted){
   const seed=resolveBlogSeed(style,blogTopics);
   if(!seed){
    skipped.push({title:style.style_name,reason:'missing_blog_backlink'});
    continue;
   }
   const blogKey=normalizeTitle(seed.title);
   if(usedBlog.has(blogKey)){
    skipped.push({title:style.style_name,reason:'duplicate_blog_backlink'});
    continue;
   }
   usedBlog.add(blogKey);
   const attached={
    ...style,
    blog_title:seed.title,
    blog_topic_id:seed.id,
    blog_seed_keywords:style.blog_seed_keywords.length?style.blog_seed_keywords:[seed.primary_keyword].filter(Boolean),
    reference_urls:buildStyleReferenceUrls({primary_keyword:style.primary_keyword||seed.primary_keyword,style_name:style.style_name})
   };
   pool.push(attached);
   avoid.push(style.style_name);
   if(pool.length>=hardTarget)break;
  }
 }
 if(pool.length<hardTarget)limitations.push('Below invent target after '+batches+' batches: '+pool.length+'/'+hardTarget+' novel styles with blog backlinks.');
 else limitations.push('Invent complete: '+pool.length+' styles with blog backlinks across '+batches+' batch(es); target '+hardTarget+'.');
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
  if(!seeds.count){
   limitations.push('No blog queue seeds — cannot run Style Pulse without blog titles to backlink.');
   await rest('inspiration_pulse_runs?id=eq.'+runId,{
    method:'PATCH',
    body:{finished_at:new Date().toISOString(),inserted_count:0,skipped_count:0,limitations}
   });
   return {ok:true,slot,date,runId,inserted:0,skipped:0,limitations,target:targetMin,duplicate:false};
  }
  limitations.push('Blog seeds loaded: '+seeds.count+' topics for required backlinks.');
  limitations.push(...applyPinterestSoftGate(env).limitations);
  limitations.push('Reference URLs are deterministic Pinterest/Unsplash searches — hallucinated /pin/{id} links are rejected.');

  const corpus=await loadStyleNoveltyCorpus();
  const collected=await collectStyleCandidates({
   slot,date,lanes,
   existingNames:corpus.names,
   blogTopics:seeds.topics,
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
   const refs=sanitizeReferenceUrls(style.reference_urls?.length?style.reference_urls:buildStyleReferenceUrls(style));
   const row={
    style_name:style.style_name,
    slug_hint:styleSlugHint(style.style_name),
    primary_keyword:style.primary_keyword,
    style_lanes:style.lanes.length?style.lanes:lanes.slice(0,2),
    angle:style.angle||'South India invitation style variation.',
    evidence_summary:style.evidence_summary||'',
    reference_urls:refs,
    ai_prompt:style.ai_prompt,
    sku_hint:style.sku_hint||styleSlugHint(style.style_name),
    blog_seed_keywords:style.blog_seed_keywords,
    blog_topic_id:style.blog_topic_id||null,
    blog_title:style.blog_title||'',
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
  const effectiveTarget=Math.min(targetMin,seeds.count);
  if(inserted<effectiveTarget)limitations.push('Below insert target: '+inserted+'/'+effectiveTarget+' inspirations this pulse.');
  else limitations.push('Insert target met: '+inserted+'/'+effectiveTarget+'.');

  await rest('inspiration_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),inserted_count:inserted,skipped_count:skipped,limitations}
  });
  return {ok:true,slot,date,runId,inserted,skipped,limitations,target:effectiveTarget,duplicate:false};
 }catch(error){
  await rest('inspiration_pulse_runs?id=eq.'+runId,{
   method:'PATCH',
   body:{finished_at:new Date().toISOString(),error:error instanceof Error?error.message:'Style pulse failed',limitations}
  }).catch(()=>{});
  throw error;
 }
}

export function mapInspirationItem(row){
 // Always rebuild clean Pinterest search URLs (fixes doubled "wedding invitation" in old rows).
 const urls=sanitizeReferenceUrls(buildStyleReferenceUrls({
  primary_keyword:row.primary_keyword,
  style_name:row.style_name
 }));
 return {
  id:row.id,
  style_name:row.style_name||'',
  slug_hint:row.slug_hint||'',
  primary_keyword:row.primary_keyword||'',
  style_lanes:Array.isArray(row.style_lanes)?row.style_lanes:[],
  angle:row.angle||'',
  evidence_summary:row.evidence_summary||'',
  reference_urls:urls,
  preview:'',
  ai_prompt:row.ai_prompt||'',
  sku_hint:row.sku_hint||'',
  blog_seed_keywords:Array.isArray(row.blog_seed_keywords)?row.blog_seed_keywords:[],
  blog_topic_id:row.blog_topic_id||null,
  blog_title:row.blog_title||'',
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
