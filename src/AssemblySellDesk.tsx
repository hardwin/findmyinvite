import {useMemo,useState,type FormEvent} from 'react';

function friendlyVideoError(raw?:string|null){
 const text=String(raw||'').replace(/\s+/g,' ').trim();
 if(!text)return 'Video failed. Tap Generate Video to retry.';
 if(/npm notice|playwright|chromium|headless|sparticuz|sandbox|browserType|Target page/i.test(text)){
  return 'Cloud capture could not start. Tap Generate Video to retry.';
 }
 return text.slice(0,180);
}

export type SellStage=
 |'welcome'
 |'theme'
 |'storyboard'
 |'face_swap'
 |'lock'
 |'details'
 |'generate'
 |'ready';

export type StoryboardShot={
 start?:number;
 end?:number;
 n?:number;
 scene:string;
 camera?:string;
 movement?:string;
 emotion?:string;
 transition?:string;
};

export type StoryboardState={
 revealType:string;
 firstBrief:string;
 middleBeats:string[];
 lastBrief:string;
 title?:string;
 continuity?:string;
 openingPrompt?:string;
 direction?:string;
 airborneLayers?:string[];
 revision?:number;
 revisionPending?:boolean;
 history?:{url:string;revision:number}[];
 shots?:StoryboardShot[];
 sheetUrl?:string;
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

export type ThemeSuggestion={
 id:string;
 label:string;
 tags:string[];
 pinUrl:string;
 thumb:string;
};

export type SellDeskState={
 stage:SellStage;
 themeQuery:string;
 iframeUrl:string;
 suggestions:ThemeSuggestion[];
 pinUrl:string;
 pinPreview:string;
 styleNote:string;
 storyboard:StoryboardState|null;
 details:InviteDetails;
 heroUrl:string;
 brideImageUrl:string;
 groomImageUrl:string;
};

/** Client-side theme bank (mirrors server) — Pinterest site cannot iframe. */
export const THEME_BANK:ThemeSuggestion[]=[
 {id:'velicha',label:'Ethereal watercolor',tags:['watercolor','garden','romantic','magenta','ethereal','couple'],pinUrl:'https://pin.it/330nC70it',thumb:'https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg'},
 {id:'kaatrukulle',label:'Garden door romance',tags:['garden','door','watercolor','romantic','sage','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/4cfcddd6f8996fe3.png'},
 {id:'temple-gold',label:'Temple gold glam',tags:['temple','gold','royal','regal','traditional','hindu'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/4cfcddd6f8996fe3.png'},
 {id:'royal-cream',label:'Royal cream couple',tags:['royal','cream','elegant','regal','couple','cinematic'],pinUrl:'https://www.pinterest.com/pin/567488040032279278/',thumb:'/assets/ad64264e60445499.jpg'},
 {id:'modern-glam',label:'Modern glam night',tags:['modern','glam','night','city','sleek','couple'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/e4e5ca7a8c0c7b74.jpg'},
 {id:'meadow',label:'Soft meadow light',tags:['meadow','outdoor','soft','pastel','garden','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/15cbf1df9056e121.jpg'},
 {id:'floral-arch',label:'Floral arch ceremony',tags:['floral','arch','ceremony','flowers','romantic'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/3c934c61dec8899c.jpg'},
 {id:'palace',label:'Palace grandeur',tags:['palace','heritage','royal','dramatic','cinematic'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/50122aee9f7395c4.jpg'},
 {id:'pastel-invite',label:'Pastel invitation art',tags:['pastel','invitation','art','paper','watercolor'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/863e1b3374bb313a.jpg'},
 {id:'sunset',label:'Golden hour sunset',tags:['sunset','golden','hour','warm','cinematic','couple'],pinUrl:'https://pin.it/6sh37rSvu',thumb:'/assets/9b73577a4b10e8db.jpg'},
 {id:'minimal',label:'Minimal modern paper',tags:['minimal','modern','paper','clean','simple'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/ea523b0f4336159d.jpg'},
 {id:'south-indian',label:'South Indian festive',tags:['south','indian','tamil','festive','temple','traditional'],pinUrl:'https://pin.it/330nC70it',thumb:'/assets/e4e5ca7a8c0c7b74.jpg'}
];

export function themeSuggestionsForQuery(query='',limit=9):ThemeSuggestion[]{
 const q=String(query||'').toLowerCase();
 const tokens=q.split(/[^a-z0-9]+/).filter(t=>t.length>2);
 const scored=THEME_BANK.map(item=>{
  let score=0;
  for(const tag of item.tags){
   if(q.includes(tag))score+=3;
   for(const t of tokens)if(tag.includes(t)||t.includes(tag))score+=2;
  }
  if(!tokens.length)score=1;
  return {...item,score};
 });
 scored.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
 const top=scored.filter(s=>s.score>0).slice(0,limit);
 return (top.length?top:scored.slice(0,limit)).map(({score: _s,...rest})=>rest);
}

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
 const themeQuery='indian wedding invitation cinematic couple';
 return {
  stage:'welcome',
  themeQuery,
  iframeUrl:'https://www.pinterest.com/search/pins/?q='+encodeURIComponent(themeQuery)+'&rs=typed',
  suggestions:themeSuggestionsForQuery(themeQuery,9),
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
 if(output.ok===false){
  if(output.revisionPending&&prev.storyboard)return {...prev,stage:'storyboard',storyboard:{...prev.storyboard,locked:false,revisionPending:true}};
  return prev;
 }
 let next={...prev,details:{...prev.details}};
 if(typeof output.stage==='string'&&STAGE_ORDER.includes(output.stage as SellStage)){
  next.stage=output.stage as SellStage;
 }
 if(name==='update_theme_search'){
  if(typeof output.query==='string')next.themeQuery=output.query;
  if(typeof output.iframeUrl==='string')next.iframeUrl=output.iframeUrl;
  if(typeof output.styleNote==='string')next.styleNote=output.styleNote;
  if(Array.isArray(output.suggestions)&&output.suggestions.length){
   next.suggestions=output.suggestions as ThemeSuggestion[];
  }else if(typeof output.query==='string'){
   next.suggestions=themeSuggestionsForQuery(output.query,9);
  }
  if(next.stage==='welcome')next.stage='theme';
 }
 if(name==='resolve_pin'||name==='lock_theme_pin'){
  if(typeof output.pinUrl==='string')next.pinUrl=output.pinUrl;
  if(typeof output.previewUrl==='string')next.pinPreview=output.previewUrl;
  if(typeof output.styleNote==='string')next.styleNote=output.styleNote;
  if(name==='lock_theme_pin'){
   next.stage='storyboard';
   // Locked moodboard pin IS the base image — never re-ask.
   if(next.pinPreview&&!next.heroUrl)next.heroUrl=next.pinPreview;
  }
 }
 if(name==='propose_storyboard'||name==='lock_storyboard'||name==='craft_storyboard_sheet'){
  const sb=output.storyboard as StoryboardState|undefined;
  if(sb&&typeof sb==='object'){
   next.storyboard={
    revealType:String(sb.revealType||next.storyboard?.revealType||'custom'),
    firstBrief:String(sb.firstBrief||next.storyboard?.firstBrief||''),
    middleBeats:Array.isArray(sb.middleBeats)?sb.middleBeats.map(String):(next.storyboard?.middleBeats||[]),
    lastBrief:String(sb.lastBrief||next.storyboard?.lastBrief||''),
    title:sb.title?String(sb.title):next.storyboard?.title,
    continuity:sb.continuity??next.storyboard?.continuity,
    openingPrompt:sb.openingPrompt,
    direction:sb.direction,
    airborneLayers:sb.airborneLayers,
    revision:sb.revision||next.storyboard?.revision||1,
    revisionPending:false,
    history:sb.sheetUrl&&next.storyboard?.sheetUrl&&sb.sheetUrl!==next.storyboard.sheetUrl
     ?[...(next.storyboard.history||[]),{url:next.storyboard.sheetUrl,revision:next.storyboard.revision||1}].slice(-10)
     :next.storyboard?.history,
    shots:Array.isArray(sb.shots)?sb.shots:next.storyboard?.shots,
    sheetUrl:sb.sheetUrl?String(sb.sheetUrl):next.storyboard?.sheetUrl,
    firstImageUrl:sb.firstImageUrl?String(sb.firstImageUrl):undefined,
    lastImageUrl:sb.lastImageUrl?String(sb.lastImageUrl):undefined,
    locked:(name==='lock_storyboard'||Boolean(output.locked))&&sb.direction==='fpv-five-beat-v1'
   };
  }
  if(typeof output.sheetUrl==='string'){
   next.storyboard=next.storyboard||{
    revealType:'custom',firstBrief:'',middleBeats:[],lastBrief:'',locked:false
   };
   next.storyboard={...next.storyboard,sheetUrl:String(output.sheetUrl)};
  }
  if(name==='lock_storyboard'){
   next.stage='face_swap';
   if(typeof output.heroImageUrl==='string')next.heroUrl=output.heroImageUrl;
   else if(next.storyboard?.lastImageUrl)next.heroUrl=next.storyboard.lastImageUrl;
   if(typeof output.firstImageUrl==='string'&&next.storyboard){
    next.storyboard={...next.storyboard,firstImageUrl:String(output.firstImageUrl)};
   }
   if(typeof output.lastImageUrl==='string'&&next.storyboard){
    next.storyboard={...next.storyboard,lastImageUrl:String(output.lastImageUrl)};
   }
  }
 }
 if(name==='craft_storyboard_stills'&&output.ok!==false){
  if(!next.storyboard){
   next.storyboard={
    revealType:String(output.revealType||'door'),
    firstBrief:'',
    middleBeats:[],
    lastBrief:'',
    locked:false
   };
  }
  if(typeof output.firstImageUrl==='string'){
   next.storyboard={...next.storyboard,firstImageUrl:output.firstImageUrl};
  }
  if(typeof output.lastImageUrl==='string'){
   next.storyboard={...next.storyboard,lastImageUrl:output.lastImageUrl};
   next.heroUrl=output.lastImageUrl;
  }
  next.stage='storyboard';
 }
 if(name==='craft_chapter_solos'&&output.ok!==false){
  if(typeof output.brideImageUrl==='string')next.brideImageUrl=output.brideImageUrl;
  if(typeof output.groomImageUrl==='string')next.groomImageUrl=output.groomImageUrl;
  if(typeof output.coupleImageUrl==='string'&&!next.heroUrl)next.heroUrl=output.coupleImageUrl;
  next.stage='lock';
 }
 if(name==='flare_edit'&&output.ok!==false){
  const url=typeof output.url==='string'?output.url
   :(Array.isArray(output.urls)&&typeof output.urls[0]==='string'?output.urls[0]:'');
  const which=String(output.which||'hero');
  if(url){
   if(which==='sheet'&&next.storyboard)next.storyboard={...next.storyboard,sheetUrl:url,locked:false,firstImageUrl:undefined,lastImageUrl:undefined};
   else if(which==='first'&&next.storyboard)next.storyboard={...next.storyboard,firstImageUrl:url};
   else if(which==='last'&&next.storyboard){
    next.storyboard={...next.storyboard,lastImageUrl:url};
    next.heroUrl=url;
   }else if(which==='bride')next.brideImageUrl=url;
   else if(which==='groom')next.groomImageUrl=url;
   else if(which==='hero')next.heroUrl=url;
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
 if(next.storyboard&&!next.storyboard.sheetUrl){next.storyboard={...next.storyboard,locked:false};if(!['welcome','theme'].includes(next.stage))next.stage='storyboard';}
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
 const [picked,setPicked]=useState<ThemeSuggestion|null>(null);
 const browsing=state.stage==='welcome'||state.stage==='theme'||!state.pinUrl;
 const ideas=useMemo(()=>{
  if(state.suggestions?.length)return state.suggestions.slice(0,9);
  return themeSuggestionsForQuery(state.themeQuery,9);
 },[state.suggestions,state.themeQuery]);

 const STYLE_CHIPS=['temple','garden','watercolor','royal','modern','south indian','pastel','cinematic'];

 function submitPin(event?:FormEvent){
  event?.preventDefault();
  const url=paste.trim()||picked?.pinUrl||'';
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
  <aside className="asm-sell-theme" aria-label="Theme planning desk">
   <header className="asm-sell-theme-head">
    <strong>Theme planning</strong>
    <span>Ideas update as you talk — stay on FindMyInvite</span>
   </header>
   <p className="asm-sell-theme-query">{state.themeQuery}</p>
   <div className="asm-sell-style-chips" role="group" aria-label="Style shortcuts">
    {STYLE_CHIPS.map(chip=>(
     <button
      key={chip}
      type="button"
      className="asm-gpt-chip"
      disabled={busy}
      onClick={()=>onChip('I like a '+chip+' wedding invite theme. Update the Theme desk for that.')}
     >
      {chip}
     </button>
    ))}
   </div>
   <div className="asm-sell-grid" role="list">
    {ideas.map(item=>(
     <button
      key={item.id}
      type="button"
      role="listitem"
      className={'asm-sell-card'+(picked?.id===item.id?' is-on':'')}
      disabled={busy}
      onClick={()=>{
       setPicked(item);
       onLockPin(item.pinUrl);
      }}
      title={item.label}
     >
      <img src={item.thumb} alt={item.label} loading="lazy"/>
      <span>{item.label}</span>
     </button>
    ))}
   </div>
   {picked&&!state.pinUrl&&(
    <div className="asm-sell-picked">
     <p>Selected: <strong>{picked.label}</strong> — locking theme…</p>
    </div>
   )}
   <form className="asm-sell-pin-form" onSubmit={submitPin}>
    <label htmlFor="asm-sell-pin">Or paste any Pinterest pin URL</label>
    <div className="asm-sell-pin-row">
     <input
      id="asm-sell-pin"
      type="url"
      placeholder="https://pin.it/… or pinterest.com/pin/…"
      value={paste}
      disabled={busy}
      onChange={e=>setPaste(e.target.value)}
     />
     <button type="submit" className="asm-gpt-choice-submit" disabled={busy||!(paste.trim()||picked)}>
      Lock pin
     </button>
    </div>
   </form>
  </aside>
 );
}

export function StoryScenesForm({busy,onSubmit}:{busy:boolean;onSubmit:(text:string)=>void}){
 const [idea,setIdea]=useState('');
 return <form className="asm-sell-details" onSubmit={e=>{e.preventDefault();if(idea.trim()&&!busy)onSubmit(idea.trim());}}>
  <p className="asm-gpt-choice-title">Start with a moment</p>
  <p className="asm-sell-eta">Describe what happens. We’ll turn it into a visual storyboard together — five timed frames will plan one 15-second video.</p>
  <label>Your idea<textarea value={idea} disabled={busy} onChange={e=>setIdea(e.target.value)} placeholder="An oyster is half closed. Same camera, same place: it opens to reveal the couple sitting on the pearl."/></label>
  <button className="asm-gpt-choice-submit" disabled={busy||!idea.trim()}>Visualize my idea</button>
 </form>;
}

export function StoryboardPreview({state,busy,onChip,onClose}:{state:SellDeskState;busy:boolean;onChip:(text:string)=>void;onClose:()=>void}){
 const [change,setChange]=useState('');
 const [shot,setShot]=useState('all');
 const [previous,setPrevious]=useState('');
 const [loadedSheet,setLoadedSheet]=useState('');
 const [failedSheet,setFailedSheet]=useState('');
 const [loadAttempt,setLoadAttempt]=useState(0);
 const board=state.storyboard;
 const shots:StoryboardShot[]=board?.shots?.length?board.shots:[
  {scene:board?.firstBrief||''},...(board?.middleBeats||[]).map(scene=>({scene})),{scene:board?.lastBrief||''}
 ].filter(item=>item.scene);
 const old=(board?.history||[]).find(item=>item.url===previous);
 return <aside className="asm-sell-theme asm-story-preview" aria-label="Storyboard preview">
  <div className="asm-sell-theme-head"><strong>Storyboard preview</strong><button className="asm-gpt-chip" onClick={onClose}>Back to chat</button><span>{busy?'Updating your story…':board?.locked?'Approved · frames ready':'Draft · keep shaping the story'}</span></div>
  <div className="asm-story-preview-body">
   {board?.sheetUrl?<>
    <div className="asm-gpt-chips"><button className="asm-gpt-chip" aria-pressed={!old} onClick={()=>setPrevious('')}>Current · v{board.revision||1}</button>
     {(board.history||[]).map(item=><button className="asm-gpt-chip" key={item.url} aria-pressed={old?.url===item.url} onClick={()=>setPrevious(item.url)}>View v{item.revision}</button>)}
    </div>
    {old&&<p>Earlier version · edits and approval apply to the current version.</p>}
    <a href={old?.url||board.sheetUrl} target="_blank" rel="noreferrer" aria-label="Open full storyboard"><img key={(old?.url||board.sheetUrl)+loadAttempt} onLoad={()=>{setLoadedSheet(old?.url||board.sheetUrl||'');setFailedSheet('');}} onError={()=>setFailedSheet(old?.url||board.sheetUrl||'')} className="asm-sell-board-sheet" src={old?.url||board.sheetUrl} alt={old?'Earlier storyboard':'Current visual storyboard'}/></a>
   </>:<p>Your visual storyboard will appear here. Tell Akay what happens, or ask for ideas.</p>}
   {failedSheet&&(failedSheet===(old?.url||board?.sheetUrl))&&<p role="alert">Preview could not load. <button className="asm-gpt-chip" onClick={()=>{setFailedSheet('');setLoadAttempt(n=>n+1);}}>Reload preview</button></p>}
   {board?.revisionPending&&<p role="alert">The latest edit could not be painted. This is the previous image. Retry your edit before approving.</p>}
   {board?.sheetUrl&&(shots.length!==5||board.direction!=='fpv-five-beat-v1')&&<button className="asm-gpt-choice-submit" disabled={busy} onClick={()=>onChip("Rebuild this storyboard with the new five-scene FPV direction: reveal 0–6s, SAVE THE DATE in a new setup 6–9s, We're getting married in another setup 9–12s, then a 360-degree orbit with fifteen airborne depth layers in the grandest themed finale 12–15s. Preserve my theme and couple identity. Show the revised sheet.")}>Update to five-scene FPV story</button>}
   {board?.continuity&&<div className="asm-story-continuity"><strong>Keep consistent</strong><p>{board.continuity}</p></div>}
   <ol className="asm-sell-board-frames">{shots.map((row,i)=><li key={i}><strong>Frame {i+1}{shots.length===5?` · ${i*3}–${(i+1)*3}s`:""}</strong><span>{row.scene}</span>{'camera' in row&&row.camera?<small>{row.camera}</small>:null}{row.movement&&<small>Motion: {row.movement}</small>}</li>)}</ol>
   {Boolean(board?.airborneLayers?.length)&&<details><summary>Finale · {board?.airborneLayers?.length} airborne layers</summary><ol>{board?.airborneLayers?.map((layer,i)=><li key={i}>{layer}</li>)}</ol></details>}
   {board?.locked&&board.openingPrompt&&<details><summary>Approved 15-second video prompt</summary><pre style={{whiteSpace:'pre-wrap'}}>{board.openingPrompt}</pre></details>}
   <form className="asm-story-edit" onSubmit={e=>{e.preventDefault();if(!change.trim()||busy)return;onChip('Revise '+(shot==='all'?'the storyboard':'shot '+shot)+' of the CURRENT storyboard: '+change.trim()+'\nPreserve all unmentioned scenes and continuity. Show the updated visual storyboard.');setChange('');setPrevious('');}}>
    <label>Edit<select value={shot} onChange={e=>setShot(e.target.value)}><option value="all">Whole story</option>{shots.map((_,i)=><option key={i} value={String(i+1)}>Shot {i+1}</option>)}</select></label>
    <label>What should change?<textarea value={change} onChange={e=>setChange(e.target.value)} placeholder="Keep the oyster half closed in frame 1. Make the finale orbit through floating pearls and silk, with clear faces." disabled={busy}/></label>
    <button className="asm-gpt-choice-submit" disabled={busy||!change.trim()}>Update storyboard</button>
   </form>
   {board?.sheetUrl&&!board.locked&&<button className="asm-gpt-choice-submit" disabled={busy||shots.length!==5||board.direction!=='fpv-five-beat-v1'||board.revisionPending||Boolean(old)||loadedSheet!==board.sheetUrl||failedSheet===board.sheetUrl} onClick={()=>onChip('Approve storyboard\nsheetUrl: '+board.sheetUrl+'\nCompile the approved 15-second timestamped video prompt and extract the first and final panels from this approved sheet. Preserve composition and camera angle.')}>Approve storyboard → prepare video & frames</button>}
   {board?.locked&&<div className="asm-story-final"><strong>Approved first & final images</strong>{board.firstImageUrl&&<img src={board.firstImageUrl} alt="Approved first frame"/>}{board.lastImageUrl&&<img src={board.lastImageUrl} alt="Approved final frame"/>}</div>}
  </div>
 </aside>;
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
    <p>Open the website preview, then Generate Video in this chat when you want the reel.</p>
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

export type StudioVideoJob={
 jobId?:string;
 status?:string;
 percent?:number;
 label?:string;
 url?:string|null;
 error?:string|null;
};

export function GenerateVideoBar({
 ready,
 details,
 video,
 onGenerate
}:{
 ready:boolean;
 details:InviteDetails;
 video?:StudioVideoJob|null;
 onGenerate:()=>void;
}){
 if(!ready&&!video)return null;
 const names=[details.groomName,details.brideName].filter(Boolean).join(' & ');
 const busy=video&&video.status!=='ready'&&video.status!=='failed';
 const done=video?.status==='ready'&&video.url;
 const pct=Math.max(0,Math.min(100,Number(video?.percent)||0));
 return (
  <div className="asm-sell-generate" role="region" aria-label="Generate video">
   <div>
    <strong>{done?'Video ready':busy?'Generating video':'Ready to generate video'}</strong>
    <p>
     {names||details.displayName||'Your invitation'}
     {details.eventDate?' · '+details.eventDate:''}
     {details.venue?' · '+details.venue:''}
    </p>
    {busy?(
     <p className="asm-sell-eta" aria-live="polite">
      {video?.label||'Crafting…'} · {pct}%
     </p>
    ):done?(
     <p className="asm-sell-eta">Preview below — download when you like.</p>
    ):(
     <p className="asm-sell-eta">Estimated time: about 12 minutes · ₹400 add-on</p>
    )}
    {video?.status==='failed'&&(
     <p className="asm-sell-eta" role="alert">{friendlyVideoError(video.error)}</p>
    )}
    {busy&&(
     <div className="asm-sell-video-meter" aria-hidden="true">
      <span style={{width:pct+'%'}}/>
     </div>
    )}
    {done&&(
     <div className="asm-sell-video-preview">
      <video src={video.url||undefined} controls playsInline preload="metadata"/>
      <a className="asm-sell-generate-btn" href={video.url||'#'} download>Download</a>
     </div>
    )}
   </div>
   {!done&&(
    <button type="button" className="asm-sell-generate-btn" disabled={!!busy||!ready} onClick={onGenerate}>
     {busy?pct+'%':'Generate Video'}
    </button>
   )}
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
