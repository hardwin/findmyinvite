import {ClearableField} from '../templates/ClearableField';
import {useState} from 'react';
import type {VideoPurchase} from './checkout';
import {videoQuote} from '../../shared/video-pricing.mjs';
type Props={purchase:VideoPurchase|null;busy:boolean;onApply:(code:string)=>Promise<void>};
export function VideoCheckout({purchase,busy,onApply}:Props){
 const [code,setCode]=useState('');
 if(purchase?.unlocked)return null;
 const quote=purchase?purchase.quote:videoQuote();
 const money=(paise:number)=>'₹'+(paise/100).toLocaleString('en-IN',{maximumFractionDigits:2});
 return <div className="vp-checkout" aria-label="Payment options">
  <p className="vp-price-breakdown">{quote&&<span>{money(quote.basePaise)} + {quote.taxBps/100}% {quote.taxLabel} {money(quote.taxPaise)}</span>}<strong>Total {money(purchase?.amount??videoQuote().totalPaise)}</strong></p>
  <details className="vp-promo-details"><summary>Have a promo code?</summary><label htmlFor="video-promo" className="vp-sr-only">Promo code</label><div className="vp-promo"><ClearableField label="promo code" value={code} onClear={()=>setCode('')} disabled={busy}><input id="video-promo" value={code} onChange={e=>setCode(e.target.value)} maxLength={100} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Promo code" disabled={busy}/></ClearableField><button type="button" disabled={busy} onClick={()=>{if(code.trim())void onApply(code);else document.getElementById('video-promo')?.focus();}}>Apply</button></div></details>
 </div>;
}
