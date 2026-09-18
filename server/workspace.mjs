import {readFile} from 'node:fs/promises';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {db,HttpError} from './core.mjs';
import {validateTemplate} from './studio-policy.mjs';
import renderers from '../public/studio/renderers.json' with {type:'json'};
export const isSku=id=>/^sku-[a-f0-9-]{36}$/.test(id||'');
export async function baseHtml(id){if(!renderers.htmlTemplates.includes(id))throw new HttpError(400,'This design needs a visual-editor adapter.');return readFile(new URL(`../public/studio/templates/${id}.html`,import.meta.url),'utf8');}
export async function liveDesign(id){if(!isSku(id))throw new HttpError(404,'Design not found.');const [row]=await db('workspace_live?id=eq.'+id+'&select=*&limit=1');if(!row)throw new HttpError(404,'This design is not published.');return row;}
export const assetPattern=/\/assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg|mp4|webm|mp3|wav|ogg|woff2?)(?:#t=[0-9.]+)?/gi;
export const assetList=html=>[...new Set(html.match(assetPattern)||[])];
export function remap(html,assets){for(const [from,to] of Object.entries(assets||{}).sort((a,b)=>b[0].length-a[0].length))html=html.split(from).join(to);return html;}
export async function validDesign(html,baseId,assets={}){
 const base=await baseHtml(baseId),sources=new Set(assetList(base));
 if(!assets||typeof assets!=='object'||Array.isArray(assets)||Object.keys(assets).length>200)throw new HttpError(400,'Invalid asset replacements.');
 for(const [from,to] of Object.entries(assets)){if(!sources.has(from)||typeof to!=='string'||!/^\/assets\/workspace\/[a-f0-9-]{36}\.(png|jpg|webp|gif|mp4|webm|mp3|wav|ogg)$/.test(to))throw new HttpError(400,'Choose a workspace media file for each replacement.');}
 const source=String(html||'').replace(/<!-- FMI_WORKSPACE [\s\S]*?-->/g,'');
 return validateTemplate(source,remap(base,assets));
}
const secret=()=>process.env.WORKSPACE_SESSION_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY;
const sign=value=>createHmac('sha256',secret()).update('fmi-workspace:'+value).digest('hex');
export function workspaceSession(req){if(!secret())return false;const token=String(req.headers.cookie||'').match(/(?:^|;\s*)fmi_workspace=([^;]+)/)?.[1]||'';const [expiry,sig]=token.split('.');if(!/^\d+$/.test(expiry)||!/^([a-f0-9]{64})$/.test(sig||'')||+expiry<Date.now()||+expiry>Date.now()+13*3600000)return false;return timingSafeEqual(Buffer.from(sig),Buffer.from(sign(expiry)));}
export function workspaceCookie(){if(!secret())throw new HttpError(503,'Workspace storage is not configured.');const expiry=String(Date.now()+12*3600000);return `fmi_workspace=${expiry}.${sign(expiry)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.VERCEL?'; Secure':''}`;}
export function decodeMedia(data){const m=/^data:(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm)|audio\/(?:mpeg|wav|ogg));base64,([a-zA-Z0-9+/]+={0,2})$/.exec(data||'');if(!m)throw new HttpError(400,'Use PNG, JPEG, WebP, GIF, MP4, WebM, MP3, WAV or OGG.');const bytes=Buffer.from(m[2],'base64');if(bytes.length<12||bytes.length>3*1024*1024)throw new HttpError(413,'For this MVP, each media file must be 3 MB or smaller.');const type=m[1];const checks={'image/png':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'image/jpeg':bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'image/webp':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP','image/gif':bytes.toString('ascii',0,3)==='GIF','video/mp4':bytes.toString('ascii',4,8)==='ftyp','video/webm':bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])),'audio/mpeg':bytes.toString('ascii',0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224,'audio/wav':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE','audio/ogg':bytes.toString('ascii',0,4)==='OggS'};if(!checks[type])throw new HttpError(400,'The media content does not match its file type.');return {bytes,type,ext:{'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3','audio/wav':'wav','audio/ogg':'ogg'}[type]};}
