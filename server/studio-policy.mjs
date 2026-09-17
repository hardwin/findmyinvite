import {parse,serialize} from 'parse5';
import {HttpError} from './core.mjs';
export const PILOT_TEMPLATES=['royal-temple','emerald-noir'];
export const SECTIONS=['hero','welcome','timeline','gallery','venue','rsvp'];
const stringLimits={bride:100,groom:100,date:10,time:5,venue:200,address:600,welcome:2000,brideDetails:1000,groomDetails:1000,dressWomen:500,dressMen:500,transport:1500,accommodation:1500,gifts:1500,music:100};
const validDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;};
const validTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function draftData(input,template){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new HttpError(400,'Invitation details are required.');
 const data={template,type:'wedding',id:typeof input.id==='string'?input.id.slice(0,60):'draft'};
 for(const [key,max] of Object.entries(stringLimits)){const v=input[key]??'';if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw new HttpError(400,`Check ${key}.`);data[key]=v;}
 if(data.date&&!validDate(data.date))throw new HttpError(400,'Use a valid date.');
 if(data.time&&!validTime(data.time))throw new HttpError(400,'Use a valid time.');
 if(!['','/assets/track1.mp3','/assets/track3.mp3','/assets/temple/invite-bg.mp3'].includes(data.music))throw new HttpError(400,'Choose an available music track.');
 const photos=input.photos===undefined?[]:input.photos;
 if(!Array.isArray(photos)||photos.length>4)throw new HttpError(400,'Use up to four library photos.');
 data.photos=photos.map(p=>{if(typeof p!=='string'||!/^\/assets\/(?:temple\/)?[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)$/.test(p))throw new HttpError(400,'Choose a library photo for this pilot.');return p;});
 data.sections={};for(const key of ['welcome','scratch','gallery','countdown','timeline','venue','dress','preEvents','transport','accommodation','gifts','rsvp'])data.sections[key]=input.sections?.[key]!==false;
 for(const key of ['timeline','preEvents']){const events=input[key]===undefined?[]:input[key];if(!Array.isArray(events)||events.length>20)throw new HttpError(400,'Use up to 20 events.');data[key]=events.map(e=>{if(!e||typeof e!=='object'||Array.isArray(e)||typeof e.title!=='string'||e.title.length>150||typeof e.time!=='string'||e.time.length>16||typeof e.description!=='string'||e.description.length>1000)throw new HttpError(400,'Check event details.');if(e.time&&!(e.time.length===16&&e.time[10]==='T'&&validDate(e.time.slice(0,10))&&validTime(e.time.slice(11))))throw new HttpError(400,'Use a valid event date and time.');return {title:e.title,time:e.time,description:e.description};});}
 const overrides=input.textOverrides??{};
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).length>200)throw new HttpError(400,'Invalid text edits.');
 data.textOverrides={};for(const [key,value] of Object.entries(overrides)){if(!/^text-\d{1,4}$/.test(key)||typeof value!=='string'||value.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new HttpError(400,'Invalid text edit.');data.textOverrides[key]=value;}
 return data;
}
function walk(node,fn){fn(node);for(const child of node.childNodes||[])walk(child,fn);if(node.content)walk(node.content,fn);}
const textOf=node=>(node.childNodes||[]).map(n=>n.value||'').join('');
const attributeSignature=node=>JSON.stringify((node.attrs||[]).map(a=>[a.namespace||'',a.prefix||'',a.name,a.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
const scriptSignature=node=>JSON.stringify([node.namespaceURI,attributeSignature(node),textOf(node)]);
const localAsset=value=>/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.split('/').some(part=>part==='.'||part==='..');
function safeLink(value){
 if(value.startsWith('#')||localAsset(value))return true;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&((['google.com','www.google.com'].includes(url.hostname)&&(url.pathname==='/maps'||url.pathname.startsWith('/maps/')))||url.hostname==='maps.google.com');}catch{return false;}
}
function safeCss(value){
 // Decode CSS escapes before checking tokens, so u\\72l and @im\\70ort cannot
 // bypass the asset policy. The sandbox CSP remains the runtime boundary.
 const css=value.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\\(?:\r\n|[\r\n\f])/g,'').replace(/\\([0-9a-f]{1,6})\s?|\\([^\r\n\f])/gi,(_,hex,char)=>hex?String.fromCodePoint(Math.min(parseInt(hex,16),0x10ffff)):char);
 return !/@import|expression\s*\(|javascript\s*:|-moz-binding|(?:-webkit-)?image-set\s*\(/i.test(css)&&[...css.matchAll(/url\(\s*['"]?([^)'"\s]+)/gi)].every(m=>localAsset(m[1])||/^#[a-zA-Z0-9_-]+$/.test(m[1]));
}
export function validateTemplate(html,baseline){
 if(typeof html!=='string'||Buffer.byteLength(html)>250000||!html.toLowerCase().includes('<html'))throw new HttpError(400,'The generated template is invalid.');
 const original=parse(baseline),allowedScripts=[],allowedMeta=[],allowedHandlers=new Set(),originalBindings=new Set();
 walk(original,n=>{if(n.tagName==='script')allowedScripts.push(scriptSignature(n));if(n.tagName==='meta')allowedMeta.push(attributeSignature(n));for(const a of n.attrs||[]){if(a.name.startsWith('on'))allowedHandlers.add(a.name+'='+a.value);if(a.name==='data-field')originalBindings.add(a.value);}});
 const doc=parse(html),sections=new Set(),bindings=new Set(),scripts=[],meta=[];
 walk(doc,n=>{
  if(['iframe','object','embed','base','link','animate','animateMotion','animateTransform','set','discard','foreignObject'].includes(n.tagName))throw new HttpError(400,'External code and embedded pages are not allowed.');
  if(n.tagName==='script'){if((n.attrs||[]).some(a=>a.name==='src'))throw new HttpError(400,'External template scripts are not allowed.');scripts.push(scriptSignature(n));}
  if(n.tagName==='meta')meta.push(attributeSignature(n));
  for(const a of n.attrs||[]){
   if(a.name==='data-section')sections.add(a.value);
   if(a.name==='data-field')bindings.add(a.value);
   if(['srcdoc','http-equiv','formaction','action','srcset','imagesrcset','ping','background','codebase','archive'].includes(a.name)||(a.name.startsWith('on')&&!allowedHandlers.has(a.name+'='+a.value)))throw new HttpError(400,'Unsupported executable template content.');
   if(['src','poster'].includes(a.name)&&!localAsset(a.value))throw new HttpError(400,'Use local catalogue assets only.');
   if(a.name==='href'&&((a.namespace||a.prefix)?!a.value.startsWith('#'):!safeLink(a.value)))throw new HttpError(400,'Unsupported template link.');
  }
  const css=n.tagName==='style'?textOf(n):(n.attrs||[]).find(a=>a.name==='style')?.value||'';
  if(!safeCss(css))throw new HttpError(400,'Styles must use local assets.');
 });
 if(JSON.stringify(scripts)!==JSON.stringify(allowedScripts)||JSON.stringify(meta)!==JSON.stringify(allowedMeta))throw new HttpError(400,'Changes to template scripts or metadata require engineering review.');
 if(SECTIONS.some(id=>!sections.has(id))||[...originalBindings,'bride','groom','date','venue'].some(id=>!bindings.has(id)))throw new HttpError(400,'Required invitation sections or data bindings were removed.');
 return serialize(doc);
}
// Personal details are supplied at runtime and never committed into the template source.
export function genericCode(html){const doc=parse(html);walk(doc,n=>{if((n.attrs||[]).some(a=>a.name==='data-field'))n.childNodes=[];if((n.attrs||[]).some(a=>a.name==='data-photo'))n.attrs=n.attrs.filter(a=>a.name!=='src');});return serialize(doc);}
