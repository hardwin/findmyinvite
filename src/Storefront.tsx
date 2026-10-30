import {useMemo,useState} from 'react';
import {Search,LayoutGrid,Globe,Clapperboard,ClipboardList} from 'lucide-react';
import {occasions,galleryTiers,galleryTierLabels,normalizeGalleryCollection,type GalleryTier} from './data';
import {useCatalog} from './catalog';
import ShopDeskBar from './shop-desk';
import ShopDeskFoot from './shop-foot';
import {
 defaultShopFilters,filterShop,formatRupees,occasionAisles,settings,shopCard,shopKinds,traditions,listingTitle,
 type ShopAisle,type ShopKind,type Tradition,type Setting,type ShopTemplate
} from './shop';
import './shop.css';

function kindFromQuery():ShopKind{
 return new URLSearchParams(location.search).get('kind')==='video'?'video':'website';
}

function aisleFromQuery():ShopAisle|'home'{
 const aisle=new URLSearchParams(location.search).get('aisle');
 if(aisle==='kind'||aisle==='occasion'||aisle==='tradition'||aisle==='collection'||aisle==='setting')return aisle;
 if(location.pathname.startsWith('/templates'))return 'kind';
 return 'home';
}

function thumbs(items:ShopTemplate[]){
 return items.map(shopCard).filter(item=>item.image).map(item=>'/assets/'+item.image);
}

function thumb(items:ShopTemplate[],test:(item:ReturnType<typeof shopCard>)=>boolean,fallback=0){
 const hit=items.map(shopCard).find(test);
 if(hit?.image)return '/assets/'+hit.image;
 return thumbs(items)[fallback]||'';
}

const featuredIds=['royal-heritage-8','royal-heritage-9','royal-prestige-2','royal-prestige-4','royal-prestige-5'];
function recency(id:string){
 const prestige=/royal-prestige-(\d+)/.exec(id);
 if(prestige)return 300+Number(prestige[1]);
 const heritage=/royal-heritage-(\d+)/.exec(id);
 if(heritage)return 200+Number(heritage[1]);
 return 0;
}

function listingHref(params:Record<string,string>){
 const q=new URLSearchParams();
 Object.entries(params).forEach(([k,v])=>{if(v)q.set(k,v);});
 const search=q.toString();
 return '/templates'+(search?'?'+search:'');
}

function ShopNav({active}:{active:'home'|'website'|'video'|'form'}){
 return <nav className="im-nav" aria-label="Shop">
  <a href="/" className={active==='home'?'on':''}><LayoutGrid size={22} strokeWidth={active==='home'?2.4:1.7}/><span>Categories</span></a>
  <a href={listingHref({aisle:'kind',kind:'website'})} className={active==='website'?'on':''}><Globe size={22} strokeWidth={active==='website'?2.4:1.7}/><span>Websites</span></a>
  <a href={listingHref({aisle:'kind',kind:'video'})} className={active==='video'?'on':''}><Clapperboard size={22} strokeWidth={active==='video'?2.4:1.7}/><span>Videos</span></a>
  <a href="/form" className={active==='form'?'on':''}><ClipboardList size={22} strokeWidth={active==='form'?2.4:1.7}/><span>Cart</span></a>
 </nav>;
}

export default function Storefront(){
 const {items,loading,error}=useCatalog();
 const q=new URLSearchParams(location.search);
 const aisle=aisleFromQuery();
 const listAisle:ShopAisle=aisle==='home'?'kind':aisle;
 const productId=q.get('product')||'';
 const [searchOpen,setSearchOpen]=useState(Boolean(q.get('q')));
 const [filters,setFilters]=useState(()=>({
  ...defaultShopFilters(kindFromQuery()),
  collection:(q.get('collection')?normalizeGalleryCollection(q.get('collection')):'all') as GalleryTier|'all',
  tradition:(['christian','hindu','muslim','interfaith'].includes(q.get('tradition')||'')?q.get('tradition'):'all') as Tradition|'all',
  setting:(['church','garden','temple','palace','beach','minimal'].includes(q.get('setting')||'')?q.get('setting'):'all') as Setting|'all',
  type:occasions.some(([id])=>id===q.get('type'))?q.get('type')!:'wedding',
  query:q.get('q')||''
 }));
 const visible=useMemo(()=>filterShop(items,filters),[items,filters]);
 const product=visible.find(item=>item.id===productId)||items.map(shopCard).find(item=>item.id===productId);
 function sync(next:typeof filters,nextAisle:ShopAisle){
  location.assign(listingHref({
   aisle:nextAisle,
   kind:next.kind,
   type:next.type,
   tradition:next.tradition==='all'?'':next.tradition,
   collection:next.collection==='all'?'':next.collection,
   setting:next.setting==='all'?'':next.setting,
   q:next.query
  }));
 }
 const formHref=(id:string)=>`/form?template=${encodeURIComponent(id)}&type=${encodeURIComponent(filters.type)}&new=1`;
 const productHref=(id:string)=>listingHref({
  aisle:listAisle,
  kind:filters.kind,
  type:filters.type,
  tradition:filters.tradition==='all'?'':filters.tradition,
  collection:filters.collection==='all'?'':filters.collection,
  setting:filters.setting==='all'?'':filters.setting,
  product:id
 });
 const pics=thumbs(items);
 const stores=[
  {href:listingHref({aisle:'kind',kind:'website'}),label:'Wedding Websites',image:thumb(items,item=>item.kind==='website',0),tone:'sky'},
  {href:listingHref({aisle:'kind',kind:'video'}),label:'Invitation Videos',image:thumb(items,item=>item.kind==='video',1),tone:'sand'},
  {href:listingHref({aisle:'tradition',kind:'website',tradition:'christian',type:'wedding'}),label:'Christian',image:thumb(items,item=>item.tradition==='christian',2),tone:'gold'},
  {href:listingHref({aisle:'tradition',kind:'website',tradition:'hindu',type:'wedding'}),label:'Hindu',image:thumb(items,item=>item.tradition==='hindu',3),tone:'mint'},
  {href:listingHref({aisle:'collection',kind:'website',collection:'premium',type:'wedding'}),label:'Premium',image:thumb(items,item=>item.tier==='premium',4),tone:'lilac'}
 ];
 const deskCats=[
  {label:'Christian',href:listingHref({aisle:'tradition',kind:'website',tradition:'christian',type:'wedding'}),tone:'rose',image:'/assets/shop-cat-christian.png'},
  {label:'Hindu',href:listingHref({aisle:'tradition',kind:'website',tradition:'hindu',type:'wedding'}),tone:'sky',image:'/assets/shop-cat-hindu.png'},
  {label:'Islam',href:listingHref({aisle:'tradition',kind:'website',tradition:'muslim',type:'wedding'}),tone:'peach',image:'/assets/shop-cat-islam.png'},
  {label:'Save the Date',href:listingHref({aisle:'kind',kind:'website',q:'Save the Date'}),tone:'gold',image:'/assets/shop-cat-save-the-date.png'},
  {label:'Premium',href:listingHref({aisle:'collection',kind:'website',collection:'premium',type:'wedding'}),tone:'pink',image:'/assets/shop-cat-premium.png'},
  {label:'Toon',href:listingHref({aisle:'kind',kind:'website',q:'Toon'}),tone:'sky',image:'/assets/shop-cat-toon.png'},
  {label:'Pixar 3D',href:listingHref({aisle:'kind',kind:'website',q:'Pixar'}),tone:'peach',image:'/assets/shop-cat-pixar.png'}
 ];
 const websites=useMemo(()=>filterShop(items,{...defaultShopFilters('website'),query:''}),[items]);
 const videos=useMemo(()=>filterShop(items,{...defaultShopFilters('video'),query:''}),[items]);
 const bestsellers=useMemo(()=>{
  const cards=websites.filter(item=>item.image);
  const picked=featuredIds.map(id=>cards.find(item=>item.id===id)).filter((item):item is typeof cards[number]=>Boolean(item));
  return [...picked,...cards.filter(item=>!featuredIds.includes(item.id))].slice(0,5);
 },[websites]);
 const arrivals=useMemo(()=>{
  const used=new Set(bestsellers.map(item=>item.id));
  return websites.filter(item=>item.image&&!used.has(item.id)).sort((a,b)=>{
   const newA=a.badge==='New'?1:0;
   const newB=b.badge==='New'?1:0;
   if(newA!==newB)return newB-newA;
   return recency(b.id)-recency(a.id);
  }).slice(0,5);
 },[websites,bestsellers]);
 const whatsappHref='https://wa.me/916362260992?text='+encodeURIComponent('Hi, I want a custom video or invitation.');
 const promos=[
  {title:'Wedding Websites',text:'Do It Yourself',price:'Rs.199',href:stores[0].href,image:'/assets/shop-promo-wedding-websites.png',cta:'Create Now',diy:true},
  {title:'e-Invite Videos',text:'Church, garden and reception films.',href:stores[1].href,image:'/assets/shop-promo-invite-videos.png',cta:'SHOP NOW',video:true},
  {title:'Custom Video/Invitation',text:'Contact Us',href:whatsappHref,image:stores[4].image,cta:'WhatsApp',whatsapp:true}
 ];
 const navActive=aisle==='home'?'home':filters.kind==='video'?'video':'website';
 function deskStrip(list:ReturnType<typeof filterShop>){
  return <div className="im-desk-strip">
   {list.slice(0,8).map(item=>
    <article className="im-card" key={item.id}>
     <div className="im-card-media">
      <a className="im-card-art" href={productHref(item.id)} aria-label={item.name}>
       {item.image?<img src={'/assets/'+item.image} alt="" loading="lazy"/>:null}
      </a>
      <a className="im-add" href={formHref(item.id)} aria-label={'Add '+item.name}>+</a>
     </div>
     <p className="im-price">{formatRupees(item.pricePaise)}</p>
     <h2>{item.name}</h2>
    </article>
   )}
  </div>;
 }
 function featGrid(list:ReturnType<typeof filterShop>){
  return <div className="im-feat-grid">
   {list.filter(item=>item.image).slice(0,5).map(item=>{
    const off=item.pricePaise<149900?Math.round((1-item.pricePaise/149900)*100):0;
    return <article className="im-feat-card" key={item.id}>
     <div className="im-feat-media">
      <a href={productHref(item.id)} aria-label={item.name}>
       <img src={'/assets/'+item.image} alt="" loading="lazy"/>
      </a>
      {off>0?<span className="im-feat-sale">{off}% off</span>:null}
     </div>
     <a href={productHref(item.id)}>
      <h3>{item.name}</h3>
      <p className="im-feat-price"><b>{formatRupees(item.pricePaise)}</b>{off>0?<s>{formatRupees(149900)}</s>:null}</p>
     </a>
    </article>;
   })}
  </div>;
 }

 if(aisle==='home')return <main className="im-shop">
  <ShopDeskBar query={filters.query} occasion={filters.type}/>
  <header className="im-top im-phone">
   <h1>Categories</h1>
   <a className="im-icon" href={listingHref({aisle:'kind',kind:'website'})} aria-label="Search"><Search size={22} strokeWidth={1.8}/></a>
  </header>
  <section className="im-desk-hero" aria-label="Offers">
   {promos.map(promo=>
    <a className={'im-desk-offer'+('diy' in promo&&promo.diy?' im-diy':'')+('video' in promo&&promo.video?' im-vid':'')} key={promo.title} href={promo.href} {...(promo.whatsapp?{target:'_blank',rel:'noopener noreferrer'}:{})}>
     {promo.image?<img src={promo.image} alt=""/>:null}
     {'price' in promo&&promo.price?<i className="im-offer-rs">{promo.price}</i>:null}
     <span>
      <b>{promo.title}</b>
      <em>{promo.text}</em>
      <strong className={promo.whatsapp?'im-wa':undefined}>{promo.cta}</strong>
     </span>
    </a>
   )}
  </section>
  <nav className="im-desk-cats" aria-label="Shop by store">
   {deskCats.map(cat=>
    <a className={'im-desk-cat '+cat.tone} key={cat.label} href={cat.href}>
     {cat.image?<img src={cat.image} alt=""/>:null}
     <span>
      <b>{cat.label}</b>
      <em>Shop now</em>
     </span>
    </a>
   )}
  </nav>
  {([
   {eyebrow:'FEATURED COLLECTION',lead:'Best ',ital:'Sellers',href:listingHref({aisle:'collection',kind:'website',collection:'premium',type:'wedding'}),list:bestsellers,band:'im-band-surface'},
   {eyebrow:'JUST IN',lead:'New ',ital:'Arrivals',href:listingHref({aisle:'kind',kind:'website'}),list:arrivals,band:'im-band-dark'},
   {lead:'Wedding ',ital:'Websites',href:listingHref({aisle:'kind',kind:'website'}),list:websites,band:'im-band-light'},
   {lead:'Invitation ',ital:'Videos',href:listingHref({aisle:'kind',kind:'video'}),list:videos,band:'im-band-accent'}
  ] as const).map(row=>
   <section className={'im-desk-row im-feat '+row.band} key={row.ital}>
    <header>
     <div>
      {'eyebrow' in row&&row.eyebrow?<p>{row.eyebrow}</p>:null}
      <h2>{row.lead}<em>{row.ital}</em></h2>
     </div>
     <a href={row.href}>View all</a>
    </header>
    {featGrid(row.list)}
   </section>
  )}
  <ShopDeskFoot/>
  <section className="im-stores im-phone">
   <h2>Shop by store</h2>
   <div className="im-stores-row">
    {stores.map(store=>
     <a className={'im-store '+store.tone} key={store.label} href={store.href}>
      <span className="im-store-art">{store.image?<img src={store.image} alt=""/>:null}</span>
      <span>{store.label}</span>
     </a>
    )}
   </div>
  </section>
  <section className="im-aisle im-phone">
   <h2>Occasions</h2>
   <div className="im-tiles">
    {occasionAisles.map(([id,label],i)=>
     <a key={id} href={listingHref({aisle:'occasion',kind:'website',type:id})}>
      <span className="im-tile">{pics[i]?<img src={pics[i]} alt=""/>:null}</span>
      <b>{label}</b>
     </a>
    )}
   </div>
  </section>
  <section className="im-aisle im-phone">
   <h2>Traditions</h2>
   <div className="im-tiles">
    {traditions.map(([id,label],i)=>
     <a key={id} href={listingHref({aisle:'tradition',kind:'website',tradition:id,type:'wedding'})}>
      <span className="im-tile">{thumb(items,item=>item.tradition===id,i)?<img src={thumb(items,item=>item.tradition===id,i)} alt=""/>:null}</span>
      <b>{label}</b>
     </a>
    )}
   </div>
  </section>
  <section className="im-aisle im-phone">
   <h2>Collections</h2>
   <div className="im-tiles">
    {galleryTiers.map((tier,i)=>
     <a key={tier} href={listingHref({aisle:'collection',kind:'website',collection:tier,type:'wedding'})}>
      <span className="im-tile">{thumb(items,item=>item.tier===tier,i)?<img src={thumb(items,item=>item.tier===tier,i)} alt=""/>:null}</span>
      <b>{galleryTierLabels[tier]}</b>
     </a>
    )}
   </div>
  </section>
  <section className="im-aisle im-phone">
   <h2>Settings</h2>
   <div className="im-tiles">
    {settings.map(([id,label],i)=>
     <a key={id} href={listingHref({aisle:'setting',kind:'website',setting:id,type:'wedding'})}>
      <span className="im-tile">{thumb(items,item=>item.setting===id,i)?<img src={thumb(items,item=>item.setting===id,i)} alt=""/>:null}</span>
      <b>{label}</b>
     </a>
    )}
   </div>
  </section>
  <p className="im-banner im-phone">E-invites from {formatRupees(119900)}</p>
  <ShopNav active="home"/>
 </main>;

 if(product)return <main className="im-shop">
  <ShopDeskBar query={filters.query} occasion={filters.type}/>
  <h1 className="im-desk-page">{product.name}</h1>
  <header className="im-top im-list-top im-phone">
   <a className="im-back" href={listingHref({aisle:listAisle,kind:filters.kind,type:filters.type})} aria-label="Back">‹</a>
   <h1>{product.name}</h1>
   <span className="im-icon" aria-hidden="true"/>
  </header>
  <section className="im-pdp">
   <div className="im-pdp-art">
    <span className="on">
     {product.image?<img src={'/assets/'+product.image} alt=""/>:null}
     <b>{product.name}</b>
     <em>{formatRupees(product.pricePaise)}</em>
    </span>
    <a href={formHref(product.id)}>
     {product.image?<img className="fmi-wm" src={'/assets/'+product.image} alt=""/>:null}
     <b>Preview</b>
     <em>Watermarked</em>
    </a>
   </div>
   <div className="im-trust"><span>Pay then live</span><span>Copy link</span><span>Share anytime</span></div>
  </section>
  <div className="im-pdp-bar">
   <div className="im-price">{formatRupees(product.pricePaise)}</div>
   <a className="im-cta" href={formHref(product.id)}>ADD</a>
  </div>
 </main>;

 const rail=aisle==='tradition'?traditions.map(([id,label])=>({id,label,img:thumb(items,item=>item.tradition===id),on:filters.tradition===id,go:()=>sync({...filters,tradition:id as Tradition},'tradition')}))
  :aisle==='collection'?galleryTiers.map(tier=>({id:tier,label:galleryTierLabels[tier],img:thumb(items,item=>item.tier===tier),on:filters.collection===tier,go:()=>sync({...filters,collection:tier},'collection')}))
  :aisle==='setting'?settings.map(([id,label])=>({id,label,img:thumb(items,item=>item.setting===id),on:filters.setting===id,go:()=>sync({...filters,setting:id as Setting},'setting')}))
  :aisle==='kind'?shopKinds.map(([id,label])=>({id,label,img:thumb(items,item=>item.kind===id),on:filters.kind===id,go:()=>sync({...defaultShopFilters(id),type:filters.type,query:filters.query},'kind')}))
  :occasionAisles.map(([id,label],i)=>({id,label,img:pics[i],on:filters.type===id,go:()=>sync({...filters,type:id},'occasion')}));

 return <main className="im-shop im-list">
  <ShopDeskBar query={filters.query} occasion={filters.type}/>
  <h1 className="im-desk-page">{listingTitle(filters,listAisle)}</h1>
  <header className="im-top im-list-top im-phone">
   <a className="im-back" href="/" aria-label="Categories">‹</a>
   {searchOpen
    ?<input className="im-search" autoFocus value={filters.query} placeholder="Search e-invites" onChange={e=>setFilters({...filters,query:e.target.value})}/>
    :<h1>{listingTitle(filters,listAisle)}</h1>}
   <button className="im-icon" type="button" aria-label="Search" onClick={()=>setSearchOpen(true)}><Search size={22} strokeWidth={1.8}/></button>
  </header>
  <div className="im-chips">
   <span>Sort By</span>
   {galleryTiers.map(tier=>
    <button key={tier} type="button" className={filters.collection===tier?'on':''} onClick={()=>sync({...filters,collection:filters.collection===tier?'all':tier},listAisle)}>{galleryTierLabels[tier]}</button>
   )}
  </div>
  <div className="im-list-shell">
   <aside className="im-rail" aria-label="Aisle">
    {rail.map(item=>
     <button key={item.id} type="button" aria-current={item.on?'page':undefined} onClick={item.go}>
      {item.img?<img src={item.img} alt=""/>:<span className="im-rail-dot"/>}
      {item.label}
     </button>
    )}
   </aside>
   <section className="im-products">
    {loading&&!items.length&&<p className="im-empty">Loading…</p>}
    {error&&<p className="im-empty" role="status">{error}</p>}
    {!loading&&!error&&!visible.length&&<p className="im-empty">No e-invites here.</p>}
    <div className="im-grid">
     {visible.map(item=>
      <article className="im-card" key={item.id}>
       <div className="im-card-media">
        <a className="im-card-art" href={productHref(item.id)} aria-label={item.name}>
         {item.image?<img src={'/assets/'+item.image} alt="" loading="lazy"/>:null}
        </a>
        <a className="im-add" href={formHref(item.id)} aria-label={'Add '+item.name}>+</a>
       </div>
       <p className="im-price">{formatRupees(item.pricePaise)}<small>{galleryTierLabels[item.tier]}</small></p>
       <h2>{item.name}</h2>
       <p className="im-unit">1 page</p>
      </article>
     )}
    </div>
   </section>
  </div>
  <p className="im-banner im-phone">E-invites from {formatRupees(119900)}</p>
  <ShopDeskFoot/>
  <ShopNav active={navActive}/>
 </main>;
}
