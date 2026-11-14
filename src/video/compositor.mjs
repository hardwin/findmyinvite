import * as THREE from 'three';
import {LAYER_ORDER,sceneAt,trackAt,videoText} from '../../shared/video-personalization.mjs';

const W=720,H=1280;
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>resolve(i);i.onerror=()=>reject(Error('An invitation asset could not be loaded.'));i.src=src;});
function canvas(w=W,h=H){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
async function loadVideo(src){const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.playsInline=true;v.preload='auto';await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>reject(Error('Video layer could not be loaded.'));v.src=src;v.load();});return v;}
async function seekVideo(v,time){if(Math.abs(v.currentTime-time)<.0001)return;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{v.removeEventListener('seeked',done);reject(Error('Video layer seek timed out.'));},10000);const done=()=>{clearTimeout(timer);resolve();};v.addEventListener('seeked',done,{once:true});v.currentTime=time;});}
function texture(source){const t=new THREE.CanvasTexture(source);t.colorSpace=THREE.SRGBColorSpace;return t;}
function bounds(img){const c=canvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(pixels[(y*c.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return right>left?[left,top,Math.min(c.width-left,right-left+2),Math.min(c.height-top,bottom-top+2)]:[0,0,c.width,c.height];}
// Homography maps a unit square onto a tracked four-corner surface.
export function project(c,u,v){const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=c;
 const dx1=x1-x2,dx2=x3-x2,dy1=y1-y2,dy2=y3-y2,sx=x0-x1+x2-x3,sy=y0-y1+y2-y3,det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)<1e-10?0:(sx*dy2-dx2*sy)/det,h=Math.abs(det)<1e-10?0:(dx1*sy-sx*dy1)/det,d=g*u+h*v+1;
 return [((x1-x0+g*x1)*u+(x3-x0+h*x3)*v+x0)/d,((y1-y0+g*y1)*u+(y3-y0+h*y3)*v+y0)/d];
}
export function fitText(ctx,text,{width,height,max=58,min=24,family='VideoSerif'}){
 for(let size=max;size>=min;size--){ctx.font=`600 ${size}px ${family}`;const rows=[];let invalid=false;
  for(const paragraph of text.split('\n')){let row='';if(!paragraph){rows.push('');continue;}for(const word of paragraph.split(/\s+/)){if(ctx.measureText(word).width>width){invalid=true;break;}const next=row?row+' '+word:word;if(ctx.measureText(next).width>width){rows.push(row);row=word;}else row=next;}rows.push(row);}
  if(!invalid&&rows.length*size*1.3<=height)return {rows,size,lineHeight:size*1.3};
 }
 throw Error('This text is too long for its board. Please shorten it before downloading.');
}
export class VideoCompositor {
 constructor(target){this.renderer=new THREE.WebGLRenderer({canvas:target,alpha:true,antialias:true,preserveDrawingBuffer:true});this.renderer.setSize(W,H,false);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(0,W,0,H,-10,10);this.camera.position.z=1;this.assets={};this.meshes=[];this.textures=new Map();this.photos={};this.disposed=false;}
 async load(master,content,{resolveAsset=p=>p,photos={},externalBackground=false}={}){
  this.master=master;this.content=content;this.photos=photos;this.resolveAsset=resolveAsset;
  const face=new FontFace('VideoSerif',`url(${resolveAsset(master.assets.serif.path)})`,{weight:'600'});await face.load();document.fonts.add(face);this.font=face;
  await Promise.all(Object.entries(master.assets).filter(([,a])=>a.kind==='image').map(async([id,a])=>{this.assets[id]=await image(resolveAsset(a.path));}));
  for(const [slot,p] of Object.entries(photos))this.assets['photo-'+slot]=await image(p.url);
  if(!externalBackground){const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.playsInline=true;v.preload='auto';this.video=v;await new Promise((yes,no)=>{v.onloadeddata=yes;v.onerror=()=>no(Error('The background video could not be loaded.'));v.src=resolveAsset(master.assets.background.path);v.load();});this.background=new THREE.VideoTexture(v);this.background.colorSpace=THREE.SRGBColorSpace;}
  if(!externalBackground){this.petalVideo=await loadVideo(resolveAsset(master.assets[master.petals.asset].path));this.petalTexture=new THREE.VideoTexture(this.petalVideo);this.petalTexture.colorSpace=THREE.SRGBColorSpace;}return this;
 }
 setContent(content){this.content=content;for(const [key,t] of this.textures)if(key.startsWith('text:')){t.dispose();this.textures.delete(key);}}
 cached(key,draw){if(!this.textures.has(key))this.textures.set(key,texture(draw()));return this.textures.get(key);}
 add(t,corners,order,opacity=1){if(opacity<=0)return;const g=new THREE.PlaneGeometry(1,1,20,20),pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++){const [x,y]=project(corners,uv.getX(i),1-uv.getY(i));pos.setXYZ(i,x*W,y*H,0);}pos.needsUpdate=true;const material=new THREE.MeshBasicMaterial({map:t,transparent:true,opacity,depthTest:false,depthWrite:false,side:THREE.DoubleSide});const mesh=new THREE.Mesh(g,material);mesh.renderOrder=order;this.scene.add(mesh);this.meshes.push(mesh);}
 graphic(layer){
  if(layer.type==='boards')return this.cached('asset:'+layer.asset,()=>this.assets[layer.asset]);
  if(layer.type==='text'){return this.cached('text:'+layer.id,()=>{const c=canvas(),ctx=c.getContext('2d'),[x,y,w,h]=layer.safeArea||[0,0,1,1],text=videoText(this.content)[layer.binding]||'';
   if(!text)return c;
   // Fit in physical on-screen bounds, not the full texture's nominal size.
   const corners=layer.track.at(-1).corners,screenW=Math.max(.01,Math.hypot(corners[1][0]-corners[0][0],(corners[1][1]-corners[0][1])*H/W))*W;
   const screenH=Math.max(.01,Math.hypot((corners[3][0]-corners[0][0])*W/H,corners[3][1]-corners[0][1]))*H;
   const scale=W/screenW;const f=fitText(ctx,text,{width:w*W,height:h*screenH*scale,max:(layer.font?.max||58)*scale,min:(layer.font?.min||24)*scale});
   ctx.save();ctx.translate((x+w/2)*W,y*H+h*H/2);ctx.scale(1,H/(screenH*scale));ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${f.size}px VideoSerif`;ctx.fillStyle=layer.font?.color||'#704b29';ctx.shadowColor='rgba(255,238,190,.32)';ctx.shadowBlur=2;
   f.rows.forEach((row,i)=>{const y=(i-(f.rows.length-1)/2)*f.lineHeight;if(!layer.board){ctx.strokeStyle='rgba(255,248,230,.85)';ctx.lineWidth=2.5*scale;ctx.lineJoin='round';ctx.strokeText(row,0,y);}ctx.fillText(row,0,y);});ctx.restore();return c;});}
  return this.cached('character:'+layer.id+JSON.stringify(this.photos),()=>{
   const corners=layer.track[0].corners,c=canvas(Math.round((corners[1][0]-corners[0][0])*W),Math.round((corners[3][1]-corners[0][1])*H)),ctx=c.getContext('2d');
   const slots=layer.binding==='couple'?(this.photos.couple?['couple']:['bride','groom']):[layer.binding];
   const pictures=slots.map(slot=>{const custom=this.photos[slot],img=this.assets[custom?'photo-'+slot:slot];if(!img)throw Error('Missing '+slot+' character.');const frame=custom?.mode==='frame';return {img,frame,box:frame?[0,0,img.width,img.height]:bounds(img)};});
   // Preserve human proportions and a shared ground line; crop empty alpha margins.
   const total=pictures.reduce((sum,p)=>sum+p.box[2],0),tall=Math.max(...pictures.map(p=>p.box[3])),gap=pictures.length>1?8:0,margin=pictures.some(p=>p.frame)?14:4,scale=Math.min((c.width-2*margin-gap)/total,(c.height-2*margin-16)/tall);
   let x=(c.width-total*scale-gap)/2;for(const {img,frame,box} of pictures){const w=box[2]*scale,h=box[3]*scale,y=c.height-margin-12-h;
    if(frame){ctx.fillStyle='#c49a4b';ctx.fillRect(x-9,y-9,w+18,h+18);ctx.fillStyle='#fff3db';ctx.fillRect(x-4,y-4,w+8,h+8);}else{ctx.save();ctx.filter='blur(7px)';ctx.fillStyle='rgba(31,25,20,.23)';ctx.beginPath();ctx.ellipse(x+w/2,c.height-margin-8,w*.44,8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.drawImage(img,...box,x,y,w,h);x+=w+gap;
   }return c;
  });
 }
 async render(frame,{backgroundUrl,petalsUrl,onlyLayer}={}){
  if(this.disposed)throw Error('Renderer disposed.');frame=Math.max(0,Math.min(1295,Math.floor(frame)));
  for(const mesh of this.meshes){this.scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}this.meshes=[];
  if(backgroundUrl){const img=await image(backgroundUrl);this.background?.dispose();this.background=texture(img);}else if(this.video){const t=frame/24;if(Math.abs(this.video.currentTime-t)>.0001)await new Promise((yes,no)=>{const timer=setTimeout(()=>{cleanup();no(Error('Background seeking timed out.'));},10000);const cleanup=()=>{clearTimeout(timer);this.video.removeEventListener('seeked',done);};const done=()=>{cleanup();yes();};this.video.addEventListener('seeked',done);this.video.currentTime=t;});this.background.needsUpdate=true;}
  const all=[[0,0],[1,0],[1,1],[0,1]];if(!onlyLayer||onlyLayer==='background')this.add(this.background,all,0);
  const scene=sceneAt(this.master,frame);for(const type of LAYER_ORDER.slice(1,4)){if(onlyLayer&&onlyLayer!==type)continue;for(const layer of scene.layers.filter(l=>l.type===type)){const parent=layer.board&&scene.layers.find(l=>l.id===layer.board);const k=trackAt((parent||layer).track,frame);this.add(this.graphic(layer),k.corners,LAYER_ORDER.indexOf(type),k.opacity);}}
  if(!onlyLayer||onlyLayer==='petals'){
   if(petalsUrl){this.petalTexture?.dispose();this.petalTexture=texture(await image(petalsUrl));}else if(this.petalVideo){const p=this.master.petals;await seekVideo(this.petalVideo,((frame/24)*p.playbackRate+p.offset)%this.petalVideo.duration);this.petalTexture.needsUpdate=true;}
   if(!this.petalTexture)throw Error('The petal video overlay is missing.');
   const safe=canvas(),ctx=safe.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle=`rgb(${Math.round(255*(this.master.petals.textCoverage??.12))} ${Math.round(255*(this.master.petals.textCoverage??.12))} ${Math.round(255*(this.master.petals.textCoverage??.12))})`;
   for(const l of scene.layers.filter(l=>l.type==='text')){const parent=l.board&&scene.layers.find(p=>p.id===l.board),k=trackAt((parent||l).track,frame);if(k.opacity<.1)continue;const [x,y,w,h]=l.safeArea||[0,0,1,1];ctx.beginPath();for(const [i,p] of [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].entries()){const q=project(k.corners,...p);i?ctx.lineTo(q[0]*W,q[1]*H):ctx.moveTo(q[0]*W,q[1]*H);}ctx.closePath();ctx.fill();}
   this.safeTexture?.dispose();this.safeTexture=texture(safe);this.safeTexture.colorSpace=THREE.NoColorSpace;
   this.add(this.petalTexture,all,4,this.master.petals.opacity);const material=this.meshes.at(-1).material;
   material.onBeforeCompile=shader=>{shader.uniforms.textSafe={value:this.safeTexture};shader.fragmentShader='uniform sampler2D textSafe;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec4 petalColor=texture2D(map,vec2(vMapUv.x*0.5,vMapUv.y)); float petalAlpha=texture2D(map,vec2(0.5+vMapUv.x*0.5,vMapUv.y)).r; diffuseColor *= vec4(petalColor.rgb,petalAlpha*texture2D(textSafe,vMapUv).r);`);};material.customProgramCacheKey=()=> 'packed-petal-overlay-v2';
  }
  this.renderer.setClearColor(0x000000,onlyLayer?0:1);this.renderer.render(this.scene,this.camera);
 }
 validateText(){for(const s of this.master.scenes)for(const l of s.layers.filter(l=>l.type==='text'))this.graphic(l);}
 dispose(){this.disposed=true;this.video?.pause();if(this.video){this.video.removeAttribute('src');this.video.load();}for(const m of this.meshes){m.geometry.dispose();m.material.dispose();}for(const t of this.textures.values())t.dispose();this.background?.dispose();this.petalTexture?.dispose();this.safeTexture?.dispose();if(this.petalVideo){this.petalVideo.pause();this.petalVideo.removeAttribute('src');this.petalVideo.load();}if(this.font)document.fonts.delete(this.font);this.renderer.dispose();}
}
