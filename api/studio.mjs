import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {db,HttpError,bodyJson,respond,fail,method,bearer,tokenHash,verifyToken,rate,slugValue,validateData,promotion,invitation} from '../server/core.mjs';
import {sameOrigin} from '../server/studio-auth.mjs';
import {PILOT_TEMPLATES,EDITOR_TEMPLATES,SECTIONS,draftData,validateTemplate,genericCode} from '../server/studio-policy.mjs';
import {prepareAgent,continueAgent,workspaceReady,readAgent,stopAgent,closeAgent} from '../server/studio-agent.mjs';
import {checkpointCode,archiveBranch} from '../server/studio-git.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const baseline=id=>PILOT_TEMPLATES.includes(id)?readFile(new URL(`../public/studio/templates/${id}.html`,import.meta.url),'utf8'):Promise.resolve('<html><head></head><body>'+SECTIONS.map(section=>'<section data-section="'+section+'"></section>').join('')+['bride','groom','date','venue'].map(field=>'<span data-field="'+field+'"></span>').join('')+'</body></html>');
const view=p=>({id:p.id,template:p.template_id,data:p.data,html:p.html,revision:p.revision,gitSha:p.git_sha,busy:Boolean(p.session_id),workspacePrepared:Boolean(p.workspace_id&&p.workspace_revision===p.revision),publishedSlug:p.published_slug});
async function project(req,id){if(!uuid.test(id||''))throw new HttpError(400,'Invalid draft.');const rows=await db('studio_projects?id=eq.'+id+'&select=*&limit=1');if(!rows[0])throw new HttpError(404,'Draft not found.');verifyToken(bearer(req),rows[0].owner_hash);return rows[0];}
async function update(p,body){const rows=await db('studio_projects?id=eq.'+p.id+'&lock_until=eq.'+encodeURIComponent(p.lock_until)+'&lock_until=gt.'+encodeURIComponent(new Date().toISOString()),{method:'PATCH',headers:{Prefer:'return=representation'},body});if(!rows[0])throw new HttpError(409,'This operation expired. Reload the latest draft.');return rows[0];}
async function lock(id){const now=new Date().toISOString();const rows=await db('studio_projects?id=eq.'+id+'&or='+encodeURIComponent(`(lock_until.is.null,lock_until.lt.${now})`),{method:'PATCH',headers:{Prefer:'return=representation'},body:{lock_until:new Date(Date.now()+75000).toISOString()}});if(!rows.length)throw new HttpError(423,'Your workspace is getting ready. Your change will start automatically.');return rows[0];}
async function release(p){await db('studio_projects?id=eq.'+p.id+'&lock_until=eq.'+encodeURIComponent(p.lock_until),{method:'PATCH',body:{lock_until:null}});}
async function stopAndClose(id){await stopAgent(id).catch(()=>{});await closeAgent(id);}
async function checkpoint(p,data,html,message,publishCode=false){
 const normalized=draftData(data,p.template_id),source=validateTemplate(html,await baseline(p.template_id));
 const generic=genericCode(source);
 for(const [k,v] of Object.entries(normalized)){if(typeof v==='string'&&v.length>=5&&!['id','template','type','music'].includes(k)&&!p.html.includes(v)&&generic.includes(v))throw new HttpError(400,'Personal details must stay in editable fields, not template code.');}
 const unchanged=generic===genericCode(p.html);
 const code=publishCode?await checkpointCode({studioId:p.id,templateId:p.template_id,html:generic,parentSha:p.git_sha||undefined}):{commit:unchanged?p.git_sha:null};
 const rows=await db('rpc/studio_checkpoint',{method:'POST',body:{p_id:p.id,p_revision:p.revision,p_lock_until:p.lock_until,p_data:normalized,p_html:source,p_sha:code.commit,p_message:message}});if(!rows[0])throw new HttpError(409,'This draft changed. Reload before continuing.');return rows[0];
}
async function ensureWorkspace(p){
 if(p.workspace_id&&p.workspace_revision===p.revision){const state=await workspaceReady(p.workspace_id);if(state.usable)return {project:p,ready:state.ready};}
 if(p.workspace_id)await closeAgent(p.workspace_id);
 const session=await prepareAgent(p);
 try{return {project:await update(p,{workspace_id:session.id,workspace_revision:p.revision}),ready:session.environment?.status==='connected'};}catch(e){await closeAgent(session.id);throw e;}
}
export default async function handler(req,res){let locked=null;
 const finish=async(res,status,body)=>{if(locked){const lease=locked;await release(lease);locked=null;}return respond(res,status,body);};
 try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'config';
 if(action==='config'){method(req,['GET']);return await finish(res,200,{authenticated:true,configured:Boolean(process.env.OPENAI_API_KEY&&process.env.STUDIO_GITHUB_TOKEN),templates:PILOT_TEMPLATES});}
 if(action==='public'){method(req,['GET']);const slug=slugValue(q.get('slug'));const current=await invitation(slug);const rows=await db('studio_publications?slug=eq.'+slug+'&select=html,data,revision&limit=1');if(!rows[0])throw new HttpError(404,'No studio publication.');return await finish(res,200,{...rows[0],data:{...rows[0].data,sections:current.data.sections}});}
 if(req.method!=='GET')sameOrigin(req);
 if(action==='create'){method(req,['POST']);const body=await bodyJson(req);if(!EDITOR_TEMPLATES.includes(body.template))throw new HttpError(400,'Choose an available template.');const ownerHash=tokenHash(body.token);const data=draftData(body.data,body.template);try{await rate(req,'invitation-draft-create-burst',6,60);await rate(req,'invitation-draft-create-hour',500,3600)}catch(e){if(e.status===429){res.setHeader('Retry-After','60');throw new HttpError(429,'New invitation creation is temporarily limited on this network. You can still reopen your saved drafts. Please try again later.')}throw e;}const id=randomUUID(),html=validateTemplate(await baseline(body.template),await baseline(body.template));
 const rows=await db('studio_projects',{method:'POST',headers:{Prefer:'return=representation'},body:{id,owner_hash:ownerHash,template_id:body.template,data,html}});
 await db('studio_versions',{method:'POST',body:{project_id:id,revision:0,data,html,message:'Original template'}});return await finish(res,201,view(rows[0]));}
 let p=await project(req,q.get('id'));
 if(action==='read'){method(req,['GET']);return await finish(res,200,view(p));}
 if(action==='history'){method(req,['GET']);return await finish(res,200,{versions:await db('studio_versions?project_id=eq.'+p.id+'&select=revision,message,created_at&order=revision.desc&limit=30')});}
 method(req,['POST']);if(!['prepare','save','restore','run','poll','cancel','publish'].includes(action))throw new HttpError(404,'Unknown studio action.');p=await lock(p.id);locked={id:p.id,lock_until:p.lock_until};
 const body=await bodyJson(req,100000);
 if(['save','restore','run','publish'].includes(action)&&(!Number.isInteger(body.revision)||body.revision<0))throw new HttpError(400,'A current draft revision is required.');
 if(body.revision!==undefined&&body.revision!==p.revision)throw new HttpError(409,'This draft changed elsewhere. Reload to use its latest version.');
 if(action==='poll'){
  if(!p.session_id)return await finish(res,200,{...view(p),done:true});
  const sessionId=p.session_id;
  if(!Number.isFinite(Date.parse(p.run_started_at))||Date.now()-Date.parse(p.run_started_at)>300000){await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null});await stopAndClose(sessionId);throw new HttpError(408,'This change exceeded the five-minute pilot limit. Your previous version is safe.');}
  if(p.run_revision!==p.revision){await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null});await stopAndClose(sessionId);throw new HttpError(409,'Your draft changed during generation. The newer draft was preserved.');}
  let result;try{result=await readAgent(sessionId,p.workspace_id===sessionId?p.run_revision:undefined)}catch(e){await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null});await closeAgent(sessionId);throw e;}
  if(!result.done)return await finish(res,200,{...view(p),done:false,status:result.status});
  try{if(result.cancelled){await closeAgent(sessionId);return await finish(res,200,{...view(await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null})),done:true,message:'Change cancelled.'});}
   if(p.run_revision!==p.revision)throw new HttpError(409,'Your draft changed during generation. The newer draft was preserved.');
   if(genericCode(result.result.html)===genericCode(p.html)&&isDeepStrictEqual(draftData(result.result.data,p.template_id),draftData(p.data,p.template_id)))throw new HttpError(422,'Lovebot returned no changes. Your draft is unchanged. Please rephrase the request.');
   let next=await checkpoint(p,result.result.data,result.result.html,String(result.result.message||'Invitation updated.').slice(0,1000));
   if(p.workspace_id===sessionId)next=await update(next,{workspace_id:sessionId,workspace_revision:next.revision});
   return await finish(res,200,{...view(next),done:true,message:String(result.result.message||'Invitation updated.').slice(0,1000),usage:result.usage});
  }catch(e){await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null});await closeAgent(sessionId);throw e;}finally{if(p.workspace_id!==sessionId)await closeAgent(sessionId);}
 }
 if(action==='cancel'){const next=await update(p,{session_id:null,run_started_at:null,run_revision:null,workspace_id:null,workspace_revision:null});if(p.session_id)await stopAndClose(p.session_id);return await finish(res,200,view(next));}
 if(p.session_id)throw new HttpError(409,'Wait for the current change or cancel it first.');
 if(['prepare','run'].includes(action)&&!PILOT_TEMPLATES.includes(p.template_id))throw new HttpError(400,'Use Form or Editor to personalize this design.');
 if(action==='prepare'){await rate(req,'studio-prepare',60,3600);const warm=await ensureWorkspace(p);return await finish(res,200,{...view(warm.project),ready:warm.ready});}
 if(action==='save'){let next=await checkpoint(p,body.data,p.html,'Updated invitation details.');if(p.workspace_id&&p.workspace_revision===p.revision)next=await update(next,{workspace_revision:next.revision});return await finish(res,200,view(next));}
 if(action==='restore'){const target=body.target;if(!Number.isInteger(target)||target<0)throw new HttpError(400,'Choose a saved version.');const rows=await db('studio_versions?project_id=eq.'+p.id+'&revision=eq.'+target+'&select=data,html&limit=1');if(!rows[0])throw new HttpError(404,'Version not found.');return await finish(res,200,view(await checkpoint(p,rows[0].data,rows[0].html,`Restored version ${target}.`)));}
 if(action==='run'){
 if(typeof body.message!=='string'||!body.message.trim()||body.message.length>2000||!SECTIONS.includes(body.section))throw new HttpError(400,'Enter a change for the selected section.');
 await rate(req,'studio-agent',10,3600);const permitted=await db('rpc/consume_rate_limit',{method:'POST',body:{p_key:'studio-global-agent-daily',p_limit:Number(process.env.STUDIO_DAILY_RUN_LIMIT||20),p_seconds:86400}});if(!permitted)throw new HttpError(429,'The team pilot has reached its daily agent allowance. You can still edit details manually.');
 const warm=await ensureWorkspace(p);p=warm.project;const session={id:p.workspace_id};try{await continueAgent(session.id,p,body.message,body.section);p=await update(p,{session_id:session.id,run_started_at:new Date().toISOString(),run_revision:p.revision});}catch(e){await stopAndClose(session.id);await update(p,{workspace_id:null,workspace_revision:null});throw e;}return await finish(res,202,{...view(p),status:'Your invitation is being customized in a private workspace.'});}
 if(action==='publish'){
 if(!promotion().active)throw new HttpError(403,'The free launch publishing offer is not active.');
 const schema=JSON.parse(await readFile(new URL('../public/studio/fields.json',import.meta.url),'utf8'));for(const field of schema.fields.filter(f=>f.required))if(!p.data[field.key]?.trim())throw new HttpError(400,'Complete '+field.label+' in Details before publishing.');
 const slug=slugValue(body.slug),hash=tokenHash(body.managementToken);
 if(p.published_slug&&p.published_slug!==slug)throw new HttpError(409,'A published invitation address cannot change.');
 // Studio publishes only its allowlisted templates; draft ownership is verified above.
 const input={...p.data,template:p.template_id==='royal-temple'?'emerald-noir':p.template_id,music:['/assets/track1.mp3','/assets/track3.mp3'].includes(p.data.music)?p.data.music:'',photos:p.data.photos.filter(x=>/^\/assets\/[\w.-]+$/.test(x))};
 const valid=validateData(input,slug);valid.data.template=p.template_id;valid.data.studioId=p.id;
 if(Date.parse(p.data.date+'T'+p.data.time+':00+05:30')<=Date.now())throw new HttpError(400,'Choose an upcoming event before publishing.');
 if(!p.git_sha)p=await checkpoint(p,p.data,p.html,'Verified publication checkpoint.',true);
 await db('rpc/studio_publish',{method:'POST',body:{p_id:p.id,p_revision:p.revision,p_lock_until:p.lock_until,p_slug:slug,p_hash:hash,p_data:{...valid.data,photos:p.data.photos,music:p.data.music,textOverrides:p.data.textOverrides||{}},p_expires:valid.expires_at}});
 let archivePending=false;try{await archiveBranch({studioId:p.id,commit:p.git_sha})}catch{archivePending=true;}
 return await finish(res,200,{...view(p),publishedSlug:slug,url:'/'+slug,archivePending});
 }
 throw new HttpError(404,'Unknown studio action.');
 }catch(e){if(locked){const lease=locked;try{await release(lease);locked=null;}catch{}}if(e.status===401||e.status===403||e.status===429||e instanceof HttpError)fail(res,e);else{console.error('Studio operation failed',e.name,e.status||'');fail(res,new HttpError(502,'The studio service could not complete this step. Your saved version is safe.'));}}
 finally{if(locked)await release(locked).catch(()=>{});}
}
