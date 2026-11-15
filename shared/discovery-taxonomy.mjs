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

const traditionAliases={christian:'christian',christianity:'christian',hindu:'hindu',hinduism:'hindu',muslim:'muslim',islam:'muslim',islamic:'muslim',interfaith:'interfaith'};
const settingAliases={church:'church',temple:'temple',garden:'garden',palace:'palace',royal:'palace',beach:'beach',minimal:'minimal',backwater:'backwater',backwaters:'backwater',courtyard:'courtyard'};
const tagAliases={floral:'floral',flowers:'floral',flower:'floral',pixar:'3d','pixar 3d':'3d','3d':'3d',toon:'toon',cartoon:'toon'};
const paletteNames=new Set(['ivory','sage','burgundy','gold','navy','blush']);
const occasionAliases={wedding:'wedding',weddings:'wedding',nikah:'nikah',walima:'walima',engagement:'engagement',reception:'reception',birthday:'birthday',housewarming:'housewarming',babyshower:'baby-shower'};
const saveTheDateIds=new Set(['film-drive-v1','film-savedate-v1']);
// Reviewed against each video's authored form, rather than guessing from its display name.
const weddingVideoIds=new Set(['temple-v1','kerala-christian-v1',...'drive temple vector garden tiles bollywood truckart kovil royal kerala veedu walk kurinji valli aranmanai gettimelam kondattam mandapam thottam jannal poonga roja malligai gopuram theppam chettinad kalyana avalum thamarai savedate kulam karaikudi hopon oonjal'.split(' ').map(id=>`film-${id}-v1`)]);
const birthdayVideoIds=new Set(['film-rajakumari-v1','film-rajakumaran-v1','film-ilavarasi-v1']);
const lookup=(values,key)=>Object.hasOwn(values,key)?values[key]:undefined;

export function normalizeDiscoverySearch(value=''){
 return value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}

/** @param {{id:string,tradition?:string}} template */
export function discoveryMetadata(template){
 const authored=lookup(discoveryTaxonomy,template.id);
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
 const terms=normalized.replace(/save the date/g,'savedate').replace(/baby shower/g,'babyshower').split(' ');
 const meta=discoveryMetadata(template);
 const text=normalizeDiscoverySearch([template.id,template.name,template.description,template.kind].filter(Boolean).join(' '));
 return terms.every(term=>{
  if(lookup(traditionAliases,term))return meta.tradition===lookup(traditionAliases,term);
  if(lookup(settingAliases,term)){
   const setting=lookup(settingAliases,term);
   return meta.setting===setting&&(setting!=='church'||meta.tradition==='christian')&&(setting!=='temple'||meta.tradition==='hindu');
  }
  if(paletteNames.has(term))return meta.palettes.includes(term);
  if(lookup(tagAliases,term))return meta.tags.includes(lookup(tagAliases,term));
  if(lookup(occasionAliases,term))return meta.occasions.includes(lookup(occasionAliases,term));
  if(term==='savedate')return saveTheDateIds.has(template.id);
  return text.includes(term);
 });
}

// One destination resolver for trending chips, category cards and footer links.
export function discoverySearchKind(value=''){
 return /^save the date(?: |$)/.test(normalizeDiscoverySearch(value))?'video':'website';
}

export function discoveryHref(value,kind=discoverySearchKind(value)){
 const key=normalizeDiscoverySearch(value);
 const params=new URLSearchParams();
 params.set('kind',kind);
 if(lookup(traditionAliases,key))params.set('tradition',lookup(traditionAliases,key));
 else if(lookup(settingAliases,key))params.set('setting',lookup(settingAliases,key));
 else if(key)params.set('q',key==='save the date'?'Save the Date':lookup(tagAliases,key)||key);
 return '/templates?'+params.toString();
}

export function matchesVideoSearch(template,query=''){
 const q=normalizeDiscoverySearch(query);
 if(q==='save the date')return saveTheDateIds.has(template.id);
 if(q==='wedding'||q==='weddings')return weddingVideoIds.has(template.id);
 if(q==='birthday'||q==='kids birthday')return birthdayVideoIds.has(template.id);
 if(q==='housewarming')return template.id==='film-velicham-v1';
 if(q==='engagement')return template.id==='film-walk-v1';
 return !q||normalizeDiscoverySearch(template.name+' '+template.id).includes(q);
}
