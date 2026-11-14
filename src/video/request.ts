import {templateApi} from '../templates/api';

/** Bound editor requests so a lost connection cannot leave a permanent busy state. */
export async function videoRequest<T>(url:string,body?:unknown):Promise<T>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),45000);
 try{return await templateApi<T>(url,body,controller.signal);}
 catch(error){if(controller.signal.aborted)throw Error('The connection took too long. Please try again.');throw error;}
 finally{clearTimeout(timer);}
}
