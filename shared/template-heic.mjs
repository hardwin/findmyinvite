/*! HEIC decoder: heic-to 1.6.7, LGPL-3.0-or-later. Licences/source: /licenses/heic-to/NOTICE.txt */
// Loaded only when native decoding fails for an HEIC/HEIF photo. The CSP build
// decodes in a worker without unsafe-eval or sending the photo to another service.
export async function decodeHeic(file){
 const {heicTo}=await import('heic-to/csp');
 const bitmap=await heicTo({blob:file,type:'bitmap',options:{resizeWidth:1800,resizeQuality:'high'}});
 return {source:bitmap,width:bitmap.width,height:bitmap.height,dispose:()=>bitmap.close()};
}
