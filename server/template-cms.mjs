import {websiteQuote} from '../shared/template-contract.mjs';
import {HttpError,db,authUser,bearer} from './core.mjs';
export const RENDERERS=['kerala-kasavu-v2','nikah-arches-v2','christian-editorial-v2'];
export async function customer(req){const user=await authUser(bearer(req));if(!user)throw new HttpError(401,'Sign in to continue.');return user;}
export async function operator(req){const user=await customer(req);const rows=await db('cms_operators?user_id=eq.'+user.id+'&active=eq.true&select=user_id&limit=1');if(!rows.length)throw new HttpError(403,'CMS operator access is required.');return user;}
export async function version(id){if(!/^[a-f0-9-]{36}$/.test(id||''))throw new HttpError(400,'Invalid template version.');const rows=await db('template_versions?id=eq.'+id+'&select=*&limit=1');if(!rows[0]||!RENDERERS.includes(rows[0].renderer))throw new HttpError(404,'Template version unavailable.');return rows[0];}
export async function owned(slug,user){const rows=await db('invitations?slug=eq.'+encodeURIComponent(slug)+'&select=*,website_orders(status,applied_at)&limit=1');const row=rows[0];if(!row||row.owner_id!==user.id||!row.template_version_id)throw new HttpError(404,'Invitation not found.');return row;}
export function requireRecoverable(row){if(row.deleted_at||(row.first_published_at?Date.parse(row.expires_at)+90*86400000<=Date.now():Date.parse(row.updated_at)+90*86400000<=Date.now()&&!row.website_orders?.some(o=>o.status==='captured'&&!o.applied_at)))throw new HttpError(410,'The recovery period has ended.');}
export async function audit(user,action,target,detail={}){await db('cms_audit',{method:'POST',body:{actor_id:user.id,action,target,detail}});}
export async function rpc(name,body){return db('rpc/'+name,{method:'POST',body});}
export function safeVersion(v){const {id,template_id,renderer,field_schema,defaults,revision}=v;return {id,template_id,renderer,field_schema,defaults,revision};}

export async function websiteOffer(){const rows=await db('website_offer?id=eq.website&select=tax_bps,tax_label');if(!rows[0])throw new HttpError(503,'Tax configuration is pending.');return {...websiteQuote(rows[0].tax_bps),taxLabel:rows[0].tax_label};}

// Selection links may be superseded; existing invitations still use version(id) exactly.
export async function catalogVersion(id){if(!/^[a-f0-9-]{36}$/.test(id||''))throw new HttpError(400,'Invalid template version.');const requested=(await db('template_versions?id=eq.'+id+'&select=id,template_id,approved_at&limit=1'))[0];if(!requested?.approved_at)throw new HttpError(404,'Template unavailable.');const catalog=(await db('template_catalog?id=eq.'+encodeURIComponent(requested.template_id)+'&isactive=eq.true&published=eq.true&select=id,current_version_id'))[0];if(!catalog?.current_version_id)throw new HttpError(404,'Template unavailable.');const current=await version(catalog.current_version_id);if(!current.approved_at||current.template_id!==requested.template_id)throw new HttpError(404,'Template unavailable.');return current;}
