import {Globe,Heart,Play} from 'lucide-react';
import CatalogThumbnail from './templates/CatalogThumbnail';
import TemplateCardDetails from './TemplateCardDetails';
import TemplatePreviewDialog from './TemplatePreviewDialog';
import type {shopCard} from './shop';

type Props={card:ReturnType<typeof shopCard>;language:string;useHref:string;detailsHref:string;expanded?:boolean};
export default function WebsiteCard({card,language,useHref,detailsHref,expanded=false}:Props){
 const poster=card.image?(/^(https?:|\/)/.test(card.image)?card.image:'/assets/'+card.image):'';
 return <article className={'di-pin'+(expanded?' di-expanded-card':'')}>
  <div className="di-pin-media">
   {card.templateVersionId?<CatalogThumbnail version={card.templateVersionId} language={language} name={card.name} poster={poster} autoPlay={expanded}/>:<>
    <div className="di-live-thumbnail">{poster?<img src={poster} alt={card.name} loading="lazy"/>:<div className="di-no-image"><Heart size={38}/><span>{card.name}</span></div>}{expanded&&<iframe title={card.name+' preview'} src={'/invite/demo?template='+encodeURIComponent(card.id)}/>}</div>
    {!expanded&&<a className="di-thumbnail-preview" href={'/invite/demo?template='+encodeURIComponent(card.id)} aria-label={'Preview '+card.name}><Play size={16} fill="currentColor"/>Preview</a>}
   </>}
   <span className="di-pin-kind"><Globe size={14}/> Website</span>
   {!expanded&&<TemplatePreviewDialog name={card.name}><WebsiteCard card={card} language={language} useHref={useHref} detailsHref={detailsHref} expanded/></TemplatePreviewDialog>}
  </div>
  <TemplateCardDetails name={card.name} kind="website" useHref={useHref} detailsHref={detailsHref}/>
 </article>;
}
