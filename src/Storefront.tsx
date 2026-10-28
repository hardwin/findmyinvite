import {useMemo,useState} from 'react';
import {Header,Footer} from './components';
import {occasions,galleryTiers,galleryTierLabels,normalizeGalleryCollection,type GalleryTier} from './data';
import {useCatalog} from './catalog';
import {
 defaultShopFilters,filterShop,formatRupees,palettes,settings,shopKinds,traditions,
 type ShopKind,type Tradition,type Palette,type Setting
} from './shop';
import './shop.css';
import './storefront3.css';

function kindFromQuery():ShopKind{
 return new URLSearchParams(location.search).get('kind')==='video'?'video':'website';
}

export default function Storefront(){
 const {items,loading,error}=useCatalog();
 const q=new URLSearchParams(location.search);
 const [filters,setFilters]=useState(()=>({
  ...defaultShopFilters(kindFromQuery()),
  collection:(q.get('collection')?normalizeGalleryCollection(q.get('collection')):'all') as GalleryTier|'all',
  type:occasions.some(([id])=>id===q.get('type'))?q.get('type')!:'wedding',
  query:q.get('q')||''
 }));
 const [filtersOpen,setFiltersOpen]=useState(false);
 const visible=useMemo(()=>filterShop(items,filters),[items,filters]);
 function sync(next:typeof filters){
  setFilters(next);
  const params=new URLSearchParams();
  if(next.kind!=='website')params.set('kind',next.kind);
  if(next.collection!=='all')params.set('collection',next.collection);
  if(next.type!=='wedding')params.set('type',next.type);
  if(next.query)params.set('q',next.query);
  const search=params.toString();
  history.replaceState({},'',location.pathname+(search?'?'+search:''));
 }
 const formHref=(id:string)=>`/form?template=${encodeURIComponent(id)}&type=${encodeURIComponent(filters.type)}&new=1`;
 const demoHref=(id:string)=>`/invite/demo?template=${encodeURIComponent(id)}&type=${encodeURIComponent(filters.type)}`;
 return <>
  <Header/>
  <main className="fmi-shop">
   <div className="container mx-auto px-4 md:px-6">
    <div className="fmi-shop-hero">
     <p className="eyebrow">Indian Christian wedding invitations</p>
     <h1>{filters.kind==='website'?'Wedding websites for Holy Matrimony':'Wedding invitation videos'}</h1>
     <p className="lede">{filters.kind==='website'
      ?'Browse church, garden and reception designs. Fill in the bride, groom, ceremony and reception, then Create — your page goes live after payment.'
      :'Cinematic invitation films. Preview a design, then talk to us to make it yours.'}</p>
     <div className="fmi-shop-kinds" role="tablist" aria-label="Invitation product">
      {shopKinds.map(([id,label])=>
       <button key={id} type="button" role="tab" aria-pressed={filters.kind===id} onClick={()=>sync({...defaultShopFilters(id),type:filters.type,query:''})}>{label}</button>
      )}
     </div>
    </div>
    <button className="fmi-button outline small fmi-shop-filters-toggle" type="button" onClick={()=>setFiltersOpen(open=>!open)}>{filtersOpen?'Hide filters':'Filters'}</button>
    <div className="fmi-shop-shell">
     <aside className={'fmi-shop-filters'+(filtersOpen?' open':'')} aria-label="Search filters">
      <h2>Filters</h2>
      <label>Search
       <input value={filters.query} placeholder="Church, ivory, garden…" onChange={e=>sync({...filters,query:e.target.value})}/>
      </label>
      <div className="fmi-shop-filter">
       <span>Occasion</span>
       <select value={filters.type} onChange={e=>sync({...filters,type:e.target.value})}>{occasions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
      </div>
      <div className="fmi-shop-filter">
       <span>Tradition</span>
       <div className="fmi-shop-filter-list">
        <button type="button" aria-pressed={filters.tradition==='all'} onClick={()=>sync({...filters,tradition:'all'})}>All</button>
        {traditions.map(([id,label])=><button key={id} type="button" aria-pressed={filters.tradition===id} onClick={()=>sync({...filters,tradition:id as Tradition})}>{label}</button>)}
       </div>
      </div>
      <div className="fmi-shop-filter">
       <span>Collection</span>
       <div className="fmi-shop-filter-list">
        <button type="button" aria-pressed={filters.collection==='all'} onClick={()=>sync({...filters,collection:'all'})}>All</button>
        {galleryTiers.map(tier=><button key={tier} type="button" aria-pressed={filters.collection===tier} onClick={()=>sync({...filters,collection:tier})}>{galleryTierLabels[tier]}</button>)}
       </div>
      </div>
      <div className="fmi-shop-filter">
       <span>Palette</span>
       <div className="fmi-shop-filter-list">
        <button type="button" aria-pressed={filters.palette==='all'} onClick={()=>sync({...filters,palette:'all'})}>All</button>
        {palettes.map(([id,label])=><button key={id} type="button" aria-pressed={filters.palette===id} onClick={()=>sync({...filters,palette:id as Palette})}>{label}</button>)}
       </div>
      </div>
      <div className="fmi-shop-filter">
       <span>Setting</span>
       <div className="fmi-shop-filter-list">
        <button type="button" aria-pressed={filters.setting==='all'} onClick={()=>sync({...filters,setting:'all'})}>All</button>
        {settings.map(([id,label])=><button key={id} type="button" aria-pressed={filters.setting===id} onClick={()=>sync({...filters,setting:id as Setting})}>{label}</button>)}
       </div>
      </div>
     </aside>
     <section>
      <div className="fmi-shop-toolbar">
       <p>{loading&&!items.length?'Loading designs…':`${visible.length} design${visible.length===1?'':'s'}`}</p>
       {error&&<p role="status">{error}</p>}
      </div>
      {!loading&&!error&&!visible.length&&<p className="fmi-shop-empty">No designs match those filters. Clear a filter on the left to see more invitations.</p>}
      <div className="fmi-shop-grid">
       {visible.map(item=>
        <article className="fmi-shop-card" key={item.id}>
         <a className="art" href={demoHref(item.id)} aria-label={'Preview '+item.name}>
          {item.image?<img src={'/assets/'+item.image} alt="" loading="lazy"/>:null}
          <span className="fmi-shop-live">Live demo</span>
         </a>
         <div className="meta">
          <span className="chip">{item.tradition} · {galleryTierLabels[item.tier]}</span>
          <h3>{item.name}</h3>
          <p className="blurb">{item.description}</p>
          <div className="row"><strong className="price">{formatRupees(item.pricePaise)}</strong><span className="chip">{item.setting}</span></div>
          <div className="actions">
           <a href={demoHref(item.id)}>View demo</a>
           <a className="primary" href={formHref(item.id)}>Use this design</a>
          </div>
         </div>
        </article>
       )}
      </div>
     </section>
    </div>
   </div>
  </main>
  <Footer/>
 </>;
}
