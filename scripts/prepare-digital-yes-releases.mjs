// Compile inspected, static artwork/layout into audited releases. No reference JS is shipped.
import fs from 'node:fs/promises';
import {parse,parseFragment,serialize} from 'parse5';
import {polishLayout,prepareForms,eventFields,polishBindings} from './digital-yes-polish.mjs';
import {validateContent,validateSchema} from '../shared/template-contract.mjs';
const work='work/digital-yes-batch-1';
const configurations=[
 {id:'embroidered-garden',name:'Embroidered Garden',bride:'Camille',groom:'Antoine',date:'2027-06-12',time:'17:00',venue:'Château de Belvent',address:'Gevrey-Chambertin, Bourgogne',description:'An embroidered Provençal garden, pearl curtains and a flower-filled château.',opening:'intro-doors-open.mp4',poster:'intro-doors.jpg'},
 {id:'mother-of-pearl',name:'Mother of Pearl',bride:'Cornelia',groom:'James',date:'2027-05-20',time:'17:00',venue:'Villa Aurelia',address:'Rome, Italy',description:'Pearlescent ginkgo leaves, a golden seal and luminous embossed florals.',opening:'envelope-oct.mp4',poster:'envelope-oct-poster.jpg',bridge:'intro-bridge.mp4'},
 {id:'fresco',name:'Fresco',bride:'Diana',groom:'Richard',date:'2027-07-27',time:'17:30',venue:'Son Bunyola',address:'Mallorca, Spain',description:'A Mediterranean villa, olive branches and a linen bow in sun-washed colours.',opening:'envelope-video-f1CdBR2C.mp4',poster:'envelope-poster-dG0TpNIf.jpg'},
 {id:'stained-glass',name:'Stained Glass',bride:'Alba',groom:'Felipe',date:'2027-05-23',time:'17:30',venue:'La Baronia',address:'Barcelona, Spain',description:'Floral stained glass, pearlescent light and a romantic garden celebration.',opening:'intro-doors-c.mp4',poster:'intro-closed-c.jpg'},
 {id:'royal',name:'Royal',bride:'Andrea',groom:'Pedro',date:'2027-09-12',sourceDate:'2026-09-12',time:'14:00',venue:'Finca El Olivar',address:'Ronda, Málaga, Spain',description:'An embossed gold seal, ivory paper and refined classical typography.',opening:'intro-video-new-XmwQeafK.mp4',poster:'intro-poster-new-BU7qGwfU.jpg'}
];
const walk=(n,fn)=>{fn(n);for(const c of [...n.childNodes||[]])walk(c,fn);};
const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value||'';
function set(n,key,value){n.attrs??=[];const a=n.attrs.find(a=>a.name===key);if(a)a.value=value;else n.attrs.push({name:key,value});}
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
function remove(n){if(n.parentNode)n.parentNode.childNodes=n.parentNode.childNodes.filter(c=>c!==n);}
const closest=(n,p)=>{for(let e=n;e;e=e.parentNode)if(p(e))return e;return null;};
const fragment=html=>parseFragment(html).childNodes;
const field=(key,label,type='text')=>({key,label,type,maxLength:type==='textarea'?2000:250});
const templates=[];
for(const config of configurations){
 const slug=config.id,dir=`${work}/${slug}`,assets=JSON.parse(await fs.readFile(`${dir}/asset-map.json`,'utf8'));
 const asset=name=>assets.find(a=>a.sourceUrl.split('/').pop()===name)?.local;
 if(!asset(config.opening)||!asset(config.poster))throw Error('Missing opening: '+slug);
 let html=await fs.readFile(`${dir}/open-dom.html`,'utf8');
 for(const a of [...assets].sort((a,b)=>b.source.length-a.source.length))html=html.split(a.source).join(a.local);
 const doc=parse(html);let root;
 walk(doc,n=>{if(attr(n,'id')==='root')root=n;});if(!root)throw Error('No root: '+slug);
 polishLayout(root,config);
 // Strip all third-party execution, analytics, audio, watermark layers and inert notification UI.
 walk(root,n=>{
  const a=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
  if(n.tagName==='video'&&a.src?.includes(config.opening)){const overlay=closest(n,e=>attr(e,'class').split(' ').includes('fixed'));if(overlay){remove(overlay);return;}}
  if(['script','audio','iframe'].includes(n.tagName)||a['aria-label']?.startsWith('Notifications')||a.src?.includes('watermark')){if(a.src?.includes('watermark'))remove(closest(n,e=>attr(e,'class').includes('fixed'))||n);else remove(n);return;}
  if(n.tagName==='canvas'&&n.parentNode===root)remove(n);
  n.attrs=(n.attrs||[]).filter(a=>!/^on|^data-lov|^data-component|^data-source/.test(a.name));
  if(n.tagName==='img'){set(n,'loading','eager');set(n,'decoding','async');}
  if(n.tagName==='video'){if(attr(n,'src').includes(config.opening)){if(slug==='embroidered-garden'){n.tagName='img';n.nodeName='img';n.attrs=[{name:'src',value:'/assets/flagship/embroidered-garden/hero-final.jpg'},{name:'alt',value:''},{name:'class',value:'absolute inset-0 h-full w-full object-cover'}];}else remove(n);}else{set(n,'muted','');set(n,'playsinline','');set(n,'loop','');set(n,'autoplay','');}}
  if(/opacity:\s*0(?:;|$)/.test(a.style||'')){set(n,'style',(a.style||'').replace(/(?:opacity|transform|filter):[^;]+;?/g,''));}
  if(n.tagName==='a'&&text(n).includes('The Digital Yes')){n.childNodes=fragment('FindMyInvite');set(n,'href','/templates');set(n,'target','_top');}
  if(n.tagName==='button'&&['EN','ES','DE','Silenciar','Mute','Unmute'].includes(text(n).trim()))remove(n);
 });
 // Preserve each design’s layout; attach only our own submission logic.
 prepareForms(root);
 let rsvp;walk(root,n=>{if(attr(n,'id')==='rsvp')rsvp=n;});
 if(rsvp&&!serialize(rsvp).includes('data-fmi-native-rsvp')){
  let envelope;walk(rsvp,n=>{if(attr(n,'aria-label')==='Open the RSVP envelope')envelope=n;});
  if(envelope){set(envelope,'data-fmi-envelope','');set(envelope,'type','button');}
  const holder=fragment('<div data-fmi-rsvp'+(envelope?' hidden':'')+'></div>')[0];holder.parentNode=rsvp;rsvp.childNodes.push(holder);
 }
 const deadlines={'embroidered-garden':'2027-03-31','mother-of-pearl':'2027-05-01',fresco:'2027-05-15','stained-glass':'2027-04-23',royal:'2027-08-12'};
 const defaults={language:'en',bride:config.bride,groom:config.groom,date:config.date,time:config.time,utcOffset:'+02:00',venue:config.venue,address:config.address,giftDetails:'',rsvpDeadline:deadlines[slug]};
 for(const [key,event] of Object.entries(config.events))defaults[key]={time:event.time,venue:event.venue,address:event.address};
 const fields=[{key:'language',label:'Language',type:'select',options:['en','ml'],required:true},{...field('bride','First partner name'),required:true},{...field('groom','Second partner name'),required:true},{key:'date',label:'Wedding date',type:'date',required:true},{key:'time',label:'Wedding time',type:'time',required:true},{key:'utcOffset',label:'Wedding time zone',type:'select',options:['+05:30','+02:00','+01:00','+00:00','-04:00','-05:00','+04:00','+08:00'],required:true},field('venue','Wedding venue'),field('address','Venue city and region')];
 fields.push(...eventFields(config));
 const bindings=[],groups=new Map();let count=0;
 const originalDate=new Date((config.sourceDate||config.date)+'T12:00:00Z');
 const dateFormats=[['long','en-GB',{day:'numeric',month:'long',year:'numeric'}],['us','en-US',{day:'numeric',month:'long',year:'numeric'}],['full','en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}],['numeric','de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}]];
 const formatted=dateFormats.map(([kind,locale,options])=>[kind,originalDate.toLocaleDateString(locale,{...options,timeZone:'UTC'})]).sort((a,b)=>b[1].length-a[1].length);
 const skips=/^(Countdown|Days|Hours|Minutes|Seconds|Made with love by|FindMyInvite|&|and|·|✦|PM|AM|RSVP|Tap to open|Scratch to\s*reveal|Discover|Where we celebrate|Where We Celebrate|Recommended stay|Wedding Guest Rate|Parking|Address|Block Dates|Rates|Booking Code|Our Recommendation|To the venue)$/i;
 // Bind text nodes, preserving their exact surrounding layout and inline ornaments.
 const nodes=[];walk(root,n=>{if(n.nodeName==='#text'&&n.value.trim()&&!closest(n,e=>['script','style','button','a','form','svg'].includes(e.tagName)))nodes.push(n);});
 for(const n of nodes){const value=n.value.trim();if(skips.test(value)||/^[\s\d.,–—-]+$/.test(value)&&!closest(n,e=>attr(e,'id')==='countdown')&&slug!=='fresco'&&!formatted.some(([,v])=>value===v))continue;
  const section=closest(n,e=>e.tagName==='section'||e.tagName==='footer')||root;
  let group=groups.get(section);if(!group){let heading;walk(section,e=>{if(!heading&&/^h[23]$/.test(e.tagName||''))heading=text(e).trim();});group={key:'section'+groups.size,label:heading||(['Invitation cover','Welcome'][groups.size]||'Invitation details'),fields:[]};groups.set(section,group);defaults[group.key]={};}
  const id='copy'+count++;let binding={id,prefix:n.value.match(/^\s*/)[0],suffix:n.value.match(/\s*$/)[0]};
  if(closest(n,e=>attr(e,'id')==='countdown')&&/^\d+$/.test(value)){binding.kind='countdown';binding.part=bindings.filter(b=>b.kind==='countdown').length;}
  else if(closest(n,e=>attr(e,'id')==='rsvp')&&/2027|fifteenth of May/i.test(value)){binding.kind='deadline';binding.pattern=value.replace(/(?:\d{1,2}\s+(?:March|April|May)\s+2027|May\s*1,\s*2027|the fifteenth of May,\s*2027)/i,'{date}');}
  else if(slug==='fresco'&&['July','Tuesday','2027','25','26','27','28','29'].includes(value)){binding.kind='datePart';binding.part=value==='July'?'month':value==='Tuesday'?'weekday':value==='2027'?'year':'day';binding.offset=/^2\d$/.test(value)?Number(value)-27:0;}
  else if(value===config.bride||value===config.groom||value===config.venue||value===config.address){binding.key=value===config.bride?'bride':value===config.groom?'groom':value===config.venue?'venue':'address';}
  else if(formatted.some(([,v])=>value.toLowerCase().includes(v.toLowerCase()))){const [kind,date]=formatted.find(([,v])=>value.toLowerCase().includes(v.toLowerCase()));binding.kind='date';binding.format=kind;binding.pattern=value.replace(new RegExp(date.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),'{date}');}
  else if(value==='Sunday, 23rd of May, 2027'){binding.kind='date';binding.format='full';binding.pattern='{date}';}
  else if(/(?:IBAN|BIC|SWIFT|CAIXABANK|BANCO SANTANDER|ES00\s+0000)/i.test(value)){binding.key='giftDetails';}
  else if(value.includes(config.bride)||value.includes(config.groom)){binding.kind='names';binding.pattern=value;}
  else {const key='text'+group.fields.length;group.fields.push(field(key,value.length>65?value.slice(0,62)+'…':value,value.length>100?'textarea':'text'));defaults[group.key][key]=value;binding.key=group.key+'.'+key;}
  const span=fragment('<span data-fmi-copy="'+id+'"></span>')[0];span.childNodes=[{nodeName:'#text',value:binding.key==='giftDetails'?'':n.value,parentNode:span}];span.parentNode=n.parentNode;n.parentNode.childNodes[n.parentNode.childNodes.indexOf(n)]=span;bindings.push(binding);
 }
 for(const group of groups.values())if(group.fields.length)fields.push({key:group.key,label:group.label,type:'group',fields:group.fields});
 const links=[];walk(root,n=>{if(n.tagName==='a'&&!text(n).includes('FindMyInvite'))links.push(n);});
 const linkFields=[];defaults.links={};
 for(const [i,n] of links.entries()){const href=attr(n,'href');if(!href.startsWith('https://')){remove(n);continue;}const key='link'+i;linkFields.push({key,label:text(n).trim()||'More information',type:'url'});defaults.links[key]=href;set(n,'data-fmi-link','links.'+key);set(n,'rel','noopener noreferrer');set(n,'target','_blank');}
 if(linkFields.length)fields.push({key:'links',label:'Directions and booking links',type:'group',fields:linkFields});
 walk(root,n=>{if(n.tagName==='button'){const label=text(n).trim().toLowerCase();if(label.includes('maps')){set(n,'data-fmi-map','');}else if(label.includes('calendar'))set(n,'data-fmi-calendar','');else if(label.includes('bank')||label.includes('registry'))set(n,'data-fmi-gifts','');else if(label==='rsvp')set(n,'data-fmi-scroll','rsvp');else if(label==='scroll down'||label==='discover')set(n,'data-fmi-scroll','countdown');}});
 // Baked personal names in the scratch illustration become editable text, preserving the decorative frame.
 walk(root,n=>{if(n.tagName==='canvas'){set(n,'data-fmi-scratch','');set(n,'aria-label','Scratch to reveal');}if(n.tagName==='img'&&attr(n,'alt')===config.bride+' & '+config.groom){set(n,'data-fmi-personal-art','');}});
 fields.push(field('giftDetails','Optional gift details','textarea'),{key:'rsvpDeadline',label:'RSVP deadline',type:'date'},field('whatsapp','RSVP WhatsApp number (country code, digits only)'),{key:'cover',label:'Optional couple photograph',type:'image'},{key:'music',label:'Optional background music',type:'audio'});
 const t={id:slug,name:config.name,description:config.description,tradition:'christian',renderer:slug+'-v1',revision:3,thumbnail:asset(config.poster),reference:'https://www.thedigitalyes.com/demo/'+slug,field_schema:{version:1,maxImages:8,fields},defaults};
 validateSchema(t.field_schema);t.defaults=validateContent(t.field_schema,t.defaults,{complete:true});
 const release={config:{...config,opening:asset(config.opening),poster:asset(config.poster),bridge:config.bridge?asset(config.bridge):null},bindings,html:polishBindings(root,config,bindings)};
 await fs.writeFile(`public/assets/flagship/${slug}/document.json`,JSON.stringify(release));templates.push(t);
 console.log(slug,bindings.length,'bindings',fields.reduce((s,f)=>s+1+(f.fields?.length||0),0),'fields');
}
await fs.writeFile('shared/digital-yes-templates.json',JSON.stringify(templates,null,2)+'\n');
