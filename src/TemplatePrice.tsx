import {formatRupees} from './shop';
export default function TemplatePrice({amountPaise,originalPaise}:{amountPaise:number;originalPaise?:number}){
 return <span className="fmi-price"><strong className="fmi-price-current" aria-label={'Price '+formatRupees(amountPaise)}>{formatRupees(amountPaise)}</strong>{originalPaise!==undefined&&originalPaise>amountPaise&&<del className="fmi-price-original" aria-label={'Original price '+formatRupees(originalPaise)}>{formatRupees(originalPaise)}</del>}</span>;
}
