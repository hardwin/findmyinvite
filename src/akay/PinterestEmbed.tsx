import {useEffect,useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {cn} from '@/akay/lib/utils';

function mshot(url:string){
 if(!url||!/^https?:\/\//i.test(url))return '';
 return 'https://s.wordpress.com/mshots/v1/'+encodeURIComponent(url)+'?w=720&vpw=390&vph=844';
}

/** Pinterest search embed; falls back to Unsplash mshots when framing is blocked. */
export default function PinterestEmbed({
 pinterestUrl,
 unsplashUrl,
 title,
 className
}:{pinterestUrl:string;unsplashUrl?:string;title:string;className?:string}){
 const [blocked,setBlocked]=useState(false);
 const fallback=unsplashUrl?mshot(unsplashUrl):'';

 useEffect(()=>{
  setBlocked(false);
  const timer=window.setTimeout(()=>setBlocked(true),2500);
  return()=>window.clearTimeout(timer);
 },[pinterestUrl]);

 if(!pinterestUrl){
  return <div className={cn('flex aspect-video items-center justify-center rounded-md border bg-muted text-[10px] text-muted-foreground',className)}>No ref</div>;
 }

 return (
  <div className={cn('relative overflow-hidden rounded-md border bg-muted',className)}>
   {!blocked?(
    <iframe
     title={title}
     src={pinterestUrl}
     className="aspect-video h-full w-full min-h-[120px] border-0"
     loading="lazy"
     referrerPolicy="no-referrer"
     sandbox="allow-scripts allow-same-origin allow-popups"
    />
   ):(
    <div className="relative aspect-video w-full">
     {fallback?(
      <img src={fallback} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>
     ):(
      <div className="flex h-full min-h-[120px] items-center justify-center text-[10px] text-muted-foreground">Preview</div>
     )}
     <a
      href={pinterestUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground"
     >
      Open Pinterest <ExternalLink className="size-3"/>
     </a>
    </div>
   )}
  </div>
 );
}
