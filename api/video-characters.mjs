import {waitUntil} from '@vercel/functions';
import {method,respond,fail,HttpError} from '../server/core.mjs';
import {videoActor} from '../server/video-assistance.mjs';
import {characterService} from '../server/video-characters.mjs';
import {characterEnabled,characterSetsEnabled,characterSetsRecoverable} from '../server/video-character-access.mjs';
import {verifyCharacterWebhook} from '../server/video-character-provider.mjs';
import {setPrediction} from '../server/video-photo-cutout.mjs';
import {videoStore} from '../server/video-personalise-store.mjs';
import {characterSetService} from '../server/video-character-sets.mjs';
export const config={maxDuration:300,memory:1024,api:{bodyParser:false}};
// Layered-template character sets: separate gate, tables and actions (`set*`).
async function characterSets(req,res,q,action,user){
 if(action==='set-capabilities'){method(req,['GET']);return respond(res,200,{enabled:characterSetsEnabled(user.id)});}
 if(!characterSetsEnabled(user.id))throw new HttpError(503,'Matching characters for this design are completing their visual checks. The original illustrations remain available.');
 const service=characterSetService({allowSubmission:false}),kick=ids=>{for(const id of ids.slice(0,3))waitUntil(service.process(id));};
 if(action==='sets'){method(req,['GET']);const result=await service.list(user.id,q.get('invitationId'));kick(result.active);return respond(res,200,result);}
 throw new HttpError(404,'Unknown character action.');
}
export default async function handler(req,res){try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'list',service=characterService({allowSubmission:false});
 if(action==='recover'){method(req,['GET']);if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)throw new HttpError(401,'Unauthorized');const processed=await service.recover();let assets;
  // Isolated: an unavailable character-set table never blocks Temple recovery.
  if(characterSetsRecoverable()){try{assets=await characterSetService({allowSubmission:false}).recover();}catch(e){console.error('Character set recovery will retry:',e.name);}}
  return respond(res,200,{processed,...(assets===undefined?{}:{assets})});}
 if(['callback','asset-callback','cutout-callback'].includes(action)){
  method(req,['POST']);let raw;if(typeof req.body==='string'||Buffer.isBuffer(req.body))raw=req.body.toString();else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1000000)throw new HttpError(413,'Callback too large');chunks.push(Buffer.from(chunk));}raw=Buffer.concat(chunks).toString('utf8');}if(Buffer.byteLength(raw)>1000000)throw new HttpError(413,'Callback too large');
  if(!req.headers['webhook-id']||!req.headers['webhook-signature']||Math.abs(Date.now()/1000-Number(req.headers['webhook-timestamp']))>300)throw new HttpError(401,'Invalid callback signature.');
  if(!verifyCharacterWebhook(raw,req.headers,await service.provider.key()))throw new HttpError(401,'Invalid callback signature.');
  const b=JSON.parse(raw);if(typeof b.id!=='string')throw new HttpError(400,'Invalid callback.');
  if(action==='cutout-callback'){const id=q.get('id'),attempt=q.get('attempt');if(!/^[a-f0-9-]{36}$/.test(id||'')||!/^[a-f0-9-]{36}$/.test(attempt||''))throw new HttpError(400,'Invalid callback.');await setPrediction(videoStore(),'media/'+id+'.json',attempt,b.id);return respond(res,200,{ok:true});}
  // Status and image URLs are fetched from Replicate again; never trust callback output data.
  waitUntil(action==='callback'?service.process(q.get('id')):characterSetService({allowSubmission:false}).resumeAfterCallback(q.get('id')));return respond(res,200,{ok:true});
 }
 const user=await videoActor(req,'characters',action);
 if(['approve','set-approve','submit','retry','set-submit','set-revise','set-confirm','set-retry'].includes(action))throw new HttpError(410,'Reopen Photos to copy the prompt and upload your scene image.');
 if(action==='sets'||action.startsWith('set-'))return await characterSets(req,res,q,action,user);
 if(action==='capabilities'){method(req,['GET']);return respond(res,200,{enabled:characterEnabled(user.id),model:'openai/gpt-image-2.6-flare'});}
 if(!characterEnabled(user.id))throw new HttpError(503,'Matching characters are completing their visual checks. Your original illustrations remain available.');
 if(action==='model-check'){method(req,['GET']);if(!String(process.env.VIDEO_CHARACTER_QA_OWNERS||'').split(',').includes(user.id))throw new HttpError(404,'Unknown character action.');const m=await service.provider.model();return respond(res,200,{model:m.owner+'/'+m.name,version:m.latest_version?.id,input:m.latest_version?.openapi_schema?.components?.schemas?.Input,schemas:m.latest_version?.openapi_schema?.components?.schemas});}
 if(action==='list'){method(req,['GET']);const result=await service.list(user.id,q.get('invitationId'));for(const j of result.jobs.filter(j=>['queued','submitting','processing','preparing'].includes(j.status)))waitUntil(service.process(j.id));return respond(res,200,result);}
 throw new HttpError(404,'Unknown character action.');
 }catch(e){fail(res,e);}}
