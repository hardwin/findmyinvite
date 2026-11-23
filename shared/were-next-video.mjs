export const WERE_NEXT_ID='film-were-next-v1';
export const WERE_NEXT_SOURCE=Object.freeze({opening:'Everyone is\ngetting married!!',reveal:'We are next !',dateHeading:'SAVE THE DATE',weddingDate:'2026-12-21'});
const question=(path,label,maxLength,type='text',required=true)=>({path,label,maxLength,type,required});
export const WERE_NEXT_DEFINITION={
 id:WERE_NEXT_ID,design:'were-next',name:"We're Next!",collection:'INVITATION VIDEOS',
 description:'Two favourite photos, a playful reveal, and your date.',filename:'were-next-save-the-date.mp4',
 form:{version:1,title:'Personalise your save the date',steps:[
  {id:'opening',title:'Opening',scene:'opening',questions:[question('opening','Opening message',64,'textarea')]},
  {id:'reveal',title:'Your reveal',scene:'reveal',questions:[question('reveal','Reveal message',32)]},
  {id:'date',title:'Save the date',scene:'date',questions:[question('dateHeading','Date heading',28),question('weddingDate','Wedding date',10,'date')]},
  {id:'music',title:'Music',questions:[]},{id:'review',title:'Review & download',questions:[]}
 ]},
 defaults:{...WERE_NEXT_SOURCE,weddingDate:'',photos:{},music:{mode:'library',id:'were-next-original'}},
 example:{...WERE_NEXT_SOURCE,photos:{},music:{mode:'library',id:'were-next-original'}},
 fieldScene:{opening:'opening',reveal:'reveal',dateHeading:'date',weddingDate:'date'},
 photoSlots:[{slot:'opening',label:'Opening couple photo',scene:'opening'},{slot:'reveal',label:'Reveal couple photo',scene:'reveal'}],
 duration:10,kind:'page'
};
