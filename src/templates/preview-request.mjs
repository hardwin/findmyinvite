// Public previews must never wait for customer authentication or send credentials.
/** @param {string} id @param {{fetcher?:typeof fetch,signal?:AbortSignal}} options */
export async function requestPreviewVersion(id,{fetcher=fetch,signal}={}){
 const response=await fetcher('/api/templates?action=preview&id='+encodeURIComponent(id),{
  credentials:'omit',signal:signal||AbortSignal.timeout(12000)
 });
 let data;
 try{data=await response.json();}catch{throw Error('The preview could not load. Please try again.');}
 if(!response.ok||!data?.version?.id)throw Error(data?.error||'The preview could not load. Please try again.');
 return data.version;
}
