import {useCallback,useEffect,useRef,useState} from 'react';
import type {FormEvent,PointerEvent} from 'react';
import {ArrowLeft,ArrowRight,GripHorizontal,Minus,Send,Undo2} from 'lucide-react';
import {defaultInvite} from './Invitation';
import type {InviteData} from './Invitation';
import {guestKeys,newGuestKey,rememberGuest} from './guest-api';
import Lovebot from './Lovebot';
import StudioPreview from './StudioPreview';
import {STUDIO_KEY,readStudioAccess,studioFields,studioSections,studioTemplates,writeStudioAccess} from './studio-schema';
import type {StudioAccess} from './studio-schema';
import './studio.css';

type StudioDraft={id:string;template:string;data:InviteData;html:string;revision:number;publishedSlug?:string;busy?:boolean;message?:string;status?:string};
type ChatMessage={role:'user'|'assistant';text:string};

async function studioApi<T>(action:string,access?:StudioAccess|null,body?:unknown):Promise<T>{
 const response=await fetch('/api/studio?action='+action+(access?'&id='+access.id:''),{
  method:body===undefined?'GET':'POST',
  headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(access?{Authorization:'Bearer '+access.token}:{})},
  body:body===undefined?undefined:JSON.stringify(body),
  cache:'no-store'
 });
 const value=await response.json();
 if(!response.ok)throw new Error(value.error||'Could not complete this step.');
 return value;
}

function Copilot({sections,activeSection,onSection,onSend,busy,messages,status,onUndo,canUndo}:{
 sections:typeof studioSections;activeSection:string;onSection:(id:string)=>void;onSend:(text:string)=>Promise<void>;
 busy:boolean;messages:ChatMessage[];status:string;onUndo:()=>void;canUndo:boolean;
}){
 const [mini,setMini]=useState(false);
 const [draft,setDraft]=useState('');
 const [sendError,setSendError]=useState('');
 const [pos,setPos]=useState<{x:number;y:number}|null>(null);
 const [height,setHeight]=useState(window.visualViewport?.height??window.innerHeight);
 const root=useRef<HTMLElement>(null);
 const log=useRef<HTMLDivElement>(null);
 const dragging=useRef(false);
 const drag=useRef<{pointer:number;x:number;y:number;left:number;top:number}|null>(null);
 const index=Math.max(0,sections.findIndex(item=>item.id===activeSection));
 const current=sections[index];
 const clamp=useCallback((point:{x:number;y:number})=>{
  const view=window.visualViewport;
  const left=view?.offsetLeft??0,top=view?.offsetTop??0;
  const width=view?.width??window.innerWidth,full=view?.height??window.innerHeight;
  const box=root.current?.getBoundingClientRect();
  return {x:Math.max(left+8,Math.min(point.x,left+width-((box?.width)??300)-8)),y:Math.max(top+8,Math.min(point.y,top+full-((box?.height)??280)-8))};
 },[]);
 useEffect(()=>{
  const place=()=>{
   const view=window.visualViewport;
   setHeight(view?.height??window.innerHeight);
   const box=root.current?.getBoundingClientRect();
   const wide=window.innerWidth>=1200;
   const next={x:(view?.offsetLeft??0)+((view?.width)??window.innerWidth)-((box?.width)??300)-(wide?20:12),y:(view?.offsetTop??0)+((view?.height)??window.innerHeight)-((box?.height)??280)-(wide?24:16)};
   setPos(point=>clamp(dragging.current&&point?point:next));
  };
  place();
  window.addEventListener('resize',place);
  window.visualViewport?.addEventListener('resize',place);
  window.visualViewport?.addEventListener('scroll',place);
  const observer=new ResizeObserver(place);
  if(root.current)observer.observe(root.current);
  return()=>{
   window.removeEventListener('resize',place);
   window.visualViewport?.removeEventListener('resize',place);
   window.visualViewport?.removeEventListener('scroll',place);
   observer.disconnect();
  };
 },[clamp]);
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight;},[messages,busy,mini]);
 const down=(event:PointerEvent)=>{
  if(event.target instanceof Element&&event.target.closest('button')||event.button!==0)return;
  const box=root.current?.getBoundingClientRect();
  if(!box)return;
  drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top};
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
 };
 const move=(event:PointerEvent)=>{
  const currentDrag=drag.current;
  if(!currentDrag||currentDrag.pointer!==event.pointerId)return;
  dragging.current=true;
  setPos(clamp({x:currentDrag.left+event.clientX-currentDrag.x,y:currentDrag.top+event.clientY-currentDrag.y}));
 };
 const up=()=>{drag.current=null;};
 const send=async()=>{
  const text=draft.trim();
  if(!text||busy)return;
  setSendError('');
  setDraft('');
  try{await onSend(text);}
  catch{setDraft(text);setSendError('That change could not be saved. Please try again.');}
 };
 return <aside ref={root} className={`fmi-copilot${mini?' fmi-copilot--mini':''}${height<500?' fmi-copilot--compact':''}`} aria-label="Invitation copilot" style={{left:pos?.x,top:pos?.y,right:pos?'auto':16,bottom:pos?'auto':16,maxHeight:Math.max(120,height-16)}}>
  <div className="fmi-copilot-drag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} title="Drag to move your copilot">
   <GripHorizontal size={17} aria-hidden="true"/>
   {!mini&&<Lovebot busy={busy}/>}
   <span>{mini?'Your little helper':busy?'Lovebot is thinking…':'Lovebot · ready to help'}</span>
   {!mini&&<button type="button" aria-label="Minimize copilot" onClick={()=>setMini(true)}><Minus size={17}/></button>}
  </div>
  {mini?<button className="fmi-copilot-bubble" type="button" onClick={()=>setMini(false)} aria-label="Open invitation copilot">
   <Lovebot busy={busy}/>
   <span>Need a little love?<b>Let’s create <ArrowRight size={12}/></b></span>
  </button>:<><div className="fmi-copilot-section">
   <span>{sections.length?`${index+1} / ${sections.length}`:'YOUR INVITATION'}</span>
   <strong>{current?.label??'Your invitation'}</strong>
   <button type="button" title="Undo last change" aria-label="Undo last change" onClick={onUndo} disabled={!canUndo||busy}><Undo2 size={15}/></button>
  </div>
  <div ref={log} className="fmi-copilot-conversation" role="log" aria-label="Copilot conversation" aria-live="polite" aria-relevant="additions text">
   {messages.length===0?<p className="fmi-copilot-message fmi-copilot-message--assistant">What would you like to change in <strong>{current?.label??'this section'}</strong>? You can also skip ahead.</p>
    :messages.map((item,i)=><p key={i} className={`fmi-copilot-message fmi-copilot-message--${item.role}`}><span className="fmi-copilot-sr">{item.role==='user'?'You: ':'Copilot: '}</span>{item.text}</p>)}
   {busy&&<p className="fmi-copilot-thinking"><span/><span/><span/><span className="fmi-copilot-sr">Working on your changes</span></p>}
  </div>
  {sendError&&<p className="fmi-copilot-error" role="alert">{sendError}</p>}
  <form className="fmi-copilot-form" onSubmit={event=>{event.preventDefault();void send();}}>
   <label htmlFor="fmi-copilot-input" className="fmi-copilot-sr">Describe your changes</label>
   <textarea id="fmi-copilot-input" rows={2} value={draft} maxLength={2000} onChange={event=>setDraft(event.target.value)} placeholder="Try “Our names are Ashok & Supriya”" onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void send();}}}/>
   <button type="submit" aria-label="Send changes" disabled={busy||!draft.trim()}><Send size={17}/></button>
  </form>
  <footer className="fmi-copilot-footer">
   <button type="button" aria-label="Previous section" onClick={()=>{if(index>0)onSection(sections[index-1].id);}} disabled={index===0||busy}><ArrowLeft size={15}/></button>
   <span role="status">{status}</span>
   <button type="button" className="fmi-copilot-skip" onClick={()=>{if(index<sections.length-1)onSection(sections[index+1].id);}} disabled={index>=sections.length-1||busy}>
    {index>=sections.length-1?'Last section':'Skip / next'}<ArrowRight size={14}/>
   </button>
  </footer></>}
 </aside>;
}

export default function Studio(){
 const [ready,setReady]=useState(false);
 const [access,setAccess]=useState<StudioAccess|null>(readStudioAccess);
 const [draft,setDraft]=useState<StudioDraft|null>(null);
 const [section,setSection]=useState('hero');
 const [phone,setPhone]=useState(false);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('Your ideas. A little love. Your invitation.');
 const [error,setError]=useState('');
 const [drawer,setDrawer]=useState<'details'|'history'|'publish'|null>(null);
 const [messages,setMessages]=useState<ChatMessage[]>([{role:'assistant',text:'Hi, I’m Lovebot ♡ Let’s make this invitation yours. Tell me what you’d like to change, or skip ahead to the next section.'}]);
 const [slug,setSlug]=useState('');
 const [versions,setVersions]=useState<{revision:number;message:string;created_at:string}[]>([]);
 const [dirty,setDirty]=useState(false);
 const live=useRef(true);
 const polling=useRef(false);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setDrawer(null);};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[]);
 useEffect(()=>{
  live.current=true;
  studioApi<{authenticated:boolean}>('config').then(()=>setReady(true)).catch(err=>setError(err.message));
  return()=>{live.current=false};
 },[]);
 useEffect(()=>{
  if(!ready||!access)return;
  studioApi<StudioDraft>('read',access).then(value=>{setDraft(value);setSlug(value.publishedSlug||'');if(value.busy)void poll(access);}).catch(err=>setError(err.message));
 },[ready,access?.id]);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);
 async function poll(current:StudioAccess){
  if(polling.current)return;
  polling.current=true;
  setBusy(true);
  try{
   for(let i=0;i<75&&live.current;i++){
    const value=await studioApi<StudioDraft&{done?:boolean;status?:string}>('poll',current,{});
    if(!live.current)return;
    if(value.done){
     setDraft(value);
     setStatus('Your preview is up to date');
     const reply=value.message;
     if(reply)setMessages(list=>[...list,{role:'assistant',text:reply}]);
     setDirty(false);
     return;
    }
    setStatus(value.status||'Customizing your invitation…');
    await new Promise(resolve=>setTimeout(resolve,4000));
   }
   if(live.current)setError('This is taking longer than expected. Reload to reconnect to the saved task.');
  }catch(err){
   if(live.current){
    const message=err instanceof Error?err.message:'Could not complete this step.';
    setError(message);
    setMessages(list=>[...list,{role:'assistant',text:message}]);
    if(current)studioApi<StudioDraft>('read',current).then(setDraft).catch(()=>{});
   }
  }finally{
   polling.current=false;
   if(live.current)setBusy(false);
  }
 }
 async function create(template:string){
  setBusy(true);setError('');
  try{
   const token=newGuestKey('draft').token;
   const data={...structuredClone(defaultInvite),template,groom:template==='royal-temple'?'Rohan':'Aryan',bride:template==='royal-temple'?'Ananya':'Eva',date:new Date(Date.now()+45*864e5).toISOString().slice(0,10),music:template==='royal-temple'?'/assets/temple/invite-bg.mp3':'/assets/track1.mp3'};
   data.timeline=data.timeline.map(event=>({...event,time:data.date+'T'+(event.time.split('T')[1]||'10:00')}));
   data.preEvents=[];
   data.welcome='With our families, we invite you to celebrate our wedding.';
   data.groomDetails='With his loving family';
   data.brideDetails='With her loving family';
   const created=await studioApi<StudioDraft>('create',null,{template,token,data});
   const next={id:created.id,token};
   writeStudioAccess(next);
   setAccess(next);
   setDraft(created);
  }catch(err){setError(err instanceof Error?err.message:'Could not create this invitation.');}
  finally{setBusy(false);}
 }
 async function save(){
  if(!draft||!access)return null;
  const saved=await studioApi<StudioDraft>('save',access,{data:draft.data,revision:draft.revision});
  setDraft(saved);
  setDirty(false);
  return saved;
 }
 async function send(text:string){
  if(!draft||!access)return;
  setBusy(true);setError('');
  setMessages(list=>[...list,{role:'user',text}]);
  try{
   const current=dirty?await save():draft;
   await studioApi('run',access,{message:text,section,revision:current!.revision});
   setStatus('Lovebot is editing your invitation…');
   setBusy(false);
   await poll(access);
  }catch(err){
   const message=err instanceof Error?err.message:'Could not complete this step.';
   setError(message);
   setMessages(list=>[...list,{role:'assistant',text:message}]);
   setBusy(false);
  }
 }
 function patch<K extends keyof InviteData>(key:K,value:InviteData[K]){
  setDraft(current=>current?{...current,data:{...current.data,[key]:value}}:current);
  setDirty(true);
 }
 async function restore(target:number){
  if(!draft||!access)return;
  setBusy(true);setError('');
  try{
   const saved=await studioApi<StudioDraft>('restore',access,{target,revision:draft.revision});
   setDraft(saved);setDirty(false);setDrawer(null);setStatus('Previous version restored');
  }catch(err){setError(err instanceof Error?err.message:'Could not restore that version.');}
  finally{setBusy(false);}
 }
 async function loadHistory(){
  if(!access)return;
  setError('');
  try{
   const value=await studioApi<{versions:typeof versions}>('history',access);
   setVersions(value.versions);
   setDrawer('history');
  }catch(err){setError(err instanceof Error?err.message:'Could not load history.');}
 }
 async function publish(event:FormEvent){
  event.preventDefault();
  if(!draft||!access)return;
  setBusy(true);setError('');
  try{
   const current=dirty?await save():draft;
   const existing=guestKeys().find(item=>item.slug===slug)||newGuestKey(slug);
   rememberGuest(existing);
   const published=await studioApi<StudioDraft>('publish',access,{slug,managementToken:existing.token,revision:current!.revision});
   setDraft(published);
   setStatus('Your invitation is published');
  }catch(err){setError(err instanceof Error?err.message:'Could not publish.');}
  finally{setBusy(false);}
 }
 if(!ready)return <main className="studio-access"><div className="studio-loader"><Lovebot/><h1>Opening your creative space…</h1>{error&&<p>{error}</p>}</div></main>;
 if(!draft)return <main className="studio-access"><div className="studio-access-card">
  <Lovebot/>
  <p style={{letterSpacing:3,fontSize:10}}>YOUR NEXT BEAUTIFUL BEGINNING</p>
  <h1>Choose your canvas.</h1>
  <p>Start with a design you love.<br/>We’ll make every detail feel like you.</p>
  <label className="studio-help">Restore a private draft
   <input type="file" accept="application/json,.json" onChange={async event=>{
    try{
     const file=event.target.files?.[0];
     if(!file)return;
     const restored=JSON.parse(await file.text());
     if(!/^[a-f0-9-]{36}$/.test(restored.id)||!/^[a-f0-9]{64}$/.test(restored.token))throw new Error('Choose a valid studio recovery file.');
     const value=await studioApi<StudioDraft>('read',restored);
     writeStudioAccess(restored);
     setAccess(restored);
     setDraft(value);
     setSlug(value.publishedSlug||'');
    }catch(err){setError(err instanceof Error?err.message:'Could not restore that draft.');}
   }}/>
  </label>
  <div className="studio-template-options">
   {Object.entries(studioTemplates).map(([id,meta])=>
    <button key={id} className="studio-template-option" disabled={busy} onClick={()=>void create(id)}>
     <span className="studio-swatch" style={{background:id==='royal-temple'?'linear-gradient(#d8e9ec,#e8d4ac)':'linear-gradient(130deg,#072b22,#18583e)',border:'1px solid #cdb57f'}}/>
     <span><b>{meta.name}</b><small>{meta.blurb}</small></span>
    </button>
   )}
  </div>
  {busy&&<p role="status">Preparing your private invitation…</p>}
  {error&&<p className="studio-error" role="alert">{error}</p>}
  {access&&<button className="studio-reset" onClick={()=>{writeStudioAccess(null);setAccess(null);setError('');}}>Start a new draft</button>}
 </div></main>;
 return <main className="studio-page">
  <header className="studio-bar">
   <a href="/studio" className="studio-brand">FindMyInvite<span>♡</span><small>THE LOVE STUDIO</small></a>
   <div className={'studio-progress'+(busy?' busy':'')} role="status"><i/>{busy?status:dirty?'Unsaved preview changes':'Private draft · saved'}</div>
   <div className="studio-toolbar">
    <button className="desktop-only" onClick={()=>setPhone(!phone)}>{phone?'Desktop view':'Mobile view'}</button>
    <button onClick={()=>setDrawer('details')} disabled={busy}>Details</button>
    <button className="desktop-only" onClick={()=>void loadHistory()} disabled={busy}>History</button>
    <button className="primary" onClick={()=>setDrawer('publish')} disabled={busy}>Publish ↗</button>
   </div>
  </header>
  <select aria-label="Invitation section" className="studio-mobile-sections" value={section} onChange={event=>setSection(event.target.value)}>
   {studioSections.map((item,index)=><option key={item.id} value={item.id}>{index+1} / {studioSections.length} · {item.label}</option>)}
  </select>
  <div className="studio-workspace">
   <aside className="studio-sidebar">
    <h2>Your story, in chapters</h2>
    {studioSections.map((item,index)=><button key={item.id} className={'studio-section'+(section===item.id?' active':'')} onClick={()=>setSection(item.id)}><b>{index+1}</b>{item.label}</button>)}
    <p className="studio-note">Tell Lovebot what feels right.<br/>Watch your invitation become yours, one little detail at a time.</p>
    <p className="studio-version">VERSION {draft.revision+1} · {studioTemplates[draft.template as keyof typeof studioTemplates]?.name}</p>
    <button className="studio-reset" onClick={()=>{
     if(dirty&&!confirm('Leave unsaved preview changes?'))return;
     const history=JSON.parse(localStorage.getItem('findmyinvite-studio-history')||'[]');
     localStorage.setItem('findmyinvite-studio-history',JSON.stringify([...history,access]));
     localStorage.removeItem(STUDIO_KEY);
     setAccess(null);setDraft(null);setDirty(false);
    }}>Create another invitation</button>
    <button className="studio-reset" onClick={()=>{
     if(!access)return;
     const url=URL.createObjectURL(new Blob([JSON.stringify(access)],{type:'application/json'}));
     const link=document.createElement('a');link.href=url;link.download='fmi-private-studio-recovery.json';link.click();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
    }}>Save private draft access</button>
   </aside>
   <div className="studio-canvas">
    <StudioPreview html={draft.html} data={draft.data} section={section} onSection={setSection} phone={phone}/>
   </div>
  </div>
  <Copilot sections={studioSections} activeSection={section} onSection={setSection} onSend={send} busy={busy} messages={messages} status={status} onUndo={()=>void restore(Math.max(0,draft.revision-1))} canUndo={draft.revision>0&&!busy&&!dirty}/>
  {busy&&<button className="studio-button" style={{position:'fixed',bottom:8,left:8,zIndex:60,fontSize:10}} onClick={async()=>{if(!access)return;try{const value=await studioApi<StudioDraft>('cancel',access,{});setDraft(value);setStatus('Change cancelled.');}catch(err){setError(err instanceof Error?err.message:'Could not cancel.');}}} >Cancel current change</button>}
  {error&&!drawer&&<div className="studio-error" role="alert" style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',zIndex:90,maxWidth:'90vw'}} onClick={()=>setError('')}>{error} · Dismiss</div>}
  {drawer&&<div className="studio-drawer-backdrop" onClick={()=>setDrawer(null)}>
   <section className="studio-drawer" role="dialog" aria-modal="true" aria-label={drawer==='details'?'Review invitation details':drawer==='publish'?'Publish invitation':'Version history'} onClick={event=>event.stopPropagation()}>
    <header>
     <h2>{drawer==='details'?'Every little detail.':drawer==='publish'?'Ready to share?':'Your creative journey.'}</h2>
     <button className="studio-button" onClick={()=>setDrawer(null)} aria-label="Close panel">✕</button>
    </header>
    {error&&<p className="studio-error" role="alert">{error}</p>}
    {drawer==='details'&&<form className="studio-fields" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await save();setStatus('Details saved');setDrawer(null);}catch(err){setError(err instanceof Error?err.message:'Could not save.');}finally{setBusy(false);}}}>
     <p className="studio-help">Changes appear in your private preview immediately. Save when you’re happy; publish when you’re ready for guests.</p>
     {studioFields.map(field=><label key={field.key}>{field.label}{field.required?' *':''}
      {field.type==='textarea'
       ?<textarea maxLength={field.max} value={String(draft.data[field.key]||'')} onFocus={()=>setSection(field.section)} onChange={event=>patch(field.key as keyof InviteData,event.target.value)}/>
       :<input type={field.type} maxLength={field.max} value={String(draft.data[field.key]||'')} onFocus={()=>setSection(field.section)} onChange={event=>patch(field.key as keyof InviteData,event.target.value)}/>}
     </label>)}
     {(['timeline','preEvents'] as const).map(key=><div key={key}>
      <h3>{key==='timeline'?'Your celebrations':'Pre-wedding events'}</h3>
      {draft.data[key].map((event,index)=><div className="studio-event-editor" key={index}>
       {(['title','time','description'] as const).map(field=><label key={field}>{field}
        <input type={field==='time'?'datetime-local':'text'} value={event[field]} onChange={e=>patch(key,draft.data[key].map((item,n)=>n===index?{...item,[field]:e.target.value}:item))}/>
       </label>)}
       <button type="button" className="studio-button" onClick={()=>patch(key,draft.data[key].filter((_,n)=>n!==index))}>Remove event</button>
      </div>)}
      <button className="studio-button" type="button" onClick={()=>patch(key,[...draft.data[key],{title:'',time:'',description:''}])}>+ Add event</button>
     </div>)}
     <h3 style={{marginTop:25}}>Your photos</h3>
     <p className="studio-help">This uses the existing photo library. Personal photo uploads are a follow-up.</p>
     {draft.data.photos.map((photo,index)=><label key={index}>Photo {index+1}
      <select value={photo} onChange={event=>patch('photos',draft.data.photos.map((item,n)=>n===index?event.target.value:item))}>
       {Array.from(new Set([...defaultInvite.photos,...draft.data.photos])).map((item,n)=><option key={item} value={item}>Library photo {n+1}</option>)}
      </select>
     </label>)}
     <h3 style={{marginTop:25}}>Visible sections</h3>
     {studioSections.filter(item=>item.id!=='hero').map(item=><label key={item.id} className="studio-checkbox">
      <input type="checkbox" checked={draft.data.sections[item.id]!==false} onChange={event=>patch('sections',{...draft.data.sections,[item.id]:event.target.checked})}/>{item.label}
     </label>)}
     <label>Background music
      <select value={draft.data.music} onChange={event=>patch('music',event.target.value)}>
       <option value="">No music</option>
       <option value="/assets/track1.mp3">Gentle celebration</option>
       <option value="/assets/track3.mp3">Royal celebration</option>
       {draft.template==='royal-temple'&&<option value="/assets/temple/invite-bg.mp3">Temple original</option>}
      </select>
     </label>
     <div className="studio-save-row">
      <button className="studio-button primary" disabled={busy}>{busy?'Saving…':'Save my details'}</button>
      <button type="button" className="studio-button" onClick={()=>void loadHistory()}>Version history</button>
     </div>
    </form>}
    {drawer==='history'&&<>
     <p className="studio-help">Restore a saved version to your draft. Your published invitation stays unchanged.</p>
     {versions.map(item=><button key={item.revision} className="studio-history-row" disabled={busy||item.revision===draft.revision} onClick={()=>void restore(item.revision)}>
      <b>Version {item.revision+1}{item.revision===draft.revision?' · Current':''}</b>
      <p>{item.message}</p>
      <small>{new Date(item.created_at).toLocaleString()}</small>
     </button>)}
    </>}
    {drawer==='publish'&&<form className="studio-fields" onSubmit={event=>void publish(event)}>
     <p className="studio-help">Publish this exact version for your guests. Future edits stay private until you publish again.</p>
     <label>Your invitation address
      <input required pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]" placeholder="ashok-and-supriya" value={slug} readOnly={!!draft.publishedSlug} onChange={event=>setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}/>
      <small>{location.origin}/{slug||'your-story'}</small>
     </label>
     <button className="studio-button primary" disabled={busy}>{busy?'Publishing…':draft.publishedSlug?'Publish these changes':'Publish my invitation'}</button>
     {draft.publishedSlug&&<div className="studio-success">
      <p>Your invitation is live.</p>
      <a href={'/'+draft.publishedSlug} target="_blank" rel="noreferrer">Open guest invitation ↗</a>
      <p><a href={'/manage/'+draft.publishedSlug}>Guest responses & recovery link</a></p>
     </div>}
    </form>}
   </section>
  </div>}
 </main>;
}
