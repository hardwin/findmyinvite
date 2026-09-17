import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {HttpError} from './core.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..','studio-snapshots');
const TEMPLATES={
 'royal-temple':{name:'Royal Temple',tier:'royal'},
 'emerald-noir':{name:'Emerald Noir',tier:'classic'}
};
function escapeHtml(value){
 return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function replaceInner(html,attr,key,inner){
 const pattern=new RegExp('(<[^>]*'+attr+'="'+key+'"[^>]*>)([\\s\\S]*?)(<\\/[^>]+>)','gi');
 return html.replace(pattern,(_,open,__body,close)=>open+inner+close);
}
export function studioTemplateIds(){
 const found=new Set();
 try{
  for(const dir of readdirSync(root,{withFileTypes:true})){
   if(!dir.isDirectory())continue;
   try{
    const manifest=JSON.parse(readFileSync(join(root,dir.name,'manifest.json'),'utf8'));
    if(manifest?.templateId&&TEMPLATES[manifest.templateId])found.add(manifest.templateId);
   }catch{}
  }
 }catch{}
 return [...found].sort();
}
export function snapshotHtml(templateId){
 let chosen='';
 try{
  for(const dir of readdirSync(root,{withFileTypes:true})){
   if(!dir.isDirectory())continue;
   try{
    const manifest=JSON.parse(readFileSync(join(root,dir.name,'manifest.json'),'utf8'));
    if(manifest?.templateId===templateId)chosen=readFileSync(join(root,dir.name,'template.html'),'utf8');
   }catch{}
  }
 }catch{}
 if(!chosen)throw new HttpError(400,'That studio design is not available.');
 return chosen;
}
export function eventCards(events){
 if(!Array.isArray(events)||!events.length)return '';
 return events.map((event,index)=>{
  const title=escapeHtml(event?.title||'Celebration');
  const time=escapeHtml(event?.time||'');
  const description=escapeHtml(event?.description||'');
  const active=index===0?' fmi-event-active':'';
  return '<article class="fmi-event'+active+'"><h3>'+title+'</h3><time>'+time+'</time><p>'+description+'</p></article>';
 }).join('');
}
export function bindHtml(html,data){
 if(typeof html!=='string'||!html)return '';
 let out=html;
 const fields=['bride','groom','date','time','welcome','groomDetails','brideDetails','venue','address'];
 for(const key of fields)out=replaceInner(out,'data-field',key,escapeHtml(data?.[key]||''));
 out=replaceInner(out,'data-events','timeline',eventCards(data?.timeline));
 out=replaceInner(out,'data-events','preEvents',eventCards(data?.preEvents));
 const photos=Array.isArray(data?.photos)?data.photos:[];
 out=out.replace(/<img([^>]*data-photo="(\d+)"[^>]*)>/gi,(full,attrs,slot)=>{
  const src=photos[Number(slot)];
  const cleaned=String(attrs).replace(/\s+src="[^"]*"/i,'').replace(/\s+hidden(="[^"]*")?/i,'');
  if(!src)return '<img'+cleaned+' hidden>';
  return '<img'+cleaned+' src="'+escapeHtml(src)+'">';
 });
 const payload=JSON.stringify({
  bride:data?.bride||'',groom:data?.groom||'',date:data?.date||'',time:data?.time||'',
  venue:data?.venue||'',address:data?.address||'',welcome:data?.welcome||'',music:data?.music||''
 }).replace(/</g,'\\u003c');
 const tag='<script>window.fmiData='+payload+';document.dispatchEvent(new Event("fmi:updated"));</script>';
 out=out.replace(/<script>window\.fmiData=[\s\S]*?<\/script>/,'');
 if(/<\/body>/i.test(out))out=out.replace(/<\/body>/i,tag+'</body>');
 else out+=tag;
 return out;
}
export function applyStudioMessage(data,message,section){
 const next={...data,sections:{...data.sections},timeline:[...(data.timeline||[])],preEvents:[...(data.preEvents||[])],photos:[...(data.photos||[])]};
 const text=String(message||'').trim();
 const notes=[];
 const names=text.match(/(?:names?|we)(?:\s+are|\s+is|:)\s+([^&\n,]+?)\s+(?:and|&)\s+([^.!\n,]+)/i);
 if(names){
  next.groom=names[1].trim().slice(0,100);
  if(names[2])next.bride=names[2].trim().slice(0,100);
  notes.push('names');
 }
 const date=text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)||text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
 if(date){
  if(date[1].includes('-'))next.date=date[1];
  notes.push('date');
 }
 const time=text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
 if(time){next.time=time[0].padStart(5,'0');notes.push('time');}
 const venue=text.match(/(?:venue|at)\s+([^.\n]{3,200})/i);
 if(venue&&!names){next.venue=venue[1].trim().slice(0,200);notes.push('venue');}
 if(!notes.length){
  if(section==='welcome'||/message|invite|welcome/i.test(text)){next.welcome=text.slice(0,2000);notes.push('welcome message');}
  else if(section==='venue'){next.venue=text.slice(0,200);notes.push('venue');}
  else next.welcome=((next.welcome?next.welcome+'\n':'')+text).slice(0,2000);
 }
 const changed=notes.length?notes.join(', '):'your invitation copy';
 return {data:next,reply:'I updated '+changed+' on your private preview. Open Details if you want to fine-tune a field.'};
}
export {TEMPLATES as STUDIO_TEMPLATES};
