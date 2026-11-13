import {invitationTranslations,languageLocale} from '../../shared/invitation-languages.mjs';
import {previewDictionary} from '../../shared/preview-translations.mjs';

export function localisationConfig(content:Record<string,any>){
 const protectedText:string[]=[];
 const walk=(value:any,path:string)=>{if(typeof value==='string'&&!/^section\d+\.text0$/.test(path))protectedText.push(value.trim().toLowerCase());else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,path?path+'.'+k:k);};
 walk(content,'');
 return {language:content.language||'en',locale:languageLocale(content.language),catalog:content._catalogPreview===true,thumbnail:content._catalogThumbnail===true,translations:content._catalogPreview?previewDictionary(content.language):invitationTranslations[content.language]||{},protectedText:content._catalogPreview?[]:protectedText};
}

// Self-contained: embedded only into audited invitation documents, never stored as form data.
export function localiseInvitationDocument(config:any,root:Node=document.body){
 if(config.thumbnail){document.documentElement.setAttribute('data-fmi-thumbnail','');const gate=document.getElementById('gate');if(gate)gate.hidden=true;document.body.classList.remove('locked');}
 if(!['ta','te','kn','hi',...(config.catalog||config.malayalam?['ml']:[])].includes(config.language))return;
 const normalize=(value:string)=>value.trim().replace(/\s+/g,' ').replace(/[’‘]/g,"'").toLowerCase();
 const dictionary=Object.fromEntries(Object.entries(config.translations).map(([k,v])=>[normalize(k),v])) as Record<string,string>,protectedText=new Set(config.protectedText);
 const translate=(value:string)=>{const trimmed=value.trim(),suffix=trimmed.endsWith('*')?' *':'',key=normalize(trimmed.replace(/\s*\*$/,''));if(protectedText.has(key))return value;const translated=dictionary[key];if(translated)return value.replace(trimmed,translated+suffix);if(!config.catalog)return value;
  let result=value;
  if(/^a note from /i.test(trimmed))return dictionary['a note from us'];
  if(/^a (dua|blessing) for /i.test(trimmed))return dictionary['a prayer or blessing for the couple…'];
  if(/^write your name and a short dua for /i.test(trimmed))return dictionary['write your name and a short dua'];
  if(/^write your name, tap the button and send a wish up to /i.test(trimmed))return dictionary['write your name and send a wish'];
  if(/^(I|II|III|IV)$/.test(trimmed))return String(['I','II','III','IV'].indexOf(trimmed)+1);
  // Dynamic values stay intact; only these explicitly authored surrounding labels change.
  for(const phrase of ["Nothing would make us happier than celebrating this day surrounded by our favourite people. Please let us know whether you'll be able to join us by",'The favour of a reply is kindly requested by','Wedding Ceremony & Reception','Welcome Soirée','Kindly reply by','Kindly respond by','Until','Person','Main contact','Your Family','Dear','Guest','Child','years old','years','route','Lefèvre','Marchand','full name','wedding invitation','and']){const replacement=dictionary[normalize(phrase)];if(replacement)result=result.replace(new RegExp('(?<!\\p{L})'+phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?!\\p{L})','giu'),replacement);}
  result=result.replace(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,(_,n,month)=>n+' '+dictionary[month.toLowerCase()]);
  result=result.replace(/(\d)(st|nd|rd|th)\b/gi,'$1').replace(/(\d)\s*(AM|PM)\b/gi,(_,n,period)=>n+' '+dictionary[period.toLowerCase()]);
  return result;
 };
 const text=(node:Node)=>{if(node.nodeType!==3||node.parentElement?.closest('script,style,noscript,textarea'))return;const value=node.textContent||'',next=translate(value);if(next!==value)node.textContent=next;};
 const visit=(root:Node)=>{if(root.nodeType===3){text(root);return;}const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())text(n);if(root instanceof Element){for(const el of [root,...Array.from(root.querySelectorAll('[aria-label],[placeholder],[title]'))])for(const key of ['aria-label','placeholder','title']){const value=el.getAttribute(key);if(value){const next=translate(value);if(next!==value)el.setAttribute(key,next);}}}};
 visit(root);
 const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')visit(record.target);else record.addedNodes.forEach(visit);}});
 observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
 if(root instanceof Element)root.setAttribute('data-fmi-localised',config.language);
 return ()=>observer.disconnect();
}
