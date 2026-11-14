import {issueSignedToken,presignUrl} from '@vercel/blob';
// A read-only, short-lived URL for one already-authorized immutable result.
export async function videoDownloadTicket(pathname,{now=Date.now(),issue=issueSignedToken,sign=presignUrl}={}){
 if(!/^video-personalise\/results\/[a-f0-9-]{36}\/[a-f0-9]{64}\/[a-f0-9-]{36}\.mp4$/.test(pathname))throw Error('Invalid video result path');
 const expiresAt=now+15*60*1000;
 const token=await issue({pathname,operations:['get'],validUntil:expiresAt});
 const {presignedUrl}=await sign(token,{operation:'get',pathname,access:'private',validUntil:expiresAt});
 return {url:presignedUrl,expiresAt};
}
