import {waitUntil} from '@vercel/functions';
import {bodyJson,method,respond,fail,rate,HttpError} from '../server/core.mjs';
import {videoActor} from '../server/video-assistance.mjs';
import {characterService,characterJobView} from '../server/video-characters.mjs';
import {characterEnabled,characterSetsEnabled,characterSetsRecoverable} from '../server/video-character-access.mjs';
import {verifyCharacterWebhook} from '../server/video-character-provider.mjs';
import {characterSetService} from '../server/video-character-sets.mjs';
export const config={maxDuration:300,memory:1024,api:{bodyParser:false}};
// Layered-template character sets: separate gate, tables and actions (`set*`).
async function characterSets(req,res,q,action,user){
 if(action==='set-capabilities'){method(req,['GET']);return respond(res,200,{enabled:characterSetsEnabled(user.id)});}
 if(!characterSetsEnabled(user.id))throw new HttpError(503,'Matching characters for this design are completing their visual checks. The original illustrations remain available.');
 const service=characterSetService(),kick=ids=>{for(const id of ids.slice(0,3))waitUntil(service.process(id));},queued=view=>view.assets.filter(a=>['queued','submitting','preparing','processing'].includes(a.status)).map(a=>a.id);
 if(action==='sets'){method(req,['GET']);const result=await service.list(user.id,q.get('invitationId'));kick(result.active);return respond(res,200,result);}
 method(req,['POST']);const b=await bodyJson(req,12000);
 if(action==='set-submit'){await rate(req,'video-character-set:'+user.id,12,3600);const view=await service.view(await service.submit(user.id,b));kick(queued(view));return respond(res,202,{set:view});}
 if(action==='set-confirm'){await rate(req,'video-character-set:'+user.id,12,3600);const view=await service.view(await service.confirm(user.id,b.id));kick(queued(view));return respond(res,202,{set:view});}
 if(action==='set-retry'){await rate(req,'video-character-set:'+user.id,12,3600);const result=await service.retry(user.id,b.id);kick(result.retried);return respond(res,202,{set:await service.view(result.set)});}
 if(action==='set-approve')return respond(res,200,{draft:await service.approve(user.id,b.id,b.revision)});
 throw new HttpError(404,'Unknown character action.');
}
export default async function handler(req,res){try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'list',service=characterService();
 if(action==='recover'){method(req,['GET']);if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)throw new HttpError(401,'Unauthorized');const processed=await service.recover();let assets;
  // Isolated: an unavailable character-set table never blocks Temple recovery.
  if(characterSetsRecoverable()){try{assets=await characterSetService().recover();}catch(e){console.error('Character set recovery will retry:',e.name);}}
  return respond(res,200,{processed,...(assets===undefined?{}:{assets})});}
 if(action==='callback'||action==='asset-callback'){
  method(req,['POST']);let raw;if(typeof req.body==='string'||Buffer.isBuffer(req.body))raw=req.body.toString();else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1000000)throw new HttpError(413,'Callback too large');chunks.push(Buffer.from(chunk));}raw=Buffer.concat(chunks).toString('utf8');}if(Buffer.byteLength(raw)>1000000)throw new HttpError(413,'Callback too large');
  if(!req.headers['webhook-id']||!req.headers['webhook-signature']||Math.abs(Date.now()/1000-Number(req.headers['webhook-timestamp']))>300)throw new HttpError(401,'Invalid callback signature.');
  if(!verifyCharacterWebhook(raw,req.headers,await service.provider.key()))throw new HttpError(401,'Invalid callback signature.');
  const b=JSON.parse(raw);if(typeof b.id!=='string')throw new HttpError(400,'Invalid callback.');
  // Status and image URLs are fetched from Replicate again; never trust callback output data.
  waitUntil(action==='callback'?service.process(q.get('id')):characterSetService().process(q.get('id')));return respond(res,200,{ok:true});
 }
 const user=await videoActor(req,'characters',action);
 if(action==='sets'||action.startsWith('set-'))return await characterSets(req,res,q,action,user);
 if(action==='capabilities'){method(req,['GET']);return respond(res,200,{enabled:characterEnabled(user.id),model:'openai/gpt-image-2.6-flare'});}
 if(!characterEnabled(user.id))throw new HttpError(503,'Matching characters are completing their visual checks. Your original illustrations remain available.');
 if(action==='model-check'){method(req,['GET']);if(!String(process.env.VIDEO_CHARACTER_QA_OWNERS||'').split(',').includes(user.id))throw new HttpError(404,'Unknown character action.');const m=await service.provider.model();return respond(res,200,{model:m.owner+'/'+m.name,version:m.latest_version?.id,input:m.latest_version?.openapi_schema?.components?.schemas?.Input,schemas:m.latest_version?.openapi_schema?.components?.schemas});}
 if(action==='list'){method(req,['GET']);const result=await service.list(user.id,q.get('invitationId'));for(const j of result.jobs.filter(j=>['queued','submitting','processing','preparing'].includes(j.status)))waitUntil(service.process(j.id));return respond(res,200,result);}
 method(req,['POST']);const b=await bodyJson(req,12000);
 if(action==='submit'){await rate(req,'video-character:'+user.id,12,3600);const j=await service.submit(user.id,b);waitUntil(service.process(j.id));return respond(res,202,{job:characterJobView(j)});}
 if(action==='retry'){await rate(req,'video-character:'+user.id,12,3600);const j=await service.retry(user.id,b.id);waitUntil(service.process(j.id));return respond(res,202,{job:characterJobView(j)});}
 if(action==='approve')return respond(res,200,{draft:await service.approve(user.id,b.id,b.revision)});
 throw new HttpError(404,'Unknown character action.');
 }catch(e){fail(res,e);}}
