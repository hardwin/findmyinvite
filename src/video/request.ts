import {templateApi} from '../templates/api';

export function interrupted(error:unknown){
 const e=error as Error&{status?:number};
 return e?.name==='AbortError'||e?.name==='TimeoutError'||e instanceof TypeError||[408,502,503,504].includes(e?.status??0);
}
/** Repeat reads only. A write may already have committed when its response is lost. */
export async function videoRequest<T>(url:string,body?:unknown):Promise<T>{
 for(let attempt=0;;attempt++){
  try{return await templateApi<T>(url,body,AbortSignal.timeout(body===undefined?20000:120000));}
  catch(error){
   if(!interrupted(error))throw error;
   if(body!==undefined||attempt>=2)throw Object.assign(new Error(body===undefined?'Unable to reach your invitation right now.':'Checking whether your changes reached your invitation.'),{name:'TimeoutError'});
   await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
 }
}
