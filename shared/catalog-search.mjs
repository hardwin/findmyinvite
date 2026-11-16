export const SEARCH_PAGE_SIZE=24;

export function invitationSearchHref(query='',language=''){
 const params=new URLSearchParams();
 if(query.trim())params.set('q',query.trim());
 if(language)params.set('lang',language);
 return '/search'+(params.size?'?'+params.toString():'');
}

/** Preserve each catalogue's ordering while exposing both formats together.
 * @template Website, Video
 * @param {Website[]} websites
 * @param {Video[]} videos
 * @returns {Array<{kind:'website',item:Website}|{kind:'video',item:Video}>}
 */
export function interleaveCatalogResults(websites,videos){
 const results=[];
 for(let index=0;index<Math.max(websites.length,videos.length);index++){
  if(index<websites.length)results.push({kind:'website',item:websites[index]});
  if(index<videos.length)results.push({kind:'video',item:videos[index]});
 }
 return results;
}
