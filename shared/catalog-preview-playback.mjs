// Each mobile encode belongs to one approved cut, including its soundtrack.
const mobilePreviews = new Map([
 ['/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-v1.mp4', 'wedding-bells'],
 ['/assets/catalog-previews/oonjal-v3-r2/film-oonjal-v1.mp4', 'maapla'],
 ['/assets/catalog-previews/were-next-v1/preview.mp4', 'were-next'],
 ['/assets/catalog-previews/anbil-avan-v1/preview-reception-shoulder-v1.mp4', 'anbil-avan'],
]);
export function catalogPreviewPlayback(id,preview,music){
 if(id==='wedding-bells-v1'&&music?.id!=='wedding-bells-original')
  return {preview:'/assets/video-masters/wedding-bells-v1/catalog-preview-tracked-silent-v1.mp4',embeddedMusic:false};
 const embeddedMusic=['wedding-bells-v1','film-oonjal-v1','film-were-next-v1','film-anbil-avan-v1'].includes(id);
 const mobile=embeddedMusic&&mobilePreviews.get(preview);
 return {preview,embeddedMusic,...(mobile?{mobilePreview:'/assets/catalog-previews/mobile-v1/'+mobile+'.mp4'}:{})};
}
