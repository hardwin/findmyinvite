// One event model drives visible dates, countdowns, maps and calendar exports.
export function resolveCinorevEvents(design, content) {
 const zone=/^[+-]\d{2}:\d{2}$/.test(content.utcOffset||'')?content.utcOffset:'+05:30';
 const stamp=value=>new Date(value).toISOString().replace(/[-:]|\.\d{3}/g,'');
 const locale=['ml','ta','te','kn','hi'].includes(content.language)?content.language+'-IN':'en-IN';
 const fmt=(date,options)=>new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const time=value=>new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'UTC'}).format(new Date('2000-01-01T'+value+':00Z')).toUpperCase();
 return design.events.map(source=>{
  const v=content[source.key]||{},date=v.date||source.date,start=v.time||source.time,end=v.end||source.end;
  const at=new Date(date+'T'+start+':00'+zone).getTime();let until=new Date(date+'T'+end+':00'+zone).getTime();if(until<=at)until+=86400000;
  const venue=String(v.venue||''),address=String(v.address||''),title=source.title;
  const maps=/^https:\/\//.test(v.mapUrl||'')?v.mapUrl:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([venue,address].filter(Boolean).join(', '));
  const dates=stamp(at)+'/'+stamp(until),label=(design.id==='up-and-away'?String(content.childName||''):[content.groom,content.bride].filter(Boolean).join(' & '))+' · '+title;
  return {key:source.key,title,date,start,end,at,until,dates,venue,address,note:String(v.note||''),dress:String(v.dress||''),maps,label,day:fmt(date,{weekday:'long'}),longDate:fmt(date,{day:'numeric',month:'long',year:'numeric'}),fullDate:fmt(date,{weekday:'long',day:'numeric',month:'long',year:'numeric'}),month:fmt(date,{month:'long'}),monthYear:fmt(date,{month:'long',year:'numeric'}),dayNumber:String(Number(date.slice(8))),year:date.slice(0,4),time:time(start),endTime:time(end),numeric:date.split('-').reverse().join(' · '),calendar:'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:label,dates,location:[venue,address].filter(Boolean).join(', '),details:String(v.note||'')})};
 });
}
