export const studioSections=[
 {id:'hero',label:'Opening names'},
 {id:'welcome',label:'Welcome'},
 {id:'timeline',label:'Celebrations'},
 {id:'gallery',label:'Photos'},
 {id:'rsvp',label:'RSVP'},
 {id:'venue',label:'Venue'}
] as const;
export const studioFields=[
 {key:'groom',label:"First partner's name",section:'hero',type:'text',required:true,max:100},
 {key:'bride',label:"Second partner's name",section:'hero',type:'text',required:true,max:100},
 {key:'date',label:'Wedding date',section:'hero',type:'date',required:true,max:10},
 {key:'time',label:'Wedding time (India)',section:'hero',type:'time',required:true,max:5},
 {key:'welcome',label:'Your invitation message',section:'welcome',type:'textarea',required:false,max:2000},
 {key:'groomDetails',label:'First partner & family',section:'welcome',type:'textarea',required:false,max:1000},
 {key:'brideDetails',label:'Second partner & family',section:'welcome',type:'textarea',required:false,max:1000},
 {key:'venue',label:'Wedding venue',section:'venue',type:'text',required:true,max:200},
 {key:'address',label:'Venue address',section:'venue',type:'textarea',required:true,max:600}
] as const;
export const studioTemplates={
 'royal-temple':{name:'Royal Temple',tier:'royal',blurb:'A celebration written in the clouds'},
 'emerald-noir':{name:'Emerald Noir',tier:'classic',blurb:'An elegant beginning in emerald & gold'}
} as const;
export const STUDIO_KEY='findmyinvite-studio-v1';
export type StudioAccess={id:string;token:string};
export function readStudioAccess():StudioAccess|null{
 try{
  const value=JSON.parse(localStorage.getItem(STUDIO_KEY)||'null');
  if(value&&typeof value.id==='string'&&typeof value.token==='string')return value;
 }catch{}
 return null;
}
export function writeStudioAccess(value:StudioAccess|null){
 if(value)localStorage.setItem(STUDIO_KEY,JSON.stringify(value));
 else localStorage.removeItem(STUDIO_KEY);
}
