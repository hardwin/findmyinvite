import {fail,method} from '../server/core.mjs';
import {guestDecision,slugFromRequest,writeNotFound,writeSpa} from '../server/guest-page.mjs';
export default async function handler(req,res){
 try{
  method(req,['GET','HEAD']);
  const slug=slugFromRequest(req);
  const {gate}=await guestDecision('/'+slug);
  if(gate==='404')return writeNotFound(req,res);
  return writeSpa(req,res,gate,slug);
 }catch(error){fail(res,error);}
}
