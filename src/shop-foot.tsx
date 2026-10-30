import {type FormEvent,useState} from 'react';
import {Play} from 'lucide-react';

const wa='https://wa.me/916362260992?text='+encodeURIComponent('Hi, I want a custom video or invitation.');
const offersWa=(email:string)=>'https://wa.me/916362260992?text='+encodeURIComponent('Hi, send me FindMyInvite offers'+(email?' '+email:'.'));

const reasons=[
 ['Live guest link','Pay, then copy the page for guests.'],
 ['Easy to personalise','Names, date, church. Then publish.'],
 ['Opens on any phone','Guests need no app or login.'],
 ['Cinematic quality','Websites and invite films in 9:16.'],
 ['WhatsApp ready','Share the live link in one tap.'],
 ['Secure checkout','Razorpay. UPI, cards, net banking.']
] as const;

const perks=['Custom design','Background music','HD quality video','Fast turnaround'] as const;

const quotes=[
 ['MS','Meera S.','Filled the names, paid, copied the link. Family opened it on their phones the same night.'],
 ['AP','Anjali P.','The church film felt like our day. We sent it on WhatsApp before dinner.'],
 ['RT','Riya T.','Asked for a custom invite for our family. They made it, we paid, we shared.']
] as const;

export default function ShopDeskFoot(){
 const [email,setEmail]=useState('');
 function offer(e:FormEvent){
  e.preventDefault();
  location.assign(offersWa(email.trim()));
 }
 return <div className="im-end">
  <section className="im-why" aria-labelledby="im-why-title">
   <header className="im-brand-head">
    <p>Why choose</p>
    <h2 id="im-why-title">Why choose <em>FindMyInvite</em></h2>
   </header>
   <div className="im-why-grid">
    {reasons.map(([title,text])=>
     <article key={title}>
      <b>{title}</b>
      <p>{text}</p>
     </article>
    )}
   </div>
  </section>
  <section className="im-custom" aria-labelledby="im-custom-title">
   <a className="im-custom-play" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Request a custom design">
    <img src="/assets/shop-promo-invite-videos.png" alt=""/>
    <span><Play size={22} fill="currentColor"/></span>
   </a>
   <div className="im-custom-copy">
    <p className="im-kicker">Custom video and invitation</p>
    <h2 id="im-custom-title">Need a <em>custom</em> invitation</h2>
    <p>A personalised website or video for your wedding, reception, or family function. Message us on WhatsApp.</p>
    <a className="im-custom-cta" href={wa} target="_blank" rel="noopener noreferrer">Request a custom design</a>
    <ul>
     {perks.map(label=><li key={label}>{label}</li>)}
    </ul>
   </div>
  </section>
  <section className="im-quotes" aria-labelledby="im-quotes-title">
   <header className="im-brand-head">
    <p>Kind words</p>
    <h2 id="im-quotes-title">What our <em>customers</em> say</h2>
   </header>
   <div className="im-quotes-grid">
    {quotes.map(([initials,name,text])=>
     <article key={name}>
      <span className="im-quotes-av">{initials}</span>
      <p>“{text}”</p>
      <b>{name}</b>
     </article>
    )}
   </div>
  </section>
  <section className="im-offers" aria-labelledby="im-offers-title">
   <div>
    <p className="im-kicker">Stay close</p>
    <h2 id="im-offers-title">Get exclusive <em>offers</em> on WhatsApp</h2>
    <p>New designs and launch prices, sent when they go live.</p>
   </div>
   <form onSubmit={offer}>
    <input type="email" name="email" autoComplete="email" placeholder="Your email (optional)" value={email} onChange={e=>setEmail(e.target.value)} aria-label="Email for WhatsApp offers"/>
    <button type="submit">Subscribe</button>
   </form>
  </section>
  <footer className="im-foot">
   <div className="im-foot-brand">
    <a className="im-foot-logo" href="/" aria-label="FindMyInvite"><img src="/assets/findmyinvite-logo.jpg" alt="FindMyInvite" width="2158" height="729"/></a>
    <p className="im-foot-tag">Your wedding invitation copilot</p>
    <p>Digital wedding websites and invite videos. Pay, copy the live link, share with guests.</p>
    <small>© 2026 FindMyInvite. No physical products shipped.</small>
   </div>
   <nav aria-label="Quick links">
    <b>Quick links</b>
    <a href="/">Shop</a>
    <a href="/templates?aisle=kind&kind=website">Wedding websites</a>
    <a href="/templates?aisle=kind&kind=video">e-Invite videos</a>
    <a href={wa} target="_blank" rel="noopener noreferrer">Custom design</a>
    <a href="/form">My cart</a>
   </nav>
   <nav aria-label="Categories">
    <b>Categories</b>
    <a href="/templates?aisle=tradition&kind=website&tradition=christian&type=wedding">Christian</a>
    <a href="/templates?aisle=tradition&kind=website&tradition=hindu&type=wedding">Hindu</a>
    <a href="/templates?aisle=tradition&kind=website&tradition=muslim&type=wedding">Islam</a>
    <a href="/templates?aisle=collection&kind=website&collection=premium&type=wedding">Premium</a>
    <a href="/templates?aisle=kind&kind=website&q=Toon">Toon</a>
    <a href="/templates?aisle=kind&kind=website&q=Pixar">Pixar 3D</a>
   </nav>
   <nav aria-label="Help">
    <b>Help and support</b>
    <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
    <a href="/dashboard">My templates</a>
    <a href="/privacy-policy">Privacy policy</a>
    <a href="/refund-policy">Refund policy</a>
    <a href="/terms">Terms</a>
    <p>Pay with Razorpay. UPI, cards, net banking.</p>
   </nav>
  </footer>
 </div>;
}
