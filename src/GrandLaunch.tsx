import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {ArrowRight,Home,RotateCcw,Sparkles,Volume2,VolumeX} from 'lucide-react';
import './grand-launch.css';
const InvitationScene=lazy(()=>import('./three/InvitationScene'));
const CEREMONY_END=Date.parse('2026-09-15T03:00:00+05:30');

function GoldenAtmosphere({burst}:{burst:number}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=innerWidth,height=innerHeight,frame=0,previous=performance.now(),elapsed=0;
  const resize=()=>{width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio,1.5);el.width=width*ratio;el.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0)};
  resize();window.addEventListener('resize',resize);
  const dust=Array.from({length:55},(_,i)=>({x:((i*137.51)%997)/997,y:((i*83.3)%991)/991,r:.5+(i%4)*.4,s:.005+(i%5)*.003}));
  const confetti=burst?Array.from({length:160},(_,i)=>({x:i%2?width*.1:width*.9,y:height*.72,vx:(i%2?1:-1)*(2+Math.random()*7),vy:-8-Math.random()*12,rotation:Math.random()*6,size:3+Math.random()*5,color:['#ffeab6','#c69a45','#f7d987','#a47c32','#fff4d9'][i%5]})):[];
  const draw=(now:number)=>{const dt=Math.min((now-previous)/16.67,2);previous=now;elapsed+=dt;ctx.clearRect(0,0,width,height);
   for(const p of dust){if(!reduced)p.y=(p.y-p.s*.006*dt+1)%1;ctx.globalAlpha=.3+Math.sin(elapsed*.015+p.x*30)*.22;ctx.fillStyle='#f5d991';ctx.beginPath();ctx.arc(p.x*width,p.y*height,p.r,0,Math.PI*2);ctx.fill();}
   if(!reduced&&elapsed<390)for(const p of confetti){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.11*dt;p.vx*=.995;p.rotation+=.045*dt;ctx.save();ctx.globalAlpha=Math.min(1,(390-elapsed)/75);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.45);ctx.restore();}
   ctx.globalAlpha=1;if(!reduced)frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize)};
 },[burst]);
 return <canvas className="gl-particles" ref={canvas} aria-hidden="true"/>;
}

function ScratchLaunch({onReveal}:{onReveal:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),down=useRef(false),done=useRef(false),last=useRef<{x:number;y:number}|null>(null),moves=useRef(0);
 const [progress,setProgress]=useState(0);
 const finish=()=>{if(done.current)return;done.current=true;setProgress(1);onReveal()};
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d',{willReadFrequently:true});if(!ctx)return;let cancelled=false;
  const paint=()=>{if(cancelled||moves.current)return;ctx.globalCompositeOperation='source-over';const g=ctx.createLinearGradient(0,0,720,420);g.addColorStop(0,'#2d2515');g.addColorStop(.3,'#816636');g.addColorStop(.5,'#302717');g.addColorStop(.75,'#a5803d');g.addColorStop(1,'#342918');ctx.fillStyle=g;ctx.fillRect(0,0,720,420);
   for(let i=0;i<2300;i++){const x=(i*173.17)%720,y=(i*61.37)%420;ctx.fillStyle=i%3?'rgba(255,226,157,.22)':'rgba(255,246,215,.48)';ctx.fillRect(x,y,i%4===0?2:1,i%4===0?2:1)}
   ctx.strokeStyle='rgba(245,217,153,.6)';ctx.lineWidth=1;ctx.strokeRect(16,16,688,388);ctx.strokeRect(22,22,676,376);
   ctx.textAlign='center';ctx.fillStyle='#fbe5ab';ctx.font='24px Cinzel, serif';ctx.fillText('A GOLDEN BEGINNING',360,105);
   ctx.font='66px "Great Vibes", cursive';ctx.shadowColor='#ffd776';ctx.shadowBlur=15;ctx.fillText('Scratch to Launch',360,227);ctx.shadowBlur=0;
   ctx.font='17px Lora, serif';ctx.fillStyle='#f6e2b8';ctx.fillText('Run your finger across the gold',360,310);
  };paint();void document.fonts.ready.then(paint);return()=>{cancelled=true};
 },[]);
 const scratch=(event:React.PointerEvent<HTMLCanvasElement>)=>{
  if(!down.current||done.current)return;const el=event.currentTarget,ctx=el.getContext('2d');if(!ctx)return;const box=el.getBoundingClientRect();const point={x:(event.clientX-box.left)*720/box.width,y:(event.clientY-box.top)*420/box.height};ctx.globalCompositeOperation='destination-out';ctx.lineWidth=76;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.current?.x??point.x,last.current?.y??point.y);ctx.lineTo(point.x,point.y);ctx.stroke();last.current=point;
  if(++moves.current%4===0){const pixels=ctx.getImageData(0,0,720,420).data;let cleared=0,total=0;for(let i=3;i<pixels.length;i+=64){total++;if(pixels[i]<100)cleared++;}const fraction=cleared/total;setProgress(fraction);if(fraction>.38)finish();}
 };
 return <><div className={'gl-scratch-shell '+(done.current?'is-revealed':'')}>
   <div className="gl-scratch-reveal" aria-hidden={!done.current}><small>LAUNCHED AT</small><strong>11:59 <em>PM</em></strong><span>14 SEPTEMBER 2026 · IST</span><b>FindMyInvite.com</b></div>
   <canvas ref={canvas} width={720} height={420} className="gl-scratch-canvas" aria-label="Gold scratch card. Scratch with your finger or use the reveal button below." onPointerDown={e=>{down.current=true;last.current=null;e.currentTarget.setPointerCapture(e.pointerId);scratch(e)}} onPointerMove={scratch} onPointerUp={()=>{down.current=false;last.current=null}} onPointerCancel={()=>{down.current=false;last.current=null}}/>
  </div><p className="gl-scratch-hint" aria-live="polite">{done.current?'A moment to remember. A world of celebrations ahead.':progress>.04?'Keep going. Your golden moment is almost here.':'Your touch. Our beginning.'}</p>{!done.current&&<button className="gl-accessible-reveal" onClick={finish}>Or tap to reveal <ArrowRight size={13}/></button>}</>;
}

export default function GrandLaunch(){
 const [ended,setEnded]=useState(()=>Date.now()>=CEREMONY_END);
 const [stage,setStage]=useState(0),[opening,setOpening]=useState(false),[revealed,setRevealed]=useState(false),[burst,setBurst]=useState(0),[sound,setSound]=useState(false),[audioUnavailable,setAudioUnavailable]=useState(false);
 const audio=useRef<HTMLAudioElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),heading=useRef<HTMLElement>(null);
 useEffect(()=>{document.title='The Grand Launch · FindMyInvite.com';return()=>{if(timer.current)clearTimeout(timer.current)}},[]);
 useEffect(()=>{if(ended){audio.current?.pause();return}const remaining=CEREMONY_END-Date.now();const expiry=setTimeout(()=>setEnded(true),Math.max(0,Math.min(remaining,2147483647)));const check=()=>{if(Date.now()>=CEREMONY_END)setEnded(true)};window.addEventListener('focus',check);return()=>{clearTimeout(expiry);window.removeEventListener('focus',check)}},[ended]);
 useEffect(()=>{if(stage>0)heading.current?.focus({preventScroll:true})},[stage]);
 const play=()=>{const el=audio.current;if(!el)return;el.volume=.55;void el.play().then(()=>{setSound(true);setAudioUnavailable(false)}).catch(()=>setSound(false))};
 const open=()=>{if(opening)return;setOpening(true);play();timer.current=setTimeout(()=>{setStage(1);setOpening(false)},matchMedia('(prefers-reduced-motion: reduce)').matches?100:1900)};
 const replay=()=>{if(timer.current)clearTimeout(timer.current);setStage(0);setOpening(false);setRevealed(false);setBurst(0)};
 if(ended)return <main className="grand-launch gl-step-2"><div className="gl-background"/><div className="gl-vignette"/><GoldenAtmosphere burst={0}/><div className="gl-frame" aria-hidden="true"><i/><i/><i/><i/></div><section className="gl-stage gl-finale"><p className="gl-eyebrow">THE PREMIERE HAS ENDED</p><p className="gl-script">The celebrations continue.</p><h1 className="gl-wordmark">FindMyInvite<span>.com</span></h1><p className="gl-description">Our launch ceremony closed at<br/>3:00 AM IST · 15 September 2026.<br/>Your unforgettable moments are just beginning.</p><a className="gl-button" href="/"><Home size={17}/> Home <ArrowRight size={17}/></a></section></main>;
 return <main className={'grand-launch gl-step-'+stage}>
  <div className="gl-background"/><div className="gl-vignette"/>
  {stage===0&&<div className={'gl-gate '+(opening?'is-open':'')} aria-hidden="true"><div className="gl-gate-fallback gl-left"/><div className="gl-gate-fallback gl-right"/><Suspense fallback={null}><InvitationScene open={opening}/></Suspense></div>}
  <GoldenAtmosphere burst={burst}/><div className="gl-frame" aria-hidden="true"><i/><i/><i/><i/></div>
  <header className="gl-topbar"><span className="gl-monogram">FMI<span>✦</span></span><span>THE GRAND PREMIERE</span><button className="gl-sound" aria-label={audioUnavailable?'Music unavailable':sound?'Mute music':'Play music'} title={audioUnavailable?'Music unavailable':sound?'Mute music':'Play music'} onClick={()=>{if(sound){audio.current?.pause();setSound(false)}else play()}}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></header>
  <div className="gl-progress" aria-label={`Chapter ${stage+1} of 3`}>{[0,1,2].map(n=><i key={n} className={stage>=n?'active':''}/>)}</div>
  {stage===0?<section className={'gl-stage gl-welcome '+(opening?'gl-opening':'')}>
   <p className="gl-eyebrow">AN INVITATION TO SOMETHING EXTRAORDINARY</p><p className="gl-script">Every great story begins</p>
   <h1 className="gl-wordmark">FindMyInvite<span>.com</span></h1><div className="gl-chapter" aria-hidden="true">✦</div>
   <p className="gl-description">Not just an invitation.<br/>The beginning of an unforgettable experience.</p>
   <button className="gl-seal" onClick={open} disabled={opening} aria-label="Tap to open the grand launch"><i className="gl-seal-ring"/><strong>FMI</strong><small>TAP TO OPEN</small></button>
   <p className="gl-date">14 SEPTEMBER 2026 <span>·</span> 11:59 PM IST</p>
  </section>:stage===1?<section ref={heading} tabIndex={-1} className="gl-stage gl-reveal">
   <p className="gl-eyebrow">CHAPTER II · THE GOLDEN MOMENT</p><h1 className="gl-title">A little magic.<br/><em>A grand beginning.</em></h1>
   <p className="gl-description">Some beginnings deserve to be revealed.</p>
   <ScratchLaunch onReveal={()=>{setRevealed(true);setBurst(n=>n+1)}}/>
   {revealed&&<button className="gl-button" onClick={()=>{setStage(2);setBurst(n=>n+1)}}>Let the celebration begin <ArrowRight size={17}/></button>}
  </section>:<section ref={heading} tabIndex={-1} className="gl-stage gl-finale">
   <div className="gl-finale-mark" aria-hidden="true"><Sparkles size={34}/></div><p className="gl-eyebrow">A NEW CHAPTER IN CELEBRATION</p>
   <p className="gl-script">And so, the story begins.</p><h1 className="gl-wordmark">FindMyInvite<span>.com</span></h1>
   <div className="gl-chapter" aria-hidden="true">✦</div><p className="gl-description">For the moments you dream of.<br/>For the people you love.<br/><strong>Make the invitation unforgettable.</strong></p>
   <p className="gl-finale-date"><span>GRAND LAUNCH</span>14 September 2026 · 11:59 PM IST</p>
   <div className="gl-actions"><a className="gl-button" href="/"><Home size={17}/> Home <ArrowRight size={17}/></a><a className="gl-button secondary" href="/invite/demo?template=emerald-noir">Experience a full invitation <ArrowRight size={17}/></a></div>
  </section>}
  <footer className="gl-footer"><span>MADE FOR UNFORGETTABLE MOMENTS</span>{stage>0&&<button onClick={replay}><RotateCcw size={12}/> Replay the magic</button>}<span className="gl-stage-number">0{stage+1} <i>/</i> 03</span></footer>
  <audio ref={audio} src="/assets/track1.mp3" preload="none" loop onError={()=>{setAudioUnavailable(true);setSound(false)}} onPause={()=>setSound(false)} onPlay={()=>setSound(true)}/>
 </main>;
}
