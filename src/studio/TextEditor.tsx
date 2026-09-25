import sanctuaryDefaults from '../../public/studio/royal-sanctuary.defaults.json';
import renderers from '../../public/studio/renderers.json';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,ChevronLeft,ChevronRight,Eye,PenLine,Undo2,X,ArrowUpRight} from 'lucide-react';
import NativePreview from './NativePreview';
import {useCatalog} from '../catalog';
import StudioPreview,{studioSections} from './StudioPreview';
import {defaultInvite} from '../Invitation';
import type {InviteData} from '../Invitation';
import {newGuestKey,guestKeys,rememberGuest} from '../guest-api';
import schema from '../../public/studio/fields.json';
import './text-editor.css';
type Access={id:string;token:string;template?:string;type?:string};
type Draft={id:string;template:string;data:InviteData;html:string;revision:number;busy:boolean;publishedSlug?:string};
type Selection={key:string;value:string;section?:string;label?:string;type?:string;max?:number};
const storage='findmyinvite-editor-v1';
const readAccess=():Access|null=>{try{
 const q=new URLSearchParams(location.search);
 // Catalogue "Use this design" always starts a fresh draft — do not reopen an old template match.
 if(q.get('new')==='1')return null;
 const current=JSON.parse(localStorage.getItem(storage)||'null');
 const saved=JSON.parse(localStorage.getItem(storage+'-history')||'[]');
 if(!q.get('draft')||current?.id===q.get('draft'))return current;
 return saved.find((x:Access)=>x.id===q.get('draft'))||null;
}catch{return null}};
async function api<T>(action:string,key:Access|null,body?:unknown):Promise<T>{
 for(let n=0;n<20;n++){
  const r=await fetch('/api/studio?action='+action+(key?'&id='+key.id:''),{method:body===undefined?'GET':'POST',headers:{...(key?{Authorization:'Bearer '+key.token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
  if(r.status===423){await new Promise(resolve=>setTimeout(resolve,1000));continue;}
  let j;try{j=await r.json()}catch{throw Error('The connection was interrupted. Your edits are kept on this device. Try saving again.');}
  if(!r.ok){
   const err=Error(j.error||'Could not save. Please try again.') as Error & {status?:number};
   err.status=r.status;
   throw err;
  }
  return j;
 }throw Error('This draft is busy in another tab. Close that tab and try saving again.');
}
export default function TextEditor(){
 const {items:designs}=useCatalog();
 const [mode,setMode]=useState<'form'|'editor'>(location.pathname.startsWith('/form')?'form':'editor');
 const started=useRef(false);const selectedDesign=designs.find(t=>t.id===new URLSearchParams(location.search).get('template'));const creationInFlight=useRef(false);
 const [library,setLibrary]=useState(false),[access,setAccess]=useState<Access|null>(readAccess),[draft,setDraft]=useState<Draft|null>(null),[section,setSection]=useState('hero'),[preview,setPreview]=useState(false),[selection,setSelection]=useState<Selection|null>(null),[status,setStatus]=useState('Opening your draft…'),[error,setError]=useState(''),[loading,setLoading]=useState(Boolean(readAccess())),[publishing,setPublishing]=useState(false),[showPublish,setShowPublish]=useState(false),[slug,setSlug]=useState(''),[published,setPublished]=useState(''),[undoCount,setUndoCount]=useState(0),[keyboard,setKeyboard]=useState(0);
 const current=useRef<Draft|null>(null),keyRef=useRef(access),undo=useRef<InviteData[]>([]),dirty=useRef(false),saveTask=useRef<Promise<void>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),generation=useRef(0),input=useRef<HTMLInputElement|HTMLTextAreaElement|null>(null),editingStart=useRef<InviteData|null>(null);
 useEffect(()=>{const t=new URLSearchParams(location.search).get('template');if(!access&&!started.current&&new URLSearchParams(location.search).get('new')==='1'&&designs.some(d=>d.id===t)){started.current=true;void create(t!)}},[access,designs]);
 useEffect(()=>{const pop=()=>setMode(location.pathname.startsWith('/form')?'form':'editor');addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[]);
 async function switchMode(next:'form'|'editor'){done();try{await save();setMode(next);history.pushState({},'',`/${next}?draft=${current.current!.id}`)}catch{/* Preserve unsaved draft and stay in this mode. */}}
 function adopt(d:Draft){current.current=d;setDraft(d);}
 useEffect(()=>{if(!access)return;let active=true;setLoading(true);api<Draft>('read',access).then(d=>{if(!active)return;keyRef.current=access;const remembered={...access,template:d.template,type:d.data.type};localStorage.setItem(storage,JSON.stringify(remembered));history.replaceState({},'',`/${mode}?draft=${d.id}`);const backup=localStorage.getItem(storage+'-'+d.id);if(backup){try{const b=JSON.parse(backup);if(b?.data&&typeof b.data==='object'){// Always re-apply local recovery onto the latest online revision (never leave dirty=false with a stuck error).
 d={...d,data:b.data as InviteData};dirty.current=true;backup({...d,revision:d.revision,data:d.data});setStatus(b.revision===d.revision?'Recovered unsaved edits · tap Save':'Recovered your edits onto the latest draft · tap Save');} }catch{/* keep online version */}}adopt(d);setSlug(d.publishedSlug||'');setError('');if(!dirty.current)setStatus('All changes saved');}).catch(e=>setError(e.message)).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[access]);
 useEffect(()=>{const protect=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',protect);const viewport=window.visualViewport;const resize=()=>setKeyboard(Math.max(0,window.innerHeight-(viewport?.height||window.innerHeight)-(viewport?.offsetTop||0)));viewport?.addEventListener('resize',resize);return()=>{window.removeEventListener('beforeunload',protect);viewport?.removeEventListener('resize',resize);if(timer.current)clearTimeout(timer.current)}},[]);
 useEffect(()=>{if(selection){input.current?.focus();input.current?.select();}},[selection?.key]);
 function backup(d:Draft){try{localStorage.setItem(storage+'-'+d.id,JSON.stringify({revision:d.revision,data:d.data}))}catch{setError('Device backup is unavailable. Keep this tab open until saving completes.')}}
 async function save():Promise<void>{if(saveTask.current)return saveTask.current;if(!current.current||!keyRef.current)return;if(!dirty.current){setError('');setStatus('All changes saved');return;}if(timer.current)clearTimeout(timer.current);
 const task=(async()=>{
  let conflicts=0;
  while(dirty.current&&current.current&&keyRef.current){
   const sent=current.current,version=generation.current;setStatus('Saving…');
   try{
    const saved=await api<Draft>('save',keyRef.current,{revision:sent.revision,data:sent.data});
    const latest={...saved,data:current.current!.data};adopt(latest);
    if(version===generation.current){dirty.current=false;localStorage.removeItem(storage+'-'+saved.id);setStatus('All changes saved');}
    else backup(latest);
   }catch(e){
    const err=e as Error & {status?:number};
    const conflict=err.status===409||/changed elsewhere|Reload to use|changed\. Reload/i.test(err.message||'');
    if(conflict&&conflicts<2&&keyRef.current){
     conflicts++;
     const fresh=await api<Draft>('read',keyRef.current);
     const localData=current.current!.data;
     adopt({...fresh,data:localData});
     dirty.current=true;
     backup(current.current!);
     setStatus('Synced to latest draft · saving your edits…');
     continue;
    }
    throw err;
   }
  }
 })();
 saveTask.current=task;try{await task;setError('')}catch(e){setStatus('Not saved · retry');setError((e as Error).message);throw e}finally{saveTask.current=null}}
 async function retrySave(){
  try{
   if(!dirty.current&&current.current&&keyRef.current){
    // Stale toast with nothing dirty — re-read then save if recovery still pending.
    const fresh=await api<Draft>('read',keyRef.current);
    const backupRaw=localStorage.getItem(storage+'-'+fresh.id);
    if(backupRaw){
     try{
      const b=JSON.parse(backupRaw);
      if(b?.data){adopt({...fresh,data:b.data});dirty.current=true;backup(current.current!);}
      else adopt(fresh);
     }catch{adopt(fresh);}
    }else adopt(fresh);
   }
   await save();
  }catch{/* toast already set */}
 }
 function schedule(){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void save().catch(()=>{})},850)}
 function commit(data:InviteData){if(!current.current)return;generation.current++;dirty.current=true;const next={...current.current,data};adopt(next);backup(next);setStatus('Unsaved changes');setPublished('');schedule();}
 function select(s:Selection){if(!current.current||preview)return;if(selection)done();const field=s.key.startsWith('field:')?[...schema.fields,...['dressWomen','dressMen','transport','accommodation','gifts'].map(key=>({key,label:key.replace(/([A-Z])/g,' $1'),type:'textarea',max:key.startsWith('dress')?500:1500}))].find(f=>f.key===s.key.slice(6)):undefined;let value=s.value,type='textarea',label='Invitation wording',max=2000;if(field){value=String(current.current.data[field.key as keyof InviteData]||'');type=field.type;label=field.label;max=field.max;}else if(s.key.startsWith('event:')){const [list,index,part]=s.key.slice(6).split('.');if(!['timeline','preEvents'].includes(list))return;const event=current.current.data[list as 'timeline'|'preEvents'][Number(index)];if(!event||!['title','time','description'].includes(part))return;value=event[part as keyof typeof event];type=part==='time'?'datetime-local':'textarea';label=part==='time'?'Event date & time':part==='title'?'Event title':'Event description';max=part==='title'?150:1000;}else if(!/^text-\d{1,4}$/.test(s.key))return;
 editingStart.current=structuredClone(current.current.data);setSelection({...s,value,label,type,max});if(s.section)setSection(s.section);
 }
 function change(value:string){if(!selection||!current.current)return;const data=structuredClone(current.current.data),key=selection.key;if(key.startsWith('field:')){const field=key.slice(6);Object.assign(data,{[field]:value});}else if(key.startsWith('event:')){const [list,index,part]=key.slice(6).split('.');Object.assign(data[list as 'timeline'|'preEvents'][Number(index)],{[part]:value});}else data.textOverrides={...data.textOverrides,[key]:value};setSelection({...selection,value});commit(data);}
 function done(){if(editingStart.current&&current.current&&JSON.stringify(editingStart.current)!==JSON.stringify(current.current.data)){undo.current.push(editingStart.current);if(undo.current.length>30)undo.current.shift();setUndoCount(undo.current.length);}editingStart.current=null;setSelection(null);void save().catch(()=>{});}
 function undoLast(){done();const previous=undo.current.pop();if(previous){commit(previous);setUndoCount(undo.current.length);}}
 async function create(template:string){if(creationInFlight.current)return;creationInFlight.current=true;setLoading(true);setError('');try{const token=newGuestKey('draft').token,data={...structuredClone(defaultInvite),template,type:new URLSearchParams(location.search).get('type')||defaultInvite.type,date:new Date(Date.now()+45*86400000).toISOString().slice(0,10),groom:template==='luxury-pink'?'Ashok':'Rohan',bride:template==='luxury-pink'?'Supriya':'Ananya',music:template==='royal-heritage-wedding'?'':template==='royal-temple'?'/assets/temple/invite-bg.mp3':'/assets/track1.mp3',textOverrides:{}};if(template==='royal-sanctuary'){Object.assign(data,sanctuaryDefaults)}else{data.timeline=data.timeline.map(e=>({...e,time:data.date+'T'+data.time}));data.preEvents=data.preEvents.map(e=>({...e,time:data.date+'T'+(e.time.split('T')[1]||data.time)}));}if(template!=='royal-sanctuary'){data.welcome='With our families, we invite you to celebrate our wedding.';data.brideDetails='With her loving family';data.groomDetails='With his loving family';}const d=await api<Draft>('create',null,{template,token,data});const key={id:d.id,token,template,type:data.type};const previous=keyRef.current||JSON.parse(localStorage.getItem(storage)||'null');if(previous){const history=JSON.parse(localStorage.getItem(storage+'-history')||'[]');localStorage.setItem(storage+'-history',JSON.stringify([...history.filter((x:Access)=>x.id!==previous.id),{...previous,template:current.current?.template||previous.template}].slice(-20)));}dirty.current=false;undo.current=[];setUndoCount(0);setSection('hero');setSelection(null);setLibrary(false);setPublished('');localStorage.setItem(storage,JSON.stringify(key));keyRef.current=key;setAccess(key);history.replaceState({},'',`/${mode}?draft=${d.id}`);adopt(d);setStatus('All changes saved');}catch(e){setError((e as Error).message)}finally{creationInFlight.current=false;setLoading(false)}}
 
async function publish(e:React.FormEvent){e.preventDefault();done();setPublishing(true);setError('');try{await save();const d=current.current!;const guest=guestKeys().find(k=>k.slug===slug)||newGuestKey(slug);rememberGuest(guest);const result=await api<Draft>('publish',keyRef.current,{slug,managementToken:guest.token,revision:d.revision});adopt(result);setPublished('/'+slug);setStatus('Published · all changes saved');}catch(e){setError((e as Error).message)}finally{setPublishing(false)}}
 useEffect(()=>{if(!showPublish)return;const old=document.activeElement as HTMLElement|null;const keydown=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!publishing)setShowPublish(false);if(e.key==='Tab'){const nodes=[...document.querySelectorAll<HTMLElement>('.te-modal button:not(:disabled),.te-modal input,.te-modal a')];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',keydown);return()=>{document.removeEventListener('keydown',keydown);old?.focus()}},[showPublish,publishing]);
 const position=studioSections.findIndex(s=>s.id===section);
 if(!draft&&selectedDesign&&!library)return <main className="te-picker"><a className="te-back" href="/templates">← Back to designs</a><div className="te-picker-intro"><span className="te-eyebrow">FINDMYINVITE / {mode.toUpperCase()}</span><h1>{selectedDesign.name}</h1>{loading||!error?<p role="status">Opening your invitation in {mode==='form'?'Form':'Editor'}…</p>:<><p className="te-error" role="alert">{error}</p><button className="te-link" onClick={()=>access?location.reload():void create(selectedDesign.id)}>Try again</button><button className="te-link" onClick={()=>setLibrary(true)}>Open a saved draft</button></>}</div></main>;
 if(!draft||library)return <main className="te-picker"><a href="/templates" className="te-back"><ArrowLeft size={16}/> Back to designs</a><div className="te-picker-intro"><span className="te-eyebrow">FINDMYINVITE / THE EDITOR</span><h1>Your words.<br/><em>A beautiful beginning.</em></h1><p>Tap the invitation. Make it yours.<br/>No prompts. No waiting for AI.</p></div>{error&&<p className="te-error" role="alert">{error}</p>}<div className="te-designs">{designs.map(t=>{const id=t.id;return <button key={id} disabled={loading} onClick={()=>create(id)} className={'te-design '+id}><span className="te-design-art"><span>YOU & YOUR FOREVER</span><strong>{id==='royal-temple'?'A royal celebration':'Love, in full bloom'}</strong><i>together, always</i></span><span className="te-design-caption"><b>{t.name}</b><span>Personalize <ArrowUpRight size={17}/></span></span></button>})}</div>{loading&&<p role="status">Opening your invitation…</p>}{draft&&<button className="te-link" onClick={()=>setLibrary(false)}>Return to my current invitation</button>}{JSON.parse(localStorage.getItem(storage+'-history')||'[]').map((saved:Access&{template:string},i:number)=><button className="te-link" key={saved.id} onClick={()=>{localStorage.setItem(storage,JSON.stringify(saved));current.current=null;setDraft(null);undo.current=[];setUndoCount(0);setAccess(saved);history.replaceState({},'',`/${mode}?draft=${saved.id}`);setLibrary(false)}}>Open saved {designs.find(t=>t.id===saved.template)?.name||'invitation'} draft {i+1}</button>)}{!access&&localStorage.getItem('findmyinvite-studio-v1')&&<button className="te-link" onClick={()=>{try{const existing=JSON.parse(localStorage.getItem('findmyinvite-studio-v1')!);localStorage.setItem(storage,JSON.stringify(existing));setAccess(existing)}catch{setError('Could not open the saved Studio draft.')}}}>Continue my Studio invitation in the Editor</button>}<p className="te-picker-note">Your private draft saves on this browser. Publish only when you’re ready.</p>{access&&!draft&&<button className="te-link" onClick={()=>{localStorage.removeItem(storage);setAccess(null);setLoading(false);setError('')}}>Choose a new design</button>}</main>;
 return <main className={'te-shell'+(selection?' te-is-editing':'')}><header className="te-header"><a className="te-logo" href="/editor" aria-label="Choose a design" onClick={async e=>{e.preventDefault();done();try{await save();setLibrary(true)}catch{/* keep unsaved draft open */}}}>FindMyInvite<span>♡</span><small>EDITOR</small></a><span className="te-save-status" role="status"><Check size={13}/>{status}</span><div className="te-actions"><div className="te-mode-switch" aria-label="Editing mode"><button aria-pressed={mode==='form'} onClick={()=>void switchMode('form')}>Form</button><button aria-pressed={mode==='editor'} onClick={()=>void switchMode('editor')}>Editor</button></div><button aria-label="Undo last text edit" disabled={!undoCount&&!selection} onClick={undoLast}><Undo2 size={18}/></button><button className={preview?'active':''} onClick={()=>{done();if(mode==='form'){void switchMode('editor');setPreview(true)}else setPreview(!preview)}}><Eye size={17}/><span>{preview?'Edit':'Preview'}</span></button><button className="te-publish" disabled={draft.busy} onClick={()=>{done();setShowPublish(true)}}>Publish <ArrowUpRight size={16}/></button></div></header>
 <nav className="te-sections" aria-label="Invitation sections">{studioSections.map((s,i)=><button key={s.id} aria-current={section===s.id?'step':undefined} onClick={()=>{done();setSection(s.id);if(mode==='form')void switchMode('editor')}}><span>0{i+1}</span>{s.label}</button>)}</nav>
 <div className="te-canvas" hidden={mode==='form'}>{!(renderers.htmlTemplates.includes(draft.template)||draft.template.startsWith('sku-'))?<NativePreview data={draft.data} section={section} editable={!preview&&!draft.busy} onEdit={select}/>:<StudioPreview html={draft.html} data={draft.data} section={section} onSection={setSection} editable={!preview&&!draft.busy} onEdit={select}/>}</div>
 {mode==='form'&&<section className="te-form-panel"><div className="te-form-intro"><span className="te-eyebrow">YOUR INVITATION, YOUR WAY</span><h1>Every little detail.</h1><p>The same invitation, in a familiar form. Switch to Editor whenever you like.</p></div><form onSubmit={e=>{e.preventDefault();void save().catch(()=>{})}}>{schema.fields.map(f=><label key={f.key}>{f.label}{f.required?' *':''}{f.type==='textarea'?<textarea rows={3} maxLength={f.max} value={String(draft.data[f.key as keyof InviteData]||'')} onChange={e=>commit({...draft.data,[f.key]:e.target.value})}/>:<input type={f.type} required={f.required} maxLength={f.max} value={String(draft.data[f.key as keyof InviteData]||'')} onChange={e=>commit({...draft.data,[f.key]:e.target.value})}/>}</label>)}{(['timeline','preEvents'] as const).map(list=><fieldset key={list}><legend>{list==='timeline'?'Program timeline':'Pre-wedding events'}</legend>{draft.data[list].map((event,i)=><div className="te-form-event" key={i}>{(['title','time','description'] as const).map(field=><label key={field}>{field==='time'?'Date & time':field==='title'?'Event name':'Description'}<input type={field==='time'?'datetime-local':'text'} maxLength={field==='title'?150:1000} value={event[field]} onChange={e=>commit({...draft.data,[list]:draft.data[list].map((x,n)=>n===i?{...x,[field]:e.target.value}:x)})}/></label>)}</div>)}</fieldset>)}{Object.keys(draft.data.textOverrides||{}).length>0&&<fieldset><legend>Wording customized in Editor</legend>{Object.entries(draft.data.textOverrides||{}).map(([key,value],i)=><label key={key}>Custom wording {i+1}<textarea rows={2} maxLength={2000} value={value} onChange={e=>commit({...draft.data,textOverrides:{...draft.data.textOverrides,[key]:e.target.value}})}/></label>)}</fieldset>}{!(renderers.htmlTemplates.includes(draft.template)||draft.template.startsWith('sku-'))&&(['dressWomen','dressMen','transport','accommodation','gifts'] as const).map(field=><label key={field}>{field.replace(/([A-Z])/g,' $1')}<textarea value={draft.data[field]} onChange={e=>commit({...draft.data,[field]:e.target.value})}/></label>)}<div className="te-form-footer"><button className="te-publish" type="submit">Save changes</button><button type="button" onClick={()=>void switchMode('editor')}>Continue in Editor →</button><span role="status">{status}</span></div></form></section>}
 {mode==='editor'&&!selection&&<footer className="te-dock"><button aria-label="Previous section" disabled={position<=0} onClick={()=>setSection(studioSections[position-1].id)}><ChevronLeft size={20}/></button><div><PenLine size={15}/><span>{preview?'Guest preview · editing hidden':status==='Saving…'?'Saving your words…':status==='All changes saved'?'Tap text to edit · saved':'Tap any outlined text to edit'}</span></div><button aria-label="Next section" disabled={position===studioSections.length-1} onClick={()=>setSection(studioSections[position+1].id)}><ChevronRight size={20}/></button></footer>}
 {selection&&<section className="te-edit-panel" aria-label="Edit selected text" style={{bottom:keyboard+12}}><header><div><span className="te-eyebrow">MAKE IT YOURS</span><h2>{selection.label}</h2></div><button aria-label="Done editing" onClick={done}><Check size={21}/></button></header>{selection.type==='textarea'?<textarea ref={el=>{input.current=el}} aria-label={selection.label} rows={3} maxLength={selection.max} value={selection.value} onChange={e=>change(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'||(e.key==='Enter'&&(e.ctrlKey||e.metaKey)))done()}}/>:<input ref={el=>{input.current=el}} aria-label={selection.label} type={selection.type} maxLength={selection.max} value={selection.value} onChange={e=>change(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')done()}}/>}<footer><span>Changes appear as you type</span><span>{selection.value.length} / {selection.max}</span></footer></section>}
 {error&&<div className="te-error-toast" role="alert"><span>{error}</span><button onClick={()=>void retrySave()}>Retry save</button><button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
 {draft.busy&&<div className="te-error-toast">This invitation is being edited in Studio. Finish or cancel that change before editing here.</div>}
 {showPublish&&<div className="te-modal-backdrop"><section className="te-modal" role="dialog" aria-modal="true" aria-label="Publish invitation"><button className="te-modal-close" aria-label="Close publish dialog" disabled={publishing} onClick={()=>setShowPublish(false)}><X size={20}/></button><span className="te-eyebrow">READY FOR YOUR GUESTS</span><h2>A little link.<br/><em>A big celebration.</em></h2><p>Your edits stay private until you publish. Share this link with everyone you love.</p><form onSubmit={publish}><label>Your invitation address<div className="te-address"><span>findmyinvite.com/</span><input autoFocus required minLength={3} maxLength={48} pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]" placeholder="ashok-and-supriya" aria-label="Invitation address" value={slug} readOnly={Boolean(draft.publishedSlug)} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/></div></label><button className="te-publish te-wide" disabled={publishing}>{publishing?'Publishing…':draft.publishedSlug?'Publish updates':'Publish invitation'}<ArrowUpRight size={17}/></button></form>{published&&<div className="te-success"><Check size={18}/><span>Your invitation is live. <a href={published} target="_blank" rel="noreferrer">Open invitation ↗</a></span></div>}<p className="te-private-note">Keep this browser’s data to return to your private draft.</p></section></div>}
 </main>;
}
