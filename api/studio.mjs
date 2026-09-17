import {fail} from '../server/core.mjs';
import {handleStudio} from '../server/studio.mjs';
export default async function handler(req,res){
 try{await handleStudio(req,res);}
 catch(error){fail(res,error);}
}
