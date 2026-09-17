import {useEffect} from 'react';
import {Header,Footer,Button,Heading,Icon} from './components';
import {occasionBySlug,relatedLabel,templatesHref} from './occasion-landings';
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
 useEffect(()=>{
  if(!page){document.title='Page not found | FindMyInvite';return;}
  setMeta(page.title,page.description,'https://findmyinvite.com/invitations/'+page.slug);
 },[page]);
 if(!page)return <><Header/><main className="editor-shell"><h1>Page not found</h1><p className="muted">This invitation landing page is not available.</p><Button href="/templates">Browse templates</Button></main><Footer/></>;
 return <><Header/><main className="fmi-storefront occasion-lp">
  <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden hero">
   <picture>
    <source media="(max-width:640px)" srcSet="/assets/Bg_Mobile.jpg"/>
    <source media="(max-width:1024px)" srcSet="/assets/3514d4feddd8273b.jpg"/>
    <img src="/assets/Bg_Desktop.jpg" onError={e=>{e.currentTarget.src='/assets/3514d4feddd8273b.jpg'}} alt="" className="hero-art"/>
   </picture>
   <div className="hero-fade"/>
   <div className="container mx-auto px-6 text-center relative z-10">
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
     <Icon name={page.tier==='royal'?'crown':'sparkles'} size={14}/>
     <span className="text-xs font-medium text-primary tracking-wide uppercase">FindMyInvite {page.tier==='royal'?'Royal':'Classic'}</span>
    </div>
    <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]">{page.h1}</h1>
    <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">{page.hero}</p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
     <Button href={templatesHref(page.tier)} className="px-10">{page.cta} <Icon name="arrow" size={16}/></Button>
     <Button href={'/invite/demo?template='+(page.tier==='royal'?'royal-prestige':'emerald-noir')+'&type=wedding'} outline>View live demo</Button>
    </div>
    <p className="text-xs text-muted-foreground mt-6">Personalise, preview, and share the public link on WhatsApp. Guests open it with no account.</p>
   </div>
  </section>
  <section className="py-16 md:py-24"><div className="container mx-auto px-6 max-w-3xl">
   <Heading eyebrow={page.name} title={'What a '+page.name+' invitation webpage includes'}/>
   <p className="text-muted-foreground leading-relaxed">{page.includes}</p>
  </div></section>
  <section className="py-16 md:py-24 cream-bg"><div className="container mx-auto px-6 max-w-3xl">
   <Heading eyebrow="Made for hosts" title={'Who this '+page.name+' invitation is for'}/>
   <p className="text-muted-foreground leading-relaxed">{page.who}</p>
  </div></section>
  <section className="py-16 md:py-24"><div className="container mx-auto px-6 max-w-3xl">
   <Heading eyebrow="Simple process" title="How to personalise, preview, and share on WhatsApp"/>
   <p className="text-muted-foreground leading-relaxed mb-8">{page.how}</p>
   <div className="switch-note">
    <p>{page.switchCopy}</p>
    <Button href={templatesHref(otherTier)} outline>Browse {otherTier==='royal'?'Royal':'Classic'} templates</Button>
   </div>
  </div></section>
  <section className="py-16 md:py-24 cream-bg"><div className="container mx-auto px-6 max-w-3xl text-center">
   <Heading eyebrow="Related occasions" title="Keep planning the wedding"/>
   <div className="related-links">{page.related.map(href=><a className="occasion-chip" href={href} key={href}>{relatedLabel(href)}</a>)}</div>
  </div></section>
  <section className="py-16 md:py-24"><div className="container mx-auto px-6">
   <Heading eyebrow="Got questions?" title="Frequently asked questions"/>
   <div className="max-w-2xl mx-auto">{page.faqs.map(([q,a])=><details className="faq" key={q}><summary>{q}<Icon name="down" size={16}/></summary><p>{a}</p></details>)}</div>
  </div></section>
  <section className="py-24 md:py-32 text-center cta"><div className="container mx-auto px-6">
   <Icon name="sparkles" size={30} className="text-primary mx-auto mb-6"/>
   <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">{page.cta}</h2>
   <p className="text-muted-foreground mb-8">Start from {page.tier==='royal'?'Royal':'Classic'} templates, then switch collections if you want a different look — without a second landing URL.</p>
   <Button href={templatesHref(page.tier)}>{page.cta} <Icon name="arrow" size={16}/></Button>
  </div></section>
 </main><Footer/></>;
}
