import {HttpError,db} from './core.mjs';
import {customer,operator} from './template-cms.mjs';
import {isPublicVideo} from '../shared/video-visibility.mjs';

const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const unavailable = () => new HttpError(404,'This video is not available in the public collection.');

// Hidden designs remain editable by their existing owners and CMS operators.
// A client-supplied draft ID alone never grants access to a hidden design.
export async function requireVideoVisibility(req,templateId,invitationId,{user,query=db,authenticate=customer,authorizeOperator=operator}={}){
 if(isPublicVideo(templateId))return;
 if(!user){try{user=await authenticate(req);}catch(error){if(error.status!==401)throw error;}}
 if(user&&uuid(invitationId)){
  const owner=encodeURIComponent(user.id),id=encodeURIComponent(invitationId);
  const [draft]=await query(`personalization_drafts?id=eq.${id}&owner_id=eq.${owner}&select=id,kind,template_id,deleted_at&limit=1`);
  if(draft){
   if(draft.kind==='video'&&draft.template_id===templateId&&!draft.deleted_at)return;
  }else{
   // Older purchases predate the shared draft table; retain their recovery path.
   const [purchase]=await query(`video_invitation_orders?id=eq.${id}&owner_id=eq.${owner}&template_id=eq.${encodeURIComponent(templateId)}&select=id&limit=1`);
   if(purchase)return;
  }
 }
 try{await authorizeOperator(req);return;}catch(error){if(![401,403].includes(error.status))throw error;}
 throw unavailable();
}
