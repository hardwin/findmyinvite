import {createHash} from 'node:crypto';
import {HttpError} from './core.mjs';
import {injectShareMetadata,escapeHtml} from './share-card.mjs';
import {templateDetailsPath,templateShareImagePath} from '../shared/template-sharing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import {TEMPLATE_SHARE_DESIGN_VERSION,templateShareCardHtml} from '../shared/template-share-card.mjs';

const catalogues=new Map();
const designRevision=createHash('sha256').update(TEMPLATE_SHARE_DESIGN_VERSION+templateShareCardHtml.toString()).digest('hex');
export function templateShareOrigin(req){
 if(process.env.VERCEL_ENV==='production')return 'https://findmyinvite.com';
 if(process.env.VERCEL&&/^[a-z0-9.-]+$/i.test(process.env.VERCEL_URL||''))return 'https://'+process.env.VERCEL_URL;
 const port=req.socket?.localPort;
 if(!process.env.VERCEL&&Number.isInteger(port)&&port>0&&port<65536)return 'http://127.0.0.1:'+port;
 return 'https://findmyinvite.com';
}
export function publicTemplateAsset(value){
 return typeof value==='string'&&!value.includes('..')&&(/^\/assets\/[a-z0-9_/.@-]+$/i.test(value)||/^\/api\/template-media\?id=[a-f0-9-]{36}$/.test(value));
}
export function templateShareRequest(params){
 const id=params.get('product'),kind=params.get('kind')||'website';
 if(!/^[a-z0-9][a-z0-9-]{2,99}$/.test(id||'')||!['video','website'].includes(kind))throw new HttpError(400,'Invalid template.');
 return {id,kind};
}
export async function readPublicBytes(response,limit){
 if(!response.ok||Number(response.headers.get('content-length'))>limit)throw new HttpError(503,'Preview unavailable.');
 const reader=response.body?.getReader();if(!reader)throw new HttpError(503,'Preview unavailable.');
 const chunks=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw new HttpError(503,'Preview unavailable.');chunks.push(Buffer.from(value));}}finally{await reader.cancel();}
 return Buffer.concat(chunks);
}
async function publicCatalogue(origin,kind){
 const key=origin+':'+kind,hit=catalogues.get(key);if(hit&&hit.until>Date.now())return hit.promise;
 const entry={until:Date.now()+30000};
 entry.promise=(async()=>{
  const path=kind==='video'?'/api/video-personalise?action=templates':'/api/templates?action=public';
  const response=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(10000)});
  const data=JSON.parse((await readPublicBytes(response,2000000)).toString());
  if(!Array.isArray(data.templates))throw new HttpError(503,'Template catalogue unavailable.');
  return data;
 })().catch(error=>{catalogues.delete(key);throw error;});
 if(catalogues.size>=8)catalogues.delete(catalogues.keys().next().value);
 catalogues.set(key,entry);return entry.promise;
}
export function templateShareData(row,kind,websiteBasePaise=INVITATION_BASE_PAISE){
 const poster=kind==='video'?row.poster:row.thumbnail;
 const amount=kind==='video'?row.quote?.basePaise:websiteBasePaise;
 if(!publicTemplateAsset(poster)||typeof row.name!=='string'||!Number.isSafeInteger(amount)||amount<0)throw new HttpError(503,'Template preview unavailable.');
 const entry={id:row.id,kind,name:row.name.slice(0,150),poster,artworkRevision:String(row.current_version_id||''),microDescription:String(row.microDescription||'').slice(0,100),templateCode:String(row.templateCode||'').slice(0,20),amountPaise:amount,originalPaise:row.originalPaise??(kind==='website'?49900:undefined),offerLabel:String(row.offerLabel||'').slice(0,50),duration:kind==='video'?Number(row.duration)||0:0};
 // Only public demo assets from the catalogue; never customer exports or editor URLs.
 if(kind==='video'&&publicTemplateAsset(row.preview)&&row.preview.endsWith('.mp4'))entry.video=row.preview;
 entry.revision=createHash('sha256').update(designRevision+':'+(process.env.VERCEL_GIT_COMMIT_SHA||'')+':'+JSON.stringify(entry)).digest('hex').slice(0,16);
 return entry;
}
export async function resolveTemplateShare(params,origin,load=publicCatalogue){
 const {id,kind}=templateShareRequest(params),catalog=await load(origin,kind),row=catalog.templates.find(item=>item.id===id);
 if(!row)throw new HttpError(404,'Template unavailable.');
 return templateShareData(row,kind,catalog.basePaise??INVITATION_BASE_PAISE);
}
export const templateSharePrice=value=>'₹'+(value/100).toLocaleString('en-IN',{maximumFractionDigits:2});
export function templateShareMeta(entry,origin){
 const href=templateDetailsPath(entry.id,entry.kind),label=entry.kind==='video'?'Invitation Video':'Wedding Website';
 return {origin,url:'https://findmyinvite.com'+href,title:`${entry.name} · ${label}`,description:[entry.microDescription,`${templateSharePrice(entry.amountPaise)} + applicable tax`,entry.templateCode].filter(Boolean).join(' · '),image:templateShareImagePath(href,entry.revision),noindex:false};
}
export function injectTemplateShareMetadata(html,entry,origin){
 let result=injectShareMetadata(html,templateShareMeta(entry,origin));
 if(entry.video){
  const url=escapeHtml(new URL(entry.video,origin).href);
  result=result.replace('</head>',`<meta property="og:video" content="${url}"/><meta property="og:video:secure_url" content="${url}"/><meta property="og:video:type" content="video/mp4"/><meta property="og:video:width" content="720"/><meta property="og:video:height" content="1280"/></head>`);
 }
 return result;
}
