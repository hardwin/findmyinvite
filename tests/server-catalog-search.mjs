import test from 'node:test';
import assert from 'node:assert/strict';
import {interleaveCatalogResults,invitationSearchHref,SEARCH_PAGE_SIZE} from '../shared/catalog-search.mjs';
import {guestDecision,isGuestInvitationPath,pageHeaders} from '../server/guest-page.mjs';
import {reserved} from '../server/core.mjs';

test('typed search URLs keep punctuation, template numbers and language without catalogue filters',()=>{
 for(const query of [' wedding ','FMI#0010','Rose & Gold','திருமணம்','<script>']){
  const url=new URL(invitationSearchHref(query,'ta'),'https://findmyinvite.com');
  assert.equal(url.pathname,'/search');assert.equal(url.searchParams.get('q'),query.trim());assert.equal(url.searchParams.get('lang'),'ta');
  assert.equal(url.searchParams.has('kind'),false);assert.equal(url.hash,'');
 }
 assert.equal(invitationSearchHref('   '),'/search');
});

test('one mixed result list preserves both source orders and all remaining designs',()=>{
 const websites=Array.from({length:28},(_,i)=>({id:'w'+i})),videos=Array.from({length:39},(_,i)=>({id:'v'+i}));
 const results=interleaveCatalogResults(websites,videos);
 assert.equal(results.length,67);assert.equal(new Set(results.map(r=>r.kind+':'+r.item.id)).size,67);
 assert.deepEqual(results.slice(0,SEARCH_PAGE_SIZE).map(r=>r.kind),Array.from({length:SEARCH_PAGE_SIZE},(_,i)=>i%2?'video':'website'));
 assert.deepEqual(results.filter(r=>r.kind==='website').map(r=>r.item),websites);
 assert.deepEqual(results.filter(r=>r.kind==='video').map(r=>r.item),videos);
 assert.deepEqual([...results.slice(0,24),...results.slice(24,48),...results.slice(48)],results);
 assert.deepEqual(interleaveCatalogResults([],videos).map(r=>r.item),videos);
 assert.deepEqual(interleaveCatalogResults(websites,[]).map(r=>r.item),websites);
 assert.deepEqual(interleaveCatalogResults([],[]),[]);
});

test('direct search requests are storefront pages rather than customer invitation slugs',async()=>{
 assert.ok(reserved.has('search'));
 for(const path of ['/search','/search/','/search?q=wedding']){
  assert.equal(isGuestInvitationPath(path),false);
  assert.equal((await guestDecision(path)).gate,'skip');
 }
 assert.equal(pageHeaders('skip','search')['X-Robots-Tag'],'noindex, nofollow');
});
