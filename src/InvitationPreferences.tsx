import {useEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Check,ChevronDown,Languages,X} from 'lucide-react';
import {LANGUAGE_LABELS} from '../shared/invitation-languages.mjs';
import {INVITATION_TRADITIONS} from '../shared/invitation-preferences.mjs';
import {readSession} from './auth-session';
import {usePreviewLanguage,savePreviewLanguage,selectedPreviewLanguage} from './templates/preview-language';
import {useInvitationPreferences,readInvitationPreferences,saveInvitationPreferences,syncInvitationPreferences,dismissInvitationPreferences,preferencesDismissed} from './invitation-preferences';
import './invitation-preferences.css';

export default function InvitationPreferences(){
 const preferences=useInvitationPreferences(),preview=usePreviewLanguage(),trigger=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const [stage,setStage]=useState<'language'|'tradition'|null>(null),[language,setLanguage]=useState('');
 const path=location.pathname.replace(/\/$/,'')||'/';
 const welcome=['/','/templates','/search'].includes(path)&&!new URLSearchParams(location.search).has('product');
 useEffect(()=>{
  let active=true;
  const restore=async()=>{
   try{await syncInvitationPreferences();if(active&&welcome&&!readInvitationPreferences()&&!preferencesDismissed())setStage('language');}
   catch{/* A temporary account error should not prompt a returning visitor again. */}
  };
  void restore();window.addEventListener('fmi-auth-changed',restore);
  return()=>{active=false;window.removeEventListener('fmi-auth-changed',restore);};
 },[welcome]);
 useEffect(()=>{if(stage)heading.current?.focus();},[stage]);
 function open(){setLanguage(preview);setStage('language');}
 function close(){dismissInvitationPreferences();setStage(null);}
 function apply(language:string,tradition:string){
  // Apply locally before account sync; a slow connection must not block browsing.
  void saveInvitationPreferences({language,tradition}).catch(()=>{
   // The local choice remains active and its pending account save retries on return.
  });
  setStage(null);
 }
 function chooseLanguage(value:string){
  setLanguage(value);
  if(preferences?.tradition){apply(value,preferences.tradition);return;}
  savePreviewLanguage(value);setStage('tradition');
 }
 const languageLabel=LANGUAGE_LABELS[preferences?preview:language||selectedPreviewLanguage()||'']?.split(' · ')[0];
 const traditionLabel=INVITATION_TRADITIONS.find(([id])=>id===preferences?.tradition)?.[1];
 return <>
  <button ref={trigger} className="di-preferences-trigger" type="button" onClick={open} aria-label="Change invitation language" aria-haspopup="dialog">
   <Languages size={18} aria-hidden="true"/><span><strong>{languageLabel||'Language'}</strong><small>{traditionLabel||'Choose style'}</small></span><ChevronDown size={13} aria-hidden="true"/>
  </button>
  <Dialog.Root open={stage!==null} onOpenChange={value=>{if(!value)close();}}>
   <Dialog.Portal><Dialog.Overlay className="di-preferences-overlay"/>
    <Dialog.Content className={'di-preferences-dialog '+(stage==='tradition'?'di-tradition-sheet':'di-language-popover')} onOpenAutoFocus={event=>{event.preventDefault();heading.current?.focus();}} onCloseAutoFocus={event=>{event.preventDefault();trigger.current?.focus();}}>
     <button type="button" className="di-preferences-close" aria-label="Close invitation preferences" onClick={close}><X size={20} aria-hidden="true"/></button>
     {stage==='tradition'&&<div className="di-preferences-art" aria-hidden="true"><img src="/assets/findmyinvite-logo-transparent.png" alt="" width={2158} height={729}/></div>}
     <div className="di-preferences-content">
      <Dialog.Title ref={heading} tabIndex={-1}>{stage==='tradition'?'Which tradition should your invitation celebrate?':'Choose your invitation language'}</Dialog.Title>
      <Dialog.Description>{stage==='tradition'?'We’ll bring designs that suit your celebration to the front.':'See invitation previews in your preferred language. You can change this anytime.'}</Dialog.Description>
      {stage==='language'?<fieldset className="di-language-options"><legend className="sr-only">Invitation language</legend>
       {Object.entries(LANGUAGE_LABELS).map(([id,label])=>{const [name,native]=label.split(' · ');return <button type="button" className="di-preferences-option" key={id} aria-pressed={language===id} onClick={()=>chooseLanguage(id)}><span><strong>{name}</strong>{native&&<small lang={id}>{native}</small>}</span>{language===id&&<Check size={16} aria-hidden="true"/>}</button>;})}
      </fieldset>:<fieldset className="di-tradition-options"><legend className="sr-only">Invitation tradition</legend>
       {INVITATION_TRADITIONS.map(([id,label])=><button type="button" className="di-preferences-option" key={id} aria-pressed={preferences?.tradition===id} onClick={()=>apply(language,id)}><span>{label}</span>{preferences?.tradition===id&&<Check size={16} aria-hidden="true"/>}</button>)}
      </fieldset>}
      {stage==='language'&&preferences?<button className="di-preferences-secondary" type="button" onClick={()=>setStage('tradition')}>Change celebration style</button>:stage==='tradition'?<button className="di-preferences-secondary" type="button" onClick={()=>setStage('language')}>Change language · {LANGUAGE_LABELS[language]?.split(' · ')[0]}</button>:<button className="di-preferences-secondary" type="button" onClick={close}>Browse all invitations</button>}
      {stage==='tradition'&&<p className="di-preferences-note">{readSession()?'Saved with your account.':'We’ll remember your choices on this browser.'}</p>}
     </div>
    </Dialog.Content>
   </Dialog.Portal>
  </Dialog.Root>
 </>;
}
