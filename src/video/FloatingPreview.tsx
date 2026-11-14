import {useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode} from 'react';
import {ArrowLeft, Maximize2, Pause, Play, X} from 'lucide-react';
import type {EditorViewport} from './editor-ui';

type Props = {children: ReactNode; expanded: boolean; onExpandedChange: (expanded: boolean) => void; playing: boolean; ready: boolean; onPlay: () => void; view:EditorViewport; footerHeight:number; hidden:boolean; onHide:()=>void};
type Point = {x: number; y: number};
/** The existing canvas stays mounted: resizing the preview never reloads the video. */
export function FloatingPreview({children, expanded, onExpandedChange, playing, ready, onPlay, view, footerHeight, hidden, onHide}: Props) {
 const panel = useRef<HTMLElement>(null), expandButton = useRef<HTMLButtonElement>(null), closeButton = useRef<HTMLButtonElement>(null);
 const drag = useRef<{id: number; x: number; y: number; origin: Point} | null>(null);
 const mobile=view.mobile;
 const [position, setPosition] = useState<Point | null>(null);
 // Size follows field focus, not the changing viewport ratio during keyboard animation.
 const width = view.field ? 88 : 112;
 let height = width * 16 / 9;
 const bottomSpace = footerHeight + 12;
 const clamp = (p: Point): Point => ({x: Math.max(view.left + 8, Math.min(p.x, view.left + view.width - width - 8)), y: Math.max(view.top + 8, Math.min(p.y, view.top + view.height - height - bottomSpace))});
 let point = clamp(position || {x: view.left + view.width - width - 12, y: view.top + view.height - height - bottomSpace});
 // Prefer free space around controls, especially upload/retry/remove icons. The
 // candidate positions do not alter layout, so scrolling cannot cause a resize loop.
 if(mobile&&!position&&!view.field&&view.obstacles.length){
  const top=view.top+132,bottom=view.top+view.height-height-bottomSpace;
  const candidates=[point,...[view.left+8,view.left+(view.width-width)/2,view.left+view.width-width-12].flatMap(x=>[top,(top+bottom)/2,bottom].map(y=>clamp({x,y})))];
  const score=(p:Point)=>view.obstacles.reduce((n,r)=>n+Math.max(0,Math.min(p.x+width,r.right+5)-Math.max(p.x,r.left-5))*Math.max(0,Math.min(p.y+height,r.bottom+5)-Math.max(p.y,r.top-5))*10,0)+Math.abs(p.x-point.x)+Math.abs(p.y-point.y);
  point=candidates.reduce((best,p)=>score(p)<score(best)?p:best,point);
 }
 const field = view.field;
 if (field && field.right > point.x && field.left < point.x + width && field.bottom > point.y - 8 && field.top < point.y + height + 8) {
  const above = field.top - view.top - 16, below = view.top + view.height - bottomSpace - field.bottom - 8;
  // A field in the middle of a short viewport may leave less than one full PiP above or below it.
  // Fit the film inside that gap while keeping both 44px controls and the canvas buffer intact.
  height = Math.max(88, Math.min(height, Math.floor(Math.max(above, below))));
  // Move only the overlay. Native keyboard scrolling owns the document position.
  point = clamp({x: point.x, y: above >= height || above > below ? field.top - height - 8 : field.bottom + 8});
 }

 useEffect(() => {
  if (!expanded) return;
  const previous = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  closeButton.current?.focus({preventScroll: true});
  return () => {document.body.style.overflow = previous; expandButton.current?.focus({preventScroll: true});};
 }, [mobile, expanded, onExpandedChange]);

 function pointerDown(e: PointerEvent<HTMLElement>) {
  if (!mobile || expanded || !(e.target instanceof Element) || !e.target.closest('.vp-film') || e.target.closest('button')) return;
  drag.current = {id: e.pointerId, x: e.clientX, y: e.clientY, origin: point};
  e.currentTarget.setPointerCapture(e.pointerId);
 }
 const style: CSSProperties | undefined = expanded ? {left: view.left, top: view.top, width: view.width, height: view.height, '--vp-viewport-height': view.height + 'px'} as CSSProperties : mobile ? {left: point.x, top: point.y, width, '--vp-film-height': height + 'px'} as CSSProperties : undefined;
 return <aside ref={panel} className={'vp-preview' + (expanded ? ' vp-preview-expanded' : '') + (hidden?' vp-preview-hidden':'')} style={style} aria-label="Live invitation preview"
  onPointerDown={pointerDown}
  onPointerMove={e => {const d = drag.current; if (d?.id === e.pointerId) setPosition(clamp({x: d.origin.x + e.clientX - d.x, y: d.origin.y + e.clientY - d.y}));}}
  onPointerUp={() => {drag.current = null;}} onPointerCancel={() => {drag.current = null;}}
  onKeyDown={e => {
   if (!expanded) return;
   if (e.key === 'Escape') {e.preventDefault(); onExpandedChange(false);}
   if (e.key === 'Tab') {
    const items = Array.from(panel.current!.querySelectorAll<HTMLElement>('button:not(:disabled), input')).filter(el => el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {e.preventDefault(); last?.focus();}
    else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first?.focus();}
   }
  }}>
  <button ref={closeButton} className="vp-preview-close" onClick={() => onExpandedChange(false)}><ArrowLeft size={16}/>Back to form</button>
  {children}
  <div className="vp-pip-controls">
   <button aria-label={playing ? 'Pause preview' : 'Play full video'} aria-disabled={!ready} onPointerDown={e=>e.preventDefault()} onClick={()=>{if(ready)onPlay();else onExpandedChange(true);}}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button>
   <button ref={expandButton} aria-label="Expand video preview" onPointerDown={e=>e.preventDefault()} onClick={() => onExpandedChange(true)}><Maximize2 size={17}/></button>
   <button aria-label="Close preview" onPointerDown={e=>e.preventDefault()} onClick={onHide}><X size={17}/></button>
  </div>
  <button className="vp-pip-move" aria-label="Move preview to other side" title="Drag the preview to move it, or tap to switch sides" onClick={() => setPosition(clamp({x: point.x > view.left + view.width / 2 ? view.left + 8 : view.left + view.width - width - 8, y: point.y}))}><span/></button>
 </aside>;
}
