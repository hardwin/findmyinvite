import {createHash} from 'node:crypto';
import {db,HttpError,slugValue} from './core.mjs';
import {shareDetails,SHARE_DESIGN_REVISION} from '../shared/share-preview.mjs';

export function publishedShare(row,now=Date.now()){
 if(!row?.published||row.deleted_at||!Number.isFinite(Date.parse(row.expires_at))||Date.parse(row.expires_at)<=now)throw new HttpError(404,'Invitation unavailable.');
 const content=row.template_version_id?row.published_content:row.data;
 if(!content||typeof content!=='object')throw new HttpError(404,'Invitation unavailable.');
 const template=row.data?.template||'';
 const revision=`${row.published_revision||0}-${SHARE_DESIGN_REVISION}-${createHash('sha256').update(JSON.stringify([template,content,row.template_version_id?null:row.updated_at])).digest('hex').slice(0,16)}`;
 return {row,content,template,revision,details:shareDetails(content,template)};
}
export async function resolveShare(slug){
 slugValue(slug);
 const rows=await db('invitations?slug=eq.'+encodeURIComponent(slug)+'&select=*&limit=1');
 return publishedShare(rows[0]);
}
export function shareImageUrl(slug,revision){return '/api/share-image?slug='+encodeURIComponent(slug)+(revision?'&v='+encodeURIComponent(revision):'');}
