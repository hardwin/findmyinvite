import {PenLine} from 'lucide-react';
import {VIDEO_PRICE_PAISE} from '../shared/video-pricing.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';

type Props={name:string;kind:'website'|'video';useHref:string;detailsHref?:string};

export default function TemplateCardDetails({name,kind,useHref,detailsHref}:Props){
 const offer=(kind==='video'?VIDEO_PRICE_PAISE:INVITATION_BASE_PAISE)/100;
 const original=kind==='video'?999:499;
 return <div className="di-card-details">
  <h3>{detailsHref?<a href={detailsHref}>{name}</a>:name}</h3>
  <div className="di-card-purchase">
   <div className="di-card-price"><strong aria-label={`Offer price ₹${offer}`}>₹{offer}</strong><del aria-label={`Original price ₹${original}`}>₹{original}</del></div>
   <a className="di-use-template" href={useHref} aria-label={'Use Template: '+name}><PenLine size={14} aria-hidden="true"/><span>Use Template</span></a>
  </div>
 </div>;
}
