import {useState} from 'react';
export function OpeningNamesForm({names,busy,onConfirm}:{names?:{groomName:string;brideName:string};busy:boolean;onConfirm:(names:{groomName:string;brideName:string})=>Promise<void>}){
 const [groomName,setGroom]=useState(names?.groomName||'');
 const [brideName,setBride]=useState(names?.brideName||'');
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[editing,setEditing]=useState(!names);
 if(!editing&&names)return <p>Opening names: <strong>{names.groomName} Weds {names.brideName}</strong> <button type="button" disabled={busy} onClick={()=>setEditing(true)}>Edit names</button></p>;
 return <form className="asm-sell-details" onSubmit={async e=>{e.preventDefault();setSaving(true);setError('');try{await onConfirm({groomName:groomName.trim(),brideName:brideName.trim()});setEditing(false);}catch(err){setError(err instanceof Error?err.message:'Could not confirm names.');}finally{setSaving(false);}}}>
  <p><strong>Confirm the names for your opening</strong></p><p>We’ll use this exact spelling. Changing it requires an updated storyboard.</p>
  <label>Groom’s name<input required maxLength={80} value={groomName} onChange={e=>setGroom(e.target.value)} disabled={busy||saving}/></label>
  <label>Bride’s name<input required maxLength={80} value={brideName} onChange={e=>setBride(e.target.value)} disabled={busy||saving}/></label>
  {error&&<p role="alert">{error}</p>}<button disabled={busy||saving||!groomName.trim()||!brideName.trim()}>{saving?'Saving…':'Confirm names'}</button>
 </form>;
}
