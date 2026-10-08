import {useEffect,useMemo,useState} from 'react';
import './client-proof.css';

type Still={scene:number;title:string;caption:string;version:number;decision:'pending'|'approved'|'change';comment:string;image:string};
type Proof={couple:string;status:string;round:number;canReview:boolean;finalUrl:string;stills:Still[]};
type Choice={decision:'approved'|'change';comment:string};

const pad=(n:number)=>String(n).padStart(2,'0');

export default function ClientProof({token}:{token:string}){
 const [proof,setProof]=useState<Proof|null>(null);
 const [error,setError]=useState('');
 const [choices,setChoices]=useState<Record<number,Choice>>({});
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState<{status:string;approved:number;total:number}|null>(null);
 const [zoom,setZoom]=useState<Still|null>(null);

 async function load(){
  setError('');
  try{
   const res=await fetch('/api/client-proof?action=proof&token='+encodeURIComponent(token));
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'This approval link could not be opened.');
   setProof(body);setChoices({});
  }catch(err){setError(err instanceof Error?err.message:'This approval link could not be opened.');}
 }
 useEffect(()=>{document.title='Approve your stills | FindMyInvite';const m=document.createElement('meta');m.name='robots';m.content='noindex, nofollow';document.head.appendChild(m);void load();return ()=>{m.remove();};},[token]);

 const open=useMemo(()=>(proof?.stills||[]).filter(s=>s.decision!=='approved'),[proof]);
 const locked=useMemo(()=>(proof?.stills||[]).filter(s=>s.decision==='approved'),[proof]);
 const reviewed=open.filter(s=>choices[s.scene]).length;
 const missingComment=open.find(s=>choices[s.scene]?.decision==='change'&&!choices[s.scene].comment.trim());

 const choose=(s:Still,decision:Choice['decision'])=>setChoices(c=>{
  const prev=c[s.scene];
  if(prev?.decision===decision){const {[s.scene]:_,...rest}=c;return rest;}
  return {...c,[s.scene]:{decision,comment:prev?.comment||''}};
 });
 const approveAll=()=>setChoices(c=>{const next={...c};for(const s of open)if(!next[s.scene])next[s.scene]={decision:'approved',comment:''};return next;});

 async function submit(){
  if(!proof||busy)return;
  if(missingComment){setError(`Tell us what to change in scene ${pad(missingComment.scene)}.`);document.getElementById('scene-'+missingComment.scene)?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  setBusy(true);setError('');
  try{
   const decisions=open.filter(s=>choices[s.scene]).map(s=>({scene:s.scene,version:s.version,decision:choices[s.scene].decision,comment:choices[s.scene].comment.trim()}));
   const res=await fetch('/api/client-proof?action=decide&token='+encodeURIComponent(token),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decisions})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||'Could not send your review. Please try again.');
   setDone(body);window.scrollTo({top:0});
  }catch(err){setError(err instanceof Error?err.message:'Could not send your review. Please try again.');}
  finally{setBusy(false);}
 }

 if(error&&!proof)return <main className="cp-shell cp-center"><p className="cp-brand">FindMyInvite</p><h1 className="cp-h1">Link unavailable</h1><p className="cp-lead">{error}</p><button className="cp-btn cp-primary" onClick={()=>void load()}>Try again</button></main>;
 if(!proof)return <main className="cp-shell cp-center" aria-busy="true"><p className="cp-brand">FindMyInvite</p><p className="cp-lead">Opening your stills…</p></main>;

 if(done){
  const all=done.status==='approved';
  return <main className="cp-shell cp-center">
   <p className="cp-brand">FindMyInvite</p>
   <div className="cp-done-mark" aria-hidden="true">{all?'✓':'✎'}</div>
   <h1 className="cp-h1">{all?'Thank you! All stills approved':'Thank you! Changes received'}</h1>
   <p className="cp-lead">{all?`We will now create the video for ${proof.couple}. You will receive it on this same link.`:`You approved ${done.approved} of ${done.total} stills. We will update the scenes you marked and send you the new versions on this same link.`}</p>
   <button className="cp-btn" onClick={()=>{setDone(null);void load();}}>View my stills</button>
  </main>;
 }

 const stage=proof.status==='dispatched'?'dispatched':proof.status==='video'?'video':proof.status==='approved'?'approved':proof.status==='changes_requested'?'changes':'review';
 return <main className={'cp-shell'+(proof.canReview&&open.length>0?' has-bar':'')}>
  <header className="cp-head">
   <p className="cp-brand">FindMyInvite · Stills for approval</p>
   <h1 className="cp-h1">{proof.couple}</h1>
   {stage==='review'&&<p className="cp-lead">Please check every scene, especially the spelling of names, dates and venues. Tap a still to see it full screen.</p>}
   {stage==='changes'&&<p className="cp-lead">Thank you for your feedback. We are updating the scenes you marked; the new versions will appear here.</p>}
   {stage==='approved'&&<p className="cp-lead">All stills are approved. We are preparing your video.</p>}
   {stage==='video'&&<p className="cp-lead">Your video is being created now.</p>}
   {stage==='dispatched'&&<p className="cp-lead">Your video is ready.</p>}
   {stage==='dispatched'&&proof.finalUrl&&<a className="cp-btn cp-primary cp-wide" href={proof.finalUrl} target="_blank" rel="noopener noreferrer">Watch your video</a>}
   {proof.canReview&&open.length>0&&<div className="cp-progress" role="status" aria-live="polite">
    <div className="cp-progress-bar"><span style={{width:(open.length?reviewed/open.length*100:0)+'%'}}/></div>
    <span>{reviewed} of {open.length} reviewed</span>
   </div>}
  </header>

  <ol className="cp-feed">
   {(proof.canReview?open:proof.stills).map(s=>{
    const c=choices[s.scene],showChange=proof.canReview&&c?.decision==='change';
    return <li key={s.scene} id={'scene-'+s.scene} className={'cp-card'+(c?' is-'+c.decision:'')+(!proof.canReview&&s.decision==='change'?' is-change':'')}>
     <button type="button" className="cp-img" onClick={()=>setZoom(s)} aria-label={`Open scene ${pad(s.scene)} full screen`}>
      <img src={s.image} alt={`Scene ${pad(s.scene)}${s.title?' – '+s.title:''}`} loading={s.scene>2?'lazy':'eager'} decoding="async" width={720} height={1280}/>
      {s.version>1&&<span className="cp-badge">Updated</span>}
     </button>
     <div className="cp-meta">
      <h2>Scene {pad(s.scene)}{s.title?' · '+s.title:''}</h2>
      {s.caption&&<p className="cp-caption">{s.caption}</p>}
      {!proof.canReview&&s.decision==='approved'&&<p className="cp-state ok">Approved</p>}
      {!proof.canReview&&s.decision==='change'&&<p className="cp-state ch">Change requested: {s.comment}</p>}
      {proof.canReview&&s.decision==='change'&&s.comment&&!c&&<p className="cp-state ch">Your last note: {s.comment}</p>}
     </div>
     {proof.canReview&&<div className="cp-actions">
      <button type="button" className={'cp-btn cp-ok'+(c?.decision==='approved'?' on':'')} aria-pressed={c?.decision==='approved'} onClick={()=>choose(s,'approved')}>✓ Approve</button>
      <button type="button" className={'cp-btn cp-ch'+(c?.decision==='change'?' on':'')} aria-pressed={c?.decision==='change'} onClick={()=>choose(s,'change')}>✎ Change</button>
     </div>}
     {showChange&&<label className="cp-note">
      <span>What should we change in this scene?</span>
      <textarea rows={3} maxLength={1000} autoFocus value={c.comment} placeholder="e.g. Spelling of the venue, remove the garland, brighter colours…" onChange={e=>setChoices(x=>({...x,[s.scene]:{decision:'change',comment:e.target.value}}))}/>
     </label>}
    </li>;
   })}
  </ol>

  {proof.canReview&&locked.length>0&&<details className="cp-locked">
   <summary>{locked.length} already approved</summary>
   <ul>{locked.map(s=><li key={s.scene}><button type="button" onClick={()=>setZoom(s)}><img src={s.image} alt="" loading="lazy" width={72} height={128}/></button><span>Scene {pad(s.scene)}{s.title?' · '+s.title:''}</span></li>)}</ul>
  </details>}

  {proof.canReview&&open.length>0&&<footer className="cp-bar">
   {error&&<p className="cp-error" role="alert">{error}</p>}
   <div className="cp-bar-row">
    <button type="button" className="cp-btn" onClick={approveAll} disabled={reviewed===open.length}>Approve the rest</button>
    <button type="button" className="cp-btn cp-primary" onClick={()=>void submit()} disabled={busy||reviewed===0}>{busy?'Sending…':reviewed===open.length?'Send my review':`Send (${reviewed}/${open.length})`}</button>
   </div>
  </footer>}

  {zoom&&<div className="cp-zoom" role="dialog" aria-modal="true" aria-label={`Scene ${pad(zoom.scene)} full screen`} onClick={()=>setZoom(null)}>
   <img src={zoom.image} alt={`Scene ${pad(zoom.scene)}`}/>
   <button type="button" className="cp-zoom-close" onClick={()=>setZoom(null)} aria-label="Close">×</button>
  </div>}
 </main>;
}
