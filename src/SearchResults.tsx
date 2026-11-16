import {useMemo,useState} from 'react';
import {ChevronDown,Search} from 'lucide-react';
import {DiscoveryHeader,DiscoveryFooter} from './Discovery';
import {useCatalog} from './catalog';
import {useVideoCatalog} from './video/catalog';
import {VideoCard} from './video/VideoCollection';
import WebsiteCard from './WebsiteCard';
import {shopCard} from './shop';
import {previewLanguage} from './templates/preview-language';
import {matchesDiscoverySearch,matchesVideoSearch} from '../shared/discovery-taxonomy.mjs';
import {interleaveCatalogResults,invitationSearchHref,SEARCH_PAGE_SIZE} from '../shared/catalog-search.mjs';
import {useSearchMasonry} from './useSearchMasonry';
import './search-results.css';

export default function SearchResults(){
 const query=(new URLSearchParams(location.search).get('q')||'').trim();
 const language=previewLanguage();
 const websites=useCatalog(),videos=useVideoCatalog();
 const [limit,setLimit]=useState(SEARCH_PAGE_SIZE);
 const results=useMemo(()=>interleaveCatalogResults(
  websites.items.map(shopCard).filter(card=>matchesDiscoverySearch(card,query)),
  videos.entries.filter(entry=>matchesVideoSearch(entry,query))
 ),[websites.items,videos.entries,query]);
 const loading=websites.loading||videos.loading;
 const failed=Boolean(websites.error||videos.error);
 const shown=Math.min(limit,results.length);
 const masonry=useSearchMasonry(shown,loading);
 return <div className="di-app"><DiscoveryHeader/>
  <main id="main-content" className="di-main di-search-results">
   <header className="di-library-head">
    <p className="di-eyebrow">Search invitations</p>
    <h1>{query?<>Results for “{query}”</>:'Find your invitation.'}</h1>
    <form className="di-search" action="/search" method="get" role="search">
     <input name="q" defaultValue={query} aria-label="Search designs" placeholder="Search a design, occasion or style" enterKeyHint="search"/>
     <input type="hidden" name="lang" value={language}/>
     <button type="submit" aria-label="Search invitations"><Search size={21}/></button>
    </form>
    {query&&<a className="di-search-clear" href={invitationSearchHref('',language)}>Clear search</a>}
   </header>
   <div className="di-search-status" role="status" aria-live="polite">
    {loading?'Loading invitations…':failed?'Some results could not be loaded.':`${results.length} ${results.length===1?'invitation':'invitations'} found · Showing ${shown}`}
   </div>
   {websites.error&&<p role="alert">Website results could not load. <a href={invitationSearchHref(query,language)}>Try again</a></p>}
   {videos.error&&<p role="alert">Video results could not load. <button type="button" className="di-button di-secondary" onClick={()=>{void videos.retry();}}>Try again</button></p>}
   {!loading&&<>
    {results.length>0?<div ref={masonry} className="di-masonry di-search-grid" role="region" aria-label="Search results">
     {results.slice(0,limit).map(result=>{
      if(result.kind==='video')return <VideoCard key={'video:'+result.item.id} entry={result.item}/>;
      const card=result.item;
      const useHref=card.templateVersionId?'/personalise?'+new URLSearchParams({version:card.templateVersionId,lang:language}):'/form?'+new URLSearchParams({template:card.id,type:'wedding',new:'1'});
      return <WebsiteCard key={'website:'+card.id} card={card} language={language} useHref={useHref} detailsHref={'/templates?'+new URLSearchParams({product:card.id,lang:language})}/>;
     })}
    </div>:!failed&&<div className="di-empty"><h2>No invitations found</h2><p>Try a template number, another occasion or a different style.</p><a className="di-button di-secondary" href={invitationSearchHref('',language)}>Browse all invitations</a></div>}
    {shown<results.length&&<div className="di-search-more"><button type="button" className="di-button" onClick={()=>setLimit(current=>current+SEARCH_PAGE_SIZE)}>Load more <ChevronDown size={17} aria-hidden="true"/></button></div>}
   </>}
  </main><DiscoveryFooter/>
 </div>;
}
