import {useMemo,useState,type FormEvent} from 'react';

export type SellStage=
 |'welcome'
 |'theme'
 |'storyboard'
 |'face_swap'
 |'lock'
 |'details'
 |'generate'
 |'ready';

export type StoryboardState={
 revealType:string;
 firstBrief:string;
 middleBeats:string[];
 lastBrief:string;
 firstImageUrl?:string;
 lastImageUrl?:string;
 locked?:boolean;
};

export type InviteDetails={
 displayName?:string;
 brideName?:string;
 groomName?:string;
 eventDate?:string;
 venue?:string;
 city?:string;
 rsvpContact?:string;
 musicId?:string;
 complete?:boolean;
};

export type SellDeskState={
 stage:SellStage;
 themeQuery:string;
 iframeUrl:string;
 pinUrl:string;
 pinPreview:string;
 styleNote:string;
 storyboard:StoryboardState|null;
 details:InviteDetails;
 heroUrl:string;
 brideImageUrl:string;
 groomImageUrl:string;
};

export const STAGE_LABELS:Record<SellStage,string>={
 welcome:'Welcome',
 theme:'Theme planning',
 storyboard:'Storyboarding',
 face_swap:'Face Swap',
 lock:'Lock hero',
 details:'Invite details',
 generate:'Generate',
 ready:'Invitation ready'
};

const STAGE_ORDER:SellStage[]=['welcome','theme','storyboard','face_swap','lock','details','generate','ready'];

export function defaultSellState():SellDeskState{
 return {
  stage:'welcome',
  themeQuery:'indian wedding invitation cinematic couple',
  iframeUrl:'https://www.pinterest.com/search/pins/?q='+encodeURIComponent('indian wedding invitation cinematic couple')+'&rs=typed',
  pinUrl:'',
  pinPreview:'',
  styleNote:'',
  storyboard:null,
  details:{},
  heroUrl:'',
  brideImageUrl:'',
  groomImageUrl:''
 };
}

export function mergeSellFromTool(
 prev:SellDeskState,
 name:string,
 output:Record<string,unknown>|null
):SellDeskState{
 if(!output)return prev;
 let next={...prev,details:{...prev.details}};
 if(typeof output.stage==='string'&&STAGE_ORDER.includes(output.stage as SellStage)){
  next.stage=output.stage as SellStage;
 }
 if(name==='update_theme_search'){
  if(typeof output.query==='string')next.themeQuery=output.query;
  if(typeof output.iframeUrl==='string')next.iframeUrl=output.iframeUrl;
  if(typeof output.styleNote==='string')next.styleNote=output.styleNote;
  if(next.stage==='welcome')next.stage='theme';
 }
 if(name==='resolve_pin'||name==='lock_theme_pin'){
  if(typeof output.pinUrl==='string')next.pinUrl=output.pinUrl;
  if(typeof output.previewUrl==='string')next.pinPreview=output.previewUrl;
  if(typeof output.styleNote==='string')next.styleNote=output.styleNote;
  if(name==='lock_theme_pin')next.stage='storyboard';
 }
 if(name==='propose_storyboard'||name==='lock_storyboard'){
  const sb=output.storyboard as StoryboardState|undefined;
  if(sb&&typeof sb==='object'){
   next.storyboard={
    revealType:String(sb.revealType||'door'),
    firstBrief:String(sb.firstBrief||''),
    middleBeats:Array.isArray(sb.middleBeats)?sb.middleBeats.map(String):[],
    lastBrief:String(sb.lastBrief||''),
    firstImageUrl:sb.firstImageUrl?String(sb.firstImageUrl):next.storyboard?.firstImageUrl,
    lastImageUrl:sb.lastImageUrl?String(sb.lastImageUrl):next.storyboard?.lastImageUrl,
    locked:name==='lock_storyboard'||Boolean(output.locked)
   };
  }
  if(name==='lock_storyboard')next.stage='face_swap';
 }
 if(name==='flare_edit'&&output.ok!==false){
  const url=typeof output.url==='string'?output.url
   :(Array.isArray(output.urls)&&typeof output.urls[0]==='string'?output.urls[0]:'');
  const which=String(output.which||'hero');
  if(url){
   if(which==='first'&&next.storyboard)next.storyboard={...next.storyboard,firstImageUrl:url};
   else if(which==='last'&&next.storyboard){
    next.storyboard={...next.storyboard,lastImageUrl:url};
    next.heroUrl=url;
   }else if(which==='hero')next.heroUrl=url;
  }
 }
 if(name==='lock_final_image'&&output.ok!==false){
  if(typeof output.heroImageUrl==='string')next.heroUrl=output.heroImageUrl;
  if(typeof output.brideImageUrl==='string')next.brideImageUrl=output.brideImageUrl;
  if(typeof output.groomImageUrl==='string')next.groomImageUrl=output.groomImageUrl;
  next.stage='details';
 }
 if(name==='save_invite_details'&&output.details&&typeof output.details==='object'){
  next.details={...next.details,...(output.details as InviteDetails)};
  if(output.complete)next.stage='generate';
 }
 if(name==='start_template1'&&output.ok!==false)next.stage='generate';
 if(name==='mix_image'&&output.ok!==false){
  const url=Array.isArray(output.urls)&&typeof output.urls[0]==='string'?output.urls[0]:'';
  if(url)next.heroUrl=url;
 }
 return next;
}

export function ThemePane({
 state,
 busy,
 onLockPin,
 onChip
}:{
 state:SellDeskState;
 busy:boolean;
 onLockPin:(url:string)=>void;
 onChip:(text:string)=>void;
}){
 const [paste,setPaste]=useState('');
 const browsing=state.stage==='welcome'||state.stage==='theme'||!state.pinUrl;

 function submitPin(event?:FormEvent){
  event?.preventDefault();
  const url=paste.trim();
  if(!url||busy)return;
  onLockPin(url);
  setPaste('');
 }

 if(!browsing&&state.pinUrl){
  return (
   <aside className="asm-sell-theme" aria-label="Theme locked">
    <header className="asm-sell-theme-head">
     <strong>Theme locked</strong>
     <span>{state.styleNote||'Pin selected'}</span>
    </header>
    <div className="asm-sell-theme-locked">
     {(state.pinPreview||state.pinUrl)&&(
      <img src={state.pinPreview||state.pinUrl} alt="Locked theme pin"/>
     )}
     <p className="asm-sell-theme-pin">{state.pinUrl}</p>
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('I want to change the Pinterest theme pin.')}>
      Change theme
     </button>
    </div>
   </aside>
  );
 }

 return (
  <aside className="asm-sell-theme" aria-label="Pinterest theme desk">
   <header className="asm-sell-theme-head">
    <strong>Theme planning</strong>
    <span>Browse here — stay on FindMyInvite</span>
   </header>
   <p className="asm-sell-theme-query">{state.themeQuery}</p>
   <div className="asm-sell-iframe-wrap">
    <iframe
     key={state.iframeUrl}
     title="Pinterest theme ideas"
     src={state.iframeUrl}
     className="asm-sell-iframe"
     referrerPolicy="no-referrer-when-downgrade"
     sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
    />
   </div>
   <form className="asm-sell-pin-form" onSubmit={submitPin}>
    <label htmlFor="asm-sell-pin">Paste the pin URL when you find it</label>
    <div className="asm-sell-pin-row">
     <input
      id="asm-sell-pin"
      type="url"
      placeholder="https://pin.it/… or pinterest.com/pin/…"
      value={paste}
      disabled={busy}
      onChange={e=>setPaste(e.target.value)}
     />
     <button type="submit" className="asm-gpt-choice-submit" disabled={busy||!paste.trim()}>
      Lock pin
     </button>
    </div>
   </form>
  </aside>
 );
}

export function StoryboardCard({
 storyboard,
 busy,
 onChip
}:{
 storyboard:StoryboardState;
 busy:boolean;
 onChip:(text:string)=>void;
}){
 const reveal=String(storyboard.revealType||'door').replace(/_/g,' ');
 return (
  <div className="asm-sell-board" role="group" aria-label="Entrance storyboard">
   <p className="asm-gpt-choice-title">Entrance storyboard {storyboard.locked?'· locked':''}</p>
   <ol className="asm-sell-board-frames">
    <li>
     <strong>First · {reveal}</strong>
     <span>{storyboard.firstBrief}</span>
     {storyboard.firstImageUrl&&<img src={storyboard.firstImageUrl} alt="First reveal still"/>}
    </li>
    <li>
     <strong>Middle · video journey</strong>
     <span>{(storyboard.middleBeats||[]).join(' → ')}</span>
    </li>
    <li>
     <strong>Last · couple freeze</strong>
     <span>{storyboard.lastBrief}</span>
     {storyboard.lastImageUrl&&<img src={storyboard.lastImageUrl} alt="Last couple still"/>}
    </li>
   </ol>
   {!storyboard.locked&&(
    <div className="asm-gpt-chips">
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Lock this storyboard — First, Middle, and Last look right.')}>
      Lock storyboard
     </button>
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Change the First reveal type — show Door, Envelope, Building frame, Arches, or Windows.')}>
      Change reveal
     </button>
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Edit the Last couple freeze with Flare — make it happier and more cinematic.')}>
      Edit Last with Flare
     </button>
     <button type="button" className="asm-gpt-chip" disabled={busy} onClick={()=>onChip('Edit the First reveal with Flare using our storyboard brief.')}>
      Edit First with Flare
     </button>
    </div>
   )}
  </div>
 );
}

export function ProcessChip({stage}:{stage:SellStage}){
 const label=STAGE_LABELS[stage]||stage;
 const idx=STAGE_ORDER.indexOf(stage);
 return (
  <div className="asm-sell-process" aria-label={'Current step: '+label}>
   <span className="asm-sell-process-label">{label}</span>
   <span className="asm-sell-process-steps">{Math.max(1,idx+1)}/{STAGE_ORDER.length}</span>
  </div>
 );
}

export function GenerateBar({
 ready,
 busy,
 details,
 onGenerate
}:{
 ready:boolean;
 busy:boolean;
 details:InviteDetails;
 onGenerate:()=>void;
}){
 if(!ready)return null;
 const names=[details.groomName,details.brideName].filter(Boolean).join(' & ');
 return (
  <div className="asm-sell-generate" role="region" aria-label="Generate invitation">
   <div>
    <strong>Ready to generate</strong>
    <p>
     {names||details.displayName||'Your invitation'}
     {details.eventDate?' · '+details.eventDate:''}
     {details.venue?' · '+details.venue:''}
    </p>
    <p className="asm-sell-eta">Estimated time: about 15 minutes</p>
   </div>
   <button type="button" className="asm-sell-generate-btn" disabled={busy} onClick={onGenerate}>
    Generate
   </button>
  </div>
 );
}

export function ReadyBanner({
 previewUrl,
 onDismiss
}:{
 previewUrl?:string|null;
 onDismiss:()=>void;
}){
 return (
  <div className="asm-sell-ready" role="status">
   <div>
    <strong>Your invitation is ready</strong>
    <p>Open the preview whenever you like — the cinematic invite is waiting.</p>
   </div>
   <div className="asm-gpt-chips">
    {previewUrl&&(
     <a className="asm-gpt-chip" href={previewUrl} target="_blank" rel="noreferrer">Open preview</a>
    )}
    <button type="button" className="asm-gpt-chip" onClick={onDismiss}>Dismiss</button>
   </div>
  </div>
 );
}

export function DetailsFields({
 busy,
 onSubmit
}:{
 busy:boolean;
 onSubmit:(text:string)=>void;
}){
 const [bride,setBride]=useState('');
 const [groom,setGroom]=useState('');
 const [displayName,setDisplayName]=useState('');
 const [eventDate,setEventDate]=useState('');
 const [venue,setVenue]=useState('');
 const [city,setCity]=useState('');
 const [rsvp,setRsvp]=useState('');

 const canSend=useMemo(()=>Boolean(bride&&groom&&displayName&&eventDate&&venue),[bride,groom,displayName,eventDate,venue]);

 return (
  <form
   className="asm-sell-details"
   onSubmit={e=>{
    e.preventDefault();
    if(!canSend||busy)return;
    onSubmit(
     [
      'Save these invite details and mark complete:',
      'displayName: '+displayName,
      'brideName: '+bride,
      'groomName: '+groom,
      'eventDate: '+eventDate,
      'venue: '+venue,
      city?('city: '+city):'',
      rsvp?('rsvpContact: '+rsvp):'',
      'Call save_invite_details with complete true.'
     ].filter(Boolean).join('\n')
    );
   }}
  >
   <p className="asm-gpt-choice-title">Invite details</p>
   <div className="asm-sell-details-grid">
    <label>Groom<input value={groom} disabled={busy} onChange={e=>setGroom(e.target.value)} placeholder="Groom name"/></label>
    <label>Bride<input value={bride} disabled={busy} onChange={e=>setBride(e.target.value)} placeholder="Bride name"/></label>
    <label>Invite title<input value={displayName} disabled={busy} onChange={e=>setDisplayName(e.target.value)} placeholder="Display / VIBE name"/></label>
    <label>Date<input type="date" value={eventDate} disabled={busy} onChange={e=>setEventDate(e.target.value)}/></label>
    <label>Venue<input value={venue} disabled={busy} onChange={e=>setVenue(e.target.value)} placeholder="Venue"/></label>
    <label>City<input value={city} disabled={busy} onChange={e=>setCity(e.target.value)} placeholder="City"/></label>
    <label className="is-wide">RSVP<input value={rsvp} disabled={busy} onChange={e=>setRsvp(e.target.value)} placeholder="Phone or WhatsApp"/></label>
   </div>
   <button type="submit" className="asm-gpt-choice-submit" disabled={busy||!canSend}>Confirm details</button>
  </form>
 );
}
