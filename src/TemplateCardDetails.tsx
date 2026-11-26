import {Gift,PenLine} from 'lucide-react';
import {VIDEO_PRICE_PAISE} from '../shared/video-pricing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import TemplatePrice from './TemplatePrice';
import TemplateShare from './TemplateShare';
import {OfferCountdown,useBlackFridayOffer} from './video/BlackFridayOffer';

type Props={name:string;kind:'website'|'video';useHref:string;detailsHref?:string;templateId?:string;templateCode?:string;microDescription?:string;amountPaise?:number;originalPaise?:number;offerLabel?:string};

export default function TemplateCardDetails({name,kind,useHref,detailsHref,templateId,templateCode,microDescription,amountPaise,originalPaise,offerLabel}:Props){
 const campaign=useBlackFridayOffer(templateId);
 const label=campaign?.offerLabel??offerLabel;
 const offer=campaign?.basePaise??amountPaise??(kind==='video'?VIDEO_PRICE_PAISE:INVITATION_BASE_PAISE);
 const original=campaign?.originalPaise??originalPaise??(kind==='video'?99900:49900);
 return <div className="di-card-details">
  <div className="di-card-summary">
   <div className="di-card-heading"><h3 title={name}>{detailsHref?<a href={detailsHref}>{name}</a>:name}</h3>{detailsHref&&<TemplateShare name={name} detailsHref={detailsHref}/>}</div>
   {microDescription&&<p className="di-card-micro" title={microDescription}>{microDescription}</p>}
   {templateCode&&<span className="di-template-code" aria-label={'Template number '+templateCode}>{templateCode}</span>}
  </div>
  <div className="di-card-purchase">
   {label&&<span className="di-offer-label"><Gift size={16} aria-hidden="true"/><span>{label}</span></span>}
   <OfferCountdown seconds={campaign?.secondsLeft}/>
   <div className="di-card-price"><TemplatePrice amountPaise={offer} originalPaise={original}/></div>
   <a className="di-use-template" href={useHref} aria-label={'Use Template: '+name}><PenLine size={14} aria-hidden="true"/><span>Use Template</span></a>
  </div>
 </div>;
}
