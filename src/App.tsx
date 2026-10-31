import {lazy,Suspense,useEffect} from 'react';
import Discovery,{DiscoveryPricing} from './Discovery';
import ContentPages from './ContentPages';
import OccasionLanding from './OccasionLanding';
const TemplateCMS=lazy(()=>import('./templates/TemplateCMS'));
const WebsiteEditor=lazy(()=>import('./templates/WebsiteEditor').then(m=>({default:m.WebsiteEditor})));
const TemplatePreview=lazy(()=>import('./templates/WebsiteEditor').then(m=>({default:m.TemplatePreview})));
const TemplateGuest=lazy(()=>import('./templates/WebsiteEditor').then(m=>({default:m.TemplateGuest})));
const WebsiteAccount=lazy(()=>import('./templates/WebsiteEditor').then(m=>({default:m.WebsiteAccount})));
const AkayAdmin=lazy(()=>import('./AkayAdmin'));
const Assembly=lazy(()=>import('./Assembly'));
const AssemblyPipeline=lazy(()=>import('./AssemblyPipeline'));
const ManagerLogin=lazy(()=>import('./ManagerLogin'));
const ClientDesk=lazy(()=>import('./ClientDesk'));
const ClientProof=lazy(()=>import('./ClientProof'));
export default function App(){const path=location.pathname.replace(/\/$/,'')||'/';useEffect(()=>{if(!path.startsWith('/proof/'))document.title=(path==='/'?'Find your invitation':path.slice(1).replaceAll('-',' '))+' | FindMyInvite';},[path]);
 if(['/create','/form','/editor','/studio','/workspace','/grand-launch'].includes(path)||path.startsWith('/invite/')){location.replace(['/studio','/workspace'].includes(path)?'/cms':'/templates');return null;}
 if(path.startsWith('/manage/')){location.replace('/personalise?slug='+encodeURIComponent(path.split('/')[2]));return null;}
 if(path==='/assembly'||path==='/assembly/pipeline'){location.replace(path.includes('pipeline')?'/manager/pipeline':'/manager');return null;}
 let page;
 if(path==='/cms')page=<TemplateCMS/>;
 else if(path==='/personalise')page=<WebsiteEditor/>;
 else if(path==='/template-preview')page=<TemplatePreview/>;
 else if(['/dashboard','/login','/signup','/forgot-password'].includes(path))page=<WebsiteAccount/>;
 else if(path==='/manager/pipeline')page=<AssemblyPipeline/>;
 else if(path==='/manager/clients')page=<ClientDesk/>;
 else if(/^\/proof\/[a-f0-9]{48}$/.test(path))page=<ClientProof token={path.split('/')[2]}/>;
 else if(path==='/manager/login')page=<ManagerLogin/>;
 else if(path==='/manager')page=<Assembly/>;
 else if(path.startsWith('/akay'))page=<AkayAdmin/>;
 else if(path==='/pricing')page=<DiscoveryPricing/>;
 else if(['/','/templates','/saved'].includes(path))page=<Discovery/>;
 else if(['/about','/contact','/terms','/privacy-policy','/refund-policy','/shipping-policy','/blog'].includes(path)||path.startsWith('/blog/'))page=<ContentPages/>;
 else if(path.startsWith('/invitations'))page=<OccasionLanding/>;
 else if(/^\/[a-z0-9][a-z0-9-]{2,47}$/.test(path))page=<TemplateGuest slug={path.slice(1)}/>;
 else page=<main><h1>Page not found</h1><a href="/">Return home</a></main>;
 return <Suspense fallback={<main className="tc-shell" role="status">Loading…</main>}>{page}</Suspense>;
}
