import {setFormValue} from './template-forms.mjs';
// Follow the wedding date/time only while an event has no independent value.
export function changeWeddingField(content,path,value){
 const next=setFormValue(content,path,value);
 if(['date','time'].includes(path)&&Array.isArray(next.events))next.events=next.events.map(event=>
  !event[path]||event[path]===content[path]?{...event,[path]:value}:event);
 return next;
}
export function ceremonyDefaults(content,fields){
 return Object.fromEntries(fields.filter(f=>['date','time'].includes(f.path)&&content[f.path]).map(f=>[f.path,content[f.path]]));
}
