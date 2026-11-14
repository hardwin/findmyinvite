import MyInvitations from '../drafts/MyInvitations';
import InvitationLoading from './InvitationLoading';
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

import './template-cms.css';
type Quote={taxLabel?:string;basePaise:number;taxPaise:number;totalPaise:number;taxBps:number};
const rupees=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n/100);

export function TemplateGuest({slug}:{slug:string}){const [data,setData]=useState<{content:Content;version:TemplateVersion}|null>(null),[error,setError]=useState('');useEffect(()=>{templateApi<any>('/api/invitations?action=v2-public&slug='+encodeURIComponent(slug)).then(setData).catch(e=>setError(e.message));},[slug]);return data?<FlagshipRenderer {...data}/>:error?<main className="tc-shell" role="alert"><h1>Invitation unavailable</h1><p>{error}</p></main>:<InvitationLoading/>;}
export {WebsiteEditor} from './InvitationWizard';
export function WebsiteDashboard(){const [items,setItems]=useState<SavedInvite[]>([]),[error,setError]=useState('');useEffect(()=>{templateApi<{invitations:SavedInvite[]}>('/api/invitations?action=v2-mine').then(r=>setItems(r.invitations)).catch(e=>setError(e.message));},[]);return <section className="tc-shell"><h2>Your wedding websites</h2>{error&&<p role="alert">{error}</p>}{!error&&items.length===0&&<p>No wedding websites yet. Choose a design to start a free draft.</p>}{items.map(i=><article className="tc-dashboard-card" key={i.id}><strong>{i.slug}</strong><p>{i.firstPublishedAt&&i.expiresAt&&Date.parse(i.expiresAt)<=Date.now()?'Expired — renew to restore':i.published?'Published':'Draft'}{i.expiresAt?' · expires '+new Date(i.expiresAt).toLocaleDateString('en-IN'):''}</p><a href={'/personalise?slug='+i.slug}>Edit / preview / renew →</a>{i.published&&<InvitationLink slug={i.slug}/>}</article>)}</section>;}

export function WebsiteAccount(){return <div className="di-app"><DiscoveryHeader/><main className="tc-shell"><h1>My invitations</h1><MyInvitations/><p><a href="/templates">Start another invitation →</a></p></main><DiscoveryFooter/></div>;}
