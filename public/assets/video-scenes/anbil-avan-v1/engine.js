/* v4 2.5D engine — deterministic multi-plane compositor (1080x1920, 25 fps).
   Model: every layer (image or text) is a plane at depth z, authored by its REST screen position/size at restZ
   (camera at rest: x=y=0, camZ=0, zoom=1). Projection for a plane at depth z with camera (cx,cy,cz,zoom,roll):
     d = z - cz ;  s = zoom * restZ / d  ;  screen = centre + (worldXY - camXY) * zoom / d
   with worldXY = (restScreenXY - centre) * restZ + layer offsets*restZ. Draw order = sorted by d every frame
   (far first), so text that travels in z is genuinely occluded by alpha silhouettes of nearer planes.
   Depth-of-field: blur = min(maxBlur, k*|d - focusD|) unless layer.sharp. Planes with d < nearClip are hidden.
   Tracks: [[t, value, ease?], ...] t in scene seconds; 'e-0.4' = 0.4 s before scene end. 'spline' = monotone cubic.
   No randomness at render time; every frame is f(t). */
(function(){'use strict';
const W=1080,H=1920,FPS=25;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t;
const EASE={linear:t=>t,in:t=>t*t*t,out:t=>1-Math.pow(1-t,3),inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  sine:t=>-(Math.cos(Math.PI*t)-1)/2,outQuint:t=>1-Math.pow(1-t,5),inQuint:t=>t*t*t*t*t,expoOut:t=>t>=1?1:1-Math.pow(2,-10*t),
  expoIn:t=>t<=0?0:Math.pow(2,10*t-10),backOut:t=>{const c1=1.2,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);},hold:t=>t>=1?1:0};
function T(t,dur){return typeof t==='string'&&t.startsWith('e')?dur-parseFloat(t.slice(1)):t;}
// monotone cubic Hermite (Fritsch-Carlson): C1-continuous, no overshoot
function spline(keys,t){const n=keys.length;if(t<=keys[0][0])return keys[0][1];if(t>=keys[n-1][0])return keys[n-1][1];
  const x=keys.map(k=>k[0]),y=keys.map(k=>k[1]);const dlt=[],m=new Array(n);for(let i=0;i<n-1;i++)dlt.push((y[i+1]-y[i])/((x[i+1]-x[i])||1e-9));
  m[0]=dlt[0];m[n-1]=dlt[n-2];for(let i=1;i<n-1;i++)m[i]=dlt[i-1]*dlt[i]<=0?0:(dlt[i-1]+dlt[i])/2;
  for(let i=0;i<n-1;i++){if(dlt[i]===0){m[i]=m[i+1]=0;continue;}const a=m[i]/dlt[i],b=m[i+1]/dlt[i],h=a*a+b*b;if(h>9){const k=3/Math.sqrt(h);m[i]=k*a*dlt[i];m[i+1]=k*b*dlt[i];}}
  let i=0;while(t>x[i+1])i++;const h=x[i+1]-x[i],u=(t-x[i])/h,u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*y[i]+(u3-2*u2+u)*h*m[i]+(-2*u3+3*u2)*y[i+1]+(u3-u2)*h*m[i+1];}
function track(tr,t,dur,dflt){if(tr===undefined)return dflt;if(typeof tr==='number')return tr;
  // damped oscillation (physically decaying swing, never a constant bob): A*e^(-(t-t0)/tau)*sin(2pi(t-t0)/T)
  if(tr.fn==='damped'){const u=t-T(tr.t0||0,dur);return u<0?0:(tr.base||0)+tr.A*Math.exp(-u/tr.tau)*Math.sin(2*Math.PI*u/tr.T+(tr.phase||0));}
  const keys=(Array.isArray(tr)?tr:tr.k).map(k=>[T(k[0],dur),k[1],k[2]]);   // array form, or {k:[...],spline:true}
  if(tr.spline)return spline(keys,t);
  if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i];const e=EASE[b[2]||'inOut']||EASE.inOut;
    return lerp(a[1],b[1],e(clamp((t-a[0])/((b[0]-a[0])||1e-9))));}return keys[keys.length-1][1];}

/* ---------- DOM ---------- */
const stage=document.getElementById('stage');const IMGS=[];const ERR=window.__errors=[];addEventListener('error',e=>ERR.push(String(e.message||e)));
const seg=new Intl.Segmenter('en',{granularity:'grapheme'});
function el(tag,cls,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(parent)parent.appendChild(e);return e;}

function buildText(L,parent){const box=el('div','tplane',parent);L._glyphs=[];
  (L.lines||[]).forEach((ln,li)=>{const row=el('div','tline',box);Object.assign(row.style,{fontSize:ln.size+'px',fontWeight:ln.weight||350,letterSpacing:(ln.tracking||0)+'em',
      fontFamily:ln.family||'V4Display',color:ln.color||'#fff',WebkitTextStroke:ln.stroke||'0px',paintOrder:'stroke fill',marginTop:li?((ln.gap??0.12)*ln.size)+'px':'0',textTransform:ln.upper?'uppercase':'none',textAlign:L.align||'center'});
    if(ln.shadow!==false)row.style.textShadow=ln.shadowCss||'0 3px 18px rgba(20,10,30,.35), 0 1px 3px rgba(20,10,30,.35)';
    for(const g of seg.segment(ln.text)){const s=el('span','g',row);s.textContent=g.segment;L._glyphs.push({el:s,line:li});}});
  box.style.textAlign=L.align||'center';return box;}

function buildScene(S,DATA){S.root=el('div','scene',stage);S.root.dataset.id=S.id;if(S.clip)S.root.style.clipPath=S.clip;S.layers.forEach(L=>{
  if(L.kind==='text'){L.node=buildText(L,S.root);}
  else if(L.kind==='img'){const ok=DATA.assets[L.src];if(!ok){L.node=el('div','missing',S.root);L.node.textContent='MISSING · '+L.src;L.missing=true;}
    else{L.node=el('img','plane',S.root);L.node.src=DATA.assetUrls?.[L.src]||DATA.assetBase+L.src;IMGS.push(L.node);}}
  else if(L.kind==='fill'){L.node=el('div','plane',S.root);L.node.style.background=L.fill;}
  L.node.dataset.layer=L.id;if(L.blend)L.node.style.mixBlendMode=L.blend;if(L.clip)L.node.style.clipPath=L.clip;if(L.radius)L.node.style.borderRadius=L.radius+'px';if(L.fit)L.node.style.objectFit=L.fit;});}

/* sizes: image planes get rest width (px at rest); height from natural aspect */
function sizeScene(S){S.layers.forEach(L=>{if(L.kind==='img'){const n=L.node;const ar=L.missing?(L.aspect||1):n.naturalHeight/n.naturalWidth;L.rw=L.w;L.rh=L.h||L.w*ar;
    Object.assign(n.style,{width:L.rw+'px',height:L.rh+'px'});}
  if(L.kind==='fill'){L.rw=L.w||W*3;L.rh=L.h||H*3;Object.assign(L.node.style,{width:L.rw+'px',height:L.rh+'px'});}
  if(L.kind==='text'){L.rw=L.node.offsetWidth;L.rh=L.node.offsetHeight;
    if(L.maxWidth&&L.rw>L.maxWidth){const k=L.maxWidth/L.rw;L.node.querySelectorAll('.tline').forEach(r=>r.style.fontSize=(parseFloat(r.style.fontSize)*k)+'px');L.rw=L.node.offsetWidth;L.rh=L.node.offsetHeight;L.fitScale=k;}}});}

/* ---------- per-frame ---------- */
function camAt(S,lt){const c=S.camera||{},d=S.dur;return{x:track(c.x,lt,d,0),y:track(c.y,lt,d,0),z:track(c.z,lt,d,0),zoom:track(c.zoom,lt,d,1),roll:track(c.roll,lt,d,0),
  focus:track(c.focus,lt,d,1.2),dof:track(c.dof,lt,d,6),maxBlur:c.maxBlur??10};}
function renderScene(S,t){const lt=t-S.t0,d=S.dur;const on=t>=S.t0-(S.pre||0)-1e-6&&t<S.t1+(S.post||0)-1e-6;S.root.style.display=on?'block':'none';if(!on)return;
  const C=camAt(S,lt);S.root.style.opacity=track(S.opacity,lt,d,1);
  S.root.style.transform='none';
  const vis=[];S.layers.forEach(L=>{const C0=C;const cf=L.cameraFactor??1;const Cs=L.screen?{x:0,y:0,z:0,zoom:1,roll:0,focus:C0.focus,dof:0,maxBlur:0}:{...C0,x:C0.x*cf,y:C0.y*cf,z:C0.z*cf,roll:C0.roll*cf};
    const z=track(L.z,lt,d,L.restZ);const dz=z-Cs.z;
    // near-plane fade: planes approaching the lens dissolve between nearFade[0] and nearFade[1] (distance), so a
    // camera move never produces giant clipped geometry or a hard clip pop. Characters use a wider band.
    const nf=L.screen?null:(L.nearFade||[0.10,0.28]);const op=track(L.opacity,lt,d,1)*(nf?clamp((dz-nf[0])/(nf[1]-nf[0])):1);
    if(dz<(L.nearClip??0.06)||op<=0.002){L.node.style.display='none';L._d=null;return;}
    const rz=L.restZ;const ox=track(L.x,lt,d,0),oy=track(L.y,lt,d,0);
    const wx=(L.rx-W/2+ox)*rz,wy=(L.ry-H/2+oy)*rz;const k=Cs.zoom/dz;
    // camera lateral travel in world px: parallax = camX*zoom/dz (nearer planes move more)
    const px=(wx-Cs.x)*k,py=(wy-Cs.y)*k,angle=(Cs.roll||0)*Math.PI/180;
    let X=W/2+px*Math.cos(angle)-py*Math.sin(angle),Y=H/2+px*Math.sin(angle)+py*Math.cos(angle);const sc=rz*k*track(L.scale,lt,d,1);
    if(L.followLayer){const q=S.layers.find(q=>q.id===L.followLayer)?._screen;if(q)Y=Math.max(L.rh*sc/2+70,q.y-q.h/2-(L.aboveMargin||70)-L.rh*sc/2);}
    const anchor=L.orientationFrom?S.layers.find(q=>q.id===L.orientationFrom):null;const rot=anchor?track(anchor.rot,lt,d,0)+(C.roll||0):track(L.rot,lt,d,0)+(Cs.roll||0);const tiltY=track(anchor?anchor.tiltY:L.tiltY,lt,d,0),tiltX=track(anchor?anchor.tiltX:L.tiltX,lt,d,0);let blur=(L.sharp||L.screen?0:Math.min(C.maxBlur,C.dof*Math.abs(dz-C.focus)))+track(L.blur,lt,d,0);
    if(L.lensBlur&&dz<.8)blur+=Math.min(22,Math.max(0,(.8-dz)*30));
    if(L.kind==='text'&&L.sharpWhenNear&&Math.abs(dz-C.focus)<0.5)blur=track(L.blur,lt,d,0);
    const n=L.node;n.style.display='block';n.style.opacity=op.toFixed(4);
    const og=L.origin||[0.5,0.5];n.style.transformOrigin=`${og[0]*100}% ${og[1]*100}%`;   // rx,ry = pivot point (default centre)
    n.style.transform=`translate(${(X-og[0]*L.rw).toFixed(2)}px,${(Y-og[1]*L.rh).toFixed(2)}px) scale(${sc.toFixed(5)}) rotate(${rot.toFixed(3)}deg) perspective(1800px) rotateY(${tiltY.toFixed(3)}deg) rotateX(${tiltX.toFixed(3)}deg)`;
    n.style.filter=(blur>0.15?`blur(${(blur/Math.max(0.25,sc)).toFixed(2)}px) `:'')+(L.rim?'drop-shadow(-2px -1px 1px rgba(255,215,152,.55))':''); if(L.revealBrush!==undefined)n.style.clipPath='inset(0 '+(100*(1-track(L.revealBrush,lt,d,1))).toFixed(2)+'% 0 0)';  // blur specified in screen px
    L._d=dz;L._sc=sc;L._op=op;L._screen={x:X+(0.5-og[0])*L.rw*sc,y:Y+(0.5-og[1])*L.rh*sc,w:L.rw*sc,h:L.rh*sc};vis.push(L);   // _screen = centre
    if(L.kind==='text')revealText(L,lt,d);});
  vis.sort((a,b)=>(!!a.alwaysFront-!!b.alwaysFront)||b._d-a._d||((a.order||0)-(b.order||0)));vis.forEach((L,i)=>L.node.style.zIndex=String(10+i));}

// reveals: 'type' = reference per-glyph type-on with ghosted newest glyph; 'rise' = glyphs rise+fade; 'none'
function revealText(L,lt,d){const r=L.reveal||{mode:'type'};const t0=T(r.at??0,d),rate=r.rate??0.075;let tg=t0,prev=0;
  L._glyphs.forEach(g=>{if(g.line!==prev){tg+=r.lineGap??0.12;prev=g.line;}let a=0,ty=0,gt='';
    if(r.mode==='type'){a=lt<tg?0:Math.min(1,0.35+0.65*(lt-tg)/0.15);}
    else if(r.mode==='rise'){const p=clamp((lt-tg)/(r.dur??0.38));const e=EASE.out(p);a=e;ty=(1-e)*(r.dist??0.45);}
    else if(r.mode==='letter'){const p=clamp((lt-tg)/(r.dur??.08)),e=EASE.out(p);a=lt<tg?0:tg===0?1:.35+.65*e;gt=p<1?`perspective(600px) translateY(${((1-e)*.24).toFixed(3)}em) rotateY(${((1-e)*(r.glyphTilt??-35)).toFixed(2)}deg) rotateZ(${((1-e)*(r.glyphRoll??-7)).toFixed(2)}deg)`:'';}
    else a=1;
    g.el.style.opacity=a.toFixed(3);g.el.style.transform=gt||(ty?`translateY(${ty.toFixed(3)}em)`:'');if(g.el.textContent.trim())tg+=rate;});
  if(r.outAt!==undefined){const o=clamp((lt-T(r.outAt,d))/(r.outDur??0.2));if(o>0)L.node.style.opacity=(parseFloat(L.node.style.opacity)*(1-o)).toFixed(3);}}

/* ---------- API ---------- */
const ENG={W,H,FPS,track,EASE,scenes:[]};
ENG.init=async function(scenes,DATA){stage.replaceChildren();IMGS.length=0;ERR.length=0;ENG.scenes=scenes;scenes.forEach(S=>{S.dur=S.t1-S.t0;S.layers.forEach(L=>{L.restZ=L.restZ??(typeof L.z==='number'?L.z:1);});buildScene(S,DATA);});
  await Promise.all(IMGS.map(i=>i.decode().catch(()=>ERR.push('image failed '+i.src))));
  await document.fonts.load("350 100px 'V4Display'","ABC");await document.fonts.load("400 100px 'V4Heavy'","ABC");await document.fonts.load("400 100px 'V8Names'","Priya Arun");await document.fonts.load("400 100px 'V8Head'","Bride Groom Wedding");await document.fonts.ready;
  scenes.forEach(S=>{S.root.style.display='block';sizeScene(S);S.root.style.display='none';});return{errors:ERR.slice()};};
ENG.render=function(t){ENG.scenes.forEach(S=>renderScene(S,t));};
// QA: per active text layer -> screen box, its depth order neighbours, which nearer planes overlap it (occluders)
ENG.inspect=function(t){ENG.render(t);const out=[];ENG.scenes.forEach(S=>{if(S.root.style.display==='none')return;
  const act=S.layers.filter(L=>L._d!=null);act.forEach(L=>{if(L.kind!=='text')return;const b=L._screen;const box={x0:b.x-b.w/2,y0:b.y-b.h/2,x1:b.x+b.w/2,y1:b.y+b.h/2};
    const occ=act.filter(o=>o!==L&&o._d<L._d&&o.kind==='img').filter(o=>{const q=o._screen;return !(q.x+q.w/2<box.x0||q.x-q.w/2>box.x1||q.y+q.h/2<box.y0||q.y-q.h/2>box.y1);}).map(o=>o.id);
    out.push({scene:S.id,layer:L.id,d:+L._d.toFixed(3),box:Object.fromEntries(Object.entries(box).map(([k,v])=>[k,Math.round(v)])),nearerOverlapping:occ,opacity:+L.node.style.opacity});});
  out.push({scene:S.id,planes:act.length,order:act.sort((a,b)=>b._d-a._d).map(L=>L.id)});});return out;};
// pixel-occlusion support: hide given layer ids (in active scenes) for the next render
ENG.hidden=new Set();
ENG.nearerThan=function(t,textId){ENG.render(t);for(const S of ENG.scenes){const L=S.layers.find(l=>l.id===textId&&l._d!=null);if(L&&S.root.style.display!=='none')
  return{scene:S.id,box:L._screen,ids:S.layers.filter(o=>o!==L&&o._d!=null&&o._d<L._d&&o.kind!=='text'&&!o.effect).map(o=>o.id)};}return null;};
ENG.textLayersAt=function(t){ENG.render(t);const r=[];for(const S of ENG.scenes)if(S.root.style.display!=='none')S.layers.forEach(L=>{if(L.kind==='text'&&L._d!=null&&parseFloat(L.node.style.opacity)>0.05)r.push(L.id);});return r;};
ENG.only=null;   // Set of layer ids: render ONLY these (alpha-mask capture for crossing tests)
const _render=ENG.render;ENG.render=function(t){_render(t);ENG.scenes.forEach(S=>S.layers.forEach(L=>{if(!L.node)return;
  if(ENG.hidden.has(L.id)||(ENG.only&&!ENG.only.has(L.id)))L.node.style.display='none';}));};
// per-frame layer stats for QA: depth, scale, opacity, on-frame footprint, source upsampling, giant/soft flags
ENG.stats=function(t){ENG.render(t);const out=[];ENG.scenes.forEach(S=>{if(S.root.style.display==='none')return;S.layers.forEach(L=>{if(L._d==null)return;const b=L._screen;
  const ix=Math.max(0,Math.min(W,b.x+b.w/2)-Math.max(0,b.x-b.w/2)),iy=Math.max(0,Math.min(H,b.y+b.h/2)-Math.max(0,b.y-b.h/2));const foot=ix*iy/(W*H);
  const nat=L.kind==='img'&&!L.missing?L.node.naturalWidth:null;const up=nat?(L.rw*L._sc)/nat:null;
  const giantLimit=L.maxScale??(L.role&&/couple|bride|groom|character/i.test(L.role+L.id)?2.2:4.0);
  const flags=[];if(L._sc>giantLimit&&L._op>0.3&&foot>0.05&&!L.allowGiant)flags.push('giant');if(up&&up>1.9&&L._op>0.3&&foot>0.05)flags.push('upsampled x'+up.toFixed(2));
  out.push({scene:S.id,id:L.id,kind:L.kind,d:+L._d.toFixed(3),scale:+L._sc.toFixed(3),opacity:+L._op.toFixed(3),footprint:+foot.toFixed(3),upsample:up&&+up.toFixed(2),flags});});});return out;};
ENG.order=function(t){ENG.render(t);const r={};ENG.scenes.forEach(S=>{if(S.root.style.display==='none')return;r[S.id]=S.layers.filter(L=>L._d!=null&&!L.effect).sort((a,b)=>b._d-a._d).map(L=>({id:L.id,kind:L.kind,d:L._d}));});return r;};
// Measure all editable text without decoding every scene image. This keeps
// long-name/venue validation independent of whichever scene is being previewed.
ENG.measureTextFits=function(scenes){const results=[];for(const source of scenes){
 const S={...source,layers:source.layers.filter(l=>l.kind==='text').map(l=>structuredClone(l))};
 buildScene(S,{assets:{},assetBase:''});S.root.style.display='block';S.root.style.visibility='hidden';sizeScene(S);
 for(const L of S.layers)results.push({scene:S.id,fitScale:L.fitScale||1});S.root.remove();
}return results;};
window.ENG=ENG;
})();
