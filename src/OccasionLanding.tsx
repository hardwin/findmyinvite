import {useEffect} from 'react';
import {Header,Footer,Button,Heading,Icon} from './components';
import {ctaHref,demoHref,occasionBySlug,relatedLabel,templatesHref} from './occasion-landings';
import './storefront3.css';
import './launch.css';

function setMeta(title:string,description:string,url:string){
 document.title=title;
 const tags:[string,string,string][]=[
  ['meta[name="description"]','content',description],
  ['meta[property="og:title"]','content',title],
  ['meta[property="og:description"]','content',description],
  ['meta[property="og:url"]','content',url],
  ['link[rel="canonical"]','href',url]
 ];
 for(const [selector,attr,value] of tags){
  const node=document.head.querySelector(selector) as HTMLMetaElement|HTMLLinkElement|null;
  if(node)node.setAttribute(attr,value);
 }
}

export default function OccasionLanding({path=location.pathname}:{path?:string}){
 const parts=path.replace(/\/+$/,'').split('/').filter(Boolean);
 const page=parts.length===2&&parts[0]==='invitations'?occasionBySlug[parts[1]]:undefined;
 const otherTier=page?(page.tier==='royal'?'classic':'royal'):'classic';
 const otherLabel=otherTier==='royal'?'Premium':'Free';
 useEffect(()=>{
  if(!page){document.title='Page not found | FindMyInvite';return;}
  setMeta(page.title,page.description,'https://findmyinvite.com/invitations/'+page.slug);
 },[page]);
 if(!page)return <><Header/><main className="editor-shell"><h1>Page not found</h1><p className="muted">This invitation landing page is not available.</p><Button href="/templates">Browse templates</Button></main><Footer/></>;
 return <><Header/><main className="di-main di-occasion" id="main-content">
 <header className="di-library-head"><p className="di-eyebrow">Invitation collection</p><h1>{page.h1}</h1><p>{page.hero}</p><div className="di-occasion-actions"><a className="di-button" href={ctaHref(page)}>{page.cta} ↗</a><a className="di-button di-secondary" href={demoHref(page)}>Preview invitation ↗</a></div></header>
 <div className="di-occasion-grid">{[["Made for your occasion",page.includes],["For your celebration",page.who],["Make it yours",page.how]].map(([title,copy])=><section key={title}><h2>{title}</h2><p>{copy}</p></section>)}</div>
 <section className="di-faq"><h2>Frequently asked questions</h2>{page.faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
 <section className="di-related"><h2>Keep exploring</h2>{page.related.map(href=><a className="di-button di-secondary" key={href} href={href}>{relatedLabel(href)} ↗</a>)}</section>
 </main><Footer/></>;
}
