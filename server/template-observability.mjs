import {db} from './core.mjs';
export async function recordWebsiteFailure(req,error){
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,operation=q.get('action')||'';
 if(!operation.startsWith('v2-'))return;
 const action=operation==='v2-publish'||operation==='v2-renew'?'publication.failed':operation==='v2-order'||operation==='v2-verify'?'payment.failed':operation==='v2-public'&&(error.status||500)>=500?'guest.error':null;
 if(!action)return;const detail={operation,status:error.status||500};console.error(JSON.stringify({event:action,...detail}));
 try{await db('cms_audit',{method:'POST',body:{action,target:'website',detail}});}catch{/* Runtime log remains available if the database is down. */}
}
