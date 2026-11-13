// This function is serialized into the isolated invitation frame. Keep its dependencies explicit.
export function startCinorev(config:any, resolveEvents:any){
 const {content:c,design:d,release,preview,reduceMotion}=config;
 const es=resolveEvents(d,c),primary=es.find((e:any)=>e.key===(d.primary||d.events[0].key))||es[0];
 const pair=[c.groom,c.bride].filter(Boolean).join(' & '),phone=String(c.whatsapp||'').replace(/\D/g,'');
 const escape=(v:any)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
 const one=(s:string)=>document.querySelector(s) as HTMLElement|null;
 const all=(s:string,root:ParentNode=document)=>Array.from(root.querySelectorAll(s)) as HTMLElement[];
 const set=(s:string,v:any,root:ParentNode=document)=>all(s,root).forEach(el=>{el.textContent=String(v??'');el.dataset.fmiBound='true';});
 const eventFor=(key:string)=>es.find((e:any)=>e.key===({wed:'wedding',rec:'reception'} as any)[key]||e.key===key)||primary;
 const initials=[c.groom,c.bride].map(v=>Array.from(String(v||'').trim())[0]||'').join(' & ');
 const sourcePair=[release.baseline.groom,release.baseline.bride];
 const replacements:Array<[string,string]>=[[sourcePair[0],String(c.groom||'')],[sourcePair[1],String(c.bride||'')]];
 replacements.push(['Your Family',c.previewGuest||String(config.guest||'').replace(/[-_+]+/g,' ')||'family and friends']);
 if(d.id==='up-and-away')replacements.push(['Diya',String(c.childName||'')]);
 if(d.id==='up-and-away'){const age=Number(c.age||1),ordinal=age+(age===1?'st':age===2?'nd':age===3?'rd':'th');replacements.push(['1st',ordinal],['First Birthday',ordinal+' Birthday'],['turning one','turning '+age],['TurnsOne','Turns'+age]);}
 if(d.id==='home-sweet-home')replacements.push(['Tara',String(c.children||'')]);
 const oldEvents=resolveEvents(d,{groom:sourcePair[0],bride:sourcePair[1],utcOffset:d.zone||'+05:30',...Object.fromEntries(d.events.map((e:any)=>[e.key,e]))});
 oldEvents.forEach((old:any,i:number)=>{const e=es[i];for(const key of ['venue','address','fullDate','longDate','numeric','monthYear'])if(old[key]&&old[key]!==e[key])replacements.push([old[key],e[key]]);replacements.push([old.day+' · '+old.longDate,e.day+' · '+e.longDate]);});
 for(const [key,value] of Object.entries(release.baseline.copy||{}))if(typeof value==='string'&&value.length>5&&typeof c[key]==='string'&&value!==c[key])replacements.push([value,c[key]]);
 const rxEscape=(v:string)=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 // A single pass cannot reinterpret text supplied by a customer as another sample value.
 const namePattern=new RegExp(replacements.map(([a])=>rxEscape(a)).sort((a,b)=>b.length-a.length).join('|'),'g');
 const copy=(value:any,html=false)=>String(value??'').replace(namePattern,(s:string,index:number,whole:string)=>{const v=replacements.find(([a])=>a===s)?.[1]||'';if(v!==s&&v&&whole.slice(index).startsWith(html?escape(v):v))return s;return html?escape(v):v;});
 const textNodes=new WeakMap<Node,string>();
 function personaliseText(root:Node){
  const apply=(n:Node)=>{if(n.parentElement?.closest('script,style,textarea,input,[data-fmi-bound],[data-t]'))return;const old=n.textContent||'';if(textNodes.get(n)===old)return;const next=copy(old);if(next!==old){n.textContent=next;textNodes.set(n,next);}};
  if(root.nodeType===3)apply(root);else{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())apply(n);}
 }
 function toast(message:string){let el=one('#fmi-status');if(!el){el=document.createElement('p');el.id='fmi-status';el.setAttribute('role','status');el.style.cssText='position:fixed;bottom:24px;left:5%;width:90%;z-index:99999;padding:16px;border-radius:12px;background:#fff;color:#171717;font:15px system-ui;text-align:center;box-shadow:0 4px 30px #0003';document.body.append(el);}el.textContent=message;el.hidden=false;setTimeout(()=>{if(el)el.hidden=true;},5000);}
 function open(value:string){
  // about:srcdoc reports a null origin; resolve against the host invitation URL.
  let u:URL;try{u=new URL(value,config.url);}catch{return null;}
  if(u.hostname==='wa.me'||u.hostname==='api.whatsapp.com'){
   if(preview){toast('Preview only. Guest replies go to your WhatsApp number after publishing.');return {};}
   if(!/^\d{8,15}$/.test(phone)){toast('The hosts have not added a reply number yet.');return {};}
   u=new URL('https://wa.me/'+phone+'?text='+encodeURIComponent(copy(u.searchParams.get('text')||'')));
  }
  if(u.protocol!=='https:')return null;
  return window.open(u.href,'_blank','noopener,noreferrer')||{};
 }
 const calendar=(original:any)=>{
  const record=(e:any)=>({text:e.label,dates:e.dates,loc:[e.venue,e.address].filter(Boolean).join(', '),details:e.note,t:e.label,d:e.dates,l:[e.venue,e.address].filter(Boolean).join(', ')});
  if(original.text)return record(primary);
  return {...Object.fromEntries(Object.keys(original).map(k=>[k,typeof original[k]==='object'?record(eventFor(k)):k==='loc'?record(primary).loc:''])),...Object.fromEntries(es.map((e:any)=>[e.key,record(e)]))};
 };
 const events=(original:any[])=>original.map((old,i)=>{const e=es.find((e:any)=>e.key===old.id)||es[i]||primary;return {...old,id:e.key,name:e.title,sub:/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(old.sub||'')?e.day:old.sub,day:e.fullDate,t:e.time,w:escape(e.venue)+'<br>'+escape(e.address),where:[e.venue,e.address].filter(Boolean).join(', '),desc:e.note,note:e.note,dress:e.dress,map:encodeURIComponent(e.venue+', '+e.address),cal:e.dates};});
 all('iframe.map').forEach(el=>{el.removeAttribute('src');el.dataset.src='https://www.google.com/maps?q='+encodeURIComponent(primary.venue+', '+primary.address)+'&output=embed';el.setAttribute('title','Map: '+primary.venue);});
 const authoredText:Record<string,string>={};
 function dictionary(original:any){
  const en={...original.en};for(const key of Object.keys(en))en[key]=copy(en[key],true);
  const put=(keys:string[],v:any)=>keys.forEach(k=>{if(k in en){authoredText[k]=String(v??'');en[k]=escape(v).replace(/\n/g,'<br>');}});
  put(['groom','groomFull','n1'],c.groom);put(['bride','brideFull','n2'],c.bride);
  put(['groomPar','sOf'],c.groomFamily);put(['bridePar','dOf'],c.brideFamily);
  put(['couple','names','sign','g0'],pair);put(['fam','famline','family'],c.closing);
  if(['midnight-stage','little-blessing'].includes(d.id))put(['love'],c.closing);
  put(['where','vshort','vn'],primary.venue);put(['addr'],primary.address);
  put(['when','sat'],primary.fullDate);put(['when2'],primary.longDate+' · '+primary.venue);
  put(['date'],primary.longDate);put(['dow','dDow','day'],primary.day);put(['mon'],primary.month.toUpperCase());put(['dMon','calT'],primary.monthYear);
  put(['time','dSub','dsub'],primary.time);put(['calN'],primary.day+' · '+primary.time);
  put(['momN'],c.motherName);put(['dadN'],c.fatherName);put(['gp'],c.hosts);put(['hijri'],c.alternateDate);
  put(['dcv','dressv','wearv'],c.dressCode);put(['stay'],c.stay);
  if(d.id==='noir-and-gold'){put(['l1'],c.letter);put(['l2'],'');}
  if(d.id==='golden-hour'){put(['t6'],'Dress code');put(['p6'],c.dressCode);}
  if(d.id==='pearl-and-sapphire'){put(['t5'],'Dress code');put(['p5'],c.dressCode);put(['t3'],primary.fullDate);}
  if(d.id==='royal-crimson'){put(['p1'],c.blessing);put(['meaning'],c.prayer);put(['when'],primary.day+' · '+primary.time);}
  const deadline=c.rsvpDeadline?'Kindly reply by '+new Date(c.rsvpDeadline+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})+'.':'We would love to celebrate with you.';
  for(const key of Object.keys(en))if(/Kindly (let us know|reply by)|favour of a reply.*\d/i.test(original.en[key]))en[key]=escape(deadline);
  const programme=Array.isArray(c.programme)?c.programme:[];
  for(let i=1;i<=8;i++){const row=programme[i-1],time=/^\d{2}:\d{2}$/.test(row?.time||'')?new Date('2000-01-01T'+row.time+':00Z').toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).toUpperCase():'';put(['e'+i],row?.title||'');put(['e'+i+'n'],row?.description||'');put(['e'+i+'t'],time);}
  put(['by'],'Invitation website by FindMyInvite');
  return {...original,en};
 }
 function bindEvents(){
  all('[data-cal]').forEach(a=>{
   if(a.dataset.fmiEvent==='bound')return;a.dataset.fmiEvent='bound';
   const e=eventFor(a.dataset.cal||'');a.setAttribute('href',e.calendar);a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');
   const card=a.closest('article,.card,.ev-card,.party-card,.ev,.ecard') as HTMLElement|null;if(!card)return;
   set('.c-d,.day,.d',e.fullDate,card);set('.c-t,.t',e.time,card);set('.c-v,.venue',e.venue,card);set('.addr',e.address,card);
   if(d.id==='up-and-away')set('.dt .day',e.day,card);
   set('.where',[e.venue,e.address].filter(Boolean).join('\n'),card);all('.w',card).forEach((el,i)=>{el.textContent=i===0?[e.venue,e.address].filter(Boolean).join('\n'):e.note;el.dataset.fmiBound='true';});all('.dc,.dress',card).forEach(el=>{el.hidden=!e.dress;});set('.x,.ev-note,.note2',e.note,card);
   const whens=all('.when',card);if(whens[0])whens[0].textContent=e.fullDate;if(whens[1])whens[1].textContent=e.time;
   all('.dm',card).forEach(el=>{el.innerHTML=escape(e.monthYear)+'<span>'+escape(e.time+(c[e.key]?.end?' – '+e.endTime:''))+'</span>';el.dataset.fmiBound='true';});set('.dn,.dd',e.dayNumber,card);set('p.k',e.day,card);
   all('a[href*="maps"]',card).forEach(link=>link.setAttribute('href',e.maps));
  });
  all('a[href*="calendar.google.com"],a[href$=".ics"]').forEach(a=>{if(!a.dataset.cal)a.setAttribute('href',primary.calendar);});
  all('a[href*="maps"]').forEach(a=>{if(!a.closest('article,.card,.ev-card,.party-card,.ev,.ecard'))a.setAttribute('href',primary.maps);});
 }
 function bindContent(){
  all('[data-t]').forEach(el=>{const value=authoredText[el.dataset.t||''];if(value!==undefined){el.textContent=value;el.dataset.fmiBound='true';}});
  // Explicit shared anatomy used by the reviewed designs; never infer a field from arbitrary prose.
  set('.intro .par,.royal .par',c.groomFamily);set('.intro .of,.royal .of',c.brideFamily);
  const uniqueDates=es.filter((e:any,i:number)=>es.findIndex((x:any)=>x.date===e.date)===i),firstDate=uniqueDates[0],lastDate=uniqueDates[uniqueDates.length-1],place=primary.address.split(',').at(-1)?.trim();
  const dateRange=uniqueDates.length===1?primary.fullDate:firstDate.monthYear===lastDate.monthYear?firstDate.dayNumber+' – '+lastDate.longDate:firstDate.longDate+' – '+lastDate.longDate;
  set('.intro .when',[dateRange,place].filter(Boolean).join('\n'));
  set('p.fam,p.fams,.famline',c.closing);set('.g-mono,.c-mono,.mono',initials);
  set('.venue .vn,.venue-sec h3,.venue .addr',primary.venue);set('.venue .addr,.venue-sec .addr',primary.address);
  set('.n-d,.hero .date',primary.numeric);if(d.id==='pattu')set('.g-sub',primary.numeric);set('.d-day',primary.dayNumber);set('.d-yr',primary.year);
  all('[data-t^="e"]').filter(el=>/^e\d+$/.test(el.dataset.t||'')).forEach(el=>{const n=Number(el.dataset.t!.slice(1));const row=el.closest('li,article,.event,.item');if(row)(row as HTMLElement).hidden=!c.programme?.[n-1];});
  if(d.extras.includes('programme')){const section=one('[data-t="e1"]')?.closest('section');if(section)section.hidden=!c.programme?.length;}
  if(d.extras.includes('letter')){const section=one('[data-t="l1"],.letter')?.closest('section');if(section)section.hidden=!c.letter;}
  if(d.extras.includes('dress')){all('.dress,.wear,section[aria-label="Dress code"]').forEach(el=>{el.hidden=!c.dressCode;});if(!c._catalogPreview)all('.pal,.dress .sw,.wear .sw').forEach(el=>{el.hidden=true;});}
  const deadline=c.rsvpDeadline?'Kindly reply by '+new Date(c.rsvpDeadline+'T12:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})+'.':'We would love to celebrate with you.';
  set('#rsvp .lede,#rsvp > .muted,.rsvp-sec > .lede',deadline);
  set('[data-t="groomPar"],[data-t="sOf"]',c.groomFamily);set('[data-t="bridePar"],[data-t="dOf"]',c.brideFamily);
  all('input[name="fn"]').forEach((input,i)=>{const e=es[i];if(!e)return;const label=input.closest('label');if(label)set('span',d.id==='temple-doors'?e.title+' · '+e.dayNumber+' '+e.month.slice(0,3):d.id==='home-sweet-home'?e.title+' · '+e.time:e.title,label);(input as HTMLInputElement).value=e.title;});
  const details=Array.isArray(c.details)?c.details:[];
  const panels=all('.tile,.know details,.know .qa,.know .item,.info details');
  panels.forEach((el,i)=>{const v=details[i];el.hidden=!v;if(v){set('summary,dt,h3,b',v.title,el);set('p,dd',v.description,el);}});
  if(d.id==='olai'){all('.t-date').filter(el=>!el.closest('.ev')).forEach(el=>{el.textContent=primary.fullDate+'\n'+primary.address;el.dataset.fmiBound='true';});all('.ladder .t-body').filter(el=>!el.closest('.ev')).forEach((el,i)=>{el.textContent=[c.groomFamily,c.brideFamily][i]||'';});all('.ev').forEach((el,i)=>{const e=es[i];set('.t-date',e.fullDate,el);set('.t-body',[e.time,e.venue,e.address].filter(Boolean).join('\n'),el);});}
  if(d.id==='midnight-stage')all('.evts .card').forEach((el,i)=>{const e=es[i];set('.c-d',e.fullDate,el);set('.c-t',e.time,el);set('.c-v',e.venue,el);});
  if(d.id==='garden-curtains'){
   const grid=one('#calg');if(grid){grid.replaceChildren();'SMTWTFS'.split('').forEach(day=>{const el=document.createElement('span');el.className='wd';el.textContent=day;grid.append(el);});const date=new Date(primary.date+'T12:00:00Z'),first=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1)).getUTCDay(),count=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();for(let i=0;i<first+count;i++){const el=document.createElement('span');if(i>=first){el.textContent=String(i-first+1);if(i-first+1===date.getUTCDate()){el.className='on';el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart"/></svg><b>'+String(i-first+1)+'</b>';}}grid.append(el);}}
  }
  if(d.id==='royal-crimson'){set('.meaning',c.prayer);set('.addr',primary.address);}
  if(d.id==='jasmine-arch'){set('#gate .g-names + .lbl',primary.numeric+' · '+place);set('.v-top h2',primary.venue);set('.v-top p:not(.lbl)',primary.address);const reception=eventFor('reception');const scratchSection=one('#scratch')?.parentElement;const scratchTail=scratchSection?.querySelector('p[style*="font-style:normal"]');if(scratchTail){scratchTail.textContent=reception.fullDate+' · '+reception.time;scratchTail.setAttribute('data-fmi-bound','true');}all('.ev').forEach((el,i)=>set('.lbl',es[i]?.day||'',el));all('div.fam').forEach((el,i)=>{set('.nm',[c.groom,c.bride][i],el);const p=el.querySelector('p:not(.nm)');if(p)p.textContent=[c.groomFamily,c.brideFamily][i]||'';});const paragraphs=all('.letter .body');paragraphs.forEach((el,i)=>{el.textContent=i===0?c.letter||'':'';});set('.date',primary.numeric);set('.scratch .day',primary.day);set('.scratch .big',primary.longDate);set('.scratch .tm',primary.time);const gallery=one('#stack')?.closest('section') as HTMLElement|null;if(gallery)gallery.hidden=!c.gallery?.length;}
  if(d.id==='palace-of-lights'){set('#env .card > p:last-child',dateRange);set('.royal .dates b',dateRange);set('.royal .dates span',[primary.venue,primary.address].filter(Boolean).join(' · '));all('input[name="arr"]').forEach((input,i)=>{const dt=new Date(firstDate.date+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+i-1);const label=dt.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});(input as HTMLInputElement).value=label;const parent=input.closest('label');if(parent)set('span',label,parent);});set('.meet .note',c.story);set('.royal .gp',c.hosts);set('#s-sky .when',es[0].longDate+' – '+es[es.length-1].longDate);set('#s-sky .title > .lbl','Our families invite you to the wedding of');set('#s-bar .lbl',eventFor('shaadi').fullDate+' · '+eventFor('shaadi').time);const stay=all('.know .tile')[1];if(stay&&c.stay){stay.hidden=false;set('b','Your stay',stay);set('p',c.stay,stay);}}
  if(d.id==='pulli'){set('#kname > p',primary.numeric+' · '+place);set('#events h2',place?'Join us at '+place:'Join our celebrations');}
  if(d.id==='pattu')set('.plaque > .lbl:last-child',primary.fullDate+' · '+place);
  if(d.id==='the-ring-box'){const stories=String(c.story||'').split(/\n\s*\n/);all('#track .panel').forEach((el,i)=>set('p',stories[i]||'',el));const story=one('#track')?.closest('section');if(story)story.hidden=!c.story;set('.mo',c.weddingAnnouncement);all('.duo small').forEach((el,i)=>{el.textContent=[c.groomFamily,c.brideFamily][i]||'';});set('.intro > .lbl:last-child',primary.fullDate+' · '+primary.venue);const announce=one('.mo')?.closest('section');if(announce)announce.hidden=!c.weddingAnnouncement;}
  if(d.id==='home-sweet-home'){const hint=one('.invite .hint2');if(hint)hint.hidden=true;set('.invite .fams',pair);set('.with',c.children?'with '+c.children:'');set('.invite .day,#s-plan .when',primary.fullDate);set('.invite .addr > b',primary.venue);set('.invite .addr > p:not(.lbl):not(.hint2)',primary.address);all('.invite .ev').forEach((el,i)=>set('p:not([class])',es[i]?.note||'',el));}
  if(d.id==='up-and-away'){
   set('.ribbon b','1');set('.ribbon span','st Birthday');set('.bubble',"Hi! I'm "+(c.childName||'')+", and I'm turning one!");set('.party h2',(c.childName||'')+'’s First Birthday Party');set('#s-sky .when',primary.fullDate);
   set('.party-card .dt .day',primary.day);set('.party-card .cal small',primary.month);set('.party-card .cal b',primary.dayNumber);set('.party-card .cal span',primary.year);set('.party-card .dt p:not(.day)',primary.time);set('#s-book .lbl',(c.childName||'')+'’s first year');const book=one('#s-book');if(book)book.hidden=!c.milestones?.length;
   all('#s-book figure').forEach((el,i)=>{const v=c.milestones?.[i];el.hidden=!v;if(v){set('figcaption b',v.age,el);set('figcaption span',v.title,el);set('figcaption em',v.description,el);const img=el.querySelector('img');if(img&&v.photo)img.src=v.photo;}});
  }
  if(d.id==='temple-doors'){
   set('.seal',initials);
   all('.person').forEach((el,i)=>{set('b',[c.groom,c.bride][i],el);set('span',[c.groomFamily,c.brideFamily][i],el);});
   const film=one('#film-video') as HTMLVideoElement|null;if(film){film.removeAttribute('src');film.querySelectorAll('source').forEach(el=>el.remove());if(c.film){film.src=c.film;film.load();}else{const sec=one('#film');if(sec)sec.hidden=true;}}
   set('.hero .time',primary.title+' · '+primary.time+' · '+primary.venue);set('#count-note',primary.fullDate+' · '+primary.time);
   const live=one('a[href*="youtube"],a[href*="youtu.be"],#live-link,span.pill[aria-disabled="true"]');if(live){const section=live.closest('section') as HTMLElement|null;if(section){section.hidden=!c.livestream;set('p.muted',c.livestreamNote,section);}if(c.livestream){const link=document.createElement('a');link.id='live-link';link.className='pill';link.href=c.livestream;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Watch live';live.replaceWith(link);}}
   const album=one('#gal')?.closest('section') as HTMLElement|null;if(album)album.hidden=!c.gallery?.length;
   all('#gal figure').forEach((el,i)=>{const v=c.gallery?.[i];el.hidden=!v?.photo;if(v?.photo){const img=el.querySelector('img');if(img){img.src=v.photo;img.alt=v.caption||'';}set('figcaption',v.caption,el);}});
  }
  if(c.photo){let portrait=one('img[src$="/couple.webp"],img[data-fmi-portrait]') as HTMLImageElement|null;if(!portrait){const section=document.createElement('section');section.className='sec fmi-portrait';section.style.cssText='padding:48px 24px;text-align:center';portrait=document.createElement('img');portrait.style.cssText='display:block;width:min(100%,300px);height:auto;margin:auto;border-radius:8px';section.append(portrait);const intro=one('main > section');intro?.after(section);}if(portrait){portrait.src=c.photo;portrait.alt=pair;}}
  all('audio').forEach(el=>{el.querySelectorAll('source').forEach(s=>s.remove());if(c.music)(el as HTMLAudioElement).src=c.music;else el.removeAttribute('src');});
  all('.tiles,.know').forEach(el=>{const tiles=all('.tile,details',el);if(tiles.length)el.hidden=tiles.every(tile=>tile.hidden);});
  bindEvents();personaliseText(document.body);
 }
 function ready(){
  bindContent();document.documentElement.lang=['en','ml','ta','te','kn','hi'].includes(c.language)?c.language:'en';document.title=pair+' · '+d.occasion;document.documentElement.dataset.fmiReady='true';one('#doors')?.classList.add('ready');
  // Fixed opening scenes need width and height fitting after the selected script font loads.
  const fitNames=()=>{if(c.language==='en'&&pair.length<36)return;all('h1,.g-names').forEach(el=>{el.style.fontSize='';el.style.width='100%';el.style.maxWidth='100%';el.style.minWidth='0';el.style.boxSizing='border-box';el.style.overflowWrap='normal';el.style.wordBreak='normal';let size=parseFloat(getComputedStyle(el).fontSize);while(size>22&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>innerHeight*.4)){size-=1;el.style.fontSize=size+'px';}});};
  document.fonts?.ready.then(fitNames);addEventListener('resize',fitNames);
  const observer=new MutationObserver(records=>{let eventsAdded=false;for(const r of records){if(r.type==='characterData')personaliseText(r.target);else r.addedNodes.forEach(n=>{personaliseText(n);if(n instanceof Element&&(n.matches('[data-cal]')||n.querySelector('[data-cal]')))eventsAdded=true;});}if(eventsAdded)bindEvents();});observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  all('input[placeholder],textarea[placeholder],img[alt]').forEach(el=>{for(const attr of ['placeholder','alt']){const value=el.getAttribute(attr);if(value)el.setAttribute(attr,copy(value));}});
  // Capture submissions before the original choreography's sample handlers.
  for(const form of all('form#rsvp,form#rsvp-form'))form.addEventListener('submit',event=>{
   event.preventDefault();event.stopImmediatePropagation();const name=(form.querySelector('#r-name,input[type="text"]') as HTMLInputElement|null)?.value.trim();if(!name){toast('Please add your name.');return;}
   const fields=Array.from(form.querySelectorAll('input,select,textarea')) as Array<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>;
   const values=fields.filter(el=>!['radio','checkbox'].includes(el.type)||(el as HTMLInputElement).checked).map(el=>el.value).filter(Boolean);
   const counts=all('[role="status"],output',form).map(el=>el.textContent).filter(Boolean);
   const submitter=(event as SubmitEvent).submitter as HTMLButtonElement|null,attendance=submitter?.value==='no'?'Regretfully decline':submitter?.value==='yes'?'Joyfully accept':'';
   open('https://wa.me/'+phone+'?text='+encodeURIComponent('RSVP · '+pair+'\n'+[attendance,...values,...counts.map((n,i)=>(counts.length>1?(i===0?'Adults: ':'Children: '):'Guests: ')+n)].filter(Boolean).join('\n')));
  },true);
  if(!phone&&!c._catalogPreview)all('form#rsvp,form#rsvp-form').forEach(form=>{const section=form.closest('section');if(section)section.hidden=true;});
  document.addEventListener('click',event=>{const a=(event.target as HTMLElement)?.closest('a');if(!a)return;const href=a.getAttribute('href')||'';if(/wa.me|api.whatsapp.com/.test(href)){event.preventDefault();event.stopImmediatePropagation();open(href);}},true);
  if(d.id==='little-blessing'){const note=document.createElement('p');note.textContent='Your prediction is saved on this device.';note.className='body';one('#poll')?.append(note);}
 }
 const storage={getItem:(k:string)=>{try{return localStorage.getItem(config.instanceKey+':'+k);}catch{return null;}},setItem:(k:string,v:string)=>{try{localStorage.setItem(config.instanceKey+':'+k,v);}catch{}}};
  return {target:primary.at,phone,music:c.music||'',maps:primary.maps,search:new URLSearchParams({to:c.previewGuest||config.guest||'',lang:'en'}).toString(),instanceKey:config.instanceKey,reduceMotion,preview,calendar,events,dictionary,copy,open,ready,storage,
  gallery:(original:any[])=>c.gallery?.length?c.gallery.map((v:any)=>[escape(v.photo||''),escape(v.caption||''),escape(v.caption||'')]):original.map(row=>['/assets/cinorev/'+d.id+'/a/'+row[0]+'.webp',row[1],row[2]]),
  samples:(original:any[])=>c._catalogPreview?original:[],
  localResponse:()=>Promise.reject(new Error('This interaction is stored on this device.')),
  share:()=>navigator.share?navigator.share({title:pair+' · '+d.occasion,url:config.url}):navigator.clipboard.writeText(config.url),
  copyLink:()=>navigator.clipboard.writeText(config.url)};
}
