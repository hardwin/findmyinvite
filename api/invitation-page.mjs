import {fail,method} from '../server/core.mjs';
import {writeInvitationPage} from '../server/invitation-page.mjs';
export default async function handler(req,res){
 try{
  method(req,['GET','HEAD']);
  return writeInvitationPage(req,res);
 }catch(error){fail(res,error);}
}
