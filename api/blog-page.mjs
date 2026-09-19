import {fail,method} from '../server/core.mjs';
import {writeBlogPage} from '../server/blog-page.mjs';
export default async function handler(req,res){
 try{
  method(req,['GET','HEAD']);
  return writeBlogPage(req,res);
 }catch(error){fail(res,error);}
}
