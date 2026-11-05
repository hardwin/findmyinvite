import {trackProduct} from '../product-analytics';
import {previewLanguage} from './preview-language';
import {LANGUAGE_LABELS} from '../../shared/invitation-languages.mjs';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,ChevronRight,Save,X} from 'lucide-react';
import AuthModal from '../AuthModal';
import {readSession} from '../auth-session';
import {templateApi,type Content,type SavedInvite,type TemplateVersion} from './api';
import {MediaInput} from './DynamicFields';
import LocalPreview from './LocalPreview';
import {InvitationLink} from './InvitationLink';
import {changeWeddingField,ceremonyDefaults} from '../../shared/ceremony-defaults.mjs';
import {mapLocalMedia,uploadLocalMedia,isLocalMedia} from './local-media';
import {uploadTemplateMedia} from '../../shared/template-upload.mjs';
import {optimise} from '../../shared/template-image.mjs';
import {upload} from '@vercel/blob/client';
import {templateToken} from './api';
import {formErrors,formValue,questionVisible} from '../../shared/template-forms.mjs';
import {checkoutWebsite} from './website-checkout';
import InvitationPublished from './InvitationPublished';
import {isCurrentPublication,publishWebsiteDraft} from '../../shared/invitation-publication.mjs';
import './invitation-wizard.css';

export type FormQuestion={path:string;label:string;type:string;required?:boolean;when?:string;help?:string;options?:string[];maxItems?:number;maxLength?:number;fields?:FormQuestion[]};
export type FormStep={id:string;title:string;description?:string;questions:FormQuestion[]};
export type TemplateForm={template_id:string;template_version_id:string;revision:number;staged?:boolean;definition:{version:number;name?:string;thumbnail?:string;title:string;steps:FormStep[];initialContent:Content}};
type Quote={basePaise:number;taxPaise:number;totalPaise:number;taxLabel?:string};
type EditorData={version:TemplateVersion;form:TemplateForm;invitation?:SavedInvite};
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n/100);
const fieldId=(path:string)=>'wizard-'+path.replaceAll('.','-');

function mediaDescription(value:any){return !value?'No file selected':isLocalMedia(value)?'Your selected file':String(value).startsWith('/assets/')?'Default template media — replace with your own if you like':'Your uploaded file';}

function Question({question:q,content,onChange,errors,slug,busy,onUploadBusy,domPath}:{onUploadBusy:(busy:boolean)=>void;domPath?:string;question:FormQuestion;content:Content;onChange:(path:string,value:any)=>void;errors:Record<string,string>;slug?:string;busy:boolean}){
 if(!questionVisible(q,content))return null;
 const value=formValue(content,q.path),id=fieldId(domPath||q.path),error=errors[q.path];
 if(q.type==='boolean')return <div className="iw-choice"><p id={id}>{q.label}</p><div role="group" aria-labelledby={id}><button type="button" aria-pressed={value===true} disabled={busy} onClick={()=>onChange(q.path,true)}>Yes, include this {value===true&&<Check size={17}/>}</button><button type="button" aria-pressed={value!==true} disabled={busy} onClick={()=>onChange(q.path,false)}>Skip this {value!==true&&<Check size={17}/>}</button></div></div>;
 if(q.type==='repeater'){const items=Array.isArray(value)?value:[];return <fieldset className="iw-repeat"><legend>{q.label}</legend>{items.map((item,i)=><div className="iw-repeat-item" key={i}><div className="iw-repeat-heading"><b>{q.label} {i+1}</b><button type="button" aria-label={'Remove '+q.label+' '+(i+1)} disabled={busy} onClick={()=>onChange(q.path,items.filter((_,n)=>i!==n))}>Remove</button></div>{q.fields?.map(child=>{const path=q.path+'.'+i+'.'+child.path;return <Question key={path} domPath={path} question={{...child,path:child.path}} content={item} onChange={(key,v)=>onChange(q.path,items.map((x,n)=>n===i?{...x,[key]:v}:x))} errors={{[child.path]:errors[path]}} slug={slug} busy={busy} onUploadBusy={onUploadBusy}/>;})}</div>)}<button className="iw-add" type="button" id={id} disabled={busy||items.length>=(q.maxItems||1)} onClick={()=>onChange(q.path,[...items,q.path==='events'?ceremonyDefaults(content,q.fields||[]):{}])}>+ Add {q.label.toLowerCase()}</button>{error&&<p className="iw-field-error" role="alert">{error}</p>}</fieldset>;}
 const inputProps={id,disabled:busy,'aria-invalid':!!error,'aria-describedby':error?id+'-error':q.help?id+'-help':undefined};
 return <div className="iw-field"><label htmlFor={id}>{q.label}{q.required?<span className="iw-required"> *</span>:<span className="iw-optional"> (optional)</span>}</label>{['image','audio','video'].includes(q.type)?<div className="iw-upload"><p>{mediaDescription(value)}</p><MediaInput local={!slug} value={value||''} onChange={v=>onChange(q.path,v)} kind={q.type} slug={slug} label={q.label} onBusyChange={onUploadBusy} disabled={busy}/></div>:q.type==='textarea'?<textarea {...inputProps} value={value||''} maxLength={q.maxLength||2000} rows={4} onChange={e=>onChange(q.path,e.target.value)}/>:q.type==='select'?<select {...inputProps} value={value||''} onChange={e=>onChange(q.path,e.target.value)}><option value="">Choose…</option>{q.options?.map(option=><option key={option} value={option}>{LANGUAGE_LABELS[option]||option}</option>)}</select>:<input {...inputProps} type={['date','time','url'].includes(q.type)?q.type:'text'} value={value||''} maxLength={q.maxLength||250} onChange={e=>onChange(q.path,e.target.value)} autoComplete="off"/>}{q.help&&<small id={id+'-help'}>{q.help}</small>}{error&&<p id={id+'-error'} className="iw-field-error" role="alert">{error}</p>}</div>;
}

export function WebsiteEditor(){
 const [data,setData]=useState<EditorData|null>(null),[content,setContent]=useState<Content>({}),[stepIndex,setStepIndex]=useState(0),[invite,setInvite]=useState<SavedInvite|null>(null),[address,setAddress]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[errors,setErrors]=useState<Record<string,string>>({}),[signin,setSignin]=useState(false),[preview,setPreview]=useState(false),[quote,setQuote]=useState<Quote|null>(null),[checkoutReady,setCheckoutReady]=useState(false);
 const [completion,setCompletion]=useState<'created'|'updated'|'restored'|null>(null);
 const dialog=useRef<HTMLDivElement>(null),body=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),pending=useRef<null|(()=>Promise<void>)>(null),saving=useRef(false),saved=useRef<SavedInvite|null>(null),owner=useRef(readSession()?.user.id),storageKey=useRef(''),dirty=useRef(false);
 useEffect(()=>{let active=true;const params=new URLSearchParams(location.search),slug=params.get('slug'),version=params.get('version');
  templateApi<EditorData>(slug?'/api/invitations?action=v2-manage&slug='+encodeURIComponent(slug):'/api/templates?action=editor&id='+encodeURIComponent(version||'')).then(result=>{
   if(!active)return;if(!result.form||result.form.template_version_id!==result.version.id)throw Error('This invitation’s form is not available.');
   const key='fmi-form:'+result.version.id+':'+(slug||'new');storageKey.current=key;let initialAddress=result.invitation?.slug||'',initial=result.invitation?.content||{...structuredClone(result.form.definition.initialContent),language:previewLanguage()},index=Math.max(0,result.form.definition.steps.findIndex(s=>s.id===result.invitation?.formStepId));
   if(!slug||result.invitation){try{const remembered=JSON.parse(sessionStorage.getItem(key)||'null');if(remembered?.formRevision===result.form.revision&&(!slug||remembered.owner===readSession()?.user.id&&remembered.serverRevision===result.invitation?.revision)){initial=remembered.content;initialAddress=remembered.address||'';index=Math.min(remembered.stepIndex||0,result.form.definition.steps.length-1);}}catch{/* browser storage is optional */}}
   saved.current=result.invitation||null;setInvite(result.invitation||null);setAddress(initialAddress);setContent(changeWeddingField(changeWeddingField(initial,'date',initial.date),'time',initial.time));setStepIndex(index);setCompletion(isCurrentPublication(result.invitation)?'restored':null);setData(result);trackProduct('form_start',result.version.template_id,String(initial.language||'en'));

  }).catch(e=>{if(active)setError(e.message);});
  templateApi<{quote:Quote;configured:boolean}>('/api/payments?action=v2-config').then(r=>{if(active){setQuote(r.quote);setCheckoutReady(r.configured);}}).catch(()=>{});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{if(!data||!storageKey.current)return;try{sessionStorage.setItem(storageKey.current,JSON.stringify({formRevision:data.form.revision,content,stepIndex,address,owner:readSession()?.user.id,serverRevision:invite?.revision}));}catch{/* saving to an account remains available */}},[content,stepIndex,data,address,invite]);
 useEffect(()=>{heading.current?.focus();body.current?.scrollTo(0,0);},[stepIndex,data,preview]);
 useEffect(()=>{const overflow=document.body.style.overflow;document.body.style.overflow='hidden';const key=(e:KeyboardEvent)=>{if(preview||signin||!dialog.current)return;if(e.key==='Escape'){e.preventDefault();if(!saving.current&&!uploading)close();}if(e.key==='Tab'){const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary')).filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;window.removeEventListener('keydown',key);};},[preview,signin,data,uploading]);
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue='';}};const auth=()=>{const next=readSession()?.user.id;if(next&&owner.current&&owner.current!==next){pending.current=null;saved.current=null;setInvite(null);setContent({});setData(null);setError('Your account changed. Reopen your invitation from My invitations.');}if(next)owner.current=next;};window.addEventListener('beforeunload',guard);window.addEventListener('fmi-auth-changed',auth);return()=>{window.removeEventListener('beforeunload',guard);window.removeEventListener('fmi-auth-changed',auth);};},[]);

 function close(){dirty.current=false;location.assign('/templates'+(data?'?product='+encodeURIComponent(data.version.template_id):''));}
 function change(path:string,value:any){setContent(c=>changeWeddingField(c,path,value));setErrors({});setNotice('');dirty.current=true;}
 async function run(task:()=>Promise<void>){if(saving.current)return;saving.current=true;setBusy(true);setError('');setNotice('');try{await task();}catch(e){const message=(e as Error).message;setError(message);if(message.toLowerCase().includes('address')){setErrors(e=>({...e,address:message}));document.getElementById('invitation-address')?.focus();}}finally{saving.current=false;setBusy(false);}}
 function withAccount(task:()=>Promise<void>){if(!readSession()){pending.current=task;setSignin(true);return;}void run(async()=>{if(!await templateToken()){pending.current=task;setSignin(true);return;}await task();});}
 function finishAuth(){setSignin(false);const session=readSession();if(session&&session.expires_at>Date.now()&&pending.current){const task=pending.current;pending.current=null;void run(task);}else pending.current=null;}
 async function persist(index=stepIndex){
  if(!data)throw Error('Form unavailable.');if(!readSession())throw Error('Sign in to save your invitation.');
  if(address&&!/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(address)){setErrors(e=>({...e,address:'Use 3–48 lowercase letters, numbers or hyphens.'}));document.getElementById('invitation-address')?.focus();throw Error('Please check your invitation address.');}
  let current=saved.current;
  const common={formRevision:data.form.revision,formStepId:data.form.definition.steps[index].id};
  // Create an owned draft before transferring the browser's files to private storage.
  if(!current){
   const clean=await mapLocalMedia(content,async()=> '');
   const created=await templateApi<{invitation:SavedInvite}>('/api/invitations?action=v2-create',{...common,content:clean,versionId:data.version.id,...(address?{slug:address}:{})});
   current=created.invitation;saved.current=current;setInvite(current);setAddress(current.slug);
   storageKey.current='fmi-form:'+data.version.id+':'+current.slug;
   history.replaceState(null,'','/personalise?slug='+encodeURIComponent(current.slug));
  }
  const slug=current.slug;
  const uploaded=await mapLocalMedia(content,id=>uploadLocalMedia(id,slug,(file,kind)=>uploadTemplateMedia({file,kind,slug,optimise,api:templateApi,upload,token:templateToken})));
  const result=await templateApi<{invitation:SavedInvite}>('/api/invitations?action=v2-save&slug='+encodeURIComponent(slug),{...common,content:uploaded,revision:current.revision,newSlug:address||slug});
  saved.current=result.invitation;setInvite(result.invitation);setContent(uploaded);setAddress(result.invitation.slug);dirty.current=false;
  const oldKey=storageKey.current;storageKey.current='fmi-form:'+data.version.id+':'+result.invitation.slug;
  try{sessionStorage.removeItem('fmi-form:'+data.version.id+':new');if(oldKey!==storageKey.current)sessionStorage.removeItem(oldKey);}catch{}
  history.replaceState(null,'','/personalise?slug='+encodeURIComponent(result.invitation.slug));return result.invitation;
 }
 function check(id?:string){if(!data)return false;const problems=formErrors(data.form.definition,content,id);setErrors(problems);if(Object.keys(problems).length){const first=Object.keys(problems)[0];const index=data.form.definition.steps.findIndex(s=>s.questions.some(q=>first===q.path||first.startsWith(q.path+'.')));if(index>=0)setStepIndex(index);requestAnimationFrame(()=>{const el=document.getElementById(fieldId(first))||dialog.current?.querySelector<HTMLElement>('[aria-invalid=true]');el?.focus();el?.scrollIntoView({block:'center'});});return false;}return true;}
 async function next(){if(!data||!check(data.form.definition.steps[stepIndex].id))return;trackProduct('form_progress',data.version.template_id,String(content.language||'en'),stepIndex);const index=stepIndex+1;if(saved.current)await persist(index);setStepIndex(index);}
 async function publish(){if(!check())return;if(data)trackProduct('checkout',data.version.template_id,String(content.language||'en'));const current=await persist();const published=await publishWebsiteDraft(current,{checkout:checkoutWebsite,publish:(slug:string,payload:unknown)=>templateApi<{invitation:SavedInvite}>('/api/invitations?action=v2-publish&slug='+encodeURIComponent(slug),payload)});saved.current=published;setInvite(published);setCompletion(current.firstPublishedAt?'updated':'created');}
 async function renew(){if(!saved.current)return;const current=saved.current,orderId=await checkoutWebsite(current.slug,'renew');const result=await templateApi<{invitation:SavedInvite}>('/api/invitations?action=v2-renew&slug='+current.slug,{revision:current.revision,orderId});saved.current=result.invitation;setInvite(result.invitation);if(isCurrentPublication(result.invitation))setCompletion('restored');else setNotice('Hosting renewed for six months.');}
 if(preview&&data)return <div className={"iw-preview"+(["thiruvarul-v1","kalyana-payanam-v1"].includes(data.version.renderer)?" iw-preview-journey":"")}><LocalPreview version={data.version} content={content}/><div className="iw-preview-toolbar"><button onClick={()=>setPreview(false)}><ArrowLeft size={16}/> Back to your answers</button></div></div>;

 const form=data?.form.definition,step=form?.steps[stepIndex],review=step?.id==='review';
 const completed=!!completion&&isCurrentPublication(invite),totalSteps=(form?.steps.length||0)+1;
 return <div className="iw-page"><div className="iw-backdrop" aria-hidden="true"><div className="iw-background-nav">♥ FindMyInvite</div><div className="iw-background-copy"><span>YOUR INVITATION</span><h1>{form?.name||'A celebration worth sharing.'}</h1><p>Make it yours, one detail at a time.</p></div>{form?.thumbnail&&<img src={form.thumbnail} alt=""/>}</div><div className="iw-shade"/>
 <div ref={dialog} className={'iw-dialog'+(completed?' iw-dialog--published':'')} role="dialog" aria-modal="true" aria-labelledby="iw-title" aria-busy={busy||uploading}>
 {completed&&invite?<InvitationPublished invitation={invite} templateName={form?.name} thumbnail={form?.thumbnail} totalSteps={totalSteps} celebrate={completion==='created'} updated={completion==='updated'} onClose={close} onEdit={()=>{setCompletion(null);setNotice('');setStepIndex(Math.max(0,form!.steps.findIndex(s=>s.id==='review')));requestAnimationFrame(()=>heading.current?.focus());}}/>:<>
  <header className="iw-header"><button className="iw-close" aria-label="Close personalisation" disabled={busy||uploading} onClick={close}><X size={21}/></button><span className="iw-step-label">{form?'STEP '+(stepIndex+1)+' OF '+totalSteps:'YOUR INVITATION'}</span><h2 id="iw-title">{form?.title||'Customise your invitation'}</h2><p>{form?.name?form.name+' · ':''}A few thoughtful details. A beautiful invitation.</p>{form&&<div className="iw-progress" role="progressbar" aria-label="Form progress" aria-valuenow={stepIndex+1} aria-valuemin={1} aria-valuemax={totalSteps}>{[...form.steps.map(s=>s.id),'published'].map((id,i)=><span key={id} className={i<=stepIndex?'done':''}/>)}</div>}</header>
  <div ref={body} className="iw-body">{error&&<p role="alert" className="iw-error">{error}</p>}{notice&&<p role="status" className="iw-notice">{notice}</p>}{!data&&!error&&<p role="status">Loading your invitation’s form…</p>}{!data&&error&&<button onClick={()=>{pending.current=async()=>location.reload();setSignin(true);}}>Sign in</button>}{step&&<><h3 ref={heading} tabIndex={-1}>{step.title}</h3>{step.description&&<p className="iw-description">{step.description}</p>}{!review?step.questions.map(q=><Question key={q.path} question={q} content={content} onChange={change} errors={errors} slug={invite?.slug} busy={busy||uploading} onUploadBusy={setUploading}/>):<>
   <div className="iw-review">{form!.steps.filter(s=>s.id!=='review').map((s,i)=><section key={s.id}><header><h4>{s.title}</h4><button type="button" onClick={()=>{setErrors({});setStepIndex(i);}}>Edit</button></header><dl>{s.questions.filter(q=>questionVisible(q,content)&&q.type!=='boolean').map(q=>{const value=formValue(content,q.path);return value&&(!Array.isArray(value)||value.length)?<div key={q.path}><dt>{q.label}</dt><dd>{Array.isArray(value)?value.map((item,i)=>[(i+1)+'.',...(q.fields||[]).map(f=>item[f.path]?f.label+': '+(['image','audio','video'].includes(f.type)?mediaDescription(item[f.path]):item[f.path]):'')].filter(Boolean).join(' · ')).join('\n'):['image','audio','video'].includes(q.type)?mediaDescription(value):q.path==='language'?(LANGUAGE_LABELS[String(value)]||String(value)):String(value)}</dd></div>:null;})}</dl>{s.questions.some(q=>q.type==='boolean'&&!formValue(content,q.path))&&<small>Optional sections can be added using Edit.</small>}</section>)}</div>

   <div className="iw-field"><label htmlFor="invitation-address">Invitation address</label><input id="invitation-address" aria-invalid={!!errors.address} aria-describedby={errors.address?"address-error":undefined} value={address} disabled={!!invite?.firstPublishedAt} placeholder="Choose an address, or leave it for us" onChange={e=>{setAddress(e.target.value.toLowerCase());dirty.current=true;}}/>{errors.address&&<p id="address-error" role="alert" className="iw-field-error">{errors.address}</p>}<small>findmyinvite.com/{address||'your-invitation'}</small></div>
   <button className="iw-preview-button" type="button" onClick={()=>{if(check())setPreview(true);}}>Preview your invitation</button>
   <section className="iw-price"><h4>{invite?.firstPublishedAt?'Your invitation':'Ready to share?'}</h4>{invite?.firstPublishedAt?<p>Published and ready to share.</p>:quote?<p>{money(quote.basePaise)} + {quote.taxLabel||'GST'} {money(quote.taxPaise)} <strong>Total {money(quote.totalPaise)}</strong></p>:<p>Checkout is temporarily unavailable. Your draft can still be saved.</p>}<small>Six months of hosting. No automatic renewal.</small>{invite?.firstPublishedAt&&<InvitationLink slug={invite.slug}/>}</section>{invite?.firstPublishedAt&&<button className="iw-add" disabled={busy||uploading||!checkoutReady} onClick={()=>withAccount(renew)}>Renew six months</button>}
  </>}</>}</div>
  <footer className="iw-footer"><div><button type="button" className="iw-back" disabled={busy||uploading||stepIndex===0} onClick={()=>{setErrors({});setStepIndex(i=>i-1);}}><ArrowLeft size={16}/> Back</button>{data&&<button type="button" className="iw-save" aria-label="Save" disabled={busy||uploading} onClick={()=>{if(readSession())void run(async()=>{await persist();setNotice('Your progress is saved to your account.');});else {try{sessionStorage.setItem(storageKey.current,JSON.stringify({formRevision:data!.form.revision,content,stepIndex,address}));dirty.current=false;setNotice('Draft saved on this browser. Sign in with Google when you are ready to pay.');}catch{setError('This browser could not save your draft. Keep this page open to preserve your answers.');}}}}><Save size={16}/><span>Save</span></button>}</div><button type="button" className="iw-continue" disabled={busy||uploading||!data||review&&!invite?.firstPublishedAt&&!checkoutReady} onClick={()=>review?(check()&&withAccount(publish)):void run(next)}>{uploading?'Uploading…':busy?'Saving…':review?(invite?.firstPublishedAt?'Publish changes':'Pay and publish'):'Continue'}{!busy&&!review&&<ChevronRight size={17}/>}</button></footer>
 </>}
 </div>{signin&&<AuthModal onClose={finishAuth} returnTo={location.pathname+location.search} onBeforeRedirect={()=>{if(data&&storageKey.current){sessionStorage.setItem(storageKey.current,JSON.stringify({formRevision:data.form.revision,content,stepIndex,address,owner:readSession()?.user.id,serverRevision:invite?.revision}));dirty.current=false;}}}/>}</div>;

}
