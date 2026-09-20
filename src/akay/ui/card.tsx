import * as React from 'react';
import {cn} from '@/akay/lib/utils';

export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){
 return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm',className)} {...props}/>;
}
export function CardHeader({className,...props}:React.HTMLAttributes<HTMLDivElement>){
 return <div className={cn('flex flex-col gap-1 p-3',className)} {...props}/>;
}
export function CardTitle({className,...props}:React.HTMLAttributes<HTMLHeadingElement>){
 return <h3 className={cn('text-sm font-semibold leading-none tracking-tight',className)} {...props}/>;
}
export function CardDescription({className,...props}:React.HTMLAttributes<HTMLParagraphElement>){
 return <p className={cn('text-xs text-muted-foreground',className)} {...props}/>;
}
export function CardContent({className,...props}:React.HTMLAttributes<HTMLDivElement>){
 return <div className={cn('p-3 pt-0',className)} {...props}/>;
}
