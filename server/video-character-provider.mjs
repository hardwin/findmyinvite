import {createHmac,timingSafeEqual} from 'node:crypto';
import {HttpError} from './core.mjs';
export const CHARACTER_MODEL='openai/gpt-image-2.6-flare';
export const CHARACTER_PROMPT_REVISION='temple-identity-v4';
export function characterPrompt(slot,identity='single',tracking=''){
 return `EDIT THE FIRST IMAGE, do not redesign it. The FIRST image is the exact approved ${slot} layer: a stylized three-dimensional animated-film cartoon with a large expressive head, large rounded eyes, soft rounded facial geometry, smooth illustrated skin and a small elegant body. That exact cartoon style is mandatory. Keep its head size, head position, neck, body silhouette, full-body pose, hands, feet, outfits, fabric colours, hair arrangement, jewellery, accessories, lighting, scale and canvas placement. Only adapt the illustrated facial identity. ${slot==='couple'?'The SECOND image is the approved illustrated groom and the THIRD image is the approved illustrated bride. Use these same two cartoon faces and appearances in the FIRST image’s couple pose. Retain the FIRST image’s exact outfits and composition.':`The SECOND image is an IDENTITY REFERENCE, never an artwork or costume reference. ${identity==='single'?'Use the single person shown.':identity==='auto'?`This is a couple reference. Identify the ${slot} in the reference photo and use only that person's facial identity for the ${slot} artwork. Ignore the other person's face.`:`Use only the person on the ${identity} side as viewed in the photo; ignore the other person.`} Recognisably translate that person's facial features, skin tone and facial hair into the FIRST image’s large-eyed, rounded cartoon face. Do not paste a photographic face, make a realistic head, shrink the head, or change the FIRST image’s cartoon proportions. IGNORE ALL costume, headwear, veil, turban, crowns, makeup styling, earrings, necklaces, nose rings and other accessories in the SECOND image. Preserve only the FIRST image’s existing accessories. If hair is covered in the identity photo, keep the FIRST image’s uncovered hairstyle. Never add a turban or veil.`} Leave everything below the jaw unchanged from the FIRST artwork. Keep the full figure and all feet, at the same positions on a 9:16 canvas (final target 720 by 1280). Real transparent PNG alpha, retaining the FIRST image’s subtle contact shadow only. No scenery, floor, boards, text, names, logos, petals, white background or checkerboard pattern. Do not add or remove people. Tracking reference ${tracking}; never draw this reference.`;
}
export function characterInput(prompt,images){return {prompt,input_images:images,aspect_ratio:'9:16',quality:'high',complexity:'low',output_format:'png',background:'transparent',number_of_images:1};}
export function verifyCharacterWebhook(raw,headers,key,now=Date.now()){
 const id=String(headers['webhook-id']||''),time=String(headers['webhook-timestamp']||'');
 if(!id||!/^\d+$/.test(time)||Math.abs(now/1000-Number(time))>300||!key?.startsWith('whsec_'))return false;
 const expected=createHmac('sha256',Buffer.from(key.slice(6),'base64')).update(id+'.'+time+'.'+raw).digest();
 return String(headers['webhook-signature']||'').split(' ').some(s=>{const [version,value]=s.split(',');if(version!=='v1')return false;const actual=Buffer.from(value||'','base64');return actual.length===expected.length&&timingSafeEqual(actual,expected);});
}
let signingKey;
// The authenticated prediction API also returns signed files from this output
// bucket. Keep the allowlist exact: arbitrary R2 buckets must not be fetched.
const gatewayOutputHost='ai-gateway-outputs.0d37909e38d3e99c29fa2cd343ac421a.r2.cloudflarestorage.com';
export function replicateProvider(env=process.env){
 async function request(path,{method='GET',body,wait=false}={}){
  if(!env.REPLICATE_API_TOKEN)throw new HttpError(503,'Character preparation is not configured.');
  const r=await fetch('https://api.replicate.com/v1/'+path,{method,headers:{Authorization:'Bearer '+env.REPLICATE_API_TOKEN,'Content-Type':'application/json',...(wait?{Prefer:'wait=60'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(wait?75000:45000)});
  if(!r.ok){const detail=await r.json().catch(()=>({}));const e=new HttpError(r.status===429?429:503,'Character preparation is temporarily unavailable. Please retry.');e.providerStatus=r.status;e.providerDiagnostic=JSON.stringify(detail.detail||detail.error||detail.title||'').replace(/data:[^\s"]+/g,'[image]').slice(0,1200);console.error('Replicate request rejected',r.status,e.providerDiagnostic);throw e;}return r.json();
 }
 return {
  create:(input,webhook)=>request('models/'+CHARACTER_MODEL+'/predictions',{method:'POST',wait:true,body:{input,...(webhook?{webhook,webhook_events_filter:['completed']}: {})}}),
  get:id=>request('predictions/'+encodeURIComponent(id)),
  recent:()=>request('predictions'),
  model:()=>request('models/'+CHARACTER_MODEL),
  key:async()=>{if(!signingKey)signingKey=(await request('webhooks/default/secret')).key;return signingKey;},
  async output(url){const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||!(/(^|\.)replicate\.delivery$/.test(u.hostname)||u.hostname===gatewayOutputHost&&u.pathname.startsWith('/provider-outputs/'))){console.error('Character output host rejected',{protocol:u.protocol,host:u.hostname});throw Error('Unrecognized character output host.');}const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(60000)});if(!r.ok||Number(r.headers.get('content-length'))>20*1048576){console.error('Character output transfer rejected',{host:u.hostname,status:r.status,bytes:r.headers.get('content-length')});throw Error('Character output unavailable.');}const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>20*1048576)throw Error('Character output too large.');return bytes;}
 };
}
