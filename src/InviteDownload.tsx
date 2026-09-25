import {useState} from 'react';
import walkthroughs from '../public/assets/catalogue/v1/walkthrough-manifest.json';

type Format='video'|'pdf'|'image';

const walkthroughManifest=walkthroughs as Record<string,{
 video?:string;image?:string;pdf?:string;
 blob?:{video?:string;image?:string;pdf?:string};
}>;

function manifestUrl(template:string,format:Format){
 const row=walkthroughManifest[template];
 if(!row)return '';
 // Prefer same-origin API proxy (private Blob store).
 if(format==='pdf')return row.pdf||'';
 if(format==='image')return row.image||'';
 return row.video||'';
}

function downloadUrl(url:string,filename:string){
 const a=document.createElement('a');
 a.href=url;
 a.download=filename;
 a.rel='noopener';
 document.body.appendChild(a);
 a.click();
 a.remove();
}

async function requestExport(template:string,format:Format){
 const filename=template+'-'+(format==='video'?'walkthrough.mp4':format==='pdf'?'letter.pdf':'invite.png');
 const ready=manifestUrl(template,format);
 if(ready){
  downloadUrl(ready,filename);
  return;
 }

 const res=await fetch('/api/invite-export',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({template,format})
 });
 const type=res.headers.get('content-type')||'';
 if(type.includes('application/json')){
  const data=await res.json();
  if(!res.ok)throw new Error(data.error||data.message||'Export failed');
  if(data.url){downloadUrl(data.url,filename);return;}
  throw new Error('Export completed without a file URL.');
 }
 if(!res.ok)throw new Error('Export failed ('+res.status+').');
 const blob=await res.blob();
 const url=URL.createObjectURL(blob);
 downloadUrl(url,filename);
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}

/** Gallery card — Video only, beside Use This Design. */
export function ExportVideoButton({template,className}:{template:string;className?:string}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 return (
  <>
   <button
    type="button"
    className={className||'design-button export-video-button'}
    disabled={busy}
    onClick={async e=>{
     e.preventDefault();
     e.stopPropagation();
     setError('');
     setBusy(true);
     try{await requestExport(template,'video');}
     catch(err){setError(err instanceof Error?err.message:'Export failed');}
     finally{setBusy(false);}
    }}
   >{busy?'Exporting…':'Export Video · ₹400'}</button>
   {error&&<p className="export-error" role="alert">{error}</p>}
  </>
 );
}

/** Guest footer / manage — Video, Letter PDF, Image. */
export function InviteDownloadMenu({template}:{template:string}){
 const [busy,setBusy]=useState<Format|null>(null);
 const [error,setError]=useState('');
 const run=async(format:Format)=>{
  setError('');
  setBusy(format);
  try{await requestExport(template,format);}
  catch(err){setError(err instanceof Error?err.message:'Export failed');}
  finally{setBusy(null);}
 };
 return (
  <div className="invite-download-menu">
   <p className="invite-download-label">Download</p>
   <div className="invite-download-actions">
    <button type="button" className="fmi-button outline small" disabled={!!busy} onClick={()=>run('video')}>{busy==='video'?'…':'Video · ₹400'}</button>
    <button type="button" className="fmi-button outline small" disabled={!!busy} onClick={()=>run('pdf')}>{busy==='pdf'?'…':'Letter PDF'}</button>
    <button type="button" className="fmi-button outline small" disabled={!!busy} onClick={()=>run('image')}>{busy==='image'?'…':'Image'}</button>
   </div>
   {error&&<p className="export-error" role="alert">{error}</p>}
  </div>
 );
}
