export type PreviewMedia={src:string;poster:string;width:number;height:number;duration:number;bytes:number;version:number};
type Entry={node:HTMLElement;video:HTMLVideoElement|null;media:PreviewMedia;time:number;ratio:number;active:boolean;pending:boolean;blocked:boolean;epoch:number;status:(state:'poster'|'playing'|'error')=>void;cleanup:()=>void};
/** One scheduler per catalogue. No media source is attached until awarded a slot. */
export class CataloguePlayback {
 private entries=new Set<Entry>();
 private pool:HTMLVideoElement[]=[];
 private observer:IntersectionObserver;
 private frame=0;
 private enabled=true;
 private suspended=false;
 private lastY=window.scrollY;
 private direction=1;
 private destroyed=false;
 constructor(){
  this.observer=new IntersectionObserver(records=>{for(const r of records){const e=[...this.entries].find(e=>e.node===r.target);if(e)e.ratio=r.intersectionRatio;}this.queue();},{threshold:[0,.1,.5,1]});
  window.addEventListener('scroll',this.queue,{passive:true});window.addEventListener('resize',this.queue);document.addEventListener('visibilitychange',this.visibility);
 }
 configure(enabled:boolean,suspended:boolean){this.enabled=enabled;this.suspended=suspended;this.queue();}
 register(node:HTMLElement,media:PreviewMedia,status:Entry['status']){
  const e:Entry={node,video:null,media,status,time:0,ratio:0,active:false,pending:false,blocked:false,epoch:0,cleanup:()=>{}};
  this.entries.add(e);this.observer.observe(node);this.queue();
  return {retry:()=>{e.blocked=false;cancelAnimationFrame(this.frame);this.update();},dispose:()=>{this.observer.unobserve(node);this.release(e);this.entries.delete(e);}};
 }
 private queue=()=>{if(!this.destroyed&&!this.frame)this.frame=requestAnimationFrame(this.update);};
 private visibility=()=>{cancelAnimationFrame(this.frame);this.frame=0;this.update();};
 private release(e:Entry){
  const video=e.video;e.cleanup();e.cleanup=()=>{};
  if(video){if(video.readyState>=1&&Number.isFinite(video.currentTime))e.time=video.currentTime;video.pause();video.removeAttribute('src');video.load();video.remove();this.pool.push(video);e.video=null;}
  e.active=false;e.pending=false;e.epoch++;e.status(e.blocked?'error':'poster');
 }
 private attach(e:Entry){
  if(e.video)return;
  const video=this.pool.pop()||document.createElement('video');e.video=video;
  video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');video.tabIndex=-1;
  let stall:ReturnType<typeof setTimeout>|undefined;
  const fail=()=>{e.blocked=true;this.release(e);this.queue();};
  const waiting=()=>{clearTimeout(stall);stall=setTimeout(fail,8000);};
  const playing=()=>{clearTimeout(stall);if(e.active)e.status('playing');};
  const loaded=()=>{if(e.time>0&&Number.isFinite(video.duration))video.currentTime=Math.min(e.time,Math.max(0,video.duration-.1));};
  video.addEventListener('error',fail);video.addEventListener('waiting',waiting);video.addEventListener('stalled',waiting);video.addEventListener('playing',playing);video.addEventListener('loadedmetadata',loaded);
  e.cleanup=()=>{clearTimeout(stall);video.removeEventListener('error',fail);video.removeEventListener('waiting',waiting);video.removeEventListener('stalled',waiting);video.removeEventListener('playing',playing);video.removeEventListener('loadedmetadata',loaded);};
  e.node.append(video);video.src=e.media.src;video.load();
 }
 private update=()=>{
  this.frame=0;const y=window.scrollY;if(y!==this.lastY)this.direction=y>this.lastY?1:-1;this.lastY=y;
  if(!this.enabled||this.suspended||document.hidden){for(const e of this.entries)this.release(e);return;}
  const height=window.innerHeight,cap=window.innerWidth<=640?4:6;
  const ranked=[...this.entries].filter(e=>!e.blocked).map(e=>{const r=e.node.getBoundingClientRect();const visible=Math.max(0,Math.min(r.bottom,height)-Math.max(r.top,0));e.ratio=r.height?visible/r.height:0;return {e,r,distance:Math.abs((r.top+r.bottom)/2-height/2)};});
  const playing=ranked.filter(({e})=>e.ratio>=.5||(e.active&&e.ratio>=.1)).sort((a,b)=>a.distance-b.distance).slice(0,cap);
  const active=new Set(playing.map(x=>x.e));
  const warm=ranked.filter(({e,r})=>!active.has(e)&&r.bottom>=-height&&r.top<=height*2).sort((a,b)=>{
   const ahead=(r:DOMRect)=>this.direction>0?r.top>=height:r.bottom<=0;
   return Number(ahead(b.r))-Number(ahead(a.r))||a.distance-b.distance;
  }).slice(0,2);
  const retained=new Set([...active,...warm.map(x=>x.e)]);
  for(const e of this.entries)if(!retained.has(e))this.release(e);
  for(const e of retained){
   this.attach(e);const video=e.video!;
   if(!active.has(e)){if(e.active){if(video.readyState>=1)e.time=video.currentTime;video.pause();e.epoch++;e.pending=false;}e.active=false;e.status('poster');continue;}
   e.active=true;video.preload='auto';if(e.pending||!video.paused)continue;
   e.pending=true;const epoch=e.epoch;
   video.play().then(()=>{if(epoch!==e.epoch||!e.active)return;e.pending=false;e.status('playing');}).catch(()=>{if(epoch!==e.epoch)return;e.pending=false;e.blocked=true;this.release(e);this.queue();});
  }
  this.pool.splice(Math.max(0,cap+2-retained.size));
 };
 destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();window.removeEventListener('scroll',this.queue);window.removeEventListener('resize',this.queue);document.removeEventListener('visibilitychange',this.visibility);for(const e of this.entries){e.cleanup();this.release(e);}this.entries.clear();this.pool=[];}
}
