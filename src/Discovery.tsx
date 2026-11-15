import VideoCollection from './video/VideoCollection';
import AnalyticsPreference from './AnalyticsPreference';
import {previewLanguage,savePreviewLanguage,previewHref} from './templates/preview-language';
import WebsiteCard from './WebsiteCard';
import {useVideoCatalog} from './video/catalog';
import {VIDEO_PRICE_PAISE} from '../shared/video-pricing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import {lazy,Suspense,useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowUpRight,Bookmark,Check,ChevronDown,Globe,Heart,Menu,Search,User,Video,X} from 'lucide-react';
import AuthModal from './AuthModal';
import {readSession,afterAuthPath,clearSession} from './auth-session';
import {useCatalog} from './catalog';
import {shopCard,formatRupees,traditions,settings} from './shop';
import trendingSearches from '../public/assets/trending/sources.json';
import {discoveryHref,filterVideoCatalog,matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';
import './discovery.css';
import {DiscoveryFilters} from './DiscoveryFilters';
import {BrowseCategories,PinsPromotion} from './DiscoverySections';

const TemplateMusic=lazy(()=>import('./templates/TemplateMusic'));
const library='/templates';
const categories=[['christian','Christian'],['hindu','Hindu'],['muslim','Islam'],['pixar','Pixar 3D'],['palace','Royal'],['toon','Toon'],['save-the-date','Save the Date']] as const;
function imageUrl(value?:string){return value?(/^(https?:|\/)/.test(value)?value:'/assets/'+value):'';}
function searchHref(q:string){return discoveryHref(q);}
export function DiscoveryHeader(){
 const [menu,setMenu]=useState(false),[auth,setAuth]=useState<'signin'|'signup'|null>(null),[session,setSession]=useState(readSession);
 useEffect(()=>{const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';const sync=()=>{setSession(readSession());const next=sessionStorage.getItem('fmi-after-auth');if(readSession()&&next){sessionStorage.removeItem('fmi-after-auth');location.assign(next);}};const open=(e:Event)=>setAuth((e as CustomEvent).detail?.mode==='signup'?'signup':'signin');window.addEventListener('fmi-auth-changed',sync);window.addEventListener('fmi-auth-open',open);return()=>{window.removeEventListener('fmi-auth-changed',sync);window.removeEventListener('fmi-auth-open',open);};},[]);
 const accountLabel=session?'My Invitations':'Sign in';
 function openAccount(){setMenu(false);if(session)location.assign('/dashboard');else{afterAuthPath('/dashboard');setAuth('signin');}}
 return <>
  <a className="di-skip" href="#main-content">Skip to content</a>
  <header className="di-header">
   <div className="di-header-inner">
    <a className="di-brand" href="/" aria-label="FindMyInvite home"><Heart size={25} fill="currentColor"/>FindMyInvite</a>
    {location.pathname!=='/'&&<form className="di-nav-search" action={library} role="search"><Search size={17}/><input name="q" aria-label="Search invitations" placeholder="Search a design, occasion or style"/></form>}
    <nav aria-label="Main navigation">
     <a href="/templates?kind=website">Website Templates</a><a href="/templates?kind=video">Video Templates</a>
     <button type="button" aria-label={accountLabel} className="di-account" onClick={openAccount}><User size={17}/><span>{accountLabel}</span></button>
     {session&&<button type="button" className="di-signout" onClick={()=>{clearSession();setSession(null);}}>Sign out</button>}
     <button type="button" className="di-menu-toggle" aria-expanded={menu} aria-controls="di-mobile-menu" aria-label="Menu" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
    </nav>
   </div>
   {menu&&<nav id="di-mobile-menu" className="di-mobile-menu" aria-label="Mobile navigation"><a href="/templates?kind=website">Website Templates</a><a href="/templates?kind=video">Video Templates</a><button type="button" className="di-account" onClick={openAccount}>{accountLabel}</button>{session&&<button type="button" className="di-signout" onClick={()=>{clearSession();setSession(null);setMenu(false);}}>Sign out</button>}</nav>}
  </header>
  {auth&&<AuthModal mode={auth} onClose={()=>setAuth(null)}/>}
 </>;
}
export function DiscoveryFooter(){return <footer className="di-footer"><p className="di-footer-tag">Find your invitation. Make it yours.</p><div className="di-footer-grid"><section><h2>Invitation libraries</h2><a href={library}>Wedding websites</a><a href="/templates?kind=video">Invitation videos</a><a href={searchHref('Save the Date')}>Save the date</a><a href="/templates?collection=premium">Premium invitations</a><a href={library}>Your celebration starts here. ↗</a></section><section><h2>Top categories</h2>{categories.map(([id,label])=><a key={id} href={discoveryHref(id)}>{label}</a>)}</section><section><h2>Your invitations</h2><a href="/saved">My Pins</a><a href="/dashboard">My invitations</a><a href="/pricing">Pricing</a><a href="/contact">Custom invitation</a></section><section><h2>FindMyInvite</h2><a href="/about">About us</a><a href="/blog">Invitation journal</a><a href="/contact">Contact us</a><a href="/shipping-policy">Digital delivery</a></section></div><div className="di-footer-bottom"><span>© {new Date().getFullYear()} FindMyInvite</span><nav aria-label="Legal"><AnalyticsPreference/><a href="/privacy-policy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refunds</a></nav></div></footer>;}
function usePins(){const [pins,setPins]=useState<string[]>(()=>{try{const p=JSON.parse(localStorage.getItem('fmi-discovery-pins')||'[]');return Array.isArray(p)?p.filter(x=>typeof x==='string'):[];}catch{return [];}});const [error,setError]=useState('');function toggle(id:string){const next=pins.includes(id)?pins.filter(p=>p!==id):[...pins,id];try{localStorage.setItem('fmi-discovery-pins',JSON.stringify(next));setPins(next);setError('');}catch{setError('This browser could not save your pin. Check your storage settings.');}}return {pins,toggle,error};}
export default function Discovery(){
 const {items,loading,error}=useCatalog();const params=new URLSearchParams(location.search);const home=location.pathname==='/';const saved=location.pathname==='/saved';
 const [query,setQuery]=useState(params.get('q')||''),[kind,setKind]=useState(params.get('kind')||'all'),[tradition,setTradition]=useState(params.get('tradition')||'all'),[setting,setSetting]=useState(params.get('setting')||'all'),[collection,setCollection]=useState(params.get('collection')||'all'),[sort,setSort]=useState('default'),[limit,setLimit]=useState(30);
 const [language,setLanguage]=useState(previewLanguage);
 const changeLanguage=(value:string)=>{setLanguage(value);savePreviewLanguage(value);};
 const {pins,toggle,error:pinError}=usePins();const cards=useMemo(()=>items.map(shopCard),[items]);const product=cards.find(c=>c.id===params.get('product'));
 const visible=useMemo(()=>{const result=cards.filter(c=>(kind==='all'||c.kind===kind)&&(tradition==='all'||matchesDiscoverySearch(c,tradition))&&(setting==='all'||matchesDiscoverySearch(c,setting))&&(collection==='all'||c.tier===collection)&&(!saved||pins.includes(c.id))&&matchesDiscoverySearch(c,query));return sort==='price'?result.sort((a,b)=>a.pricePaise-b.pricePaise):sort==='name'?result.sort((a,b)=>a.name.localeCompare(b.name)):result;},[cards,kind,tradition,setting,collection,saved,pins,query,sort]);
 const videoCatalog=useVideoCatalog();
 const visibleVideos=filterVideoCatalog(videoCatalog.entries,{query,tradition,setting,collection,sort});
 const featured=home&&!query&&kind==='all'&&tradition==='all'&&setting==='all'&&collection==='all';
 const showVideos=!saved&&kind!=='website'&&!featured;
 const resultCount=visible.length+(showVideos?visibleVideos.length:0);
 function clearQuery(){setQuery('');const url=new URL(location.href);url.searchParams.delete('q');history.replaceState(null,'',url);}
 function search(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const value=String(new FormData(e.currentTarget).get('q')||'').trim();
  setQuery(value);setKind('all');setTradition('all');setSetting('all');setCollection('all');setLimit(30);
  const url=new URL(location.href);for(const key of ['kind','tradition','setting','collection'])url.searchParams.delete(key);
  value?url.searchParams.set('q',value):url.searchParams.delete('q');history.replaceState(null,'',url);
  document.getElementById('di-results')?.scrollIntoView({behavior:'smooth'});
 }
 useEffect(()=>{window.dispatchEvent(new Event('catalog-stop-all'));},[query,kind,tradition,setting,collection,sort,language]);
 const link=(id:string)=>library+'?product='+encodeURIComponent(id)+'&lang='+language;
 function card(c:ReturnType<typeof shopCard>){
  const useHref=c.templateVersionId?'/personalise?'+new URLSearchParams({version:c.templateVersionId,lang:language}):'/form?'+new URLSearchParams({template:c.id,type:params.get('type')||'wedding',new:'1'});
  return <WebsiteCard key={c.id} card={c} language={language} useHref={useHref} detailsHref={link(c.id)}/>;
 }
 return <div className="di-app"><DiscoveryHeader/><main id="main-content" className="di-main">{product?<>{product.templateVersionId&&<Suspense fallback={null}><TemplateMusic key={product.templateVersionId} version={product.templateVersionId}/></Suspense>}<a className="di-back" href={library}>← Invitation library</a><section className="di-detail"><div className="di-detail-media">{product.templateVersionId?<a className="di-detail-preview" href={previewHref(product.templateVersionId,language)} aria-label={'Preview '+product.name}><img src={imageUrl(product.image)} alt={product.name+' invitation design'} width={400} height={560} decoding="async"/></a>:product.kind==='video'&&product.video?<video src={imageUrl(product.video)} poster={imageUrl(product.image)} controls playsInline/>:<img src={imageUrl(product.image)} alt={product.name}/>}</div><div className="di-detail-copy"><p className="di-eyebrow">{product.kind==='video'?'Invitation video':'Wedding website'}</p><h1>{product.name}</h1><p>{product.description}</p><div className="di-tags">{product.tradition&&<span>{traditions.find(([id])=>id===product.tradition)?.[1]||product.tradition}</span>}{product.setting&&<span>{settings.find(([id])=>id===product.setting)?.[1]||product.setting}</span>}<span>{product.tier}</span></div><h2>{formatRupees(product.pricePaise)} <small>+ applicable tax · six months</small></h2><a className="di-button" href={product.templateVersionId?'/personalise?version='+product.templateVersionId+'&lang='+language:'/form?template='+encodeURIComponent(product.id)+'&type='+encodeURIComponent(params.get('type')||'wedding')+'&new=1'}>Personalise this invitation <ArrowUpRight size={18}/></a><a className="di-button di-secondary" href={product.templateVersionId?previewHref(product.templateVersionId,language):'/invite/demo?template='+encodeURIComponent(product.id)}>Preview invitation <ArrowUpRight size={18}/></a><button className="di-button di-secondary" onClick={()=>toggle(product.id)}><Bookmark size={16}/>{pins.includes(product.id)?'Remove from My Pins':'Save to My Pins'}</button><p className="di-muted">Add your names and event details. Review your invitation before checkout.</p></div></section><h2 className="di-section-title">More invitations to explore</h2><div className="di-masonry">{cards.filter(c=>c.id!==product.id).slice(0,12).map(card)}</div></>:<>{home?<><section className="di-hero"><ol className="di-steps"><li><b>1.</b> Find an invitation for your celebration.</li><li><b>2.</b> Preview the designs you love.</li><li><b>3.</b> Personalise it and share with your guests.</li></ol><h1>Find your invitation.<br/><em>Make it yours.</em></h1><p>For weddings, milestones and everything worth celebrating. Start with a design you love and make it your own in minutes.</p><form className="di-search" role="search" onSubmit={search}><Search size={22}/><input name="q" aria-label="Search designs" placeholder="Search a design, occasion or style" defaultValue={query}/><button aria-label="Search invitations"><Search size={21}/></button></form><div className="di-platforms"><span>Made for your celebration</span><b><Heart size={18}/> Weddings</b><b><Globe size={18}/> Websites</b><b><Video size={18}/> Videos</b></div></section><section className="di-trending"><h2>Trending searches</h2><div>{trendingSearches.map(({label,image})=><a href={searchHref(label)} key={label}><img src={image} alt="" width={34} height={34} decoding="async"/><span>{label}</span></a>)}</div></section><BrowseCategories cards={cards} loading={loading}/><PinsPromotion/></>:<header className="di-library-head"><p className="di-eyebrow">{saved?'Your collection':'Invitation library'}</p><h1>{saved?'Your favourite invitations.':tradition!=='all'?(traditions.find(([v])=>v===tradition)?.[1]||tradition)+' invitations.':kind==='video'?'Find your invitation video.':'Find a design. Make it yours.'}</h1><p>{saved?'Saved on this browser, ready when you are.':'Explore designs for your occasion. Choose a favourite and personalise the details.'}</p><form className="di-search" onSubmit={search} role="search"><Search size={20}/><input key={query} name="q" defaultValue={query} aria-label="Search designs" placeholder="Search invitations"/><button aria-label="Search"><Search size={20}/></button></form></header>}{featured&&<VideoCollection limit={4}/>}
 <section id="di-results">
  {featured&&<h2 className="di-collection-title">Invitation Websites</h2>}
  <DiscoveryFilters kind={kind} tradition={tradition} setting={setting} collection={collection} sort={sort} language={language} onLanguage={changeLanguage} count={resultCount} onKind={v=>{setKind(v);setLimit(30);}} onTradition={v=>{setTradition(v);setLimit(30);}} onSetting={v=>{setSetting(v);setLimit(30);}} onCollection={v=>{setCollection(v);setLimit(30);}} onSort={setSort}/>
  {query&&<p>Results for “{query}” <button type="button" onClick={clearQuery}>Clear search</button></p>}
  {showVideos&&<VideoCollection query={query} tradition={tradition} setting={setting} collection={collection} sort={sort}/>}
  {kind!=='video'&&<>
   {!featured&&<h2 className="di-collection-title">Invitation Websites</h2>}
   {error&&<p role="status" className="di-notice">{error}</p>}
   {pinError&&<p role="alert">{pinError}</p>}
   {loading&&!cards.length?<p role="status">Loading invitations…</p>:!visible.length?<div className="di-empty"><Globe size={32}/><h2>{saved?'Your saved invitations appear here.':'No matching websites yet.'}</h2><p>{saved?'Your previously saved designs are kept on this browser.':'Try another style or clear your filters.'}</p><a className="di-button" href={library}>Explore invitations</a></div>:<div className="di-masonry">{visible.slice(0,limit).map(card)}</div>}
   {visible.length>limit&&<button className="di-button di-load" onClick={()=>setLimit(limit+30)}>Load more invitations <ChevronDown size={17}/></button>}
  </>}
 </section></>}</main><DiscoveryFooter/></div>;
}
export function DiscoveryPricing(){const plans=[{title:'Wedding website',price:INVITATION_BASE_PAISE,copy:'One invitation, one celebration. Choose any approved design.',href:'/templates?kind=website',features:[`${formatRupees(INVITATION_BASE_PAISE)} plus applicable tax; total shown before payment`,'Six calendar months from first publication','Edit names, photos and events; your purchased design stays locked',`Renew for ${formatRupees(INVITATION_BASE_PAISE)} plus tax for another six months`]},{title:'Invitation video',price:VIDEO_PRICE_PAISE,total:false,copy:'Personalise a design and download your invitation as an MP4.',href:'/templates?kind=video',features:[`${formatRupees(VIDEO_PRICE_PAISE)} plus applicable tax; total shown before payment`,'Personalise names, event details and supported photos','Edits and updated exports included','Download each completed MP4 within seven days']},{title:'Custom',price:0,copy:'Bespoke design is quoted separately.',href:'/contact',features:['Discuss your design brief','Choose your style and format','Confirm scope and price with our team']}];return <div className="di-app"><DiscoveryHeader/><main className="di-main di-pricing" id="main-content"><header className="di-library-head"><p className="di-eyebrow">Pricing</p><h1>A beautiful beginning.<br/>One simple price.</h1><p>Browse freely. Choose your design and personalise it before checkout.</p></header><div className="di-plans">{plans.map(p=><article key={p.title}><h2>{p.title}</h2><h3>{p.price?formatRupees(p.price):'Let’s talk'} <small>{p.price?(p.total?'total':'+ applicable tax'):''}</small></h3><p>{p.copy}</p><a className="di-button" href={p.href}>{p.price?'Explore designs':'Contact us'} <ArrowUpRight size={16}/></a><ul>{p.features.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul></article>)}</div><p className="di-muted">Paid checkout is processed through Razorpay. Your final price is shown before payment.</p><section className="di-faq"><h2>A few things worth knowing.</h2><details><summary>Can I preview an invitation?</summary><p>Yes. Open a design and select Preview invitation.</p></details><details><summary>How do I personalise a design?</summary><p>Choose Personalise this invitation, then enter your names and event details in the editor.</p></details><details><summary>Where are my saved designs?</summary><p>My Pins keeps favourites on this browser. Your created invitations are available through your account.</p></details></section></main><DiscoveryFooter/></div>;}
