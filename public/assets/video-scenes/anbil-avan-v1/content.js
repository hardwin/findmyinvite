export const FIELD_KEYS=['bride','groom','weddingDate','weddingTime','weddingVenue','receptionDate','receptionTime','receptionVenue'];
export const CUTS=[0,2.72,6.08,9.44,12.12,15.48,18.16,24.24,30.32,35.04];
export const CHAPTERS=['Opening','Celebration of Love','Meet our Bride','Bride','Meet our Groom','Groom','Wedding','Reception','Invitation'].map((label,i)=>({id:['opening','celebration','meetBride','bride','meetGroom','groom','wedding','reception','invitation'][i],label,loop:[CUTS[i],CUTS[i+1]],show:CUTS[i+1]-.8}));
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function dateLabel(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return '';const d=new Date(s+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)return '';const [y,m,day]=s.split('-');return day+' '+months[+m-1]+' '+y;}
export function timeLabel(s){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s||''))return '';const [h,m]=s.split(':').map(Number);return 'From '+(h%12||12)+(m?':'+String(m).padStart(2,'0'):'')+' '+(h<12?'Am':'Pm')+' onwards';}
export function validateFields(c,{complete=true}={}){const errors={};for(const k of FIELD_KEYS){const v=c[k]??'',max=/Venue$/.test(k)?60:['bride','groom'].includes(k)?32:10;if(typeof v!=='string'||v.length>max||/[<>\u0000-\u001f]/.test(v))errors[k]='Check this field.';else if(complete&&!v.trim())errors[k]='Complete this field.';else if(v&&(/Date$/.test(k)?!dateLabel(v):/Time$/.test(k)?!timeLabel(v):false))errors[k]='Choose a valid '+(/Date$/.test(k)?'date':'time')+'.';}return {ok:!Object.keys(errors).length,errors};}
export function bindContent(source,c){const scenes=structuredClone(source),text=i=>scenes[i].layers.find(l=>l.kind==='text');
text(3).lines[0].text=String(c.bride||'');text(5).lines[0].text=String(c.groom||'');
for(const [i,prefix] of [[6,'wedding'],[7,'reception']]){const t=text(i);t.lines[1].text=dateLabel(c[prefix+'Date']);t.lines[2].text=timeLabel(c[prefix+'Time']);t.lines[4].text=String(c[prefix+'Venue']||'');}
for(const s of scenes){const t=s.layers.find(l=>l.kind==='text');const count=t.lines.reduce((n,l)=>n+Array.from(new Intl.Segmenter('en',{granularity:'grapheme'}).segment(l.text)).filter(g=>g.segment.trim()).length,0),end=s.dur-1.52;
t.reveal={...t.reveal,mode:'letter',at:0,rate:count>1?(end-.08)/(count-1):0,dur:.08,lineGap:0};t.timing={letters:count,allVisibleAt:count>1?end:0,readHold:1.52};}return scenes;}

