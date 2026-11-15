// Storefront metadata only. Keep renderer/version bindings and invitation copy untouched.
// Review this registry when publishing a design; unknown designs receive no guessed category.
const entry=(tradition,setting,palettes,tags=[],occasions=['wedding'])=>({tradition,setting,palettes,tags,occasions});
export const discoveryTaxonomy={
 'christian-bells':entry('christian','church',['ivory','sage','gold']),
 'kerala-lanterns':entry('hindu','temple',['gold']),
 'moonlit-nikah':entry('muslim','courtyard',['navy','gold'],[],['wedding','nikah','walima']),
 'ivory-lace':entry('christian','garden',['ivory','burgundy'],['floral']),
 'embroidered-garden':entry('christian','garden',['sage','ivory'],['floral']),
 'mother-of-pearl':entry('christian','minimal',['ivory','gold'],['floral']),
 'fresco':entry('christian','beach',['ivory','sage']),
 'stained-glass':entry('christian','garden',['ivory','blush','sage'],['floral']),
 'royal':entry('christian','palace',['ivory','gold']),
 'theeram':entry('hindu','backwater',['sage','gold'],['3d','toon']),
 'thiruvarul':entry('hindu','temple',['gold'],['3d','toon']),
 'kalyana-payanam':entry('hindu','temple',['gold','blush'],['3d','toon']),
 'midnight-stage':entry('hindu','palace',['gold']),
 'little-blessing':entry('hindu','garden',['ivory','gold'],['floral'],['baby-shower']),
 'noir-and-gold':entry('hindu','beach',['gold','ivory'],['floral']),
 'golden-hour':entry('hindu','palace',['gold','blush'],['floral']),
 'pearl-and-sapphire':entry('hindu','palace',['ivory','gold']),
 'royal-crimson':entry('muslim','palace',['burgundy','gold'],[],['wedding','walima','reception']),
 'garden-curtains':entry('muslim','garden',['sage','ivory','blush'],['floral'],['engagement']),
 'pulli':entry('hindu','beach',['ivory']),
 'pattu':entry('hindu','temple',['burgundy','gold']),
 'olai':entry('hindu','temple',['gold']),
 'jasmine-arch':entry('hindu','garden',['gold','ivory'],['floral']),
 'palace-of-lights':entry('hindu','palace',['navy','gold']),
 'the-ring-box':entry('hindu','garden',['blush','ivory'],['floral'],['engagement']),
 'home-sweet-home':entry('hindu','minimal',['ivory','sage'],[],['housewarming']),
 'up-and-away':entry('hindu','garden',['blush','gold'],[],['birthday']),
 'temple-doors':entry('hindu','temple',['burgundy','gold'])
};

// Reviewed against the authored video posters and supported occasions. These facets
// let descriptive searches find designs whose titles are in Tamil or use a brand name.
export const videoDiscoveryTaxonomy={
 'temple-v1':entry('hindu','temple',['gold','blush'],['floral','3d','toon']),
 'kerala-christian-v1':entry('christian','church',['ivory','gold']),
 'film-drive-v1':entry('hindu','', ['sage'],['3d','toon']),
 'film-temple-v1':entry('hindu','temple',['gold','burgundy']),
 'film-vector-v1':entry('hindu','', ['ivory','gold'],['toon','floral']),
 'film-garden-v1':entry('hindu','garden',['ivory','blush'],['floral','3d','toon']),
 'film-tiles-v1':entry('','minimal',['ivory','gold']),
 'film-bollywood-v1':entry('hindu','', ['gold','burgundy'],['toon']),
 'film-truckart-v1':entry('hindu','', ['gold'],['toon','floral']),
 'film-kovil-v1':entry('hindu','temple',['ivory','gold'],['toon']),
 'film-royal-v1':entry('hindu','palace',['gold','burgundy'],['toon']),
 'film-kerala-v1':entry('hindu','backwater',['gold','blush'],['toon']),
 'film-veedu-v1':entry('hindu','courtyard',['gold']),
 'film-walk-v1':entry('','garden',['sage','blush'],['floral'],['wedding','engagement']),
 'film-kurinji-v1':entry('hindu','temple',['gold','burgundy']),
 'film-valli-v1':entry('hindu','temple',['gold']),
 'film-aranmanai-v1':entry('hindu','palace',['gold']),
 'film-gettimelam-v1':entry('hindu','', ['blush','gold'],['floral']),
 'film-kondattam-v1':entry('hindu','garden',['ivory','blush'],['floral']),
 'film-mandapam-v1':entry('hindu','temple',['gold','burgundy']),
 'film-thottam-v1':entry('hindu','garden',['ivory','sage'],['floral']),
 'film-jannal-v1':entry('hindu','temple',['gold','burgundy']),
 'film-poonga-v1':entry('hindu','palace',['blush','gold'],['garden','floral']),
 'film-roja-v1':entry('hindu','garden',['ivory','blush'],['floral']),
 'film-malligai-v1':entry('hindu','garden',['gold','ivory'],['floral']),
 'film-gopuram-v1':entry('hindu','temple',['gold']),
 'film-theppam-v1':entry('hindu','temple',['gold','blush']),
 'film-chettinad-v1':entry('hindu','temple',['gold']),
 'film-kalyana-v1':entry('hindu','', ['ivory','sage'],['toon']),
 'film-avalum-v1':entry('hindu','garden',['ivory','sage'],['toon']),
 'film-thamarai-v1':entry('hindu','temple',['burgundy','gold'],['floral']),
 'film-savedate-v1':entry('hindu','courtyard',['gold']),
 'film-kulam-v1':entry('hindu','garden',['navy','sage'],['floral']),
 'film-karaikudi-v1':entry('hindu','courtyard',['sage','ivory']),
 'film-hopon-v1':entry('hindu','courtyard',['gold','blush']),
 'film-oonjal-v1':entry('hindu','courtyard',['sage','gold'],['toon']),
 'film-rajakumari-v1':entry('','palace',['blush','gold'],[],['birthday']),
 'film-rajakumaran-v1':entry('','palace',['ivory','gold'],[],['birthday']),
 'film-ilavarasi-v1':entry('','minimal',['ivory','blush','gold'],['floral'],['birthday']),
 'film-velicham-v1':entry('hindu','courtyard',['navy','gold'],[],['housewarming'])
};

const traditionAliases={christian:'christian',christianity:'christian',hindu:'hindu',hinduism:'hindu',muslim:'muslim',islam:'muslim',islamic:'muslim',interfaith:'interfaith'};
const settingAliases={church:'church',temple:'temple',garden:'garden',palace:'palace',royal:'palace',beach:'beach',minimal:'minimal',backwater:'backwater',backwaters:'backwater',courtyard:'courtyard'};
const tagAliases={floral:'floral',flowers:'floral',flower:'floral',pixar:'3d','pixar 3d':'3d','3d':'3d',toon:'toon',cartoon:'toon'};
const paletteNames=new Set(['ivory','sage','burgundy','gold','navy','blush']);
const occasionAliases={wedding:'wedding',weddings:'wedding',nikah:'nikah',walima:'walima',engagement:'engagement',reception:'reception',birthday:'birthday',housewarming:'housewarming',babyshower:'baby-shower'};
const saveTheDateIds=new Set(['film-drive-v1','film-savedate-v1','film-karaikudi-v1','film-hopon-v1']);
const lookup=(values,key)=>Object.hasOwn(values,key)?values[key]:undefined;

export function normalizeDiscoverySearch(value=''){
 return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}

/** @param {{id:string,tradition?:string}} template */
export function discoveryMetadata(template){
 const authored=lookup(discoveryTaxonomy,template.id)||lookup(videoDiscoveryTaxonomy,template.id);
 // Public catalog tradition is authoritative. Never infer a religion from a colour or name.
 const tradition=lookup(traditionAliases,template.tradition)||authored?.tradition||'';
 return {tradition,setting:authored?.setting||'',palettes:authored?.palettes||[],tags:authored?.tags||[],occasions:authored?.occasions||[]};
}

/** Match catalog facets deliberately, then use free text for names and other descriptive terms.
 * @param {{id:string,name?:string,description?:string,tradition?:string,kind?:string}} template
 */
export function matchesDiscoverySearch(template,query=''){
 const normalized=normalizeDiscoverySearch(query);
 if(!normalized)return true;
 const terms=normalized.replace(/save the date/g,'savedate').replace(/baby shower/g,'babyshower').replace(/kids birthday/g,'birthday').split(' ');
 const meta=discoveryMetadata(template);
 const text=normalizeDiscoverySearch([template.id,template.name,template.description,template.kind].filter(Boolean).join(' '));
 return terms.every(term=>{
  if(lookup(traditionAliases,term))return meta.tradition===lookup(traditionAliases,term);
  if(lookup(settingAliases,term)){
   const setting=lookup(settingAliases,term);
   return (meta.setting===setting||meta.tags.includes(setting))&&(setting!=='church'||meta.tradition==='christian')&&(setting!=='temple'||meta.tradition==='hindu');
  }
  if(paletteNames.has(term))return meta.palettes.includes(term);
  if(lookup(tagAliases,term))return meta.tags.includes(lookup(tagAliases,term));
  if(lookup(occasionAliases,term))return meta.occasions.includes(lookup(occasionAliases,term));
  if(term==='savedate')return saveTheDateIds.has(template.id);
  if(['invitation','invitations','template','templates'].includes(term))return true;
  if(term==='video'||term==='videos')return template.kind==='video';
  if(term==='website'||term==='websites')return template.kind==='website'||Boolean(lookup(discoveryTaxonomy,template.id));
  return text.includes(term);
 });
}

// One destination resolver for trending chips, category cards and footer links.
export function discoveryHref(value,kind='all'){
 const key=normalizeDiscoverySearch(value);
 const params=new URLSearchParams();
 params.set('kind',kind);
 if(key)params.set('q',key==='save the date'?'Save the Date':lookup(traditionAliases,key)||lookup(settingAliases,key)||lookup(tagAliases,key)||key);
 return '/templates?'+params.toString();
}

export function matchesVideoSearch(template,query=''){
 return matchesDiscoverySearch({...template,kind:'video'},query);
}

export function filterVideoCatalog(entries,{query='',tradition='all',setting='all',collection='all',sort='default'}={}){
 const visible=entries.filter(entry=>(collection==='all'||entry.tier===collection)&&matchesVideoSearch(entry,query)&&(tradition==='all'||matchesVideoSearch(entry,tradition))&&(setting==='all'||matchesVideoSearch(entry,setting)));
 return sort==='name'?visible.sort((a,b)=>a.name.localeCompare(b.name)):visible;
}
