// Self-contained because it is embedded with the invitation runtime.
export function startDigitalYesForms(content:any, preview:boolean, model:any) {
  document.querySelectorAll<HTMLFormElement>('form[data-fmi-native-rsvp]').forEach(form => {
    let guests=1;
    const choice=(key:string)=>form.querySelector<HTMLElement>(`[data-fmi-choice="${key}"][aria-checked="true"]`)?.getAttribute('value') || '';
    const status=form.querySelector<HTMLElement>('[data-fmi-rsvp-status]')!;
    const say=(message:string)=>{status.hidden=false;status.textContent=message;};
    const sync=()=>{
      const attending=choice('attendance')!=='no';
      form.querySelectorAll<HTMLInputElement>('input,textarea').forEach(input=>{input.disabled=!attending&&!['guest','email','message'].includes(input.name);});
      form.querySelectorAll<HTMLButtonElement>('[data-fmi-choice="children"],[data-fmi-choice="transport"],[data-fmi-check]').forEach(button=>{button.disabled=!attending;});
      form.querySelectorAll<HTMLButtonElement>('[data-fmi-guests]').forEach(button=>{button.disabled=!attending||(button.dataset.fmiGuests==='-1'?guests<=1:guests>=10);});
      form.querySelectorAll('[data-fmi-guest-count]').forEach(e=>{e.textContent=String(guests);});
    };
    form.querySelectorAll<HTMLButtonElement>('[data-fmi-choice]').forEach(button=>{
      button.replaceChildren();
      const choose=()=>{
        form.querySelectorAll<HTMLButtonElement>(`[data-fmi-choice="${button.dataset.fmiChoice}"]`).forEach(peer=>{const checked=peer===button;peer.setAttribute('aria-checked',String(checked));peer.dataset.state=checked?'checked':'unchecked';});
        sync();
      };
      button.onclick=choose;
      button.onkeydown=e=>{if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();const peers=Array.from(form.querySelectorAll<HTMLButtonElement>(`[data-fmi-choice="${button.dataset.fmiChoice}"]`));const next=peers[(peers.indexOf(button)+(['ArrowRight','ArrowDown'].includes(e.key)?1:peers.length-1))%peers.length];next.focus();next.click();}};
    });
    form.querySelectorAll<HTMLButtonElement>('[data-fmi-check]').forEach(button=>{button.onclick=()=>{const checked=button.getAttribute('aria-checked')!=='true';button.setAttribute('aria-checked',String(checked));button.dataset.state=checked?'checked':'unchecked';};});
    const list=form.querySelector<HTMLElement>('[data-fmi-guests-list]');
    const first=list?.querySelector<HTMLElement>('[data-fmi-guest-card]');
    const template=first?.cloneNode(true) as HTMLElement|undefined;
    form.querySelectorAll<HTMLButtonElement>('[data-fmi-guests]').forEach(button=>{button.onclick=()=>{
      guests=Math.max(1,Math.min(10,guests+Number(button.dataset.fmiGuests)));
      if(list&&template){
        while(list.children.length>guests)list.lastElementChild?.remove();
        while(list.children.length<guests){
          const index=list.children.length,card=template.cloneNode(true) as HTMLElement;
          card.querySelectorAll<HTMLInputElement>('input').forEach(input=>{input.value='';input.id=(input.id||input.name)+'-'+index;input.name=input.name+'-'+index;input.setAttribute('aria-label',(input.dataset.fmiInput==='guest'?'Guest '+(index+1)+' full name':input.getAttribute('aria-label')||'') );if(input.type==='email')input.remove();});
          const label=card.querySelector('label,span');if(label&&/Person 1|Principal guest/.test(label.textContent||''))label.textContent='Guest '+(index+1);
          list.append(card);
        }
      }
      sync();
    };});
    // Use real guest-entered values only; never retain the reference submission destination.
    form.onsubmit=e=>{
      e.preventDefault();
      if(!choice('attendance')){say('Please choose whether you will attend.');return;}
      const attending=choice('attendance')!=='no';
      const checks=Array.from(form.querySelectorAll<HTMLElement>('[data-fmi-check]'));
      if(attending&&checks.length&&!checks.some(x=>x.getAttribute('aria-checked')==='true')){say('Please select at least one event.');return;}
      if(preview){say('Preview only — your RSVP has not been sent.');return;}
      if(!/^\d{7,15}$/.test(content.whatsapp||'')){say('Please contact the couple directly to confirm your attendance.');return;}
      const lines=[`RSVP for ${content.bride} & ${content.groom}`,`Attending: ${attending?'Yes':'No'}`,`Guests: ${attending?guests:0}`];
      for(const input of Array.from(form.querySelectorAll<HTMLInputElement>('input,textarea'))){if(!input.disabled&&input.value)lines.push((input.getAttribute('aria-label')||input.name)+': '+input.value);}
      if(attending){for(const key of ['children','transport'])if(choice(key))lines.push(key+': '+choice(key));for(const check of checks)if(check.getAttribute('aria-checked')==='true')lines.push('Event: '+model.transform(check.closest('label')?.textContent||''));}
      window.open('https://wa.me/'+content.whatsapp+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener,noreferrer');say('Your RSVP is ready in WhatsApp. Send it there to confirm.');
    };
    sync();
  });
}
