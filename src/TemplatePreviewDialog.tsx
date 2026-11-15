import {useRef,useState,type ReactNode} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Expand,X} from 'lucide-react';

export default function TemplatePreviewDialog({name,children}:{name:string;children:ReactNode}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const position=useRef({x:0,y:0});
 return <Dialog.Root open={open} onOpenChange={value=>{
  if(value){position.current={x:window.scrollX,y:window.scrollY};window.dispatchEvent(new Event('catalog-stop-all'));}
  setOpen(value);
 }}>
  <Dialog.Trigger asChild><button ref={trigger} type="button" className="di-card-expand" aria-label={'Expand '+name} title="Expand preview"><Expand size={18}/></button></Dialog.Trigger>
  <Dialog.Portal>
   <Dialog.Overlay className="di-fullscreen-overlay"/>
   <Dialog.Content className="di-app di-fullscreen" aria-describedby={undefined} onCloseAutoFocus={event=>{
    event.preventDefault();trigger.current?.focus({preventScroll:true});
    requestAnimationFrame(()=>window.scrollTo({left:position.current.x,top:position.current.y,behavior:'instant'}));
   }}>
    <Dialog.Title className="di-sr-only">{name} fullscreen preview</Dialog.Title>
    <Dialog.Close asChild><button type="button" className="di-fullscreen-close" aria-label="Close fullscreen preview"><X size={22}/><span>Close</span></button></Dialog.Close>
    <div className="di-fullscreen-stage">{children}</div>
   </Dialog.Content>
  </Dialog.Portal>
 </Dialog.Root>;
}
