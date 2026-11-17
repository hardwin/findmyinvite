import {catalogVersion,safeVersion} from './template-cms.mjs';
import {withTemplateMusic} from './website-music.mjs';
import {versionIdentity} from './catalog-identity.mjs';

// Only approved, published catalogue defaults are eligible for this public cache.
// Editor, saved invitation and payment responses continue to use no-store.
export async function publicPreviewVersion(id,{readVersion=catalogVersion,music=withTemplateMusic,identity=versionIdentity}={}){
 const version=safeVersion(await readVersion(id));
 const [withMusic,withIdentity]=await Promise.all([music(version),identity(version)]);
 return {...withIdentity,defaults:withMusic.defaults};
}
export function respondPreview(res,version){
 res.setHeader('Cache-Control','public, max-age=30');
 res.setHeader('CDN-Cache-Control','public, s-maxage=60');
 res.setHeader('X-Content-Type-Options','nosniff');
 return res.status(200).json({version});
}
