import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';

export function Scratch({date,time}:{date:string;time:string}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const dragging=useRef(false);
  const cells=useRef(new Set<string>());
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{
    const context=canvas.current?.getContext('2d');if(!context)return;
    const gradient=context.createLinearGradient(0,0,260,240);
    gradient.addColorStop(0,'#c69b57');gradient.addColorStop(.45,'#efd493');gradient.addColorStop(1,'#ac7d3c');
    context.fillStyle=gradient;context.fillRect(0,0,260,240);
    context.textAlign='center';context.fillStyle='#75562d';context.font='18px Georgia';context.fillText('Scratch to reveal',130,116);context.font='13px Georgia';context.fillText('our special day',130,139);
  },[]);
  const scratch=(event:PointerEvent<HTMLCanvasElement>)=>{
    const c=event.currentTarget,context=c.getContext('2d');if(!context)return;
    const rect=c.getBoundingClientRect(),x=(event.clientX-rect.left)*260/rect.width,y=(event.clientY-rect.top)*240/rect.height;
    context.globalCompositeOperation='destination-out';context.beginPath();context.arc(x,y,24,0,Math.PI*2);context.fill();
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)cells.current.add(`${Math.floor(x/20)+dx},${Math.floor(y/20)+dy}`);
    if(cells.current.size>65)setRevealed(true);
  };
  return <div className="scratch-heart"><div className="scratch-date" aria-live="polite" aria-hidden={!revealed}><em>You’re Invited!</em><strong>{new Date(date+'T12:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</strong><span>{new Date(date+'T12:00').toLocaleDateString('en-US',{weekday:'long'})}</span><small>{time}</small></div>{!revealed&&<canvas ref={canvas} width={260} height={240} role="button" tabIndex={0} aria-label="Scratch to reveal the event date" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setRevealed(true)}}} onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);scratch(e)}} onPointerMove={e=>{if(dragging.current)scratch(e)}} onPointerUp={()=>{dragging.current=false}} onPointerCancel={()=>{dragging.current=false}}/>}</div>;
}
