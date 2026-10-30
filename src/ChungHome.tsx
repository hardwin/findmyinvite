import {useEffect,useMemo,useState} from 'react';
import {BookOpen,ChevronLeft,ChevronRight,Gift,Images,LayoutGrid,MapPin,MessageCircle,Moon,PenLine,Share2,Smartphone,Sparkles,Sun} from 'lucide-react';
import AuthModal from './AuthModal';
import {useCatalog} from './catalog';
import {isPublicGalleryTemplate,templates} from './data';
import './chung-home.css';

const wa='https://wa.me/916362260992?text='+encodeURIComponent('Hi, I want a wedding invitation.');
const popularIds=['royal-heritage-8','royal-heritage-9','royal-prestige-2','royal-prestige-4','royal-prestige-5','royal-prestige-7','royal-prestige-12','royal-temple','royal-heritage-wedding','luxury-pink'];

const steps=[
 ['Step 1','Choose a Template','Beautiful designs, multiple styles to choose from',LayoutGrid],
 ['Step 2','Fill in Your Details','Add photos, names, wedding date, and more',PenLine],
 ['Step 3','Send Your Invitation','Share instantly via WhatsApp, Messenger, or any app',Share2]
] as const;

const needs=[
 ['Mobile Optimized','Perfectly responsive on any phone screen for easy guest browsing',Smartphone],
 ['Beautiful Templates','From traditional to modern styles, find the perfect match',Sparkles],
 ['Google Maps Navigation','Built-in maps so guests can navigate to your venue in one tap',MapPin],
 ['Wedding Photo Album','Showcase your best photos with a built-in gallery viewer',Images],
 ['Guest Book','Guests can leave their wishes directly on your invitation',BookOpen],
 ['Gift Box','Accept gifts via bank transfer QR code, simple and convenient',Gift]
] as const;

const faqs=[
 ['What is an online wedding invitation?','An online wedding invitation is a designed digital page you share as a link. With FindMyInvite you fill the names, pay with Razorpay, then copy the guest page. Family opens it on any phone. No app.'],
 ['How do I create an online wedding invitation?','Choose a template, fill in your names, date and venue, pay, then copy the live link and send it on WhatsApp.'],
 ['How much does it cost?','Wedding websites start at Rs.199. Invitation videos are listed on the shop. The price is shown before Razorpay checkout. The public guest page is created after a captured payment.'],
 ['How do guests receive the invitation?','You get a unique link. Send it on WhatsApp, Messenger or email. Guests tap it. No login.'],
 ['Do I need any design skills?','No. Templates are already designed. You fill the details. No layout, fonts or colours to pick.'],
 ['What information should I prepare?','Couple names, both sets of parents, date, time, venue, and 5–10 photos. That is enough to fill the form.'],
 ['Can I edit after publishing?','Yes. Sign in, open My templates, and change the page. Guests who open the same link see the new details.'],
 ['How many guests can I invite?','There is no guest cap. Share the link with everyone.']
] as const;

export default function ChungHome(){
 const {items}=useCatalog();
 const pool=(items.length?items:templates.filter(t=>isPublicGalleryTemplate(t.id))).filter(t=>t.image);
 const popular=useMemo(()=>{
  const picked=popularIds.map(id=>pool.find(t=>t.id===id)).filter((t):t is typeof pool[number]=>Boolean(t));
  return [...picked,...pool.filter(t=>!popularIds.includes(t.id))].slice(0,12);
 },[pool]);
 const collage=popular.slice(0,10);
 const [i,setI]=useState(2);
 const [auth,setAuth]=useState(false);
 const [dark,setDark]=useState(false);
 const n=popular.length||1;
 const go=(d:number)=>setI(v=>(v+d+n)%n);
 useEffect(()=>{
  if(n<2)return;
  const t=window.setInterval(()=>setI(v=>(v+1)%n),4200);
  return()=>window.clearInterval(t);
 },[n]);
 const current=popular[i];
 return <div className={'cd-home'+(dark?' dark':'')}>
  <header className="cd-nav">
   <a className="cd-logo" href="/" aria-label="FindMyInvite">
    <img src="/assets/findmyinvite-logo.jpg" alt="FindMyInvite" width="2158" height="729"/>
   </a>
   <a className="cd-nav-mid" href="/templates">Templates</a>
   <div className="cd-nav-end">
    <button className="cd-moon" type="button" aria-label={dark?'Light theme':'Dark theme'} onClick={()=>setDark(v=>!v)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
    <button className="cd-login" type="button" onClick={()=>setAuth(true)}>Log In</button>
   </div>
  </header>

  <section className="cd-hero">
   <div className="cd-hero-collage" aria-hidden="true">
    {collage.map((t,n)=>
     <img key={t.id} className={'cd-hero-shot cd-hero-shot-'+n} src={'/assets/'+t.image} alt=""/>
    )}
   </div>
   <div className="cd-hero-phone" aria-hidden="true">
    {popular[0]?.image?<img src={'/assets/'+popular[0].image} alt=""/>:null}
   </div>
   <div className="cd-hero-copy">
    <p className="cd-script">FindMyInvite.com</p>
    <h1>Free online wedding invitations</h1>
    <p className="cd-quote">“Life moves fast, but love always finds a way”</p>
    <p className="cd-lead">A modern take on traditional wedding invitations: share your special day faster, further, and with more people.</p>
    <p className="cd-fine">Pay with Razorpay · Copy the guest link · Share on WhatsApp</p>
    <a className="cd-pill" href="/templates">Create Now</a>
   </div>
  </section>

  <section className="cd-popular" aria-labelledby="cd-popular-title">
   <h2 id="cd-popular-title">Most Popular <em>Invitation Templates</em></h2>
   <p>Discover beautifully designed wedding invitation templates</p>
   <div className="cd-cover-wrap">
    <button className="cd-cover-nav" type="button" aria-label="Previous" onClick={()=>go(-1)}><ChevronLeft size={22}/></button>
    <div className="cd-cover">
     {popular.map((t,idx)=>{
      const d=idx-i;
      const abs=Math.abs(d);
      if(abs>4)return null;
      return <a key={t.id} className={'cd-cover-card'+(abs===0?' on':'')} href={'/templates?product='+encodeURIComponent(t.id)+'&aisle=kind&kind=website'} style={{
       transform:`translate(-50%,-50%) translateX(${d*42}%) rotateY(${d*-32}deg) scale(${1-abs*0.07})`,
       zIndex:30-abs,
       opacity:abs>3?0:1
      }}>
       <img src={'/assets/'+t.image} alt=""/>
       {abs===0?<span className="cd-cover-cap"><b>{t.name}</b></span>:null}
      </a>;
     })}
    </div>
    <button className="cd-cover-nav cd-cover-next" type="button" aria-label="Next" onClick={()=>go(1)}><ChevronRight size={22}/></button>
   </div>
   <div className="cd-dots" role="tablist" aria-label="Templates">
    {popular.map((t,idx)=>
     <button key={t.id} type="button" role="tab" aria-selected={idx===i} className={idx===i?'on':undefined} onClick={()=>setI(idx)} aria-label={'Go to slide '+(idx+1)}/>
    )}
   </div>
   <a className="cd-pill" href="/templates">Browse All Templates <span>›</span></a>
   <p className="cd-more">More beautiful templates waiting for you</p>
  </section>

  <section className="cd-steps" aria-labelledby="cd-steps-title">
   <h2 id="cd-steps-title">Create free digital wedding invitations <em>& manage guests</em></h2>
   <p>Keep the tradition · Enjoy the convenience</p>
   <div className="cd-steps-grid">
    <ol>
     {steps.map(([kicker,title,text,Icon])=>
      <li key={title}>
       <span className="cd-step-ico"><Icon size={22}/></span>
       <div>
        <small>{kicker}</small>
        <h3>{title}</h3>
        <p>{text}</p>
       </div>
      </li>
     )}
    </ol>
    <div className="cd-steps-shot">
     {current?.image?<img src={'/assets/'+current.image} alt=""/>:null}
     <span>How FindMyInvite works</span>
    </div>
   </div>
   <a className="cd-pill" href="/templates">Start Creating</a>
   <a className="cd-textlink" href={wa} target="_blank" rel="noopener noreferrer">View the full tutorial guide</a>
  </section>

  <section className="cd-help" aria-labelledby="cd-help-title">
   <h2 id="cd-help-title">When you need us, <em>we're here</em></h2>
   <p>The FindMyInvite team is on WhatsApp. <a href={wa} target="_blank" rel="noopener noreferrer">Chat with us</a> whenever you need help.</p>
   <ul>
    <li><b>Reply time</b> Usually under 1 minute</li>
    <li><b>Help with edits</b> Until it feels right</li>
   </ul>
  </section>

  <section className="cd-rsvp" aria-labelledby="cd-rsvp-title">
   <p className="cd-kicker">CREATE GUESTS & MANAGE RSVP</p>
   <div className="cd-rsvp-grid">
    <div>
     <h2 id="cd-rsvp-title">Know who's coming, plan with ease</h2>
     <p>Invite each guest with grace, then focus on your big day. No more scrolling chats to count who's coming or not, your smart guest manager keeps track.</p>
     <ul>
      <li>Add guests one at a time or in bulk, then group them by family or table</li>
      <li>A personal link per guest, with a greeting and invite worded to suit them</li>
      <li>Guests confirm attending or declined, with party size</li>
      <li>Share a link so family can add their own guests, no login needed</li>
      <li>Edit, group or remove many guests at once, and read the totals at a glance</li>
     </ul>
     <p>Create guests, send links, and track RSVP from one page.</p>
     <a className="cd-pill" href="/form">Create invitation</a>
    </div>
    <aside className="cd-rsvp-card">
     <p className="cd-kicker">GUEST MANAGER</p>
     <p>RSVPs gathered in one place</p>
     <div className="cd-stats">
      <div><strong>58</strong><span>guests tracked</span></div>
      <div><strong>84%</strong><span>replied</span></div>
      <div><strong>24</strong><span>Attending</span></div>
      <div><strong>5</strong><span>Pending</span></div>
     </div>
    </aside>
   </div>
  </section>

  <section className="cd-switch" aria-labelledby="cd-switch-title">
   <p className="cd-kicker">Switch designs freely</p>
   <h2 id="cd-switch-title">Change the design without retyping anything</h2>
   <p>Pick a different design any time. The names, both sets of parents, the date, the venue and your photos all stay exactly as you left them. Only the design changes.</p>
   <div className="cd-switch-art">
    {popular.slice(0,3).map(t=>
     <figure key={t.id}><img src={'/assets/'+t.image} alt=""/><figcaption>{t.name}</figcaption></figure>
    )}
   </div>
   <a className="cd-pill" href="/templates">Create Now</a>
   <a className="cd-textlink" href="/templates">Browse all designs</a>
  </section>

  <section className="cd-lang" aria-labelledby="cd-lang-title">
   <h2 id="cd-lang-title">Supports Multiple Languages</h2>
   <p>Display your wedding invitation in multiple languages at once. Perfect for weddings with international guests or multicultural families.</p>
   <ul>
    <li>Add a language in one click</li>
    <li>Side-by-side content display</li>
    <li>Built-in default translations</li>
    <li>Easy to customize translations</li>
   </ul>
   <a className="cd-pill" href="/templates">Create Your Invitation Now</a>
  </section>

  <section className="cd-video" aria-labelledby="cd-video-title">
   <p className="cd-kicker">Wedding invitation video</p>
   <h2 id="cd-video-title">Show your invitation on Stories and Reels</h2>
   <p>Your whole invitation in one video, ready for social media and yours to keep.</p>
   <ul>
    <li>Sharp Full HD, and it fits a story, a reel, or the family group chat.</li>
    <li>Same music, same photos, same words your guests are reading.</li>
    <li>One tap to make it. No editing, no video skills.</li>
    <li>Change the card, make it again, and it is always the current version.</li>
    <li>Easy to download to your own device.</li>
   </ul>
   <a className="cd-pill" href="/templates?aisle=kind&kind=video">Create invitation</a>
  </section>

  <section className="cd-need" aria-labelledby="cd-need-title">
   <h2 id="cd-need-title">Everything You Need</h2>
   <p>One invitation with everything your wedding needs</p>
   <div className="cd-need-grid">
    {needs.map(([title,text,Icon])=>
     <article key={title}>
      <Icon size={28} strokeWidth={1.7}/>
      <h3>{title}</h3>
      <p>{text}</p>
     </article>
    )}
   </div>
  </section>

  <section className="cd-faq" aria-labelledby="cd-faq-title">
   <h2 id="cd-faq-title">Frequently Asked Questions</h2>
   {faqs.map(([q,a])=>
    <details key={q}>
     <summary>{q}</summary>
     <p>{a}</p>
    </details>
   )}
  </section>

  <footer className="cd-foot">
   <div className="cd-foot-brand">
    <h2>FindMyInvite.com</h2>
    <p>Create elegant online wedding invitations with no design skills. Switch templates, personalise names, and share the live link.</p>
    <a href="mailto:hello@findmyinvite.com">hello@findmyinvite.com</a>
   </div>
   <nav>
    <b>Product</b>
    <a href="/templates">Wedding Templates</a>
    <a href="/templates?aisle=kind&kind=website">Wedding websites</a>
    <a href="/templates?aisle=kind&kind=video">Invitation videos</a>
    <a href="/form">Create</a>
   </nav>
   <nav>
    <b>Resources</b>
    <a href={wa} target="_blank" rel="noopener noreferrer">Help Center</a>
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="/terms">Terms of Service</a>
    <a href="/refund-policy">Refund Policy</a>
   </nav>
  </footer>

  <a className="cd-dock" href="/templates"><LayoutGrid size={22}/><span>Templates</span></a>
  <a className="cd-chat" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat with us"><MessageCircle size={22}/></a>
  {auth&&<AuthModal mode="signin" onClose={()=>setAuth(false)}/>}
 </div>;
}
