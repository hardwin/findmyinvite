// The temple form and visible copy belong to the approved temple master.
export const TEMPLE_ID='temple-v1';
const q=(path,label,required=false,maxLength=80,type='text')=>({path,label,required,maxLength,type});
export const TEMPLE_FORM={version:3,title:'Personalise your temple invitation',steps:[
 {id:'title',title:'Title',scene:'opening',questions:[q('blessing1','Opening title — first line',true,60),q('blessing2','Opening title — second line',true,60)]},
 {id:'invitation',title:'Invitation',scene:'invitation',questions:[q('invitationHeading','Invitation greeting',true,80),q('greeting','Invitation wording',true,180,'textarea')]},
 {id:'groom',title:'Groom',scene:'groom',questions:[q('groomLabel','Groom’s label',false,40),q('groomTitle','Groom’s honorific',false,30),q('groom','Groom’s name',true)]},
 {id:'bride',title:'Bride',scene:'bride',questions:[q('brideLabel','Bride’s label',false,40),q('brideTitle','Bride’s honorific',false,30),q('bride','Bride’s name',true)]},
 {id:'parents',title:'Parents',scene:'family',questions:[q('groomParentsLabel','Groom’s family heading',true,60),q('groomFather','Groom’s first parent',true),q('groomMother','Groom’s second parent'),q('brideParentsLabel','Bride’s family heading',true,60),q('brideFather','Bride’s first parent',true),q('brideMother','Bride’s second parent')]},
 {id:'ceremony',title:'Ceremony',scene:'ceremony',shared:[{step:'venue',label:'Venue from scene 7',fields:['church','address']}],note:'This wedding date also appears in scenes 7 and 10.',questions:[q('ceremonyHeading','Ceremony heading',true,60),q('weddingDate','Wedding date',true,10,'date'),q('weddingTime','Ceremony starts',true,5,'time'),q('weddingEnd','Ceremony ends',false,5,'time')]},
 {id:'venue',title:'Venue',scene:'venue',shared:[{step:'ceremony',label:'Wedding date from scene 6',fields:['weddingDate']}],note:'The venue and address also appear in scene 6.',questions:[q('venueHeading','Venue heading',true,60),q('church','Wedding venue',true,120,'textarea'),q('address','Wedding venue address',true,160,'textarea')]},
 {id:'reception',title:'Reception',scene:'reception',questions:[q('receptionHeading','Reception heading',true,60),q('receptionDate','Reception date',true,10,'date'),q('receptionTime','Reception starts',true,5,'time'),q('receptionEnd','Reception ends',false,5,'time'),q('receptionVenue','Reception venue',true,120,'textarea'),q('receptionAddress','Reception address',true,160,'textarea')]},
 {id:'hosts',title:'Inviting families',scene:'hosts',questions:[q('hostHeading','Invited by heading',true,60),q('host1','First inviting family',true,140,'textarea'),q('host2','Second inviting family',false,140,'textarea')]},
 {id:'closing',title:'Closing',scene:'closing',shared:[{step:'ceremony',label:'Wedding date from scene 6',fields:['weddingDate']}],questions:[q('closing1','First closing line',true,70),q('closing2','Second closing line',false,70)]},
 {id:'music',title:'Music',scene:'closing',questions:[]},
 {id:'review',title:'Review & download',scene:'opening',questions:[]}
]};
export const TEMPLE_DEFAULTS={
 blessing1:'திருமண',blessing2:'அழைப்பிதழ்',invitationHeading:'அன்புடையீர் வணக்கம்',greeting:'எங்கள் திருமணத்திற்கு\nதங்களை அன்புடன்\nஅழைக்கின்றோம்',
 groom:'கோகுல்',groomTitle:'செல்வன்',groomLabel:'மணமகன்',bride:'தீப்யா',brideTitle:'செல்வி.',brideLabel:'மணமகள்',
 groomParentsLabel:'மணமகன் பெற்றோர்',groomFather:'திரு. பார்த்திபன்',groomMother:'திருமதி. ராணி',brideParentsLabel:'மணமகள் பெற்றோர்',brideFather:'திரு. குமார்',brideMother:'திருமதி. தேன்மொழி',
 ceremonyHeading:'முகூர்த்தம்',weddingDate:'2027-02-15',weddingTime:'06:00',weddingEnd:'07:30',venueHeading:'திருமண இடம்',church:'ஸ்ரீ பாலாஜி\nமஹால்',address:'திருப்பூர்',
 receptionHeading:'வரவேற்பு',receptionDate:'2027-02-14',receptionTime:'18:00',receptionEnd:'',receptionVenue:'ஸ்ரீ பாலாஜி மஹால்,',receptionAddress:'திருப்பூர்',
 hostHeading:'அன்புடன் அழைக்கும்',host1:'பார்த்திபன் – ராணி\nகுடும்பத்தினர்',host2:'குமார் – தேன்மொழி\nகுடும்பத்தினர்',closing1:'உங்கள் வருகையை',closing2:'எதிர்நோக்குகிறோம்',photos:{},music:{mode:'none'}
};
const months=['ஜனவரி','பிப்ரவரி','மார்ச்','ஏப்ரல்','மே','ஜூன்','ஜூலை','ஆகஸ்ட்','செப்டம்பர்','அக்டோபர்','நவம்பர்','டிசம்பர்'];
const days=['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'];
export function templeDate(value,short=false){if(!value)return '';const [y,m,d]=value.split('-').map(Number);return short?`${String(d).padStart(2,'0')} · ${String(m).padStart(2,'0')} · ${y}`:`${d} ${months[m-1]} ${y}, ${days[new Date(value+'T12:00:00Z').getUTCDay()]}`;}
export function templeTime(start,end){if(!start)return '';const period=v=>{const h=Number(v.slice(0,2));return h<12?'காலை':h<16?'மதியம்':h<19?'மாலை':'இரவு';};const t=v=>`${Number(v.slice(0,2))%12||12}.${v.slice(3)}`;return `${period(start)} ${t(start)}${end?' – '+(period(end)!==period(start)?period(end)+' ':'')+t(end):''} மணி${end?'':' முதல்'}`;}

export function templeText(c){return {...c,brideName:[c.brideTitle,c.bride].filter(Boolean).join(' '),weddingDateLabel:templeDate(c.weddingDate),weddingDateShort:templeDate(c.weddingDate,true),weddingTimeLabel:templeTime(c.weddingTime,c.weddingEnd),weddingVenueLine:c.church.replace(/\s+/g,' '),ceremonyAddressLine:c.address.replace(/\s+/g,' '),receptionDateLabel:templeDate(c.receptionDate),receptionTimeLabel:templeTime(c.receptionTime,c.receptionEnd)};}
