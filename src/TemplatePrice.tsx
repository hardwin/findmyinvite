import {formatRupees} from './shop';
export default function TemplatePrice({amountPaise,originalPaise}:{amountPaise:number;originalPaise?:number}){
 const label=amountPaise===0?'Free':formatRupees(amountPaise);
 return <span className="fmi-price"><strong className="fmi-price-current" aria-label={'Price '+label}>{label}</strong>{amountPaise>0&&originalPaise!==undefined&&originalPaise>amountPaise&&<del className="fmi-price-original" aria-label={'Original price '+formatRupees(originalPaise)}>{formatRupees(originalPaise)}</del>}</span>;
}
