import {db,bodyJson,HttpError} from './core.mjs';
import {requireOwner} from './owner/auth.mjs';
import {audit} from './owner/store.mjs';
import {customer} from './template-cms.mjs';
import {videoInvitationId} from './video-payments.mjs';
import {videoStore} from './video-personalise-store.mjs';

const scopes={
 drafts:{get:'draft',save:'draft'},
 video:{template:'order','assist-status':'self','payment-status':'order',reserve:'order',render:'order',upload:'upload','local-upload':'media',complete:'media',cutout:'media',media:'media',status:'job','delivery-link':'job'},
 characters:{capabilities:'self','set-capabilities':'self',list:'order',sets:'order',submit:'order','set-submit':'order',approve:'character',retry:'character','set-approve':'set','set-confirm':'set','set-retry':'set'}
};
export async function videoActor(req,area,action,{uploadPath,store=videoStore(),query=db,authorize=requireOwner,record=audit}={}){
 const orderId=req.headers['x-fmi-assist'];
 if(orderId===undefined)return customer(req);
 const actor=await authorize(req);
 const scope=scopes[area]?.[action];
 const denied=()=>new HttpError(403,'This action is unavailable for this video order.');
 if(!scope)throw denied();
 const id=videoInvitationId(orderId);
 const [order]=await query('video_invitation_orders?id=eq.'+id+'&select=id,owner_id,template_id,status,free_access');
 if(!order||(!['captured','complimentary'].includes(order.status)&&!(order.free_access&&order.status==='pending')))throw denied();
 const q=new URL(req.url,'https://findmyinvite.com').searchParams;
 let input=Object.fromEntries(q);
 if(req.method==='POST'&&!['local-upload','upload'].includes(action)){
  input=await bodyJson(req,area==='drafts'?200000:area==='characters'?12000:64000);
  if(req.body===undefined)Object.defineProperty(req,'body',{value:input,configurable:true,writable:true});
 }
 if(scope==='draft'&&(input.id!==id||action==='save'&&(input.kind!=='video'||input.templateId!==order.template_id)))throw denied();
 if(scope==='order'&&input.invitationId!==id)throw denied();
 const template=input.templateId||input.template;
 if(template&&template!==order.template_id)throw denied();
 if(scope==='upload'&&!uploadPath?.startsWith('video-personalise/persistent/'+order.owner_id+'/'+id+'/'))throw denied();
 if(scope==='media'||scope==='job'){
  const resourceId=q.get('id'),isJob=scope==='job';
  if(!(isJob?/^[a-f0-9]{64}$/:/^[a-f0-9-]{36}$/).test(resourceId||''))throw denied();
  const item=(await store.read((isJob?'jobs/':'media/')+resourceId+'.json'))?.value;
  if(item?.owner!==order.owner_id||item.invitationId!==id)throw denied();
 }
 if(scope==='character'||scope==='set'){
  const table=scope==='set'?'video_character_sets':'video_character_jobs';
  const [item]=await query(table+'?id=eq.'+videoInvitationId(input.id)+'&invitation_id=eq.'+id+'&owner_id=eq.'+order.owner_id+'&select=id');
  if(!item)throw denied();
 }
 if(req.method==='POST'||action==='delivery-link')await record(actor.actorId||'owner','video.assist.'+action,id);
 return {id:order.owner_id,assistedOrder:order};
}
