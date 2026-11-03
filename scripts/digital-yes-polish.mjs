import {parseFragment,serialize} from 'parse5';
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
const walk=(n,f)=>{f(n);for(const c of [...n.childNodes||[]])walk(c,f);};
const set=(n,k,v)=>{n.attrs??=[];const a=n.attrs.find(a=>a.name===k);if(a)a.value=v;else n.attrs.push({name:k,value:v});};
const remove=n=>{if(n.parentNode)n.parentNode.childNodes=n.parentNode.childNodes.filter(c=>c!==n);};
const closest=(n,fn)=>{for(let p=n;p;p=p.parentNode)if(fn(p))return p;return null;};
const fragment=html=>parseFragment(html).childNodes;
export const eventsByTemplate={
 'embroidered-garden':{recovery:{title:'Recovery Day',dayOffset:1,time:'12:00',venue:'Le Comptoir des Halles',address:'4 Rue Monge, Beaune, Bourgogne, France',addressParts:['4 Rue Monge, Beaune','Bourgogne, France']}},
 'fresco':{welcome:{title:'Welcome Soirée',dayOffset:-1,time:'20:00',venue:'Sa Terrassa',address:'Son Bunyola, Mallorca'}},
 'royal':{welcome:{title:'Welcome Drinks',dayOffset:-1,time:'20:00',venue:'Bodega García Hidalgo',address:'Ronda, Spain'},farewell:{title:'Farewell Brunch',dayOffset:1,time:'12:00',venue:'Parador de Ronda',address:'Ronda, Spain'}}
};

export function polishLayout(root,config){
 config.events=eventsByTemplate[config.id]||{};
 config.addressParts={
  'embroidered-garden':['Gevrey-Chambertin','Bourgogne'],
  'stained-glass':['Carretera de Caldes, km 14,4','08182 Sant Feliu de Codines, Barcelona','Sant Feliu de Codines','Barcelona'],
  royal:['Camino de los Olivos s/n, Ronda','Málaga, 29400 – España','Finca El Olivar, Camino de los Olivos s/n, 29400 Ronda, Málaga – Spain']
 }[config.id]||[];
 // Keep an explicit destination for every event action.
 walk(root,n=>{
  if(n.tagName==='section'&&attr(n,'id')==='recovery-day')set(n,'data-fmi-event','recovery');
  if(n.tagName==='iframe'){
   const p=fragment('<div class="fmi-map" data-fmi-map-embed="main"></div>')[0];
   p.parentNode=n.parentNode;n.parentNode.childNodes[n.parentNode.childNodes.indexOf(n)]=p;
  }
  if(n.tagName==='button'&&/^(Silenciar|Mute|Unmute)$/i.test(attr(n,'aria-label')))remove(n);
  if(n.tagName==='div'&&attr(n,'class').includes('fixed')&&/^(ENES|ENDE)$/.test(text(n).replace(/\s/g,'')))remove(n);
  if(n.tagName==='img'&&/^[A-Z] & [A-Z]$/.test(attr(n,'alt'))){set(n,'data-fmi-seal','');}
  if(n.tagName==='div'&&attr(n,'class').includes('flex')&&attr(n,'style').includes('translateX(')&&n.childNodes.some(c=>c.tagName==='img'||c.childNodes?.some(d=>d.tagName==='img'))){set(n,'data-fmi-gallery','');}
  // Capture finite entrance geometry for our own observer; never execute reference scripts.
  if(/opacity:\s*0(?:;|$)/.test(attr(n,'style'))&&/transform:/.test(attr(n,'style'))&&!closest(n,e=>['form','button'].includes(e.tagName))){set(n,'data-fmi-reveal','');}
 });
 // Main venue artwork may split its label across multiple spans. Bind the whole heading.
 walk(root,n=>{if(/^h[1-4]$/.test(n.tagName||'')&&text(n).replace(/\s/g,'').toLowerCase()===config.venue.replace(/\s/g,'').toLowerCase()){
  n.childNodes=fragment(config.venue);for(const c of n.childNodes)c.parentNode=n;
 }});
}

export function prepareForms(root){
 walk(root,form=>{if(form.tagName!=='form')return;
  set(form,'data-fmi-native-rsvp','');form.attrs=form.attrs.filter(a=>!['action','method'].includes(a.name));
  const groups=[];walk(form,n=>{if(attr(n,'role')==='radiogroup')groups.push(n);});
  for(const [i,group]of groups.entries()){
   const key=i===0?'attendance':text(group.parentNode).toLowerCase().includes('children')?'children':'transport';
   set(group,'data-fmi-choice-group',key);
   const label=group.parentNode.childNodes.find(c=>c.tagName==='label');if(label)set(group,'aria-label',text(label));
   walk(group,n=>{if(n.tagName==='button'&&attr(n,'role')==='radio'){set(n,'data-fmi-choice',key);set(n,'tabindex','0');}if(n.tagName==='input'&&attr(n,'aria-hidden')==='true')remove(n);});
  }
  walk(form,n=>{
   if(attr(n,'id')==='website')remove(n.parentNode);
   if(n.tagName==='input'&&attr(n,'aria-hidden')==='true')remove(n);
   if(n.tagName==='button'&&attr(n,'role')==='checkbox'){set(n,'data-fmi-check',attr(n,'id'));}
   if(n.tagName==='button'&&(/^(Increase|Decrease)$/.test(attr(n,'aria-label'))||/^[+-]$/.test(text(n).trim()))){
    set(n,'data-fmi-guests',/^(Increase|\+)$/.test(attr(n,'aria-label')||text(n).trim())?'1':'-1');set(n,'aria-label',attr(n,'data-fmi-guests')==='1'?'Increase guests':'Decrease guests');
    const counter=n.parentNode.childNodes.find(c=>c.tagName==='span'&&/^\d+$/.test(text(c)));if(counter){set(counter,'data-fmi-guest-count','');set(counter,'aria-live','polite');}
   }
   if(['input','textarea'].includes(n.tagName)){
    const placeholder=attr(n,'placeholder'),id=attr(n,'id');
    const key=attr(n,'type')==='email'?'email':id.includes('dietary')||/allerg|dietary/i.test(placeholder)?'dietary':n.tagName==='textarea'?'message':'guest';
    set(n,'name',key);set(n,'data-fmi-input',key);set(n,'aria-label',key==='guest'?'Full name':key==='email'?'Email address':key==='dietary'?'Dietary requirements':'Message for the couple');
    if(key==='guest'){set(n,'required','');set(n,'autocomplete','name');}
    if(key==='email')set(n,'autocomplete','email');
   }
  });
  const principal=[];walk(form,n=>{if(n.tagName==='input'&&attr(n,'name')==='guest')principal.push(n);});
  if(principal[0]&&groups.length>1&&groups.some(g=>attr(g,'data-fmi-choice-group')==='children')){
   let card=principal[0].parentNode;set(card,'data-fmi-guest-card','');set(card.parentNode,'data-fmi-guests-list','');
  }
  const status=fragment('<p role="status" data-fmi-rsvp-status hidden></p>')[0];status.parentNode=form;form.childNodes.push(status);
 });
}

export function eventFields(config){return Object.entries(config.events).map(([key,event])=>({key,label:event.title+' details',type:'group',fields:[{key:'date',label:'Date (leave blank to follow wedding date)',type:'date'},{key:'time',label:'Start time',type:'time'},{key:'venue',label:'Venue',type:'text',maxLength:250},{key:'address',label:'Address',type:'text',maxLength:250}]}));}
export function eventFor(node){return attr(closest(node,n=>attr(n,'data-fmi-event'))||{},'data-fmi-event')||'main';}

export function polishBindings(root,config,bindings){
 // Source bank details and identifiers must never survive as demo payment instructions.
 walk(root,n=>{if(n.nodeName==='#text'&&/ES00\s+0000|BIC\s+XXXX|IT60\s+X054/.test(n.value))n.value='';});
 // Secondary event dates and venues are marked by their containing card.
 const eventHeadings={'Welcome Drinks':'welcome','Farewell Brunch':'farewell','WelcomeSoirée':'welcome'};
 walk(root,n=>{if(/^h[1-4]$/.test(n.tagName||'')){
   const original=text(n).trim(),key=eventHeadings[original];if(!key||!config.events[key])return;
   let card=n.parentNode;
   set(card,'data-fmi-event',key);
 }});
 walk(root,n=>{if(attr(n,'data-fmi-copy')){const binding=bindings.find(b=>b.id===attr(n,'data-fmi-copy'));if(binding)binding.event=eventFor(n);}});
 walk(root,n=>{const match=text(n).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);if(match&&n.tagName&&!n.childNodes.some(c=>c.tagName&&/^(\d{1,2}):(\d{2})\s*(AM|PM)$/.test(text(c).trim()))){set(n,'data-fmi-time',`${Number(match[1])%12+(match[3]==='PM'?12:0)}:${match[2]}`);set(n,'data-fmi-time-event',eventFor(n));}});
 // Turn map/calendar controls into ordinary inspectable anchors, using resolved event data.
 walk(root,n=>{if(n.tagName==='button'&&(attr(n,'data-fmi-map')!==''||n.attrs?.some(a=>a.name==='data-fmi-map')||n.attrs?.some(a=>a.name==='data-fmi-calendar'))){n.nodeName=n.tagName='a';n.attrs=n.attrs.filter(a=>a.name!=='type');set(n,'data-fmi-event',eventFor(n));set(n,'target','_blank');set(n,'rel','noopener noreferrer');}});
 return serialize(root);
}
