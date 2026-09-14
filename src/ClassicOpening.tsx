import type { CSSProperties } from 'react';
import './classic-opening.css';

// Timings and ornaments transcribed from the public reference's Kne/Jne/no components.
export const CLASSIC_REVEAL_MS:Record<string,number>={'ivory-elegance':3200,'rose-gold-blush':1800};
function Corner({bottom=false}:{bottom?:boolean}){return <svg className={'co-corner '+(bottom?'co-bottom':'')} viewBox="0 0 80 80" fill="none"><path d="M80 0 L80 25 Q80 50 55 65 L30 80" stroke="currentColor" strokeWidth=".8"/>{!bottom&&<><path d="M80 0 L80 18 Q80 35 60 48" stroke="currentColor" strokeWidth=".5" opacity=".5"/><circle cx="80" cy="0" r="2" fill="currentColor" opacity=".4"/></>}</svg>}
function RoseOrnament(){return <svg className="co-rose-ornament" viewBox="0 0 100 180" fill="none"><path d="M15 160 Q50 20 85 160" stroke="rgba(183,110,121,.2)" strokeWidth="1.2"/><path d="M25 160 Q50 40 75 160" stroke="rgba(183,110,121,.15)" strokeWidth=".8"/><circle cx="50" cy="70" r="8" stroke="rgba(183,110,121,.15)" strokeWidth=".8"/><path d="M38 55C32 48 36 42 42 46 M62 55C68 48 64 42 58 46" stroke="rgba(183,110,121,.1)" strokeWidth=".5"/></svg>}
export default function ClassicOpening({template,open,onOpen}:{template:string;open:boolean;onOpen:()=>void}){
 const rose=template==='rose-gold-blush';
 return <div className={`classic-opening ${rose?'co-rose':'co-crimson'} ${open?'co-opening':''}`}>
  <div className="co-backdrop"/>
  {['left','right'].map(side=><div className={'co-panel co-'+side} key={side}>{rose?<><div className="co-pattern"/><div className="co-border"><div className="co-inner-border">{side==='left'&&<RoseOrnament/>}</div></div><div className="co-seam"/><i className="co-knob"/></>:<><Corner/><Corner bottom/><i className="co-line co-red-line"/><i className="co-line co-gold-line"/></>}<div className="co-panel-shadow"/></div>)}
  <div className="co-prompt" aria-hidden={open}>{rose&&<><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 22.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg><p className="co-youre-invited">You're Invited</p></>}<button className="co-seal" aria-label="Open invitation" disabled={open} onClick={onOpen}><i className="co-seal-base"/><i className="co-seal-inner"/><i className="co-seal-ring"/><span className="co-seal-copy">{rose&&<b>♥</b>}<small>tap to open</small></span><i className="co-seal-shine"/></button>{rose&&<p className="co-hint">tap the seal to open</p>}</div>
  {open&&<div className="co-particles" aria-hidden="true">{Array.from({length:rose?25:20},(_,i)=><i key={i} style={{'--x':`${Math.sin(i*2.4)*240}px`,'--y':`${Math.cos(i*3.7)*240}px`,'--delay':`${(i%7)*.045}s`,width:2+i%5,height:2+i%5,background:rose?`hsl(${340+i%25} 55% ${65+i%20}%)`:`hsl(40 55% ${50+i%20}%)`} as CSSProperties}/>)}</div>}
 </div>
}
