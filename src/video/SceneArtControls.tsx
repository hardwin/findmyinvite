import {useState} from 'react';
import {PHOTO_ACCEPT} from '../../shared/template-image.mjs';

type Mode='illustration'|'cutout';
type Props={label:string;people:string[];disabled:boolean;onRevise:(mode:Mode,files:Record<string,File>)=>void};
export function SceneArtControls({label,people,disabled,onRevise}:Props){
 const [files,setFiles]=useState<Record<string,File>>({});
 const fileInput=(key:string,title:string)=><label key={key}>{title}<input type="file" accept={PHOTO_ACCEPT} aria-label={title+' for '+label} onChange={e=>{const file=e.target.files?.[0];setFiles(current=>{const next={...current};if(file)next[key]=file;else delete next[key];return next;});}}/></label>;
 return <details className="vp-scene-edit"><summary>Edit this scene</summary><fieldset disabled={disabled}>
  <legend>Scene references</legend><p>Use your saved photos or choose references just for this scene.</p>
  {people.map(person=>fileInput(person,person==='bride'?'Bride reference':'Groom reference'))}
  {people.length===2&&fileInput('couple','Couple pose reference')}
  <button type="button" onClick={()=>onRevise('illustration',Object.fromEntries(Object.entries(files).filter(([key])=>key!=='photo')))}>Recreate this illustration</button>
  {fileInput('photo','Use my own photo')}<button type="button" disabled={!files.photo} onClick={()=>onRevise('cutout',{photo:files.photo})}>Remove background and use photo</button>
 </fieldset></details>;
}
