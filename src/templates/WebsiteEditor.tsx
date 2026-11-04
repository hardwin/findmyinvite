import {InvitationLink} from './InvitationLink';
import {previewLanguage} from './preview-language';
import {previewContent} from '../../shared/preview-profiles.mjs';
import {previewDictionary} from '../../shared/preview-translations.mjs';
import {useEffect,useState,useMemo} from 'react';
import {DiscoveryHeader,DiscoveryFooter} from '../Discovery';
import AuthModal from '../AuthModal';
import {readSession,requestSignIn} from '../auth-session';
import {loadRazorpay} from '../payments';
import {templateApi,loadTemplateVersion,type TemplateVersion,type SavedInvite,type Content} from './api';
import {DynamicFields} from './DynamicFields';
import FlagshipRenderer from './FlagshipRenderer';
import {DIGITAL_YES_RENDERERS} from './DigitalYesInvitation';
import './template-cms.css';
type Quote={taxLabel?:string;basePaise:number;taxPaise:number;totalPaise:number;taxBps:number};
const rupees=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n/100);
export function TemplatePreview(){
 const [version,setVersion]=useState<TemplateVersion|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;loadTemplateVersion(new URLSearchParams(location.search).get('version')||'').then(v=>{if(active)setVersion(v);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 const language=previewLanguage(),thumbnail=new URLSearchParams(location.search).get('thumbnail')==='1';
 const content=useMemo(()=>version?{...previewContent(version,language),_catalogThumbnail:thumbnail}:{},[version,language,thumbnail]);
 const copy=previewDictionary(language),back='/templates?lang='+language;
 if(!version)return <p role="status">{error||'Loading preview…'}</p>;
 if(thumbnail)return <><style>{'html,body{overflow:hidden!important;scrollbar-width:none}'}</style><FlagshipRenderer version={version} content={content} preview reduceMotion/></>;
 if(['thiruvarul-v1','kalyana-payanam-v1','theeram-v1','kerala-kasavu-v2','nikah-arches-v2',...DIGITAL_YES_RENDERERS].includes(version.renderer))return <><FlagshipRenderer version={version} content={content} preview/><a href={back} style={{position:'fixed',right:16,...(['theeram-v1','thiruvarul-v1','kalyana-payanam-v1'].includes(version.renderer)?{top:4,padding:'6px 10px',font:'11px system-ui'}:{bottom:16,padding:'10px 16px',font:'13px system-ui'}),zIndex:110,background:'#fff',borderRadius:24,color:'#282529'}}>{copy['return to library']||'Return to library'}</a></>;
 const note=<div className="tc-preview-note">{copy['template preview']||'Template preview'} <a href={back}>{copy['return to library']||'Return to library'}</a></div>;
 const immersive=['christian-editorial-v2','ivory-lace-v1'].includes(version.renderer);
 return <>{!immersive&&note}<FlagshipRenderer version={version} content={content} preview/>{immersive&&note}</>;
}
export function TemplateGuest({slug}:{slug:string}){const [data,setData]=useState<{content:Content;version:TemplateVersion}|null>(null),[error,setError]=useState('');useEffect(()=>{templateApi<any>('/api/invitations?action=v2-public&slug='+encodeURIComponent(slug)).then(setData).catch(e=>setError(e.message));},[slug]);return data?<FlagshipRenderer {...data}/>:<main className="tc-shell"><h1>{error?'Invitation unavailable':'Loading invitation…'}</h1><p>{error}</p></main>;}
export {WebsiteEditor} from './InvitationWizard';
export function WebsiteDashboard(){const [items,setItems]=useState<SavedInvite[]>([]),[error,setError]=useState('');useEffect(()=>{templateApi<{invitations:SavedInvite[]}>('/api/invitations?action=v2-mine').then(r=>setItems(r.invitations)).catch(e=>setError(e.message));},[]);return <section className="tc-shell"><h2>Your wedding websites</h2>{error&&<p role="alert">{error}</p>}{!error&&items.length===0&&<p>No wedding websites yet. Choose a design to start a free draft.</p>}{items.map(i=><article className="tc-dashboard-card" key={i.id}><strong>{i.slug}</strong><p>{i.firstPublishedAt&&i.expiresAt&&Date.parse(i.expiresAt)<=Date.now()?'Expired — renew to restore':i.published?'Published':'Draft'}{i.expiresAt?' · expires '+new Date(i.expiresAt).toLocaleDateString('en-IN'):''}</p><a href={'/personalise?slug='+i.slug}>Edit / preview / renew →</a>{i.published&&<InvitationLink slug={i.slug}/>}</article>)}</section>;}

export function WebsiteAccount(){const [session,setSession]=useState(readSession);useEffect(()=>{const sync=()=>setSession(readSession());window.addEventListener('fmi-auth-changed',sync);return()=>window.removeEventListener('fmi-auth-changed',sync);},[]);return <div className="di-app"><DiscoveryHeader/><main className="tc-shell"><h1>My invitations</h1><p>Your drafts stay private. Publish an update when you are ready to change the live invitation.</p>{session?<WebsiteDashboard key={session.user.id}/>:<button onClick={()=>requestSignIn(location.pathname==='/signup'?'signup':'signin')}>Sign in to see your invitations</button>}<p><a href="/templates">Choose a wedding website →</a></p></main><DiscoveryFooter/></div>;}
