import {discoveryMetadata} from './discovery-taxonomy.mjs';

// Storefront demo identities only. Never apply these to a customer invitation.
const identities={
 christian:{en:['Alex','Anna Thomas'],ml:['അലക്സ്','അന്ന തോമസ്'],ta:['அலெக்ஸ்','அன்னா தாமஸ்'],te:['అలెక్స్','అన్నా థామస్'],kn:['ಅಲೆಕ್ಸ್','ಅನ್ನಾ ಥಾಮಸ್'],hi:['एलेक्स','अन्ना थॉमस']},
 hindu:{en:['Karthik','Priya'],ml:['കാർത്തിക്','പ്രിയ'],ta:['கார்த்திக்','பிரியா'],te:['కార్తిక్','ప్రియ'],kn:['ಕಾರ್ತಿಕ್','ಪ್ರಿಯಾ'],hi:['कार्तिक','प्रिया']},
 muslim:{en:['Zayn','Ayisha'],ml:['സെയ്ൻ','ആയിഷ'],ta:['ஸெய்ன்','ஆயிஷா'],te:['జైన్','ఆయిషా'],kn:['ಜೈನ್','ಆಯಿಷಾ'],hi:['ज़ैन','आयशा']}
};
export function previewCouple(tradition,language='en'){
 const pair=identities[tradition]?.[language]||identities[tradition]?.en;
 return pair?{groom:pair[0],bride:pair[1]}:null;
}
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function applyWebsitePreviewNames(content,version){
 const tradition=discoveryMetadata({id:version.template_id,tradition:version.tradition}).tradition;
 const pair=previewCouple(tradition,content.language);if(!pair)return content;
 const replacements=['groom','bride'].filter(role=>content[role]).map(role=>[content[role],pair[role]]).sort((a,b)=>b[0].length-a[0].length);
 const pattern=replacements.length?new RegExp('(?<![\\p{L}\\p{N}])(?:'+replacements.map(([old])=>escape(old)).join('|')+')(?![\\p{L}\\p{N}])','giu'):null;
 const compact=value=>value.replace(/\s/g,'');
 const joined=content.groom&&content.bride?[
  [compact(content.groom)+'Weds'+compact(content.bride),compact(pair.groom)+'Weds'+compact(pair.bride)],
  [compact(content.groom)+compact(content.bride),compact(pair.groom)+compact(pair.bride)],
  [compact(content.bride)+compact(content.groom),compact(pair.bride)+compact(pair.groom)]
 ]:[];
 function walk(value,path=''){
  if(Array.isArray(value))return value.map((v,i)=>walk(v,path+'.'+i));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v,path?path+'.'+k:k)]));
  if(typeof value!=='string'||/^(https?:|\/|data:)/.test(value))return value;
  if(path==='groom'||path==='fatherName')return pair.groom;
  if(path==='bride'||path==='motherName')return pair.bride;
  if(path==='hashtag')return content.language==='en'?pair.groom+'Weds'+pair.bride.replaceAll(' ',''):pair.groom+pair.bride.replaceAll(' ','');
  if(/(?:^|\.)(?:initials|monogram)$/.test(path))return Array.from(pair.groom)[0]+' & '+Array.from(pair.bride)[0];
  // Hashtags and sample booking codes join names without spaces.
  for(const [old,next] of joined)value=value.replace(new RegExp('(?<![\\p{L}])'+escape(old)+'(?![\\p{L}])','giu'),match=>match===match.toUpperCase()?next.toUpperCase():next);
  return pattern?value.replace(pattern,match=>replacements.find(([old])=>old.toLowerCase()===match.toLowerCase())[1]):value;
 }
 return walk(content);
}
