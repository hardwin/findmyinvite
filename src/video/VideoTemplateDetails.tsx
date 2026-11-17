import {ArrowUpRight} from 'lucide-react';
import {VideoCard} from './VideoCollection';
import type {VideoEntry} from './catalog';
import TemplatePrice from '../TemplatePrice';
import TemplateShare from '../TemplateShare';
import {templateDetailsPath} from '../../shared/template-sharing.mjs';

export default function VideoTemplateDetails({entry}:{entry:VideoEntry}){
 return <><a className="di-back" href="/templates?kind=video">← Invitation videos</a>
  <section className="di-detail">
   <div className="di-detail-media di-detail-video"><VideoCard entry={entry}/></div>
   <div className="di-detail-copy">
    <p className="di-eyebrow">{entry.tier==='premium'?'Premium invitation video':'Invitation video'}</p>
    <h1>{entry.name}</h1><p className="di-template-code">{entry.templateCode}</p>
    <p>{entry.microDescription}</p>
    {entry.offerLabel&&<span className="di-offer-label">{entry.offerLabel}</span>}
    <h2><TemplatePrice amountPaise={entry.quote?.basePaise??entry.amount} originalPaise={entry.originalPaise??99900}/> <small>+ applicable tax</small></h2>
    <p>Personalise your names and event details, preview your invitation, then download your finished MP4. Edits and updated exports are included.</p>
    <a className="di-button" href={'/video-personalise?template='+encodeURIComponent(entry.id)}>Personalise this invitation <ArrowUpRight size={18}/></a>
    <TemplateShare name={entry.name} detailsHref={templateDetailsPath(entry.id,'video')}/>
    <p className="di-muted">Tap Play on the preview to see and hear this design.</p>
   </div>
  </section>
 </>;
}
