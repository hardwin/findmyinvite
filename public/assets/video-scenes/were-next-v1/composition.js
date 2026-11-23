import {DESIGN} from './design.js';
const d=structuredClone(DESIGN);
export const images={};
export const canvas=document.querySelector('#film');
const ctx=canvas.getContext('2d',{alpha:false});
const clamp=x=>Math.max(0,Math.min(1,x)),progress=(t,a,b)=>clamp((t-a)/(b-a)),ease=x=>1-Math.pow(1-x,3);
export async function loadImage(url){const img=new Image();img.src=url;await img.decode();return img;}
export function setWords(words){Object.assign(d.text,words);}
export function setExportScale(scale=1){canvas.width=720*scale;canvas.height=1280*scale;ctx.setTransform(scale,0,0,scale,0,0);}
function font(size,family='Hand',weight=700){ctx.font=weight+' '+size+'px '+family;}
function handwritten(text,y,size,p){
 font(size);while(ctx.measureText(text).width>610){size--;font(size);}const w=ctx.measureText(text).width;
 ctx.save();ctx.fillStyle=d.colors.ink;ctx.textBaseline='alphabetic';ctx.textAlign='center';ctx.beginPath();ctx.rect(360-w/2-8,y-size-20,(w+16)*p,size+55);ctx.clip();ctx.fillText(text,360,y);ctx.restore();
}
function titlePaper(reveal,t){
 ctx.save();ctx.translate(360,reveal?148:193);ctx.rotate((reveal?1:-1)*Math.PI/180);ctx.shadowColor='#57242b22';ctx.shadowBlur=12;ctx.shadowOffsetY=6;ctx.fillStyle='#fff9ec';
 ctx.beginPath();ctx.moveTo(-322,-123);ctx.lineTo(320,-130);ctx.lineTo(324,116);ctx.lineTo(-317,130);ctx.closePath();ctx.fill();ctx.restore();
 if(reveal)handwritten(d.text.reveal,192,103,progress(t,d.motion.revealStart,d.motion.revealEnd));
 else{const p=progress(t,d.motion.openingStart,d.motion.openingEnd);handwritten(d.text.opening[0],168,85,clamp(p*2));handwritten(d.text.opening[1],275,83,clamp(p*2-1));}
}
function dateTicket(t){
 const p=ease(progress(t,6.25,7.25));if(!p)return;
 // Complete ticket and lettering translate together; no independent text drift.
 ctx.save();ctx.translate(60,450-190*p);ctx.shadowColor='#49263122';ctx.shadowBlur=10;ctx.shadowOffsetY=5;ctx.drawImage(images.ticket,0,0,600,170);ctx.shadowColor='transparent';
 ctx.fillStyle=d.colors.accent;ctx.textAlign='center';ctx.textBaseline='alphabetic';font(26,'Sans',500);ctx.globalAlpha=progress(t,6.5,7.3);let headingSize=26;while(ctx.measureText(d.text.heading).width>540&&headingSize>12)font(--headingSize,'Sans',500);ctx.fillText(d.text.heading,300,58);
 ctx.globalAlpha=progress(t,7.4,8.1);ctx.fillStyle=d.colors.ink;font(35,'Sans',700);const {day,ordinal,monthYear}=d.text,w1=ctx.measureText(day).width,w3=ctx.measureText(monthYear).width;font(19,'Sans',700);const w2=ctx.measureText(ordinal).width,x=(600-w1-w2-w3)/2;
 ctx.textAlign='left';font(35,'Sans',700);ctx.fillText(day,x,113);ctx.fillText(monthYear,x+w1+w2,113);font(19,'Sans',700);ctx.fillText(ordinal,x+w1,99);ctx.restore();
}
function snapshot(reveal,t){
 const f=d.figure,turn=reveal?ease(progress(t,5,5.24)):0,angle=reveal?f.openingAngle+(f.revealAngle-f.openingAngle)*turn:f.openingAngle;
 ctx.save();ctx.translate(f.centerX,f.centerY);ctx.rotate(angle*Math.PI/180);ctx.shadowColor='#542e3b40';ctx.shadowBlur=24;ctx.shadowOffsetY=12;ctx.fillStyle='#fffaf0';ctx.fillRect(-320,-402,640,804);ctx.shadowColor='transparent';
 ctx.save();ctx.beginPath();ctx.rect(-302,-384,604,728);ctx.clip();ctx.fillStyle='#f6d0be';ctx.fillRect(-302,-384,604,728);ctx.strokeStyle='#edbba9';ctx.lineWidth=40;
 for(let x=-480;x<500;x+=140){ctx.beginPath();ctx.moveTo(x,-384);ctx.lineTo(x+300,344);ctx.stroke();}
 const slot=reveal?'reveal':'opening',photo=images[slot+'Photo'];
 if(photo){const scale=Math.min(604/photo.width,728/photo.height),w=photo.width*scale,h=photo.height*scale;ctx.drawImage(photo,-w/2,-384+(728-h)/2,w,h);}else ctx.drawImage(images[slot],-364,-384,728,728);ctx.restore();
 ctx.strokeStyle=d.colors.accent;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-280,369);ctx.lineTo(-220,369);ctx.stroke();ctx.fillStyle=d.colors.accent;ctx.beginPath();ctx.arc(267,370,6,0,Math.PI*2);ctx.fill();
 if(reveal){ctx.strokeStyle='#fff9ec';ctx.lineWidth=3;for(const [x,y,sign]of [[-210,-280,-1],[190,-350,1]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sign*10,y-26);ctx.moveTo(x+sign*16,y+5);ctx.lineTo(x+sign*36,y-9);ctx.stroke();}}
 ctx.restore();
 for(const [x,y,a]of [[86,430,-.35],[634,450,.4]]){ctx.save();ctx.fillStyle='#d8c2f0ad';ctx.translate(x,y);ctx.rotate(a);ctx.fillRect(-34,-13,68,26);ctx.restore();}
}
export function render(frame){
 frame=Math.min(299,Math.max(0,Math.floor(frame)));const t=frame/30,reveal=frame>=150;ctx.drawImage(images.background,0,0,720,1280);titlePaper(reveal,t);if(reveal)dateTicket(t);snapshot(reveal,t);
 if(t>=5&&t<5.13){ctx.save();ctx.globalAlpha=.38*(1-progress(t,5,5.13));ctx.fillStyle='#fff';ctx.fillRect(0,0,720,1280);ctx.restore();}return canvas;
}
