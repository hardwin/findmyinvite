import * as React from 'react';
import {cva,type VariantProps} from 'class-variance-authority';
import {cn} from '@/akay/lib/utils';

const badgeVariants=cva(
 'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors',
 {
  variants:{
   variant:{
    default:'border-transparent bg-primary text-primary-foreground',
    secondary:'border-transparent bg-secondary text-secondary-foreground',
    outline:'text-foreground',
    success:'border-transparent bg-emerald-100 text-emerald-800',
    danger:'border-transparent bg-red-100 text-red-800'
   }
  },
  defaultVariants:{variant:'secondary'}
 }
);

export function Badge({className,variant,...props}:React.HTMLAttributes<HTMLDivElement>&VariantProps<typeof badgeVariants>){
 return <div className={cn(badgeVariants({variant}),className)} {...props}/>;
}
