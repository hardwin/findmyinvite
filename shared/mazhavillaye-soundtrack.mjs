// Owner-selected replacement from the posted film. Keep the animation/master
// version stable: approved character sets are independent of soundtrack revisions.
export const MAZHAVILLAYE_SOUNDTRACK=Object.freeze({
 id:'mazhavillaye-posted-v1',
 revision:'instagram-dgisjnjsmof-v1',
 asset:'/assets/music-library/mazhavillaye-posted-v1.m4a',
 sha256:'0734a370ab770114f1a06fc5729e2d2c481456464dba590a19a098bb54bdff61',
 preview:'/assets/catalog-previews/anbil-avan-v1/preview-mazhavillaye-v1.mp4',
 sourceUrl:'https://www.instagram.com/p/DgIsjnJSmoF/',
 duration:35.04
});
export function bindMazhavillayeSoundtrack(master){
 if(master?.id!=='film-anbil-avan-v1')return master;
 // Jobs pin this resolved master and the private audio hash before dispatch.
 // Existing completed exports and the original immutable manifest stay intact.
 return {...master,source:{...master.source,audioSha256:MAZHAVILLAYE_SOUNDTRACK.sha256,soundtrackRevision:MAZHAVILLAYE_SOUNDTRACK.revision},catalog:{...master.catalog,preview:'../../catalog-previews/anbil-avan-v1/preview-mazhavillaye-v1.mp4'}};
}
