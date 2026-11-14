import * as THREE from 'three';
import {templeText} from '../../shared/temple-video.mjs';
import {createPreviewVideo,seekPreviewVideo,releasePreviewVideo} from './preview-media.mjs';

const W=720,H=1280;
// CPU-backed scratch surfaces avoid deferred GPU canvas snapshots retaining a
// previous frame's mutable mask. The final presentation remains a WebGL texture.
const canvas=()=>{const c=Object.assign(document.createElement('canvas'),{width:W,height:H});c.getContext('2d',{willReadFrequently:true});return c;};
const picture=src=>new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error('An approved video asset could not be loaded.'));im.src=src;});
function interpolate(keys,n){const i=keys.findIndex(k=>k[0]>n);if(i===0)return keys[0][1];if(i<0)return keys.at(-1)[1];const [a,x]=keys[i-1],[b,y]=keys[i],t=(n-a)/(b-a);return x.map((v,j)=>v+(y[j]-v)*t);}
const point=(m,x,y)=>{const z=m[2][0]*x+m[2][1]*y+m[2][2];return [(m[0][0]*x+m[0][1]*y+m[0][2])/z,(m[1][0]*x+m[1][1]*y+m[1][2])/z];};

// Canvas and export use this same explicit-frame transform, including perspective.
function warp(ctx,im,m,projective){
 const affine=[[m[0][0],m[0][1],m[0][2]],[m[1][0],m[1][1],m[1][2]],[0,0,1]];
 // Tiny estimated perspective jitter is sub-pixel; avoid raster triangle seams.
 if([[0,0],[W,0],[W,H],[0,H]].every(p=>{const a=point(m,...p),b=point(affine,...p);return Math.hypot(a[0]-b[0],a[1]-b[1])<.25;})){ctx.save();ctx.transform(m[0][0],m[1][0],m[0][1],m[1][1],m[0][2],m[1][2]);ctx.drawImage(im,0,0,W,H);ctx.restore();return;}
 ctx.drawImage(projective(im,m),0,0);
}
function alphaBounds(im){const c=canvas(),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,W,H);const p=ctx.getImageData(0,0,W,H).data;let l=W,t=H,r=0,b=0;for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(p[(y*W+x)*4+3]>20){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}if(r<=l)throw Error('The photo has no visible subject. Choose another photo or a frame.');return [l,t,r-l+2,b-t+2];}

// Fit complete graphemes. Never truncate text or draw below the master's minimum.
export function fitTempleBlock(ctx,text,b){
 if(!text)return {rows:[],size:b.max,lineHeight:b.max,metrics:[]};
 for(let size=b.max;size>=b.min;size--){ctx.font=`${size}px "${b.font}"`;const rows=[];
  for(const paragraph of text.split('\n')){let row='';for(const word of paragraph.split(/\s+/).filter(Boolean)){const next=row?row+' '+word:word;if(ctx.measureText(next).width>b.width&&row){rows.push(row);row=word;}else row=next;}rows.push(row);}
  const metrics=rows.map(r=>ctx.measureText(r)),lineHeight=b.lineHeight?b.lineHeight*size/b.max:size*1.2;
  const height=(rows.length-1)*lineHeight+Math.max(...metrics.map(m=>m.actualBoundingBoxAscent+m.actualBoundingBoxDescent),0);
  if(height<=b.height&&metrics.every(m=>Math.max(m.width,m.actualBoundingBoxLeft+m.actualBoundingBoxRight)<=b.width))return {rows,size,lineHeight,metrics};
 }
 const error=Error(`Please shorten “${text.slice(0,38)}${text.length>38?'…':''}” so it fits the invitation. Nothing has been cut off.`);error.code='TEXT_FIT';error.field=b.binding;throw error;
}

export class TempleCompositor {
 constructor(target){
  this.surface=canvas();this.ctx=this.surface.getContext('2d');this.layer=canvas();this.mask=canvas();this.safety=canvas();this.petals=canvas();this.petalAlpha=canvas();this.blurred=canvas();this.text={};this.assets={};this.fonts=[];this.disposed=false;this.loaded=false;this.abort=new AbortController();this.videos=[];
  // One shared Three.js presentation surface. All compositing is frame-driven.
  this.renderer=new THREE.WebGLRenderer({canvas:target,alpha:false,antialias:false,preserveDrawingBuffer:true});this.renderer.setSize(W,H,false);this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
  this.texture=new THREE.CanvasTexture(this.surface);this.texture.colorSpace=THREE.NoColorSpace;
  this.material=new THREE.RawShaderMaterial({uniforms:{film:{value:this.texture}},vertexShader:'precision highp float; attribute vec3 position; attribute vec2 uv; varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.);}',fragmentShader:'precision highp float; uniform sampler2D film; varying vec2 vUv; void main(){gl_FragColor=texture2D(film,vUv);}'});
  this.geometry=new THREE.PlaneGeometry(2,2);this.scene=new THREE.Scene();this.scene.add(new THREE.Mesh(this.geometry,this.material));this.camera=new THREE.Camera();
 }
 async load(master,content,{resolveAsset=p=>p,photos={},externalBackground=false}={}){
  this.master=master;this.photos=photos;const url=id=>resolveAsset(master.assets[id].path);
  await Promise.all(Object.entries(master.assets).filter(([,a])=>a.kind==='font').map(async([id])=>{const face=await new FontFace(id,`url("${url(id)}")`).load();this.fonts.push(face);document.fonts.add(face);}));
  await document.fonts.ready;
  const response=await fetch(url('motion'));if(!response.ok)throw Error('Approved movement tracks are missing.');this.motion=await response.json();if(this.motion.frames.length!==1296)throw Error('Incomplete movement tracks.');
  await Promise.all(Object.entries(master.assets).filter(([,a])=>a.kind==='image').map(async([id])=>{this.assets[id]=await picture(url(id));}));
  for(const [slot,p] of Object.entries(photos))this.assets['photo-'+slot]=await picture(p.url);
  this.characterImages={groom:this.prepareCharacter('groom'),bride:this.prepareCharacter('bride'),closing:this.prepareCharacter('closing')};
  if(this.disposed)return this;
  if(!externalBackground){
   const compatible=master.preview?.atlasAsset&&document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"');
   const ids=compatible?[master.preview.atlasAsset]:[master.assets.backgroundPreview?'backgroundPreview':'background','petals','foregroundMask'];
   const media=ids.map(id=>createPreviewVideo(url(id),this.abort.signal,compatible?[1080,1920]:id==='petals'?[1440,1280]:[720,1280]));this.videos=media.map(m=>m.element);this.video=this.videos[0];
   if(compatible){this.atlas=true;this.atlasFrame=Object.assign(document.createElement('canvas'),{width:1080,height:1920});this.atlasBackground=canvas();this.atlasPetals=Object.assign(document.createElement('canvas'),{width:W*2,height:H});this.atlasMask=canvas();}
   else [this.video,this.petalVideo,this.maskVideo]=this.videos;
   await Promise.all(media.map(m=>m.ready));
  }
  this.background=true;this.loaded=true;this.setContent(content);if(this.disposed)this.dispose();return this;
 }
 prepareCharacter(slot){
  const couple=slot==='closing';if(!couple&&!this.photos[slot]||couple&&!this.photos.couple&&!this.photos.groom&&!this.photos.bride)return this.assets[slot];
  const custom=this.photos[couple?'couple':slot];if(custom?.mode==='prepared'){const image=this.assets['photo-'+(couple?'couple':slot)];if(image.width!==W||image.height!==H)throw Error('Prepared character dimensions do not match the master.');return image;}
  const out=canvas(),ctx=out.getContext('2d');const place=(key,box)=>{const custom=this.photos[key],source=this.assets[custom?'photo-'+key:key];if(!source)throw Error('A selected photo is missing.');const framed=custom?.mode==='frame';if(framed){const frameKey=couple&&key!=='couple'?'joint'+key[0].toUpperCase()+key.slice(1):key;box=this.master.photoFrames?.[frameKey]||box;}const temporary=canvas(),c=temporary.getContext('2d');c.drawImage(source,0,0,W,H);const crop=framed?[0,0,W,H]:alphaBounds(source);const aspect=custom?source.width/source.height:W/H;
   const naturalW=crop[2]*aspect/(W/H),naturalH=crop[3],padding=framed?12:0;const s=Math.min((box[2]-padding*2)/naturalW,(box[3]-padding*2)/naturalH),w=naturalW*s,h=naturalH*s,x=box[0]+(box[2]-w)/2,y=framed?box[1]+(box[3]-h)/2:box[1]+box[3]-h-padding;
   ctx.save();ctx.fillStyle='rgba(50,29,10,.22)';ctx.filter='blur(7px)';ctx.beginPath();ctx.ellipse(x+w/2,box[1]+box[3]-2,w*.42,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
   if(custom?.mode==='frame'){ctx.fillStyle='#b58b36';ctx.fillRect(x-10,y-10,w+20,h+20);ctx.fillStyle='#fff0cc';ctx.fillRect(x-5,y-5,w+10,h+10);}
   ctx.drawImage(temporary,...crop,x,y,w,h);
  };
  const box=alphaBounds(this.assets[slot]);if(couple&&!this.photos.couple){const gap=8;place('groom',[box[0],box[1],(box[2]-gap)/2,box[3]]);place('bride',[box[0]+(box[2]+gap)/2,box[1],(box[2]-gap)/2,box[3]]);}else place(couple?'couple':slot,box);return out;
 }
 setContent(content){const values=templeText(content),next={},bounds={};
  for(const [id,blocks] of Object.entries(this.master.text)){const c=this.text[id]||canvas(),ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);bounds[id]=[];
   for(const b of blocks){const text=String(values[b.binding]||''),f=fitTempleBlock(ctx,text,b);ctx.font=`${f.size}px "${b.font}"`;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle=b.color;ctx.lineJoin='round';
    for(let i=0;i<f.rows.length;i++){const m=f.metrics[i],width=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,x=b.centerX-width/2+m.actualBoundingBoxLeft,y=b.top+i*f.lineHeight+m.actualBoundingBoxAscent;if(b.outline){ctx.strokeStyle='#fff0ca';ctx.lineWidth=2;ctx.strokeText(f.rows[i],x,y);}ctx.fillText(f.rows[i],x,y);bounds[id].push([b.centerX-width/2,b.top+i*f.lineHeight,width,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent]);}
   }next[id]=c;
  }this.text=next;this.textBounds=bounds;this.content=content;
 }
 validateText(){this.setContent(this.content);}
 projectiveWarp(im,m){
  if(!this.warpRenderer){const c=Object.assign(document.createElement('canvas'),{width:W,height:H});this.warpRenderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:false,preserveDrawingBuffer:true});this.warpRenderer.setSize(W,H,false);this.warpTexture=new THREE.CanvasTexture(im);this.warpTexture.premultiplyAlpha=true;this.warpTexture.colorSpace=THREE.NoColorSpace;this.warpMaterial=new THREE.RawShaderMaterial({uniforms:{source:{value:this.warpTexture},inverse:{value:new THREE.Matrix3()}},vertexShader:this.material.vertexShader,fragmentShader:'precision highp float; uniform sampler2D source; uniform mat3 inverse; varying vec2 vUv; void main(){vec3 p=inverse*vec3(vUv.x*720.,(1.-vUv.y)*1280.,1.);vec2 uv=p.xy/p.z/vec2(720.,1280.);if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.)))){gl_FragColor=vec4(0.);}else{gl_FragColor=texture2D(source,vec2(uv.x,1.-uv.y));}}',blending:THREE.NoBlending});this.warpScene=new THREE.Scene();this.warpScene.add(new THREE.Mesh(this.geometry,this.warpMaterial));}
  this.warpTexture.image=im;this.warpTexture.needsUpdate=true;this.warpMaterial.uniforms.inverse.value.set(...m.flat()).invert();this.warpRenderer.render(this.warpScene,this.camera);return this.warpRenderer.domElement;
 }
 outlineMask(name,n){const ctx=this.mask.getContext('2d'),o=this.motion.occlusion.outlines[name],xs=interpolate(o.keys,n),ys=this.motion.occlusion.ySamples;ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(o.side==='right'?W:0,0);for(let i=0;i<ys.length;i++)ctx.lineTo(xs[i],ys[i]);ctx.lineTo(o.side==='right'?W:0,H);ctx.closePath();ctx.fill();return this.mask;}
 applyMask(ctx,id,n){
  const ids={invitation:[n<216?'invitation-reveal':'invitation-exit'],groom:['groom-reveal','groom-exit'],bride:['bride-reveal','bride-exit'],family:['family-exit'],ceremony:['ceremony-reveal','ceremony-exit'],venue:['venue-reveal','venue-exit'],reception:['reception-reveal','reception-exit'],hosts:['hosts-reveal']}[id]||[];
  ctx.save();ctx.globalCompositeOperation='destination-in';for(const key of ids)ctx.drawImage(this.outlineMask(key,n),0,0);
  if(id==='hosts'&&n>=1078||id==='closing'&&n<1095){const m=this.mask.getContext('2d');m.clearRect(0,0,W,H);let edge;if(id==='hosts'){edge=(n/24-44.9)*2600;const g=m.createLinearGradient(edge-70,0,edge,0);g.addColorStop(0,'transparent');g.addColorStop(1,'white');m.fillStyle=g;}else{edge=-1100+(n/24-44.9)*2600;const g=m.createLinearGradient(edge,0,edge+70,0);g.addColorStop(0,'white');g.addColorStop(1,'transparent');m.fillStyle=g;}m.fillRect(0,0,W,H);ctx.drawImage(this.mask,0,0);}
  ctx.restore();
 }
 motionBlur(ctx,id,m,n){const a=this.motion.frames[Math.max(0,n-1)].find(r=>r.asset===id)?.matrix||m,b=this.motion.frames[Math.min(1295,n+1)].find(r=>r.asset===id)?.matrix||m;const amount=Math.abs(point(b,360,800)[0]-point(a,360,800)[0])/4;
  if(amount<1.5)return;const radius=Math.min(17,Math.max(3,Math.round(amount)|1)),blur=this.blurred.getContext('2d');blur.clearRect(0,0,W,H);blur.drawImage(this.layer,0,0);ctx.clearRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1/radius;for(let i=0;i<radius;i++)ctx.drawImage(this.blurred,i-Math.floor(radius/2),0);ctx.restore();
 }
 async render(frame,{backgroundUrl,petalsUrl,maskUrl,onlyLayer,live=false,present=true}={}){
  if(this.disposed||!this.loaded)return;frame=Math.max(0,Math.min(1295,Math.floor(frame)));
  let bg,petals,foreground;
  if(backgroundUrl)[bg,petals,foreground]=await Promise.all([picture(backgroundUrl),picture(petalsUrl),picture(maskUrl)]);
  else{if(!live)await Promise.all(this.videos.map(v=>seekPreviewVideo(v,frame,this.abort.signal)));if(this.atlas){const t=this.master.preview.tiles;
   // Snapshot the complete video frame first. Some WebKit media backends do not
   // honour source-rectangle cropping when drawImage reads a video directly.
   const source=this.atlasFrame;source.getContext('2d').drawImage(this.video,0,0,1080,1920);
   this.atlasBackground.getContext('2d').drawImage(source,...t.background,0,0,W,H);const p=this.atlasPetals.getContext('2d');p.drawImage(source,...t.petals,0,0,W,H);p.drawImage(source,...t.alpha,W,0,W,H);this.atlasMask.getContext('2d').drawImage(source,...t.mask,0,0,W,H);bg=this.atlasBackground;petals=this.atlasPetals;foreground=this.atlasMask;}else{bg=this.video;petals=this.petalVideo;foreground=this.maskVideo;}}
  if(this.disposed)return;const ctx=this.ctx,l=this.layer.getContext('2d'),safe=this.safety.getContext('2d');ctx.clearRect(0,0,W,H);safe.clearRect(0,0,W,H);if(!onlyLayer||onlyLayer==='background')ctx.drawImage(bg,0,0,W,H);
  const active=this.motion.frames[frame],draw=(entry,text=false)=>{const {asset:id,matrix:m}=entry;l.clearRect(0,0,W,H);const source=text?this.text[id]:this.characterImages[id]||this.assets[id];if(!source)return;warp(l,source,m,(im,m)=>this.projectiveWarp(im,m));this.motionBlur(l,id,m,frame);this.applyMask(l,id,frame);
   if(id==='opening'){l.save();l.globalCompositeOperation='destination-in';l.fillStyle=`rgba(0,0,0,${Math.max(0,Math.min(1,(frame-60)/12,(120-frame)/6))})`;l.fillRect(0,0,W,H);l.restore();}
   if(id==='closing'&&!text){const mask=this.mask.getContext('2d',{willReadFrequently:true});mask.clearRect(0,0,W,H);mask.drawImage(foreground,0,0,W,H);const data=mask.getImageData(0,0,W,H);for(let i=0;i<data.data.length;i+=4)data.data[i+3]=data.data[i];mask.putImageData(data,0,0);l.save();l.globalCompositeOperation='destination-out';l.drawImage(this.mask,0,0);l.restore();}
   ctx.drawImage(this.layer,0,0);if(text){safe.save();safe.filter='blur(15px)';safe.shadowColor='#fff';safe.shadowBlur=20;safe.drawImage(this.layer,0,0);safe.restore();}
  };
  for(const type of ['characters','boards','text']){if(onlyLayer&&onlyLayer!==type)continue;for(const e of active){const character=['groom','bride','closing'].includes(e.asset);if(type==='text'||type==='characters'&&character||type==='boards'&&!character&&e.asset!=='opening')draw(e,type==='text');}}
  if(!onlyLayer||onlyLayer==='petals'){
   const p=this.petals.getContext('2d'),alpha=this.petalAlpha.getContext('2d',{willReadFrequently:true});p.clearRect(0,0,W,H);p.drawImage(petals,0,0,W,H,0,0,W,H);alpha.drawImage(petals,W,0,W,H,0,0,W,H);const data=alpha.getImageData(0,0,W,H);for(let i=0;i<data.data.length;i+=4)data.data[i+3]=data.data[i];alpha.putImageData(data,0,0);p.save();p.globalCompositeOperation='destination-in';p.drawImage(this.petalAlpha,0,0);p.globalCompositeOperation='destination-out';p.globalAlpha=.82;p.drawImage(this.safety,0,0);p.restore();ctx.drawImage(this.petals,0,0);
  }
  if(present){this.texture.needsUpdate=true;this.renderer.render(this.scene,this.camera);}
 }
 async activateMedia(){const plays=this.videos.map(v=>v.play());try{await Promise.all(plays);}finally{this.videos.forEach(v=>v.pause());}}
 async setPlayback(playing,frame){const revision=this.playbackRevision=(this.playbackRevision||0)+1;this.playing=false;if(!playing){this.videos.forEach(v=>v.pause());return;}try{const seeks=this.videos.map(v=>seekPreviewVideo(v,frame,this.abort.signal));const plays=this.videos.map(v=>v.play());await Promise.all([...seeks,...plays]);if(this.disposed||revision!==this.playbackRevision){this.videos.forEach(v=>v.pause());return;}this.playing=true;}catch(e){this.videos.forEach(v=>v.pause());throw e;}}
 dispose(){this.disposed=true;this.loaded=false;this.abort.abort();for(const v of this.videos)releasePreviewVideo(v);for(const f of this.fonts)document.fonts.delete(f);this.texture.dispose();this.geometry.dispose();this.material.dispose();this.renderer.dispose();this.warpTexture?.dispose();this.warpMaterial?.dispose();this.warpRenderer?.dispose();}
}
