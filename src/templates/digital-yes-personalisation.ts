// Explicit bindings for each authored customer form. Catalog demos do not use this path.
export function personaliseDigitalYes(FMI:any){
 const {content:c,release}=FMI;if(!c._form?.authored)return;
 const id=release.config.id,flags=c._form;
 const binding=(key:string)=>release.bindings.find((b:any)=>b.key===key);
 const element=(key:string)=>{const b=binding(key);return b?document.querySelector('[data-fmi-copy="'+b.id+'"]') as HTMLElement|null:null;};
 const text=(key:string,value:string)=>{const e=element(key);if(e)e.textContent=value||'';};
 const section=(key:string)=>element(key)?.closest('section');
 const remove=(el:Element|null|undefined)=>{if(!el)return;const target=el.id;if(target)document.querySelectorAll('[href="#'+target+'"],[data-fmi-scroll="'+target+'"]').forEach(link=>link.remove());el.remove();};
 const date=(s:string)=>s?new Date(s+'T12:00:00Z').toLocaleDateString(FMI.localisation?.locale||'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'';
 const time=(s:string)=>{if(!s)return '';const [h,m]=s.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;};
 const value=(path:string)=>path.split('.').reduce((v:any,k:string)=>v?.[k],c)||'';
 // User-entered programme times are absolute, never shifted relative to the demo.
 for(const b of release.bindings){if(!b.key?.startsWith('section'))continue;const e=element(b.key),t=e?.closest('[data-fmi-time]');if(t&&/^\d{2}:\d{2}$/.test(value(b.key))){t.textContent=time(value(b.key));t.removeAttribute('data-fmi-time');}}
 const maps=()=>{document.querySelectorAll('[data-fmi-map],[data-fmi-link]').forEach(e=>{if((e.hasAttribute('data-fmi-map')&&(!e.getAttribute('data-fmi-event')||e.getAttribute('data-fmi-event')==='main'))||['links.link0'].includes(e.getAttribute('data-fmi-link')||''))e.setAttribute('href','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([c.venue,c.address].filter(Boolean).join(', ')));});};
 const personalArt=document.querySelector('[data-fmi-personal-art]');
 if(personalArt&&!c.cover)remove(personalArt.closest('section'));
 if(!personalArt&&c.cover){const photo=document.createElement('section'),img=document.createElement('img');photo.setAttribute('aria-label','Our photograph');photo.style.cssText='padding:3rem 1.5rem;text-align:center';img.src=c.cover;img.alt=c.bride+' & '+c.groom;img.style.cssText='width:min(100%,480px);max-height:620px;object-fit:cover;border-radius:48% 48% 8px 8px';photo.append(img);const rsvp=document.querySelector('[data-fmi-native-rsvp],[data-fmi-rsvp]')?.closest('section');if(rsvp)rsvp.before(photo);else document.getElementById('fmi-page')?.append(photo);}
 const controls:Record<string,Record<string,string>>={
  'embroidered-garden':{story:'section6.text0',dress:'section5.text0',recovery:'section8.text0',gifts:'section9.text0'},
  'mother-of-pearl':{dress:'section4.text0',transport:'section5.text0',hotels:'section6.text0',gifts:'section7.text0'},
  'fresco':{story:'section2.text0',hotels:'section6.text0',gifts:'section7.text0'},
  'stained-glass':{dress:'section5.text0',hotels:'section8.text0',gifts:'section7.text0'},
  'royal':{dress:'section5.text0',transport:'section7.text0',hotels:'section8.text0',gifts:'section9.text0'}
 };
 for(const [flag,key] of Object.entries(controls[id]||{}))if(!flags[flag])remove(section(key));
 if(id==='embroidered-garden'){
  remove(document.querySelector('[data-fmi-choice-group="transport"]')?.parentElement);
  document.querySelectorAll('form[data-fmi-native-rsvp] p').forEach(p=>{if(p.textContent?.includes('our wedding is adults only'))p.remove();});
  text('section4.text1',c.address);text('section4.text2','');
  const event=c.recovery||{};text('section8.text2',event.venue);text('section8.text3','');text('section8.text4',date(event.date));text('section8.text5',time(event.time));text('section8.text6',event.address);text('section8.text7','');
 }
 if(id==='fresco'){
  const welcomeChoice=document.querySelector('[data-fmi-check="event-cruise"]')?.closest('label');
  if(!flags.welcome)remove(welcomeChoice);else {const label=welcomeChoice?.querySelector('span');if(label)label.textContent='Welcome Soirée – '+date(c.welcome?.date);}
  text('section0.text3',[c.venue,c.address].filter(Boolean).join(', '));text('section3.text4',time(c.time));text('section4.text1',date(c.date));
  const whole=section('section5.text0');
  if(!flags.dress&&!flags.welcome)remove(whole);
  else {if(!flags.dress)remove(element('section5.text0')?.parentElement?.parentElement);if(!flags.welcome){const e=element('section5.text4')?.closest('[data-fmi-event="welcome"]');remove(e?.parentElement?.parentElement);}else{text('section5.text3',date(c.welcome?.date));text('section5.text6',[c.welcome?.venue,c.welcome?.address].filter(Boolean).join(', ')+' · '+time(c.welcome?.time));}}
 }
 if(id==='stained-glass'){text('section4.text2',c.address);text('section4.text3','');text('section4.text4',time(c.time));text('section4.text5',c.address);text('section4.text6','');}
 if(id==='royal'){
  text('section3.text1',time(c.time));text('section3.text2',c.address);text('section3.text3','');text('section7.text1',[c.venue,c.address].filter(Boolean).join(', '));
  const whole=section('section6.text0');if(!flags.welcome&&!flags.farewell)remove(whole);
  else for(const [key,offset] of [['welcome',3],['farewell',7]] as const){if(!flags[key])remove(element('section6.text'+offset)?.closest('[data-fmi-event]'));else{const e=c[key]||{};text('section6.text'+(offset+1),date(e.date));text('section6.text'+(offset+2),time(e.time));text('section6.text'+(offset+3),[e.venue,e.address].filter(Boolean).join(', '));}}
 }
 maps();
 // Remove empty hotel cards rather than leaving decorative demo booking buttons.
 const hotelKeys:Record<string,string[]>={'mother-of-pearl':['section6.text2','section6.text7'],'fresco':['section6.text4','section6.text10'],'royal':['section8.text2','section8.text5','section8.text9']};
 for(const key of hotelKeys[id]||[])if(!value(key)){const e=element(key);const card=id==='royal'?e?.closest('h3')?.parentElement:e?.closest('[data-fmi-reveal]');if(card&&card.tagName!=='SECTION')remove(card);}
 const emptyHotelRows:Record<string,string[]>={
  'mother-of-pearl':[3,4,5,8,9,10].map(n=>'section6.text'+n),
  'fresco':[5,6,9,11,12,14,15].map(n=>'section6.text'+n),
  'royal':[4,7,8,11,12].map(n=>'section8.text'+n)
 };
 for(const key of emptyHotelRows[id]||[])if(!value(key))remove(element(key)?.closest('p'));
 document.querySelectorAll('[data-fmi-link]:not([href])').forEach(e=>e.remove());
 if(!c.giftDetails)document.querySelectorAll('[data-fmi-gifts]').forEach(e=>e.remove());
}
