// Version 2 uses one rigid translation for an entire scene. Fixed perspective,
// scale and velocity prevent the phase changes/deformation in the first trial.
// Older surface versions retain their authored anchor behavior for rollback.
export function linearValue(keys, frame, column = 1) {
 const next = keys.findIndex(key => key[0] > frame);
 if (next === 0) return keys[0][column];
 if (next < 0) return keys.at(-1)[column];
 const a = keys[next - 1], b = keys[next], t = (frame - a[0]) / (b[0] - a[0]);
 return a[column] + (b[column] - a[column]) * t;
}
export function treatmentAt(data, sceneId, frame) {
 const trial = data.textTreatment;
 if (!trial || frame < trial.start || frame >= trial.end) return null;
 return trial.scenes[sceneId] || null;
}
export function treatmentCorners(treatment, frame) {
 if (frame < treatment.start || frame >= treatment.end) return null;
 if (treatment.planarTrack) {
  const rows=treatment.planarTrack,index=Math.max(0,Math.min(rows.length-1,frame-rows[0].frame)),a=rows[Math.floor(index)],b=rows[Math.ceil(index)],t=index-Math.floor(index);
  return a.corners.map(([x,y],i)=>[x+(b.corners[i][0]-x)*t,y+(b.corners[i][1]-y)*t]);
 }
 if (treatment.linearMotion) {
  const {anchorFrame,quad,velocity:[vx,vy]}=treatment.linearMotion,dt=frame-anchorFrame;
  return quad.map(([x,y])=>[x+vx*dt,y+vy*dt]);
 }
 const flat = Array.from({length:8}, (_,i) => linearValue(treatment.planes,frame,i+1));
 return Array.from({length:4}, (_,i) => flat.slice(i*2,i*2+2));
}
export function treatmentVisibility(treatment, frame) {
 let opacity = 1;
 if (treatment.fadeIn) { const [a,b] = treatment.fadeIn; opacity *= Math.max(0,Math.min(1,(frame-a)/(b-a))); }
 if (treatment.fadeOut) { const [a,b] = treatment.fadeOut; opacity *= Math.max(0,Math.min(1,(b-frame)/(b-a))); }
 return {opacity,left:treatment.leftClip?linearValue(treatment.leftClip,frame):-1000,right:treatment.rightClip?linearValue(treatment.rightClip,frame):2000};
}
const surface = (w,h) => { const c=document.createElement('canvas');c.width=w;c.height=h;return c; };

// A fixed light direction creates a shallow metallic relief from the glyph
// alpha. Unlike a moving shine, it cannot make strokes shimmer between frames.
function illuminate(mask, material) {
 const w=mask.width,h=mask.height,ctx=mask.getContext('2d'),pixels=ctx.getImageData(0,0,w,h),out=surface(w,h),pen=out.getContext('2d');
 const a=(x,y)=>x<0||y<0||x>=w||y>=h?0:pixels.data[(y*w+x)*4+3]/255;
 const colours=material==='embossed'?[[253,227,155],[160,112,39]]:material==='ink'?[[175,135,76],[133,95,47]]:[[255,249,215],[233,210,153]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!pixels.data[i+3])continue;
  const slope=(a(x+1,y+1)-a(x-1,y-1))*.5;
  const highlight=Math.max(-.65,Math.min(.65,slope*(material==='ink'?.25:.85)));
  const t=Math.max(0,Math.min(1,(y/h)*.8+.15-highlight));
  for(let ch=0;ch<3;ch++)pixels.data[i+ch]=colours[0][ch]*(1-t)+colours[1][ch]*t;
 }
 ctx.putImageData(pixels,0,0);
 if(material==='luminous'){
  pen.shadowColor='rgba(255,232,167,.45)';pen.shadowBlur=6;pen.drawImage(mask,0,0);pen.shadowBlur=0;
 }else if(material==='embossed'){
  // A few pixels of recessed bronze below/right, independent of camera motion.
  const depth=surface(w,h),d=depth.getContext('2d');d.drawImage(mask,0,0);d.globalCompositeOperation='source-in';d.fillStyle='#73501d';d.fillRect(0,0,w,h);
  pen.globalAlpha=.65;for(let n=3;n>=1;n--)pen.drawImage(depth,n*.65,n*.8);pen.globalAlpha=1;
 }
 pen.drawImage(mask,0,0);return out;
}
export function treatedLettering(scene,field,value,referenceValue,style) {
 const [w,h]=scene.size,mask=surface(w,h),pen=mask.getContext('2d');if(!value)return mask;
 const family=`"WeddingBells-${style.font||'Tinos-Regular'}","WeddingBells-NotoSerifMalayalam",serif`;
 pen.font=`100px ${family}`;pen.textAlign='center';pen.textBaseline='alphabetic';
 const bounds=rows=>{const m=rows.map(s=>pen.measureText(s));return {width:Math.max(1,...m.map(k=>k.actualBoundingBoxLeft+k.actualBoundingBoxRight)),top:Math.max(...m.map(k=>k.actualBoundingBoxAscent)),bottom:Math.max(...m.map(k=>k.actualBoundingBoxDescent))};};
 const ref=bounds([referenceValue||value]),[targetW,targetH]=style.inkSize;
 const sx=targetW/ref.width,sy=targetH/Math.max(1,ref.top+ref.bottom);
 let rows=value.split('\n'),b=bounds(rows),shrink=Math.min(1,targetW/(b.width*sx),targetH/((b.top+b.bottom+(rows.length-1)*115)*sy));
 if(shrink<.7&&['groom','bride'].includes(field.binding)&&rows.length===1){
  const words=value.trim().split(/\s+/);
  for(let i=1;i<words.length;i++){
   const candidate=[words.slice(0,i).join(' '),words.slice(i).join(' ')],q=bounds(candidate),fit=Math.min(1,targetW/(q.width*sx),(style.longHeight||targetH*1.55)/((q.top+q.bottom+115)*sy));
   if(fit>shrink*1.15){rows=candidate;b=q;shrink=fit;}
  }
 }
 if(100*Math.min(sx,sy)*shrink<19)throw Object.assign(Error('The '+field.binding+' text is too long for its space.'),{code:'TEXT_FIT',field:field.binding});
 const center=style.center||field.center,inkH=b.top+b.bottom+(rows.length-1)*115;
 pen.save();pen.translate(...center);pen.scale(sx*shrink,sy*shrink);pen.fillStyle='white';
 if(style.weight){pen.strokeStyle='white';pen.lineWidth=style.weight;pen.lineJoin='round';}
 rows.forEach((row,i)=>{const y=-inkH/2+b.top+i*115,m=pen.measureText(row),x=(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2;if(style.weight)pen.strokeText(row,x,y);pen.fillText(row,x,y);});pen.restore();
 let shape=mask;
 if(style.curve){shape=surface(w,h);const p=shape.getContext('2d');for(let x=0;x<w;x++){const shift=style.curve*Math.pow((x-center[0])/(targetW/2),2);p.drawImage(mask,x,0,1,h,x,shift,1,h);}}
 return illuminate(shape,style.material);
}
export function ornamentLettering(scene,ornament) {
 const [w,h]=scene.size,c=surface(w,h),p=c.getContext('2d');p.translate(...ornament.center);p.scale(ornament.width/520,ornament.height/80);p.strokeStyle='white';p.lineWidth=2.1;p.lineCap='round';
 // Original symmetric pen strokes, rendered in the same plane as the names.
 p.beginPath();p.moveTo(-252,9);p.bezierCurveTo(-269,-21,-207,-41,-147,-26);p.bezierCurveTo(-86,-14,-57,15,0,13);p.bezierCurveTo(57,15,86,-14,147,-26);p.bezierCurveTo(207,-41,269,-21,252,9);p.stroke();
 p.beginPath();p.moveTo(-118,-14);p.bezierCurveTo(-59,-2,-43,22,-4,22);p.moveTo(118,-14);p.bezierCurveTo(59,-2,43,22,4,22);p.stroke();
 p.fillStyle='white';for(let i=0;i<8;i++){p.save();p.rotate(i*Math.PI/4);p.beginPath();p.ellipse(0,-14,3.6,11,0,0,Math.PI*2);p.fill();p.restore();}
 p.beginPath();p.moveTo(0,19);p.lineTo(5,26);p.lineTo(0,34);p.lineTo(-5,26);p.closePath();p.fill();p.setTransform(1,0,0,1,0,0);
 return illuminate(c,ornament.material);
}
