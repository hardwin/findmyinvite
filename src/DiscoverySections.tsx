import {useState} from 'react';
import {ArrowRight,X} from 'lucide-react';
import categoryImages from '../public/assets/categories/sources.json';
import type {shopCard} from './shop';
import './discovery-sections.css';

type Card=ReturnType<typeof shopCard>;

export function BrowseCategories({cards,loading}:{cards:Card[];loading:boolean}){
 return <section className="dc-categories" aria-labelledby="dc-category-title">
  <header className="dc-category-header">
   <h2 id="dc-category-title">Browse categories</h2>
   <a href="/templates">All invitations <span aria-hidden="true">↗</span></a>
  </header>
  <div className="dc-category-scroller">
   {categoryImages.map(category=>{
    const isTradition=['christian','hindu','muslim'].includes(category.id);
    const isIllustration=['pixar','toon','save-the-date'].includes(category.id);
    const query=category.id==='save-the-date'?'Save the Date':category.id;
    const count=cards.filter(card=>isIllustration
     ? [card.name,card.description,card.tradition,card.setting,card.kind].join(' ').toLowerCase().includes(query.toLowerCase())
     : (isTradition?card.tradition:card.setting)===category.id).length;
    const href='/templates?'+(isTradition?'tradition=':isIllustration?'q=':'setting=')+encodeURIComponent(query);
    return <a className="dc-category-card" key={category.id} href={href} aria-label={`Browse ${category.label}${loading?'':`, ${count} invitations`}`}>
     <span className="dc-category-thumb" style={{backgroundImage:`url(${category.backgroundImage})`,backgroundColor:category.backgroundColor,backgroundBlendMode:category.backgroundBlend}}>
      <img src={category.image} alt="" width={640} height={400} decoding="async"/>
      <span className="dc-category-count">{loading?'…':count} invitations</span>
     </span>
     <strong className="dc-category-name">{category.label}</strong>
    </a>;
   })}
  </div>
 </section>;
}

function Pushpin(){
 return <svg viewBox="-1.5 0 28 28" aria-hidden="true" className="dc-pushpin">
  <path opacity=".62" d="m13.4 17.2-1.8 9.2-2.1-9.7Z"/>
  <ellipse opacity=".96" cx="12.2" cy="16.5" rx="8.1" ry="3.8"/>
  <path opacity=".88" d="M7.9 7.1h9l-1.5 8.8H9.2Z"/>
  <ellipse cx="12.5" cy="6.8" rx="6.4" ry="3.7"/>
  <path className="dc-pin-shine" d="M8.8 5.8c1.6-1.2 4.2-1.7 6.2-.8"/>
 </svg>;
}

export function PinsPromotion(){
 const [dismissed,setDismissed]=useState(false);
 if(dismissed)return null;
 return <aside className="dc-promotion" aria-label="My Pins">
  <div className="dc-board" aria-hidden="true">
   {['christian','hindu','muslim'].map(id=>{
    const category=categoryImages.find(image=>image.id===id)!;
    return <span className="dc-pinned" key={id} style={{backgroundImage:`url(${category.backgroundImage})`,backgroundColor:category.backgroundColor,backgroundBlendMode:category.backgroundBlend}}>
     <img src={category.image} alt="" width={46} height={60} loading="lazy" decoding="async"/>
     <span className="dc-pin"><Pushpin/></span>
    </span>;
   })}
  </div>
  <div className="dc-promotion-copy">
   <span className="dc-promotion-eyebrow">My Pins · Free</span>
   <strong className="dc-promotion-title">Your celebration starts with an idea.</strong>
   <p>Save your favourite invitations in one place.</p>
  </div>
  <div className="dc-promotion-actions"><a className="dc-promotion-cta" href="/saved">My Pins <ArrowRight size={16} strokeWidth={1.8}/></a></div>
  <button className="dc-promotion-dismiss" type="button" aria-label="Dismiss My Pins promotion" title="Dismiss" onClick={()=>setDismissed(true)}><X size={18}/></button>
 </aside>;
}
