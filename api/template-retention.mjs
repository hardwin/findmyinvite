import {del} from '@vercel/blob';
import {timingSafeEqual} from 'node:crypto';
import {db,HttpError,respond,fail,method} from '../server/core.mjs';
import {rpc} from '../server/template-cms.mjs';
export default async function handler(req,res){try{
 method(req,['GET']);const expected='Bearer '+process.env.CRON_SECRET,actual=String(req.headers.authorization||'');
 if(!process.env.CRON_SECRET||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))throw new HttpError(401,'Unauthorized.');
 // Customer retention is separate from template archive and transaction retention.
 const claimed=await rpc('fmi_claim_retention',{p_limit:50});
 const pending=await db('template_media?status=eq.deleting&select=id,object_path&limit=200');let removed=0;
 for(const row of pending){await del(row.object_path);await db('template_media?id=eq.'+row.id+'&status=eq.deleting',{method:'DELETE'});removed++;}
 console.info(JSON.stringify({event:'template.retention',claimed,removed}));return respond(res,200,{claimed,removed});
 }catch(e){console.error(JSON.stringify({event:'template.retention.failed',status:e.status||500}));fail(res,e);}}
