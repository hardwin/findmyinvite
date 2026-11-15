import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flagshipTemplates} from '../shared/flagship-templates.mjs';
import {theeramTemplate} from '../shared/theeram-template.mjs';
import {thiruvarulTemplate} from '../shared/thiruvarul-template.mjs';
import {payanamTemplate} from '../shared/kalyana-payanam-template.mjs';
import {cinorevDesigns} from '../shared/cinorev-templates.mjs';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {discoveryTaxonomy,videoDiscoveryTaxonomy,discoveryMetadata,discoveryHref,matchesDiscoverySearch,matchesVideoSearch,filterVideoCatalog} from '../shared/discovery-taxonomy.mjs';
import {browseCategories} from '../shared/discovery-categories.mjs';
const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
// flagshipTemplates also registers Lace & Pearls and the five Digital Yes designs.
const websites=[...flagshipTemplates,theeramTemplate,thiruvarulTemplate,payanamTemplate,...cinorevDesigns];
const ids=items=>items.map(item=>item.id).sort();
const find=query=>ids(websites.filter(item=>matchesDiscoverySearch(item,query)));

test('every authored website has reviewed metadata matching its actual tradition',()=>{
 assert.equal(websites.length,28);
 assert.deepEqual(Object.keys(discoveryTaxonomy).sort(),ids(websites));
 for(const template of websites){
  const metadata=discoveryMetadata(template);
  assert.equal(metadata.tradition,template.tradition,template.id);
  assert.equal(discoveryTaxonomy[template.id].tradition,template.tradition,template.id);
  assert.ok(metadata.setting,template.id);
  assert.ok(metadata.palettes.length,template.id);
  assert.ok(matchesDiscoverySearch(template,template.name),template.name+' must remain searchable');
 }
});

test('Church excludes Moonlit Nikah and all other non-church designs',()=>{
 assert.deepEqual(find('Church'),['christian-bells']);
 assert.deepEqual(find(' CHURCH '),['christian-bells']);
 assert.deepEqual(find('Christian church'),['christian-bells']);
 assert.deepEqual(find('Muslim church'),[]);
 assert.deepEqual(find('Moonlit Nikah'),['moonlit-nikah']);
 assert.equal(discoveryMetadata({id:'moonlit-nikah'}).setting,'courtyard');
 assert.deepEqual(find('Temple'),['kalyana-payanam','kerala-lanterns','olai','pattu','temple-doors','thiruvarul']);
});

test('religion filters and aliases use catalog tradition rather than decorative words',()=>{
 for(const tradition of ['christian','hindu','muslim','interfaith'])assert.deepEqual(find(tradition),ids(websites.filter(t=>t.tradition===tradition)));
 assert.deepEqual(find('Christian'),['christian-bells','embroidered-garden','fresco','ivory-lace','mother-of-pearl','royal','stained-glass']);
 for(const alias of ['Islam','Islamic','Muslim'])assert.deepEqual(find(alias),['garden-curtains','moonlit-nikah','royal-crimson']);
 assert.deepEqual(find('Islam garden'),['garden-curtains']);
 assert.deepEqual(find('Islamic gold'),['moonlit-nikah','royal-crimson']);
 assert.deepEqual(find('Christian Hindu'),[]);
});

test('new or unclassified designs never silently become Christian, Church or Ivory',()=>{
 for(const id of ['new-design','constructor','toString','__proto__']){
  const unknown={id,name:'Ivory Grace',description:'Church, temple and Islamic decorations'};
  assert.equal(discoveryMetadata(unknown).tradition,'');
  assert.equal(discoveryMetadata(unknown).setting,'');
  assert.deepEqual(discoveryMetadata(unknown).palettes,[]);
  for(const query of ['church','christian','temple','muslim','ivory'])assert.equal(matchesDiscoverySearch(unknown,query),false);
 }
 assert.equal(discoveryMetadata({id:'new-design',tradition:'muslim'}).tradition,'muslim');
 assert.equal(matchesDiscoverySearch({id:'christian-bells',tradition:'muslim'},'church'),false);
});

test('style and occasion searches return the reviewed designs even without keywords in their names',()=>{
 assert.deepEqual(find('Royal'),find('Palace'));
 assert.deepEqual(find('Pixar 3D'),['kalyana-payanam','theeram','thiruvarul']);
 assert.deepEqual(find('Toon'),['kalyana-payanam','theeram','thiruvarul']);
 assert.deepEqual(find('Minimal'),['home-sweet-home','mother-of-pearl']);
 assert.deepEqual(find('baby-shower'),['little-blessing']);
 assert.deepEqual(find('Birthday'),['up-and-away']);
 assert.deepEqual(find('Housewarming'),['home-sweet-home']);
 assert.deepEqual(find('Engagement'),['garden-curtains','the-ring-box']);
 assert.deepEqual(find('Blush floral'),['garden-curtains','golden-hour','stained-glass','the-ring-box']);
 assert.deepEqual(find('flowers'),find('Floral'));
 assert.deepEqual(find('Theeram · Backwater Journey'),['theeram']);
 assert.deepEqual(find(''),ids(websites));
 assert.deepEqual(find('not an existing design'),[]);
});

test('every category, trending search and footer destination resolves to the same matching set',()=>{
 const categories=['christian','hindu','muslim','pixar','palace','toon','save-the-date'];
 const trending=json('../public/assets/trending/sources.json').map(c=>c.label);
 for(const query of [...categories,...trending]){
  const url=new URL(discoveryHref(query),'https://findmyinvite.com');
  const q=url.searchParams;
  assert.equal(url.pathname,'/templates');
  assert.equal(q.get('kind'),'all');
  const destination=websites.filter(item=>matchesDiscoverySearch(item,q.get('q')||''));
  const videos=VIDEO_CATALOG.filter(item=>matchesVideoSearch(item,q.get('q')||''));
  assert.deepEqual(ids(destination),find(query),query);
  assert.deepEqual(ids(videos),ids(VIDEO_CATALOG.filter(item=>matchesVideoSearch(item,query))),query);
  assert.ok(destination.length+videos.length,query+' should lead to populated results');
 }
});

test('Save the Date links and counts use actual video designs, not wedding countdown text',()=>{
 assert.deepEqual(find('Save the Date'),[]);
 for(const query of ['Save the Date','save-the-date',' SAVE   THE   DATE '])assert.deepEqual(ids(VIDEO_CATALOG.filter(video=>matchesVideoSearch(video,query))),['film-drive-v1','film-hopon-v1','film-karaikudi-v1','film-savedate-v1']);
 assert.deepEqual(ids(VIDEO_CATALOG.filter(video=>matchesVideoSearch(video,'Save the Date Drive'))),['film-drive-v1']);
 assert.equal(matchesVideoSearch({id:'film-tirumanam-v1',name:'Tamil Wedding'},'Tamil'),true);
});

test('homepage categories preserve format and occasion, including empty collections',()=>{
 for(const category of browseCategories){
  const url=new URL(discoveryHref(category.query,category.kind),'https://findmyinvite.com');
  assert.equal(url.searchParams.get('kind'),category.kind,category.label);
  const entries=category.kind==='video'?VIDEO_CATALOG:websites;
  const matches=category.kind==='video'?matchesVideoSearch:matchesDiscoverySearch;
  assert.deepEqual(ids(entries.filter(t=>matches(t,url.searchParams.get('q')||''))),ids(entries.filter(t=>matches(t,category.query))),category.label);
 }
 const videoIds=query=>ids(VIDEO_CATALOG.filter(t=>matchesVideoSearch(t,query)));
 assert.deepEqual(videoIds('Birthday'),['film-ilavarasi-v1','film-rajakumaran-v1','film-rajakumari-v1']);
 assert.deepEqual(videoIds('Housewarming'),['film-velicham-v1']);
 assert.deepEqual(videoIds('Engagement'),['film-walk-v1']);
 assert.equal(videoIds('Wedding').length,34);
 assert.deepEqual(videoIds('Baby Shower'),[]);
 assert.deepEqual(videoIds('Ear Piercing'),[]);
 assert.equal(matchesVideoSearch({id:'unreviewed-video',name:'New design'},'Wedding'),false);
});


test('video keywords use reviewed facets, full names and combinations',()=>{
 for(const entry of VIDEO_CATALOG){assert.ok(videoDiscoveryTaxonomy[entry.id],entry.id);assert.ok(matchesVideoSearch(entry,entry.name),entry.name);}
 for(const id of ['film-temple-v1','film-kovil-v1','film-valli-v1','film-mandapam-v1','film-gopuram-v1','film-chettinad-v1'])assert.ok(matchesVideoSearch(VIDEO_CATALOG.find(t=>t.id===id),'Temple'),id);
 assert.equal(matchesVideoSearch({id:'kerala-christian-v1',name:'Kerala Christian'},'Church'),true);
 assert.equal(matchesVideoSearch({id:'temple-v1',name:'Temple Wedding'},'Church'),false);
 assert.equal(matchesVideoSearch(VIDEO_CATALOG.find(t=>t.id==='film-garden-v1'),'Floral blush'),true);
 assert.equal(matchesVideoSearch(VIDEO_CATALOG.find(t=>t.id==='film-temple-v1'),'Temple videos'),true);
 assert.equal(matchesVideoSearch(VIDEO_CATALOG.find(t=>t.id==='film-temple-v1'),'Temple websites'),false);
 const matching=filterVideoCatalog(VIDEO_CATALOG,{query:'gold',setting:'temple',tradition:'hindu',sort:'name'});
 assert.ok(matching.length>5);
 assert.ok(matching.every(t=>matchesVideoSearch(t,'Hindu Temple Gold')));
 assert.deepEqual(matching.map(t=>t.name),matching.map(t=>t.name).sort((a,b)=>a.localeCompare(b)));
});

test('every browse category has reviewed occasion artwork rather than unrelated wedding couples',()=>{
 const images=json('../public/assets/categories/sources.json');
 for(const category of browseCategories){
  const image=images.find(t=>t.id===category.art);
  assert.ok(image,category.id);
  assert.ok(readFileSync(new URL('../public'+image.image,import.meta.url)).length,category.id);
  if(!category.id.startsWith('wedding-'))assert.ok(!/couple|shop-cat-/.test(image.image),category.id);
 }
 assert.match(images.find(t=>t.id==='birthday').image,/rajakumari/);
 assert.match(images.find(t=>t.id==='housewarming').image,/velicham/);
});
