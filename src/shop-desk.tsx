import {DiscoveryHeader} from './Discovery';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Baby,Cake,CalendarHeart,ChevronDown,Gem,Heart,Home,Landmark,PartyPopper,Search,ShoppingBag,Sparkles,User,Utensils,Wine} from 'lucide-react';
import AuthModal from './AuthModal';
import {clearSession,readSession} from './auth-session';
import {occasionAisles} from './shop';

const occasionIcons:Record<string,typeof Heart>={
 wedding:Heart,
 engagement:Gem,
 'wedding-reception':Utensils,
 reception:Wine,
 birthday:Cake,
 anniversary:CalendarHeart,
 housewarming:Home,
 'baby-shower':Baby,
 party:PartyPopper,
 'opening-ceremony':Landmark,
 custom:Sparkles
};

function LegacyShopDeskBar({query='',occasion='wedding'}:{query?:string;occasion?:string}){
 const [q,setQ]=useState(query);
 const [open,setOpen]=useState(false);
 const box=useRef<HTMLDivElement>(null);
 const [user,setUser]=useState(()=>readSession()?.user||null);
 const [authMode,setAuthMode]=useState<'signin'|'signup'|null>(null);
 const current=occasionAisles.find(([id])=>id===occasion)||occasionAisles[0];
 const CurrentIcon=occasionIcons[current[0]]||Heart;
 useEffect(()=>{
  const sync=()=>setUser(readSession()?.user||null);
  window.addEventListener('fmi-auth-changed',sync);
  return()=>window.removeEventListener('fmi-auth-changed',sync);
 },[]);
 useEffect(()=>{
  if(!open)return;
  const close=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false);};
  const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};
  window.addEventListener('pointerdown',close);
  window.addEventListener('keydown',esc);
  return()=>{window.removeEventListener('pointerdown',close);window.removeEventListener('keydown',esc);};
 },[open]);
 function search(e:FormEvent){
  e.preventDefault();
  const next=new URLSearchParams({aisle:'kind',kind:'website'});
  if(q.trim())next.set('q',q.trim());
  location.assign('/templates?'+next.toString());
 }
 return <header className="im-desk-bar">
  <a className="im-desk-logo" href="/" aria-label="FindMyInvite">
   <img src="/assets/findmyinvite-logo.jpg" alt="FindMyInvite" width="2158" height="729"/>
   <small>Your wedding invitation copilot</small>
  </a>
  <div className="im-desk-loc" ref={box}>
   <button type="button" aria-expanded={open} aria-haspopup="listbox" onClick={()=>setOpen(v=>!v)}>
    <CurrentIcon size={18} strokeWidth={2.2}/>
    <span><strong>{current[1]}</strong><small>E-invites for your occasion</small></span>
    <ChevronDown size={16} strokeWidth={2.2}/>
   </button>
   {open&&<div className="im-desk-loc-menu" role="listbox" aria-label="Occasion">
    {occasionAisles.map(([id,label])=>{
     const Icon=occasionIcons[id]||Heart;
     return <a key={id} role="option" aria-selected={id===current[0]} className={id===current[0]?'on':undefined} href={'/templates?aisle=occasion&kind=website&type='+encodeURIComponent(id)}>
      <Icon size={18} strokeWidth={2}/>
      {label}
     </a>;
    })}
   </div>}
  </div>
  <form className="im-desk-search" onSubmit={search}>
   <input name="q" value={q} placeholder='Search for e-invites' aria-label="Search e-invites" onChange={e=>setQ(e.target.value)}/>
   <button type="submit" aria-label="Search"><Search size={18} strokeWidth={2}/></button>
  </form>
  {user
   ?<button className="im-desk-signin" type="button" onClick={()=>{clearSession();setUser(null);}}><User size={18}/> Sign out</button>
   :<button className="im-desk-signin" type="button" onClick={()=>setAuthMode('signin')}><User size={18}/> Sign in</button>}
  <a className="im-desk-cart" href="/form"><ShoppingBag size={18}/> My Cart</a>
  {authMode&&<AuthModal mode={authMode} onClose={()=>setAuthMode(null)}/>}
 </header>;
}

export default function ShopDeskBar(_props:{query?:string;occasion?:string}){return <DiscoveryHeader/>;}
