// Pure event resolver, shared by iframe rendering and focused contract tests.
// Keep self-contained: its source is embedded in the isolated invitation document.
export function resolveDigitalYesEvents(config, content) {
  const day = value => new Date(value + 'T12:00:00Z');
  const source = day(config.sourceDate || config.date);
  const wedding = day(content.date || config.date);
  const shift = (date, offset) => new Date(+date + offset * 86400000);
  const iso = date => date.toISOString().slice(0, 10);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th','st','nd','rd'][n % 10] || 'th');
  const minute = value => { const [h,m] = value.split(':').map(Number); return h * 60 + m; };
  const clock = (value, twelve = false) => {
    const n = ((value % 1440) + 1440) % 1440, h = Math.floor(n / 60), m = n % 60;
    return twelve ? `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  const main = {title:'Wedding', date:iso(wedding), time:content.time || config.time, venue:content.venue || '', address:content.address || '', offset:content.utcOffset || '+02:00'};
  const events = {main};
  for (const [key, original] of Object.entries(config.events || {})) {
    const edited = content[key] || {};
    events[key] = {...original, ...edited, date:edited.date || iso(shift(wedding, original.dayOffset)), offset:main.offset};
  }
  const map = event => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([event.venue,event.address].filter(Boolean).join(', '));
  const calendar = event => {
    const start = new Date(event.date + 'T' + event.time + ':00' + event.offset);
    if (!Number.isFinite(+start)) return '';
    const stamp = value => value.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({action:'TEMPLATE',text:[content.bride,content.groom].join(' & ')+' · '+event.title,dates:stamp(start)+'/'+stamp(new Date(+start+7200000)),location:[event.venue,event.address].filter(Boolean).join(', ')});
  };
  const sourceDateAt = (d,m,y) => {
    const original = new Date(Date.UTC(Number(y || source.getUTCFullYear()), months.indexOf(m), Number(d), 12));
    const offset = Math.round((+original - +source) / 86400000);
    return Math.abs(offset) <= 90 ? shift(wedding, offset) : original;
  };
  const transform = (input, eventKey = 'main') => {
    let text = String(input || '');
    const event = events[eventKey] || main;
    const dateAt=(d,m,y)=>{
      const resolved=sourceDateAt(d,m,y);
      const original=config.events?.[eventKey];
      return original&&content[eventKey]?.date?shift(resolved,(+day(event.date)-+shift(wedding,original.dayOffset))/86400000):resolved;
    };
    // Date ranges must be handled before individual dates. Mark replacements to avoid double shifting.
    const replacements = [];
    const hold = value => { replacements.push(value); return `\uE000${replacements.length-1}\uE001`; };
    const monthPattern = months.join('|'), weekdayPattern = weekdays.join('|');
    text = text.replace(new RegExp(`(\\d{1,2})\\s*[–—-]\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})`,'g'), (_,a,b,m,y) => {const first=dateAt(a,m,y),last=dateAt(b,m,y);return hold(first.getUTCMonth()===last.getUTCMonth()?`${first.getUTCDate()} – ${last.getUTCDate()} ${months[last.getUTCMonth()]} ${last.getUTCFullYear()}`:`${first.getUTCDate()} ${months[first.getUTCMonth()]} – ${last.getUTCDate()} ${months[last.getUTCMonth()]} ${last.getUTCFullYear()}`);});
    text = text.replace(new RegExp(`(${monthPattern}) (\\d{1,2})\\s*[–—-]\\s*(\\d{1,2}),? (\\d{4})`,'g'), (_,m,a,b,y) => {const first=dateAt(a,m,y),last=dateAt(b,m,y);return hold(`${months[first.getUTCMonth()]} ${first.getUTCDate()} – ${last.getUTCMonth()===first.getUTCMonth()?'':months[last.getUTCMonth()]+' '}${last.getUTCDate()}, ${last.getUTCFullYear()}`);});
    text = text.replace(new RegExp(`(?:(${weekdayPattern})[, |]+)?(\\d{1,2})(st|nd|rd|th)?(?: of)? (${monthPattern}),?(?: (\\d{4}))?`,'g'), (_,wd,d,ord,m,y) => {const date=dateAt(d,m,y);return hold((wd?weekdays[date.getUTCDay()]+', ':'')+(ord?ordinal(date.getUTCDate()):date.getUTCDate())+' '+months[date.getUTCMonth()]+(y?' '+date.getUTCFullYear():''));});
    text = text.replace(new RegExp(`(?:(${weekdayPattern}),? )?(${monthPattern}) (\\d{1,2})(st|nd|rd|th)?,? (\\d{4})`,'g'), (_,wd,m,d,ord,y) => {const date=dateAt(d,m,y);return hold((wd?weekdays[date.getUTCDay()]+', ':'')+months[date.getUTCMonth()]+' '+(ord?ordinal(date.getUTCDate()):date.getUTCDate())+', '+date.getUTCFullYear());});
    text = text.replace(/\uE000(\d+)\uE001/g,(_,i)=>replacements[Number(i)]);
    const old = eventKey === 'main' ? config : config.events?.[eventKey];
    if (old) {
      if(eventKey!=='main'&&old.venue&&text.trim().startsWith(old.venue)&&(event.venue!==old.venue||event.address!==old.address))text=[event.venue,event.address].filter(Boolean).join(', ');
      if(eventKey!=='main'&&/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*\|?$/.test(text.trim()))text=weekdays[day(event.date).getUTCDay()]+(text.includes('|')?' |':'');
      // Address fragments are whole lines, not words to erase from travel prose.
      if(event.address!==old.address)for(const [i,part] of (old.addressParts||[]).entries())if(text.trim()===part)text=i===0||part.includes(old.venue)?[part.includes(old.venue)?event.venue:'',event.address].filter(Boolean).join(', '):'';
      for (const key of ['venue','address']) if (old[key] && event[key] !== old[key]) text = text.split(old[key]).join(event[key]);
      if (old.time && event.time) {
        const delta = minute(event.time) - minute(old.time);
        if(delta)text = text.replace(/\b(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\b/g, (_,h,m,period) => {
          const n=Number(h), minutes=(period ? n%12+(period==='PM'?12:0) : n)*60+Number(m);
          return clock(minutes+delta,Boolean(period));
        });
        if(delta)text = text.replace(/(?<![\d:])(\d{1,2})\s*(am|pm)\b/gi,(_,h,p)=>clock((Number(h)%12+(p.toLowerCase()==='pm'?12:0))*60+delta,true));
      }
    }
    text=text.replace(/\bBODA20\d\d\b/g,'BODA'+wedding.getUTCFullYear());
    const bookingCode=(config.bride+config.groom+String(source.getUTCFullYear()).slice(-2)).toUpperCase();
    text=text.split(bookingCode).join((content.bride+content.groom+String(wedding.getUTCFullYear()).slice(-2)).toUpperCase());
    // Guest booking codes and uppercase references must follow names too.
    for (const key of ['bride','groom']) {
      const original=config[key], value=content[key] || '';
      if (original) text=text.split(original).join(value).split(original.toUpperCase()).join(value.toUpperCase());
    }
    return text;
  };
  return {events, map, calendar, transform, clock, iso};
}
