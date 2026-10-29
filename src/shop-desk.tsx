import {useEffect,useState,type FormEvent} from 'react';
import {MapPin,Search,ShoppingBag,User} from 'lucide-react';
import AuthModal from './AuthModal';
import {clearSession,readSession} from './auth-session';

export default function ShopDeskBar({query=''}:{query?:string}){
 const [q,setQ]=useState(query);
 const [user,setUser]=useState(()=>readSession()?.user||null);
 const [authMode,setAuthMode]=useState<'signin'|'signup'|null>(null);
 useEffect(()=>{
  const sync=()=>setUser(readSession()?.user||null);
  window.addEventListener('fmi-auth-changed',sync);
  return()=>window.removeEventListener('fmi-auth-changed',sync);
 },[]);
 function search(e:FormEvent){
  e.preventDefault();
  const next=new URLSearchParams({aisle:'kind',kind:'website'});
  if(q.trim())next.set('q',q.trim());
  location.assign('/templates?'+next.toString());
 }
 return <header className="im-desk-bar">
  <a className="im-desk-logo" href="/" aria-label="FindMyInvite">
   <img src="/assets/findmyinvite-logo.jpg" alt="FindMyInvite" width="2158" height="729"/>
  </a>
  <a className="im-desk-loc" href="/templates?aisle=occasion&kind=website&type=wedding">
   <MapPin size={18} strokeWidth={2.2}/>
   <span><strong>Wedding</strong><small>E-invites for your occasion</small></span>
  </a>
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
