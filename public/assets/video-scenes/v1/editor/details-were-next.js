export const SAMPLE_FIELDS={opening:'Everyone is\ngetting married!!',reveal:'We are next !',dateHeading:'SAVE THE DATE',weddingDate:'2026-12-21'};
export const FIELD_KEYS=Object.freeze(Object.keys(SAMPLE_FIELDS));
export const requiredKeys=()=>FIELD_KEYS;
export const CHAPTERS=[{id:'opening',label:'Opening',loop:[0,5],show:3},{id:'reveal',label:'Your reveal',loop:[5,6.4],show:6},{id:'date',label:'Save the date',loop:[6.4,10],show:9}];
export const durationOf=()=>10;
export const chaptersFor=()=>CHAPTERS;
export const buildDetails=fields=>({...fields});
export function validateFields(fields){
 const errors={};
 for(const [key,max]of Object.entries({opening:64,reveal:32,dateHeading:28})){
  const value=fields[key];
  if(typeof value!=='string'||!value.trim())errors[key]='Enter '+({opening:'the opening message',reveal:'the reveal message',dateHeading:'the date heading'}[key])+'.';
  else if(Array.from(value).length>max||/[<>\u0000-\u0008]/.test(value))errors[key]='Use up to '+max+' characters of plain text.';
 }
 const date=fields.weddingDate||'',parsed=/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+'T12:00:00Z'):null;
 if(!parsed||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)errors.weddingDate='Choose a valid wedding date.';
 return {ok:!Object.keys(errors).length,errors};
}
export function dateParts(value){
 if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return [];
 const [year,month,day]=value.split('-').map(Number),date=new Date(value+'T12:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return [];
 const suffix=day%100>=11&&day%100<=13?'th':({1:'st',2:'nd',3:'rd'}[day%10]||'th');
 return [String(day),suffix,' '+['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][month-1]+', '+year];
}
