import {fail,method} from '../server/core.mjs';
import {htmlForShare} from '../server/share-card.mjs';
export default async function handler(req,res){
 try{
  method(req,['GET']);
  const html=await htmlForShare(req);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.statusCode=200;
  if(typeof res.status==='function')res.status(200);
  if(typeof res.end==='function')res.end(html);
  else res.json({html});
 }catch(error){fail(res,error)}
}
