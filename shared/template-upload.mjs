// Only publish a media URL to the form after storage and server verification succeed.
export async function uploadTemplateMedia({file,kind,slug,optimise,api,upload,token}){
 const processed=await optimise(file);
 const max=kind==='image'?1048576:kind==='video'?20*1048576:8*1048576;
 if(processed.size>max)throw Error('File exceeds the '+Math.round(max/1048576)+' MB limit.');
 const reservation=await api('/api/template-media?action=reserve',{slug,kind});
 await upload(reservation.pathname,processed,{access:'private',contentType:processed.type,handleUploadUrl:'/api/template-media?action=upload',headers:{Authorization:'Bearer '+await token()},multipart:kind==='video'});
 await api('/api/template-media?action=complete&id='+reservation.id,{});
 return reservation.url;
}
