import {respond,fail,method,bodyJson,rate,HttpError} from '../server/core.mjs';
import {sessionOk} from '../server/akay-gate.mjs';
import {parseListQuery,cleanId,decideStatus,listCandidates,decideCandidate,bulkDecide} from '../server/akay-shortlist.mjs';
export default async function handler(req,res){
 try{
  if(!sessionOk(req))throw new HttpError(401,'Open /akay and enter the access code.');
  const url=new URL(req.url,'https://findmyinvite.com');
  const action=url.searchParams.get('action')||'list';
  if(action==='list'){
   method(req,['GET']);
   return respond(res,200,await listCandidates(parseListQuery(req.url)));
  }
  if(action==='decide'){
   method(req,['POST','PATCH']);
   await rate(req,'akay-shortlist',60,3600);
   const body=await bodyJson(req,4096);
   const result=await decideCandidate(cleanId(body.id||url.searchParams.get('id')),decideStatus(body.status));
   return respond(res,200,result);
  }
  if(action==='bulk'){
   method(req,['POST']);
   await rate(req,'akay-shortlist',30,3600);
   const body=await bodyJson(req,16384);
   return respond(res,200,await bulkDecide(body.ids,decideStatus(body.status)));
  }
  throw new HttpError(404,'Not found.');
 }catch(error){fail(res,error)}
}
