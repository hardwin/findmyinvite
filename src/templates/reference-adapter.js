// Executed only inside the isolated, versioned invitation document.
export function bindReference(FMI){
 const c=FMI.content, q=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)], names=c.groom+' & '+c.bride;
 const text=(s,v)=>{const el=q(s);if(el)el.textContent=v||'';};
 const image=(s,v)=>{const el=q(s);if(el){if(v){el.src=v;el.alt=names;}else el.remove();}};
 const day=d=>new Date(d+'T12:00:00').toLocaleDateString(c.language==='ml'?'ml-IN':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const time=t=>new Date('2027-01-01T'+(t||'00:00')).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
 const old=FMI.theme==='hindu'?['Karthik','Nila']:['Imran','Afrin'];
 const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walk.nextNode()){node.textContent=node.textContent.replaceAll(old[0],c.groom).replaceAll(old[1],c.bride).replaceAll(old.join('Weds'),c.hashtag||'');}
 for(const el of all('[placeholder],[aria-label],img[alt]'))for(const attr of ['placeholder','aria-label','alt'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).replaceAll(old[0],c.groom).replaceAll(old[1],c.bride));
 const namesHeading=q('.names');if(namesHeading){namesHeading.replaceChildren();for(const [i,name] of [c.groom,'&',c.bride].entries()){const span=document.createElement('span');span.className=i===1?'amp':'fmi-name';span.textContent=name;span.style.display='block';namesHeading.append(span);}namesHeading.style.width='100%';const fit=()=>{const ctx=document.createElement('canvas').getContext('2d');for(const el of namesHeading.querySelectorAll('.fmi-name')){el.style.fontSize='';const style=getComputedStyle(el);ctx.font=style.font;const width=ctx.measureText(el.textContent).width;const available=namesHeading.clientWidth;if(width>available)el.style.fontSize=(parseFloat(style.fontSize)*available/width*.97)+'px';el.style.whiteSpace='nowrap';}};document.fonts.ready.then(fit);addEventListener('resize',fit);}
 all('.when,#gate .g-in > .lbl:last-of-type').forEach(el=>el.textContent=(c.date||'').split('-').reverse().join(' · '));
 document.title=names+' | FindMyInvite';document.documentElement.lang=c.language||'en';
 if(c.language==='ml'){
  const style=document.createElement('style');style.textContent='@font-face{font-family:FmiMalayalam;src:url(/assets/flagship/fonts/f3bd7d9f65bad43a.woff2)}html[lang=ml] body,html[lang=ml] h1,html[lang=ml] h2,html[lang=ml] h3,html[lang=ml] .names,html[lang=ml] .lbl,html[lang=ml] button,html[lang=ml] input{font-family:FmiMalayalam,serif;line-height:1.5}';document.head.append(style);
  const labels={'Together with their families':'കുടുംബങ്ങളുടെ അനുഗ്രഹത്തോടെ','are getting married':'വിവാഹിതരാകുന്നു','Light the lantern':'വിളക്ക് തെളിയിക്കൂ','Light a lantern':'ഒരു വിളക്ക് തെളിയിക്കൂ','Light a star':'ഒരു നക്ഷത്രം തെളിയിക്കൂ','Meet the couple':'വധൂവരന്മാരെ പരിചയപ്പെടൂ','A note from us':'ഞങ്ങളുടെ വാക്കുകൾ','Your name':'നിങ്ങളുടെ പേര്','Will you attend?':'നിങ്ങൾ പങ്കെടുക്കുമോ?','Yes, joyfully':'അതെ, സന്തോഷത്തോടെ',"Sorry, can't make it":'പങ്കെടുക്കാൻ കഴിയില്ല','Which events?':'ഏത് ചടങ്ങുകൾ?','Number of guests':'അതിഥികളുടെ എണ്ണം','Directions':'വഴികാട്ടി','Add to calendar':'കലണ്ടറിൽ ചേർക്കുക','Send RSVP on WhatsApp':'വാട്സാപ്പിൽ മറുപടി അയയ്ക്കുക','Things to know':'അറിയേണ്ട കാര്യങ്ങൾ','Good to know':'അറിയേണ്ട കാര്യങ്ങൾ','Save the dates':'വിവാഹദിനം ഓർക്കുക','Your wishes':'നിങ്ങളുടെ ആശംസകൾ','Your duas':'നിങ്ങളുടെ പ്രാർത്ഥനകൾ','Share this invitation':'ക്ഷണം പങ്കിടുക','With love':'സ്നേഹത്തോടെ','Will you join us?':'ഞങ്ങളോടൊപ്പം ചേരുമോ?'};
  setTimeout(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const replacement=labels[n.textContent.trim()];if(replacement)n.textContent=replacement;}},0);
 }
 text('.parents b:first-child',c.groomFamily);text('.parents b:last-child',c.brideFamily);
 text('.cn .par',c.groomFamily);text('.cn .of',c.brideFamily);text('.cn .req',c.welcome);text('.silk > .lede',c.welcome);
 text('.silk > .lbl',c.invocation);text('.velvet > .lbl',c.blessing);text('.note-txt',c.coupleNote);
 text('.on-day',day(c.date));text('.fam',names);text('.tag','#'+(c.hashtag||''));text('#night h2','#'+(c.hashtag||''));
 image('.couple-art img',c.cover);image('.court img',c.cover);image('.end-art img',c.closingImage);
 const facts=q('.know .tiles');if(facts){const sample=facts.firstElementChild?.cloneNode(true);facts.replaceChildren();for(const d of c.details||[]){const el=sample?.cloneNode(true);if(el){const heading=el.querySelector('h3,b');if(heading)heading.textContent=d.title;const p=el.querySelector('p');if(p)p.textContent=d.description;facts.append(el);}}}if(!c.details?.length)q('.know')?.remove();
 text('.demo',FMI.preview?'Preview only. Your RSVP will not be sent.':'Your reply goes to the family on WhatsApp.');
 const music=q('#music');if(c.music)music.src=c.music;else{q('#music-btn').style.display='none';q('#gate small').textContent='Tap to open your invitation';}
 if(c.rsvpDeadline)text('#rsvp > .lede','Kindly reply by '+day(c.rsvpDeadline));else q('#rsvp > .lede')?.remove();
 const card=q('.ev'),container=card?.parentElement,template=card?.cloneNode(true);container?.replaceChildren();
 const routes=q('.routes');const routeTemplate=routes?.querySelector('a')?.cloneNode(true);routes?.replaceChildren();
 const choices=q('input[name=fn]')?.closest('.chips');choices?.replaceChildren();
 for(const [i,e] of (c.events||[]).entries()){
  if(!template||!container)break;const el=template.cloneNode(true);const set=(s,v)=>{const n=el.querySelector(s);if(n)n.textContent=v||'';};
  set('h3',e.title);set('.lbl',day(e.date).split(',')[0]);set('.day',day(e.date));const date=el.querySelector('.day');if(date?.nextElementSibling)date.nextElementSibling.textContent=time(e.time);
  set('.where',[e.venue,e.address].filter(Boolean).join('\n'));set('.note',e.note);const where=el.querySelector('.where');if(where?.nextElementSibling?.tagName==='P')where.nextElementSibling.textContent=e.note||'';
  const pic=el.querySelector('.pic img');if(pic){if(e.image){pic.src=e.image;pic.alt=e.title;}else el.querySelector('.medal,.archf')?.remove();}
  if(e.video){const v=document.createElement('video');v.src=e.video;v.controls=true;v.preload='none';v.style.width='100%';el.append(v);}
  const map=e.mapUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(e.venue+' '+(e.address||''));const a=el.querySelector('.acts a');if(a)a.href=map;
  const cal=el.querySelector('[data-cal]');if(cal){const start=new Date(e.date+'T'+e.time+':00+05:30');const fmt=d=>d.toISOString().replace(/[-:]/g,'').replace('.000','');cal.href='https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:names+' · '+e.title,dates:fmt(start)+'/'+fmt(new Date(+start+7200000)),location:e.venue+' '+(e.address||'')});cal.removeAttribute('data-cal');}
  container.append(el);
  if(routes&&routeTemplate){const r=routeTemplate.cloneNode(true);r.href=map;r.textContent=e.title+' route';routes.append(r);}
  if(choices){const label=document.createElement('label');label.className='chip';const input=document.createElement('input');input.type='checkbox';input.name='fn';input.value=e.title;input.checked=true;const span=document.createElement('span');span.textContent=e.title;label.append(input,span);choices.append(label);}
 }
 if(c.introVideo){const v=document.createElement('video');v.src=c.introVideo;v.controls=true;v.preload='none';v.style.width='100%';q('.note-txt')?.after(v);}
 const instagram=all('a').find(a=>a.href.includes('instagram.com'));if(instagram)instagram.href='https://www.instagram.com/explore/tags/'+encodeURIComponent(c.hashtag||'')+'/';
 const form=q('#rsvp-form');form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();if(FMI.preview){toast('Preview only. Your RSVP was not sent.');return;}if(!/^\d{10,15}$/.test(c.whatsapp||'')){toast('The family has not added a WhatsApp number.');return;}const name=q('#r-name').value.trim();if(!name){q('#r-name').focus();return;}const answer=form.querySelector('input[name=att]:checked')?.value;const reply=['RSVP · '+names,name,answer==='yes'?'Attending':'Unable to attend',answer==='yes'?'Guests: '+q('#g-count').textContent:'',...all('input[name=fn]:checked').map(e=>e.value),q('#r-msg').value].filter(Boolean).join('\n');window.open('https://wa.me/'+c.whatsapp+'?text='+encodeURIComponent(reply),'_blank','noopener,noreferrer');},true);
 q('#share').addEventListener('click',()=>{navigator.clipboard?.writeText(FMI.url).then(()=>toast('Invitation link copied.')).catch(()=>toast(FMI.url));});
 // The demo's optional dua-to-WhatsApp link must never address its original business.
 q('#dua-form')?.addEventListener('submit',()=>setTimeout(()=>{const a=q('#dua-wa');if(a){a.hidden=FMI.preview||!/^\d{10,15}$/.test(c.whatsapp||'');a.href='https://wa.me/'+(c.whatsapp||'')+'?text='+encodeURIComponent(q('#d-text')?.value||'');}},0));
 function toast(message){const el=q('#toast');if(el){el.textContent=message;el.hidden=false;}}
 const skip=document.createElement('button');skip.textContent=c.language==='ml'?'ചടങ്ങുകളുടെ വിവരങ്ങൾ':'Skip to event details';skip.className='fmi-skip';skip.style.cssText='position:fixed;bottom:12px;left:12px;z-index:100;padding:12px;border-radius:24px';skip.onclick=()=>{q('#gate').hidden=true;document.body.classList.remove('locked');q('.ev-head')?.scrollIntoView();};document.body.append(skip);const style=document.createElement('style');style.textContent='.fmi-skip:not(:focus){clip-path:inset(50%);width:1px;height:1px;padding:0!important;overflow:hidden}';document.head.append(style);setTimeout(()=>document.title=names+' | FindMyInvite',0);
}
