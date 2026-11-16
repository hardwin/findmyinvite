// Immutable draft definition. The release gate stays closed until encoded
// comparisons and the real form/export flow have passed visual qualification.
export const WEDDING_BELLS_ID='wedding-bells-v1';
const q=(path,label,required=false,maxLength=80,type='text')=>({path,label,required,maxLength,type});
export const form={version:1,title:'Personalise Wedding Bells',steps:[
 {id:'title',title:'Opening',scene:'opening',questions:[q('blessing1','Opening title — first line',true,60),q('blessing2','Opening title — second line',true,60)]},
 {id:'invitation',title:'Invitation',scene:'invitation',questions:[q('invitationHeading','Invitation heading',true,70),q('groomShort','Groom’s name on the invitation board',true,40),q('brideShort','Bride’s name on the invitation board',true,40)]},
 {id:'groom',title:'Groom',scene:'groom',questions:[q('groomTitle','Groom’s honorific',false,20),q('groom','Groom’s full name',true,80)]},
 {id:'bride',title:'Bride',scene:'bride',questions:[q('brideTitle','Bride’s honorific',false,20),q('bride','Bride’s full name',true,80)]},
 {id:'parents',title:'Parents',scene:'family',questions:[q('familyHeading','Family blessing heading',true,70),q('groomParentsLabel','Groom’s family heading',true,50),q('groomFather','Groom’s first parent',true),q('groomMother','Groom’s second parent'),q('brideParentsLabel','Bride’s family heading',true,50),q('brideFather','Bride’s first parent',true),q('brideMother','Bride’s second parent')]},
 {id:'venue',title:'Wedding venue',scene:'venue',questions:[q('venueHeading','Venue heading',true,50),q('church','Church name',true,120,'textarea'),q('address','Church address',true,160,'textarea')]},
 {id:'reception',title:'Reception',scene:'reception',questions:[q('receptionHeading','Reception heading',true,60),q('receptionDate','Reception date',true,10,'date'),q('receptionTime','Reception starts',true,5,'time'),q('receptionVenue','Reception venue',true,120,'textarea'),q('receptionAddress','Reception address',true,160,'textarea')]},
 {id:'hosts',title:'Inviting families',scene:'hosts',questions:[q('hostHeading','Invited by heading',true,60),q('host1','First invitation line',true,100),q('host2','Second invitation line',false,100),q('host3','Third invitation line',false,100),q('closing1','Closing blessing',false,70)]},
 {id:'closing',title:'Save the date',scene:'closing',shared:[{step:'reception',label:'Reception date',fields:['receptionDate']}],questions:[q('saveDateHeading','Save the date heading',true,50),q('weddingDate','Wedding date',true,10,'date')]},
 {id:'music',title:'Music',scene:'closing',questions:[]},
 {id:'review',title:'Review & download',scene:'opening',questions:[]}
]};
export const defaults={blessing1:'With God’s Grace',blessing2:'We Invite You',invitationHeading:'The Wedding of',groomShort:'',brideShort:'',groomTitle:'Mr.',groom:'',brideTitle:'Ms.',bride:'',familyHeading:'With the Blessings of',groomParentsLabel:'Groom’s Parents',groomFather:'',groomMother:'',brideParentsLabel:'Bride’s Parents',brideFather:'',brideMother:'',venueHeading:'Wedding Venue',church:'',address:'',receptionHeading:'Reception - Dinner',receptionDate:'',receptionTime:'',receptionVenue:'',receptionAddress:'',hostHeading:'Invited By',host1:'',host2:'',host3:'',closing1:'With Love & Blessings',saveDateHeading:'SAVE THE DATE',weddingDate:'',photos:{},music:{mode:'none'}};
// Reference copy for paired QA only; historic dates must never become a new
// customer's answers. Match the reference before trying alternate content.
export const referenceContent={...defaults,groomShort:'Alex',brideShort:'Anna',groom:'Alex John',bride:'Anna Thomas',groomFather:'Mr. John Mathew',groomMother:'& Mrs. Elsy John',brideFather:'Mr. Thomas George',brideMother:'& Mrs. Mercy Thomas',church:'St. Mary’s Forane Church',address:'Near Alappuzha\nKerala',receptionDate:'2025-02-14',receptionTime:'19:00',receptionVenue:'Parish Hall Garden',receptionAddress:'Near Alappuzha, Kerala',host1:'Mr. Kurien Abraham',host2:'Mrs. Lizzy Kurien',host3:'Baby. Nia & Noel',weddingDate:'2025-02-15'};
export const WEDDING_BELLS_OUTPUT=Object.freeze({width:720,height:1280,fps:30,frames:832,duration:832/30});
// Half-open frame ranges whose base footage already contains no lettering.
// Other ranges retain the existing per-field restoration path.
export const weddingBellsCleanFrame=(master,frame)=>(master.cleanTextRanges||[]).some(range=>frame>=range.start&&frame<range.end);
export function weddingBellsLayerVisibility(master,frame,unchanged){
 const clean=weddingBellsCleanFrame(master,frame);
 return {restore:!clean&&!unchanged,text:clean||!unchanged};
}
export const WEDDING_BELLS_DEFINITION={id:WEDDING_BELLS_ID,name:'Wedding Bells',collection:'FMI ORIGINALS',description:'A sunlit church, the original moving couple, and your wedding details.',filename:'wedding-bells.mp4',form,defaults,photoSlots:[],rendererVersion:'tracked-film-v1'};
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function weddingBellsDate(value){
 if(!value)return '';
 const [year,month,day]=value.split('-').map(Number);
 if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1||day>31)return '';
 const suffix=day%100>10&&day%100<14?'th':({1:'st',2:'nd',3:'rd'}[day%10]||'th');
 return `${day}${suffix} ${months[month-1]} ${year}`;
}
export function weddingBellsText(content){
 const dates=[...new Set([content.weddingDate,content.receptionDate].filter(Boolean))].sort();
 let dateRange='';
 if(dates.length){const a=dates[0].split('-'),b=dates.at(-1).split('-');dateRange=a[0]===b[0]&&a[1]===b[1]?`${Number(a[2])}${dates.length>1?' & '+Number(b[2]):''} ${months[Number(a[1])-1].toUpperCase()}\n${a[0]}`:dates.map(weddingBellsDate).join('\n').toUpperCase();}
 let receptionTimeLabel='';if(content.receptionTime){const [h,m]=content.receptionTime.split(':').map(Number);receptionTimeLabel=`${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'a.m.':'p.m.'} onwards`;}
 return {...content,coupleShort:[content.groomShort,content.brideShort].filter(Boolean).join(' & '),receptionDateLabel:weddingBellsDate(content.receptionDate),receptionTimeLabel,dateRange};
}
