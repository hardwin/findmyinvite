// Shared declarative contract. Never accepts executable HTML, CSS or JavaScript.
export const FIELD_TYPES=['text','textarea','date','time','number','boolean','select','image','video','audio','url','group','repeater'];
const keyPattern=/^[a-z][a-zA-Z0-9_]{0,47}$/;
export function validateSchema(schema){
 if(!schema||schema.version!==1||!Array.isArray(schema.fields)||schema.fields.length>60)throw Error('Invalid template field schema.');
 let count=0;
 function fields(list,depth=0){const keys=new Set();if(depth>3||!Array.isArray(list))throw Error('Fields are nested too deeply.');for(const f of list){if(++count>150||!keyPattern.test(f.key)||['constructor','prototype','__proto__'].includes(f.key)||keys.has(f.key)||!FIELD_TYPES.includes(f.type)||typeof f.label!=='string')throw Error('Invalid or duplicate field.');keys.add(f.key);if(f.type==='group'||f.type==='repeater')fields(f.fields,depth+1);if(f.type==='repeater'&&(!Number.isInteger(f.maxItems)||f.maxItems<1||f.maxItems>20))throw Error('Repeaters require a limit of 1–20 items.');if(f.type==='select'&&(!Array.isArray(f.options)||!f.options.length||f.options.some(x=>typeof x!=='string')))throw Error('Select options are required.');}}
 fields(schema.fields);return schema;
}
export function validateContent(schema,input,{complete=false}={}){
 validateSchema(schema);let imageCount=0;
 function visit(fields,value,path=''){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid content object.');const out={};for(const f of fields){const raw=value[f.key],v=typeof raw==='string'?raw.trim():raw,name=path+f.key;if(v===undefined||v===null||v===''){if(complete&&f.required)throw Error(f.label+' is required.');continue;}
 if(f.type==='group'){out[f.key]=visit(f.fields,v,name+'.');continue;}
 if(f.type==='repeater'){if(!Array.isArray(v)||v.length>f.maxItems||complete&&v.length<(f.minItems||0))throw Error('Invalid item count: '+f.label);out[f.key]=v.map((item,i)=>visit(f.fields,item,name+'.'+i+'.'));continue;}
 if(f.type==='boolean'){if(typeof v!=='boolean')throw Error('Invalid '+name);out[f.key]=v;continue;}
 if(f.type==='number'){if(typeof v!=='number'||!Number.isFinite(v)||v<(f.min??0)||v>(f.max??10000))throw Error('Invalid '+name);out[f.key]=v;continue;}
 if(typeof v!=='string'||v.length>(f.maxLength||4000)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw Error('Invalid '+name);
 if(f.type==='select'&&!f.options.includes(v))throw Error('Choose an option for '+f.label);
 if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error('Invalid date.');
 if(f.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw Error('Invalid time.');
 if(f.type==='url'){try{const url=new URL(v);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{throw Error('Links must use HTTPS.');}}
 if(['image','video','audio'].includes(f.type)&&!/^\/api\/template-media\?id=[a-f0-9-]{36}$/.test(v)&&!/^\/assets\/[a-zA-Z0-9/_ .-]+$/.test(v))throw Error('Choose an uploaded media file.');
 if(['image','video','audio'].includes(f.type)&&v.split('/').includes('..'))throw Error('Invalid media path.');
 if(f.type==='image')imageCount++;out[f.key]=v.trim();}
 return out;}
 const out=visit(schema.fields,input);if(imageCount>(schema.maxImages??8))throw Error('This invitation supports up to '+(schema.maxImages??8)+' images.');return out;
}
export function mediaReferences(value){const refs=[];function visit(v){if(typeof v==='string'&&v.startsWith('/api/template-media?id='))refs.push(v.slice('/api/template-media?id='.length));else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);}visit(value);return [...new Set(refs)];}
export function addCalendarMonths(value,months=6){const date=new Date(value);if(!Number.isFinite(date.getTime()))throw Error('Invalid date');const day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+months);const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));return date.toISOString();}
export function websiteQuote(taxBps){if(taxBps===undefined||taxBps===null||taxBps===''||!/^\d+$/.test(String(taxBps))||Number(taxBps)>10000)throw Error('Checkout awaits confirmed tax configuration.');const base=19900,tax=Math.round(base*Number(taxBps)/10000);return {basePaise:base,taxPaise:tax,taxBps:Number(taxBps),totalPaise:base+tax,currency:'INR',months:6};}
