import TemplatePrice from '../TemplatePrice';
import {ClearableField} from '../templates/ClearableField';
import {useState} from 'react';
import type {VideoPurchase} from './checkout';
import {videoQuote,videoOffer} from '../../shared/video-pricing.mjs';
type Props={templateId:string;purchase:VideoPurchase|null;busy:boolean;onApply:(code:string)=>Promise<void>};
export function VideoCheckout({templateId,purchase,busy,onApply}:Props){
 const [code,setCode]=useState('');
 if(purchase?.unlocked||videoQuote(templateId).totalPaise===0)return null;
 const quote=purchase?purchase.quote:videoQuote(templateId),offer=videoOffer(templateId);
 const money=(paise:number)=>'₹'+(paise/100).toLocaleString('en-IN',{maximumFractionDigits:2});
 return <div className="vp-checkout" aria-label="Payment options">
  {offer.offerLabel&&<p className="di-offer-label">{offer.offerLabel}</p>}
  <p className="vp-price-breakdown">{quote&&<span><TemplatePrice amountPaise={quote.basePaise} originalPaise={offer.originalPaise}/> + {quote.taxBps/100}% {quote.taxLabel} {money(quote.taxPaise)}</span>}<span>Total <TemplatePrice amountPaise={purchase?.amount??videoQuote(templateId).totalPaise}/></span></p>
  <details className="vp-promo-details"><summary>Have a promo code?</summary><label htmlFor="video-promo" className="vp-sr-only">Promo code</label><div className="vp-promo"><ClearableField label="promo code" value={code} onClear={()=>setCode('')} disabled={busy}><input id="video-promo" value={code} onChange={e=>setCode(e.target.value)} maxLength={100} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Promo code" disabled={busy}/></ClearableField><button type="button" disabled={busy} onClick={()=>{if(code.trim())void onApply(code);else document.getElementById('video-promo')?.focus();}}>Apply</button></div></details>
 </div>;
}
