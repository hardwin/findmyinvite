import * as THREE from 'three';
import {weddingBellsText,weddingBellsCleanFrame,weddingBellsLayerVisibility} from '../../shared/wedding-bells-video.mjs';
import {treatmentAt,treatmentCorners,treatmentVisibility,treatedLettering,ornamentLettering} from './film-text-treatment.mjs';

const W=720,H=1280;
const square=[[0,0],[1,0],[1,1],[0,1]];
function project(c,u,v){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=c,dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)<1e-10?0:(sx*dy2-dx2*sy)/det,h=Math.abs(det)<1e-10?0:(dx1*sy-sx*dy1)/det,d=g*u+h*v+1;
 return [((x1-x0+g*x1)*u+(x3-x0+h*x3)*v+x0)/d,((y1-y0+g*y1)*u+(y3-y0+h*y3)*v+y0)/d];
}
function interpolate(keys,frame,column){let n=keys.findIndex(k=>k[0]>frame);if(n===0)return keys[0][column];if(n<0)return keys.at(-1)[column];const a=keys[n-1],b=keys[n],t=(frame-a[0])/(b[0]-a[0]);return a[column]+(b[column]-a[column])*t;}
function cornersAt(scene,frame){const row=scene.trackByFrame.get(frame);if(!row)return null;const keys=scene.transition?.floatingKeys;if(!keys)return row.corners;const [x,y,w,h]=[1,2,3,4].map(i=>interpolate(keys,frame,i));return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
const vertex=`attribute vec2 restoreUv;varying vec2 packedUv;varying vec2 fieldUv;varying vec2 screenUv;void main(){fieldUv=uv;packedUv=restoreUv;screenUv=vec2(position.x/720.0,1.0-position.y/1280.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const restoreFragment=`uniform sampler2D packed;uniform float focus;uniform float clipLeft;uniform float clipRight;uniform float restoreWarp;varying vec2 packedUv;varying vec2 fieldUv;varying vec2 screenUv;void main(){vec2 source=mix(screenUv,packedUv,restoreWarp);vec4 c=texture2D(packed,vec2(source.x*.5,source.y));float feather=smoothstep(0.0,.025,min(min(fieldUv.x,1.0-fieldUv.x),min(fieldUv.y,1.0-fieldUv.y)));float x=screenUv.x*720.0;float visible=smoothstep(clipLeft,clipLeft+2.0,x)*(1.0-smoothstep(clipRight-2.0,clipRight,x));gl_FragColor=vec4(c.rgb,feather*focus*visible);}`;
const textFragment=`uniform sampler2D packed;uniform sampler2D lettering;uniform float focus;uniform float maskStrength;uniform float clipLeft;uniform float clipRight;varying vec2 fieldUv;varying vec2 screenUv;void main(){vec4 c=texture2D(lettering,fieldUv);float visible=mix(1.0,texture2D(packed,vec2(.5+screenUv.x*.5,screenUv.y)).r,maskStrength);float x=screenUv.x*720.0;visible*=smoothstep(clipLeft,clipLeft+2.0,x)*(1.0-smoothstep(clipRight-2.0,clipRight,x));gl_FragColor=vec4(c.rgb,c.a*visible*focus);}`;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('The film frame could not load.'));i.src=src;});
async function seek(video,time){if(Math.abs(video.currentTime-time)<.0001&&video.readyState>=2)return;await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);resolve();};const timer=setTimeout(()=>{video.removeEventListener('seeked',done);reject(Error('The invitation preview could not seek. Please retry.'));},10000);video.addEventListener('seeked',done);video.currentTime=time;});}

export class TrackedFilmCompositor {
 constructor(target){this.target=target;this.disposed=false;this.loaded=false;this.fonts=[];this.videos=[];this.meshes=[];this.textures=[];}
 async load(master,content,{resolveAsset=p=>p,externalBackground=false}={}){
  this.master=master;this.content=content;this.resolveAsset=resolveAsset;this.externalBackground=externalBackground;
  const data=await fetch(resolveAsset(master.assets.surfaces.path)).then(r=>{if(!r.ok)throw Error('The invitation surfaces could not load.');return r.json();});
  if(this.disposed)return;
  this.data=data;this.motionTracks=new Map(Object.entries(data.motionTracks||{}).map(([id,track])=>[id,new Map(track.rows.map(row=>[row.frame,row.corners]))]));for(const s of data.scenes)s.trackByFrame=new Map(s.track.map(k=>[k.frame,k]));
  await Promise.all(Object.entries(master.assets).filter(([,a])=>a.kind==='font').map(async([id,a])=>{const font=new FontFace('WeddingBells-'+id,`url(${resolveAsset(a.path)})`);await font.load();if(this.disposed)return;document.fonts.add(font);this.fonts.push(font);}));
  const loadMovie=async asset=>{const v=document.createElement('video');this.videos.push(v);v.crossOrigin='anonymous';v.playsInline=true;v.defaultMuted=true;v.muted=true;v.preload='auto';await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>reject(Error('The invitation film could not load.'));v.src=resolveAsset(asset.path);v.load();});return v;};
  if(!externalBackground)[this.video,this.restoration]=await Promise.all([loadMovie(master.assets.background),loadMovie(master.assets.restoration)]);
  if(this.disposed){this.disposeMedia();return;}
  this.renderer=new THREE.WebGLRenderer({canvas:this.target,alpha:false,antialias:true,preserveDrawingBuffer:true});this.renderer.setSize(W,H,false);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(0,W,0,H,-10,10);this.camera.position.z=1;
  this.baseTexture=externalBackground?new THREE.Texture():new THREE.VideoTexture(this.video);this.baseTexture.colorSpace=THREE.SRGBColorSpace;this.packedTexture=externalBackground?new THREE.Texture():new THREE.VideoTexture(this.restoration);
  for(const t of [this.baseTexture,this.packedTexture]){t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;}
  this.base=this.makeMesh(new THREE.MeshBasicMaterial({map:this.baseTexture,depthTest:false,depthWrite:false}),0);this.place(this.base,square.map(([x,y])=>[x*W,y*H]));
  this.loaded=true;this.setContent(content);return this;
 }
 makeMesh(material,order){const geometry=new THREE.PlaneGeometry(1,1,12,12);geometry.setAttribute('restoreUv',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=order;mesh.frustumCulled=false;this.meshes.push(mesh);this.scene.add(mesh);return mesh;}
 place(mesh,corners,sourceCorners){const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,source=mesh.geometry.attributes.restoreUv;for(let i=0;i<p.count;i++){const u=uv.getX(i),v=1-uv.getY(i),[x,y]=project(corners,u,v);p.setXYZ(i,x,y,0);if(sourceCorners){const [sx,sy]=project(sourceCorners,u,v);source.setXY(i,sx/W,1-sy/H);}}p.needsUpdate=true;if(sourceCorners)source.needsUpdate=true;}
 setContent(content){
  this.content=content;if(!this.loaded)return;
  for(const l of this.layers||[]){this.scene.remove(l.restore,l.text);for(const m of [l.restore,l.text]){m.geometry.dispose();m.material.dispose();}l.texture.dispose();l.trialTexture?.dispose();}
  this.meshes=[this.base];this.layers=[];const values=weddingBellsText(content);
  for(const s of this.data.scenes)for(const field of [...s.fields,...(this.data.textTreatment?.scenes[s.id]?.ornament?[{binding:'__ornament',region:[0,0,1,1]}]:[])]){
   const treatment=this.data.textTreatment?.scenes[s.id],ornament=field.binding==='__ornament';
   const value=values[field.binding]||'',unchanged=value===(this.data.reference[field.binding]||'');
   if(unchanged&&!ornament&&!s.track.some(row=>weddingBellsCleanFrame(this.master,row.frame)))continue;
   const textCanvas=this.lettering(s,field,value),texture=new THREE.CanvasTexture(textCanvas);texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;
   const style=treatment?.fields?.[field.binding];let trialTexture;
   if(style||ornament){trialTexture=new THREE.CanvasTexture(ornament?ornamentLettering(s,treatment.ornament):treatedLettering(s,field,value,this.data.reference[field.binding]||'',style));trialTexture.minFilter=THREE.LinearFilter;trialTexture.generateMipmaps=false;}
   const restore=this.makeMesh(new THREE.ShaderMaterial({uniforms:{packed:{value:this.packedTexture},focus:{value:1},clipLeft:{value:-1000},clipRight:{value:2000},restoreWarp:{value:0}},vertexShader:vertex,fragmentShader:restoreFragment,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}),1);
   const text=this.makeMesh(new THREE.ShaderMaterial({uniforms:{packed:{value:this.packedTexture},lettering:{value:texture},focus:{value:1},maskStrength:{value:1},clipLeft:{value:-1000},clipRight:{value:2000}},vertexShader:vertex,fragmentShader:textFragment,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}),2);
   this.layers.push({scene:s,field,restore,text,texture,trialTexture,unchanged,ornament});
  }
 }
 lettering(scene,field,value){
  const [w,h]=scene.size,c=canvas(w,h);if(!value)return c;
  const fontId=(field.font||'Tinos-Regular.ttf').replace(/\.ttf$/,'');
  const ctx=c.getContext('2d'),family=`"WeddingBells-${fontId}","WeddingBells-NotoSerifMalayalam",serif`;ctx.font=`100px ${family}`;
  const measure=rows=>{
   const metrics=rows.map(row=>ctx.measureText(row)),inkWidth=Math.max(1,...metrics.map(m=>m.actualBoundingBoxLeft+m.actualBoundingBoxRight)),top=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent)),bottom=Math.max(...metrics.map(m=>m.actualBoundingBoxDescent)),inkHeight=top+bottom+(rows.length-1)*115;
   return {rows,top,inkHeight,scale:Math.min(field.width/inkWidth,field.height/Math.max(1,inkHeight))};
  };
  let fit=measure(value.split('\n'));
  // Only unusually long names wrap, within the same existing name area.
  // Compare actual shaped glyphs so Indic clusters and Latin names fit alike.
  if(['groom','bride'].includes(field.binding)&&fit.rows.length===1&&fit.scale<.7){
   const words=value.trim().split(/\s+/);let best=fit;
   for(let i=1;i<words.length;i++){const candidate=measure([words.slice(0,i).join(' '),words.slice(i).join(' ')]);if(candidate.scale>best.scale)best=candidate;}
   if(best.scale>fit.scale*1.2)fit=best;
  }
  const {rows,top,inkHeight,scale}=fit;
  if(scale*100<19)throw Object.assign(Error('The '+field.binding+' text is too long for its space.'),{code:'TEXT_FIT',field:field.binding});
  ctx.save();ctx.translate(...field.center);ctx.scale(scale,scale);ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle=field.color||'#755336';
  if(field.glow){ctx.shadowColor=field.color||'#fff0bb';ctx.shadowBlur=4/scale;}
  if(field.gold){const gradient=ctx.createLinearGradient(0,-inkHeight/2,0,inkHeight/2);gradient.addColorStop(0,'#f5d992');gradient.addColorStop(1,'#875817');ctx.fillStyle=gradient;}
  rows.forEach((row,i)=>ctx.fillText(row,0,-inkHeight/2+top+i*115));ctx.restore();
  if(field.curve){const curved=canvas(w,h),pen=curved.getContext('2d');for(let x=0;x<w;x++){const offset=field.curve*(1-Math.pow((x-field.center[0])/(field.width/2),2));pen.drawImage(c,x,0,1,h,x,offset,1,h);}return curved;}
  return c;
 }
 async render(frame,{live=false,backgroundUrl,maskUrl}={}){
  if(this.disposed||!this.loaded)return;frame=Math.max(0,Math.min(this.master.output.frames-1,Math.floor(frame)));const time=frame/this.master.output.fps;
  if(this.externalBackground){if(!backgroundUrl||!maskUrl)throw Error('A source frame and restoration frame are required.');[this.baseTexture.image,this.packedTexture.image]=await Promise.all([image(backgroundUrl),image(maskUrl)]);}
  else if(!live||!this.playing)await Promise.all(this.videos.map(v=>seek(v,time)));else if(Math.abs(this.restoration.currentTime-this.video.currentTime)>.06)await seek(this.restoration,this.video.currentTime);
  this.baseTexture.needsUpdate=true;this.packedTexture.needsUpdate=true;
  for(const l of this.layers){const corners=cornersAt(l.scene,frame),treatment=treatmentAt(this.data,l.scene.id,frame),motion=this.motionTracks.get(l.scene.id),textCorners=motion?(motion.get(frame)||null):(treatment?treatmentCorners(treatment,frame):corners),visibility=weddingBellsLayerVisibility(this.master,frame,l.unchanged);
   l.restore.visible=!l.ornament&&!!corners&&visibility.restore;l.text.visible=!!textCorners&&(l.ornament?!!treatment:visibility.text);if(!corners&&!textCorners)continue;
   const blur=l.scene.transition?.blur,focus=blur?Math.max(0,Math.min(1,1-interpolate(blur,frame,1)/3)):1;
   const authored=treatment?treatmentVisibility(treatment,frame):{opacity:1,left:-1000,right:2000},u=l.text.material.uniforms;
   u.focus.value=focus*authored.opacity;l.restore.material.uniforms.focus.value=focus*authored.opacity;
   u.lettering.value=treatment&&l.trialTexture?l.trialTexture:l.texture;u.maskStrength.value=motion?1:(treatment?0:1);u.clipLeft.value=authored.left;u.clipRight.value=authored.right;
   l.restore.material.uniforms.clipLeft.value=authored.left;l.restore.material.uniforms.clipRight.value=authored.right;
   if(corners&&!l.ornament){const [x,y,w,h]=l.field.region,[sw,sh]=l.scene.size,region=[[x/sw,y/sh],[(x+w)/sw,y/sh],[(x+w)/sw,(y+h)/sh],[x/sw,(y+h)/sh]],sourceCorners=region.map(([u,v])=>project(corners,u,v)),planar=!!treatment?.planarTrack&&!!textCorners;l.restore.material.uniforms.restoreWarp.value=planar?1:0;this.place(l.restore,planar?region.map(([u,v])=>project(textCorners,u,v)):sourceCorners,planar?sourceCorners:undefined);}if(textCorners)this.place(l.text,textCorners);
  }
  this.renderer.render(this.scene,this.camera);
 }
 async setPlayback(playing,frame=0){
  if(!this.loaded||this.disposed)return;
  const revision=this.playbackRevision=(this.playbackRevision||0)+1;
  this.playing=false;this.videos.forEach(v=>v.pause());
  if(!playing)return;
  await Promise.all(this.videos.map(v=>seek(v,frame/this.master.output.fps)));
  if(this.disposed||revision!==this.playbackRevision)return;
  try{await Promise.all(this.videos.map(v=>v.play()));if(!this.disposed&&revision===this.playbackRevision)this.playing=true;}
  catch(e){if(revision===this.playbackRevision){this.videos.forEach(v=>v.pause());throw e;}}
 }
 validateText(){if(!this.loaded)throw Error('The invitation is not ready.');}
 disposeMedia(){for(const v of this.videos){v.pause();v.removeAttribute('src');v.load();}}
 dispose(){this.disposed=true;this.playing=false;this.disposeMedia();for(const m of this.meshes){m.geometry.dispose();m.material.dispose();}for(const l of this.layers||[]){l.texture.dispose();l.trialTexture?.dispose();}this.baseTexture?.dispose();this.packedTexture?.dispose();for(const f of this.fonts)document.fonts.delete(f);this.renderer?.dispose();}
}
