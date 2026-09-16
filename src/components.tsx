import {useEffect,useState} from 'react';
import type {MouseEvent,ReactNode} from 'react';
import { ArrowRight, ChevronDown, Sparkles, Heart, Crown, Check, X, Infinity, PenLine, Hand, Timer, Inbox, Music2, MapPinned, WandSparkles, ImagePlus, Brush, Eye, Star, Volume2, VolumeX, Globe } from 'lucide-react';
import AuthModal from './AuthModal';
import {afterAuthPath,clearSession,readSession} from './auth-session';
const icons={arrow:ArrowRight,down:ChevronDown,sparkles:Sparkles,heart:Heart,crown:Crown,check:Check,x:X,infinity:Infinity,pen:PenLine,hand:Hand,timer:Timer,inbox:Inbox,music:Music2,map:MapPinned,wand:WandSparkles,image:ImagePlus,brush:Brush,eye:Eye,star:Star,volume:Volume2,mute:VolumeX,globe:Globe};
export function Icon({name,size=18,className=''}:{name:string,size?:number,className?:string}){const I=icons[name as keyof typeof icons]||Sparkles;return <I size={size} className={className} strokeWidth={1.75}/>}
export function Button({children,href,outline=false,onClick,className=''}:{children:ReactNode,href?:string,outline?:boolean,onClick?:()=>void,className?:string}){const cls=`fmi-button ${outline?'outline':''} ${className}`;return href?<a className={cls} href={href}>{children}</a>:<button className={cls} onClick={onClick}>{children}</button>}
export function Header({full=false}:{full?:boolean}){
 const [user,setUser]=useState(()=>readSession()?.user||null);
 const [authMode,setAuthMode]=useState<'signin'|'signup'|null>(null);
 useEffect(()=>{
  const sync=()=>{
   const session=readSession();
   setUser(session?.user||null);
   if(!session)return;
   const next=sessionStorage.getItem('fmi-after-auth');
   if(next){sessionStorage.removeItem('fmi-after-auth');if(location.pathname!==next)location.assign(next);}
  };
  const open=(event:Event)=>{const mode=(event as CustomEvent).detail?.mode==='signup'?'signup':'signin';setAuthMode(mode);};
  window.addEventListener('fmi-auth-changed',sync);
  window.addEventListener('fmi-auth-open',open);
  return()=>{window.removeEventListener('fmi-auth-changed',sync);window.removeEventListener('fmi-auth-open',open);};
 },[]);
 function myTemplates(event:MouseEvent){
  if(readSession())return;
  event.preventDefault();
  afterAuthPath('/dashboard');
  setAuthMode('signin');
 }
 function signOut(){
  clearSession();
  if(location.pathname==='/dashboard'||location.pathname.startsWith('/manage/')||location.pathname==='/login'||location.pathname==='/signup')location.assign('/');
 }
 return <><nav className={full?'site-nav fixed top-0 left-0 right-0 z-50':'site-nav relative'}><div className="container mx-auto flex items-center justify-between py-3 px-6"><a className="font-calligraphic text-2xl text-primary font-semibold tracking-wide" href="/">FindMyInvite</a><div className="flex items-center gap-8"><div className="hidden md:flex items-center gap-8">{full&&<><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#pricing">Pricing</a></>}</div><div className="nav-account"><a className="text-sm" href="/dashboard" onClick={myTemplates}>My Templates</a>{user?<button type="button" className="text-sm nav-text" onClick={signOut}>Sign out</button>:<button type="button" className="text-sm nav-text" onClick={()=>setAuthMode('signin')}>Sign in</button>}{full&&<Button href="/templates" className="small"><span className="hidden sm:inline">Get Started</span><span className="sm:hidden">Start</span></Button>}</div></div></div></nav>{authMode&&<AuthModal mode={authMode} onClose={()=>setAuthMode(null)}/>}</>;
}
export const footerLinks=[['about','About'],['contact','Contact'],['terms','Terms & Conditions'],['privacy-policy','Privacy Policy'],['refund-policy','Refund Policy'],['shipping-policy','Shipping & Delivery'],['blog','Blog']];
export function Footer(){return <footer className="border-t border-border py-10"><div className="container mx-auto px-6 text-center"><a className="font-calligraphic text-2xl text-primary font-semibold" href="/">FindMyInvite</a><nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-xs text-muted-foreground">{footerLinks.map(([url,label])=><a key={url} href={'/'+url}>{label}</a>)}</nav><p className="mt-6 text-xs text-muted-foreground">© 2026 FindMyInvite. Crafted with love</p><p className="text-xs text-muted-foreground mt-2">Digital invitation service • No physical products shipped</p></div></footer>}
export function Heading({eyebrow,title,description}:{eyebrow:string,title:string,description?:string}){return <div className="text-center mb-14 reveal"><p className="font-calligraphic text-lg text-primary mb-2">{eyebrow}</p><h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{title}</h2>{description&&<p className="text-muted-foreground max-w-xl mx-auto">{description}</p>}<div className="mx-auto w-24 h-0.5 gold-bg rounded-full opacity-60 mt-4"/></div>}
