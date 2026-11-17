// The approved Wedding Bells film already contains its original soundtrack.
// Other catalog films are silent and use the selected library recording.
export function catalogPreviewPlayback(id,preview,music){
 if(id!=='wedding-bells-v1')return {preview,embeddedMusic:false};
 const embeddedMusic=music?.id==='wedding-bells-original';
 return {preview:embeddedMusic?preview:'/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-silent-v1.mp4',embeddedMusic};
}
