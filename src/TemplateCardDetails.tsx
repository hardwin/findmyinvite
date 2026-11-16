import {PenLine} from 'lucide-react';
import {VIDEO_PRICE_PAISE} from '../shared/video-pricing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import TemplatePrice from './TemplatePrice';

type Props={name:string;kind:'website'|'video';useHref:string;detailsHref?:string;templateCode?:string;microDescription?:string;amountPaise?:number};

export default function TemplateCardDetails({name,kind,useHref,detailsHref,templateCode,microDescription,amountPaise}:Props){
 const offer=amountPaise??(kind==='video'?VIDEO_PRICE_PAISE:INVITATION_BASE_PAISE);
 const original=kind==='video'?99900:49900;
 return <div className="di-card-details">
  <h3 title={name}>{detailsHref?<a href={detailsHref}>{name}</a>:name}</h3>
  {microDescription&&<p className="di-card-micro" title={microDescription}>{microDescription}</p>}
  {templateCode&&<span className="di-template-code" aria-label={'Template number '+templateCode}>{templateCode}</span>}
  <div className="di-card-purchase">
   <div className="di-card-price"><TemplatePrice amountPaise={offer} originalPaise={original}/></div>
   <a className="di-use-template" href={useHref} aria-label={'Use Template: '+name}><PenLine size={14} aria-hidden="true"/><span>Use Template</span></a>
  </div>
 </div>;
}
