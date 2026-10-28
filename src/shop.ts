import {galleryTierFor,type GalleryTier} from './data';

export type ShopKind='website'|'video';
export type Tradition='christian'|'hindu'|'muslim'|'interfaith';
export type Palette='ivory'|'sage'|'burgundy'|'gold'|'navy'|'blush';
export type Setting='church'|'garden'|'temple'|'palace'|'beach'|'minimal';
export type ShopTemplate={
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

export const shopKinds:Array<[ShopKind,string]>=[['website','Wedding Websites'],['video','Wedding Invitation Videos']];
export const traditions:Array<[Tradition,string]>=[['christian','Christian'],['hindu','Hindu'],['muslim','Muslim'],['interfaith','Interfaith']];
export const palettes:Array<[Palette,string]>=[['ivory','Ivory'],['sage','Sage'],['burgundy','Burgundy'],['gold','Gold'],['navy','Navy'],['blush','Blush']];
export const settings:Array<[Setting,string]>=[['church','Church'],['garden','Garden'],['temple','Temple'],['palace','Palace'],['beach','Beach'],['minimal','Minimal']];

const hinduHint=/temple|sanctuary|sita|kalyanam|ponmaalai|gopuram|mehendi|sangeet|heritage-wedding|royal-temple|tamil ponnu/i;
const muslimHint=/nikah|moonlit|jaali/i;
const churchHint=/church|grace|crest|ivory|minimal|white forest|nuptial/i;
const gardenHint=/garden|blush|pink|jasmine|floral|grace/i;
const beachHint=/beach/i;
const palaceHint=/palace|royal|prestige|majesty|heritage|legacy/i;
const sageHint=/sage|grace|forest|emerald/i;
const burgundyHint=/burgundy|crimson|legacy|velvet/i;
const navyHint=/navy|minimal|noir|majesty/i;
const blushHint=/blush|pink|rose/i;
const goldHint=/gold|ivory|elegance|temple|sanctuary/i;

export function templateKind(template:{royal?:boolean;video?:string}):ShopKind{
 return template.royal&&template.video?'video':'website';
}

export function templateTradition(template:Pick<ShopTemplate,'id'|'name'>):Tradition{
 const hay=template.id+' '+template.name;
 if(muslimHint.test(hay))return 'muslim';
 if(hinduHint.test(hay))return 'hindu';
 return 'christian';
}

export function templateSetting(template:Pick<ShopTemplate,'id'|'name'>):Setting{
 const hay=template.id+' '+template.name;
 if(beachHint.test(hay))return 'beach';
 if(/temple|sanctuary|gopuram/i.test(hay))return 'temple';
 if(churchHint.test(hay)&&!hinduHint.test(hay))return 'church';
 if(gardenHint.test(hay))return 'garden';
 if(/modern-minimal|minimal/i.test(hay))return 'minimal';
 if(palaceHint.test(hay))return 'palace';
 return 'church';
}

export function templatePalette(template:Pick<ShopTemplate,'id'|'name'>):Palette{
 const hay=template.id+' '+template.name;
 if(sageHint.test(hay))return 'sage';
 if(burgundyHint.test(hay))return 'burgundy';
 if(navyHint.test(hay))return 'navy';
 if(blushHint.test(hay))return 'blush';
 if(goldHint.test(hay))return 'gold';
 return 'ivory';
}

export function templatePricePaise(template:{royal?:boolean;tier?:string}):number{
 return template.royal||template.tier==='premium'||template.tier==='elite'?149900:119900;
}

export function formatRupees(paise:number){
 return '₹'+(paise/100).toLocaleString('en-IN');
}

export function skuFor(template:{royal?:boolean;tier?:string;video?:string}):'website-classic'|'website-royal'|'video-royal'{
 if(templateKind(template)==='video')return 'video-royal';
 return templatePricePaise(template)===119900?'website-classic':'website-royal';
}

export function shopCard(template:ShopTemplate){
 return {
  ...template,
  tier:template.tier||galleryTierFor(template.id,Boolean(template.royal)),
  kind:templateKind(template),
  tradition:templateTradition(template),
  setting:templateSetting(template),
  palette:templatePalette(template),
  pricePaise:templatePricePaise(template),
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
 return {kind,tradition:kind==='website'?'christian':'all',collection:'all',palette:'all',setting:'all',type:'wedding',query:''};
}

export function filterShop(items:ShopTemplate[],filters:ShopFilters){
 const q=filters.query.trim().toLowerCase();
 return items.map(shopCard).filter(item=>{
  if(item.kind!==filters.kind)return false;
  if(filters.tradition!=='all'&&item.tradition!==filters.tradition)return false;
  if(filters.collection!=='all'&&item.tier!==filters.collection)return false;
  if(filters.palette!=='all'&&item.palette!==filters.palette)return false;
  if(filters.setting!=='all'&&item.setting!==filters.setting)return false;
  if(q&&!(item.name+' '+item.description).toLowerCase().includes(q))return false;
  return true;
 });
}
