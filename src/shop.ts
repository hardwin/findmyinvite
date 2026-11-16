import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
import {galleryTierFor,galleryTierLabels,type GalleryTier} from './data';
import {discoveryMetadata,matchesDiscoverySearch} from '../shared/discovery-taxonomy.mjs';

export type ShopKind='website'|'video';
export type Tradition='christian'|'hindu'|'muslim'|'interfaith';
export type Palette='ivory'|'sage'|'burgundy'|'gold'|'navy'|'blush';
export type Setting='backwater'|'church'|'garden'|'temple'|'palace'|'beach'|'minimal'|'courtyard';
export type ShopTemplate={
 templateCode?:string;
 microDescription?:string;
 templateVersionId?:string;
 tradition?:Tradition;
 pricePaise?:number;
 id:string;
 name:string;
 description:string;
 badge?:string;
 royal?:boolean;
 tier:GalleryTier;
 color?:string;
 image?:string;
 video?:string;
};

export const shopKinds:Array<[ShopKind,string]>=[['website','Wedding Websites'],['video','Invitation Videos']];
export const traditions:Array<[Tradition,string]>=[['christian','Christian'],['hindu','Hindu'],['muslim','Islam'],['interfaith','Interfaith']];
export const palettes:Array<[Palette,string]>=[['ivory','Ivory'],['sage','Sage'],['burgundy','Burgundy'],['gold','Gold'],['navy','Navy'],['blush','Blush']];
export const settings:Array<[Setting,string]>=[['backwater','Backwaters'],['church','Church'],['garden','Garden'],['temple','Temple'],['palace','Palace'],['beach','Beach'],['minimal','Minimal'],['courtyard','Courtyard']];
export const occasionAisles:Array<[string,string]>=[
 ['wedding','Wedding'],
 ['engagement','Engagement'],
 ['wedding-reception','Wedding & Reception'],
 ['reception','Reception'],
 ['birthday','Birthday'],
 ['anniversary','Anniversary'],
 ['housewarming','Housewarming'],
 ['baby-shower','Baby shower'],
 ['party','Party'],
 ['opening-ceremony','Opening'],
 ['custom','Custom']
];
export type ShopAisle='kind'|'occasion'|'tradition'|'collection'|'setting';

export function templateKind(template:{royal?:boolean;video?:string}):ShopKind{
 return template.royal&&template.video?'video':'website';
}

export function templateTradition(template:Pick<ShopTemplate,'id'|'name'|'tradition'>):Tradition|''{
 return discoveryMetadata(template).tradition as Tradition|'';
}

export function templateSetting(template:Pick<ShopTemplate,'id'|'name'>):Setting|''{
 return discoveryMetadata(template).setting as Setting|'';
}

export function templatePalette(template:Pick<ShopTemplate,'id'|'name'>):Palette|''{
 return (discoveryMetadata(template).palettes[0]||'') as Palette|'';
}

export function templatePricePaise(template:{royal?:boolean;tier?:string}):number{
 return INVITATION_BASE_PAISE;
}

export function formatRupees(paise:number){
 return '₹'+(paise/100).toLocaleString('en-IN');
}

export function skuFor(template:{royal?:boolean;tier?:string;video?:string}):'website-classic'|'website-royal'|'video-royal'{
 if(templateKind(template)==='video')return 'video-royal';
 return template.royal||template.tier==='premium'||template.tier==='elite'?'website-royal':'website-classic';
}

export function shopCard(template:ShopTemplate){
 return {
  ...template,
  tier:template.tier||galleryTierFor(template.id,Boolean(template.royal)),
  kind:templateKind(template),
  tradition:template.tradition||templateTradition(template),
  setting:templateSetting(template),
  palette:templatePalette(template),
  pricePaise:template.pricePaise??templatePricePaise(template),
  sku:skuFor(template)
 };
}

export type ShopFilters={
 kind:ShopKind;
 tradition:Tradition|'all';
 collection:GalleryTier|'all';
 palette:Palette|'all';
 setting:Setting|'all';
 type:string;
 query:string;
};

export function defaultShopFilters(kind:ShopKind='website'):ShopFilters{
 return {kind,tradition:'all',collection:'all',palette:'all',setting:'all',type:'wedding',query:''};
}

export function listingTitle(filters:ShopFilters,aisle:ShopAisle|'all'){
 if(filters.query)return filters.query;
 if(aisle==='kind')return filters.kind==='video'?'Invitation Videos':'Wedding Websites';
 if(aisle==='tradition')return (traditions.find(([id])=>id===filters.tradition)||['','All traditions'])[1];
 if(aisle==='collection')return filters.collection==='all'?'All collections':galleryTierLabels[filters.collection];
 if(aisle==='setting')return (settings.find(([id])=>id===filters.setting)||['','All settings'])[1];
 return (occasionAisles.find(([id])=>id===filters.type)||['','E-invites'])[1];
}

export function filterShop(items:ShopTemplate[],filters:ShopFilters){
 const q=filters.query.trim().toLowerCase();
 return items.map(shopCard).filter(item=>{
  if(item.kind!==filters.kind)return false;
  if(filters.tradition!=='all'&&!matchesDiscoverySearch(item,filters.tradition))return false;
  if(filters.collection!=='all'&&item.tier!==filters.collection)return false;
  if(filters.palette!=='all'&&!discoveryMetadata(item).palettes.includes(filters.palette))return false;
  if(filters.setting!=='all'&&!matchesDiscoverySearch(item,filters.setting))return false;
  if(!matchesDiscoverySearch(item,q))return false;
  return true;
 });
}
