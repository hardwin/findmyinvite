import {respond,fail,method,HttpError} from '../server/core.mjs';
import {sessionOk} from '../server/akay-gate.mjs';
import {parseCompetitorQuery,parseUpcomingQuery,listCompetitors,listUpcoming} from '../server/akay-inventory.mjs';
export default async function handler(req,res){
 try{
  if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
  method(req,['GET']);
  const url=new URL(req.url,'https://findmyinvite.com');
  const view=url.searchParams.get('view')||'';
  if(view==='competitors')return respond(res,200,await listCompetitors(parseCompetitorQuery(req.url)));
  if(view==='upcoming')return respond(res,200,await listUpcoming(parseUpcomingQuery(req.url)));
  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
