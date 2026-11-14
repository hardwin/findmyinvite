import {createHash} from 'node:crypto';
import {db,HttpError,method,respond,bodyJson,slugValue,rate,text} from './core.mjs';

export const interactionDesigns={
 'little-blessing-v1':['poll'], 'midnight-stage-v1':['glitter'],
 'up-and-away-v1':['wish'], 'olai-v1':['wish'], 'pulli-v1':['kolam']
};
export function validateInteraction(body){
 const kind=body.kind;
 if(!['wish','poll','kolam','glitter'].includes(kind))throw new HttpError(400,'Invalid interaction.');
 if(typeof body.visitor!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.visitor))throw new HttpError(400,'Invalid visitor.');
 if(typeof body.requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.requestId))throw new HttpError(400,'Invalid request.');
 const value={};
 if(kind==='poll'){if(!['girl','boy'].includes(body.vote))throw new HttpError(400,'Choose a prediction.');value.vote=body.vote;}
 if(kind==='wish'||kind==='kolam'){
  value.name=text(body.name,80,true);
  if(kind==='wish')value.message=text(body.message,1000,true);
  else {if(typeof body.pattern!=='string'||!/^[0-9a-z]{1,5}$/.test(body.pattern)||parseInt(body.pattern,36)<1||parseInt(body.pattern,36)>33554431)throw new HttpError(400,'Invalid pattern.');value.pattern=body.pattern;}
 }
 if(kind==='glitter'){if(!Number.isInteger(body.add)||body.add<1||body.add>100)throw new HttpError(400,'Invalid count.');value.add=body.add;}
 return {kind,value,visitor:createHash('sha256').update(body.visitor).digest('hex'),requestId:body.requestId};
}
export default async function guestInteractions(req,res,q){
 method(req,['GET','POST']);
 const slug=slugValue(q.get('slug'));
 const rows=await db('invitations?slug=eq.'+slug+'&published=eq.true&deleted_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=id,template_version_id&limit=1');
 const row=rows?.[0];if(!row?.template_version_id)throw new HttpError(404,'Invitation unavailable.');
 const versions=await db('template_versions?id=eq.'+row.template_version_id+'&select=renderer&limit=1');
 const allowed=interactionDesigns[versions?.[0]?.renderer]||[];
 if(!allowed.length)throw new HttpError(404,'Interaction unavailable.');
 if(req.method==='POST'){
  const input=validateInteraction(await bodyJson(req,5000));
  if(!allowed.includes(input.kind))throw new HttpError(400,'Interaction unavailable for this invitation.');
  await rate(req,'guest-interaction:'+row.id,60,3600);
  await rate(req,'guest-interaction',180,3600);
  await db('rpc/fmi_write_guest_interaction',{method:'POST',body:{p_invitation:row.id,p_kind:input.kind,p_visitor:input.visitor,p_request:input.requestId,p_value:input.value}});
 }
 const result=await db('rpc/fmi_read_guest_interactions',{method:'POST',body:{p_invitation:row.id}});
 return respond(res,200,result);
}
