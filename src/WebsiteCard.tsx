import {Globe,Heart,Play} from 'lucide-react';
import {useRef,useState} from 'react';
import CatalogThumbnail,{type CatalogPreviewHandle} from './templates/CatalogThumbnail';
import TemplateCardDetails from './TemplateCardDetails';
import TemplatePreviewDialog from './TemplatePreviewDialog';
import type {shopCard} from './shop';

type Props={card:ReturnType<typeof shopCard>;language:string;useHref:string;detailsHref:string};
export default function WebsiteCard({card,language,useHref,detailsHref}:Props){
 const preview=useRef<CatalogPreviewHandle>(null);
 const [legacyActive,setLegacyActive]=useState(false);
 const poster=card.image?(/^(https?:|\/)/.test(card.image)?card.image:'/assets/'+card.image):'';
 return <TemplatePreviewDialog name={card.name} onExpand={()=>{if(card.templateVersionId)preview.current?.start();else setLegacyActive(true);}}>{(expanded,expandControl)=><article className={'di-pin'+(expanded?' di-expanded-card':'')}>
  <div className="di-pin-media">
   {card.templateVersionId?<CatalogThumbnail controller={preview} version={card.templateVersionId} language={language} name={card.name} poster={poster}/>:<>
    <div className="di-live-thumbnail">{poster?<img src={poster} alt={card.name} loading="lazy"/>:<div className="di-no-image"><Heart size={38}/><span>{card.name}</span></div>}{legacyActive&&<iframe title={card.name+' preview'} src={'/invite/demo?template='+encodeURIComponent(card.id)}/>}</div>
    {!legacyActive&&<a className="di-thumbnail-preview" href={'/invite/demo?template='+encodeURIComponent(card.id)} aria-label={'Preview '+card.name}><Play size={16} fill="currentColor"/>Preview</a>}
   </>}
   <span className="di-pin-kind"><Globe size={14}/> Website</span>
   {expandControl}
  </div>
  <TemplateCardDetails name={card.name} kind="website" useHref={useHref} detailsHref={detailsHref}/>
 </article>}</TemplatePreviewDialog>;
}
