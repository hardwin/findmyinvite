import sanctuaryDefaults from '../../public/studio/royal-sanctuary.defaults.json';
import renderers from '../../public/studio/renderers.json';
import {useEffect,useRef,useState} from 'react';
import {Check,ChevronLeft,ChevronRight,ChevronsRight,Eye,PenLine,Undo2,X,ArrowUpRight} from 'lucide-react';
import NativePreview from './NativePreview';
import {useCatalog} from '../catalog';
import StudioPreview,{studioSections} from './StudioPreview';
import {defaultInvite} from '../Invitation';
import type {InviteData} from '../Invitation';
import {newGuestKey,guestKeys,rememberGuest,suggestedSlug} from '../guest-api';
import {templates} from '../data';
import {ensureWebsitePayment} from '../payments';
import {formatRupees,templatePricePaise} from '../shop';
import schema from '../../public/studio/fields.json';
import './text-editor.css';
import '../shop.css';
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
 const [library,setLibrary]=useState(false),[access,setAccess]=useState<Access|null>(readAccess),[draft,setDraft]=useState<Draft|null>(null),[section,setSection]=useState('hero'),[preview,setPreview]=useState(false),[selection,setSelection]=useState<Selection|null>(null),[status,setStatus]=useState('Opening your draft…'),[error,setError]=useState(''),[loading,setLoading]=useState(Boolean(readAccess())),[publishing,setPublishing]=useState(false),[showPublish,setShowPublish]=useState(false),[slug,setSlug]=useState(''),[published,setPublished]=useState(''),[copied,setCopied]=useState(false),[undoCount,setUndoCount]=useState(0),[keyboard,setKeyboard]=useState(0);
 const current=useRef<Draft|null>(null),keyRef=useRef(access),undo=useRef<InviteData[]>([]),dirty=useRef(false),saveTask=useRef<Promise<void>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),generation=useRef(0),input=useRef<HTMLInputElement|HTMLTextAreaElement|null>(null),editingStart=useRef<InviteData|null>(null);
 useEffect(()=>{const t=new URLSearchParams(location.search).get('template');if(!access&&!started.current&&new URLSearchParams(location.search).get('new')==='1'&&designs.some(d=>d.id===t)){started.current=true;void create(t!)}},[access,designs]);
 useEffect(()=>{const pop=()=>setMode(location.pathname.startsWith('/form')?'form':'editor');addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[]);
 async function switchMode(next:'form'|'editor'){done();try{await save();setMode(next);history.pushState({},'',`/${next}?draft=${current.current!.id}`)}catch{/* Preserve unsaved draft and stay in this mode. */}}
 function adopt(d:Draft){current.current=d;setDraft(d);}
 useEffect(()=>{if(!access)return;let active=true;setLoading(true);api<Draft>('read',access).then(d=>{if(!active)return;keyRef.current=access;const remembered={...access,template:d.template,type:d.data.type};localStorage.setItem(storage,JSON.stringify(remembered));history.replaceState({},'',`/${mode}?draft=${d.id}`);const backupRaw=localStorage.getItem(storage+'-'+d.id);if(backupRaw){try{const b=JSON.parse(backupRaw);if(b?.data&&typeof b.data==='object'){// Always re-apply local recovery onto the latest online revision (never leave dirty=false with a stuck error).
 d={...d,data:b.data as InviteData};dirty.current=true;persistBackup({...d,revision:d.revision,data:d.data});setStatus(b.revision===d.revision?'Recovered unsaved edits · tap Save':'Recovered your edits onto the latest draft · tap Save');} }catch{/* keep online version */}}adopt(d);setSlug(d.publishedSlug||'');setError('');if(!dirty.current)setStatus('All changes saved');}).catch(e=>setError(e.message)).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[access]);
 useEffect(()=>{const protect=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',protect);const viewport=window.visualViewport;const resize=()=>setKeyboard(Math.max(0,window.innerHeight-(viewport?.height||window.innerHeight)-(viewport?.offsetTop||0)));viewport?.addEventListener('resize',resize);return()=>{window.removeEventListener('beforeunload',protect);viewport?.removeEventListener('resize',resize);if(timer.current)clearTimeout(timer.current)}},[]);
 useEffect(()=>{if(selection){input.current?.focus();input.current?.select();}},[selection?.key]);
 function persistBackup(d:Draft){try{localStorage.setItem(storage+'-'+d.id,JSON.stringify({revision:d.revision,data:d.data}))}catch{setError('Device backup is unavailable. Keep this tab open until saving completes.')}}
 async function save():Promise<void>{if(saveTask.current)return saveTask.current;if(!current.current||!keyRef.current)return;if(!dirty.current){setError('');setStatus('All changes saved');return;}if(timer.current)clearTimeout(timer.current);
 const task=(async()=>{
  let conflicts=0;
  while(dirty.current&&current.current&&keyRef.current){
   const sent=current.current,version=generation.current;setStatus('Saving…');
   try{
    const saved=await api<Draft>('save',keyRef.current,{revision:sent.revision,data:sent.data});
    const latest={...saved,data:current.current!.data};adopt(latest);
    if(version===generation.current){dirty.current=false;localStorage.removeItem(storage+'-'+saved.id);setStatus('All changes saved');}
    else persistBackup(latest);
   }catch(e){
    const err=e as Error & {status?:number};
    const conflict=err.status===409||/changed elsewhere|Reload to use|changed\. Reload/i.test(err.message||'');
    if(conflict&&conflicts<2&&keyRef.current){
     conflicts++;
     const fresh=await api<Draft>('read',keyRef.current);
     const localData=current.current!.data;
     adopt({...fresh,data:localData});
     dirty.current=true;
     persistBackup(current.current!);
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
      if(b?.data){adopt({...fresh,data:b.data});dirty.current=true;persistBackup(current.current!);}
      else adopt(fresh);
     }catch{adopt(fresh);}
    }else adopt(fresh);
   }
   await save();
  }catch{/* toast already set */}
 }
 function schedule(){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void save().catch(()=>{})},850)}
 function commit(data:InviteData){if(!current.current)return;generation.current++;dirty.current=true;const next={...current.current,data};adopt(next);persistBackup(next);setStatus('Unsaved changes');setPublished('');schedule();}
 function select(s:Selection){if(!current.current||preview)return;if(selection)done();const field=s.key.startsWith('field:')?[...schema.fields,...['dressWomen','dressMen','transport','accommodation','gifts'].map(key=>({key,label:key.replace(/([A-Z])/g,' $1'),type:'textarea',max:key.startsWith('dress')?500:1500}))].find(f=>f.key===s.key.slice(6)):undefined;let value=s.value,type='textarea',label='Invitation wording',max=2000;if(field){value=String(current.current.data[field.key as keyof InviteData]||'');type=field.type;label=field.label;max=field.max;}else if(s.key.startsWith('event:')){const [list,index,part]=s.key.slice(6).split('.');if(!['timeline','preEvents'].includes(list))return;const event=current.current.data[list as 'timeline'|'preEvents'][Number(index)];if(!event||!['title','time','description'].includes(part))return;value=event[part as keyof typeof event];type=part==='time'?'datetime-local':'textarea';label=part==='time'?'Event date & time':part==='title'?'Event title':'Event description';max=part==='title'?150:1000;}else if(!/^text-\d{1,4}$/.test(s.key))return;
 editingStart.current=structuredClone(current.current.data);setSelection({...s,value,label,type,max});if(s.section)setSection(s.section);
 }
 function change(value:string){if(!selection||!current.current)return;const data=structuredClone(current.current.data),key=selection.key;if(key.startsWith('field:')){const field=key.slice(6);Object.assign(data,{[field]:value});}else if(key.startsWith('event:')){const [list,index,part]=key.slice(6).split('.');Object.assign(data[list as 'timeline'|'preEvents'][Number(index)],{[part]:value});}else data.textOverrides={...data.textOverrides,[key]:value};setSelection({...selection,value});commit(data);}
 function done(){if(editingStart.current&&current.current&&JSON.stringify(editingStart.current)!==JSON.stringify(current.current.data)){undo.current.push(editingStart.current);if(undo.current.length>30)undo.current.shift();setUndoCount(undo.current.length);}editingStart.current=null;setSelection(null);void save().catch(()=>{});}
 function undoLast(){done();const previous=undo.current.pop();if(previous){commit(previous);setUndoCount(undo.current.length);}}
 async function create(template:string){if(creationInFlight.current)return;creationInFlight.current=true;setLoading(true);setError('');try{const token=newGuestKey('draft').token,data={...structuredClone(defaultInvite),template,type:new URLSearchParams(location.search).get('type')||defaultInvite.type,date:new Date(Date.now()+45*86400000).toISOString().slice(0,10),groom:template==='luxury-pink'?'Ashok':'Rohan',bride:template==='luxury-pink'?'Supriya':'Ananya',music:template==='royal-heritage-wedding'?'':template==='royal-temple'?'/assets/temple/invite-bg.mp3':'/assets/track1.mp3',textOverrides:{}};if(template==='royal-sanctuary'){Object.assign(data,sanctuaryDefaults)}else{data.timeline=data.timeline.map(e=>({...e,time:data.date+'T'+data.time}));data.preEvents=data.preEvents.map(e=>({...e,time:data.date+'T'+(e.time.split('T')[1]||data.time)}));}if(template!=='royal-sanctuary'){data.welcome='With our families, we invite you to celebrate our wedding.';data.brideDetails='With her loving family';data.groomDetails='With his loving family';}data.groom=template==='luxury-pink'?'Ashok':'Aaron';data.bride=template==='luxury-pink'?'Supriya':'Maria';if(template!=='royal-sanctuary')data.welcome='With the blessing of our families, we invite you to celebrate our Holy Matrimony.';
const d=await api<Draft>('create',null,{template,token,data});const key={id:d.id,token,template,type:data.type};const previous=keyRef.current||JSON.parse(localStorage.getItem(storage)||'null');if(previous){const history=JSON.parse(localStorage.getItem(storage+'-history')||'[]');localStorage.setItem(storage+'-history',JSON.stringify([...history.filter((x:Access)=>x.id!==previous.id),{...previous,template:current.current?.template||previous.template}].slice(-20)));}dirty.current=false;undo.current=[];setUndoCount(0);setSection('hero');setSelection(null);setLibrary(false);setPublished('');localStorage.setItem(storage,JSON.stringify(key));keyRef.current=key;setAccess(key);history.replaceState({},'',`/${mode}?draft=${d.id}`);adopt(d);setStatus('All changes saved');}catch(e){setError((e as Error).message)}finally{creationInFlight.current=false;setLoading(false)}}
 
function openPay(){done();const d=current.current;if(!d)return;if(!slug)setSlug(suggestedSlug(d.data));setShowPublish(true);setCopied(false);}
async function publish(e:React.FormEvent){e.preventDefault();done();setPublishing(true);setError('');setCopied(false);try{await save();const d=current.current!;const address=slug||suggestedSlug(d.data);if(!slug)setSlug(address);if(!/^[a-z0-9][a-z0-9-]{2,47}$/.test(address))throw new Error('Choose a link with 3–48 lowercase letters, numbers or hyphens.');let paymentId='';if(!d.publishedSlug){const catalog=templates.find(t=>t.id===d.template)||{id:d.template,royal:false,tier:'free' as const,video:''};const paid=await ensureWebsitePayment({slug:address,template:catalog,prefillName:d.data.groom+' and '+d.data.bride});paymentId=paid.paymentId;}const guest=guestKeys().find(k=>k.slug===address)||newGuestKey(address);rememberGuest(guest);const result=await api<Draft>('publish',keyRef.current,{slug:address,managementToken:guest.token,revision:d.revision,...(paymentId?{paymentId}:{})});adopt(result);setPublished('/'+address);setStatus('Created');}catch(e){setError((e as Error).message)}finally{setPublishing(false)}}
 useEffect(()=>{if(!showPublish)return;const old=document.activeElement as HTMLElement|null;const keydown=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!publishing)setShowPublish(false);if(e.key==='Tab'){const nodes=[...document.querySelectorAll<HTMLElement>('.te-modal button:not(:disabled),.te-modal input,.te-modal a')];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',keydown);return()=>{document.removeEventListener('keydown',keydown);old?.focus()}},[showPublish,publishing]);
 const position=studioSections.findIndex(s=>s.id===section);
 if(!draft&&selectedDesign&&!library)return <main className="im-shop"><header className="im-top im-list-top"><a className="im-back" href="/" aria-label="Categories">‹</a><h1>{selectedDesign.name}</h1></header><p className="im-empty" role="status">{loading||!error?'Opening…':error}</p>{error?<button className="im-slide" type="button" onClick={()=>access?location.reload():void create(selectedDesign.id)}>Try again</button>:null}</main>;
 if(!draft||library)return <main className="im-shop"><header className="im-top im-list-top"><a className="im-back" href="/" aria-label="Categories">‹</a><h1>Cart</h1></header><div className="im-cart-tabs"><span>CART</span></div><p className="im-empty">Your cart is empty</p><a className="im-slide" href="/">Add e-invites</a>{error&&<p className="im-empty" role="alert">{error}</p>}{JSON.parse(localStorage.getItem(storage+'-history')||'[]').map((saved:Access&{template:string},i:number)=><button className="im-history" type="button" key={saved.id} onClick={()=>{localStorage.setItem(storage,JSON.stringify(saved));current.current=null;setDraft(null);undo.current=[];setUndoCount(0);setAccess(saved);history.replaceState({},'',`/${mode}?draft=${saved.id}`);setLibrary(false)}}>{designs.find(t=>t.id===saved.template)?.name||'Draft'} {i+1}</button>)}{draft&&<button className="im-history" type="button" onClick={()=>setLibrary(false)}>Back</button>}</main>;
 return <main className={'te-shell'+(selection?' te-is-editing':'')+(mode==='form'?' te-form-mode':'')}>{mode!=='form'&&<header className="te-header"><a className="te-logo" href="/" aria-label="Categories" onClick={async e=>{e.preventDefault();done();try{await save()}catch{/* keep unsaved draft open */}setLibrary(true);}}>FindMyInvite</a><span className="te-save-status" role="status"><Check size={13}/>{status}</span><div className="te-actions"><div className="te-mode-switch" aria-label="Editing mode"><button aria-pressed={false} onClick={()=>void switchMode('form')}>Form</button><button aria-pressed={true} onClick={()=>void switchMode('editor')}>Editor</button></div><button aria-label="Undo last text edit" disabled={!undoCount&&!selection} onClick={undoLast}><Undo2 size={18}/></button><button className={preview?'active':''} onClick={()=>{done();setPreview(!preview)}}><Eye size={17}/><span>{preview?'Edit':'Preview'}</span></button><button className="te-publish" disabled={draft.busy} onClick={openPay}>Create <ArrowUpRight size={16}/></button></div></header>}
 {mode!=='form'&&<nav className="te-sections" aria-label="Invitation sections">{studioSections.map((s,i)=><button key={s.id} aria-current={section===s.id?'step':undefined} onClick={()=>{done();setSection(s.id)}}><span>0{i+1}</span>{s.label}</button>)}</nav>}
 <div className={'te-canvas'+(draft.publishedSlug||published?'':' fmi-wm')} hidden={mode==='form'}>{!(renderers.htmlTemplates.includes(draft.template)||draft.template.startsWith('sku-'))?<NativePreview data={draft.data} section={section} editable={!preview&&!draft.busy} onEdit={select}/>:<StudioPreview html={draft.html} data={draft.data} section={section} onSection={setSection} editable={!preview&&!draft.busy} onEdit={select}/>}</div>
 {mode==='form'&&<section className="te-form-panel te-mart">{(()=>{const listed=templates.find(t=>t.id===draft.template);const design=designs.find(t=>t.id===draft.template);const price=templatePricePaise(listed||{royal:false,tier:'free'});const live=Boolean(draft.publishedSlug||published);const name=design?.name||listed?.name||draft.template;const img=(listed?.image||design?.image)?'/assets/'+(listed?.image||design?.image):'';const link=(typeof location!=='undefined'?location.origin:'')+(published||(draft.publishedSlug?'/'+draft.publishedSlug:''));return <><header className="im-top im-list-top"><a className="im-back" href="/" aria-label="Categories" onClick={async e=>{e.preventDefault();done();try{await save()}catch{/* keep unsaved draft */}location.href='/';}}>‹</a><div className="im-cart-title"><h1>Cart</h1><p className="im-cart-addr">{name}</p></div></header><div className="im-cart-tabs"><span>CART</span></div><p className="im-save">{live?'Your page is live':status==='Saving…'?'Saving…':'Preview saved on this device'}</p><div className="im-line">{img?<img src={img} alt=""/>:null}<div><b>{name}</b><small>1 page</small></div><strong>{formatRupees(price)}</strong></div><div className={'te-mart-preview fmi-wm'+(live?' is-live':'')}>{!(renderers.htmlTemplates.includes(draft.template)||draft.template.startsWith('sku-'))?<NativePreview data={draft.data} section={section} editable={false} onEdit={()=>{}}/>:<StudioPreview html={draft.html} data={draft.data} section={section} onSection={setSection} editable={false} onEdit={()=>{}}/>}</div><form onSubmit={live?e=>{e.preventDefault()} :publish}>{schema.fields.map(f=><label key={f.key}>{f.label}{f.type==='textarea'?<textarea rows={3} maxLength={f.max} value={String(draft.data[f.key as keyof InviteData]||'')} onChange={e=>commit({...draft.data,[f.key]:e.target.value})}/>:<input type={f.type} required={f.required} maxLength={f.max} value={String(draft.data[f.key as keyof InviteData]||'')} onChange={e=>commit({...draft.data,[f.key]:e.target.value})}/>}</label>)}{!live&&<label>Link<div className="te-address"><span>findmyinvite.com/</span><input required minLength={3} maxLength={48} inputMode="text" autoComplete="off" placeholder="aaron-and-maria" aria-label="Invitation address" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/></div></label>}{live&&<div className="te-copy-row"><input readOnly value={link} aria-label="Public invitation link"/><button type="button" className="im-cta" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setCopied(false)}}}>{copied?'Copied':'Copy link'}</button></div>}<div className="im-cart-pay"><div className="im-payrow"><span>Pay using Razorpay</span><span>UPI</span></div><button type={live?'button':'submit'} className="im-slide" disabled={draft.busy||publishing} onClick={live?async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setCopied(false)}}:undefined}><ChevronsRight size={22}/>{publishing?'Paying…':live?(copied?'Copied':'Copy link'):'Slide to Pay  |  '+formatRupees(price)}</button></div></form></>;})()}</section>}
 {mode==='editor'&&!selection&&<footer className="te-dock"><button aria-label="Previous section" disabled={position<=0} onClick={()=>setSection(studioSections[position-1].id)}><ChevronLeft size={20}/></button><div><PenLine size={15}/><span>{preview?'Guest preview · editing hidden':status==='Saving…'?'Saving your words…':status==='All changes saved'?'Tap text to edit · saved':'Tap any outlined text to edit'}</span></div><button aria-label="Next section" disabled={position===studioSections.length-1} onClick={()=>setSection(studioSections[position+1].id)}><ChevronRight size={20}/></button></footer>}
 {selection&&<section className="te-edit-panel" aria-label="Edit selected text" style={{bottom:keyboard+12}}><header><div><h2>{selection.label}</h2></div><button aria-label="Done editing" onClick={done}><Check size={21}/></button></header>{selection.type==='textarea'?<textarea ref={el=>{input.current=el}} aria-label={selection.label} rows={3} maxLength={selection.max} value={selection.value} onChange={e=>change(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'||(e.key==='Enter'&&(e.ctrlKey||e.metaKey)))done()}}/>:<input ref={el=>{input.current=el}} aria-label={selection.label} type={selection.type} maxLength={selection.max} value={selection.value} onChange={e=>change(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')done()}}/>}</section>}
 {error&&<div className="te-error-toast" role="alert"><span>{error}</span>{!showPublish&&<button onClick={()=>void retrySave()}>Retry save</button>}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
 {draft.busy&&<div className="te-error-toast">This invitation is being edited in Studio. Finish or cancel that change before editing here.</div>}
 {showPublish&&<div className="te-modal-backdrop"><section className="te-modal te-pay-sheet" role="dialog" aria-modal="true" aria-label="Pay"><button className="te-modal-close" aria-label="Close" disabled={publishing} onClick={()=>setShowPublish(false)}><X size={20}/></button>{!published&&!draft.publishedSlug&&<form onSubmit={publish}><label>Link<div className="te-address"><span>findmyinvite.com/</span><input autoFocus required minLength={3} maxLength={48} inputMode="text" autoComplete="off" placeholder="aaron-and-maria" aria-label="Invitation address" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/></div></label><button className="im-slide te-wide" disabled={publishing}><ChevronsRight size={22}/>{publishing?'Paying…':'Slide to Pay  |  '+formatRupees(templatePricePaise(templates.find(t=>t.id===draft.template)||{royal:false,tier:'free'}))}</button></form>}{(published||draft.publishedSlug)&&<div className="te-created"><div className="te-copy-row"><input readOnly value={(typeof location!=='undefined'?location.origin:'')+(published||'/'+draft.publishedSlug)} aria-label="Public invitation link"/><button type="button" className="im-cta" onClick={async()=>{try{await navigator.clipboard.writeText(location.origin+(published||'/'+draft.publishedSlug));setCopied(true)}catch{setCopied(false)}}}>{copied?'Copied':'Copy link'}</button></div></div>}</section></div>}
 </main>;
}
