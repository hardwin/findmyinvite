import {loadPlate,seekPlate} from './media-r2.js';
import {SAMPLE_FIELDS, CHAPTERS, validateFields, buildDetails, EN_MONTHS} from '../v1/editor/details-oonjal.js';

const video=document.getElementById('plate');
const canvas=document.getElementById('lettering');
const ctx=canvas.getContext('2d');
const composite=document.createElement('canvas');
composite.width=720;
composite.height=1280;
const output=composite.getContext('2d',{alpha:false});
const fields=['brideEn','groomEn','weddingDate'];
const rules={duration:34.5,chapters:CHAPTERS,visible:Object.fromEntries(fields.map(key=>[key,true])),required:fields};
const reference={month:'FEBRUARY LA',bride:'MEERA',groom:'ARJUN',date:'15TH FEBRUARY, 2027'};
const settled={month:75,bride:216,groom:501,date:747};
const ink={month:'#152936',bride:'#77213b',groom:'#77213b',date:'#152936'};
const sheets=new Map();
let tracks,content,words,blobUrl;
const mediaController=new AbortController();

function setContent(input){
  content=input;
  const data={...SAMPLE_FIELDS,...Object.fromEntries(fields.map(key=>[key,input[key]||SAMPLE_FIELDS[key]]))};
  const details=buildDetails(data);
  words={month:EN_MONTHS[Number(data.weddingDate.slice(5,7))-1]?.toUpperCase()+' LA',
    bride:details.bride,groom:details.groom,date:details.date.join('')};
}
function loadSheet(group,index){
  const key=group+'-'+index;
  if(!sheets.has(key)){
    const img=new Image();
    img.src='./'+key+'.webp';
    sheets.set(key,img.decode().then(()=>img));
    if(sheets.size>4)sheets.delete(sheets.keys().next().value);
  }
  return sheets.get(key);
}
const seek=frame=>seekPlate(video,frame,{signal:mediaController.signal});
function metrics(text,spacing){
  const chars=Array.from(text),widths=chars.map(ch=>ctx.measureText(ch).width);
  const bounds=ctx.measureText(text);
  return {chars,widths,width:widths.reduce((a,b)=>a+b,0)+spacing*(chars.length-1),
    ascent:bounds.actualBoundingBoxAscent,descent:bounds.actualBoundingBoxDescent};
}
function drawReplacement(group,frame,track,box){
  const start=track.start+(track.frames[0]?0:1);
  const settle=settled[group];
  const base=frame<settle?track.frames[settle-track.start]:box;
  const [left,top,right,bottom]=base;
  ctx.save();
  ctx.font='600 100px Oonjal';
  ctx.textBaseline='alphabetic';
  const spacing=group==='date'?2:4;
  const sample=metrics(reference[group],spacing),value=metrics(words[group],spacing);
  const scaleX=(right-left+1)/sample.width;
  const fit=Math.min(1,648/(value.width*scaleX));
  const width=value.width*scaleX*fit;
  const atExit=group==='month'&&frame>=144||group==='bride'&&frame>=344;
  let center=(left+right+1)/2;
  if(!atExit)center=Math.max(32+width/2,Math.min(688-width/2,center));
  const scaleY=(bottom-top+1)/(sample.ascent+sample.descent);
  const baseline=top+sample.ascent*scaleY;
  const alpha=Math.min(1,box[4]/(group==='date'?184:177));
  ctx.globalAlpha=alpha;
  ctx.fillStyle=ink[group];
  ctx.translate(center-width/2,baseline);
  ctx.scale(scaleX*fit,scaleY*fit);
  const progress=frame-start;
  const spread=group==='month'?11:group==='date'?12:7;
  const rise=group==='date'?36:56;
  let x=0;
  for(let i=0;i<value.chars.length;i++){
    let delay=spread*i/Math.max(1,value.chars.length-1);
    if(group==='date')delay=i<words.date.indexOf(' ')?0:i<words.date.lastIndexOf(' ')?7:12;
    const reveal=Math.min(1,Math.max(0,(progress-delay+0.65)/7));
    if(reveal){
      ctx.save();
      ctx.beginPath();
      ctx.rect(-24,-value.ascent-6,value.width+48,value.ascent+value.descent+12);
      ctx.clip();
      ctx.globalAlpha*=Math.min(1,reveal*3);
      ctx.fillText(value.chars[i],x,rise*(1-reveal)**2);
      ctx.restore();
    }
    x+=value.widths[i]+spacing;
  }
  ctx.restore();
}
async function render(index,{live=false}={}){
  const frame=Math.max(0,Math.min(827,index));
  if(!live)await seek(frame);
  const sourceFrame=Math.min(frame,826);
  for(const [group,track] of Object.entries(tracks)){
    const box=track.frames[sourceFrame-track.start];
    if(!box)continue;
    if(words[group]===reference[group]){
      const index=Math.floor(sourceFrame/16),cell=sourceFrame%16;
      const sheet=await loadSheet(group,index);
      if(live&&cell>=10&&track.frames[(index+1)*16-track.start])
        loadSheet(group,index+1).catch(()=>{});
      ctx.clearRect(0,0,720,1280);
      ctx.drawImage(sheet,(cell%2)*720,Math.floor(cell/2)*track.height,720,track.height,0,track.top,720,track.height);
    }else{
      ctx.clearRect(0,0,720,1280);
      drawReplacement(group,sourceFrame,track,box);
    }
    return rules;
  }
  ctx.clearRect(0,0,720,1280);
  return rules;
}
window.fmiFilmReady=Promise.resolve({
  kind:'canvas',video,canvas,
  async init(input,photos,offline){
    const ext=video.canPlayType('video/mp4; codecs="avc1.64001f"')?'mp4':'webm';
    const url='./'+(offline?'plate-r2':'preview-r2')+'.'+ext;
    if(offline){
      const response=await fetch(url);
      if(!response.ok)throw Error('The motion plate could not load.');
      blobUrl=URL.createObjectURL(await response.blob());
    }
    const loaded=loadPlate(video,blobUrl||url,{signal:mediaController.signal});
    const [timing]=await Promise.all([fetch('./lettering.json').then(r=>r.json()),document.fonts.load('600 100px Oonjal'),loaded]);
    tracks=timing;
    setContent(input);
    return rules;
  },
  setContent,render,
  async setPlayback(play,frame){
    if(!play){video.pause();return;}
    await seek(Math.max(0,Math.min(827,frame)));
    await video.play();
  },
  validate(){
    const raw={...SAMPLE_FIELDS,...Object.fromEntries(fields.map(key=>[key,content[key]]))};
    const errors=validateFields(raw).errors;
    const key=fields.find(key=>errors[key]);
    if(key)throw Object.assign(Error(errors[key]),{code:'TEXT_FIT',field:key});
  },
  snapshot(format='image/png'){
    output.drawImage(video,0,0,720,1280);
    output.drawImage(canvas,0,0);
    return composite.toDataURL(format,.97).split(',')[1];
  },
  destroy(){
    mediaController.abort();
    video.pause();video.removeAttribute('src');video.load();
    if(blobUrl)URL.revokeObjectURL(blobUrl);
    sheets.clear();
  }
});
