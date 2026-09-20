import * as React from 'react';
import {cn} from '@/akay/lib/utils';

export function Progress({value=0,className,label}:{value?:number;className?:string;label?:string}){
 const pct=Math.max(0,Math.min(100,Number(value)||0));
 return (
  <div className={cn('space-y-1',className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label||'Progress'}>
   {label&&<p className="text-xs text-muted-foreground">{label}</p>}
   <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
    <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{width:pct+'%'}}/>
   </div>
  </div>
 );
}
