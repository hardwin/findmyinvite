import {useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
export function ClearableField({children,label,value,onClear,disabled=false}:{children:ReactNode;label:string;value:unknown;onClear:()=>void;disabled?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 return <div className="tf-clearable" ref={ref}>{children}{!!value&&<button type="button" className="tf-clear" aria-label={'Clear '+label} disabled={disabled} onPointerDown={e=>e.preventDefault()} onClick={()=>{ref.current?.querySelector<HTMLInputElement|HTMLTextAreaElement>('input,textarea')?.focus({preventScroll:true});onClear();}}><X size={16}/></button>}</div>;
}
