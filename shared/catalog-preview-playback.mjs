// The Oonjal release and the original Wedding Bells clip carry their soundtrack.
export function catalogPreviewPlayback(id,preview,music){
 if(['film-oonjal-v1','film-were-next-v1'].includes(id))return {preview,embeddedMusic:true};
 if(id!=='wedding-bells-v1')return {preview,embeddedMusic:false};
 const embeddedMusic=music?.id==='wedding-bells-original';
 return {preview:embeddedMusic?preview:'/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-silent-v1.mp4',embeddedMusic};
}
