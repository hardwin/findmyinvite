import {useState} from 'react';
import {managerFetch} from './manager-api';
export function OpeningSceneRevision({jobId,disabled,onBusy}:{jobId:string;disabled?:boolean;onBusy?:(busy:boolean)=>void}){
 const [scene,setScene]=useState('1'),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <details><summary>Revise one scene</summary><form className="asm-sell-details" onSubmit={async e=>{e.preventDefault();setBusy(true);onBusy?.(true);setError('');try{
  const res=await managerFetch('/api/assembly?action=template1-revise-scene',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId,scene:Number(scene),feedback})});
  const body=await res.json();if(!res.ok)throw new Error(body.error||'Could not revise scene.');setFeedback('');
 }catch(err){setError(err instanceof Error?err.message:'Could not revise scene.');}finally{setBusy(false);onBusy?.(false);}}}>
 <label>Scene<select value={scene} onChange={e=>setScene(e.target.value)} disabled={busy||disabled}>{['Names','Macro detail','Overhead couple','Marriage announcement','Finale'].map((label,i)=><option key={i} value={i+1}>{i+1}. {label} · {i*3}–{(i+1)*3}s</option>)}</select></label>
 <label>Motion feedback (optional)<textarea value={feedback} maxLength={1600} onChange={e=>setFeedback(e.target.value)} placeholder="Keep the title steady and readable. Slow the camera movement." disabled={busy||disabled}/></label>
 <p>This generates one replacement clip and restitches the opening. The other four clips are reused. Changes to people, text or scenery need revised endpoint approval first.</p>
 {error&&<p role="alert">{error}</p>}<button disabled={busy||disabled}>{busy?'Preparing revision…':'Generate replacement scene'}</button>
 </form></details>;
}
