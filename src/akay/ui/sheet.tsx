import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {cn} from '@/akay/lib/utils';
import {Button} from '@/akay/ui/button';

export const Sheet=DialogPrimitive.Root;
export const SheetTrigger=DialogPrimitive.Trigger;
export const SheetClose=DialogPrimitive.Close;

export function SheetContent({className,children,...props}:React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>){
 return (
  <DialogPrimitive.Portal>
   <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out"/>
   <DialogPrimitive.Content className={cn('fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-3 border-l bg-background p-4 shadow-lg outline-none',className)} {...props}>
    {children}
    <DialogPrimitive.Close asChild>
     <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Close"><X/></Button>
    </DialogPrimitive.Close>
   </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
 );
}

export function SheetHeader({className,...props}:React.HTMLAttributes<HTMLDivElement>){
 return <div className={cn('flex flex-col gap-1 pr-8',className)} {...props}/>;
}
export function SheetTitle({className,...props}:React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>){
 return <DialogPrimitive.Title className={cn('text-base font-semibold',className)} {...props}/>;
}
