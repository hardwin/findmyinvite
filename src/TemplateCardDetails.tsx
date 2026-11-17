import {Gift,PenLine} from 'lucide-react';
import {VIDEO_PRICE_PAISE} from '../shared/video-pricing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import TemplatePrice from './TemplatePrice';
import TemplateShare from './TemplateShare';

type Props={name:string;kind:'website'|'video';useHref:string;detailsHref?:string;templateCode?:string;microDescription?:string;amountPaise?:number;originalPaise?:number;offerLabel?:string};

export default function TemplateCardDetails({name,kind,useHref,detailsHref,templateCode,microDescription,amountPaise,originalPaise,offerLabel}:Props){
 const offer=amountPaise??(kind==='video'?VIDEO_PRICE_PAISE:INVITATION_BASE_PAISE);
 const original=originalPaise??(kind==='video'?99900:49900);
 return <div className="di-card-details">
  <div className="di-card-summary">
   <div className="di-card-heading"><h3 title={name}>{detailsHref?<a href={detailsHref}>{name}</a>:name}</h3>{detailsHref&&<TemplateShare name={name} detailsHref={detailsHref}/>}</div>
   {microDescription&&<p className="di-card-micro" title={microDescription}>{microDescription}</p>}
   {templateCode&&<span className="di-template-code" aria-label={'Template number '+templateCode}>{templateCode}</span>}
  </div>
  <div className="di-card-purchase">
   {offerLabel&&<span className="di-offer-label"><Gift size={16} aria-hidden="true"/><span>{offerLabel}</span></span>}
   <div className="di-card-price"><TemplatePrice amountPaise={offer} originalPaise={original}/></div>
   <a className="di-use-template" href={useHref} aria-label={'Use Template: '+name}><PenLine size={14} aria-hidden="true"/><span>Use Template</span></a>
  </div>
 </div>;
}
