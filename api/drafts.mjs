import {bodyJson,method,respond,fail,rate} from '../server/core.mjs';
import {customer} from '../server/template-cms.mjs';
import {draftService,draftView} from '../server/personalization-drafts.mjs';
export const config={maxDuration:300};
export default async function handler(req,res){try{const user=await customer(req),q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'list',service=draftService();
 if(action==='list'){method(req,['GET']);const [drafts,deleted]=await Promise.all([service.list(user.id),service.deleted(user.id)]);return respond(res,200,{drafts,deleted});}
 if(action==='get'){method(req,['GET']);let r=await service.get(user.id,q.get('id'),{optional:true});if(!r){const found=(await service.list(user.id)).find(d=>d.id===q.get('id'));if(found)return respond(res,200,{draft:found});await service.get(user.id,q.get('id'));}return respond(res,200,{draft:{...draftView(r),job:await service.jobView(user.id,r.last_job_id||r.payload?.job?.id)}});}
 method(req,['POST']);const b=await bodyJson(req,200000);await rate(req,'draft-'+user.id,600,3600);
 if(action==='save')return respond(res,200,{draft:await service.save(user.id,b)});
 if(action==='delete'){await service.remove(user.id,b.id);return respond(res,200,{ok:true});}
 return respond(res,404,{error:'Unknown draft action.'});
 }catch(e){fail(res,e);}}
