import sanctuaryDefaults from '../../public/studio/royal-sanctuary.defaults.json';
import {useEffect,useState} from 'react';
import {defaultInvite} from '../Invitation';
import StudioPreview from './StudioPreview';
import renderers from '../../public/studio/renderers.json';
export default function TempleDemo(){
 const selected=new URLSearchParams(location.search).get('template')||'royal-temple';
 const template=(renderers.htmlTemplates.includes(selected)||selected.startsWith('sku-'))?selected:'royal-temple';
 const [base,setBase]=useState(template);
 const [html,setHtml]=useState(''),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch(template.startsWith('sku-')?'/api/workspace?action=public&id='+encodeURIComponent(template):'/studio/templates/'+template+'.html').then(async r=>{if(!r.ok)throw Error('This preview is temporarily unavailable.');if(template.startsWith('sku-')){const d=await r.json();if(active)setBase(d.base_id);return d.html;}return r.text()}).then(s=>{if(active)setHtml(s)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[template]);
 const data={...defaultInvite,template,groom:'Rohan',bride:'Ananya',groomDetails:'With his loving family',brideDetails:'With her loving family',date:'2026-12-20',welcome:'With our families, we invite you to celebrate our wedding.',music:template==='royal-temple'?'/assets/temple/invite-bg.mp3':template==='royal-heritage-wedding'?'':'/assets/track1.mp3'};
 if(base==='royal-sanctuary'){Object.assign(data,sanctuaryDefaults)}else{data.timeline=data.timeline.map(e=>({...e,time:data.date+'T'+data.time}));data.preEvents=data.preEvents.map(e=>({...e,time:data.date+'T'+data.time}));}
 return <div style={{height:'100dvh'}}>{error?<p role="alert">{error}</p>:html?<StudioPreview html={html} data={data}/>:<p>Opening your invitation…</p>}<a href={'/templates?collection='+(template==='emerald-noir'?'classic':'royal')+'&design='+template} style={{position:'fixed',top:16,left:16,zIndex:50,background:'white',padding:'10px 16px',borderRadius:20,color:'#244331'}}>Choose this design →</a></div>
}
